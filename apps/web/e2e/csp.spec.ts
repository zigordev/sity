import { expect, test, type Page } from '@playwright/test';
import type {} from '../src/debug';

type Violation = { directive: string; blocked: string };

async function recordViolations(page: Page) {
  await page.addInitScript(() => {
    const seen: { directive: string; blocked: string }[] = [];
    Object.assign(window, { __violations: seen });
    document.addEventListener('securitypolicyviolation', (event) => {
      seen.push({ directive: event.effectiveDirective, blocked: event.blockedURI });
    });
  });
}

const violations = (page: Page) =>
  page.evaluate(() => (window as unknown as { __violations: Violation[] }).__violations);

async function openScene(page: Page) {
  await page.goto('/?verify', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.__SITY_DEBUG__), undefined, { timeout: 120_000 });
  await page.waitForFunction(
    async () => {
      if (!window.__SITY_ASSETS_READY__) return false;
      await window.__SITY_ASSETS_READY__;
      return window.__SITY_DEBUG__.getNaturalFeatures().assets.loadComplete;
    },
    undefined,
    { timeout: 120_000 }
  );
}

test('the scene loads its models, textures and decoders within its own policy', async ({
  page,
}) => {
  await recordViolations(page);
  await openScene(page);
  expect(await violations(page)).toEqual([]);
});

test('an inline script the page did not vouch for is still reported', async ({ page }) => {
  await recordViolations(page);
  await openScene(page);
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = 'window.__injected = true;';
    document.body.append(script);
  });
  await expect
    .poll(() => violations(page))
    .toContainEqual({ directive: 'script-src-elem', blocked: 'inline' });
});

test('the page reports its load to RUM', async ({ page, request }) => {
  await openScene(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect
    .poll(async () => (await request.get('/metrics')).text(), { timeout: 15_000 })
    .toMatch(/^rum_performance_seconds_count\{[^}]*page="\/"[^}]*\} [1-9]/m);
});
