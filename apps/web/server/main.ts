import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  logServiceStarted,
  logServiceStopping,
  observeProcessFailures,
} from '../src/observability/standard-events';
import { buildServer } from './app';

observeProcessFailures();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT ?? 8080);
const host = process.env.HOST ?? '0.0.0.0';

const app = await buildServer({ root });

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    logServiceStopping(signal);
    void app.close().then(() => process.exit(0));
  });
}

await app.listen({ port, host });
logServiceStarted({ port: String(port) });
