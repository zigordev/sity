import { chromium } from "playwright";

const baseUrl = process.env.SITY_VERIFY_BASE_URL ?? "http://localhost:5173";

const runs = [
  { name: "mainland-desktop", width: 1440, height: 900, url: `${baseUrl}/?verify` },
  { name: "mainland-mobile", width: 390, height: 844, url: `${baseUrl}/?verify` },
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

async function readAxisScale(page) {
  return page.evaluate(() => {
    const axisScale = document.querySelector(".axis-scale");
    const axisX = document.querySelector("#scale-axis-x");
    const axisY = document.querySelector("#scale-axis-y");
    const axisZ = document.querySelector("#scale-axis-z");
    const measureX = document.querySelector("#scale-measure-x");
    const measureY = document.querySelector("#scale-measure-y");
    const measureZ = document.querySelector("#scale-measure-z");

    if (
      !(axisScale instanceof HTMLElement) ||
      !(axisX instanceof HTMLElement) ||
      !(axisY instanceof HTMLElement) ||
      !(axisZ instanceof HTMLElement) ||
      !(measureX instanceof HTMLElement) ||
      !(measureY instanceof HTMLElement) ||
      !(measureZ instanceof HTMLElement)
    ) {
      throw new Error("Axis scale UI was not found.");
    }

    return {
      visible: getComputedStyle(axisScale).display !== "none",
      labels: {
        x: measureX.textContent,
        y: measureY.textContent,
        z: measureZ.textContent,
      },
      rotations: {
        x: axisX.style.getPropertyValue("--axis-rotation"),
        y: axisY.style.getPropertyValue("--axis-rotation"),
        z: axisZ.style.getPropertyValue("--axis-rotation"),
      },
      debug: window.__SITY_DEBUG__.getAxisScale(),
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
  await page.waitForSelector("#scale-axis-x");
  await page.waitForSelector("#scale-axis-y");
  await page.waitForSelector("#scale-axis-z");
  await page.waitForSelector("#toggle-natural");
  await page.waitForSelector("#toggle-artificial");
  await page.waitForSelector("#toggle-help");
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
  const axisScaleCheck = await readAxisScale(page);

  if (!Number.isFinite(compassCheck.bearingDegrees)) {
    throw new Error(`Compass bearing is invalid: ${JSON.stringify(compassCheck)}.`);
  }

  if (
    !axisScaleCheck.visible ||
    axisScaleCheck.debug.unit !== "meter" ||
    axisScaleCheck.debug.xMeasureM < 1_700 ||
    axisScaleCheck.debug.yMeasureM < 850 ||
    axisScaleCheck.debug.zMeasureM < 1_700 ||
    !axisScaleCheck.labels.x ||
    !axisScaleCheck.labels.y ||
    !axisScaleCheck.labels.z ||
    !axisScaleCheck.rotations.x ||
    !axisScaleCheck.rotations.y ||
    !axisScaleCheck.rotations.z
  ) {
    throw new Error(`Axis scale is invalid: ${JSON.stringify(axisScaleCheck)}.`);
  }

  await page.mouse.move(run.width * 0.5, run.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(run.width * 0.68, run.height * 0.5, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(300);

  const movedCompassCheck = await readCompass(page);
  const movedAxisScaleCheck = await readAxisScale(page);
  const compassMoved =
    Math.abs(movedCompassCheck.bearingDegrees - compassCheck.bearingDegrees) > 0.1;
  const axisScaleMoved = ["x", "y", "z"].some(
    (axis) =>
      Math.abs(
        movedAxisScaleCheck.debug.axisAnglesDegrees[axis] -
          axisScaleCheck.debug.axisAnglesDegrees[axis],
      ) > 0.1,
  );

  if (!compassMoved) {
    throw new Error(
      `Compass did not react to camera movement: ${JSON.stringify({
        before: compassCheck,
        after: movedCompassCheck,
      })}.`,
    );
  }

  if (!axisScaleMoved) {
    throw new Error(
      `Axis scale did not react to camera movement: ${JSON.stringify({
        before: axisScaleCheck,
        after: movedAxisScaleCheck,
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
    naturalFeatures.snowMountain.radiusXM < 1_200 ||
    naturalFeatures.snowMountain.radiusZM < 1_100 ||
    !naturalFeatures.snowMountain.clippedToMainBoundary ||
    !naturalFeatures.snowMountain.centerOutsideMainBoundary ||
    naturalFeatures.snowMountain.estimatedVisiblePortion <= 0.12 ||
    naturalFeatures.snowMountain.estimatedVisiblePortion >= 0.3 ||
    !naturalFeatures.snowMountain.solidCutFaces ||
    naturalFeatures.snowMountain.foothillBlendHeightM < 120 ||
    !naturalFeatures.snowMountain.higherThanReservoirMountain ||
    !naturalFeatures.snowMountain.separateFromReservoirMountain ||
    !naturalFeatures.snowMountain.hasSnowCap ||
    naturalFeatures.snowMountain.snowLineM >= naturalFeatures.snowMountain.maxHeightM
  ) {
    throw new Error(
      `Expected a higher snow-capped mountain clipped to roughly a southwest visible quadrant: ${JSON.stringify(
        naturalFeatures,
      )}.`,
    );
  }

  if (
    !naturalFeatures.coast.hasVolumetricTerrain ||
    naturalFeatures.coast.terrainSlabThicknessM < 1.5 ||
    !naturalFeatures.coast.mainlandCoastSimple ||
    !naturalFeatures.coast.parallelCoastEdges ||
    !naturalFeatures.coast.hasIntegratedRiverBeach ||
    !naturalFeatures.coast.hasWetSandBand ||
    !naturalFeatures.coast.beachBoundedByNorthRiverBank ||
    !naturalFeatures.coast.hasVolumetricBeach ||
    !naturalFeatures.coast.hasRaisedWaterfrontStructures ||
    !naturalFeatures.coast.hasPierSupportPiles ||
    naturalFeatures.coast.pierSupportPileCount < 20 ||
    !naturalFeatures.coast.hasCargoPortEquipment ||
    naturalFeatures.coast.cargoContainerCount !== 12 ||
    naturalFeatures.coast.cargoCraneCount !== 2 ||
    naturalFeatures.coast.wetSandWidthM < 20 ||
    !naturalFeatures.coast.beachOppositePier ||
    !naturalFeatures.coast.hasLongWoodenAttractionPier ||
    naturalFeatures.coast.attractionPierLengthM < 400 ||
    naturalFeatures.coast.pierDeckThicknessM < 4 ||
    !naturalFeatures.coast.hasConcreteShipPort ||
    naturalFeatures.coast.cargoPortHeightM < 6 ||
    naturalFeatures.coast.cargoShipBerthCount !== 2 ||
    naturalFeatures.coast.cargoShipCenterOffsetFromPortEdgeM -
      naturalFeatures.coast.cargoShipHullLengthM * 0.5 <
      naturalFeatures.coast.cargoBerthDockLengthM + naturalFeatures.coast.cargoShipWaterGapM ||
    naturalFeatures.coast.cargoShipWaterGapM < 20 ||
    !naturalFeatures.coast.hasPrivateMarina ||
    naturalFeatures.coast.privateBerthCount !== 4
  ) {
    throw new Error(
      `Expected volumetric terrain, river-integrated beach, supported pier/marina, separate cargo port, and 3D port equipment: ${JSON.stringify(
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

  if (
    !naturalFeatures.river.hasCarvedChannel ||
    naturalFeatures.river.channelBankWidthM < 35 ||
    naturalFeatures.river.channelReliefM < 1.5
  ) {
    throw new Error(
      `Expected river to sit in a visible natural 3D channel: ${JSON.stringify(
        naturalFeatures,
      )}.`,
    );
  }

  if (!naturalFeatures.estuary.hasSlopedBanks || !naturalFeatures.estuary.banksTaperIntoSea) {
    throw new Error(
      `Expected estuary banks to slope and taper into the sea: ${JSON.stringify(
        naturalFeatures,
      )}.`,
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
  if (
    !initialCategoryVisibility.natural ||
    !initialCategoryVisibility.artificial ||
    !initialCategoryVisibility.help
  ) {
    throw new Error(
      `Expected all categories visible initially: ${JSON.stringify(initialCategoryVisibility)}.`,
    );
  }

  await page.locator("#toggle-natural").uncheck();
  const hiddenNaturalVisibility = await readCategoryVisibility(page);
  if (
    hiddenNaturalVisibility.natural ||
    !hiddenNaturalVisibility.artificial ||
    !hiddenNaturalVisibility.help
  ) {
    throw new Error(
      `Expected natural category hidden only: ${JSON.stringify(hiddenNaturalVisibility)}.`,
    );
  }

  await page.locator("#toggle-artificial").uncheck();
  const hiddenSceneVisibility = await readCategoryVisibility(page);
  if (
    hiddenSceneVisibility.natural ||
    hiddenSceneVisibility.artificial ||
    !hiddenSceneVisibility.help
  ) {
    throw new Error(`Expected scene categories hidden with help still visible: ${JSON.stringify(hiddenSceneVisibility)}.`);
  }

  await page.locator("#toggle-help").uncheck();
  const hiddenHelpVisibility = await readCategoryVisibility(page);
  const hiddenHelpCompassCheck = await readCompass(page);
  const hiddenHelpAxisScaleCheck = await readAxisScale(page);

  if (
    hiddenHelpVisibility.natural ||
    hiddenHelpVisibility.artificial ||
    hiddenHelpVisibility.help ||
    hiddenHelpCompassCheck.visible ||
    hiddenHelpAxisScaleCheck.visible
  ) {
    throw new Error(
      `Expected help category hidden without restoring scene categories: ${JSON.stringify({
        hiddenHelpVisibility,
        hiddenHelpCompassCheck,
        hiddenHelpAxisScaleCheck,
      })}.`,
    );
  }

  await page.locator("#toggle-natural").check();
  await page.locator("#toggle-artificial").check();
  await page.locator("#toggle-help").check();
  const restoredCategoryVisibility = await readCategoryVisibility(page);
  const restoredHelpCompassCheck = await readCompass(page);
  const restoredHelpAxisScaleCheck = await readAxisScale(page);
  if (
    !restoredCategoryVisibility.natural ||
    !restoredCategoryVisibility.artificial ||
    !restoredCategoryVisibility.help ||
    !restoredHelpCompassCheck.visible ||
    !restoredHelpAxisScaleCheck.visible
  ) {
    throw new Error(
      `Expected categories restored: ${JSON.stringify({
        restoredCategoryVisibility,
        restoredHelpCompassCheck,
        restoredHelpAxisScaleCheck,
      })}.`,
    );
  }

  console.log(
    JSON.stringify({
      run: run.name,
      canvasCheck,
      compassCheck,
      movedCompassCheck,
      axisScaleCheck,
      movedAxisScaleCheck,
      siteLayout,
      naturalFeatures,
      categoryVisibility: restoredCategoryVisibility,
      performance: await page.evaluate(() => window.__SITY_DEBUG__.getPerformance()),
    }),
  );

  await page.close();
}

await browser.close();
