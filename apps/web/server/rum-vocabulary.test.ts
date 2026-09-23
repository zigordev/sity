import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { test } from 'vitest';

import { registry } from '../src/observability/metrics.registry';
import { pageLabel } from '../src/observability/rum-metrics';
import { buildServer } from './app';

test('the rejection reasons are exported at zero as soon as the metric module loads', async () => {
  const text = await registry.getSingleMetricAsString('rum_rejected_total');

  for (const reason of [
    'rate_limited',
    'malformed',
    'unknown_type',
    'bad_name',
    'unrecordable',
    'batch_too_large',
    'cross_origin',
    'csp_malformed',
    'csp_rate_limited',
  ]) {
    assert.match(text, new RegExp(`rum_rejected_total\\{reason="${reason}"\\} 0`), reason);
  }
});

test('nothing constrains the page label before the server is built', () => {
  assert.equal(pageLabel('/somewhere-else'), '/somewhere-else');
});

test('building the server declares the vocabulary, before any beacon is sent', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'sity-rum-vocabulary-'));
  writeFileSync(path.join(root, 'index.html'), '<!doctype html><title>Sity</title>');

  const app = await buildServer({ root, logger: false });
  await app.ready();

  try {
    const text = await registry.getSingleMetricAsString('rum_interactions_total');
    assert.match(
      text,
      /rum_interactions_total\{interaction_type="Click",page="\/",release="[^"]*"\} 0/
    );
    assert.match(
      text,
      /rum_interactions_total\{interaction_type="Form Submit",page="\/",release="[^"]*"\} 0/
    );
    assert.equal(pageLabel('/'), '/');
    assert.equal(pageLabel('/somewhere-else'), 'other');
  } finally {
    await app.close();
  }
});
