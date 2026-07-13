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
      };
      getNaturalFeatures: () => {
        mountain: {
          corner: string;
          maxHeightM: number;
          clippedToMainBoundary: boolean;
          foothillBlendHeightM: number;
          surfaceLiftM: number;
        };
        snowMountain: {
          center: { x: number; z: number };
          corner: string;
          maxHeightM: number;
          radiusXM: number;
          radiusZM: number;
          clippedToMainBoundary: boolean;
          centerOutsideMainBoundary: boolean;
          estimatedVisiblePortion: number;
          solidCutFaces: boolean;
          foothillBlendHeightM: number;
          higherThanReservoirMountain: boolean;
          separateFromReservoirMountain: boolean;
          hasSnowCap: boolean;
          snowLineM: number;
        };
        river: {
          source: { x: number; z: number };
          mouth: { x: number; z: number };
          sourceWidthM: number;
          widthM: number;
          hasCarvedChannel: boolean;
          channelBankWidthM: number;
          channelReliefM: number;
        };
        estuary: {
          start: { x: number; z: number };
          end: { x: number; z: number };
          extendsPastCoastlineM: number;
          hasSlopedBanks: boolean;
          banksTaperIntoSea: boolean;
        };
        reservoir: {
          center: { x: number; z: number };
          radiusXM: number;
          radiusZM: number;
          enclosedByNaturalBank: boolean;
          damOpeningWidthM: number;
          clippedAtDam: boolean;
        };
        dam: {
          center: { x: number; z: number };
          upstreamEdge: { x: number; z: number };
          downstreamEdge: { x: number; z: number };
          lengthM: number;
          heightM: number;
          curved: boolean;
          abuttedByNaturalTerrain: boolean;
        };
        coast: {
          hasVolumetricTerrain: boolean;
          terrainSlabThicknessM: number;
          mainlandCoastSimple: boolean;
          parallelCoastEdges: boolean;
          hasIntegratedRiverBeach: boolean;
          hasWetSandBand: boolean;
          beachBoundedByNorthRiverBank: boolean;
          hasVolumetricBeach: boolean;
          hasRaisedWaterfrontStructures: boolean;
          hasPierSupportPiles: boolean;
          pierSupportPileCount: number;
          hasCargoPortEquipment: boolean;
          cargoContainerCount: number;
          cargoCraneCount: number;
          wetSandWidthM: number;
          beachOppositePier: boolean;
          hasLongWoodenAttractionPier: boolean;
          attractionPierLengthM: number;
          pierDeckThicknessM: number;
          hasConcreteShipPort: boolean;
          cargoPortHeightM: number;
          cargoShipBerthCount: number;
          cargoBerthDockLengthM: number;
          cargoShipHullLengthM: number;
          cargoShipCenterOffsetFromPortEdgeM: number;
          cargoShipWaterGapM: number;
          hasPrivateMarina: boolean;
          privateBerthCount: number;
        };
      };
      getCategoryVisibility: () => {
        natural: boolean;
        artificial: boolean;
        help: boolean;
      };
      getCompassBearingDegrees: () => number;
      getAxisScale: () => {
        unit: "meter";
        visible: boolean;
        xMeasureM: number;
        yMeasureM: number;
        zMeasureM: number;
        axisAnglesDegrees: {
          x: number;
          y: number;
          z: number;
        };
      };
      getPerformance: () => { drawCalls: number; triangles: number };
    };
  }
}

const canvas = document.querySelector<HTMLCanvasElement>("#scene");
const compass = document.querySelector<HTMLElement>(".compass");
const compassNeedle = document.querySelector<HTMLElement>("#compass-needle");
const axisScale = document.querySelector<HTMLElement>(".axis-scale");
const scaleAxisX = document.querySelector<HTMLElement>("#scale-axis-x");
const scaleAxisY = document.querySelector<HTMLElement>("#scale-axis-y");
const scaleAxisZ = document.querySelector<HTMLElement>("#scale-axis-z");
const scaleMeasureX = document.querySelector<HTMLElement>("#scale-measure-x");
const scaleMeasureY = document.querySelector<HTMLElement>("#scale-measure-y");
const scaleMeasureZ = document.querySelector<HTMLElement>("#scale-measure-z");
const naturalToggle = document.querySelector<HTMLInputElement>("#toggle-natural");
const artificialToggle = document.querySelector<HTMLInputElement>("#toggle-artificial");
const helpToggle = document.querySelector<HTMLInputElement>("#toggle-help");

if (!canvas) {
  throw new Error("Canvas element #scene was not found.");
}

const urlParams = new URLSearchParams(window.location.search);

const MAIN_BOUNDARY_AREA_M2 = 3_000_000;
const MAIN_BOUNDARY_SIDE_M = Math.sqrt(MAIN_BOUNDARY_AREA_M2);
const NORTH_SAMPLE_DISTANCE_M = 1_000;
const SCALE_AXIS_SAMPLE_M = 650;
const SEA_Y = 0;
const MAINLAND_Y = 1;
const GRASS_SURFACE_Y = 2;
const SEA_MARGIN_M = 30_000;
const MAINLAND_WEST_MARGIN_M = 10_000;
const MAINLAND_EAST_MARGIN_M = 0;
const MAINLAND_NORTH_SOUTH_MARGIN_M = 10_000;
const MAIN_BOUNDARY_TERRAIN_THICKNESS_M = 2;
const GRASS_COLOR = 0x93c97b;
const MOUNTAIN_LOW_COLOR = 0x6f8d57;
const MOUNTAIN_MID_COLOR = 0x887c68;
const MOUNTAIN_HIGH_COLOR = 0xb0aaa0;
const BEACH_SAND_COLOR = 0xd8c58d;
const WET_SAND_COLOR = 0xb9a978;
const WOOD_PIER_COLOR = 0x8b7355;
const CONCRETE_PORT_COLOR = 0x9a9486;
const DOCK_COLOR = 0x6f6254;
const SHIP_HULL_COLOR = 0x4f6376;
const PRIVATE_BOAT_COLOR = 0xd7f0f6;
const SHIP_CABIN_COLOR = 0xe9e4d4;
const ATTRACTION_RED_COLOR = 0xc44f4f;
const ATTRACTION_BLUE_COLOR = 0x3f7fb0;
const ATTRACTION_YELLOW_COLOR = 0xe5b64f;
const MOUNTAIN_HEIGHT_M = 420;
const MOUNTAIN_RADIUS_X_M = 950;
const MOUNTAIN_RADIUS_Z_M = 880;
const MOUNTAIN_VISIBLE_SPAN_M = 760;
const MOUNTAIN_GRID_SEGMENTS = 48;
const MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M = 42;
const MOUNTAIN_SURFACE_LIFT_M = 0.35;
const MOUNTAIN_MIN_RENDER_HEIGHT_M = 0.18;
const SNOW_COLOR = 0xf4f7f6;
const SNOW_SHADOW_COLOR = 0xcbd8d5;
const SNOW_MOUNTAIN_HEIGHT_M = 864;
const SNOW_MOUNTAIN_RADIUS_X_M = 1_292;
const SNOW_MOUNTAIN_RADIUS_Z_M = 1_190;
const SNOW_MOUNTAIN_VISIBLE_SPAN_M = 1_300;
const SNOW_MOUNTAIN_GRID_SEGMENTS = 72;
const SNOW_MOUNTAIN_SURFACE_LIFT_M = 0.9;
const SNOW_MOUNTAIN_MIN_RENDER_HEIGHT_M = 0.18;
const SNOW_MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M = 128;
const SNOW_MOUNTAIN_SNOWLINE_M = SNOW_MOUNTAIN_HEIGHT_M * 0.68;
const RIVER_SOURCE_WIDTH_M = 42;
const RIVER_SOURCE_TAPER_PROGRESS = 0.16;
const RIVER_WIDTH_M = 90;
const RIVER_MOUTH_WIDTH_M = 126;
const RIVER_LOWLAND_WATER_CLEARANCE_M = 0.82;
const RIVER_CHANNEL_BANK_WIDTH_M = 48;
const RIVER_CHANNEL_CREST_OFFSET_M = 20;
const RIVER_CHANNEL_WATER_EDGE_OVERLAP_M = 1.5;
const RIVER_CHANNEL_CREST_RISE_M = 1.6;
const RIVER_CHANNEL_INNER_DROP_M = 0.35;
const ESTUARY_BANK_WIDTH_M = 38;
const ESTUARY_BANK_CREST_OFFSET_M = 16;
const ESTUARY_BANK_CREST_RISE_M = 1.2;
const ESTUARY_BANK_INNER_DROP_M = 0.24;
const RESERVOIR_RADIUS_X_M = 170;
const RESERVOIR_RADIUS_Z_M = 105;
const RESERVOIR_SEGMENTS = 56;
const RESERVOIR_DAM_OPENING_HALF_ANGLE_RAD = 0.72;
const RESERVOIR_DAM_FACE_SAMPLES = 18;
const RESERVOIR_BANK_SEGMENTS = 72;
const RESERVOIR_BANK_INNER_SCALE = 0.92;
const RESERVOIR_BANK_CREST_SCALE = 1.07;
const RESERVOIR_BANK_OUTER_SCALE = 1.26;
const DAM_LENGTH_M = 180;
const DAM_HEIGHT_M = 46;
const DAM_THICKNESS_M = 24;
const DAM_CURVE_SEGMENTS = 18;
const DAM_CURVE_BOW_M = 10;
const DAM_UPSTREAM_FACE_OFFSET_M = 2;
const DAM_BANK_OPENING_MARGIN_M = 8;
const DAM_BANK_OPENING_HALF_LENGTH_M = DAM_LENGTH_M * 0.5 + DAM_BANK_OPENING_MARGIN_M;
const DAM_ABUTMENT_OUTER_LENGTH_M = 32;
const DAM_ABUTMENT_FLARE_M = 28;
const DAM_ABUTMENT_CREST_RISE_M = 18;
const SEA_COLOR = 0x2e96c4;
const COASTAL_INLET_OVERLAP_M = 92;
const COAST_SURFACE_Y = GRASS_SURFACE_Y + 0.08;
const PLATFORM_SURFACE_Y = GRASS_SURFACE_Y + 0.32;
const BEACH_INLAND_WIDTH_M = 160;
const WET_SAND_WIDTH_M = 30;
const BEACH_THICKNESS_M = 1.3;
const WET_SAND_THICKNESS_M = 0.7;
const ATTRACTION_PIER_LENGTH_M = 420;
const ATTRACTION_PIER_DEPTH_M = 180;
const ATTRACTION_PIER_LAND_OVERLAP_M = 55;
const ATTRACTION_PIER_RIVER_OFFSET_M = 272;
const PIER_DECK_THICKNESS_M = 5;
const ATTRACTION_PIER_SUPPORT_COLUMNS = 5;
const ATTRACTION_PIER_SUPPORT_ROWS = 3;
const CARGO_PORT_LENGTH_M = 330;
const CARGO_PORT_DEPTH_M = 230;
const CARGO_PORT_LAND_OVERLAP_M = 45;
const CARGO_PORT_RIVER_OFFSET_M = 732;
const CARGO_PORT_HEIGHT_M = 8;
const CARGO_SHIP_BERTH_COUNT = 2;
const CARGO_SHIP_HULL_LENGTH_M = 150;
const CARGO_SHIP_WATER_GAP_M = 24;
const CARGO_CONTAINER_COUNT = 12;
const CARGO_CRANE_COUNT = 2;
const CARGO_BOLLARD_COUNT = 8;
const PRIVATE_MARINA_RIVER_OFFSET_M = 477;
const PRIVATE_MARINA_BERTH_COUNT = 4;
const MARINA_DOCK_THICKNESS_M = 2.2;
const CARGO_BERTH_DOCK_LENGTH_M = 80;
const CARGO_BERTH_DOCK_THICKNESS_M = 3;
const CARGO_SHIP_CENTER_OFFSET_FROM_PORT_EDGE_M =
  CARGO_BERTH_DOCK_LENGTH_M + CARGO_SHIP_HULL_LENGTH_M * 0.5 + CARGO_SHIP_WATER_GAP_M;
const PRIVATE_MARINA_SUPPORT_PILE_COUNT = PRIVATE_MARINA_BERTH_COUNT * 2 + 4;
const SCALE_X_MEASURE_M = MAIN_BOUNDARY_SIDE_M;
const SCALE_Y_MEASURE_M = SNOW_MOUNTAIN_HEIGHT_M;
const SCALE_Z_MEASURE_M = MAIN_BOUNDARY_SIDE_M;

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
const mainlandDepth = mainlandMaxZ - mainlandMinZ;
const mainlandCenterZ = (mainlandMinZ + mainlandMaxZ) / 2;

const minWorldX = mainlandMinX;
const maxWorldX = mainlandMaxX;
const minWorldZ = mainlandMinZ;
const maxWorldZ = mainlandMaxZ;

const seaCenter = new THREE.Vector3(
  (minWorldX + maxWorldX) / 2,
  0,
  (minWorldZ + maxWorldZ) / 2,
);
const viewTarget = new THREE.Vector3(mainBoundaryCenterX + 120, 0, 0);
const worldNorth = new THREE.Vector3(NORTH_SAMPLE_DISTANCE_M, 0, 0);
const compassOriginWorld = new THREE.Vector3();
const compassNorthWorld = new THREE.Vector3();
const compassOriginScreen = new THREE.Vector3();
const compassNorthScreen = new THREE.Vector3();
let compassBearingDegrees = 0;
const scaleAxisElements = {
  x: scaleAxisX,
  y: scaleAxisY,
  z: scaleAxisZ,
};
const scaleMeasureElements = {
  x: scaleMeasureX,
  y: scaleMeasureY,
  z: scaleMeasureZ,
};
const scaleAxisDefinitions = [
  { key: "x", vector: new THREE.Vector3(SCALE_AXIS_SAMPLE_M, 0, 0) },
  { key: "y", vector: new THREE.Vector3(0, SCALE_AXIS_SAMPLE_M, 0) },
  { key: "z", vector: new THREE.Vector3(0, 0, SCALE_AXIS_SAMPLE_M) },
] as const;
const scaleOriginWorld = new THREE.Vector3();
const scaleAxisWorld = new THREE.Vector3();
const scaleOriginScreen = new THREE.Vector3();
const scaleAxisScreen = new THREE.Vector3();
let scaleAxisAnglesDegrees = { x: 0, y: 0, z: 0 };

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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb8d7e6);
scene.fog = new THREE.Fog(0xb8d7e6, 9_500, 18_500);

const naturalElements = new THREE.Group();
naturalElements.name = "natural-elements";
scene.add(naturalElements);

const artificialElements = new THREE.Group();
artificialElements.name = "artificial-elements";
scene.add(artificialElements);

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
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.left = -2_800;
sunLight.shadow.camera.right = 2_800;
sunLight.shadow.camera.top = 2_800;
sunLight.shadow.camera.bottom = -2_800;
sunLight.shadow.camera.near = 200;
sunLight.shadow.camera.far = 7_000;
sunLight.shadow.bias = -0.00008;
sunLight.shadow.normalBias = 1.5;
scene.add(sunLight);

const seaMaterial = new THREE.MeshStandardMaterial({
  color: SEA_COLOR,
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
  color: GRASS_COLOR,
  roughness: 0.82,
  metalness: 0,
  side: THREE.DoubleSide,
});
const terrainCutMaterial = new THREE.MeshStandardMaterial({
  color: 0x68705d,
  roughness: 0.92,
  metalness: 0,
  side: THREE.DoubleSide,
});
const beachSandMaterial = new THREE.MeshStandardMaterial({
  color: BEACH_SAND_COLOR,
  roughness: 0.9,
  metalness: 0,
  side: THREE.DoubleSide,
});
const wetSandMaterial = new THREE.MeshStandardMaterial({
  color: WET_SAND_COLOR,
  roughness: 0.84,
  metalness: 0.01,
  side: THREE.DoubleSide,
});
const woodPierMaterial = new THREE.MeshStandardMaterial({
  color: WOOD_PIER_COLOR,
  roughness: 0.86,
  metalness: 0,
  side: THREE.DoubleSide,
});
const concretePortMaterial = new THREE.MeshStandardMaterial({
  color: CONCRETE_PORT_COLOR,
  roughness: 0.82,
  metalness: 0,
  side: THREE.DoubleSide,
});
const dockMaterial = new THREE.MeshStandardMaterial({
  color: DOCK_COLOR,
  roughness: 0.78,
  metalness: 0,
});
const shipHullMaterial = new THREE.MeshStandardMaterial({
  color: SHIP_HULL_COLOR,
  roughness: 0.72,
  metalness: 0.03,
});
const privateBoatMaterial = new THREE.MeshStandardMaterial({
  color: PRIVATE_BOAT_COLOR,
  roughness: 0.6,
  metalness: 0.02,
});
const shipCabinMaterial = new THREE.MeshStandardMaterial({
  color: SHIP_CABIN_COLOR,
  roughness: 0.64,
  metalness: 0,
});
const attractionRedMaterial = new THREE.MeshStandardMaterial({
  color: ATTRACTION_RED_COLOR,
  roughness: 0.58,
  metalness: 0.02,
});
const attractionBlueMaterial = new THREE.MeshStandardMaterial({
  color: ATTRACTION_BLUE_COLOR,
  roughness: 0.58,
  metalness: 0.02,
});
const attractionYellowMaterial = new THREE.MeshStandardMaterial({
  color: ATTRACTION_YELLOW_COLOR,
  roughness: 0.58,
  metalness: 0.02,
});
const cargoContainerMaterials = [
  new THREE.MeshStandardMaterial({ color: 0xa94f3f, roughness: 0.78, metalness: 0.05 }),
  new THREE.MeshStandardMaterial({ color: 0x3f6f93, roughness: 0.78, metalness: 0.05 }),
  new THREE.MeshStandardMaterial({ color: 0xd1a44f, roughness: 0.78, metalness: 0.05 }),
  new THREE.MeshStandardMaterial({ color: 0x6a7a54, roughness: 0.78, metalness: 0.05 }),
];
const portCraneMaterial = new THREE.MeshStandardMaterial({
  color: 0xe0b34f,
  roughness: 0.62,
  metalness: 0.05,
});
const mountainMaterial = new THREE.MeshStandardMaterial({
  roughness: 0.92,
  metalness: 0,
  vertexColors: true,
  side: THREE.DoubleSide,
});
const mountainCutMaterial = new THREE.MeshStandardMaterial({
  color: 0x6f6b61,
  roughness: 0.94,
  metalness: 0,
  side: THREE.DoubleSide,
});
const riverMaterial = new THREE.MeshStandardMaterial({
  color: SEA_COLOR,
  roughness: 0.58,
  metalness: 0.02,
  side: THREE.DoubleSide,
  depthWrite: false,
});
const riverBankMaterial = new THREE.MeshStandardMaterial({
  roughness: 0.9,
  metalness: 0,
  vertexColors: true,
  side: THREE.DoubleSide,
});
const damMaterial = new THREE.MeshStandardMaterial({
  color: 0x8d8f8a,
  roughness: 0.78,
  metalness: 0.02,
});
const terrainGrassColor = new THREE.Color(GRASS_COLOR);
const mountainLowColor = new THREE.Color(MOUNTAIN_LOW_COLOR);
const mountainMidColor = new THREE.Color(MOUNTAIN_MID_COLOR);
const mountainHighColor = new THREE.Color(MOUNTAIN_HIGH_COLOR);
const snowColor = new THREE.Color(SNOW_COLOR);
const snowShadowColor = new THREE.Color(SNOW_SHADOW_COLOR);
const riverBankOuterColor = new THREE.Color(GRASS_COLOR);
const riverBankCrestColor = new THREE.Color(0x7d9c62);
const riverBankWetColor = new THREE.Color(0x67715b);

type GroundPathPoint = {
  x: number;
  z: number;
};

type XZPlacement = {
  x: number;
  z: number;
};

type XYZPlacement = XZPlacement & {
  y: number;
};

const mountainCenter = {
  x: mainBoundaryMinX - 160,
  z: mainBoundaryMaxZ + 160,
};
const mountainVisibleBounds = {
  minX: mainBoundaryMinX,
  maxX: Math.min(mainBoundaryMinX + MOUNTAIN_VISIBLE_SPAN_M, mainBoundaryMaxX),
  minZ: Math.max(mainBoundaryMaxZ - MOUNTAIN_VISIBLE_SPAN_M, mainBoundaryMinZ),
  maxZ: mainBoundaryMaxZ,
};
const snowMountainCenter = {
  x: mainBoundaryMinX - 35,
  z: mainBoundaryMinZ - 35,
};
const snowMountainVisibleBounds = {
  minX: mainBoundaryMinX,
  maxX: Math.min(mainBoundaryMinX + SNOW_MOUNTAIN_VISIBLE_SPAN_M, mainBoundaryMaxX),
  minZ: mainBoundaryMinZ,
  maxZ: Math.min(mainBoundaryMinZ + SNOW_MOUNTAIN_VISIBLE_SPAN_M, mainBoundaryMaxZ),
};
const reservoirCenter = {
  x: mainBoundaryMinX + 300,
  z: mainBoundaryMaxZ - 360,
};
const reservoirOutletDirection = (() => {
  const x = 0.78;
  const z = -0.62;
  const length = Math.hypot(x, z);
  return { x: x / length, z: z / length };
})();
const reservoirOutletScale =
  1 /
  Math.sqrt(
    (reservoirOutletDirection.x / RESERVOIR_RADIUS_X_M) ** 2 +
      (reservoirOutletDirection.z / RESERVOIR_RADIUS_Z_M) ** 2,
  );
const reservoirOutletEdge = {
  x: reservoirCenter.x + reservoirOutletDirection.x * reservoirOutletScale,
  z: reservoirCenter.z + reservoirOutletDirection.z * reservoirOutletScale,
};
const damCenterOutletOffsetM =
  DAM_THICKNESS_M * 0.5 + DAM_UPSTREAM_FACE_OFFSET_M - DAM_CURVE_BOW_M;
const damCenter = {
  x: reservoirOutletEdge.x + reservoirOutletDirection.x * damCenterOutletOffsetM,
  z: reservoirOutletEdge.z + reservoirOutletDirection.z * damCenterOutletOffsetM,
};
const damLongAxis = {
  x: -reservoirOutletDirection.z,
  z: reservoirOutletDirection.x,
};
const damUpstreamEdge = damUpstreamFacePoint(0);
const damDownstreamEdge = damDownstreamFacePoint(0);
const riverSource = {
  x: damDownstreamEdge.x,
  z: damDownstreamEdge.z,
};
const riverControlPath: GroundPathPoint[] = [
  riverSource,
  { x: mainBoundaryMinX + 590, z: mainBoundaryMaxZ - 585 },
  { x: mainBoundaryMinX + 840, z: mainBoundaryMaxZ - 475 },
  { x: mainBoundaryMinX + 1_070, z: mainBoundaryMaxZ - 545 },
  { x: mainBoundaryMinX + 1_315, z: mainBoundaryMaxZ - 405 },
  { x: mainBoundaryMaxX - 210, z: 185 },
  { x: mainBoundaryMaxX - 185, z: 130 },
  { x: mainBoundaryMaxX - 150, z: 96 },
];
const riverPath = sampleGroundPath(riverControlPath, 72);
const riverMouth = {
  x: mainBoundaryMaxX,
  z: 82,
};
const riverEstuaryStart = riverControlPath[riverControlPath.length - 1];
const riverSeaTransitionPath = sampleGroundPath(
  [
    riverEstuaryStart,
    { x: mainBoundaryMaxX - 88, z: 90 },
    riverMouth,
    {
      x: mainBoundaryMaxX + COASTAL_INLET_OVERLAP_M + 170,
      z: riverMouth.z - 8,
    },
  ],
  34,
);
const mainBoundaryCoastlinePoints: GroundPathPoint[] = [
  { x: mainBoundaryMinX, z: mainBoundaryMinZ },
  { x: mainBoundaryMaxX, z: mainBoundaryMinZ },
  { x: mainBoundaryMaxX, z: riverMouth.z - 136 },
  { x: mainBoundaryMaxX - 58, z: riverMouth.z - 130 },
  { x: mainBoundaryMaxX - 142, z: riverMouth.z - 92 },
  { x: riverEstuaryStart.x - 30, z: riverEstuaryStart.z - 70 },
  { x: riverEstuaryStart.x - 26, z: riverEstuaryStart.z + 74 },
  { x: mainBoundaryMaxX - 138, z: riverMouth.z + 108 },
  { x: mainBoundaryMaxX - 54, z: riverMouth.z + 138 },
  { x: mainBoundaryMaxX, z: riverMouth.z + 140 },
  { x: mainBoundaryMaxX, z: mainBoundaryMaxZ },
  { x: mainBoundaryMinX, z: mainBoundaryMaxZ },
];

function sampleGroundPath(controlPath: GroundPathPoint[], segments: number) {
  const curve = new THREE.CatmullRomCurve3(
    controlPath.map((point) => new THREE.Vector3(point.x, 0, point.z)),
    false,
    "centripetal",
    0.35,
  );

  return curve.getPoints(segments).map((point) => ({
    x: point.x,
    z: point.z,
  }));
}

function addFlatPlane(
  name: string,
  width: number,
  depth: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  renderOrder: number,
  parent: THREE.Object3D = naturalElements,
) {
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  plane.name = name;
  plane.renderOrder = renderOrder;
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(x, y, z);
  plane.receiveShadow = true;
  parent.add(plane);
}

function addExtrudedPolygonSurface(
  name: string,
  points: GroundPathPoint[],
  material: THREE.Material,
  topY: number,
  thickness: number,
  renderOrder: number,
  parent: THREE.Object3D = naturalElements,
) {
  const positions: number[] = [];
  const topTriangles = THREE.ShapeUtils.triangulateShape(
    points.map((point) => new THREE.Vector2(point.x, point.z)),
    [],
  );
  const indices: number[] = [];
  const bottomY = topY - thickness;

  for (const point of points) {
    positions.push(point.x, topY, point.z);
  }

  for (const point of points) {
    positions.push(point.x, bottomY, point.z);
  }

  indices.push(...topTriangles.flat());

  for (const triangle of topTriangles) {
    indices.push(
      triangle[2] + points.length,
      triangle[1] + points.length,
      triangle[0] + points.length,
    );
  }

  for (let index = 0; index < points.length; index += 1) {
    const nextIndex = (index + 1) % points.length;
    const topA = index;
    const topB = nextIndex;
    const bottomA = index + points.length;
    const bottomB = nextIndex + points.length;
    indices.push(topA, bottomA, topB, topB, bottomA, bottomB);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.renderOrder = renderOrder;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

function addLayeredPolygonVolume(
  name: string,
  points: GroundPathPoint[],
  topMaterial: THREE.Material,
  sideMaterial: THREE.Material,
  topY: number,
  thickness: number,
  renderOrder: number,
  parent: THREE.Object3D = naturalElements,
  castShadow = true,
) {
  const positions: number[] = [];
  const topTriangles = THREE.ShapeUtils.triangulateShape(
    points.map((point) => new THREE.Vector2(point.x, point.z)),
    [],
  );
  const indices: number[] = [];
  const bottomY = topY - thickness;

  for (const point of points) {
    positions.push(point.x, topY, point.z);
  }

  for (const point of points) {
    positions.push(point.x, bottomY, point.z);
  }

  const topIndexStart = indices.length;
  indices.push(...topTriangles.flat());
  const topIndexCount = indices.length - topIndexStart;

  const bottomIndexStart = indices.length;
  for (const triangle of topTriangles) {
    indices.push(
      triangle[2] + points.length,
      triangle[1] + points.length,
      triangle[0] + points.length,
    );
  }
  const bottomIndexCount = indices.length - bottomIndexStart;

  const sideIndexStart = indices.length;
  for (let index = 0; index < points.length; index += 1) {
    const nextIndex = (index + 1) % points.length;
    const topA = index;
    const topB = nextIndex;
    const bottomA = index + points.length;
    const bottomB = nextIndex + points.length;
    indices.push(topA, bottomA, topB, topB, bottomA, bottomB);
  }
  const sideIndexCount = indices.length - sideIndexStart;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.clearGroups();
  geometry.addGroup(topIndexStart, topIndexCount, 0);
  geometry.addGroup(bottomIndexStart, bottomIndexCount, 1);
  geometry.addGroup(sideIndexStart, sideIndexCount, 1);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, [topMaterial, sideMaterial]);
  mesh.name = name;
  mesh.renderOrder = renderOrder;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

function addMainBoundarySurface() {
  addLayeredPolygonVolume(
    "main-3-square-kilometer-grass-terrain-slab",
    mainBoundaryCoastlinePoints,
    grassMaterial,
    terrainCutMaterial,
    GRASS_SURFACE_Y,
    MAIN_BOUNDARY_TERRAIN_THICKNESS_M,
    2,
    naturalElements,
    false,
  );
}

function addBox(
  name: string,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  parent: THREE.Object3D = artificialElements,
) {
  const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  box.name = name;
  box.position.set(x, y, z);
  box.castShadow = true;
  box.receiveShadow = true;
  parent.add(box);
}

function addTopAlignedBox(
  name: string,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  x: number,
  topY: number,
  z: number,
  renderOrder: number,
  parent: THREE.Object3D = artificialElements,
) {
  const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  box.name = name;
  box.renderOrder = renderOrder;
  box.position.set(x, topY - height * 0.5, z);
  box.castShadow = true;
  box.receiveShadow = true;
  parent.add(box);
}

function addCylinderInstances(
  name: string,
  radius: number,
  height: number,
  material: THREE.Material,
  topY: number,
  placements: XZPlacement[],
  parent: THREE.Object3D = artificialElements,
) {
  const mesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(radius, radius, height, 12),
    material,
    placements.length,
  );
  const matrix = new THREE.Matrix4();

  placements.forEach((placement, index) => {
    matrix.makeTranslation(placement.x, topY - height * 0.5, placement.z);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;

  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

function addBoxInstances(
  name: string,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  placements: XYZPlacement[],
  parent: THREE.Object3D = artificialElements,
) {
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(width, height, depth),
    material,
    placements.length,
  );
  const matrix = new THREE.Matrix4();

  placements.forEach((placement, index) => {
    matrix.makeTranslation(placement.x, placement.y, placement.z);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;

  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

function addCargoShip(name: string, x: number, z: number) {
  addBox(name, CARGO_SHIP_HULL_LENGTH_M, 16, 34, shipHullMaterial, x, SEA_Y + 10, z);
  addBox(`${name}-cabin`, 42, 18, 22, shipCabinMaterial, x - 38, SEA_Y + 27, z);
}

function addPrivateBoat(name: string, x: number, z: number) {
  addBox(name, 42, 6, 12, privateBoatMaterial, x, SEA_Y + 5, z);
  addBox(`${name}-cabin`, 13, 7, 8, shipCabinMaterial, x - 5, SEA_Y + 11, z);
}

function addPierAttractionPark(pierCenterX: number, pierCenterZ: number) {
  const ferrisWheel = new THREE.Mesh(
    new THREE.TorusGeometry(42, 2.8, 8, 44),
    attractionRedMaterial,
  );
  ferrisWheel.name = "wooden-pier-ferris-wheel";
  ferrisWheel.castShadow = true;
  ferrisWheel.receiveShadow = true;
  ferrisWheel.position.set(pierCenterX - 110, PLATFORM_SURFACE_Y + 48, pierCenterZ - 58);
  artificialElements.add(ferrisWheel);

  addBox(
    "ferris-wheel-left-support",
    5,
    58,
    5,
    dockMaterial,
    pierCenterX - 134,
    PLATFORM_SURFACE_Y + 29,
    pierCenterZ - 58,
  );
  addBox(
    "ferris-wheel-right-support",
    5,
    58,
    5,
    dockMaterial,
    pierCenterX - 86,
    PLATFORM_SURFACE_Y + 29,
    pierCenterZ - 58,
  );
  addBox(
    "pier-carousel-base",
    52,
    10,
    52,
    attractionYellowMaterial,
    pierCenterX + 34,
    PLATFORM_SURFACE_Y + 6,
    pierCenterZ - 58,
  );
  addBox(
    "pier-attraction-building",
    68,
    18,
    42,
    attractionBlueMaterial,
    pierCenterX - 52,
    PLATFORM_SURFACE_Y + 10,
    pierCenterZ + 58,
  );
  addBox(
    "pier-ticket-booth",
    34,
    14,
    26,
    attractionRedMaterial,
    pierCenterX + 104,
    PLATFORM_SURFACE_Y + 8,
    pierCenterZ + 58,
  );
}

function addAttractionPierSupportPiles(pierCenterZ: number) {
  const placements: XZPlacement[] = [];

  for (let column = 0; column < ATTRACTION_PIER_SUPPORT_COLUMNS; column += 1) {
    const x = THREE.MathUtils.lerp(
      mainBoundaryMaxX + 28,
      mainBoundaryMaxX + ATTRACTION_PIER_LENGTH_M - 95,
      column / (ATTRACTION_PIER_SUPPORT_COLUMNS - 1),
    );

    for (let row = 0; row < ATTRACTION_PIER_SUPPORT_ROWS; row += 1) {
      const z = THREE.MathUtils.lerp(
        pierCenterZ - ATTRACTION_PIER_DEPTH_M * 0.36,
        pierCenterZ + ATTRACTION_PIER_DEPTH_M * 0.36,
        row / (ATTRACTION_PIER_SUPPORT_ROWS - 1),
      );
      placements.push({ x, z });
    }
  }

  addCylinderInstances(
    "attraction-pier-support-piles",
    3.4,
    PLATFORM_SURFACE_Y - SEA_Y + 3,
    woodPierMaterial,
    PLATFORM_SURFACE_Y + 0.1,
    placements,
  );
}

function addPrivateMarinaSupportPiles(marinaCenterZ: number) {
  const walkwayPlacements = [
    marinaCenterZ - 60,
    marinaCenterZ - 20,
    marinaCenterZ + 20,
    marinaCenterZ + 60,
  ].map((z) => ({ x: mainBoundaryMaxX + 10, z }));
  const berthPlacements: XZPlacement[] = [];

  for (let index = 0; index < PRIVATE_MARINA_BERTH_COUNT; index += 1) {
    const berthZ = marinaCenterZ - 45 + index * 30;
    berthPlacements.push(
      { x: mainBoundaryMaxX + 123, z: berthZ - 4 },
      { x: mainBoundaryMaxX + 123, z: berthZ + 4 },
    );
  }

  addCylinderInstances(
    "private-marina-walkway-piles",
    2.4,
    PLATFORM_SURFACE_Y - SEA_Y + 3,
    dockMaterial,
    PLATFORM_SURFACE_Y + 0.1,
    walkwayPlacements,
  );
  addCylinderInstances(
    "private-marina-berth-piles",
    2.1,
    PLATFORM_SURFACE_Y - SEA_Y + 3,
    dockMaterial,
    PLATFORM_SURFACE_Y + 0.1,
    berthPlacements,
  );
}

function addCargoCrane(name: string, x: number, z: number) {
  addBox(`${name}-mast`, 8, 38, 8, portCraneMaterial, x, PLATFORM_SURFACE_Y + 19, z);
  addBox(`${name}-boom`, 78, 5, 7, portCraneMaterial, x + 34, PLATFORM_SURFACE_Y + 39, z);
  addBox(`${name}-counterweight`, 16, 8, 10, concretePortMaterial, x - 13, PLATFORM_SURFACE_Y + 35, z);
  addBox(`${name}-cabin`, 12, 9, 12, shipCabinMaterial, x + 10, PLATFORM_SURFACE_Y + 31, z);
}

function addCargoContainers(cargoPortCenterX: number, cargoPortCenterZ: number) {
  const placementsByMaterial: XYZPlacement[][] = cargoContainerMaterials.map(() => []);

  for (let index = 0; index < CARGO_CONTAINER_COUNT; index += 1) {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const x = cargoPortCenterX - 70 + column * 38;
    const z = cargoPortCenterZ - 66 + row * 38;
    const materialIndex = index % cargoContainerMaterials.length;
    placementsByMaterial[materialIndex].push({
      x,
      y: PLATFORM_SURFACE_Y + 4,
      z,
    });
  }

  placementsByMaterial.forEach((placements, materialIndex) => {
    addBoxInstances(
      `cargo-containers-${materialIndex + 1}`,
      28,
      8,
      12,
      cargoContainerMaterials[materialIndex],
      placements,
    );
  });
}

function addCargoPortEquipment(
  cargoPortCenterX: number,
  cargoPortCenterZ: number,
  cargoPortEastEdge: number,
) {
  addCargoContainers(cargoPortCenterX, cargoPortCenterZ);

  for (const [index, z] of [cargoPortCenterZ - 72, cargoPortCenterZ + 72].entries()) {
    addCargoCrane(`cargo-port-crane-${index + 1}`, cargoPortEastEdge - 64, z);
  }

  const bollardPlacements: XZPlacement[] = [];
  for (let index = 0; index < CARGO_BOLLARD_COUNT; index += 1) {
    const z = THREE.MathUtils.lerp(
      cargoPortCenterZ - CARGO_PORT_DEPTH_M * 0.42,
      cargoPortCenterZ + CARGO_PORT_DEPTH_M * 0.42,
      index / (CARGO_BOLLARD_COUNT - 1),
    );
    bollardPlacements.push({ x: cargoPortEastEdge - 16, z });
  }

  addCylinderInstances(
    "cargo-port-bollards",
    3.2,
    4.8,
    dockMaterial,
    PLATFORM_SURFACE_Y + 4.8,
    bollardPlacements,
  );
}

function addSimpleMainlandCoast() {
  const beachInnerX = mainBoundaryMaxX - BEACH_INLAND_WIDTH_M;
  const beachInlandSouthZ = riverMouth.z + 284;
  const beachRiverEdge = sampleGroundPath(
    [
      { x: riverEstuaryStart.x - 26, z: riverEstuaryStart.z + 74 },
      { x: mainBoundaryMaxX - 138, z: riverMouth.z + 108 },
      { x: mainBoundaryMaxX - 54, z: riverMouth.z + 138 },
      { x: mainBoundaryMaxX, z: riverMouth.z + 140 },
    ],
    18,
  );

  addExtrudedPolygonSurface(
    "river-integrated-mainland-beach",
    [
      ...beachRiverEdge,
      { x: mainBoundaryMaxX, z: mainBoundaryMaxZ },
      { x: beachInnerX, z: mainBoundaryMaxZ },
      { x: beachInnerX, z: beachInlandSouthZ },
      { x: beachInnerX + 34, z: riverMouth.z + 228 },
      { x: beachInnerX + 80, z: riverMouth.z + 184 },
    ],
    beachSandMaterial,
    COAST_SURFACE_Y,
    BEACH_THICKNESS_M,
    3,
    naturalElements,
  );

  addExtrudedPolygonSurface(
    "mainland-beach-wet-sand-band",
    [
      { x: mainBoundaryMaxX - WET_SAND_WIDTH_M, z: riverMouth.z + 166 },
      { x: mainBoundaryMaxX - 10, z: riverMouth.z + 143 },
      { x: mainBoundaryMaxX, z: riverMouth.z + 140 },
      { x: mainBoundaryMaxX, z: mainBoundaryMaxZ },
      { x: mainBoundaryMaxX - WET_SAND_WIDTH_M, z: mainBoundaryMaxZ },
    ],
    wetSandMaterial,
    COAST_SURFACE_Y + 0.04,
    WET_SAND_THICKNESS_M,
    4,
    naturalElements,
  );

  const attractionPierCenterX =
    mainBoundaryMaxX - ATTRACTION_PIER_LAND_OVERLAP_M + ATTRACTION_PIER_LENGTH_M * 0.5;
  const attractionPierCenterZ = riverMouth.z - ATTRACTION_PIER_RIVER_OFFSET_M;

  addTopAlignedBox(
    "long-wooden-attraction-pier",
    ATTRACTION_PIER_LENGTH_M,
    PIER_DECK_THICKNESS_M,
    ATTRACTION_PIER_DEPTH_M,
    woodPierMaterial,
    attractionPierCenterX,
    PLATFORM_SURFACE_Y,
    attractionPierCenterZ,
    8,
    artificialElements,
  );
  addAttractionPierSupportPiles(attractionPierCenterZ);
  addPierAttractionPark(attractionPierCenterX, attractionPierCenterZ);

  const marinaCenterZ = riverMouth.z - PRIVATE_MARINA_RIVER_OFFSET_M;
  addTopAlignedBox(
    "private-marina-shore-walkway",
    18,
    MARINA_DOCK_THICKNESS_M,
    128,
    dockMaterial,
    mainBoundaryMaxX + 9,
    PLATFORM_SURFACE_Y + 0.08,
    marinaCenterZ,
    9,
    artificialElements,
  );

  for (let index = 0; index < PRIVATE_MARINA_BERTH_COUNT; index += 1) {
    const berthZ = marinaCenterZ - 45 + index * 30;
    addTopAlignedBox(
      `private-marina-berth-${index + 1}`,
      116,
      MARINA_DOCK_THICKNESS_M,
      6,
      dockMaterial,
      mainBoundaryMaxX + 76,
      PLATFORM_SURFACE_Y + 0.08,
      berthZ,
      9,
      artificialElements,
    );
    addPrivateBoat(`private-marina-boat-${index + 1}`, mainBoundaryMaxX + 148, berthZ + 10);
  }
  addPrivateMarinaSupportPiles(marinaCenterZ);

  const cargoPortCenterX =
    mainBoundaryMaxX - CARGO_PORT_LAND_OVERLAP_M + CARGO_PORT_LENGTH_M * 0.5;
  const cargoPortCenterZ = riverMouth.z - CARGO_PORT_RIVER_OFFSET_M;
  const cargoPortEastEdge =
    cargoPortCenterX + CARGO_PORT_LENGTH_M * 0.5;

  addTopAlignedBox(
    "large-concrete-cargo-port",
    CARGO_PORT_LENGTH_M,
    CARGO_PORT_HEIGHT_M,
    CARGO_PORT_DEPTH_M,
    concretePortMaterial,
    cargoPortCenterX,
    PLATFORM_SURFACE_Y,
    cargoPortCenterZ,
    8,
    artificialElements,
  );
  addCargoPortEquipment(cargoPortCenterX, cargoPortCenterZ, cargoPortEastEdge);

  for (const [index, dockZ] of [cargoPortCenterZ - 58, cargoPortCenterZ + 58].entries()) {
    addTopAlignedBox(
      `cargo-port-berth-dock-${index + 1}`,
      CARGO_BERTH_DOCK_LENGTH_M,
      CARGO_BERTH_DOCK_THICKNESS_M,
      18,
      dockMaterial,
      cargoPortEastEdge + 40,
      PLATFORM_SURFACE_Y + 0.08,
      dockZ,
      9,
      artificialElements,
    );
    const shipZ = dockZ + (index === 0 ? 38 : -38);
    addCargoShip(
      `cargo-port-ship-${index + 1}`,
      cargoPortEastEdge + CARGO_SHIP_CENTER_OFFSET_FROM_PORT_EDGE_M,
      shipZ,
    );
  }
}

function addMainlandOutsideBoundary() {
  addFlatPlane(
    "mainland-outside-boundary-west",
    MAINLAND_WEST_MARGIN_M,
    mainlandDepth,
    mainlandMaterial,
    (mainlandMinX + mainBoundaryMinX) / 2,
    MAINLAND_Y,
    mainlandCenterZ,
    1,
  );
  addFlatPlane(
    "mainland-outside-boundary-south",
    MAIN_BOUNDARY_SIDE_M,
    MAINLAND_NORTH_SOUTH_MARGIN_M,
    mainlandMaterial,
    mainBoundaryCenterX,
    MAINLAND_Y,
    (mainlandMinZ + mainBoundaryMinZ) / 2,
    1,
  );
  addFlatPlane(
    "mainland-outside-boundary-north",
    MAIN_BOUNDARY_SIDE_M,
    MAINLAND_NORTH_SOUTH_MARGIN_M,
    mainlandMaterial,
    mainBoundaryCenterX,
    MAINLAND_Y,
    (mainBoundaryMaxZ + mainlandMaxZ) / 2,
    1,
  );
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
addMainlandOutsideBoundary();
addMainBoundarySurface();
addSimpleMainlandCoast();

function mountainHeightAt(x: number, z: number) {
  const normalizedX = (x - mountainCenter.x) / MOUNTAIN_RADIUS_X_M;
  const normalizedZ = (z - mountainCenter.z) / MOUNTAIN_RADIUS_Z_M;
  const distance = Math.sqrt(normalizedX * normalizedX + normalizedZ * normalizedZ);

  if (distance >= 1) {
    return 0;
  }

  const ridgeNoise =
    0.93 +
    0.05 * Math.sin(x * 0.021 + z * 0.013) +
    0.035 * Math.sin(x * 0.009 - z * 0.017);
  return MOUNTAIN_HEIGHT_M * Math.pow(1 - distance, 1.72) * ridgeNoise;
}

function mountainSurfaceYAt(height: number) {
  return GRASS_SURFACE_Y + height + MOUNTAIN_SURFACE_LIFT_M;
}

function setMountainVertexColor(height: number, color: THREE.Color) {
  if (height <= MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M) {
    const foothillBlend = THREE.MathUtils.smoothstep(
      height / MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M,
      0,
      1,
    );
    color.copy(terrainGrassColor).lerp(mountainLowColor, foothillBlend);
    return;
  }

  const mountainRatio = THREE.MathUtils.clamp(
    (height - MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M) /
      (MOUNTAIN_HEIGHT_M - MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M),
    0,
    1,
  );

  if (mountainRatio < 0.5) {
    color.copy(mountainLowColor).lerp(mountainMidColor, mountainRatio / 0.5);
  } else {
    color.copy(mountainMidColor).lerp(mountainHighColor, (mountainRatio - 0.5) / 0.5);
  }
}

function createMountainSurfaceGeometry(
  shouldIncludeCell: (cellMaxHeight: number) => boolean,
) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const heights: number[] = [];
  const color = new THREE.Color();

  for (let zIndex = 0; zIndex <= MOUNTAIN_GRID_SEGMENTS; zIndex += 1) {
    const zRatio = zIndex / MOUNTAIN_GRID_SEGMENTS;
    const z = THREE.MathUtils.lerp(
      mountainVisibleBounds.minZ,
      mountainVisibleBounds.maxZ,
      zRatio,
    );

    for (let xIndex = 0; xIndex <= MOUNTAIN_GRID_SEGMENTS; xIndex += 1) {
      const xRatio = xIndex / MOUNTAIN_GRID_SEGMENTS;
      const x = THREE.MathUtils.lerp(
        mountainVisibleBounds.minX,
        mountainVisibleBounds.maxX,
        xRatio,
      );
      const height = mountainHeightAt(x, z);
      heights.push(height);
      setMountainVertexColor(height, color);

      positions.push(x, mountainSurfaceYAt(height), z);
      colors.push(color.r, color.g, color.b);
    }
  }

  const rowLength = MOUNTAIN_GRID_SEGMENTS + 1;
  for (let zIndex = 0; zIndex < MOUNTAIN_GRID_SEGMENTS; zIndex += 1) {
    for (let xIndex = 0; xIndex < MOUNTAIN_GRID_SEGMENTS; xIndex += 1) {
      const a = zIndex * rowLength + xIndex;
      const b = a + 1;
      const c = a + rowLength;
      const d = c + 1;
      const cellMaxHeight = Math.max(heights[a], heights[b], heights[c], heights[d]);

      if (shouldIncludeCell(cellMaxHeight)) {
        indices.push(a, c, b, b, c, d);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addMountainFoothillBlend() {
  const foothill = new THREE.Mesh(
    createMountainSurfaceGeometry(
      (cellMaxHeight) =>
        cellMaxHeight > MOUNTAIN_MIN_RENDER_HEIGHT_M &&
        cellMaxHeight <= MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M,
    ),
    mountainMaterial,
  );
  foothill.name = "mountain-grass-foothill-blend";
  foothill.renderOrder = 3;
  foothill.receiveShadow = true;
  naturalElements.add(foothill);
}

function addClippedMountain() {
  const mountain = new THREE.Mesh(
    createMountainSurfaceGeometry(
      (cellMaxHeight) => cellMaxHeight > MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M,
    ),
    mountainMaterial,
  );
  mountain.name = "clipped-corner-mountain";
  mountain.renderOrder = 3;
  mountain.castShadow = false;
  mountain.receiveShadow = true;
  naturalElements.add(mountain);

  addMountainCutWall("mountain-west-vertical-cut", "west");
  addMountainCutWall("mountain-south-vertical-cut", "south");
}

function addMountainCutWall(name: string, edge: "west" | "south") {
  const positions: number[] = [];
  const indices: number[] = [];
  const samples = MOUNTAIN_GRID_SEGMENTS;

  for (let index = 0; index <= samples; index += 1) {
    const ratio = index / samples;
    const x =
      edge === "west"
        ? mountainVisibleBounds.minX
        : THREE.MathUtils.lerp(mountainVisibleBounds.minX, mountainVisibleBounds.maxX, ratio);
    const z =
      edge === "south"
        ? mountainVisibleBounds.maxZ
        : THREE.MathUtils.lerp(mountainVisibleBounds.minZ, mountainVisibleBounds.maxZ, ratio);
    const y = GRASS_SURFACE_Y + mountainHeightAt(x, z);

    positions.push(x, y, z, x, GRASS_SURFACE_Y, z);
  }

  for (let index = 0; index < samples; index += 1) {
    const topA = index * 2;
    const bottomA = topA + 1;
    const topB = topA + 2;
    const bottomB = topA + 3;
    indices.push(topA, bottomA, topB, topB, bottomA, bottomB);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const cut = new THREE.Mesh(geometry, mountainCutMaterial);
  cut.name = name;
  cut.renderOrder = 3;
  cut.castShadow = false;
  cut.receiveShadow = true;
  naturalElements.add(cut);
}

function snowMountainHeightAt(x: number, z: number) {
  const normalizedX = (x - snowMountainCenter.x) / SNOW_MOUNTAIN_RADIUS_X_M;
  const normalizedZ = (z - snowMountainCenter.z) / SNOW_MOUNTAIN_RADIUS_Z_M;
  const distance = Math.sqrt(normalizedX * normalizedX + normalizedZ * normalizedZ);

  if (distance >= 1) {
    return 0;
  }

  const summitDistance = Math.sqrt(
    ((normalizedX + 0.07) / 0.96) ** 2 + ((normalizedZ - 0.04) / 1.02) ** 2,
  );
  const ridgeAngle = Math.atan2(normalizedZ, normalizedX);
  const centerMass = THREE.MathUtils.smoothstep(1 - distance, 0, 1);
  const ridgeNoise =
    0.96 +
    0.028 * Math.sin(x * 0.01 + z * 0.008) +
    0.022 * Math.sin(x * 0.006 - z * 0.012) +
    0.016 * Math.sin((x + z) * 0.005);
  const broadSlope = Math.pow(centerMass, 1.04);
  const summitLift =
    0.8 + 0.2 * Math.pow(Math.max(0, 1 - summitDistance / 0.76), 1.55);
  const ridgeLift =
    1 + 0.055 * Math.cos(ridgeAngle * 2.1 + distance * 4.8) * centerMass;
  return SNOW_MOUNTAIN_HEIGHT_M * broadSlope * summitLift * ridgeLift * ridgeNoise;
}

function estimateSnowMountainVisiblePortion() {
  let fullFootprintSamples = 0;
  let visibleFootprintSamples = 0;
  const samples = 72;

  for (let zIndex = 0; zIndex <= samples; zIndex += 1) {
    const z = THREE.MathUtils.lerp(
      snowMountainCenter.z - SNOW_MOUNTAIN_RADIUS_Z_M,
      snowMountainCenter.z + SNOW_MOUNTAIN_RADIUS_Z_M,
      zIndex / samples,
    );

    for (let xIndex = 0; xIndex <= samples; xIndex += 1) {
      const x = THREE.MathUtils.lerp(
        snowMountainCenter.x - SNOW_MOUNTAIN_RADIUS_X_M,
        snowMountainCenter.x + SNOW_MOUNTAIN_RADIUS_X_M,
        xIndex / samples,
      );
      const normalizedX = (x - snowMountainCenter.x) / SNOW_MOUNTAIN_RADIUS_X_M;
      const normalizedZ = (z - snowMountainCenter.z) / SNOW_MOUNTAIN_RADIUS_Z_M;

      if (normalizedX * normalizedX + normalizedZ * normalizedZ > 1) {
        continue;
      }

      fullFootprintSamples += 1;

      if (
        x >= mainBoundaryMinX &&
        x <= mainBoundaryMaxX &&
        z >= mainBoundaryMinZ &&
        z <= mainBoundaryMaxZ
      ) {
        visibleFootprintSamples += 1;
      }
    }
  }

  return visibleFootprintSamples / fullFootprintSamples;
}

function snowMountainBaseYAt(x: number, z: number) {
  return mountainSurfaceYAt(mountainHeightAt(x, z)) + SNOW_MOUNTAIN_SURFACE_LIFT_M;
}

function snowMountainSurfaceYAt(x: number, z: number, height: number) {
  return snowMountainBaseYAt(x, z) + height;
}

function setSnowMountainVertexColor(height: number, color: THREE.Color) {
  if (height <= SNOW_MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M) {
    const foothillBlend = THREE.MathUtils.smoothstep(
      height / SNOW_MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M,
      0,
      1,
    );
    color.copy(terrainGrassColor).lerp(mountainLowColor, foothillBlend);
    return;
  }

  if (height < SNOW_MOUNTAIN_SNOWLINE_M) {
    const rockBlend = THREE.MathUtils.smoothstep(
      (height - SNOW_MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M) /
        (SNOW_MOUNTAIN_SNOWLINE_M - SNOW_MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M),
      0,
      1,
    );
    color.copy(mountainLowColor).lerp(mountainHighColor, rockBlend);
    return;
  }

  const snowBlend = THREE.MathUtils.smoothstep(
    (height - SNOW_MOUNTAIN_SNOWLINE_M) /
      (SNOW_MOUNTAIN_HEIGHT_M - SNOW_MOUNTAIN_SNOWLINE_M),
    0,
    1,
  );
  color.copy(snowShadowColor).lerp(snowColor, snowBlend);
}

function createSnowMountainSurfaceGeometry() {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const heights: number[] = [];
  const color = new THREE.Color();

  for (let zIndex = 0; zIndex <= SNOW_MOUNTAIN_GRID_SEGMENTS; zIndex += 1) {
    const zRatio = zIndex / SNOW_MOUNTAIN_GRID_SEGMENTS;
    const z = THREE.MathUtils.lerp(
      snowMountainVisibleBounds.minZ,
      snowMountainVisibleBounds.maxZ,
      zRatio,
    );

    for (let xIndex = 0; xIndex <= SNOW_MOUNTAIN_GRID_SEGMENTS; xIndex += 1) {
      const xRatio = xIndex / SNOW_MOUNTAIN_GRID_SEGMENTS;
      const x = THREE.MathUtils.lerp(
        snowMountainVisibleBounds.minX,
        snowMountainVisibleBounds.maxX,
        xRatio,
      );
      const height = snowMountainHeightAt(x, z);

      heights.push(height);
      setSnowMountainVertexColor(height, color);
      positions.push(x, snowMountainSurfaceYAt(x, z, height), z);
      colors.push(color.r, color.g, color.b);
    }
  }

  const rowLength = SNOW_MOUNTAIN_GRID_SEGMENTS + 1;
  for (let zIndex = 0; zIndex < SNOW_MOUNTAIN_GRID_SEGMENTS; zIndex += 1) {
    for (let xIndex = 0; xIndex < SNOW_MOUNTAIN_GRID_SEGMENTS; xIndex += 1) {
      const a = zIndex * rowLength + xIndex;
      const b = a + 1;
      const c = a + rowLength;
      const d = c + 1;
      const cellMaxHeight = Math.max(heights[a], heights[b], heights[c], heights[d]);

      if (cellMaxHeight > SNOW_MOUNTAIN_MIN_RENDER_HEIGHT_M) {
        indices.push(a, c, b, b, c, d);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addSnowCappedMountain() {
  const mountain = new THREE.Mesh(createSnowMountainSurfaceGeometry(), mountainMaterial);
  mountain.name = "higher-snow-capped-southwest-mountain";
  mountain.renderOrder = 4;
  mountain.castShadow = false;
  mountain.receiveShadow = true;
  naturalElements.add(mountain);

  addSnowMountainCutWall("snow-mountain-west-vertical-cut", "west");
  addSnowMountainCutWall("snow-mountain-south-vertical-cut", "south");
}

function addSnowMountainCutWall(name: string, edge: "west" | "south") {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const samples = SNOW_MOUNTAIN_GRID_SEGMENTS;
  const verticalSegments = 10;
  const rowLength = verticalSegments + 1;
  const color = new THREE.Color();

  for (let index = 0; index <= samples; index += 1) {
    const ratio = index / samples;
    const x =
      edge === "west"
        ? snowMountainVisibleBounds.minX
        : THREE.MathUtils.lerp(
            snowMountainVisibleBounds.minX,
            snowMountainVisibleBounds.maxX,
            ratio,
          );
    const z =
      edge === "south"
        ? snowMountainVisibleBounds.minZ
        : THREE.MathUtils.lerp(
            snowMountainVisibleBounds.minZ,
            snowMountainVisibleBounds.maxZ,
            ratio,
          );
    const height = snowMountainHeightAt(x, z);
    const bottomY = snowMountainBaseYAt(x, z);

    for (let verticalIndex = 0; verticalIndex <= verticalSegments; verticalIndex += 1) {
      const heightRatio = verticalIndex / verticalSegments;
      const localHeight = height * heightRatio;

      setSnowMountainVertexColor(localHeight, color);
      positions.push(x, bottomY + localHeight, z);
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let index = 0; index < samples; index += 1) {
    for (let verticalIndex = 0; verticalIndex < verticalSegments; verticalIndex += 1) {
      const a = index * rowLength + verticalIndex;
      const b = a + 1;
      const c = a + rowLength;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const cut = new THREE.Mesh(geometry, mountainMaterial);
  cut.name = name;
  cut.renderOrder = 4;
  cut.castShadow = false;
  cut.receiveShadow = true;
  naturalElements.add(cut);
}

function reservoirOutletAngle() {
  return Math.atan2(
    (reservoirOutletEdge.z - reservoirCenter.z) / RESERVOIR_RADIUS_Z_M,
    (reservoirOutletEdge.x - reservoirCenter.x) / RESERVOIR_RADIUS_X_M,
  );
}

function signedAngleDistance(angle: number, target: number) {
  return Math.atan2(Math.sin(angle - target), Math.cos(angle - target));
}

function reservoirLakeBoundaryPoint(angle: number, index: number) {
  const edgeNoise = reservoirEdgeNoise(index);
  return {
    x: reservoirCenter.x + Math.cos(angle) * RESERVOIR_RADIUS_X_M * edgeNoise,
    z: reservoirCenter.z + Math.sin(angle) * RESERVOIR_RADIUS_Z_M * edgeNoise,
  };
}

function createReservoirLakeGeometry() {
  const y = reservoirLakeY();
  const boundaryPoints: GroundPathPoint[] = [];
  const outletAngle = reservoirOutletAngle();
  let damFaceInserted = false;

  for (let index = 0; index < RESERVOIR_SEGMENTS; index += 1) {
    const angle = (index / RESERVOIR_SEGMENTS) * Math.PI * 2;
    const inDamOpening =
      Math.abs(signedAngleDistance(angle, outletAngle)) <
      RESERVOIR_DAM_OPENING_HALF_ANGLE_RAD;

    if (!inDamOpening) {
      boundaryPoints.push(reservoirLakeBoundaryPoint(angle, index));
      continue;
    }

    if (!damFaceInserted) {
      for (let station = 0; station <= RESERVOIR_DAM_FACE_SAMPLES; station += 1) {
        const ratio = station / RESERVOIR_DAM_FACE_SAMPLES;
        const lengthOffset = THREE.MathUtils.lerp(
          -DAM_LENGTH_M * 0.5,
          DAM_LENGTH_M * 0.5,
          ratio,
        );
        boundaryPoints.push(damUpstreamFacePoint(lengthOffset));
      }

      damFaceInserted = true;
    }
  }

  const positions = [reservoirCenter.x, y, reservoirCenter.z];
  const indices: number[] = [];

  for (const point of boundaryPoints) {
    positions.push(point.x, y, point.z);
  }

  for (let index = 1; index <= boundaryPoints.length; index += 1) {
    indices.push(0, index, index === boundaryPoints.length ? 1 : index + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function reservoirEdgeNoise(index: number) {
  return 1 + 0.045 * Math.sin(index * 1.7) + 0.025 * Math.sin(index * 3.1);
}

function addReservoirBankVertex(
  positions: number[],
  colors: number[],
  point: GroundPathPoint,
  y: number,
) {
  const lowColor = new THREE.Color(0x6f8d57);
  const midColor = new THREE.Color(0x887c68);
  const highColor = new THREE.Color(0xb0aaa0);
  const color = new THREE.Color();
  const heightRatio = THREE.MathUtils.clamp((y - GRASS_SURFACE_Y) / MOUNTAIN_HEIGHT_M, 0, 1);

  if (heightRatio < 0.5) {
    color.copy(lowColor).lerp(midColor, heightRatio / 0.5);
  } else {
    color.copy(midColor).lerp(highColor, (heightRatio - 0.5) / 0.5);
  }

  positions.push(point.x, y, point.z);
  colors.push(color.r, color.g, color.b);
}

function reservoirBankPoint(angle: number, index: number, scale: number) {
  const noise = reservoirEdgeNoise(index);
  return {
    x: reservoirCenter.x + Math.cos(angle) * RESERVOIR_RADIUS_X_M * scale * noise,
    z: reservoirCenter.z + Math.sin(angle) * RESERVOIR_RADIUS_Z_M * scale * noise,
  };
}

function isReservoirBankInDamOpening(point: GroundPathPoint) {
  const fromReservoir = {
    x: point.x - reservoirCenter.x,
    z: point.z - reservoirCenter.z,
  };
  const fromDam = {
    x: point.x - damCenter.x,
    z: point.z - damCenter.z,
  };
  const alongOutlet =
    fromReservoir.x * reservoirOutletDirection.x +
    fromReservoir.z * reservoirOutletDirection.z;
  const alongDam = fromDam.x * damLongAxis.x + fromDam.z * damLongAxis.z;

  return (
    alongOutlet > reservoirOutletScale * 0.62 &&
    Math.abs(alongDam) < DAM_BANK_OPENING_HALF_LENGTH_M
  );
}

function createReservoirBasinGeometry() {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const stationInDamOpening: boolean[] = [];
  const lakeY = reservoirLakeY();

  for (let index = 0; index <= RESERVOIR_BANK_SEGMENTS; index += 1) {
    const angle = (index / RESERVOIR_BANK_SEGMENTS) * Math.PI * 2;
    const inner = reservoirBankPoint(angle, index, RESERVOIR_BANK_INNER_SCALE);
    const crest = reservoirBankPoint(angle, index, RESERVOIR_BANK_CREST_SCALE);
    const outer = reservoirBankPoint(angle, index, RESERVOIR_BANK_OUTER_SCALE);
    const outerGroundY = GRASS_SURFACE_Y + mountainHeightAt(outer.x, outer.z) + 0.8;
    const crestGroundY = GRASS_SURFACE_Y + mountainHeightAt(crest.x, crest.z) + 1.2;
    const bankVariation = 2.6 * Math.sin(angle * 2.4) + 1.8 * Math.sin(angle * 5.1);
    const crestY = Math.max(lakeY + 8 + bankVariation, crestGroundY);

    stationInDamOpening.push(isReservoirBankInDamOpening(crest));
    addReservoirBankVertex(positions, colors, inner, lakeY + 0.9);
    addReservoirBankVertex(positions, colors, crest, crestY);
    addReservoirBankVertex(positions, colors, outer, outerGroundY);
  }

  for (let index = 0; index < RESERVOIR_BANK_SEGMENTS; index += 1) {
    if (stationInDamOpening[index] || stationInDamOpening[index + 1]) {
      continue;
    }

    const current = index * 3;
    const next = current + 3;

    indices.push(current, next, current + 1, current + 1, next, next + 1);
    indices.push(current + 1, next + 1, current + 2, current + 2, next + 1, next + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function riverWaterYAt(point: GroundPathPoint, progress: number) {
  void progress;
  return Math.max(
    GRASS_SURFACE_Y + RIVER_LOWLAND_WATER_CLEARANCE_M,
    GRASS_SURFACE_Y + mountainHeightAt(point.x, point.z) + RIVER_LOWLAND_WATER_CLEARANCE_M,
  );
}

function terrainSurfaceYAt(point: GroundPathPoint) {
  return GRASS_SURFACE_Y + mountainHeightAt(point.x, point.z);
}

function riverWidthAt(progress: number) {
  const outletBlend = THREE.MathUtils.smoothstep(progress, 0, RIVER_SOURCE_TAPER_PROGRESS);
  const upperCourseWidth = THREE.MathUtils.lerp(
    RIVER_SOURCE_WIDTH_M,
    RIVER_WIDTH_M,
    outletBlend,
  );
  const lowerCourseBlend = THREE.MathUtils.smoothstep(progress, 0.62, 1);
  return THREE.MathUtils.lerp(upperCourseWidth, RIVER_MOUTH_WIDTH_M, lowerCourseBlend);
}

function estuaryWidthAt(progress: number) {
  return THREE.MathUtils.lerp(
    RIVER_MOUTH_WIDTH_M * 1.05,
    RIVER_MOUTH_WIDTH_M * 2.28,
    THREE.MathUtils.smoothstep(progress, 0, 1),
  );
}

function estuaryWaterYAt(progress: number) {
  const riverMouthY = riverWaterYAt(riverEstuaryStart, 1);
  const seaBlend = THREE.MathUtils.smoothstep(progress, 0.14, 1);
  return THREE.MathUtils.lerp(riverMouthY, SEA_Y + 0.18, seaBlend);
}

function addRiverBankVertex(
  positions: number[],
  colors: number[],
  x: number,
  y: number,
  z: number,
  color: THREE.Color,
) {
  positions.push(
    THREE.MathUtils.clamp(x, mainBoundaryMinX, mainBoundaryMaxX),
    y,
    THREE.MathUtils.clamp(z, mainBoundaryMinZ, mainBoundaryMaxZ),
  );
  colors.push(color.r, color.g, color.b);
}

function addChannelBankStrip(indices: number[], rowLength: number, columnA: number, columnB: number) {
  for (let index = 0; index < rowLength - 1; index += 1) {
    const current = index * 6;
    const next = current + 6;
    indices.push(
      current + columnA,
      next + columnA,
      current + columnB,
      current + columnB,
      next + columnA,
      next + columnB,
    );
  }
}

function createRiverChannelBankGeometry(path: GroundPathPoint[]) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  path.forEach((point, index) => {
    const progress = index / (path.length - 1);
    const previous = path[Math.max(index - 1, 0)];
    const next = path[Math.min(index + 1, path.length - 1)];
    const tangentX = next.x - previous.x;
    const tangentZ = next.z - previous.z;
    const tangentLength = Math.hypot(tangentX, tangentZ) || 1;
    const normalX = -tangentZ / tangentLength;
    const normalZ = tangentX / tangentLength;
    const waterY = riverWaterYAt(point, progress);
    const terrainY = terrainSurfaceYAt(point);
    const width = riverWidthAt(progress);
    const channelVariation =
      0.18 * Math.sin(progress * Math.PI * 5.2) + 0.1 * Math.sin(progress * Math.PI * 13.1);
    const outerY = Math.max(terrainY + 0.12, waterY - RIVER_CHANNEL_INNER_DROP_M - 0.2);
    const crestY = waterY + RIVER_CHANNEL_CREST_RISE_M + channelVariation;
    const innerY = waterY - RIVER_CHANNEL_INNER_DROP_M;
    const waterEdgeOffset = width * 0.5 + RIVER_CHANNEL_WATER_EDGE_OVERLAP_M;
    const crestOffset = width * 0.5 + RIVER_CHANNEL_CREST_OFFSET_M;
    const outerOffset = width * 0.5 + RIVER_CHANNEL_BANK_WIDTH_M;

    addRiverBankVertex(
      positions,
      colors,
      point.x + normalX * outerOffset,
      outerY,
      point.z + normalZ * outerOffset,
      riverBankOuterColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x + normalX * crestOffset,
      crestY,
      point.z + normalZ * crestOffset,
      riverBankCrestColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x + normalX * waterEdgeOffset,
      innerY,
      point.z + normalZ * waterEdgeOffset,
      riverBankWetColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x - normalX * waterEdgeOffset,
      innerY,
      point.z - normalZ * waterEdgeOffset,
      riverBankWetColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x - normalX * crestOffset,
      crestY,
      point.z - normalZ * crestOffset,
      riverBankCrestColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x - normalX * outerOffset,
      outerY,
      point.z - normalZ * outerOffset,
      riverBankOuterColor,
    );
  });

  addChannelBankStrip(indices, path.length, 0, 1);
  addChannelBankStrip(indices, path.length, 1, 2);
  addChannelBankStrip(indices, path.length, 3, 4);
  addChannelBankStrip(indices, path.length, 4, 5);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createRiverStripGeometry(path: GroundPathPoint[]) {
  const positions: number[] = [];
  const indices: number[] = [];

  path.forEach((point, index) => {
    const progress = index / (path.length - 1);
    const previous = path[Math.max(index - 1, 0)];
    const next = path[Math.min(index + 1, path.length - 1)];
    const tangentX = next.x - previous.x;
    const tangentZ = next.z - previous.z;
    const tangentLength = Math.hypot(tangentX, tangentZ) || 1;
    const normalX = -tangentZ / tangentLength;
    const normalZ = tangentX / tangentLength;
    const y = riverWaterYAt(point, progress);
    const width = riverWidthAt(progress);
    const leftX = THREE.MathUtils.clamp(
      point.x + normalX * width * 0.5,
      mainBoundaryMinX,
      mainBoundaryMaxX,
    );
    const leftZ = THREE.MathUtils.clamp(
      point.z + normalZ * width * 0.5,
      mainBoundaryMinZ,
      mainBoundaryMaxZ,
    );
    const rightX = THREE.MathUtils.clamp(
      point.x - normalX * width * 0.5,
      mainBoundaryMinX,
      mainBoundaryMaxX,
    );
    const rightZ = THREE.MathUtils.clamp(
      point.z - normalZ * width * 0.5,
      mainBoundaryMinZ,
      mainBoundaryMaxZ,
    );

    positions.push(leftX, y, leftZ, rightX, y, rightZ);
  });

  for (let index = 0; index < path.length - 1; index += 1) {
    const leftA = index * 2;
    const rightA = leftA + 1;
    const leftB = leftA + 2;
    const rightB = leftA + 3;
    indices.push(leftA, rightA, leftB, leftB, rightA, rightB);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createEstuaryStripGeometry(path: GroundPathPoint[]) {
  const positions: number[] = [];
  const indices: number[] = [];

  path.forEach((point, index) => {
    const progress = index / (path.length - 1);
    const previous = path[Math.max(index - 1, 0)];
    const next = path[Math.min(index + 1, path.length - 1)];
    const tangentX = next.x - previous.x;
    const tangentZ = next.z - previous.z;
    const tangentLength = Math.hypot(tangentX, tangentZ) || 1;
    const normalX = -tangentZ / tangentLength;
    const normalZ = tangentX / tangentLength;
    const width = estuaryWidthAt(progress);
    const y = estuaryWaterYAt(progress);

    positions.push(
      point.x + normalX * width * 0.5,
      y,
      point.z + normalZ * width * 0.5,
      point.x - normalX * width * 0.5,
      y,
      point.z - normalZ * width * 0.5,
    );
  });

  for (let index = 0; index < path.length - 1; index += 1) {
    const leftA = index * 2;
    const rightA = leftA + 1;
    const leftB = leftA + 2;
    const rightB = leftA + 3;
    indices.push(leftA, rightA, leftB, leftB, rightA, rightB);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createEstuaryBankGeometry(path: GroundPathPoint[]) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const bankPath = path.filter((point) => point.x <= mainBoundaryMaxX);

  bankPath.forEach((point, index) => {
    const progress = index / Math.max(bankPath.length - 1, 1);
    const previous = bankPath[Math.max(index - 1, 0)];
    const next = bankPath[Math.min(index + 1, bankPath.length - 1)];
    const tangentX = next.x - previous.x;
    const tangentZ = next.z - previous.z;
    const tangentLength = Math.hypot(tangentX, tangentZ) || 1;
    const normalX = -tangentZ / tangentLength;
    const normalZ = tangentX / tangentLength;
    const sourceProgress = path.indexOf(point) / (path.length - 1);
    const waterY = estuaryWaterYAt(sourceProgress);
    const terrainY = terrainSurfaceYAt(point);
    const taper = 1 - THREE.MathUtils.smoothstep(progress, 0.62, 1);
    const width = estuaryWidthAt(sourceProgress);
    const waterEdgeOffset = width * 0.5 + RIVER_CHANNEL_WATER_EDGE_OVERLAP_M * taper;
    const crestOffset = width * 0.5 + ESTUARY_BANK_CREST_OFFSET_M * taper;
    const outerOffset = width * 0.5 + ESTUARY_BANK_WIDTH_M * taper;
    const outerY = Math.max(terrainY + 0.08 * taper, waterY - ESTUARY_BANK_INNER_DROP_M);
    const crestY = Math.max(outerY, waterY + ESTUARY_BANK_CREST_RISE_M * taper);
    const innerY = waterY - ESTUARY_BANK_INNER_DROP_M;

    addRiverBankVertex(
      positions,
      colors,
      point.x + normalX * outerOffset,
      outerY,
      point.z + normalZ * outerOffset,
      riverBankOuterColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x + normalX * crestOffset,
      crestY,
      point.z + normalZ * crestOffset,
      riverBankCrestColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x + normalX * waterEdgeOffset,
      innerY,
      point.z + normalZ * waterEdgeOffset,
      riverBankWetColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x - normalX * waterEdgeOffset,
      innerY,
      point.z - normalZ * waterEdgeOffset,
      riverBankWetColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x - normalX * crestOffset,
      crestY,
      point.z - normalZ * crestOffset,
      riverBankCrestColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x - normalX * outerOffset,
      outerY,
      point.z - normalZ * outerOffset,
      riverBankOuterColor,
    );
  });

  addChannelBankStrip(indices, bankPath.length, 0, 1);
  addChannelBankStrip(indices, bankPath.length, 1, 2);
  addChannelBankStrip(indices, bankPath.length, 3, 4);
  addChannelBankStrip(indices, bankPath.length, 4, 5);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function reservoirLakeY() {
  return GRASS_SURFACE_Y + mountainHeightAt(reservoirCenter.x, reservoirCenter.z) + 4;
}

function damCurveOffsetAt(lengthOffset: number) {
  const normalizedLength = lengthOffset / (DAM_LENGTH_M * 0.5);
  return DAM_CURVE_BOW_M * (1 - normalizedLength * normalizedLength);
}

function curvedDamPoint(lengthOffset: number, sideOffset: number) {
  const thicknessOffset = sideOffset + damCurveOffsetAt(lengthOffset);

  return {
    x:
      damCenter.x +
      damLongAxis.x * lengthOffset +
      reservoirOutletDirection.x * thicknessOffset,
    z:
      damCenter.z +
      damLongAxis.z * lengthOffset +
      reservoirOutletDirection.z * thicknessOffset,
  };
}

function damUpstreamFacePoint(lengthOffset: number) {
  return curvedDamPoint(lengthOffset, -DAM_THICKNESS_M * 0.5);
}

function damDownstreamFacePoint(lengthOffset: number) {
  return curvedDamPoint(lengthOffset, DAM_THICKNESS_M * 0.5);
}

function createDamAbutmentGeometry(sideSign: -1 | 1) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const lakeY = reservoirLakeY();
  const damEndOffset = sideSign * (DAM_LENGTH_M * 0.5);
  const terrainPointY = (point: GroundPathPoint) =>
    GRASS_SURFACE_Y + mountainHeightAt(point.x, point.z) + 0.7;
  const boundaryPoints = [
    damUpstreamFacePoint(damEndOffset),
    curvedDamPoint(
      sideSign * (DAM_BANK_OPENING_HALF_LENGTH_M + DAM_ABUTMENT_OUTER_LENGTH_M),
      -DAM_THICKNESS_M * 0.5 - DAM_ABUTMENT_FLARE_M,
    ),
    curvedDamPoint(
      sideSign * (DAM_BANK_OPENING_HALF_LENGTH_M + DAM_ABUTMENT_OUTER_LENGTH_M),
      DAM_THICKNESS_M * 0.5 + DAM_ABUTMENT_FLARE_M,
    ),
    damDownstreamFacePoint(damEndOffset),
  ];
  const crestPoint = curvedDamPoint(
    sideSign * (DAM_LENGTH_M * 0.5 + DAM_ABUTMENT_OUTER_LENGTH_M * 0.42),
    0,
  );

  addReservoirBankVertex(
    positions,
    colors,
    crestPoint,
    Math.max(lakeY + DAM_ABUTMENT_CREST_RISE_M, terrainPointY(crestPoint) + 5),
  );

  boundaryPoints.forEach((point, index) => {
    const nearDam = index === 0 || index === 3;
    addReservoirBankVertex(
      positions,
      colors,
      point,
      Math.max(lakeY + (nearDam ? 12 : 7), terrainPointY(point) + 1.5),
    );
  });

  boundaryPoints.forEach((point) => {
    addReservoirBankVertex(positions, colors, point, terrainPointY(point));
  });

  indices.push(0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1);

  for (let index = 0; index < boundaryPoints.length; index += 1) {
    const top = index + 1;
    const nextTop = ((index + 1) % boundaryPoints.length) + 1;
    const bottom = index + 5;
    const nextBottom = ((index + 1) % boundaryPoints.length) + 5;
    indices.push(top, bottom, nextTop, nextTop, bottom, nextBottom);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addDamAbutments() {
  for (const sideSign of [-1, 1] as const) {
    const abutment = new THREE.Mesh(createDamAbutmentGeometry(sideSign), mountainMaterial);
    abutment.name = sideSign < 0 ? "reservoir-dam-left-abutment" : "reservoir-dam-right-abutment";
    abutment.renderOrder = 6;
    abutment.castShadow = true;
    abutment.receiveShadow = true;
    naturalElements.add(abutment);
  }
}

function createCurvedDamGeometry(baseY: number) {
  const positions: number[] = [];
  const indices: number[] = [];
  const vertexIndex = (station: number, side: number, elevation: number) =>
    station * 4 + side * 2 + elevation;

  for (let station = 0; station <= DAM_CURVE_SEGMENTS; station += 1) {
    const ratio = station / DAM_CURVE_SEGMENTS;
    const lengthOffset = THREE.MathUtils.lerp(-DAM_LENGTH_M * 0.5, DAM_LENGTH_M * 0.5, ratio);

    for (const sideOffset of [-DAM_THICKNESS_M * 0.5, DAM_THICKNESS_M * 0.5]) {
      const point = curvedDamPoint(lengthOffset, sideOffset);
      positions.push(
        point.x,
        baseY,
        point.z,
        point.x,
        baseY + DAM_HEIGHT_M,
        point.z,
      );
    }
  }

  for (let station = 0; station < DAM_CURVE_SEGMENTS; station += 1) {
    const next = station + 1;
    const upstreamBottom = vertexIndex(station, 0, 0);
    const upstreamTop = vertexIndex(station, 0, 1);
    const upstreamNextBottom = vertexIndex(next, 0, 0);
    const upstreamNextTop = vertexIndex(next, 0, 1);
    const downstreamBottom = vertexIndex(station, 1, 0);
    const downstreamTop = vertexIndex(station, 1, 1);
    const downstreamNextBottom = vertexIndex(next, 1, 0);
    const downstreamNextTop = vertexIndex(next, 1, 1);

    indices.push(upstreamBottom, upstreamNextBottom, upstreamTop);
    indices.push(upstreamTop, upstreamNextBottom, upstreamNextTop);
    indices.push(downstreamBottom, downstreamTop, downstreamNextBottom);
    indices.push(downstreamTop, downstreamNextTop, downstreamNextBottom);
    indices.push(upstreamTop, upstreamNextTop, downstreamTop);
    indices.push(downstreamTop, upstreamNextTop, downstreamNextTop);
    indices.push(upstreamBottom, downstreamBottom, upstreamNextBottom);
    indices.push(downstreamBottom, downstreamNextBottom, upstreamNextBottom);
  }

  for (const station of [0, DAM_CURVE_SEGMENTS]) {
    const upstreamBottom = vertexIndex(station, 0, 0);
    const upstreamTop = vertexIndex(station, 0, 1);
    const downstreamBottom = vertexIndex(station, 1, 0);
    const downstreamTop = vertexIndex(station, 1, 1);

    indices.push(upstreamBottom, upstreamTop, downstreamBottom);
    indices.push(downstreamBottom, upstreamTop, downstreamTop);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addReservoirBasin() {
  const basin = new THREE.Mesh(createReservoirBasinGeometry(), mountainMaterial);
  basin.name = "natural-reservoir-basin";
  basin.renderOrder = 4;
  basin.receiveShadow = true;
  naturalElements.add(basin);
}

function addReservoirLake() {
  const lake = new THREE.Mesh(createReservoirLakeGeometry(), riverMaterial);
  lake.name = "mountain-reservoir-lake";
  lake.renderOrder = 5;
  naturalElements.add(lake);
}

function addDam() {
  const damBaseY = Math.max(
    GRASS_SURFACE_Y + mountainHeightAt(damCenter.x, damCenter.z),
    reservoirLakeY() - DAM_HEIGHT_M * 0.46,
  );
  const dam = new THREE.Mesh(createCurvedDamGeometry(damBaseY), damMaterial);
  dam.name = "curved-reservoir-dam";
  dam.renderOrder = 7;
  dam.castShadow = true;
  dam.receiveShadow = true;
  artificialElements.add(dam);
}

function addRiver() {
  const river = new THREE.Mesh(createRiverStripGeometry(riverPath), riverMaterial);
  river.name = "mountain-to-sea-river";
  river.renderOrder = 5;
  naturalElements.add(river);
}

function addRiverChannelBanks() {
  const banks = new THREE.Mesh(createRiverChannelBankGeometry(riverPath), riverBankMaterial);
  banks.name = "sloped-natural-river-channel-banks";
  banks.renderOrder = 4;
  banks.receiveShadow = true;
  naturalElements.add(banks);
}

function addCoastalEstuary() {
  const estuary = new THREE.Mesh(
    createEstuaryStripGeometry(riverSeaTransitionPath),
    riverMaterial,
  );
  estuary.name = "river-sea-estuary";
  estuary.renderOrder = 5;
  naturalElements.add(estuary);
}

function addCoastalEstuaryBanks() {
  const banks = new THREE.Mesh(
    createEstuaryBankGeometry(riverSeaTransitionPath),
    riverBankMaterial,
  );
  banks.name = "tapered-natural-estuary-banks";
  banks.renderOrder = 4;
  banks.receiveShadow = true;
  naturalElements.add(banks);
}

addMountainFoothillBlend();
addClippedMountain();
addSnowCappedMountain();
addReservoirBasin();
addReservoirLake();
addDamAbutments();
addDam();
addRiverChannelBanks();
addCoastalEstuaryBanks();
addRiver();
addCoastalEstuary();

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", handleResize);

function updateCategoryVisibility() {
  naturalElements.visible = naturalToggle?.checked ?? true;
  artificialElements.visible = artificialToggle?.checked ?? true;

  const helpVisible = helpToggle?.checked ?? true;
  if (compass) {
    compass.hidden = !helpVisible;
  }
  if (axisScale) {
    axisScale.hidden = !helpVisible;
  }
}

function formatScaleMeasure(measureM: number) {
  if (measureM >= 1_000) {
    return `${(measureM / 1_000).toFixed(2)} km`;
  }

  return `${Math.round(measureM)} m`;
}

function updateScaleMeasureLabels() {
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

naturalToggle?.addEventListener("change", updateCategoryVisibility);
artificialToggle?.addEventListener("change", updateCategoryVisibility);
helpToggle?.addEventListener("change", updateCategoryVisibility);
updateCategoryVisibility();
updateScaleMeasureLabels();

window.__SITY_DEBUG__ = {
  getSiteLayout: () => ({
    unit: "meter",
    mainBoundaryAreaM2: MAIN_BOUNDARY_AREA_M2,
    mainBoundarySideM: MAIN_BOUNDARY_SIDE_M,
    mainlandWestMarginM: MAINLAND_WEST_MARGIN_M,
    mainlandEastMarginM: MAINLAND_EAST_MARGIN_M,
    mainlandNorthSouthMarginM: MAINLAND_NORTH_SOUTH_MARGIN_M,
  }),
  getNaturalFeatures: () => ({
    mountain: {
      corner: "southwest",
      maxHeightM: MOUNTAIN_HEIGHT_M,
      clippedToMainBoundary: true,
      foothillBlendHeightM: MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M,
      surfaceLiftM: MOUNTAIN_SURFACE_LIFT_M,
    },
    snowMountain: {
      center: snowMountainCenter,
      corner: "southwest",
      maxHeightM: SNOW_MOUNTAIN_HEIGHT_M,
      radiusXM: SNOW_MOUNTAIN_RADIUS_X_M,
      radiusZM: SNOW_MOUNTAIN_RADIUS_Z_M,
      clippedToMainBoundary: true,
      centerOutsideMainBoundary:
        snowMountainCenter.x < mainBoundaryMinX && snowMountainCenter.z < mainBoundaryMinZ,
      estimatedVisiblePortion: estimateSnowMountainVisiblePortion(),
      solidCutFaces: true,
      foothillBlendHeightM: SNOW_MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M,
      higherThanReservoirMountain: SNOW_MOUNTAIN_HEIGHT_M > MOUNTAIN_HEIGHT_M,
      separateFromReservoirMountain:
        Math.hypot(
          snowMountainCenter.x - mountainCenter.x,
          snowMountainCenter.z - mountainCenter.z,
        ) > 800,
      hasSnowCap: true,
      snowLineM: SNOW_MOUNTAIN_SNOWLINE_M,
    },
    river: {
      source: riverPath[0],
      mouth: riverMouth,
      sourceWidthM: RIVER_SOURCE_WIDTH_M,
      widthM: RIVER_WIDTH_M,
      hasCarvedChannel: true,
      channelBankWidthM: RIVER_CHANNEL_BANK_WIDTH_M,
      channelReliefM: RIVER_CHANNEL_CREST_RISE_M + RIVER_CHANNEL_INNER_DROP_M,
    },
    estuary: {
      start: riverSeaTransitionPath[0],
      end: riverSeaTransitionPath[riverSeaTransitionPath.length - 1],
      extendsPastCoastlineM:
        riverSeaTransitionPath[riverSeaTransitionPath.length - 1].x - mainBoundaryMaxX,
      hasSlopedBanks: true,
      banksTaperIntoSea: true,
    },
    reservoir: {
      center: reservoirCenter,
      radiusXM: RESERVOIR_RADIUS_X_M,
      radiusZM: RESERVOIR_RADIUS_Z_M,
      enclosedByNaturalBank: true,
      damOpeningWidthM: DAM_BANK_OPENING_HALF_LENGTH_M * 2,
      clippedAtDam: true,
    },
    dam: {
      center: damCenter,
      upstreamEdge: damUpstreamEdge,
      downstreamEdge: damDownstreamEdge,
      lengthM: DAM_LENGTH_M,
      heightM: DAM_HEIGHT_M,
      curved: true,
      abuttedByNaturalTerrain: true,
    },
    coast: {
      hasVolumetricTerrain: true,
      terrainSlabThicknessM: MAIN_BOUNDARY_TERRAIN_THICKNESS_M,
      mainlandCoastSimple: true,
      parallelCoastEdges: true,
      hasIntegratedRiverBeach: true,
      hasWetSandBand: true,
      beachBoundedByNorthRiverBank: true,
      hasVolumetricBeach: true,
      hasRaisedWaterfrontStructures: true,
      hasPierSupportPiles: true,
      pierSupportPileCount:
        ATTRACTION_PIER_SUPPORT_COLUMNS * ATTRACTION_PIER_SUPPORT_ROWS +
        PRIVATE_MARINA_SUPPORT_PILE_COUNT,
      hasCargoPortEquipment: true,
      cargoContainerCount: CARGO_CONTAINER_COUNT,
      cargoCraneCount: CARGO_CRANE_COUNT,
      wetSandWidthM: WET_SAND_WIDTH_M,
      beachOppositePier: true,
      hasLongWoodenAttractionPier: true,
      attractionPierLengthM: ATTRACTION_PIER_LENGTH_M,
      pierDeckThicknessM: PIER_DECK_THICKNESS_M,
      hasConcreteShipPort: true,
      cargoPortHeightM: CARGO_PORT_HEIGHT_M,
      cargoShipBerthCount: CARGO_SHIP_BERTH_COUNT,
      cargoBerthDockLengthM: CARGO_BERTH_DOCK_LENGTH_M,
      cargoShipHullLengthM: CARGO_SHIP_HULL_LENGTH_M,
      cargoShipCenterOffsetFromPortEdgeM: CARGO_SHIP_CENTER_OFFSET_FROM_PORT_EDGE_M,
      cargoShipWaterGapM: CARGO_SHIP_WATER_GAP_M,
      hasPrivateMarina: true,
      privateBerthCount: PRIVATE_MARINA_BERTH_COUNT,
    },
  }),
  getCategoryVisibility: () => ({
    natural: naturalElements.visible,
    artificial: artificialElements.visible,
    help: (compass ? !compass.hidden : true) && (axisScale ? !axisScale.hidden : true),
  }),
  getCompassBearingDegrees: () => compassBearingDegrees,
  getAxisScale: () => ({
    unit: "meter",
    visible: axisScale ? getComputedStyle(axisScale).display !== "none" : false,
    xMeasureM: SCALE_X_MEASURE_M,
    yMeasureM: SCALE_Y_MEASURE_M,
    zMeasureM: SCALE_Z_MEASURE_M,
    axisAnglesDegrees: scaleAxisAnglesDegrees,
  }),
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

function updateAxisScale() {
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

function animate() {
  controls.update();
  updateCompass();
  updateAxisScale();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
