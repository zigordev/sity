import { expect, test } from '@playwright/test';

test.use({ launchOptions: { args: ['--disable-3d-apis'] } });

test('a visitor whose browser cannot draw the scene is still reported', async ({
  page,
  request,
}) => {
  const pageErrors = async () =>
    (await (await request.get('/metrics')).text())
      .split('\n')
      .filter((line) => line.startsWith('rum_errors_total{') && line.includes('page="/"'))
      .reduce((sum, line) => sum + Number(line.split(' ').pop()), 0);
  const before = await pageErrors();

  await page.goto('/');
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  await expect.poll(pageErrors, { timeout: 15_000 }).toBeGreaterThan(before);
});
