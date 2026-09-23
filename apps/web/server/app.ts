import path from 'node:path';

import fastifyCompress from '@fastify/compress';
import fastifyStatic from '@fastify/static';
import Fastify, { LogController, type FastifyInstance } from 'fastify';

import { fastifyLoggerOptions, registerHttpMetrics } from '../src/observability/fastify';
import { registerRumRoutes } from '../src/observability/fastify-rum';
import { setSourceMapRoot } from '../src/observability/rum-details';
import { registerRumVocabulary } from '../src/observability/rum-metrics';
import { logRequestFailed } from '../src/observability/standard-events';
import { CONTENT_SECURITY_POLICY } from './csp';
import { health } from './health';

const THIRTY_DAYS = 'public, max-age=2592000';
const NO_FALLBACK = ['/assets/', '/rum/'];
const RUM_PAGES = ['/'];

export interface ServerOptions {
  readonly root: string;
  readonly logger?: boolean;
}

export async function buildServer({
  root,
  logger = true,
}: ServerOptions): Promise<FastifyInstance> {
  registerRumVocabulary({ pages: RUM_PAGES });

  const app = Fastify({
    logger: logger ? fastifyLoggerOptions : false,
    logController: new LogController({ disableRequestLogging: true }),
  });
  const index = path.join(root, 'index.html');
  const assets = `${path.join(root, 'assets')}${path.sep}`;
  setSourceMapRoot(assets);

  app.addHook('onSend', async (_request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  });

  app.setErrorHandler((error: Error & { statusCode?: number }, request, reply) => {
    const status =
      error.statusCode !== undefined && error.statusCode < 500 ? error.statusCode : 500;
    if (status === 500) {
      logRequestFailed({
        method: request.method,
        route: request.routeOptions?.url ?? 'unmatched',
        status,
        error,
      });
    }
    return reply.code(status).send();
  });

  registerHttpMetrics(app);
  registerRumRoutes(app);
  app.get('/health', async () => health());

  await app.register(fastifyCompress, { encodings: ['br', 'gzip'] });
  await app.register(fastifyStatic, {
    root,
    cacheControl: false,
    setHeaders: (reply, filePath) => {
      if (filePath === index) {
        reply.header('Cache-Control', 'no-cache');
        reply.header('Content-Security-Policy-Report-Only', CONTENT_SECURITY_POLICY);
      } else if (filePath.startsWith(assets) || filePath.endsWith('.gltf')) {
        reply.header('Cache-Control', THIRTY_DAYS);
      }
    },
  });

  app.setNotFoundHandler((request, reply) => {
    const page = request.method === 'GET' || request.method === 'HEAD';
    if (page && !NO_FALLBACK.some((prefix) => request.url.startsWith(prefix))) {
      return reply.sendFile('index.html');
    }
    return reply.code(404).send();
  });

  return app;
}
