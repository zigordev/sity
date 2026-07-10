import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

declare global {
  interface Window {
    __SITY_DEBUG__: {
      getSiteLayout: () => {
        unit: "meter";
        mainBoundaryAreaM2: number;
        mainBoundarySideM: number;
        mainlandWestMarginM: number;
        mainlandEastMarginM: number;
        mainlandNorthSouthMarginM: number;
        secondaryIslandAreaM2: number;
        secondaryIslandSideM: number;
        seaGapM: number;
      };
      getCompassBearingDegrees: () => number;
      getPerformance: () => { drawCalls: number; triangles: number };
    };
  }
}

const canvas = document.querySelector<HTMLCanvasElement>("#scene");
const compassNeedle = document.querySelector<HTMLElement>("#compass-needle");

if (!canvas) {
  throw new Error("Canvas element #scene was not found.");
}

const urlParams = new URLSearchParams(window.location.search);

const MAIN_BOUNDARY_AREA_M2 = 3_000_000;
const MAIN_BOUNDARY_SIDE_M = Math.sqrt(MAIN_BOUNDARY_AREA_M2);
const SECONDARY_ISLAND_AREA_M2 = 1_000_000;
const SECONDARY_ISLAND_SIDE_M = Math.sqrt(SECONDARY_ISLAND_AREA_M2);
const SEA_GAP_M = 400;
const NORTH_SAMPLE_DISTANCE_M = 1_000;
const SEA_Y = 0;
const MAINLAND_Y = 1;
const GRASS_SURFACE_Y = 2;
const SEA_MARGIN_M = 30_000;
const MAINLAND_WEST_MARGIN_M = 10_000;
const MAINLAND_EAST_MARGIN_M = 0;
const MAINLAND_NORTH_SOUTH_MARGIN_M = 10_000;

const mainBoundaryCenterX = 0;
const mainBoundaryCenterZ = 0;
const mainBoundaryMinX = mainBoundaryCenterX - MAIN_BOUNDARY_SIDE_M / 2;
const mainBoundaryMaxX = mainBoundaryCenterX + MAIN_BOUNDARY_SIDE_M / 2;
const mainBoundaryMinZ = mainBoundaryCenterZ - MAIN_BOUNDARY_SIDE_M / 2;
const mainBoundaryMaxZ = mainBoundaryCenterZ + MAIN_BOUNDARY_SIDE_M / 2;

const mainlandMinX = mainBoundaryMinX - MAINLAND_WEST_MARGIN_M;
const mainlandMaxX = mainBoundaryMaxX + MAINLAND_EAST_MARGIN_M;
const mainlandMinZ = mainBoundaryMinZ - MAINLAND_NORTH_SOUTH_MARGIN_M;
const mainlandMaxZ = mainBoundaryMaxZ + MAINLAND_NORTH_SOUTH_MARGIN_M;
const mainlandWidth = mainlandMaxX - mainlandMinX;
const mainlandDepth = mainlandMaxZ - mainlandMinZ;
const mainlandCenterX = (mainlandMinX + mainlandMaxX) / 2;
const mainlandCenterZ = (mainlandMinZ + mainlandMaxZ) / 2;

const secondaryIslandCenterX =
  mainlandMaxX + SEA_GAP_M + SECONDARY_ISLAND_SIDE_M / 2;
const secondaryIslandCenterZ = 0;

const secondaryIslandMinX = secondaryIslandCenterX - SECONDARY_ISLAND_SIDE_M / 2;
const secondaryIslandMaxX = secondaryIslandCenterX + SECONDARY_ISLAND_SIDE_M / 2;
const secondaryIslandMinZ = secondaryIslandCenterZ - SECONDARY_ISLAND_SIDE_M / 2;
const secondaryIslandMaxZ = secondaryIslandCenterZ + SECONDARY_ISLAND_SIDE_M / 2;

const minWorldX = Math.min(mainlandMinX, secondaryIslandMinX);
const maxWorldX = Math.max(mainlandMaxX, secondaryIslandMaxX);
const minWorldZ = Math.min(mainlandMinZ, secondaryIslandMinZ);
const maxWorldZ = Math.max(mainlandMaxZ, secondaryIslandMaxZ);

const seaCenter = new THREE.Vector3(
  (minWorldX + maxWorldX) / 2,
  0,
  (minWorldZ + maxWorldZ) / 2,
);
const viewTarget = new THREE.Vector3(
  (mainBoundaryCenterX + secondaryIslandCenterX) / 2,
  0,
  0,
);
const worldNorth = new THREE.Vector3(NORTH_SAMPLE_DISTANCE_M, 0, 0);
const compassOriginWorld = new THREE.Vector3();
const compassNorthWorld = new THREE.Vector3();
const compassOriginScreen = new THREE.Vector3();
const compassNorthScreen = new THREE.Vector3();
let compassBearingDegrees = 0;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  preserveDrawingBuffer: urlParams.has("verify"),
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb8d7e6);
scene.fog = new THREE.Fog(0xb8d7e6, 9_500, 18_500);

const camera = new THREE.PerspectiveCamera(
  48,
  window.innerWidth / window.innerHeight,
  10,
  20_000,
);
camera.position.set(viewTarget.x - 400, 3_150, 4_300);
camera.lookAt(viewTarget);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 650;
controls.maxDistance = 7_500;
controls.maxPolarAngle = Math.PI * 0.48;
controls.target.copy(viewTarget);

const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x8dbb86, 2.1);
scene.add(hemisphereLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.8);
sunLight.position.set(-1_600, 2_800, 1_800);
scene.add(sunLight);

const seaMaterial = new THREE.MeshStandardMaterial({
  color: 0x2e96c4,
  roughness: 0.58,
  metalness: 0.02,
  depthWrite: false,
});
const mainlandMaterial = new THREE.MeshStandardMaterial({
  color: 0x9da19b,
  roughness: 0.86,
  metalness: 0,
});
const grassMaterial = new THREE.MeshStandardMaterial({
  color: 0x93c97b,
  roughness: 0.82,
  metalness: 0,
});

function addFlatPlane(
  name: string,
  width: number,
  depth: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  renderOrder: number,
) {
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  plane.name = name;
  plane.renderOrder = renderOrder;
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(x, y, z);
  scene.add(plane);
}

addFlatPlane(
  "surrounding-sea",
  maxWorldX - minWorldX + SEA_MARGIN_M * 2,
  maxWorldZ - minWorldZ + SEA_MARGIN_M * 2,
  seaMaterial,
  seaCenter.x,
  SEA_Y,
  seaCenter.z,
  0,
);
addFlatPlane(
  "mainland-outside-boundary",
  mainlandWidth,
  mainlandDepth,
  mainlandMaterial,
  mainlandCenterX,
  MAINLAND_Y,
  mainlandCenterZ,
  1,
);
addFlatPlane(
  "main-3-square-kilometer-grass-boundary",
  MAIN_BOUNDARY_SIDE_M,
  MAIN_BOUNDARY_SIDE_M,
  grassMaterial,
  mainBoundaryCenterX,
  GRASS_SURFACE_Y,
  mainBoundaryCenterZ,
  2,
);
addFlatPlane(
  "secondary-1-square-kilometer-grass-island",
  SECONDARY_ISLAND_SIDE_M,
  SECONDARY_ISLAND_SIDE_M,
  grassMaterial,
  secondaryIslandCenterX,
  GRASS_SURFACE_Y,
  secondaryIslandCenterZ,
  2,
);

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", handleResize);

window.__SITY_DEBUG__ = {
  getSiteLayout: () => ({
    unit: "meter",
    mainBoundaryAreaM2: MAIN_BOUNDARY_AREA_M2,
    mainBoundarySideM: MAIN_BOUNDARY_SIDE_M,
    mainlandWestMarginM: MAINLAND_WEST_MARGIN_M,
    mainlandEastMarginM: MAINLAND_EAST_MARGIN_M,
    mainlandNorthSouthMarginM: MAINLAND_NORTH_SOUTH_MARGIN_M,
    secondaryIslandAreaM2: SECONDARY_ISLAND_AREA_M2,
    secondaryIslandSideM: SECONDARY_ISLAND_SIDE_M,
    seaGapM: SEA_GAP_M,
  }),
  getCompassBearingDegrees: () => compassBearingDegrees,
  getPerformance: () => ({
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
  }),
};

function updateCompass() {
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

function animate() {
  controls.update();
  updateCompass();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
