import { describe, expect, it } from 'vitest';

import { CONTENT_SECURITY_POLICY } from './csp';

const directive = (name: string) =>
  CONTENT_SECURITY_POLICY.split('; ').find((entry) => entry.startsWith(`${name} `));

describe('the content security policy', () => {
  it('lets the scene compile its WebAssembly decoders and nothing else that evaluates code', () => {
    expect(directive('script-src')).toBe("script-src 'self' 'wasm-unsafe-eval'");
  });

  it('lets the loaders read the geometry and decoders the bundle embeds as data: URIs', () => {
    expect(directive('connect-src')).toBe("connect-src 'self' data:");
  });

  it('is reported to the server that serves the page', () => {
    expect(directive('report-uri')).toBe('report-uri /rum/csp');
  });
});
