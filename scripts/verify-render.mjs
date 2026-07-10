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

for (const run of runs) {
  const page = await browser.newPage({
    viewport: { width: run.width, height: run.height },
  });
  await page.goto(run.url, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas");
  await page.waitForSelector("#compass-needle");
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

  console.log(
    JSON.stringify({
      run: run.name,
      canvasCheck,
      compassCheck,
      movedCompassCheck,
      siteLayout: await page.evaluate(() => window.__SITY_DEBUG__.getSiteLayout()),
      performance: await page.evaluate(() => window.__SITY_DEBUG__.getPerformance()),
    }),
  );

  await page.close();
}

await browser.close();
