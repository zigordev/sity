import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import type {} from '../src/debug';

const DESKTOP_VIEWS = ['overview', 'downtown', 'interchange', 'street'];
const MOBILE_VIEWS = ['overview', 'downtown'];

async function openScene(page: Page) {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      pageErrors.push(message.text());
    }
  });
  await page.goto('/?verify', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.__SITY_DEBUG__), undefined, { timeout: 120_000 });
  await page.waitForFunction(
    async () => {
      if (!window.__SITY_ASSETS_READY__) {
        return false;
      }
      await window.__SITY_ASSETS_READY__;
      return window.__SITY_DEBUG__.getNaturalFeatures().assets.loadComplete;
    },
    undefined,
    { timeout: 120_000 }
  );
  await settleFrames(page, 6);
  return pageErrors;
}

async function settleFrames(page: Page, frames: number) {
  await page.evaluate(
    (count) =>
      new Promise<void>((resolve) => {
        let done = 0;
        const step = () => {
          done += 1;
          if (done >= count) {
            resolve();
          } else {
            requestAnimationFrame(step);
          }
        };
        requestAnimationFrame(step);
      }),
    frames
  );
}

async function sampleCanvas(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element was not found.');
    }
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) {
      throw new Error('WebGL context was not available.');
    }
    const colors = new Set<string>();
    let visible = 0;
    let total = 0;
    for (const xFactor of [0.15, 0.3, 0.45, 0.6, 0.75, 0.9]) {
      for (const yFactor of [0.2, 0.4, 0.6, 0.8]) {
        const pixel = new Uint8Array(4);
        gl.readPixels(Math.floor(canvas.width * xFactor), Math.floor(canvas.height * yFactor), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        total += 1;
        if (pixel[0] + pixel[1] + pixel[2] > 24) {
          visible += 1;
        }
        colors.add(`${pixel[0] >> 4}:${pixel[1] >> 4}:${pixel[2] >> 4}`);
      }
    }
    return { uniqueColors: colors.size, visible, total };
  });
}

test.describe('scene', () => {
  test('loads its assets in the documented frame', async ({ page }) => {
    const errors = await openScene(page);
    const layout = await page.evaluate(() => window.__SITY_DEBUG__.getSiteLayout());
    expect(layout.unit).toBe('meter');
    expect(layout.mainBoundaryWidthM).toBeCloseTo(2_232, 0);
    expect(layout.mainBoundaryDepthM).toBeCloseTo(3_132, 0);
    expect(layout.mainBoundaryAreaM2).toBeGreaterThan(6_900_000);
    expect(layout.northDirection).toEqual({ x: 0, z: -1 });
    expect(layout.seaSide).toBe('east');

    const natural = await page.evaluate(() => window.__SITY_DEBUG__.getNaturalFeatures());
    expect(natural.assets.loadComplete).toBe(true);
    expect(natural.assets.failures).toEqual([]);
    expect(natural.assets.importedModelInstances).toBeGreaterThanOrEqual(6);
    expect(natural.assets.textureFamilies).toBeGreaterThanOrEqual(9);
    expect(natural.river.mouth.x).toBeGreaterThan(natural.river.source.x);
    expect(natural.water.sharedSurfaceCount).toBeGreaterThanOrEqual(5);
    expect(errors).toEqual([]);
  });

  test('exposes a closed lane graph that routes across the city', async ({ page }) => {
    await openScene(page);
    const graph = await page.evaluate(() => window.__SITY_DEBUG__.getRoadGraph());
    expect(graph.stats.roadCount).toBeGreaterThanOrEqual(140);
    expect(graph.stats.laneCount).toBeGreaterThanOrEqual(950);
    expect(graph.stats.junctionCount).toBeGreaterThanOrEqual(80);
    expect(graph.stats.roundaboutCount).toBeGreaterThanOrEqual(5);
    expect(graph.stats.laneCountByKind.ramp).toBeGreaterThanOrEqual(16);
    expect(graph.stats.sourceLaneCount).toBeGreaterThanOrEqual(10);
    expect(graph.stats.sinkLaneCount).toBeGreaterThanOrEqual(10);
    expect(graph.invariants.everyLaneHasPoints).toBe(true);
    expect(graph.invariants.noNaNCoordinates).toBe(true);
    expect(graph.invariants.connectorsTouchNeighbours).toBe(true);
    expect(graph.invariants.everyLinkIsBidirectional).toBe(true);
    expect(graph.invariants.strandedLaneIds).toEqual([]);
    const junctions = await page.evaluate(() => window.__SITY_DEBUG__.listDeadEnds());
    expect(junctions.filter((end) => !end.destination && !end.edge)).toEqual([]);

    const exported = await page.evaluate(() => window.__SITY_DEBUG__.exportRoadGraph());
    expect(exported.lanes).toHaveLength(graph.stats.laneCount);
    const ringLane = exported.lanes.find((lane) => lane.roadId === 'ring-highway' && lane.direction === 'forward' && lane.laneIndex === 0);
    const mainLane = exported.lanes.find((lane) => lane.roadId === 'main-street-1' && lane.direction === 'forward' && lane.laneIndex === 0);
    expect(ringLane).toBeDefined();
    expect(mainLane).toBeDefined();

    const route = await page.evaluate(([from, to]) => window.__SITY_DEBUG__.findRoute(from, to), [ringLane!.id, mainLane!.id]);
    expect(route).toBeDefined();
    expect(route!.laneIds.length).toBeGreaterThan(2);
    expect(route!.lengthM).toBeGreaterThan(200);
    const reverse = await page.evaluate(([from, to]) => window.__SITY_DEBUG__.findRoute(from, to), [mainLane!.id, ringLane!.id]);
    expect(reverse).toBeDefined();
    expect(reverse!.laneIds.length).toBeGreaterThan(2);
    const random = await page.evaluate(() => window.__SITY_DEBUG__.showRandomRoute(11));
    expect(random?.lengthM ?? 0).toBeGreaterThanOrEqual(900);
  });

  test('builds the city within its performance budget', async ({ page }) => {
    await openScene(page);
    const city = await page.evaluate(() => window.__SITY_DEBUG__.getCity());
    expect(city.lotCount).toBeGreaterThanOrEqual(180);
    expect(city.buildingCount).toBeGreaterThanOrEqual(250);
    expect(city.treeCount).toBeGreaterThanOrEqual(2000);

    const audit = await page.evaluate(() => window.__SITY_DEBUG__.auditCity());
    expect(audit.footprintCount).toBeGreaterThanOrEqual(200);
    expect(audit.overlappingPairs).toEqual([]);
    expect(audit.buildingsOnPavement).toEqual([]);

    const visibility = await page.evaluate(() => window.__SITY_DEBUG__.getCategoryVisibility());
    expect(visibility).toMatchObject({ natural: true, roads: true, buildings: true, vegetation: true, help: true });

    const performance = await page.evaluate(() => window.__SITY_DEBUG__.getPerformance());
    expect(performance.drawCalls).toBeGreaterThan(0);
    expect(performance.drawCalls).toBeLessThanOrEqual(480);
    expect(performance.triangles).toBeGreaterThan(0);
    expect(performance.triangles).toBeLessThanOrEqual(2_500_000);
    expect(performance.postprocessingPassCount).toBe(4);
    expect(performance.usesComposer).toBe(true);
  });

  test('renders every camera view and moves the compass', async ({ page }, testInfo) => {
    test.setTimeout(900_000);
    await openScene(page);
    const views = await page.evaluate(() => window.__SITY_DEBUG__.listViews());
    expect(views.length).toBeGreaterThanOrEqual(10);
    const compassBefore = await page.evaluate(() => window.__SITY_DEBUG__.getCompassBearingDegrees());
    expect(Number.isFinite(compassBefore)).toBe(true);

    const viewIds = testInfo.project.name === 'mobile' ? MOBILE_VIEWS : DESKTOP_VIEWS;
    for (const viewId of viewIds) {
      const moved = await page.evaluate((id) => window.__SITY_DEBUG__.flyTo(id), viewId);
      expect(moved).toBe(true);
      await settleFrames(page, 4);
      const sample = await sampleCanvas(page);
      expect(sample.visible, `view "${viewId}" rendered blank`).toBeGreaterThanOrEqual(sample.total * 0.9);
      expect(sample.uniqueColors, `view "${viewId}" rendered flat`).toBeGreaterThanOrEqual(6);
      await page.screenshot({ path: testInfo.outputPath(`${viewId}.png`) });
    }

    const compassAfter = await page.evaluate(() => window.__SITY_DEBUG__.getCompassBearingDegrees());
    expect(Number.isFinite(compassAfter)).toBe(true);
    expect(Math.abs(compassAfter - compassBefore)).toBeGreaterThan(0.01);
  });

  test('panel passes WCAG A and AA', async ({ page }) => {
    await openScene(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('canvas')
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
