import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { buildServer } from './app';

let app: FastifyInstance;

beforeAll(async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'sity-dist-'));
  mkdirSync(path.join(root, 'assets', 'sity'), { recursive: true });
  writeFileSync(path.join(root, 'index.html'), '<!doctype html><title>Sity</title>');
  writeFileSync(
    path.join(root, 'assets', 'index-Bx12aZ.js'),
    `export const a = '${'x'.repeat(4096)}';`
  );
  writeFileSync(path.join(root, 'assets', 'sity', 'city.gltf'), '{"asset":{"version":"2.0"}}');
  app = await buildServer({ root, logger: false });
  app.get('/boom', async () => {
    throw new Error('boom');
  });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the page', () => {
  it('carries its policy, the security headers, and is revalidated on every visit', async () => {
    const response = await app.inject({ method: 'GET', url: '/' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.headers['content-security-policy-report-only']).toContain(
      'report-uri /rum/csp'
    );
    expect(response.headers['cache-control']).toBe('no-cache');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
  });

  it('is served for any other path, as nginx served it', async () => {
    const response = await app.inject({ method: 'GET', url: '/somewhere/else?view=street' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('<title>Sity</title>');
    expect(response.headers['content-security-policy-report-only']).toBeDefined();
  });

  it('is never served in place of a missing asset or an unknown RUM path', async () => {
    expect((await app.inject({ method: 'GET', url: '/assets/missing.js' })).statusCode).toBe(404);
    expect((await app.inject({ method: 'GET', url: '/rum/events' })).statusCode).toBe(404);
  });
});

describe('assets', () => {
  it('are cached for thirty days', async () => {
    const response = await app.inject({ method: 'GET', url: '/assets/index-Bx12aZ.js' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toBe('public, max-age=2592000');
    expect(response.headers['content-security-policy-report-only']).toBeUndefined();
  });

  it('name a glTF model by its type', async () => {
    const response = await app.inject({ method: 'GET', url: '/assets/sity/city.gltf' });

    expect(response.headers['content-type']).toContain('model/gltf+json');
    expect(response.headers['cache-control']).toBe('public, max-age=2592000');
  });

  it('are compressed for a browser that accepts it', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/assets/index-Bx12aZ.js',
      headers: { 'accept-encoding': 'br, gzip' },
    });

    expect(response.headers['content-encoding']).toBe('br');
  });
});

describe('probes', () => {
  it('health names the service and has no components to wait for', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok', service: 'sity-web', components: {} });
  });

  it('metrics count requests by route and carry the health status', async () => {
    await app.inject({ method: 'GET', url: '/health' });

    const response = await app.inject({ method: 'GET', url: '/metrics' });

    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.body).toMatch(
      /http_requests_total\{method="GET",route="\/health",status="200"\}/
    );
    expect(response.body).toContain('service_health_status 2');
  });
});

describe('RUM', () => {
  it('takes a batch from its own origin', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/rum/events',
      headers: {
        origin: 'http://localhost:3031',
        host: 'localhost:3031',
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ events: [] }),
    });

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
  });

  it('refuses a body over the cap without reading it', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/rum/events',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ events: [], padding: 'x'.repeat(70 * 1024) }),
    });

    expect(response.statusCode).toBe(413);
    expect(response.body).toBe('');
  });

  it('records a CSP report in the format report-uri sends', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/rum/csp',
      headers: { 'content-type': 'application/csp-report' },
      payload: JSON.stringify({
        'csp-report': {
          'document-uri': 'http://localhost:3031/',
          'effective-directive': 'script-src-elem',
          'blocked-uri': 'inline',
        },
      }),
    });

    expect(response.statusCode).toBe(204);
  });
});

describe('a failure', () => {
  it('is logged as request.failed and tells the caller nothing', async () => {
    const lines: Record<string, unknown>[] = [];
    const capture = (chunk: string | Uint8Array) => {
      lines.push(JSON.parse(String(chunk)) as Record<string, unknown>);
      return true;
    };
    vi.spyOn(process.stdout, 'write').mockImplementation(capture as never);
    vi.spyOn(process.stderr, 'write').mockImplementation(capture as never);

    const response = await app.inject({ method: 'GET', url: '/boom' });

    expect(response.statusCode).toBe(500);
    expect(response.body).toBe('');
    expect(lines).toContainEqual(
      expect.objectContaining({
        event: 'request.failed',
        method: 'GET',
        route: '/boom',
        status: 500,
        error: { name: 'Error', message: 'boom' },
      })
    );
  });
});
