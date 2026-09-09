import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const baseUrl = process.env.SITY_VERIFY_BASE_URL ?? "http://localhost:5173";
const outDir = process.env.SITY_VERIFY_OUT_DIR ?? "verify-output";
const softwareGl = process.env.SITY_VERIFY_SOFTWARE_GL !== "0";

const runs = [
  { name: "desktop", width: 1440, height: 900, views: ["overview", "downtown", "interchange", "street"] },
  { name: "mobile", width: 390, height: 844, views: ["overview", "downtown"] },
];

mkdirSync(outDir, { recursive: true });

function assert(condition, message, detail) {
  if (!condition) {
    throw new Error(`${message}${detail === undefined ? "" : `: ${JSON.stringify(detail)}`}`);
  }
}

async function waitForScene(page) {
  await page.waitForSelector("canvas");
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
    { timeout: 120_000 },
  );
}

async function settleFrames(page, frames = 5) {
  await page.evaluate(
    (count) =>
      new Promise((resolve) => {
        let done = 0;
        const step = () => {
          done += 1;
          if (done >= count) {
            resolve(undefined);
          } else {
            requestAnimationFrame(step);
          }
        };
        requestAnimationFrame(step);
      }),
    frames,
  );
}

async function sampleCanvas(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) {
      throw new Error("WebGL context was not available.");
    }
    const colors = new Set();
    let visible = 0;
    let black = 0;
    let total = 0;
    for (const xFactor of [0.15, 0.3, 0.45, 0.6, 0.75, 0.9]) {
      for (const yFactor of [0.2, 0.4, 0.6, 0.8]) {
        const pixel = new Uint8Array(4);
        gl.readPixels(Math.floor(canvas.width * xFactor), Math.floor(canvas.height * yFactor), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        total += 1;
        const sum = pixel[0] + pixel[1] + pixel[2];
        if (sum > 24) {
          visible += 1;
        } else {
          black += 1;
        }
        colors.add(`${pixel[0] >> 4}:${pixel[1] >> 4}:${pixel[2] >> 4}`);
      }
    }
    return { uniqueColors: colors.size, visible, black, total };
  });
}

const browser = await chromium.launch({
  args: softwareGl ? ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : [],
});

try {
  for (const run of runs) {
    const page = await browser.newPage({ viewport: { width: run.width, height: run.height } });
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") {
        pageErrors.push(message.text());
      }
    });
    await page.goto(`${baseUrl}/?verify`, { waitUntil: "networkidle" });
    await waitForScene(page);
    await settleFrames(page, 6);

    const layout = await page.evaluate(() => window.__SITY_DEBUG__.getSiteLayout());
    assert(layout.unit === "meter" && layout.mainBoundaryAreaM2 === 3_000_000, "Unexpected site layout", layout);
    assert(layout.northDirection.z === -1 && layout.seaSide === "east", "Compass frame must be north = -Z with the sea to the east", layout);

    const natural = await page.evaluate(() => window.__SITY_DEBUG__.getNaturalFeatures());
    assert(natural.assets.loadComplete && natural.assets.failures.length === 0, "Asset pack failed to load", natural.assets);
    assert(natural.assets.importedModelInstances >= 6 && natural.assets.textureFamilies >= 9, "Imported assets missing", natural.assets);
    assert(natural.river.mouth.x > natural.river.source.x, "River must flow toward the eastern sea", natural.river);
    assert(natural.water.sharedSurfaceCount >= 5, "Expected the shared water shader on every water body", natural.water);

    const graph = await page.evaluate(() => window.__SITY_DEBUG__.getRoadGraph());
    assert(graph.stats.roadCount >= 90, "Road network too small", graph.stats);
    assert(graph.stats.laneCount >= 600, "Lane graph too small", graph.stats);
    assert(graph.stats.roundaboutCount >= 3 && graph.stats.junctionCount >= 50, "Junction inventory incomplete", graph.stats);
    assert(graph.stats.laneCountByKind.ramp >= 8, "Interchange ramps missing", graph.stats);
    assert(graph.invariants.everyLaneHasPoints && graph.invariants.noNaNCoordinates, "Lane geometry invalid", graph.invariants);
    assert(graph.invariants.connectorsTouchNeighbours && graph.invariants.everyLinkIsBidirectional, "Lane links inconsistent", graph.invariants);
    assert(graph.invariants.strandedLaneIds.length === 0, "Stranded lanes found", graph.invariants.strandedLaneIds);

    const exported = await page.evaluate(() => window.__SITY_DEBUG__.exportRoadGraph());
    assert(Array.isArray(exported.lanes) && exported.lanes.length === graph.stats.laneCount, "Exported graph size mismatch");
    const ringLane = exported.lanes.find((lane) => lane.roadId === "ring-highway" && lane.direction === "forward" && lane.laneIndex === 0);
    const mainLane = exported.lanes.find((lane) => lane.roadId === "main-street-1" && lane.direction === "forward" && lane.laneIndex === 0);
    assert(ringLane && mainLane, "Expected ring highway and Main Street lanes", { ringLane: Boolean(ringLane), mainLane: Boolean(mainLane) });
    const route = await page.evaluate(([from, to]) => window.__SITY_DEBUG__.findRoute(from, to), [ringLane.id, mainLane.id]);
    assert(route && route.laneIds.length > 2 && route.lengthM > 200, "Route search failed between highway and Main Street", route);
    const reverse = await page.evaluate(([from, to]) => window.__SITY_DEBUG__.findRoute(from, to), [mainLane.id, ringLane.id]);
    assert(reverse && reverse.laneIds.length > 2, "Reverse route search failed", reverse);
    const randomRoute = await page.evaluate(() => window.__SITY_DEBUG__.showRandomRoute(11));
    assert(randomRoute && randomRoute.lengthM >= 900, "Random route demo failed", randomRoute);

    const city = await page.evaluate(() => window.__SITY_DEBUG__.getCity());
    assert(city.buildingCount >= 250 && city.lotCount >= 180, "City is underbuilt", city);
    assert(city.treeCount >= 2000, "Vegetation is too sparse", city);

    const visibility = await page.evaluate(() => window.__SITY_DEBUG__.getCategoryVisibility());
    assert(visibility.natural && visibility.roads && visibility.buildings && visibility.vegetation && visibility.help, "Default layers hidden", visibility);

    const compassBefore = await page.evaluate(() => window.__SITY_DEBUG__.getCompassBearingDegrees());
    assert(Number.isFinite(compassBefore), "Compass bearing invalid", compassBefore);
    const views = await page.evaluate(() => window.__SITY_DEBUG__.listViews());
    assert(views.length >= 10, "Camera views missing", views);

    const performance = await page.evaluate(() => window.__SITY_DEBUG__.getPerformance());
    assert(performance.drawCalls > 0 && performance.drawCalls <= 420, "Draw call budget exceeded", performance);
    assert(performance.triangles > 0 && performance.triangles <= 2_500_000, "Triangle budget exceeded", performance);
    assert(performance.postprocessingPassCount === 4 && performance.usesComposer, "Postprocessing chain changed", performance);

    for (const viewId of run.views) {
      await page.evaluate((id) => window.__SITY_DEBUG__.flyTo(id), viewId);
      await settleFrames(page, 6);
      const sample = await sampleCanvas(page);
      assert(sample.visible >= sample.total * 0.9 && sample.uniqueColors >= 6, `View "${viewId}" rendered blank`, sample);
      await page.screenshot({ path: `${outDir}/${run.name}-${viewId}.png` });
    }

    const compassAfter = await page.evaluate(() => window.__SITY_DEBUG__.getCompassBearingDegrees());
    assert(Number.isFinite(compassAfter), "Compass bearing invalid after flying", compassAfter);
    if (run.views[run.views.length - 1] !== "overview") {
      assert(Math.abs(compassAfter - compassBefore) > 0.01, "Compass did not follow the camera", { compassBefore, compassAfter });
    }

    assert(pageErrors.length === 0, "Page reported errors", pageErrors);
    console.log(
      JSON.stringify({
        run: run.name,
        graph: graph.stats,
        city: { lots: city.lotCount, buildings: city.buildingCount, trees: city.treeCount },
        performance,
        route: { lanes: route.laneIds.length, lengthM: Math.round(route.lengthM) },
      }),
    );
    await page.close();
  }
} finally {
  await browser.close();
}
