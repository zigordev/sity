import * as THREE from "three";
import { NORTH_SAMPLE_DISTANCE_M, SCALE_AXIS_SAMPLE_M, SCALE_X_MEASURE_M, SCALE_Y_MEASURE_M, SCALE_Z_MEASURE_M } from "../config/constants";
import { artificialElements, camera, controls, naturalElements } from "../render/context";

export const compass = document.querySelector<HTMLElement>(".compass");

export const compassNeedle = document.querySelector<HTMLElement>("#compass-needle");

export const axisScale = document.querySelector<HTMLElement>(".axis-scale");

export const scaleAxisX = document.querySelector<HTMLElement>("#scale-axis-x");

export const scaleAxisY = document.querySelector<HTMLElement>("#scale-axis-y");

export const scaleAxisZ = document.querySelector<HTMLElement>("#scale-axis-z");

export const scaleMeasureX = document.querySelector<HTMLElement>("#scale-measure-x");

export const scaleMeasureY = document.querySelector<HTMLElement>("#scale-measure-y");

export const scaleMeasureZ = document.querySelector<HTMLElement>("#scale-measure-z");





export const worldNorth = new THREE.Vector3(0, 0, -NORTH_SAMPLE_DISTANCE_M);

export const compassOriginWorld = new THREE.Vector3();

export const compassNorthWorld = new THREE.Vector3();

export const compassOriginScreen = new THREE.Vector3();

export const compassNorthScreen = new THREE.Vector3();

export let compassBearingDegrees = 0;

export const scaleAxisElements = {
  x: scaleAxisX,
  y: scaleAxisY,
  z: scaleAxisZ,
};

export const scaleMeasureElements = {
  x: scaleMeasureX,
  y: scaleMeasureY,
  z: scaleMeasureZ,
};

export const scaleAxisDefinitions = [
  { key: "x", vector: new THREE.Vector3(SCALE_AXIS_SAMPLE_M, 0, 0) },
  { key: "y", vector: new THREE.Vector3(0, SCALE_AXIS_SAMPLE_M, 0) },
  { key: "z", vector: new THREE.Vector3(0, 0, SCALE_AXIS_SAMPLE_M) },
] as const;

export const scaleOriginWorld = new THREE.Vector3();

export const scaleAxisWorld = new THREE.Vector3();

export const scaleOriginScreen = new THREE.Vector3();

export const scaleAxisScreen = new THREE.Vector3();

export let scaleAxisAnglesDegrees = { x: 0, y: 0, z: 0 };

export function updateCategoryVisibility() {
  document.addEventListener("sity:layers", (event) => {
    const detail = (event as CustomEvent<{ natural: boolean; artificial: boolean }>).detail;
    naturalElements.visible = detail.natural;
    artificialElements.visible = detail.artificial;
  });
}

export function formatScaleMeasure(measureM: number) {
  if (measureM >= 1_000) {
    return `${(measureM / 1_000).toFixed(2)} km`;
  }

  return `${Math.round(measureM)} m`;
}

export function updateScaleMeasureLabels() {
  const labels = {
    x: formatScaleMeasure(SCALE_X_MEASURE_M),
    y: formatScaleMeasure(SCALE_Y_MEASURE_M),
    z: formatScaleMeasure(SCALE_Z_MEASURE_M),
  };

  for (const axis of scaleAxisDefinitions) {
    const label = scaleMeasureElements[axis.key];
    if (label) {
      label.textContent = labels[axis.key];
    }
  }
}



updateScaleMeasureLabels();

export function updateCompass() {
  if (!compassNeedle) {
    return;
  }

  compassOriginWorld.copy(controls.target);
  compassNorthWorld.copy(controls.target).add(worldNorth);
  compassOriginScreen.copy(compassOriginWorld).project(camera);
  compassNorthScreen.copy(compassNorthWorld).project(camera);

  const screenX = compassNorthScreen.x - compassOriginScreen.x;
  const screenY = compassNorthScreen.y - compassOriginScreen.y;

  if (Math.abs(screenX) + Math.abs(screenY) < 0.0001) {
    return;
  }

  const bearingRadians = Math.atan2(screenX, screenY);
  compassBearingDegrees = THREE.MathUtils.radToDeg(bearingRadians);
  compassNeedle.style.transform = `rotate(${bearingRadians}rad)`;
}

export function updateAxisScale() {
  if (!axisScale) {
    return;
  }

  scaleOriginWorld.copy(controls.target);
  scaleOriginScreen.copy(scaleOriginWorld).project(camera);

  for (const axis of scaleAxisDefinitions) {
    const element = scaleAxisElements[axis.key];
    if (!element) {
      continue;
    }

    scaleAxisWorld.copy(controls.target).add(axis.vector);
    scaleAxisScreen.copy(scaleAxisWorld).project(camera);

    const screenX = scaleAxisScreen.x - scaleOriginScreen.x;
    const screenY = scaleAxisScreen.y - scaleOriginScreen.y;
    const projectedLength = Math.hypot(screenX, screenY);

    if (projectedLength < 0.0001) {
      element.style.setProperty("--axis-opacity", "0.28");
      continue;
    }

    const angleRadians = Math.atan2(-screenY, screenX);
    const cssLength = THREE.MathUtils.clamp(24 + projectedLength * 48, 24, 32);
    const opacity = THREE.MathUtils.clamp(0.42 + projectedLength * 3, 0.45, 1);

    scaleAxisAnglesDegrees[axis.key] = THREE.MathUtils.radToDeg(angleRadians);
    element.style.setProperty("--axis-rotation", `${angleRadians}rad`);
    element.style.setProperty("--axis-length", `${cssLength}px`);
    element.style.setProperty("--axis-opacity", `${opacity}`);
  }
}
