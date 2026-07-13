import { chromium } from "playwright";

const runs = [
  { name: "mainland-island-desktop", width: 1440, height: 900, url: "http://localhost:5173/?verify" },
  { name: "mainland-island-mobile", width: 390, height: 844, url: "http://localhost:5173/?verify" },
];

const browser = await chromium.launch();

async function readCompass(page) {
  return page.evaluate(() => {
    const compass = document.querySelector(".compass");
    const needle = document.querySelector("#compass-needle");

    if (!(compass instanceof HTMLElement) || !(needle instanceof HTMLElement)) {
      throw new Error("Compass UI was not found.");
    }

    return {
      visible: getComputedStyle(compass).display !== "none",
      transform: needle.style.transform,
      bearingDegrees: window.__SITY_DEBUG__.getCompassBearingDegrees(),
    };
  });
}

async function readCategoryVisibility(page) {
  return page.evaluate(() => window.__SITY_DEBUG__.getCategoryVisibility());
}

for (const run of runs) {
  const page = await browser.newPage({
    viewport: { width: run.width, height: run.height },
  });
  await page.goto(run.url, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas");
  await page.waitForSelector("#compass-needle");
  await page.waitForSelector("#toggle-natural");
  await page.waitForSelector("#toggle-artificial");
  await page.waitForFunction(() => Boolean(window.__SITY_DEBUG__));
  await page.waitForTimeout(900);

  const canvasCheck = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("Canvas element was not found.");
    }

    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) {
      throw new Error("WebGL context was not available.");
    }

    const samples = [];
    for (const xFactor of [0.2, 0.4, 0.6, 0.8]) {
      for (const yFactor of [0.25, 0.45, 0.65, 0.82]) {
        const pixel = new Uint8Array(4);
        gl.readPixels(
          Math.floor(canvas.width * xFactor),
          Math.floor(canvas.height * yFactor),
          1,
          1,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixel,
        );
        samples.push(Array.from(pixel));
      }
    }

    const unique = new Set(samples.map((pixel) => pixel.join(",")));
    const visibleSamples = samples.filter(
      (pixel) => pixel[3] > 0 && pixel[0] + pixel[1] + pixel[2] > 20,
    );

    return {
      width: canvas.width,
      height: canvas.height,
      uniqueColors: unique.size,
      visibleSamples: visibleSamples.length,
    };
  });
  const compassCheck = await readCompass(page);

  if (!Number.isFinite(compassCheck.bearingDegrees)) {
    throw new Error(`Compass bearing is invalid: ${JSON.stringify(compassCheck)}.`);
  }

  await page.mouse.move(run.width * 0.5, run.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(run.width * 0.68, run.height * 0.5, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(300);

  const movedCompassCheck = await readCompass(page);
  const compassMoved =
    Math.abs(movedCompassCheck.bearingDegrees - compassCheck.bearingDegrees) > 0.1;

  if (!compassMoved) {
    throw new Error(
      `Compass did not react to camera movement: ${JSON.stringify({
        before: compassCheck,
        after: movedCompassCheck,
      })}.`,
    );
  }
  const naturalFeatures = await page.evaluate(() => window.__SITY_DEBUG__.getNaturalFeatures());

  if (!naturalFeatures.mountain.clippedToMainBoundary) {
    throw new Error(`Expected clipped mountain feature: ${JSON.stringify(naturalFeatures)}.`);
  }

  if (
    naturalFeatures.mountain.foothillBlendHeightM <= 0 ||
    naturalFeatures.mountain.surfaceLiftM <= 0
  ) {
    throw new Error(
      `Expected lifted foothill blend to avoid mountain/grass z-fighting: ${JSON.stringify(
        naturalFeatures,
      )}.`,
    );
  }

  if (
    naturalFeatures.snowMountain.corner !== "southwest" ||
    naturalFeatures.snowMountain.maxHeightM < 850 ||
    naturalFeatures.snowMountain.radiusXM < 640 ||
    naturalFeatures.snowMountain.radiusZM < 590 ||
    !naturalFeatures.snowMountain.clippedToMainBoundary ||
    naturalFeatures.snowMountain.foothillBlendHeightM < 120 ||
    !naturalFeatures.snowMountain.higherThanReservoirMountain ||
    !naturalFeatures.snowMountain.separateFromReservoirMountain ||
    !naturalFeatures.snowMountain.hasSnowCap ||
    naturalFeatures.snowMountain.snowLineM >= naturalFeatures.snowMountain.maxHeightM
  ) {
    throw new Error(
      `Expected a higher snow-capped mountain in the southwest corner: ${JSON.stringify(
        naturalFeatures,
      )}.`,
    );
  }

  if (naturalFeatures.river.mouth.x <= naturalFeatures.river.source.x) {
    throw new Error(`Expected river to flow toward the sea: ${JSON.stringify(naturalFeatures)}.`);
  }

  const siteLayout = await page.evaluate(() => window.__SITY_DEBUG__.getSiteLayout());
  const coastlineX = siteLayout.mainBoundarySideM / 2;

  if (Math.abs(naturalFeatures.river.mouth.x - coastlineX) > 0.001) {
    throw new Error(`Expected river mouth to meet coastline exactly: ${JSON.stringify({
      coastlineX,
      naturalFeatures,
    })}.`);
  }

  if (
    naturalFeatures.estuary.start.x >= coastlineX ||
    naturalFeatures.estuary.extendsPastCoastlineM <= 0
  ) {
    throw new Error(
      `Expected estuary to blend from inland river into the sea: ${JSON.stringify({
        coastlineX,
        naturalFeatures,
      })}.`,
    );
  }

  if (naturalFeatures.reservoir.radiusXM < naturalFeatures.river.widthM) {
    throw new Error(`Expected reservoir to be wider than the river: ${JSON.stringify(naturalFeatures)}.`);
  }

  if (
    naturalFeatures.river.sourceWidthM <= 0 ||
    naturalFeatures.river.sourceWidthM >= naturalFeatures.river.widthM
  ) {
    throw new Error(
      `Expected river to start as a narrower dam outlet channel: ${JSON.stringify(naturalFeatures)}.`,
    );
  }

  if (!naturalFeatures.reservoir.enclosedByNaturalBank) {
    throw new Error(
      `Expected reservoir water to be enclosed by natural terrain: ${JSON.stringify(naturalFeatures)}.`,
    );
  }

  if (!naturalFeatures.reservoir.clippedAtDam) {
    throw new Error(
      `Expected reservoir water boundary to be clipped by the upstream dam face: ${JSON.stringify(
        naturalFeatures,
      )}.`,
    );
  }

  if (naturalFeatures.reservoir.damOpeningWidthM <= naturalFeatures.dam.lengthM) {
    throw new Error(
      `Expected natural reservoir bank to leave an opening around the dam: ${JSON.stringify(
        naturalFeatures,
      )}.`,
    );
  }

  if (naturalFeatures.dam.heightM <= 0 || naturalFeatures.dam.lengthM <= 0) {
    throw new Error(`Expected proportional dam dimensions: ${JSON.stringify(naturalFeatures)}.`);
  }

  if (!naturalFeatures.dam.curved) {
    throw new Error(`Expected curved dam to match reservoir opening: ${JSON.stringify(naturalFeatures)}.`);
  }

  if (!naturalFeatures.dam.abuttedByNaturalTerrain) {
    throw new Error(
      `Expected natural terrain abutments at both dam ends: ${JSON.stringify(naturalFeatures)}.`,
    );
  }

  const damThicknessDirection = {
    x: naturalFeatures.dam.downstreamEdge.x - naturalFeatures.dam.upstreamEdge.x,
    z: naturalFeatures.dam.downstreamEdge.z - naturalFeatures.dam.upstreamEdge.z,
  };

  if (Math.hypot(damThicknessDirection.x, damThicknessDirection.z) <= 0) {
    throw new Error(`Expected dam upstream and downstream faces to be distinct: ${JSON.stringify(naturalFeatures)}.`);
  }

  const damFaceToRiverStart = Math.hypot(
    naturalFeatures.river.source.x - naturalFeatures.dam.downstreamEdge.x,
    naturalFeatures.river.source.z - naturalFeatures.dam.downstreamEdge.z,
  );

  if (damFaceToRiverStart > 0.001 || naturalFeatures.river.source.x <= naturalFeatures.dam.center.x) {
    throw new Error(
      `Expected river to start exactly at the downstream dam face: ${JSON.stringify(naturalFeatures)}.`,
    );
  }

  const initialCategoryVisibility = await readCategoryVisibility(page);
  if (!initialCategoryVisibility.natural || !initialCategoryVisibility.artificial) {
    throw new Error(
      `Expected both categories visible initially: ${JSON.stringify(initialCategoryVisibility)}.`,
    );
  }

  await page.locator("#toggle-natural").uncheck();
  const hiddenNaturalVisibility = await readCategoryVisibility(page);
  if (hiddenNaturalVisibility.natural || !hiddenNaturalVisibility.artificial) {
    throw new Error(
      `Expected natural category hidden only: ${JSON.stringify(hiddenNaturalVisibility)}.`,
    );
  }

  await page.locator("#toggle-artificial").uncheck();
  const hiddenAllVisibility = await readCategoryVisibility(page);
  if (hiddenAllVisibility.natural || hiddenAllVisibility.artificial) {
    throw new Error(`Expected both categories hidden: ${JSON.stringify(hiddenAllVisibility)}.`);
  }

  await page.locator("#toggle-natural").check();
  await page.locator("#toggle-artificial").check();
  const restoredCategoryVisibility = await readCategoryVisibility(page);
  if (!restoredCategoryVisibility.natural || !restoredCategoryVisibility.artificial) {
    throw new Error(
      `Expected categories restored: ${JSON.stringify(restoredCategoryVisibility)}.`,
    );
  }

  console.log(
    JSON.stringify({
      run: run.name,
      canvasCheck,
      compassCheck,
      movedCompassCheck,
      siteLayout,
      naturalFeatures,
      categoryVisibility: restoredCategoryVisibility,
      performance: await page.evaluate(() => window.__SITY_DEBUG__.getPerformance()),
    }),
  );

  await page.close();
}

await browser.close();
