import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";

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
          hasErosionEdges: boolean;
          hasReedClusters: boolean;
          reedClusterCount: number;
          hasPebbleFields: boolean;
          pebbleCount: number;
        };
        estuary: {
          start: { x: number; z: number };
          end: { x: number; z: number };
          extendsPastCoastlineM: number;
          hasSlopedBanks: boolean;
          banksTaperIntoSea: boolean;
          hasSeamlessSeaBlend: boolean;
          blendStartsBeforeCoastlineM: number;
          fadeLengthM: number;
          finalWaterHeightDeltaM: number;
        };
        reservoir: {
          center: { x: number; z: number };
          radiusXM: number;
          radiusZM: number;
          hasVolumetricWater: boolean;
          waterDepthM: number;
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
          hasCrestRail: boolean;
          hasSpillwayGates: boolean;
          spillwayGateCount: number;
          hasServiceGallery: boolean;
        };
        realism: {
          qualityProfile: string;
          hasToneMappedRenderer: boolean;
          hasProceduralMaterialTextures: boolean;
          hasWaterSurfaceBump: boolean;
          hasAnimatedWaterMaterial: boolean;
          hasShaderWater: boolean;
          hasPostprocessingComposer: boolean;
          hasSsao: boolean;
          hasBloom: boolean;
          hasPbrEnvironmentMap: boolean;
          hasPhysicalSky: boolean;
          usesUnifiedSeaWaterMaterial: boolean;
          allWaterUsesExactSeaShader: boolean;
          sharedWaterMaterialName: string;
          waterTextureVariantCount: number;
          unifiedWaterSurfaceCount: number;
          hasTerrainDisplacementMesh: boolean;
          hasTerrainSplatShader: boolean;
          terrainReliefHeightM: number;
          hasVisibleLowlandRelief: boolean;
          hasMountainSurfaceShader: boolean;
          hasMountainStrataRidges: boolean;
          mountainStrataRidgeCount: number;
          hasSnowCapOverlay: boolean;
          hasTalusFields: boolean;
          talusBoulderCount: number;
          hasDepthAwareWaterShaders: boolean;
          hasShorelineFoamShader: boolean;
          hasPlanarSurfaceUvs: boolean;
          usesRoundedBuiltGeometry: boolean;
          hasContactShadowPlanes: boolean;
          hasWeatheringDecals: boolean;
          hasNaturalRockClusters: boolean;
          naturalRockClusterCount: number;
          hasAssetPipelineScaffold: boolean;
          hasAssetManifest: boolean;
          hasImportedTextureAssets: boolean;
          importedTextureCount: number;
          hasPbrTextureMaps: boolean;
          pbrTextureMapCount: number;
          hasImportedModelAssets: boolean;
          importedModelSourceCount: number;
          importedModelInstanceCount: number;
          importedAssetKinds: string[];
          textureAssetKinds: string[];
          assetLoadComplete: boolean;
          assetLoadFailures: string[];
          hasGltfLoader: boolean;
          hasKtx2Loader: boolean;
          hasDracoLoader: boolean;
          hasMeshoptDecoder: boolean;
          hasDecoderRuntimeAssets: boolean;
          supportedAssetFormats: string[];
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
          hasConcreteSeams: boolean;
          cargoPortSeamCount: number;
          hasQuayFenders: boolean;
          quayFenderCount: number;
          hasMarinaCleats: boolean;
          marinaCleatCount: number;
          wetSandWidthM: number;
          hasShallowWaterShelf: boolean;
          shallowWaterShelfWidthM: number;
          hasShorelineFoam: boolean;
          beachFoamStripCount: number;
          hasBeachDunes: boolean;
          beachDuneCount: number;
          beachGrassClusterCount: number;
          hasBeachShells: boolean;
          beachShellCount: number;
          hasBeachAmenities: boolean;
          beachUmbrellaCount: number;
          beachSunbedCount: number;
          beachTowelCount: number;
          hasBeachVolleyballCourt: boolean;
          hasLifeguardTower: boolean;
          hasBeachAccessBoardwalk: boolean;
          hasBeachShowers: boolean;
          hasBeachSafetyFlags: boolean;
          beachTrashBinCount: number;
          beachAmenitiesAvoidWetSand: boolean;
          beachDetailsInsideVisibleBoundary: boolean;
          beachDryDetailSeaMarginM: number;
          beachOppositePier: boolean;
          hasLongWoodenAttractionPier: boolean;
          attractionPierLengthM: number;
          pierDeckThicknessM: number;
          hasPierRailings: boolean;
          pierRailPostCount: number;
          hasPierUnderstructure: boolean;
          pierBeamCount: number;
          hasConcreteShipPort: boolean;
          cargoPortHeightM: number;
          cargoShipBerthCount: number;
          cargoBerthDockLengthM: number;
          cargoShipHullLengthM: number;
          cargoShipCenterOffsetFromPortEdgeM: number;
          cargoShipWaterGapM: number;
          hasAssetStyleVessels: boolean;
          vesselLodCount: number;
          hasPrivateMarina: boolean;
          privateBerthCount: number;
        };
      };
      getRoadNetwork: () => {
        roads: Array<{
          id: string;
          type: string;
          closedLoop: boolean;
          lanesPerDirection: number;
          totalLaneCount: number;
          laneWidthM: number;
          totalRoadWidthM: number;
          features: {
            crossesDam: boolean;
            hasMountainTunnel: boolean;
            reachesPort: boolean;
            hasRiverBridge: boolean;
            hasCableStayedBridge: boolean;
          hasBridgeStayCables: boolean;
          roadFitsDam: boolean;
          hasTireWearStrips: boolean;
          hasContinuousSideBarriers: boolean;
          hasExpansionJoints: boolean;
          expansionJointCount: number;
          hasRoadCrackDecals: boolean;
          roadCrackCount: number;
          hasDrainageChannels: boolean;
          hasReflectorPosts: boolean;
          reflectorPostCount: number;
          hasTunnelLiningRibs: boolean;
          tunnelLiningRibCount: number;
        };
        }>;
        lanePaths: Array<{
          id: string;
          roadId: string;
          direction: "clockwise" | "counterclockwise";
          laneIndex: number;
          centerOffsetM: number;
          pointCount: number;
          closedLoop: boolean;
        }>;
        directedLanePathCount: number;
        graph: {
          nodeCount: number;
          allLanePathsClosed: boolean;
          laneDirections: Array<"clockwise" | "counterclockwise">;
        };
      };
      getCategoryVisibility: () => {
        natural: boolean;
        artificial: boolean;
        roads: boolean;
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
      getPerformance: () => {
        drawCalls: number;
        triangles: number;
        rendererDrawCalls: number;
        rendererTriangles: number;
        postprocessingPassCount: number;
        usesComposer: boolean;
      };
    };
    __SITY_ASSETS_READY__?: Promise<void>;
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
const roadsToggle = document.querySelector<HTMLInputElement>("#toggle-roads");
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
const POSTPROCESS_AO_SCALE = 0.62;
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
const HIGHWAY_ASPHALT_COLOR = 0x64696c;
const HIGHWAY_SHOULDER_COLOR = 0x4d5254;
const HIGHWAY_MEDIAN_COLOR = 0x7d7a70;
const ROAD_MARKING_WHITE_COLOR = 0xe8ece6;
const ROAD_MARKING_YELLOW_COLOR = 0xe5c94f;
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
const RESERVOIR_WATER_DEPTH_M = 28;
const RESERVOIR_WATER_DAM_FACE_SETBACK_M = 1.4;
const RESERVOIR_DAM_OPENING_HALF_ANGLE_RAD = 0.72;
const RESERVOIR_DAM_FACE_SAMPLES = 18;
const RESERVOIR_BANK_SEGMENTS = 72;
const RESERVOIR_BANK_INNER_SCALE = 0.92;
const RESERVOIR_BANK_CREST_SCALE = 1.07;
const RESERVOIR_BANK_OUTER_SCALE = 1.26;
const DAM_LENGTH_M = 180;
const DAM_HEIGHT_M = 46;
const DAM_THICKNESS_M = 36;
const DAM_CURVE_SEGMENTS = 18;
const DAM_CURVE_BOW_M = 10;
const DAM_UPSTREAM_FACE_OFFSET_M = 2;
const DAM_BANK_OPENING_MARGIN_M = 8;
const DAM_BANK_OPENING_HALF_LENGTH_M = DAM_LENGTH_M * 0.5 + DAM_BANK_OPENING_MARGIN_M;
const DAM_WATER_FACE_END_INSET_M = 5;
const DAM_WATER_FACE_HALF_LENGTH_M = DAM_LENGTH_M * 0.5 - DAM_WATER_FACE_END_INSET_M;
const DAM_NATURAL_BANK_OPENING_HALF_LENGTH_M = DAM_LENGTH_M * 0.5 + 2;
const DAM_ABUTMENT_OUTER_LENGTH_M = 32;
const DAM_ABUTMENT_FLARE_M = 28;
const DAM_ABUTMENT_CREST_RISE_M = 18;
const SEA_SHADER_WATER_COLOR = 0x1f7da9;
const COASTAL_INLET_OVERLAP_M = 92;
const ESTUARY_SEA_BLEND_START_OFFSET_M = -42;
const ESTUARY_SEA_BLEND_END_OFFSET_M = COASTAL_INLET_OVERLAP_M + 150;
const COAST_SURFACE_Y = GRASS_SURFACE_Y + 0.08;
const PLATFORM_SURFACE_Y = GRASS_SURFACE_Y + 0.32;
const BEACH_INLAND_WIDTH_M = 160;
const WET_SAND_WIDTH_M = 30;
const BEACH_THICKNESS_M = 1.3;
const WET_SAND_THICKNESS_M = 0.7;
const BEACH_FOAM_STRIP_COUNT = 7;
const BEACH_DRY_DETAIL_SEA_MARGIN_M = WET_SAND_WIDTH_M + 22;
const BEACH_DRY_DETAIL_INLAND_MARGIN_M = 18;
const BEACH_DETAIL_NORTH_MARGIN_M = 54;
const BEACH_DETAIL_RIVER_MARGIN_M = 230;
const BEACH_DUNE_COUNT = 16;
const BEACH_GRASS_CLUSTER_COUNT = 40;
const BEACH_UMBRELLA_COUNT = 12;
const BEACH_SUNBED_COUNT = 24;
const BEACH_TOWEL_COUNT = 10;
const BEACH_TRASH_BIN_COUNT = 4;
const NATURAL_ROCK_CLUSTER_COUNT = 36;
const BEACH_SHELL_COUNT = 72;
const RIVER_REED_CLUSTER_COUNT = 96;
const RIVER_PEBBLE_COUNT = 96;
const SHALLOW_WATER_SHELF_WIDTH_M = 360;
const MICRO_TERRAIN_GRID_SEGMENTS = 116;
const MICRO_TERRAIN_HEIGHT_M = 8.5;
const MICRO_TERRAIN_OPACITY = 1;
const MOUNTAIN_STRATA_RIDGE_COUNT = 8;
const SNOW_MOUNTAIN_STRATA_RIDGE_COUNT = 10;
const MOUNTAIN_TALUS_BOULDER_COUNT = 78;
const SNOW_MOUNTAIN_TALUS_BOULDER_COUNT = 126;
const LOWLAND_GRASS_TUFT_COUNT = 280;
const LOWLAND_SCRUB_COUNT = 150;
const ATTRACTION_PIER_LENGTH_M = 420;
const ATTRACTION_PIER_DEPTH_M = 180;
const ATTRACTION_PIER_LAND_OVERLAP_M = 55;
const ATTRACTION_PIER_RIVER_OFFSET_M = 272;
const PIER_DECK_THICKNESS_M = 5;
const ATTRACTION_PIER_SUPPORT_COLUMNS = 5;
const ATTRACTION_PIER_SUPPORT_ROWS = 3;
const ATTRACTION_PIER_RAIL_POST_COUNT = 42;
const ATTRACTION_PIER_BEAM_COUNT = 22;
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
const CARGO_PORT_SEAM_COUNT = 12;
const QUAY_FENDER_COUNT = 10;
const PRIVATE_MARINA_RIVER_OFFSET_M = 477;
const PRIVATE_MARINA_BERTH_COUNT = 4;
const ASSET_STYLE_VESSEL_COUNT = CARGO_SHIP_BERTH_COUNT + PRIVATE_MARINA_BERTH_COUNT;
const MARINA_DOCK_THICKNESS_M = 2.2;
const MARINA_CLEAT_COUNT = PRIVATE_MARINA_BERTH_COUNT * 4 + 4;
const CARGO_BERTH_DOCK_LENGTH_M = 80;
const CARGO_BERTH_DOCK_THICKNESS_M = 3;
const CARGO_SHIP_CENTER_OFFSET_FROM_PORT_EDGE_M =
  CARGO_BERTH_DOCK_LENGTH_M + CARGO_SHIP_HULL_LENGTH_M * 0.5 + CARGO_SHIP_WATER_GAP_M;
const PRIVATE_MARINA_SUPPORT_PILE_COUNT = PRIVATE_MARINA_BERTH_COUNT * 2 + 4;
const HIGHWAY_LANES_PER_DIRECTION = 2;
const HIGHWAY_LANE_WIDTH_M = 3.8;
const HIGHWAY_MEDIAN_WIDTH_M = 5;
const HIGHWAY_SHOULDER_WIDTH_M = 3;
const HIGHWAY_TOTAL_LANE_COUNT = HIGHWAY_LANES_PER_DIRECTION * 2;
const HIGHWAY_TOTAL_WIDTH_M =
  HIGHWAY_TOTAL_LANE_COUNT * HIGHWAY_LANE_WIDTH_M +
  HIGHWAY_MEDIAN_WIDTH_M +
  HIGHWAY_SHOULDER_WIDTH_M * 2;
const HIGHWAY_SAMPLE_COUNT = 224;
const HIGHWAY_DECK_THICKNESS_M = 1.2;
const HIGHWAY_TUNNEL_PORTAL_WIDTH_M = HIGHWAY_TOTAL_WIDTH_M + 18;
const HIGHWAY_TUNNEL_PORTAL_HEIGHT_M = 32;
const HIGHWAY_TUNNEL_ROCK_COLLAR_WIDTH_M = HIGHWAY_TUNNEL_PORTAL_WIDTH_M + 28;
const HIGHWAY_TUNNEL_ROCK_COLLAR_HEIGHT_M = HIGHWAY_TUNNEL_PORTAL_HEIGHT_M + 18;
const HIGHWAY_TUNNEL_ROCK_SLEEVE_DEPTH_M = 58;
const HIGHWAY_TUNNEL_DARK_MASK_DEPTH_M = 30;
const HIGHWAY_TUNNEL_MOUTH_SHADOW_WIDTH_M = HIGHWAY_TOTAL_WIDTH_M + 7;
const HIGHWAY_TUNNEL_MOUTH_SHADOW_HEIGHT_M = HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 7;
const HIGHWAY_TUNNEL_NORTH_EXIT_PORTAL_OUTSET_M = 32;
const HIGHWAY_TUNNEL_ENTRY_CONTROL_INDEX = 7;
const HIGHWAY_TUNNEL_EXIT_CONTROL_INDEX = 11;
const HIGHWAY_RIVER_BRIDGE_START_CONTROL_INDEX = 15;
const HIGHWAY_RIVER_BRIDGE_END_CONTROL_INDEX = 18;
const HIGHWAY_SUPPORT_SPACING_M = 240;
const HIGHWAY_BRIDGE_TOWER_HEIGHT_M = 78;
const HIGHWAY_BRIDGE_TOWER_WIDTH_M = 7.5;
const HIGHWAY_BRIDGE_TOWER_SIDE_OFFSET_M = HIGHWAY_TOTAL_WIDTH_M * 0.5 + 9;
const HIGHWAY_BRIDGE_DECK_CABLE_ANCHOR_OFFSET_M = HIGHWAY_TOTAL_WIDTH_M * 0.5 - 2.2;
const HIGHWAY_BRIDGE_DECK_CABLE_ANCHOR_LIFT_M = 0.18;
const HIGHWAY_BRIDGE_STAY_FAN_REACH_PROGRESS = 0.2;
const HIGHWAY_BRIDGE_STAY_CABLE_COUNT_PER_FAN = 5;
const HIGHWAY_BRIDGE_STAY_CABLE_RADIUS_M = 0.82;
const HIGHWAY_DASH_SEGMENTS = 1;
const HIGHWAY_DASH_GAP_SEGMENTS = 1;
const HIGHWAY_EXPANSION_JOINT_COUNT = 18;
const HIGHWAY_CRACK_DECAL_COUNT = 56;
const HIGHWAY_REFLECTOR_POST_COUNT = 48;
const HIGHWAY_TUNNEL_LINING_RIB_COUNT_PER_PORTAL = 5;
const DAM_SPILLWAY_GATE_COUNT = 5;
const DAM_CREST_RAIL_POST_COUNT = 18;
const ASSET_PIPELINE_SUPPORTED_FORMATS = ["glb", "gltf", "ktx2", "drc", "meshopt"] as const;
const UNIFIED_SEA_WATER_SURFACE_COUNT = 5;
const ASSET_MANIFEST_URL = "/assets/sity/asset-manifest.json";
const TEXTURE_ASSET_KEYS = [
  "grass_meadow_albedo",
  "asphalt_aggregate_albedo",
  "concrete_weathered_albedo",
  "sand_dry_albedo",
  "sand_wet_albedo",
  "rock_strata_albedo",
  "wood_planks_albedo",
  "sea_ripple_albedo",
  "metal_worn_albedo",
] as const;
const IMPORTED_MODEL_KINDS = ["cargoShip", "privateBoat"] as const;
const HIGH_END_QUALITY_PROFILE = "cinematic-pbr-terrain-water";
const SCALE_X_MEASURE_M = MAIN_BOUNDARY_SIDE_M;
const SCALE_Y_MEASURE_M = SNOW_MOUNTAIN_HEIGHT_M;
const SCALE_Z_MEASURE_M = MAIN_BOUNDARY_SIDE_M;

const mainBoundaryCenterX = 0;
const mainBoundaryCenterZ = 0;
const mainBoundaryMinX = mainBoundaryCenterX - MAIN_BOUNDARY_SIDE_M / 2;
const mainBoundaryMaxX = mainBoundaryCenterX + MAIN_BOUNDARY_SIDE_M / 2;
const mainBoundaryMinZ = mainBoundaryCenterZ - MAIN_BOUNDARY_SIDE_M / 2;
const mainBoundaryMaxZ = mainBoundaryCenterZ + MAIN_BOUNDARY_SIDE_M / 2;
const estuarySeaBlendStartX = mainBoundaryMaxX + ESTUARY_SEA_BLEND_START_OFFSET_M;
const estuarySeaBlendEndX = mainBoundaryMaxX + ESTUARY_SEA_BLEND_END_OFFSET_M;

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
const animationClock = new THREE.Clock();

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
renderer.toneMappingExposure = 0.92;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const textureLoader = new THREE.TextureLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/assets/sity/decoders/draco/gltf/");
const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath("/assets/sity/decoders/basis/");
ktx2Loader.detectSupport(renderer);
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.setKTX2Loader(ktx2Loader);
gltfLoader.setMeshoptDecoder(MeshoptDecoder);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb8d7e6);
scene.fog = new THREE.Fog(0xb8d7e6, 9_500, 18_500);
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const environmentMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = environmentMap;
scene.environmentIntensity = 0.58;

const naturalElements = new THREE.Group();
naturalElements.name = "natural-elements";
scene.add(naturalElements);

const artificialElements = new THREE.Group();
artificialElements.name = "artificial-elements";
scene.add(artificialElements);

const roadElements = new THREE.Group();
roadElements.name = "road-elements";
scene.add(roadElements);

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

const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x8dbb86, 1.55);
scene.add(hemisphereLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.25);
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

const sky = new Sky();
sky.name = "physical-atmosphere-sky";
sky.scale.setScalar(120_000);
const skyUniforms = sky.material.uniforms;
skyUniforms.turbidity.value = 7.6;
skyUniforms.rayleigh.value = 1.85;
skyUniforms.mieCoefficient.value = 0.004;
skyUniforms.mieDirectionalG.value = 0.78;
skyUniforms.sunPosition.value.copy(sunLight.position).normalize();
scene.add(sky);

const composer = new EffectComposer(renderer);
composer.setSize(window.innerWidth, window.innerHeight);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const ssaoPass = new SSAOPass(
  scene,
  camera,
  window.innerWidth * POSTPROCESS_AO_SCALE,
  window.innerHeight * POSTPROCESS_AO_SCALE,
  16,
);
ssaoPass.kernelRadius = 12;
ssaoPass.minDistance = 0.0015;
ssaoPass.maxDistance = 0.18;
composer.addPass(ssaoPass);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.08,
  0.34,
  0.82,
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

function createSpeckledTexture(
  name: string,
  baseColor: number,
  speckleColors: number[],
  size = 256,
  repeat = 24,
) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext("2d");

  if (!context) {
    throw new Error(`Could not create ${name} texture.`);
  }

  context.fillStyle = `#${baseColor.toString(16).padStart(6, "0")}`;
  context.fillRect(0, 0, size, size);

  for (let index = 0; index < size * 10; index += 1) {
    const color = speckleColors[index % speckleColors.length];
    const radius = 0.7 + ((index * 13) % 7) * 0.18;
    const x = (index * 47 + Math.sin(index) * 91) % size;
    const y = (index * 83 + Math.cos(index * 0.7) * 67) % size;
    context.globalAlpha = 0.16 + ((index * 11) % 9) * 0.025;
    context.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
    context.beginPath();
    context.arc((x + size) % size, (y + size) % size, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.name = name;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 8;
  return texture;
}

function createLinearTexture(
  name: string,
  baseColor: number,
  stripeColor: number,
  size = 256,
  repeatX = 12,
  repeatY = 12,
  stripeEvery = 28,
) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext("2d");

  if (!context) {
    throw new Error(`Could not create ${name} texture.`);
  }

  context.fillStyle = `#${baseColor.toString(16).padStart(6, "0")}`;
  context.fillRect(0, 0, size, size);
  context.strokeStyle = `#${stripeColor.toString(16).padStart(6, "0")}`;
  context.globalAlpha = 0.32;
  context.lineWidth = 2;

  for (let line = -size; line < size * 2; line += stripeEvery) {
    context.beginPath();
    context.moveTo(line, 0);
    context.lineTo(line + size, size);
    context.stroke();
  }

  context.globalAlpha = 0.14;
  for (let index = 0; index < 120; index += 1) {
    const x = (index * 37) % size;
    const y = (index * 61) % size;
    context.fillRect(x, y, 1 + (index % 5), 1);
  }

  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.name = name;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 8;
  return texture;
}

function createWaterNormalTexture(name: string, size = 256) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext("2d");

  if (!context) {
    throw new Error(`Could not create ${name} texture.`);
  }

  const imageData = context.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const waveA = Math.sin(x * 0.12 + y * 0.045);
      const waveB = Math.cos(x * 0.035 - y * 0.16);
      const waveC = Math.sin((x + y) * 0.055);
      const nx = Math.round(128 + waveA * 38 + waveC * 18);
      const ny = Math.round(128 + waveB * 34 - waveC * 14);
      const offset = (y * size + x) * 4;
      imageData.data[offset] = THREE.MathUtils.clamp(nx, 0, 255);
      imageData.data[offset + 1] = THREE.MathUtils.clamp(ny, 0, 255);
      imageData.data[offset + 2] = 224;
      imageData.data[offset + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.name = name;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(18, 18);
  texture.anisotropy = 8;
  return texture;
}

function addPlanarXZUVs(geometry: THREE.BufferGeometry, textureScaleM = 80) {
  const position = geometry.getAttribute("position");
  const uvs: number[] = [];

  for (let index = 0; index < position.count; index += 1) {
    uvs.push(position.getX(index) / textureScaleM, position.getZ(index) / textureScaleM);
  }

  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
}

const grassTexture = createSpeckledTexture("grass-varied-ground-texture", GRASS_COLOR, [
  0x7fb567,
  0xa6d28b,
  0x6f9f58,
  0xb0d79a,
], 256, 34);
const mainlandTexture = createSpeckledTexture("outside-mainland-muted-ground-texture", 0x9da19b, [
  0x8f958d,
  0xb0b4ab,
  0x7f857c,
], 256, 28);
const terrainCutTexture = createSpeckledTexture("earth-cut-strata-texture", 0x68705d, [
  0x575d4e,
  0x7b806e,
  0x4f5448,
], 256, 18);
const drySandTexture = createSpeckledTexture("dry-sand-grain-texture", BEACH_SAND_COLOR, [
  0xc8b275,
  0xead99c,
  0xbda66e,
], 256, 26);
const wetSandTexture = createSpeckledTexture("wet-sand-grain-texture", WET_SAND_COLOR, [
  0xa69668,
  0xc6b783,
  0x8f805d,
], 256, 18);
const asphaltTexture = createSpeckledTexture("asphalt-aggregate-texture", HIGHWAY_ASPHALT_COLOR, [
  0x53585a,
  0x747a7d,
  0x3f4446,
], 256, 36);
const concreteTexture = createSpeckledTexture("weathered-concrete-texture", CONCRETE_PORT_COLOR, [
  0x8a867b,
  0xb0aa9a,
  0x777368,
], 256, 16);
const woodTexture = createLinearTexture("weathered-wood-plank-texture", WOOD_PIER_COLOR, 0x5f4d38, 256, 10, 8, 34);
const metalTexture = createSpeckledTexture("dull-metal-wear-texture", 0x596368, [
  0x485155,
  0x727d82,
  0x30383b,
], 256, 10);
const darkWearTexture = createSpeckledTexture("dark-weathering-decal-texture", 0x2f302d, [
  0x1f211f,
  0x454640,
  0x555149,
], 256, 12);
const waterNormalTexture = createWaterNormalTexture("generated-water-normal-map");

function createSharedSeaWaterMaterial() {
  return new THREE.ShaderMaterial({
    name: "sity-shared-sea-water-shader",
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        sityTime: { value: 0 },
        normalSampler: { value: waterNormalTexture },
        waterColor: { value: new THREE.Color(SEA_SHADER_WATER_COLOR) },
        deepWaterColor: { value: new THREE.Color(0x0d4966) },
        sunColor: { value: new THREE.Color(0xffffff) },
        sunDirection: { value: sunLight.position.clone().normalize() },
      },
    ]),
    vertexShader: `
      varying vec3 vSityWaterWorldPosition;
      varying vec2 vSityWaterUv;
      #include <common>
      #include <fog_pars_vertex>

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vSityWaterWorldPosition = worldPosition.xyz;
        vSityWaterUv = uv;
        vec4 mvPosition = viewMatrix * worldPosition;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      uniform float sityTime;
      uniform sampler2D normalSampler;
      uniform vec3 waterColor;
      uniform vec3 deepWaterColor;
      uniform vec3 sunColor;
      uniform vec3 sunDirection;
      varying vec3 vSityWaterWorldPosition;
      varying vec2 vSityWaterUv;
      #include <common>
      #include <fog_pars_fragment>

      void main() {
        vec2 worldUv = vSityWaterWorldPosition.xz * 0.006;
        vec3 normalA = texture2D(normalSampler, worldUv + vec2(sityTime * 0.018, sityTime * 0.011)).rgb * 2.0 - 1.0;
        vec3 normalB = texture2D(normalSampler, worldUv * 1.73 - vec2(sityTime * 0.012, sityTime * 0.017)).rgb * 2.0 - 1.0;
        vec3 surfaceNormal = normalize(vec3((normalA.r + normalB.r) * 0.42, 1.45, (normalA.g + normalB.g) * 0.42));
        vec3 viewDirection = normalize(cameraPosition - vSityWaterWorldPosition);
        float fresnel = pow(1.0 - clamp(dot(surfaceNormal, viewDirection), 0.0, 1.0), 3.0);
        float ripple = sin(vSityWaterWorldPosition.x * 0.045 + vSityWaterWorldPosition.z * 0.031 + sityTime * 1.2) * 0.5 + 0.5;
        float sunSpecular = pow(max(dot(reflect(-normalize(sunDirection), surfaceNormal), viewDirection), 0.0), 96.0);
        vec3 baseWater = mix(waterColor, deepWaterColor, 0.34 + ripple * 0.1);
        vec3 skyReflection = mix(vec3(0.54, 0.77, 0.88), sunColor, sunSpecular * 0.55);
        vec3 finalColor = mix(baseWater, skyReflection, 0.32 + fresnel * 0.42);
        finalColor += sunColor * sunSpecular * 0.42;
        gl_FragColor = vec4(finalColor, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
    side: THREE.DoubleSide,
    fog: true,
    depthWrite: false,
  });
}

const sharedSeaWaterMaterial = createSharedSeaWaterMaterial();

const mainlandMaterial = new THREE.MeshStandardMaterial({
  color: 0x9da19b,
  map: mainlandTexture,
  roughness: 0.86,
  metalness: 0,
});
const grassMaterial = new THREE.MeshStandardMaterial({
  color: GRASS_COLOR,
  map: grassTexture,
  roughness: 0.82,
  metalness: 0,
  side: THREE.DoubleSide,
});
const terrainMicroDisplacementMaterial = new THREE.MeshStandardMaterial({
  color: GRASS_COLOR,
  map: grassTexture,
  roughness: 0.86,
  metalness: 0,
  opacity: MICRO_TERRAIN_OPACITY,
  side: THREE.DoubleSide,
  depthWrite: true,
});
const terrainCutMaterial = new THREE.MeshStandardMaterial({
  color: 0x68705d,
  map: terrainCutTexture,
  roughness: 0.92,
  metalness: 0,
  side: THREE.DoubleSide,
});
const beachSandMaterial = new THREE.MeshStandardMaterial({
  color: BEACH_SAND_COLOR,
  map: drySandTexture,
  bumpMap: drySandTexture,
  bumpScale: 0.18,
  roughness: 0.9,
  metalness: 0,
  side: THREE.DoubleSide,
});
const wetSandMaterial = new THREE.MeshStandardMaterial({
  color: WET_SAND_COLOR,
  map: wetSandTexture,
  bumpMap: wetSandTexture,
  bumpScale: 0.08,
  roughness: 0.84,
  metalness: 0.01,
  side: THREE.DoubleSide,
});
const shorelineFoamMaterial = new THREE.MeshStandardMaterial({
  color: 0xe9f1e8,
  roughness: 0.72,
  metalness: 0,
  side: THREE.DoubleSide,
});
const duneSandMaterial = new THREE.MeshStandardMaterial({
  color: 0xc8b577,
  map: drySandTexture,
  bumpMap: drySandTexture,
  bumpScale: 0.2,
  roughness: 0.92,
  metalness: 0,
});
const beachGrassMaterial = new THREE.MeshStandardMaterial({
  color: 0x6f8f4b,
  map: grassTexture,
  roughness: 0.86,
  metalness: 0,
});
const reedMaterial = new THREE.MeshStandardMaterial({
  color: 0x597845,
  map: grassTexture,
  roughness: 0.9,
  metalness: 0,
});
const beachShellMaterial = new THREE.MeshStandardMaterial({
  color: 0xf0e2bc,
  roughness: 0.82,
  metalness: 0,
});
const woodPierMaterial = new THREE.MeshStandardMaterial({
  color: WOOD_PIER_COLOR,
  map: woodTexture,
  bumpMap: woodTexture,
  bumpScale: 0.12,
  roughness: 0.86,
  metalness: 0,
  side: THREE.DoubleSide,
});
const concretePortMaterial = new THREE.MeshStandardMaterial({
  color: CONCRETE_PORT_COLOR,
  map: concreteTexture,
  bumpMap: concreteTexture,
  bumpScale: 0.08,
  roughness: 0.82,
  metalness: 0,
  side: THREE.DoubleSide,
});
const concreteSeamMaterial = new THREE.MeshStandardMaterial({
  color: 0x4d4b45,
  map: darkWearTexture,
  roughness: 0.92,
  metalness: 0,
  transparent: true,
  opacity: 0.62,
});
const dockMaterial = new THREE.MeshStandardMaterial({
  color: DOCK_COLOR,
  map: woodTexture,
  bumpMap: woodTexture,
  bumpScale: 0.1,
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
const beachWhiteMaterial = new THREE.MeshStandardMaterial({
  color: 0xf1eee2,
  roughness: 0.62,
  metalness: 0,
});
const beachUmbrellaMaterials = [
  attractionRedMaterial,
  attractionBlueMaterial,
  attractionYellowMaterial,
  new THREE.MeshStandardMaterial({ color: 0x5aa184, roughness: 0.58, metalness: 0.01 }),
];
const beachTowelMaterials = [
  new THREE.MeshStandardMaterial({ color: 0xd75b4d, roughness: 0.82, metalness: 0 }),
  new THREE.MeshStandardMaterial({ color: 0x3f8fc0, roughness: 0.82, metalness: 0 }),
  new THREE.MeshStandardMaterial({ color: 0xf0d06a, roughness: 0.82, metalness: 0 }),
  new THREE.MeshStandardMaterial({ color: 0x77a66a, roughness: 0.82, metalness: 0 }),
];
const beachFlagMaterial = new THREE.MeshStandardMaterial({
  color: 0xd94d42,
  roughness: 0.62,
  metalness: 0.01,
});
const beachBinMaterial = new THREE.MeshStandardMaterial({
  color: 0x315f63,
  roughness: 0.74,
  metalness: 0.02,
});
const highwayAsphaltMaterial = new THREE.MeshStandardMaterial({
  color: HIGHWAY_ASPHALT_COLOR,
  map: asphaltTexture,
  bumpMap: asphaltTexture,
  bumpScale: 0.05,
  roughness: 0.84,
  metalness: 0.02,
  side: THREE.DoubleSide,
});
const highwaySideMaterial = new THREE.MeshStandardMaterial({
  color: 0x25292a,
  roughness: 0.86,
  metalness: 0.02,
  side: THREE.DoubleSide,
});
const highwayShoulderMaterial = new THREE.MeshStandardMaterial({
  color: HIGHWAY_SHOULDER_COLOR,
  roughness: 0.86,
  metalness: 0.01,
  side: THREE.DoubleSide,
});
const highwayMedianMaterial = new THREE.MeshStandardMaterial({
  color: HIGHWAY_MEDIAN_COLOR,
  map: concreteTexture,
  roughness: 0.88,
  metalness: 0,
  side: THREE.DoubleSide,
});
const highwayTireWearMaterial = new THREE.MeshStandardMaterial({
  color: 0x2c3031,
  roughness: 0.9,
  metalness: 0,
  transparent: true,
  opacity: 0.42,
  side: THREE.DoubleSide,
});
const roadCrackMaterial = new THREE.MeshStandardMaterial({
  color: 0x1f2221,
  map: darkWearTexture,
  roughness: 0.94,
  metalness: 0,
  transparent: true,
  opacity: 0.68,
  side: THREE.DoubleSide,
});
const roadDrainMaterial = new THREE.MeshStandardMaterial({
  color: 0x2a2f31,
  roughness: 0.78,
  metalness: 0.08,
  side: THREE.DoubleSide,
});
const roadMarkingWhiteMaterial = new THREE.MeshStandardMaterial({
  color: ROAD_MARKING_WHITE_COLOR,
  roughness: 0.55,
  metalness: 0,
  side: THREE.DoubleSide,
});
const roadMarkingYellowMaterial = new THREE.MeshStandardMaterial({
  color: ROAD_MARKING_YELLOW_COLOR,
  roughness: 0.55,
  metalness: 0,
  side: THREE.DoubleSide,
});
const roadStructureConcreteMaterial = new THREE.MeshStandardMaterial({
  color: 0x9e9c91,
  map: concreteTexture,
  bumpMap: concreteTexture,
  bumpScale: 0.06,
  roughness: 0.78,
  metalness: 0.02,
  side: THREE.DoubleSide,
});
const bridgeSteelMaterial = new THREE.MeshStandardMaterial({
  color: 0x2d3437,
  map: metalTexture,
  roughness: 0.58,
  metalness: 0.24,
});
const bridgeCableMaterial = new THREE.MeshStandardMaterial({
  color: 0x596368,
  map: metalTexture,
  roughness: 0.42,
  metalness: 0.42,
});
const tunnelOpeningMaterial = new THREE.MeshStandardMaterial({
  color: 0x17191a,
  roughness: 0.95,
  metalness: 0,
  side: THREE.DoubleSide,
});
const rubberFenderMaterial = new THREE.MeshStandardMaterial({
  color: 0x171a1a,
  roughness: 0.78,
  metalness: 0,
});
const safetySignMaterial = new THREE.MeshStandardMaterial({
  color: 0x2d7fa6,
  roughness: 0.62,
  metalness: 0.03,
});
const contactShadowMaterial = new THREE.MeshBasicMaterial({
  color: 0x111412,
  transparent: true,
  opacity: 0.18,
  depthWrite: false,
  side: THREE.DoubleSide,
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
  map: terrainCutTexture,
  bumpMap: terrainCutTexture,
  bumpScale: 0.16,
  roughness: 0.94,
  metalness: 0,
  side: THREE.DoubleSide,
});
const mountainRidgeMaterial = new THREE.MeshStandardMaterial({
  color: 0x8a836d,
  roughness: 0.96,
  metalness: 0,
});
const snowPatchMaterial = new THREE.MeshStandardMaterial({
  color: SNOW_COLOR,
  roughness: 0.68,
  metalness: 0,
  side: THREE.DoubleSide,
});
const smallRockMaterial = new THREE.MeshStandardMaterial({
  color: 0x77715f,
  map: terrainCutTexture,
  roughness: 0.94,
  metalness: 0,
});
const smallPebbleMaterial = new THREE.MeshStandardMaterial({
  color: 0x9b927c,
  map: terrainCutTexture,
  roughness: 0.95,
  metalness: 0,
});
const lowlandScrubMaterial = new THREE.MeshStandardMaterial({
  color: 0x5f7f45,
  map: grassTexture,
  roughness: 0.9,
  metalness: 0,
});
const lowlandDryGrassMaterial = new THREE.MeshStandardMaterial({
  color: 0x8a9a55,
  map: grassTexture,
  roughness: 0.92,
  metalness: 0,
});
const riverBankMaterial = new THREE.MeshStandardMaterial({
  roughness: 0.9,
  metalness: 0,
  vertexColors: true,
  side: THREE.DoubleSide,
});
const damMaterial = new THREE.MeshStandardMaterial({
  color: 0x8d8f8a,
  map: concreteTexture,
  bumpMap: concreteTexture,
  bumpScale: 0.08,
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

type ReservoirLakeBoundaryPoint = GroundPathPoint & {
  isDamFace: boolean;
};

type RoadPathPoint = GroundPathPoint & {
  y: number;
};

type LanePath = {
  id: string;
  roadId: string;
  direction: "clockwise" | "counterclockwise";
  laneIndex: number;
  centerOffsetM: number;
  points: RoadPathPoint[];
};

type XZPlacement = {
  x: number;
  z: number;
};

type XYZPlacement = XZPlacement & {
  y: number;
};

type ScaledXYZPlacement = XYZPlacement & {
  scaleX: number;
  scaleY: number;
  scaleZ: number;
};
type OrientedXYZPlacement = XYZPlacement & {
  rotationY: number;
};
type ScaledOrientedXYZPlacement = OrientedXYZPlacement & {
  scaleX: number;
  scaleY: number;
  scaleZ: number;
};

type ImportedModelKind = (typeof IMPORTED_MODEL_KINDS)[number];

type AssetManifest = {
  version: number;
  units: "meters";
  renderer: "three.js";
  compressionReady: string[];
  decoders?: {
    basis?: string;
    draco?: string;
    meshopt?: string;
  };
  models: Record<ImportedModelKind, string>;
  textures: Record<string, string>;
  pbrTextures?: Record<string, {
    albedo: string;
    normal: string;
    orm: string;
  }>;
};

type TextureAssetTarget = {
  material: THREE.MeshStandardMaterial;
  repeatX: number;
  repeatY: number;
  useAsBump?: boolean;
  normalScale?: number;
  useOrm?: boolean;
};

type ImportedModelAnchor = {
  kind: ImportedModelKind;
  name: string;
  position: THREE.Vector3;
  rotationY: number;
  scale: number;
  fallback: THREE.Object3D;
};

let highwayLoopCenterPath: RoadPathPoint[] = [];
let highwayLoopLanePaths: LanePath[] = [];
let seaWater: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
let assetManifestLoaded = false;
let decoderRuntimeAssetsAvailable = false;
let assetLoadComplete = false;
let importedModelInstanceCount = 0;
let pbrTextureMapCount = 0;
let terrainSplatShaderInstalled = false;
let mountainSurfaceShaderInstalled = false;
let unifiedSeaWaterMaterialInstalled = sharedSeaWaterMaterial instanceof THREE.ShaderMaterial;
let sharedSeaWaterSurfaceCount = 0;
let depthAwareWaterShadersInstalled = false;
let shorelineFoamShaderInstalled = false;
let mountainStrataRidgeMeshCount = 0;
let talusBoulderInstanceCount = 0;
let lowlandGroundCoverInstanceCount = 0;
let snowCapOverlayInstalled = false;
const loadedTextureAssetKeys = new Set<string>();
const importedModelSources = new Map<ImportedModelKind, THREE.Object3D>();
const importedModelAnchors: ImportedModelAnchor[] = [];
const assetLoadFailures: string[] = [];

function installTerrainSplatShader(material: THREE.MeshStandardMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vSityWorldPosition;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvSityWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vSityWorldPosition;
float sityTerrainNoise(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float sityTerrainValueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = sityTerrainNoise(i);
  float b = sityTerrainNoise(i + vec2(1.0, 0.0));
  float c = sityTerrainNoise(i + vec2(0.0, 1.0));
  float d = sityTerrainNoise(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
float sityMacro = sityTerrainValueNoise(vSityWorldPosition.xz * 0.0045);
float sityFine = sityTerrainValueNoise(vSityWorldPosition.xz * 0.026);
float sityCoastalDryness = smoothstep(520.0, 900.0, vSityWorldPosition.x);
float sityPatch = smoothstep(0.42, 0.78, sityMacro * 0.72 + sityFine * 0.28);
vec3 sityDryGrass = vec3(0.56, 0.67, 0.39);
vec3 sityMeadow = vec3(0.39, 0.58, 0.30);
vec3 sitySoil = vec3(0.47, 0.43, 0.31);
diffuseColor.rgb = mix(diffuseColor.rgb, sityMeadow, 0.18);
diffuseColor.rgb = mix(diffuseColor.rgb, sityDryGrass, sityPatch * 0.22);
diffuseColor.rgb = mix(diffuseColor.rgb, sitySoil, sityCoastalDryness * sityPatch * 0.16);`,
      );
  };
  material.needsUpdate = true;
  terrainSplatShaderInstalled = true;
}

function installMountainSurfaceShader(material: THREE.MeshStandardMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vSityMountainWorldPosition;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvSityMountainWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vSityMountainWorldPosition;
float sityMountainNoise(vec2 p) {
  return fract(sin(dot(p, vec2(41.7, 289.3))) * 21943.331);
}
float sityMountainValueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = sityMountainNoise(i);
  float b = sityMountainNoise(i + vec2(1.0, 0.0));
  float c = sityMountainNoise(i + vec2(0.0, 1.0));
  float d = sityMountainNoise(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float sityElevationBand = fract(vSityMountainWorldPosition.y * 0.013 + sityMountainValueNoise(vSityMountainWorldPosition.xz * 0.014) * 0.34);
float sityStrata = smoothstep(0.48, 0.64, sityElevationBand) * (1.0 - smoothstep(0.72, 0.94, sityElevationBand));
float sityVerticalStain = smoothstep(0.62, 0.94, sityMountainValueNoise(vec2(vSityMountainWorldPosition.x * 0.018, vSityMountainWorldPosition.y * 0.028)));
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.78, 0.76, 0.71), sityStrata * 0.17);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.34, 0.32, 0.28), sityVerticalStain * 0.08);`,
      );
  };
  material.needsUpdate = true;
  mountainSurfaceShaderInstalled = true;
}

installTerrainSplatShader(grassMaterial);
installTerrainSplatShader(terrainMicroDisplacementMaterial);
installMountainSurfaceShader(mountainMaterial);

const textureAssetTargets: Record<(typeof TEXTURE_ASSET_KEYS)[number], TextureAssetTarget[]> = {
  grass_meadow_albedo: [
    { material: grassMaterial, repeatX: 34, repeatY: 34 },
    { material: terrainMicroDisplacementMaterial, repeatX: 34, repeatY: 34 },
    { material: beachGrassMaterial, repeatX: 18, repeatY: 18 },
    { material: reedMaterial, repeatX: 18, repeatY: 18 },
    { material: lowlandScrubMaterial, repeatX: 18, repeatY: 18 },
    { material: lowlandDryGrassMaterial, repeatX: 18, repeatY: 18 },
  ],
  asphalt_aggregate_albedo: [
    { material: highwayAsphaltMaterial, repeatX: 36, repeatY: 36, useAsBump: true },
  ],
  concrete_weathered_albedo: [
    { material: concretePortMaterial, repeatX: 16, repeatY: 16, useAsBump: true },
    { material: roadStructureConcreteMaterial, repeatX: 14, repeatY: 14, useAsBump: true },
    { material: damMaterial, repeatX: 12, repeatY: 12, useAsBump: true },
  ],
  sand_dry_albedo: [
    { material: beachSandMaterial, repeatX: 26, repeatY: 26, useAsBump: true },
    { material: duneSandMaterial, repeatX: 22, repeatY: 22, useAsBump: true },
  ],
  sand_wet_albedo: [
    { material: wetSandMaterial, repeatX: 18, repeatY: 18, useAsBump: true },
  ],
  rock_strata_albedo: [
    { material: terrainCutMaterial, repeatX: 18, repeatY: 18, useAsBump: true },
    { material: mountainCutMaterial, repeatX: 16, repeatY: 16, useAsBump: true },
    { material: smallRockMaterial, repeatX: 10, repeatY: 10 },
    { material: smallPebbleMaterial, repeatX: 10, repeatY: 10 },
  ],
  wood_planks_albedo: [
    { material: woodPierMaterial, repeatX: 10, repeatY: 8, useAsBump: true },
    { material: dockMaterial, repeatX: 10, repeatY: 8, useAsBump: true },
  ],
  sea_ripple_albedo: [
  ],
  metal_worn_albedo: [
    { material: bridgeSteelMaterial, repeatX: 10, repeatY: 10 },
    { material: bridgeCableMaterial, repeatX: 8, repeatY: 8 },
    { material: portCraneMaterial, repeatX: 8, repeatY: 8 },
  ],
};

function configureTextureAsset(texture: THREE.Texture, repeatX: number, repeatY: number, colorSpace: THREE.ColorSpace) {
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  texture.needsUpdate = true;
}

function applyTextureAsset(
  textureKey: (typeof TEXTURE_ASSET_KEYS)[number],
  sourceTexture: THREE.Texture,
  normalTexture?: THREE.Texture,
  ormTexture?: THREE.Texture,
) {
  for (const target of textureAssetTargets[textureKey]) {
    const colorMap = sourceTexture.clone();
    colorMap.name = `asset-${textureKey}-color`;
    configureTextureAsset(colorMap, target.repeatX, target.repeatY, THREE.SRGBColorSpace);
    target.material.map = colorMap;
    pbrTextureMapCount += 1;

    if (normalTexture) {
      const normalMap = normalTexture.clone();
      normalMap.name = `asset-${textureKey}-normal`;
      configureTextureAsset(normalMap, target.repeatX, target.repeatY, THREE.NoColorSpace);
      target.material.normalMap = normalMap;
      target.material.normalScale.setScalar(target.normalScale ?? 0.42);
      pbrTextureMapCount += 1;
    } else if (target.useAsBump) {
      const bumpMap = sourceTexture.clone();
      bumpMap.name = `asset-${textureKey}-fallback-bump`;
      configureTextureAsset(bumpMap, target.repeatX, target.repeatY, THREE.NoColorSpace);
      target.material.bumpMap = bumpMap;
      pbrTextureMapCount += 1;
    }

    if (ormTexture && target.useOrm !== false) {
      const roughnessMap = ormTexture.clone();
      roughnessMap.name = `asset-${textureKey}-orm-roughness`;
      configureTextureAsset(roughnessMap, target.repeatX, target.repeatY, THREE.NoColorSpace);
      target.material.roughnessMap = roughnessMap;
      pbrTextureMapCount += 1;

      if (target.material.metalness > 0.02) {
        const metalnessMap = ormTexture.clone();
        metalnessMap.name = `asset-${textureKey}-orm-metalness`;
        configureTextureAsset(metalnessMap, target.repeatX, target.repeatY, THREE.NoColorSpace);
        target.material.metalnessMap = metalnessMap;
        pbrTextureMapCount += 1;
      }
    }

    target.material.needsUpdate = true;
  }
}

async function loadAssetManifest() {
  const response = await fetch(ASSET_MANIFEST_URL);

  if (!response.ok) {
    throw new Error(`Could not load ${ASSET_MANIFEST_URL}: ${response.status}`);
  }

  const manifest = (await response.json()) as AssetManifest;
  assetManifestLoaded = manifest.units === "meters" && manifest.renderer === "three.js";
  decoderRuntimeAssetsAvailable = Boolean(
    manifest.decoders?.basis &&
      manifest.decoders.draco &&
      manifest.decoders.meshopt &&
      manifest.compressionReady.includes("ktx2") &&
      manifest.compressionReady.includes("draco") &&
      manifest.compressionReady.includes("meshopt"),
  );
  return manifest;
}

async function loadTextureAssetPack(manifest: AssetManifest) {
  pbrTextureMapCount = 0;
  await Promise.all(
    TEXTURE_ASSET_KEYS.map(async (textureKey) => {
      const pbrSet = manifest.pbrTextures?.[textureKey];
      const url = pbrSet?.albedo ?? manifest.textures[textureKey];

      if (!url) {
        assetLoadFailures.push(`missing-texture:${textureKey}`);
        return;
      }

      try {
        const [texture, normalTexture, ormTexture] = await Promise.all([
          textureLoader.loadAsync(url),
          pbrSet?.normal ? textureLoader.loadAsync(pbrSet.normal) : Promise.resolve(undefined),
          pbrSet?.orm ? textureLoader.loadAsync(pbrSet.orm) : Promise.resolve(undefined),
        ]);
        texture.name = `loaded-${textureKey}`;
        if (normalTexture) {
          normalTexture.name = `loaded-${textureKey}-normal`;
        }
        if (ormTexture) {
          ormTexture.name = `loaded-${textureKey}-orm`;
        }
        applyTextureAsset(textureKey, texture, normalTexture, ormTexture);
        loadedTextureAssetKeys.add(textureKey);
      } catch (error) {
        assetLoadFailures.push(`texture:${textureKey}:${error instanceof Error ? error.message : String(error)}`);
      }
    }),
  );
}

function configureImportedModel(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (material instanceof THREE.MeshStandardMaterial && material.map) {
          material.map.colorSpace = THREE.SRGBColorSpace;
          material.map.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
          material.needsUpdate = true;
        }
      }
    }
  });
}

async function loadImportedModelSources(manifest: AssetManifest) {
  await Promise.all(
    IMPORTED_MODEL_KINDS.map(async (kind) => {
      const url = manifest.models[kind];

      if (!url) {
        assetLoadFailures.push(`missing-model:${kind}`);
        return;
      }

      try {
        const gltf = await gltfLoader.loadAsync(url);
        gltf.scene.name = `imported-source-${kind}`;
        configureImportedModel(gltf.scene);
        importedModelSources.set(kind, gltf.scene);
      } catch (error) {
        assetLoadFailures.push(`model:${kind}:${error instanceof Error ? error.message : String(error)}`);
      }
    }),
  );
}

function queueImportedModelReplacement(
  kind: ImportedModelKind,
  name: string,
  x: number,
  z: number,
  fallback: THREE.Object3D,
  scale = 1,
  rotationY = 0,
) {
  importedModelAnchors.push({
    kind,
    name,
    position: new THREE.Vector3(x, SEA_Y, z),
    rotationY,
    scale,
    fallback,
  });
}

function instantiateImportedModels() {
  importedModelInstanceCount = 0;

  for (const anchor of importedModelAnchors) {
    const source = importedModelSources.get(anchor.kind);

    if (!source) {
      continue;
    }

    const model = source.clone(true);
    model.name = `${anchor.name}-imported-gltf`;
    model.position.copy(anchor.position);
    model.rotation.y = anchor.rotationY;
    model.scale.setScalar(anchor.scale);
    configureImportedModel(model);
    artificialElements.add(model);
    anchor.fallback.visible = false;
    importedModelInstanceCount += 1;
  }
}

async function startImportedAssetPipeline() {
  try {
    const manifest = await loadAssetManifest();
    await Promise.all([loadTextureAssetPack(manifest), loadImportedModelSources(manifest)]);
    instantiateImportedModels();
  } catch (error) {
    assetLoadFailures.push(error instanceof Error ? error.message : String(error));
  } finally {
    assetLoadComplete = true;
  }
}

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

function addSharedSeaWaterMesh(
  name: string,
  geometry: THREE.BufferGeometry,
  renderOrder: number,
  parent: THREE.Object3D = naturalElements,
) {
  if (!geometry.getAttribute("uv")) {
    addPlanarXZUVs(geometry);
  }

  const mesh = new THREE.Mesh(geometry, sharedSeaWaterMaterial);
  mesh.name = name;
  mesh.renderOrder = renderOrder;
  mesh.receiveShadow = true;
  parent.add(mesh);
  sharedSeaWaterSurfaceCount += 1;
  return mesh;
}

function addSurroundingShaderSea() {
  const shaderSeaWidth = SEA_MARGIN_M + COASTAL_INLET_OVERLAP_M + 420;
  const shaderSeaDepth = maxWorldZ - minWorldZ + SEA_MARGIN_M * 2;
  seaWater = addSharedSeaWaterMesh(
    "surrounding-sea-shader-water",
    new THREE.PlaneGeometry(shaderSeaWidth, shaderSeaDepth, 1, 1),
    0,
  );
  seaWater.rotation.x = -Math.PI / 2;
  seaWater.position.set(
    mainBoundaryMaxX + shaderSeaWidth * 0.5 - COASTAL_INLET_OVERLAP_M,
    SEA_Y - 0.025,
    seaCenter.z,
  );
}

function addContactShadowPlane(
  name: string,
  width: number,
  depth: number,
  x: number,
  y: number,
  z: number,
  parent: THREE.Object3D = artificialElements,
) {
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), contactShadowMaterial);
  plane.name = name;
  plane.renderOrder = 18;
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(x, y, z);
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
  addPlanarXZUVs(geometry);
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
  addPlanarXZUVs(geometry);
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

function distanceToSegment2D(point: GroundPathPoint, start: GroundPathPoint, end: GroundPathPoint) {
  const segmentX = end.x - start.x;
  const segmentZ = end.z - start.z;
  const lengthSq = segmentX * segmentX + segmentZ * segmentZ;

  if (lengthSq <= 0.0001) {
    return Math.hypot(point.x - start.x, point.z - start.z);
  }

  const t = THREE.MathUtils.clamp(
    ((point.x - start.x) * segmentX + (point.z - start.z) * segmentZ) / lengthSq,
    0,
    1,
  );
  const projectedX = start.x + segmentX * t;
  const projectedZ = start.z + segmentZ * t;
  return Math.hypot(point.x - projectedX, point.z - projectedZ);
}

function distanceToPath2D(point: GroundPathPoint, path: GroundPathPoint[], closed = false) {
  let minDistance = Number.POSITIVE_INFINITY;
  const segmentCount = closed ? path.length : path.length - 1;

  for (let index = 0; index < segmentCount; index += 1) {
    minDistance = Math.min(
      minDistance,
      distanceToSegment2D(point, path[index], path[(index + 1) % path.length]),
    );
  }

  return minDistance;
}

let terrainRoadAvoidancePathCache: GroundPathPoint[] | undefined;

function terrainRoadAvoidancePath() {
  if (!terrainRoadAvoidancePathCache) {
    terrainRoadAvoidancePathCache = sampleRoadControlPath(
      getHighwayLoopControlPoints(),
      true,
      72,
    );
  }

  return terrainRoadAvoidancePathCache;
}

function terrainMicroNoise(x: number, z: number) {
  const point = { x, z };
  const riverDistance = distanceToPath2D(point, riverPath);
  const roadDistance = distanceToPath2D(
    point,
    terrainRoadAvoidancePath(),
    true,
  );
  const riverMask = THREE.MathUtils.smoothstep(riverDistance, RIVER_WIDTH_M * 1.1, RIVER_WIDTH_M * 3.4);
  const roadMask = THREE.MathUtils.smoothstep(roadDistance, HIGHWAY_TOTAL_WIDTH_M * 1.8, HIGHWAY_TOTAL_WIDTH_M * 4.6);
  const mountainMask =
    1 -
    THREE.MathUtils.smoothstep(
      Math.max(mountainHeightAt(x, z), snowMountainHeightAt(x, z)),
      0,
      36,
    );
  const coastMask = 1 - THREE.MathUtils.smoothstep(x, mainBoundaryMaxX - 420, mainBoundaryMaxX - 170);
  const broad = Math.sin(x * 0.0042 + z * 0.0031) * 0.5 + 0.5;
  const middle = Math.sin(x * 0.012 - z * 0.009) * 0.5 + 0.5;
  const fine = Math.sin(x * 0.034 + z * 0.027) * 0.5 + 0.5;
  const drainage = Math.max(
    0,
    Math.sin((x - z) * 0.0068) * 0.5 + 0.5 - 0.52,
  );
  const relief = (broad * 0.46 + middle * 0.34 + fine * 0.2 + drainage * 0.36) * MICRO_TERRAIN_HEIGHT_M;

  return relief * riverMask * roadMask * mountainMask * coastMask;
}

function addMicroDisplacedGrassTerrain() {
  const westX = mainBoundaryMinX + 70;
  const eastX = mainBoundaryMaxX - BEACH_INLAND_WIDTH_M - 55;
  const southZ = mainBoundaryMinZ + 70;
  const northZ = mainBoundaryMaxZ - 70;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let row = 0; row <= MICRO_TERRAIN_GRID_SEGMENTS; row += 1) {
    const z = THREE.MathUtils.lerp(
      southZ,
      northZ,
      row / MICRO_TERRAIN_GRID_SEGMENTS,
    );

    for (let column = 0; column <= MICRO_TERRAIN_GRID_SEGMENTS; column += 1) {
      const x = THREE.MathUtils.lerp(
        westX,
        eastX,
        column / MICRO_TERRAIN_GRID_SEGMENTS,
      );
      const displacedY =
        GRASS_SURFACE_Y +
        0.11 +
        terrainMicroNoise(x, z);

      positions.push(x, displacedY, z);
      uvs.push(x / 95, z / 95);
    }
  }

  const rowStride = MICRO_TERRAIN_GRID_SEGMENTS + 1;
  for (let row = 0; row < MICRO_TERRAIN_GRID_SEGMENTS; row += 1) {
    for (let column = 0; column < MICRO_TERRAIN_GRID_SEGMENTS; column += 1) {
      const a = row * rowStride + column;
      const b = a + 1;
      const c = a + rowStride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, terrainMicroDisplacementMaterial);
  mesh.name = "micro-displaced-grass-terrain-skin";
  mesh.renderOrder = 2.4;
  mesh.receiveShadow = true;
  naturalElements.add(mesh);
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
  const bevelRadius = Math.min(width, height, depth) * 0.08;
  const geometry =
    bevelRadius > 0.25
      ? new RoundedBoxGeometry(width, height, depth, 2, Math.min(bevelRadius, 2.4))
      : new THREE.BoxGeometry(width, height, depth);
  const box = new THREE.Mesh(geometry, material);
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
  const bevelRadius = Math.min(width, height, depth) * 0.08;
  const geometry =
    bevelRadius > 0.22
      ? new RoundedBoxGeometry(width, height, depth, 2, Math.min(bevelRadius, 2.2))
      : new THREE.BoxGeometry(width, height, depth);
  const box = new THREE.Mesh(geometry, material);
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
  const bevelRadius = Math.min(width, height, depth) * 0.08;
  const mesh = new THREE.InstancedMesh(
    bevelRadius > 0.18
      ? new RoundedBoxGeometry(width, height, depth, 2, Math.min(bevelRadius, 1.4))
      : new THREE.BoxGeometry(width, height, depth),
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

function addOrientedBoxInstances(
  name: string,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  placements: OrientedXYZPlacement[],
  parent: THREE.Object3D = artificialElements,
  castShadow = true,
) {
  if (placements.length === 0) {
    return;
  }

  const bevelRadius = Math.min(width, height, depth) * 0.06;
  const mesh = new THREE.InstancedMesh(
    bevelRadius > 0.18
      ? new RoundedBoxGeometry(width, height, depth, 2, Math.min(bevelRadius, 1.1))
      : new THREE.BoxGeometry(width, height, depth),
    material,
    placements.length,
  );
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const yAxis = new THREE.Vector3(0, 1, 0);

  placements.forEach((placement, index) => {
    position.set(placement.x, placement.y, placement.z);
    quaternion.setFromAxisAngle(yAxis, placement.rotationY);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;

  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

function addScaledSphereInstances(
  name: string,
  material: THREE.Material,
  placements: ScaledXYZPlacement[],
  parent: THREE.Object3D = naturalElements,
) {
  const mesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 14, 8),
    material,
    placements.length,
  );
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  placements.forEach((placement, index) => {
    position.set(placement.x, placement.y, placement.z);
    scale.set(placement.scaleX, placement.scaleY, placement.scaleZ);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;

  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

function addScaledOrientedSphereInstances(
  name: string,
  material: THREE.Material,
  placements: ScaledOrientedXYZPlacement[],
  parent: THREE.Object3D = naturalElements,
) {
  if (placements.length === 0) {
    return;
  }

  const mesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 12, 7),
    material,
    placements.length,
  );
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);

  placements.forEach((placement, index) => {
    position.set(placement.x, placement.y, placement.z);
    quaternion.setFromAxisAngle(yAxis, placement.rotationY);
    scale.set(placement.scaleX, placement.scaleY, placement.scaleZ);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;

  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

function createLocalMesh(
  name: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addCargoShip(name: string, x: number, z: number) {
  const lod = new THREE.LOD();
  const highDetail = new THREE.Group();
  const lowDetail = createLocalMesh(
    `${name}-low-detail-hull`,
    new RoundedBoxGeometry(CARGO_SHIP_HULL_LENGTH_M, 15, 34, 2, 1.6),
    shipHullMaterial,
    0,
    10,
    0,
  );
  const deckContainers: XYZPlacement[] = [];
  const railPlacements: XYZPlacement[] = [];

  highDetail.name = `${name}-high-detail-model`;
  highDetail.add(
    createLocalMesh(
      `${name}-rounded-hull`,
      new RoundedBoxGeometry(CARGO_SHIP_HULL_LENGTH_M, 16, 34, 3, 2.8),
      shipHullMaterial,
      0,
      10,
      0,
    ),
  );
  const bow = createLocalMesh(
    `${name}-tapered-bow`,
    new THREE.ConeGeometry(18, 30, 4),
    shipHullMaterial,
    CARGO_SHIP_HULL_LENGTH_M * 0.5 + 10,
    10,
    0,
  );
  bow.rotation.z = -Math.PI / 2;
  bow.rotation.y = Math.PI * 0.25;
  highDetail.add(bow);
  highDetail.add(
    createLocalMesh(
      `${name}-stern-cabin-block`,
      new RoundedBoxGeometry(42, 18, 22, 2, 1.4),
      shipCabinMaterial,
      -38,
      27,
      0,
    ),
    createLocalMesh(
      `${name}-bridge-window-band`,
      new RoundedBoxGeometry(36, 4, 23, 1, 0.5),
      safetySignMaterial,
      -36,
      30,
      0,
    ),
    createLocalMesh(
      `${name}-foredeck-cover`,
      new RoundedBoxGeometry(54, 3.2, 24, 1, 0.8),
      concretePortMaterial,
      34,
      20.1,
      0,
    ),
  );

  for (let index = 0; index < 8; index += 1) {
    deckContainers.push({
      x: -10 + (index % 4) * 18,
      y: 23.2 + Math.floor(index / 4) * 4.2,
      z: index < 4 ? -9 : 9,
    });
  }
  addBoxInstances(
    `${name}-deck-container-stack`,
    14,
    4,
    7,
    cargoContainerMaterials[0],
    deckContainers,
    highDetail,
  );

  for (let index = 0; index < 12; index += 1) {
    const localX = THREE.MathUtils.lerp(-68, 72, index / 11);
    railPlacements.push(
      { x: localX, y: 21.8, z: -18.3 },
      { x: localX, y: 21.8, z: 18.3 },
    );
  }
  addBoxInstances(
    `${name}-side-rail-posts`,
    0.8,
    4.2,
    0.8,
    bridgeSteelMaterial,
    railPlacements,
    highDetail,
  );
  highDetail.add(
    createLocalMesh(
      `${name}-port-side-rail`,
      new THREE.BoxGeometry(145, 0.75, 0.75),
      bridgeSteelMaterial,
      2,
      24,
      -18.3,
    ),
    createLocalMesh(
      `${name}-starboard-side-rail`,
      new THREE.BoxGeometry(145, 0.75, 0.75),
      bridgeSteelMaterial,
      2,
      24,
      18.3,
    ),
    createLocalMesh(
      `${name}-mast`,
      new THREE.CylinderGeometry(0.9, 0.9, 22, 10),
      bridgeSteelMaterial,
      -58,
      43,
      0,
    ),
    createLocalMesh(
      `${name}-radar-bar`,
      new THREE.BoxGeometry(16, 1.2, 1.2),
      bridgeSteelMaterial,
      -58,
      53.5,
      0,
    ),
  );

  lod.name = name;
  lod.position.set(x, SEA_Y, z);
  lod.addLevel(highDetail, 0);
  lod.addLevel(lowDetail, 2_800);
  artificialElements.add(lod);
  queueImportedModelReplacement("cargoShip", name, x, z, lod);
}

function addPrivateBoat(name: string, x: number, z: number) {
  const lod = new THREE.LOD();
  const highDetail = new THREE.Group();
  const lowDetail = createLocalMesh(
    `${name}-low-detail-hull`,
    new RoundedBoxGeometry(42, 6, 12, 2, 1.1),
    privateBoatMaterial,
    0,
    5,
    0,
  );

  highDetail.name = `${name}-high-detail-model`;
  const bow = createLocalMesh(
    `${name}-pointed-bow`,
    new THREE.ConeGeometry(6.4, 11, 4),
    privateBoatMaterial,
    24,
    5,
    0,
  );
  bow.rotation.z = -Math.PI / 2;
  bow.rotation.y = Math.PI * 0.25;
  highDetail.add(
    createLocalMesh(
      `${name}-rounded-hull`,
      new RoundedBoxGeometry(42, 6, 12, 3, 1.3),
      privateBoatMaterial,
      0,
      5,
      0,
    ),
    bow,
    createLocalMesh(
      `${name}-small-cabin`,
      new RoundedBoxGeometry(13, 7, 8, 2, 0.8),
      shipCabinMaterial,
      -5,
      11,
      0,
    ),
    createLocalMesh(
      `${name}-windshield`,
      new RoundedBoxGeometry(9, 2.4, 8.4, 1, 0.3),
      safetySignMaterial,
      1,
      14.8,
      0,
    ),
    createLocalMesh(
      `${name}-stern-outboard`,
      new RoundedBoxGeometry(3.4, 5.2, 4.4, 1, 0.4),
      rubberFenderMaterial,
      -24.5,
      5,
      0,
    ),
  );

  lod.name = name;
  lod.position.set(x, SEA_Y, z);
  lod.addLevel(highDetail, 0);
  lod.addLevel(lowDetail, 1_400);
  artificialElements.add(lod);
  queueImportedModelReplacement("privateBoat", name, x, z, lod);
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

function addPierStructuralDetail(pierCenterX: number, pierCenterZ: number) {
  const pierWestEdge = pierCenterX - ATTRACTION_PIER_LENGTH_M * 0.5;
  const pierEastEdge = pierCenterX + ATTRACTION_PIER_LENGTH_M * 0.5;
  const pierNorthEdge = pierCenterZ + ATTRACTION_PIER_DEPTH_M * 0.5;
  const pierSouthEdge = pierCenterZ - ATTRACTION_PIER_DEPTH_M * 0.5;
  const sidePostPlacements: XZPlacement[] = [];
  const endPostPlacements: XZPlacement[] = [];
  const crossBeamPlacements: XYZPlacement[] = [];
  const longBeamPlacements: XYZPlacement[] = [];

  for (let index = 0; index < ATTRACTION_PIER_RAIL_POST_COUNT / 2; index += 1) {
    const x = THREE.MathUtils.lerp(
      pierWestEdge + 18,
      pierEastEdge - 18,
      index / (ATTRACTION_PIER_RAIL_POST_COUNT / 2 - 1),
    );
    sidePostPlacements.push(
      { x, z: pierNorthEdge - 5 },
      { x, z: pierSouthEdge + 5 },
    );
  }

  for (let index = 0; index < 8; index += 1) {
    const z = THREE.MathUtils.lerp(pierSouthEdge + 18, pierNorthEdge - 18, index / 7);
    endPostPlacements.push({ x: pierEastEdge - 7, z });
  }

  addCylinderInstances(
    "attraction-pier-railing-posts",
    1.1,
    7.2,
    dockMaterial,
    PLATFORM_SURFACE_Y + 7.2,
    [...sidePostPlacements, ...endPostPlacements],
    artificialElements,
  );

  for (const z of [pierNorthEdge - 5, pierSouthEdge + 5]) {
    addTopAlignedBox(
      `attraction-pier-long-railing-${z > pierCenterZ ? "north" : "south"}`,
      ATTRACTION_PIER_LENGTH_M - 28,
      1.3,
      2.4,
      dockMaterial,
      pierCenterX,
      PLATFORM_SURFACE_Y + 6.8,
      z,
      12,
      artificialElements,
    );
  }
  addTopAlignedBox(
    "attraction-pier-seaward-end-railing",
    2.4,
    1.3,
    ATTRACTION_PIER_DEPTH_M - 30,
    dockMaterial,
    pierEastEdge - 7,
    PLATFORM_SURFACE_Y + 6.8,
    pierCenterZ,
    12,
    artificialElements,
  );

  for (let index = 0; index < ATTRACTION_PIER_BEAM_COUNT; index += 1) {
    const x = THREE.MathUtils.lerp(pierWestEdge + 18, pierEastEdge - 18, index / (ATTRACTION_PIER_BEAM_COUNT - 1));
    crossBeamPlacements.push({
      x,
      y: PLATFORM_SURFACE_Y - PIER_DECK_THICKNESS_M - 0.8,
      z: pierCenterZ,
    });
  }

  for (const z of [
    pierSouthEdge + ATTRACTION_PIER_DEPTH_M * 0.24,
    pierCenterZ,
    pierNorthEdge - ATTRACTION_PIER_DEPTH_M * 0.24,
  ]) {
    longBeamPlacements.push({
      x: pierCenterX,
      y: PLATFORM_SURFACE_Y - PIER_DECK_THICKNESS_M - 1.7,
      z,
    });
  }

  addBoxInstances(
    "attraction-pier-cross-beams",
    4.8,
    3.2,
    ATTRACTION_PIER_DEPTH_M - 20,
    woodPierMaterial,
    crossBeamPlacements,
    artificialElements,
  );
  addBoxInstances(
    "attraction-pier-longitudinal-beams",
    ATTRACTION_PIER_LENGTH_M - 34,
    2.8,
    4.2,
    woodPierMaterial,
    longBeamPlacements,
    artificialElements,
  );
  addContactShadowPlane(
    "attraction-pier-water-contact-shadow",
    ATTRACTION_PIER_LENGTH_M - ATTRACTION_PIER_LAND_OVERLAP_M + 40,
    ATTRACTION_PIER_DEPTH_M + 20,
    pierCenterX + ATTRACTION_PIER_LAND_OVERLAP_M * 0.22,
    SEA_Y + 0.065,
    pierCenterZ,
  );
}

function addPrivateMarinaHardware(marinaCenterZ: number) {
  const cleatPlacements: XYZPlacement[] = [];

  for (let index = 0; index < PRIVATE_MARINA_BERTH_COUNT; index += 1) {
    const berthZ = marinaCenterZ - 45 + index * 30;
    cleatPlacements.push(
      { x: mainBoundaryMaxX + 34, y: PLATFORM_SURFACE_Y + 1.7, z: berthZ - 4.4 },
      { x: mainBoundaryMaxX + 76, y: PLATFORM_SURFACE_Y + 1.7, z: berthZ - 4.4 },
      { x: mainBoundaryMaxX + 116, y: PLATFORM_SURFACE_Y + 1.7, z: berthZ + 4.4 },
      { x: mainBoundaryMaxX + 146, y: PLATFORM_SURFACE_Y + 1.7, z: berthZ + 4.4 },
    );
  }

  for (const z of [marinaCenterZ - 62, marinaCenterZ - 22, marinaCenterZ + 22, marinaCenterZ + 62]) {
    cleatPlacements.push({ x: mainBoundaryMaxX + 7, y: PLATFORM_SURFACE_Y + 1.7, z });
  }

  addBoxInstances(
    "private-marina-mooring-cleats",
    5.2,
    0.9,
    1.8,
    bridgeSteelMaterial,
    cleatPlacements,
    artificialElements,
  );
  addContactShadowPlane(
    "private-marina-water-contact-shadow",
    160,
    150,
    mainBoundaryMaxX + 70,
    SEA_Y + 0.07,
    marinaCenterZ,
  );
}

function addCargoPortSurfaceDetail(
  cargoPortCenterX: number,
  cargoPortCenterZ: number,
  cargoPortEastEdge: number,
) {
  const seamPlacements: XYZPlacement[] = [];
  const drainPlacements: XYZPlacement[] = [];
  const fenderPlacements: XYZPlacement[] = [];

  for (let index = 0; index < 6; index += 1) {
    seamPlacements.push({
      x: THREE.MathUtils.lerp(
        cargoPortCenterX - CARGO_PORT_LENGTH_M * 0.38,
        cargoPortCenterX + CARGO_PORT_LENGTH_M * 0.32,
        index / 5,
      ),
      y: PLATFORM_SURFACE_Y + 0.18,
      z: cargoPortCenterZ,
    });
  }

  for (let index = 0; index < 6; index += 1) {
    seamPlacements.push({
      x: cargoPortCenterX,
      y: PLATFORM_SURFACE_Y + 0.19,
      z: THREE.MathUtils.lerp(
        cargoPortCenterZ - CARGO_PORT_DEPTH_M * 0.39,
        cargoPortCenterZ + CARGO_PORT_DEPTH_M * 0.39,
        index / 5,
      ),
    });
  }

  addBoxInstances(
    "cargo-port-longitudinal-concrete-seams",
    1.2,
    0.08,
    CARGO_PORT_DEPTH_M - 24,
    concreteSeamMaterial,
    seamPlacements.slice(0, 6),
    artificialElements,
  );
  addBoxInstances(
    "cargo-port-cross-concrete-seams",
    CARGO_PORT_LENGTH_M - 36,
    0.08,
    1.2,
    concreteSeamMaterial,
    seamPlacements.slice(6),
    artificialElements,
  );

  for (let index = 0; index < QUAY_FENDER_COUNT; index += 1) {
    const z = THREE.MathUtils.lerp(
      cargoPortCenterZ - CARGO_PORT_DEPTH_M * 0.42,
      cargoPortCenterZ + CARGO_PORT_DEPTH_M * 0.42,
      index / (QUAY_FENDER_COUNT - 1),
    );
    fenderPlacements.push({
      x: cargoPortEastEdge + 1.4,
      y: PLATFORM_SURFACE_Y - 1.6,
      z,
    });
  }
  addBoxInstances(
    "cargo-port-rubber-quay-fenders",
    4.6,
    12,
    11,
    rubberFenderMaterial,
    fenderPlacements,
    artificialElements,
  );

  for (let index = 0; index < 8; index += 1) {
    drainPlacements.push({
      x: cargoPortCenterX - 112 + (index % 4) * 70,
      y: PLATFORM_SURFACE_Y + 0.24,
      z: cargoPortCenterZ + (index < 4 ? -92 : 92),
    });
  }
  addBoxInstances(
    "cargo-port-slot-drains",
    18,
    0.12,
    2.4,
    roadDrainMaterial,
    drainPlacements,
    artificialElements,
  );
  addContactShadowPlane(
    "cargo-port-quay-contact-shadow",
    CARGO_PORT_LENGTH_M + 85,
    CARGO_PORT_DEPTH_M + 32,
    cargoPortCenterX + 24,
    SEA_Y + 0.07,
    cargoPortCenterZ,
  );
}

function beachDryDetailMinX(beachInnerX: number) {
  return beachInnerX + BEACH_DRY_DETAIL_INLAND_MARGIN_M;
}

function beachDryDetailMaxX() {
  return mainBoundaryMaxX - BEACH_DRY_DETAIL_SEA_MARGIN_M;
}

function beachDryDetailMinZ() {
  return riverMouth.z + BEACH_DETAIL_RIVER_MARGIN_M;
}

function beachDryDetailMaxZ() {
  return mainBoundaryMaxZ - BEACH_DETAIL_NORTH_MARGIN_M;
}

function clampBeachDryX(beachInnerX: number, x: number) {
  return THREE.MathUtils.clamp(x, beachDryDetailMinX(beachInnerX), beachDryDetailMaxX());
}

function clampBeachDryXWithClearance(
  beachInnerX: number,
  x: number,
  clearanceM: number,
) {
  return THREE.MathUtils.clamp(
    x,
    beachDryDetailMinX(beachInnerX) + clearanceM,
    beachDryDetailMaxX() - clearanceM,
  );
}

function clampBeachDryZ(z: number) {
  return THREE.MathUtils.clamp(z, beachDryDetailMinZ(), beachDryDetailMaxZ());
}

function clampBeachDryZWithClearance(z: number, clearanceM: number) {
  return THREE.MathUtils.clamp(
    z,
    beachDryDetailMinZ() + clearanceM,
    beachDryDetailMaxZ() - clearanceM,
  );
}

function addBeachGrassClumps(beachInnerX: number) {
  const mesh = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1.1, 5.5, 5),
    beachGrassMaterial,
    BEACH_GRASS_CLUSTER_COUNT,
  );
  const matrix = new THREE.Matrix4();

  for (let index = 0; index < BEACH_GRASS_CLUSTER_COUNT; index += 1) {
    const row = Math.floor(index / 10);
    const column = index % 10;
    const x = clampBeachDryX(
      beachInnerX,
      beachInnerX +
        12 +
        (column % 3) * 9 +
        3.2 * Math.sin(index * 1.7),
    );
    const z = clampBeachDryZ(
      riverMouth.z +
        312 +
        row * 118 +
        column * 9 +
        7 * Math.sin(index * 0.9),
    );

    matrix.makeTranslation(x, COAST_SURFACE_Y + 2.8, z);
    mesh.setMatrixAt(index, matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  mesh.name = "beach-dune-grass-clumps";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  naturalElements.add(mesh);
}

function addBeachNaturalDetails(beachInnerX: number) {
  const foamPlacements: XYZPlacement[] = [];
  for (let index = 0; index < BEACH_FOAM_STRIP_COUNT; index += 1) {
    foamPlacements.push({
      x: mainBoundaryMaxX + 4 + (index % 2) * 2.6,
      y: COAST_SURFACE_Y + 0.14,
      z: clampBeachDryZ(
        THREE.MathUtils.lerp(
          riverMouth.z + 236,
          mainBoundaryMaxZ - 70,
          index / (BEACH_FOAM_STRIP_COUNT - 1),
        ),
      ),
    });
  }
  addBoxInstances(
    "shoreline-foam-strips",
    7,
    0.08,
    38,
    shorelineFoamMaterial,
    foamPlacements,
    naturalElements,
  );

  const dunePlacements: ScaledXYZPlacement[] = [];
  for (let index = 0; index < BEACH_DUNE_COUNT; index += 1) {
    const row = Math.floor(index / 4);
    const column = index % 4;
    dunePlacements.push({
      x: clampBeachDryX(
        beachInnerX,
        beachInnerX + 20 + column * 14 + 4 * Math.sin(index * 0.8),
      ),
      y: COAST_SURFACE_Y + 1.15 + (index % 3) * 0.12,
      z: clampBeachDryZ(riverMouth.z + 326 + row * 126 + 8 * Math.sin(index * 1.3)),
      scaleX: 14 + (index % 4) * 2.2,
      scaleY: 2.2 + (index % 3) * 0.32,
      scaleZ: 8 + (index % 5) * 1.4,
    });
  }
  addScaledSphereInstances("low-beach-dune-mounds", duneSandMaterial, dunePlacements);
  addBeachGrassClumps(beachInnerX);

  const shellPlacements: ScaledOrientedXYZPlacement[] = [];
  for (let index = 0; index < BEACH_SHELL_COUNT; index += 1) {
    const row = Math.floor(index / 12);
    const column = index % 12;
    shellPlacements.push({
      x: clampBeachDryXWithClearance(
        beachInnerX,
        beachInnerX + 68 + (column % 4) * 18 + 5 * Math.sin(index * 1.9),
        8,
      ),
      y: COAST_SURFACE_Y + 0.28,
      z: clampBeachDryZWithClearance(
        riverMouth.z + 274 + row * 76 + column * 5.8,
        10,
      ),
      rotationY: index * 0.91,
      scaleX: 1.8 + (index % 3) * 0.25,
      scaleY: 0.18,
      scaleZ: 0.72 + (index % 4) * 0.08,
    });
  }
  addScaledOrientedSphereInstances("dry-beach-shells-and-small-stones", beachShellMaterial, shellPlacements);
}

function addBeachUmbrellas(beachInnerX: number) {
  const umbrellaPlacements: XZPlacement[] = [];
  const canopyPlacementsByMaterial: XZPlacement[][] = beachUmbrellaMaterials.map(() => []);

  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const index = row * 3 + column;
      const placement = {
        x: clampBeachDryXWithClearance(
          beachInnerX,
          beachInnerX + 38 + column * 26 + (row % 2) * 3,
          18,
        ),
        z: clampBeachDryZWithClearance(riverMouth.z + 350 + row * 96, 18),
      };
      umbrellaPlacements.push(placement);
      canopyPlacementsByMaterial[index % beachUmbrellaMaterials.length].push(placement);
    }
  }

  addCylinderInstances(
    "beach-umbrella-poles",
    0.85,
    10,
    dockMaterial,
    COAST_SURFACE_Y + 10,
    umbrellaPlacements,
    artificialElements,
  );

  canopyPlacementsByMaterial.forEach((placements, materialIndex) => {
    const mesh = new THREE.InstancedMesh(
      new THREE.ConeGeometry(10, 5.2, 18),
      beachUmbrellaMaterials[materialIndex],
      placements.length,
    );
    const matrix = new THREE.Matrix4();

    placements.forEach((placement, index) => {
      matrix.makeTranslation(placement.x, COAST_SURFACE_Y + 10.6, placement.z);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.name = `beach-umbrella-canopies-${materialIndex + 1}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    artificialElements.add(mesh);
  });

  const sunbedPlacements: XYZPlacement[] = [];
  for (const placement of umbrellaPlacements) {
    sunbedPlacements.push(
      {
        x: clampBeachDryXWithClearance(beachInnerX, placement.x - 10, 7),
        y: COAST_SURFACE_Y + 0.7,
        z: clampBeachDryZWithClearance(placement.z + 16, 8),
      },
      {
        x: clampBeachDryXWithClearance(beachInnerX, placement.x + 10, 7),
        y: COAST_SURFACE_Y + 0.7,
        z: clampBeachDryZWithClearance(placement.z + 16, 8),
      },
    );
  }
  addBoxInstances(
    "beach-sunbeds",
    13,
    0.9,
    5.8,
    beachWhiteMaterial,
    sunbedPlacements,
    artificialElements,
  );
}

function addBeachTowels(beachInnerX: number) {
  const placementsByMaterial: XYZPlacement[][] = beachTowelMaterials.map(() => []);

  for (let index = 0; index < BEACH_TOWEL_COUNT; index += 1) {
    placementsByMaterial[index % beachTowelMaterials.length].push({
      x: clampBeachDryXWithClearance(
        beachInnerX,
        beachInnerX + 76 + (index % 3) * 13,
        5,
      ),
      y: COAST_SURFACE_Y + 0.18,
      z: clampBeachDryZWithClearance(
        riverMouth.z + 326 + Math.floor(index / 3) * 108 + (index % 2) * 14,
        8,
      ),
    });
  }

  placementsByMaterial.forEach((placements, materialIndex) => {
    addBoxInstances(
      `beach-towels-${materialIndex + 1}`,
      9,
      0.18,
      15,
      beachTowelMaterials[materialIndex],
      placements,
      artificialElements,
    );
  });
}

function addBeachVolleyballCourt(beachInnerX: number) {
  const centerX = clampBeachDryXWithClearance(beachInnerX, beachInnerX + 58, 31);
  const centerZ = clampBeachDryZWithClearance(riverMouth.z + 452, 45);
  const courtWidth = 50;
  const courtDepth = 88;
  const lineTopY = COAST_SURFACE_Y + 0.18;

  addTopAlignedBox(
    "beach-volleyball-left-line",
    0.8,
    0.08,
    courtDepth,
    beachWhiteMaterial,
    centerX - courtWidth * 0.5,
    lineTopY,
    centerZ,
    5,
    artificialElements,
  );
  addTopAlignedBox(
    "beach-volleyball-right-line",
    0.8,
    0.08,
    courtDepth,
    beachWhiteMaterial,
    centerX + courtWidth * 0.5,
    lineTopY,
    centerZ,
    5,
    artificialElements,
  );
  addTopAlignedBox(
    "beach-volleyball-north-line",
    courtWidth,
    0.08,
    0.8,
    beachWhiteMaterial,
    centerX,
    lineTopY,
    centerZ + courtDepth * 0.5,
    5,
    artificialElements,
  );
  addTopAlignedBox(
    "beach-volleyball-south-line",
    courtWidth,
    0.08,
    0.8,
    beachWhiteMaterial,
    centerX,
    lineTopY,
    centerZ - courtDepth * 0.5,
    5,
    artificialElements,
  );
  addCylinderInstances(
    "beach-volleyball-posts",
    0.9,
    8,
    dockMaterial,
    COAST_SURFACE_Y + 8,
    [
      { x: centerX - courtWidth * 0.56, z: centerZ },
      { x: centerX + courtWidth * 0.56, z: centerZ },
    ],
    artificialElements,
  );
  addBox(
    "beach-volleyball-net",
    courtWidth + 8,
    3.8,
    0.35,
    beachWhiteMaterial,
    centerX,
    COAST_SURFACE_Y + 4.2,
    centerZ,
    artificialElements,
  );
}

function addLifeguardTower(beachInnerX: number) {
  const x = clampBeachDryXWithClearance(beachInnerX, beachInnerX + 92, 15);
  const z = clampBeachDryZWithClearance(riverMouth.z + 716, 14);

  for (const legX of [-8, 8]) {
    for (const legZ of [-7, 7]) {
      addBox(
        `lifeguard-tower-leg-${legX}-${legZ}`,
        1.8,
        12,
        1.8,
        woodPierMaterial,
        x + legX,
        COAST_SURFACE_Y + 6,
        z + legZ,
        artificialElements,
      );
    }
  }

  addBox(
    "lifeguard-tower-deck",
    26,
    2.4,
    22,
    woodPierMaterial,
    x,
    COAST_SURFACE_Y + 12.8,
    z,
    artificialElements,
  );
  addBox(
    "lifeguard-tower-cabin",
    22,
    14,
    18,
    beachWhiteMaterial,
    x,
    COAST_SURFACE_Y + 21,
    z,
    artificialElements,
  );
  addBox(
    "lifeguard-tower-red-panel",
    23,
    3,
    19,
    attractionRedMaterial,
    x,
    COAST_SURFACE_Y + 18,
    z,
    artificialElements,
  );
  addBox(
    "lifeguard-tower-roof",
    28,
    2.2,
    24,
    attractionBlueMaterial,
    x,
    COAST_SURFACE_Y + 29,
    z,
    artificialElements,
  );
}

function addBeachAccessAndUtilities(beachInnerX: number) {
  const boardwalkZ = clampBeachDryZ(riverMouth.z + 642);
  addTopAlignedBox(
    "beach-boardwalk-access",
    100,
    0.7,
    12,
    woodPierMaterial,
    clampBeachDryXWithClearance(beachInnerX, beachInnerX + 58, 50),
    COAST_SURFACE_Y + 0.72,
    boardwalkZ,
    5,
    artificialElements,
  );

  const plankPlacements: XYZPlacement[] = [];
  for (let index = 0; index < 9; index += 1) {
    plankPlacements.push({
      x: clampBeachDryXWithClearance(beachInnerX, beachInnerX + 23 + index * 10.5, 2),
      y: COAST_SURFACE_Y + 0.9,
      z: boardwalkZ,
    });
  }
  addBoxInstances(
    "beach-boardwalk-cross-planks",
    2.8,
    0.16,
    13.2,
    dockMaterial,
    plankPlacements,
    artificialElements,
  );

  addCylinderInstances(
    "beach-shower-poles",
    0.8,
    8.5,
    roadStructureConcreteMaterial,
    COAST_SURFACE_Y + 8.5,
    [
      {
        x: clampBeachDryXWithClearance(beachInnerX, beachInnerX + 34, 1),
        z: clampBeachDryZWithClearance(boardwalkZ + 28, 1),
      },
      {
        x: clampBeachDryXWithClearance(beachInnerX, beachInnerX + 48, 1),
        z: clampBeachDryZWithClearance(boardwalkZ + 28, 1),
      },
    ],
    artificialElements,
  );
  addBox(
    "beach-shower-heads",
    23,
    1.1,
    2.6,
    roadStructureConcreteMaterial,
    clampBeachDryXWithClearance(beachInnerX, beachInnerX + 41, 12),
    COAST_SURFACE_Y + 8.7,
    clampBeachDryZWithClearance(boardwalkZ + 30.5, 2),
    artificialElements,
  );

  const flagPlacements: XZPlacement[] = [
    {
      x: clampBeachDryXWithClearance(beachInnerX, beachInnerX + 96, 5),
      z: clampBeachDryZWithClearance(riverMouth.z + 272, 5),
    },
    {
      x: clampBeachDryXWithClearance(beachInnerX, beachInnerX + 102, 5),
      z: clampBeachDryZWithClearance(riverMouth.z + 594, 5),
    },
    {
      x: clampBeachDryXWithClearance(beachInnerX, beachInnerX + 92, 5),
      z: clampBeachDryZWithClearance(riverMouth.z + 728, 5),
    },
  ];
  addCylinderInstances(
    "beach-safety-flag-poles",
    0.7,
    9,
    dockMaterial,
    COAST_SURFACE_Y + 9,
    flagPlacements,
    artificialElements,
  );
  addBoxInstances(
    "beach-safety-flags",
    7,
    4,
    0.45,
    beachFlagMaterial,
    flagPlacements.map((placement) => ({
      x: clampBeachDryXWithClearance(beachInnerX, placement.x + 3.7, 4),
      y: COAST_SURFACE_Y + 7.2,
      z: placement.z,
    })),
    artificialElements,
  );

  const binPlacements: XYZPlacement[] = [
    {
      x: clampBeachDryXWithClearance(beachInnerX, beachInnerX + 38, 3),
      y: COAST_SURFACE_Y + 1.8,
      z: clampBeachDryZWithClearance(boardwalkZ - 19, 3),
    },
    {
      x: clampBeachDryXWithClearance(beachInnerX, beachInnerX + 98, 3),
      y: COAST_SURFACE_Y + 1.8,
      z: clampBeachDryZWithClearance(boardwalkZ - 19, 3),
    },
    {
      x: clampBeachDryXWithClearance(beachInnerX, beachInnerX + 44, 3),
      y: COAST_SURFACE_Y + 1.8,
      z: clampBeachDryZWithClearance(riverMouth.z + 334, 3),
    },
    {
      x: clampBeachDryXWithClearance(beachInnerX, beachInnerX + 98, 3),
      y: COAST_SURFACE_Y + 1.8,
      z: clampBeachDryZWithClearance(riverMouth.z + 724, 3),
    },
  ];
  addBoxInstances(
    "beach-trash-bins",
    4.4,
    3.6,
    4.4,
    beachBinMaterial,
    binPlacements,
    artificialElements,
  );
}

function addBeachAmenities(beachInnerX: number) {
  addBeachUmbrellas(beachInnerX);
  addBeachTowels(beachInnerX);
  addBeachVolleyballCourt(beachInnerX);
  addLifeguardTower(beachInnerX);
  addBeachAccessAndUtilities(beachInnerX);
}

function addNaturalRockClusters() {
  const placements: ScaledXYZPlacement[] = [];

  for (let index = 7; index < riverPath.length - 6 && placements.length < 24; index += 5) {
    const point = riverPath[index];
    const tangent = pathTangent(
      riverPath.map((riverPoint) => ({
        ...riverPoint,
        y: terrainSurfaceYAt(riverPoint),
      })),
      index,
      false,
    );
    const sideSign = index % 2 === 0 ? -1 : 1;
    const offset = RIVER_WIDTH_M * 0.5 + 18 + (index % 3) * 8;
    const rockPoint = {
      x: point.x + tangent.normalX * offset * sideSign,
      z: point.z + tangent.normalZ * offset * sideSign,
    };

    placements.push({
      x: rockPoint.x,
      y: fullTerrainSurfaceYAt(rockPoint) + 1.2,
      z: rockPoint.z,
      scaleX: 4 + (index % 4) * 1.1,
      scaleY: 1.5 + (index % 3) * 0.5,
      scaleZ: 3.2 + (index % 5) * 0.9,
    });
  }

  for (let index = 0; placements.length < NATURAL_ROCK_CLUSTER_COUNT; index += 1) {
    const z = THREE.MathUtils.lerp(
      riverMouth.z + 175,
      mainBoundaryMaxZ - 130,
      index / (NATURAL_ROCK_CLUSTER_COUNT - 24 - 1),
    );
    const x = mainBoundaryMaxX - BEACH_INLAND_WIDTH_M - 16 - (index % 3) * 9;
    const point = { x, z };

    placements.push({
      x,
      y: fullTerrainSurfaceYAt(point) + 1,
      z,
      scaleX: 3.8 + (index % 4),
      scaleY: 1.4 + (index % 2) * 0.4,
      scaleZ: 3 + (index % 5) * 0.6,
    });
  }

  addScaledSphereInstances("natural-river-coast-rock-clusters", smallRockMaterial, placements);
}

function visibleLowlandSurfaceYAt(point: GroundPathPoint) {
  return GRASS_SURFACE_Y + 0.11 + terrainMicroNoise(point.x, point.z);
}

function isInsideMainBoundary(point: GroundPathPoint, marginM = 0) {
  return (
    point.x >= mainBoundaryMinX + marginM &&
    point.x <= mainBoundaryMaxX - marginM &&
    point.z >= mainBoundaryMinZ + marginM &&
    point.z <= mainBoundaryMaxZ - marginM
  );
}

function isInsideReservoirFootprint(point: GroundPathPoint, scale = 1.45) {
  return (
    ((point.x - reservoirCenter.x) / (RESERVOIR_RADIUS_X_M * scale)) ** 2 +
      ((point.z - reservoirCenter.z) / (RESERVOIR_RADIUS_Z_M * scale)) ** 2 <
    1
  );
}

function isLowlandDetailAllowed(point: GroundPathPoint) {
  if (!isInsideMainBoundary(point, 120)) {
    return false;
  }

  if (point.x > mainBoundaryMaxX - BEACH_INLAND_WIDTH_M - 130) {
    return false;
  }

  if (distanceToPath2D(point, riverPath) < RIVER_WIDTH_M * 1.75) {
    return false;
  }

  if (distanceToPath2D(point, terrainRoadAvoidancePath(), true) < HIGHWAY_TOTAL_WIDTH_M * 3.2) {
    return false;
  }

  if (isInsideReservoirFootprint(point)) {
    return false;
  }

  return Math.max(mountainHeightAt(point.x, point.z), snowMountainHeightAt(point.x, point.z)) < 7;
}

function addLowlandGroundCover() {
  const grassPlacements: ScaledXYZPlacement[] = [];
  const scrubPlacements: ScaledXYZPlacement[] = [];
  const westX = mainBoundaryMinX + 170;
  const eastX = mainBoundaryMaxX - BEACH_INLAND_WIDTH_M - 210;
  const southZ = mainBoundaryMinZ + 170;
  const northZ = mainBoundaryMaxZ - 170;

  for (let index = 0; grassPlacements.length < LOWLAND_GRASS_TUFT_COUNT && index < LOWLAND_GRASS_TUFT_COUNT * 3; index += 1) {
    const column = index % 28;
    const row = Math.floor(index / 28);
    const x = THREE.MathUtils.lerp(westX, eastX, column / 27) + Math.sin(index * 1.71) * 21;
    const z =
      THREE.MathUtils.lerp(
        southZ,
        northZ,
        ((row * 13) % 37) / 36,
      ) +
      Math.cos(index * 1.17) * 24;
    const point = { x, z };

    if (!isLowlandDetailAllowed(point)) {
      continue;
    }

    grassPlacements.push({
      x,
      y: visibleLowlandSurfaceYAt(point) + 1.6,
      z,
      scaleX: 1.5 + (index % 4) * 0.22,
      scaleY: 1.8 + (index % 5) * 0.35,
      scaleZ: 1.5 + (index % 3) * 0.2,
    });
  }

  for (let index = 0; scrubPlacements.length < LOWLAND_SCRUB_COUNT && index < LOWLAND_SCRUB_COUNT * 4; index += 1) {
    const column = index % 18;
    const row = Math.floor(index / 18);
    const x = THREE.MathUtils.lerp(westX, eastX, column / 17) + Math.sin(index * 1.93) * 28;
    const z =
      THREE.MathUtils.lerp(
        southZ,
        northZ,
        ((row * 11) % 31) / 30,
      ) +
      Math.cos(index * 1.41) * 30;
    const point = { x, z };

    if (!isLowlandDetailAllowed(point)) {
      continue;
    }

    scrubPlacements.push({
      x,
      y: visibleLowlandSurfaceYAt(point) + 1.05,
      z,
      scaleX: 2.8 + (index % 4) * 0.5,
      scaleY: 1.2 + (index % 3) * 0.24,
      scaleZ: 2.4 + (index % 5) * 0.42,
    });
  }

  const grassMesh = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1, 4.2, 5),
    lowlandDryGrassMaterial,
    grassPlacements.length,
  );
  const scrubMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 9, 6),
    lowlandScrubMaterial,
    scrubPlacements.length,
  );
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);

  grassPlacements.forEach((placement, index) => {
    position.set(placement.x, placement.y, placement.z);
    quaternion.setFromAxisAngle(yAxis, index * 0.67);
    scale.set(placement.scaleX, placement.scaleY, placement.scaleZ);
    matrix.compose(position, quaternion, scale);
    grassMesh.setMatrixAt(index, matrix);
  });
  grassMesh.instanceMatrix.needsUpdate = true;
  grassMesh.name = "visible-lowland-dry-grass-tufts";
  grassMesh.castShadow = true;
  grassMesh.receiveShadow = true;
  naturalElements.add(grassMesh);

  scrubPlacements.forEach((placement, index) => {
    position.set(placement.x, placement.y, placement.z);
    quaternion.setFromAxisAngle(yAxis, index * 0.41);
    scale.set(placement.scaleX, placement.scaleY, placement.scaleZ);
    matrix.compose(position, quaternion, scale);
    scrubMesh.setMatrixAt(index, matrix);
  });
  scrubMesh.instanceMatrix.needsUpdate = true;
  scrubMesh.name = "visible-lowland-scrub-mounds";
  scrubMesh.castShadow = true;
  scrubMesh.receiveShadow = true;
  naturalElements.add(scrubMesh);

  lowlandGroundCoverInstanceCount = grassPlacements.length + scrubPlacements.length;
}

function isInsideBounds(
  point: GroundPathPoint,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  marginM = 0,
) {
  return (
    point.x >= bounds.minX + marginM &&
    point.x <= bounds.maxX - marginM &&
    point.z >= bounds.minZ + marginM &&
    point.z <= bounds.maxZ - marginM
  );
}

function addTubePath(
  name: string,
  points: THREE.Vector3[],
  radius: number,
  material: THREE.Material,
  renderOrder: number,
) {
  if (points.length < 4) {
    return;
  }

  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.35);
  const geometry = new THREE.TubeGeometry(curve, Math.max(12, points.length * 2), radius, 6, false);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.renderOrder = renderOrder;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  naturalElements.add(mesh);
  mountainStrataRidgeMeshCount += 1;
}

function addMountainContourRidges(
  name: string,
  center: GroundPathPoint,
  radiusX: number,
  radiusZ: number,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  ridgeCount: number,
  heightAt: (x: number, z: number) => number,
  yAt: (x: number, z: number, height: number) => number,
  minHeight: number,
  material: THREE.Material,
  renderOrder: number,
) {
  const samples = 132;

  for (let ridgeIndex = 0; ridgeIndex < ridgeCount; ridgeIndex += 1) {
    const ratio = THREE.MathUtils.lerp(0.24, 0.88, ridgeIndex / Math.max(ridgeCount - 1, 1));
    let run: THREE.Vector3[] = [];

    for (let sample = 0; sample <= samples; sample += 1) {
      const angle = (sample / samples) * Math.PI * 2;
      const contourNoise =
        1 +
        0.028 * Math.sin(angle * 3.1 + ridgeIndex * 0.7) +
        0.018 * Math.sin(angle * 7.3 + ridgeIndex * 1.9);
      const x = center.x + Math.cos(angle) * radiusX * ratio * contourNoise;
      const z = center.z + Math.sin(angle) * radiusZ * ratio * contourNoise;
      const point = { x, z };
      const height = heightAt(x, z);

      if (isInsideBounds(point, bounds, 4) && height > minHeight) {
        run.push(new THREE.Vector3(x, yAt(x, z, height) + 1.2, z));
        continue;
      }

      addTubePath(
        `${name}-ridge-${ridgeIndex + 1}-${sample}`,
        run,
        0.66 + (ridgeIndex % 3) * 0.12,
        material,
        renderOrder,
      );
      run = [];
    }

    addTubePath(
      `${name}-ridge-${ridgeIndex + 1}-end`,
      run,
      0.66 + (ridgeIndex % 3) * 0.12,
      material,
      renderOrder,
    );
  }
}

function addMountainStrataRidges() {
  addMountainContourRidges(
    "reservoir-mountain-visible-rock-strata",
    mountainCenter,
    MOUNTAIN_RADIUS_X_M,
    MOUNTAIN_RADIUS_Z_M,
    mountainVisibleBounds,
    MOUNTAIN_STRATA_RIDGE_COUNT,
    mountainHeightAt,
    (_x, _z, height) => mountainSurfaceYAt(height),
    MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M * 0.9,
    mountainRidgeMaterial,
    4.2,
  );
  addMountainContourRidges(
    "snow-mountain-visible-rock-strata",
    snowMountainCenter,
    SNOW_MOUNTAIN_RADIUS_X_M,
    SNOW_MOUNTAIN_RADIUS_Z_M,
    snowMountainVisibleBounds,
    SNOW_MOUNTAIN_STRATA_RIDGE_COUNT,
    snowMountainHeightAt,
    snowMountainSurfaceYAt,
    SNOW_MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M * 0.68,
    mountainRidgeMaterial,
    4.6,
  );
}

function createSnowCapOverlayGeometry() {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const heights: number[] = [];

  for (let zIndex = 0; zIndex <= SNOW_MOUNTAIN_GRID_SEGMENTS; zIndex += 1) {
    const z = THREE.MathUtils.lerp(
      snowMountainVisibleBounds.minZ,
      snowMountainVisibleBounds.maxZ,
      zIndex / SNOW_MOUNTAIN_GRID_SEGMENTS,
    );

    for (let xIndex = 0; xIndex <= SNOW_MOUNTAIN_GRID_SEGMENTS; xIndex += 1) {
      const x = THREE.MathUtils.lerp(
        snowMountainVisibleBounds.minX,
        snowMountainVisibleBounds.maxX,
        xIndex / SNOW_MOUNTAIN_GRID_SEGMENTS,
      );
      const height = snowMountainHeightAt(x, z);
      const windRipple = 0.8 * Math.sin(x * 0.018 + z * 0.011);

      heights.push(height);
      positions.push(x, snowMountainSurfaceYAt(x, z, height) + 1.1 + windRipple, z);
      uvs.push(x / 72, z / 72);
    }
  }

  const rowLength = SNOW_MOUNTAIN_GRID_SEGMENTS + 1;
  for (let zIndex = 0; zIndex < SNOW_MOUNTAIN_GRID_SEGMENTS; zIndex += 1) {
    for (let xIndex = 0; xIndex < SNOW_MOUNTAIN_GRID_SEGMENTS; xIndex += 1) {
      const a = zIndex * rowLength + xIndex;
      const b = a + 1;
      const c = a + rowLength;
      const d = c + 1;
      const cellMinHeight = Math.min(heights[a], heights[b], heights[c], heights[d]);

      if (cellMinHeight > SNOW_MOUNTAIN_SNOWLINE_M * 0.96) {
        indices.push(a, c, b, b, c, d);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addSnowCapOverlay() {
  const cap = new THREE.Mesh(createSnowCapOverlayGeometry(), snowPatchMaterial);
  cap.name = "high-mountain-separate-snow-cap-overlay";
  cap.renderOrder = 4.7;
  cap.castShadow = true;
  cap.receiveShadow = true;
  naturalElements.add(cap);
  snowCapOverlayInstalled = true;
}

function addMountainTalusField(
  name: string,
  center: GroundPathPoint,
  radiusX: number,
  radiusZ: number,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  targetCount: number,
  heightAt: (x: number, z: number) => number,
  yAt: (x: number, z: number, height: number) => number,
  minHeight: number,
  maxHeight: number,
) {
  const placements: ScaledXYZPlacement[] = [];

  for (let index = 0; placements.length < targetCount && index < targetCount * 6; index += 1) {
    const angle = index * 2.399963229728653;
    const ratio = 0.58 + ((index * 37) % 100) / 100 * 0.38;
    const x = center.x + Math.cos(angle) * radiusX * ratio;
    const z = center.z + Math.sin(angle) * radiusZ * ratio;
    const point = { x, z };
    const height = heightAt(x, z);

    if (
      !isInsideBounds(point, bounds, 10) ||
      height < minHeight ||
      height > maxHeight ||
      distanceToPath2D(point, terrainRoadAvoidancePath(), true) < HIGHWAY_TOTAL_WIDTH_M * 2.2
    ) {
      continue;
    }

    placements.push({
      x,
      y: yAt(x, z, height) + 1.2,
      z,
      scaleX: 4.2 + (index % 5) * 0.9,
      scaleY: 1.5 + (index % 4) * 0.42,
      scaleZ: 3.5 + (index % 6) * 0.75,
    });
  }

  addScaledSphereInstances(name, smallRockMaterial, placements);
  talusBoulderInstanceCount += placements.length;
}

function addMountainTalusFields() {
  addMountainTalusField(
    "reservoir-mountain-talus-boulder-field",
    mountainCenter,
    MOUNTAIN_RADIUS_X_M,
    MOUNTAIN_RADIUS_Z_M,
    mountainVisibleBounds,
    MOUNTAIN_TALUS_BOULDER_COUNT,
    mountainHeightAt,
    (_x, _z, height) => mountainSurfaceYAt(height),
    22,
    MOUNTAIN_HEIGHT_M * 0.62,
  );
  addMountainTalusField(
    "snow-mountain-talus-boulder-field",
    snowMountainCenter,
    SNOW_MOUNTAIN_RADIUS_X_M,
    SNOW_MOUNTAIN_RADIUS_Z_M,
    snowMountainVisibleBounds,
    SNOW_MOUNTAIN_TALUS_BOULDER_COUNT,
    snowMountainHeightAt,
    snowMountainSurfaceYAt,
    34,
    SNOW_MOUNTAIN_SNOWLINE_M * 0.84,
  );
}

function addCoastalShallowWaterShelf() {
  const shelfSouthZ = riverMouth.z - CARGO_PORT_RIVER_OFFSET_M - 160;
  const points = [
    { x: mainBoundaryMaxX - 2, z: shelfSouthZ },
    { x: mainBoundaryMaxX + SHALLOW_WATER_SHELF_WIDTH_M * 0.38, z: shelfSouthZ - 16 },
    { x: mainBoundaryMaxX + SHALLOW_WATER_SHELF_WIDTH_M, z: riverMouth.z - 76 },
    { x: mainBoundaryMaxX + SHALLOW_WATER_SHELF_WIDTH_M * 0.86, z: mainBoundaryMaxZ + 108 },
    { x: mainBoundaryMaxX + SHALLOW_WATER_SHELF_WIDTH_M * 0.16, z: mainBoundaryMaxZ + 74 },
    { x: mainBoundaryMaxX - 2, z: mainBoundaryMaxZ },
    { x: mainBoundaryMaxX - 2, z: riverMouth.z + 140 },
  ];
  const positions: number[] = [];
  const indices = THREE.ShapeUtils.triangulateShape(
    points.map((point) => new THREE.Vector2(point.x, point.z)),
    [],
  ).flat();

  for (const point of points) {
    positions.push(point.x, SEA_Y + 0.045, point.z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  addPlanarXZUVs(geometry);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  addSharedSeaWaterMesh("coastal-shallow-water-shelf", geometry, 1);
}

function riverRoadLikePath(yLift = 0): RoadPathPoint[] {
  return riverPath.map((point, index) => {
    const progress = index / Math.max(riverPath.length - 1, 1);
    return {
      x: point.x,
      y: riverWaterYAt(point, progress) + yLift,
      z: point.z,
    };
  });
}

function addNaturalSurfaceRibbon(
  name: string,
  path: RoadPathPoint[],
  width: number,
  material: THREE.Material,
  renderOrder: number,
) {
  const mesh = new THREE.Mesh(
    createRoadRibbonSurfaceGeometry(path, width, false, 0),
    material,
  );
  mesh.name = name;
  mesh.renderOrder = renderOrder;
  mesh.receiveShadow = true;
  naturalElements.add(mesh);
}

function addRiverErosionRibbons() {
  const basePath = riverRoadLikePath(0.36);

  for (const [index, offset] of [
    -(RIVER_WIDTH_M * 0.5 + 4),
    RIVER_WIDTH_M * 0.5 + 4,
  ].entries()) {
    addNaturalSurfaceRibbon(
      `river-wet-erosion-edge-${index + 1}`,
      offsetRoadPath(basePath, offset, false),
      3.8,
      concreteSeamMaterial,
      6,
    );
  }
}

function addRiverReedsAndPebbles() {
  const riverSurfacePath = riverRoadLikePath();
  const reedMesh = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.85, 1, 5),
    reedMaterial,
    RIVER_REED_CLUSTER_COUNT,
  );
  const reedMatrix = new THREE.Matrix4();
  const reedPosition = new THREE.Vector3();
  const reedQuaternion = new THREE.Quaternion();
  const reedScale = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const pebblePlacements: ScaledOrientedXYZPlacement[] = [];

  for (let index = 0; index < RIVER_REED_CLUSTER_COUNT; index += 1) {
    const pathIndex = 5 + ((index * 7) % Math.max(riverSurfacePath.length - 11, 1));
    const point = riverSurfacePath[pathIndex];
    const tangent = pathTangent(riverSurfacePath, pathIndex, false);
    const sideSign = index % 2 === 0 ? -1 : 1;
    const offset = (RIVER_WIDTH_M * 0.5 + 12 + (index % 4) * 5) * sideSign;
    const x = point.x + tangent.normalX * offset;
    const z = point.z + tangent.normalZ * offset;
    const height = 3.8 + (index % 5) * 0.55;
    const groundY = fullTerrainSurfaceYAt({ x, z });

    reedPosition.set(x, groundY + height * 0.5, z);
    reedQuaternion.setFromAxisAngle(yAxis, index * 0.77);
    reedScale.set(0.9 + (index % 3) * 0.12, height, 0.9 + (index % 4) * 0.08);
    reedMatrix.compose(reedPosition, reedQuaternion, reedScale);
    reedMesh.setMatrixAt(index, reedMatrix);
  }

  reedMesh.instanceMatrix.needsUpdate = true;
  reedMesh.name = "riverbank-reed-clusters";
  reedMesh.castShadow = true;
  reedMesh.receiveShadow = true;
  naturalElements.add(reedMesh);

  for (let index = 0; index < RIVER_PEBBLE_COUNT; index += 1) {
    const pathIndex = 4 + ((index * 5) % Math.max(riverSurfacePath.length - 9, 1));
    const point = riverSurfacePath[pathIndex];
    const tangent = pathTangent(riverSurfacePath, pathIndex, false);
    const sideSign = index % 2 === 0 ? -1 : 1;
    const offset = (RIVER_WIDTH_M * 0.5 + 3 + (index % 5) * 2.1) * sideSign;
    const x = point.x + tangent.normalX * offset;
    const z = point.z + tangent.normalZ * offset;

    pebblePlacements.push({
      x,
      y: fullTerrainSurfaceYAt({ x, z }) + 0.45,
      z,
      rotationY: index * 0.41,
      scaleX: 1.2 + (index % 4) * 0.32,
      scaleY: 0.35 + (index % 3) * 0.08,
      scaleZ: 0.85 + (index % 5) * 0.2,
    });
  }

  addScaledOrientedSphereInstances("riverbank-pebble-fields", smallPebbleMaterial, pebblePlacements);
}

function addNaturalDetailPass() {
  addRiverErosionRibbons();
  addRiverReedsAndPebbles();
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

  addBeachNaturalDetails(beachInnerX);
  addBeachAmenities(beachInnerX);

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
  addPierStructuralDetail(attractionPierCenterX, attractionPierCenterZ);

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
  addPrivateMarinaHardware(marinaCenterZ);

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
  addCargoPortSurfaceDetail(cargoPortCenterX, cargoPortCenterZ, cargoPortEastEdge);

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

addSurroundingShaderSea();
addCoastalShallowWaterShelf();
addMainlandOutsideBoundary();
addMainBoundarySurface();
addMicroDisplacedGrassTerrain();
addSimpleMainlandCoast();
addNaturalRockClusters();
addLowlandGroundCover();
addNaturalDetailPass();

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
  addPlanarXZUVs(geometry);
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

function snowMountainFaceOutwardNormalAt(point: GroundPathPoint) {
  const sampleStepM = 8;
  const heightGradientX =
    (snowMountainHeightAt(point.x + sampleStepM, point.z) -
      snowMountainHeightAt(point.x - sampleStepM, point.z)) /
    (sampleStepM * 2);
  const heightGradientZ =
    (snowMountainHeightAt(point.x, point.z + sampleStepM) -
      snowMountainHeightAt(point.x, point.z - sampleStepM)) /
    (sampleStepM * 2);
  let outwardX = -heightGradientX;
  let outwardZ = -heightGradientZ;
  let length = Math.hypot(outwardX, outwardZ);

  if (length < 0.0001) {
    outwardX = (point.x - snowMountainCenter.x) / SNOW_MOUNTAIN_RADIUS_X_M ** 2;
    outwardZ = (point.z - snowMountainCenter.z) / SNOW_MOUNTAIN_RADIUS_Z_M ** 2;
    length = Math.hypot(outwardX, outwardZ) || 1;
  }

  return {
    x: outwardX / length,
    z: outwardZ / length,
  };
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
    isDamFace: false,
  };
}

function reservoirWaterDamFacePoint(lengthOffset: number) {
  const point = curvedDamPoint(
    lengthOffset,
    -DAM_THICKNESS_M * 0.5 - RESERVOIR_WATER_DAM_FACE_SETBACK_M,
  );

  return {
    ...point,
    isDamFace: true,
  };
}

function createReservoirLakeBoundaryPoints() {
  const boundaryPoints: ReservoirLakeBoundaryPoint[] = [];
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
          -DAM_WATER_FACE_HALF_LENGTH_M,
          DAM_WATER_FACE_HALF_LENGTH_M,
          ratio,
        );
        boundaryPoints.push(reservoirWaterDamFacePoint(lengthOffset));
      }

      damFaceInserted = true;
    }
  }

  return boundaryPoints;
}

function createReservoirLakeGeometry() {
  const topY = reservoirLakeY();
  const bottomY = topY - RESERVOIR_WATER_DEPTH_M;
  const boundaryPoints = createReservoirLakeBoundaryPoints();
  const topTriangles = THREE.ShapeUtils.triangulateShape(
    boundaryPoints.map((point) => new THREE.Vector2(point.x, point.z)),
    [],
  );
  const signedArea =
    boundaryPoints.reduce((area, point, index) => {
      const next = boundaryPoints[(index + 1) % boundaryPoints.length];
      return area + point.x * next.z - next.x * point.z;
    }, 0) * 0.5;
  const boundaryRunsClockwise = signedArea < 0;
  const positions = [
    reservoirCenter.x,
    topY,
    reservoirCenter.z,
    reservoirCenter.x,
    bottomY,
    reservoirCenter.z,
  ];
  const topIndices: number[] = [];
  const bottomIndices: number[] = [];
  const sideIndices: number[] = [];

  for (const point of boundaryPoints) {
    positions.push(point.x, topY, point.z, point.x, bottomY, point.z);
  }

  for (const triangle of topTriangles) {
    const topA = 2 + triangle[0] * 2;
    const topB = 2 + triangle[1] * 2;
    const topC = 2 + triangle[2] * 2;
    const bottomA = topA + 1;
    const bottomB = topB + 1;
    const bottomC = topC + 1;

    if (boundaryRunsClockwise) {
      topIndices.push(topA, topB, topC);
      bottomIndices.push(bottomA, bottomC, bottomB);
    } else {
      topIndices.push(topA, topC, topB);
      bottomIndices.push(bottomA, bottomB, bottomC);
    }
  }

  for (let index = 0; index < boundaryPoints.length; index += 1) {
    const nextIndex = (index + 1) % boundaryPoints.length;
    const topCurrent = 2 + index * 2;
    const bottomCurrent = topCurrent + 1;
    const topNext = 2 + nextIndex * 2;
    const bottomNext = topNext + 1;

    if (boundaryPoints[index].isDamFace && boundaryPoints[nextIndex].isDamFace) {
      sideIndices.push(topCurrent, bottomCurrent, topNext);
      sideIndices.push(topNext, bottomCurrent, bottomNext);
    }
  }

  const indices = [...topIndices, ...bottomIndices, ...sideIndices];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  addPlanarXZUVs(geometry);
  geometry.setIndex(indices);
  geometry.clearGroups();
  geometry.addGroup(0, topIndices.length + bottomIndices.length, 0);
  geometry.addGroup(topIndices.length + bottomIndices.length, sideIndices.length, 1);
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
    Math.abs(alongDam) < DAM_NATURAL_BANK_OPENING_HALF_LENGTH_M
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
    if (stationInDamOpening[index] && stationInDamOpening[index + 1]) {
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

function fullTerrainSurfaceYAt(point: GroundPathPoint) {
  const snowHeight = snowMountainHeightAt(point.x, point.z);
  const baseTerrainY = terrainSurfaceYAt(point);

  if (snowHeight <= SNOW_MOUNTAIN_MIN_RENDER_HEIGHT_M) {
    return baseTerrainY;
  }

  return Math.max(
    baseTerrainY,
    snowMountainSurfaceYAt(point.x, point.z, snowHeight),
  );
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
  const seaBlend = THREE.MathUtils.smoothstep(progress, 0.1, 1);
  return THREE.MathUtils.lerp(riverMouthY, SEA_Y + 0.02, seaBlend);
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
  addPlanarXZUVs(geometry);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createEstuaryStripGeometry(path: GroundPathPoint[]) {
  const positions: number[] = [];
  const uvs: number[] = [];
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
    uvs.push(progress * 4, 0, progress * 4, 1);
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
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
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

function lowlandRoadYAt(point: GroundPathPoint) {
  void point;
  return damRoadDeckY();
}

function damRoadDeckY() {
  const damBaseY = Math.max(
    GRASS_SURFACE_Y + mountainHeightAt(damCenter.x, damCenter.z),
    reservoirLakeY() - DAM_HEIGHT_M * 0.46,
  );
  return damBaseY + DAM_HEIGHT_M + HIGHWAY_DECK_THICKNESS_M;
}

function bridgeRoadYAt(point: GroundPathPoint) {
  void point;
  return damRoadDeckY();
}

function roadPoint(x: number, z: number, y: number): RoadPathPoint {
  return { x, y, z };
}

function damRoadPoint(lengthOffset: number): RoadPathPoint {
  const point = curvedDamPoint(lengthOffset, 0);
  return roadPoint(point.x, point.z, damRoadDeckY());
}

function getDamRoadControlPoints() {
  return [112, 58, 0, -58, -112].map((lengthOffset) => damRoadPoint(lengthOffset));
}

function tunnelRoadYAt(point: GroundPathPoint) {
  void point;
  return damRoadDeckY();
}

function getHighwayLoopControlPoints() {
  const damPoints = getDamRoadControlPoints();
  const tunnelEntry = { x: -720, z: 55 };
  const tunnelEntryFaceNormal = snowMountainFaceOutwardNormalAt(tunnelEntry);
  const tunnelEntryApproach = {
    x: tunnelEntry.x + tunnelEntryFaceNormal.x * 170,
    z: tunnelEntry.z + tunnelEntryFaceNormal.z * 170,
  };
  const tunnelEntryThroat = {
    x: tunnelEntry.x - tunnelEntryFaceNormal.x * 170,
    z: tunnelEntry.z - tunnelEntryFaceNormal.z * 170,
  };
  const tunnelMid = { x: -365, z: -470 };
  const tunnelExit = { x: 100, z: -690 };
  const tunnelExitFaceNormal = snowMountainFaceOutwardNormalAt(tunnelExit);
  const tunnelExitThroat = {
    x: tunnelExit.x - tunnelExitFaceNormal.x * 170,
    z: tunnelExit.z - tunnelExitFaceNormal.z * 170,
  };
  const tunnelExitApproach = {
    x: tunnelExit.x + tunnelExitFaceNormal.x * 170,
    z: tunnelExit.z + tunnelExitFaceNormal.z * 170,
  };

  return [
    ...damPoints,
    roadPoint(-630, 280, lowlandRoadYAt({ x: -630, z: 280 })),
    roadPoint(tunnelEntryApproach.x, tunnelEntryApproach.z, lowlandRoadYAt(tunnelEntryApproach)),
    roadPoint(tunnelEntry.x, tunnelEntry.z, tunnelRoadYAt(tunnelEntry)),
    roadPoint(tunnelEntryThroat.x, tunnelEntryThroat.z, tunnelRoadYAt(tunnelEntryThroat)),
    roadPoint(tunnelMid.x, tunnelMid.z, tunnelRoadYAt(tunnelMid)),
    roadPoint(tunnelExitThroat.x, tunnelExitThroat.z, tunnelRoadYAt(tunnelExitThroat)),
    roadPoint(tunnelExit.x, tunnelExit.z, tunnelRoadYAt(tunnelExit)),
    roadPoint(tunnelExitApproach.x, tunnelExitApproach.z, lowlandRoadYAt(tunnelExitApproach)),
    roadPoint(760, -610, lowlandRoadYAt({ x: 760, z: -610 })),
    roadPoint(805, -360, lowlandRoadYAt({ x: 805, z: -360 })),
    roadPoint(770, -85, bridgeRoadYAt({ x: 770, z: -85 })),
    roadPoint(730, 110, bridgeRoadYAt({ x: 730, z: 110 })),
    roadPoint(690, 280, bridgeRoadYAt({ x: 690, z: 280 })),
    roadPoint(510, 520, lowlandRoadYAt({ x: 510, z: 520 })),
    roadPoint(250, 640, lowlandRoadYAt({ x: 250, z: 640 })),
    roadPoint(-40, 690, lowlandRoadYAt({ x: -40, z: 690 })),
    roadPoint(-255, 660, lowlandRoadYAt({ x: -255, z: 660 })),
  ];
}

function sampleRoadControlPath(
  controlPoints: RoadPathPoint[],
  closed: boolean,
  samples: number,
) {
  const curve = new THREE.CatmullRomCurve3(
    controlPoints.map((point) => new THREE.Vector3(point.x, point.y, point.z)),
    closed,
    "centripetal",
    0.35,
  );
  const sampled = curve.getSpacedPoints(samples).map((point) => ({
    x: point.x,
    y: point.y,
    z: point.z,
  }));

  if (closed) {
    sampled.pop();
  }

  return sampled;
}

function pathTangent(path: RoadPathPoint[], index: number, closed: boolean) {
  const previous =
    index === 0
      ? closed
        ? path[path.length - 1]
        : path[0]
      : path[index - 1];
  const next =
    index === path.length - 1
      ? closed
        ? path[0]
        : path[path.length - 1]
      : path[index + 1];
  const tangentX = next.x - previous.x;
  const tangentZ = next.z - previous.z;
  const length = Math.hypot(tangentX, tangentZ) || 1;
  return {
    x: tangentX / length,
    z: tangentZ / length,
    normalX: -tangentZ / length,
    normalZ: tangentX / length,
  };
}

function offsetRoadPath(path: RoadPathPoint[], offset: number, closed: boolean) {
  return path.map((point, index) => {
    const tangent = pathTangent(path, index, closed);
    return {
      x: point.x + tangent.normalX * offset,
      y: point.y,
      z: point.z + tangent.normalZ * offset,
    };
  });
}

function createRoadRibbonSurfaceGeometry(
  path: RoadPathPoint[],
  width: number,
  closed: boolean,
  yLift = 0,
) {
  const positions: number[] = [];
  const indices: number[] = [];

  path.forEach((point, index) => {
    const tangent = pathTangent(path, index, closed);
    const halfWidth = width * 0.5;
    positions.push(
      point.x + tangent.normalX * halfWidth,
      point.y + yLift,
      point.z + tangent.normalZ * halfWidth,
      point.x - tangent.normalX * halfWidth,
      point.y + yLift,
      point.z - tangent.normalZ * halfWidth,
    );
  });

  const segmentCount = closed ? path.length : path.length - 1;
  for (let index = 0; index < segmentCount; index += 1) {
    const nextIndex = (index + 1) % path.length;
    const leftA = index * 2;
    const rightA = leftA + 1;
    const leftB = nextIndex * 2;
    const rightB = leftB + 1;
    indices.push(leftA, rightA, leftB, leftB, rightA, rightB);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createDashedRoadRibbonSurfaceGeometry(
  path: RoadPathPoint[],
  width: number,
  closed: boolean,
  yLift: number,
  dashSegments: number,
  gapSegments: number,
) {
  const positions: number[] = [];
  const indices: number[] = [];
  const segmentCount = closed ? path.length : path.length - 1;
  const cycleLength = dashSegments + gapSegments;

  for (let index = 0; index < segmentCount; index += 1) {
    if (Math.floor(index / dashSegments) % Math.ceil(cycleLength / dashSegments) !== 0) {
      continue;
    }

    const nextIndex = (index + 1) % path.length;
    const pointA = path[index];
    const pointB = path[nextIndex];
    const tangent = pathTangent(path, index, closed);
    const halfWidth = width * 0.5;
    const baseIndex = positions.length / 3;

    positions.push(
      pointA.x + tangent.normalX * halfWidth,
      pointA.y + yLift,
      pointA.z + tangent.normalZ * halfWidth,
      pointA.x - tangent.normalX * halfWidth,
      pointA.y + yLift,
      pointA.z - tangent.normalZ * halfWidth,
      pointB.x + tangent.normalX * halfWidth,
      pointB.y + yLift,
      pointB.z + tangent.normalZ * halfWidth,
      pointB.x - tangent.normalX * halfWidth,
      pointB.y + yLift,
      pointB.z - tangent.normalZ * halfWidth,
    );
    indices.push(
      baseIndex,
      baseIndex + 1,
      baseIndex + 2,
      baseIndex + 2,
      baseIndex + 1,
      baseIndex + 3,
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createRoadRibbonVolumeGeometry(
  path: RoadPathPoint[],
  width: number,
  thickness: number,
  closed: boolean,
) {
  const positions: number[] = [];
  const topIndices: number[] = [];
  const sideIndices: number[] = [];

  path.forEach((point, index) => {
    const tangent = pathTangent(path, index, closed);
    const halfWidth = width * 0.5;
    const leftX = point.x + tangent.normalX * halfWidth;
    const leftZ = point.z + tangent.normalZ * halfWidth;
    const rightX = point.x - tangent.normalX * halfWidth;
    const rightZ = point.z - tangent.normalZ * halfWidth;

    positions.push(
      leftX,
      point.y,
      leftZ,
      rightX,
      point.y,
      rightZ,
      leftX,
      point.y - thickness,
      leftZ,
      rightX,
      point.y - thickness,
      rightZ,
    );
  });

  const segmentCount = closed ? path.length : path.length - 1;
  for (let index = 0; index < segmentCount; index += 1) {
    const nextIndex = (index + 1) % path.length;
    const leftTopA = index * 4;
    const rightTopA = leftTopA + 1;
    const leftBottomA = leftTopA + 2;
    const rightBottomA = leftTopA + 3;
    const leftTopB = nextIndex * 4;
    const rightTopB = leftTopB + 1;
    const leftBottomB = leftTopB + 2;
    const rightBottomB = leftTopB + 3;

    topIndices.push(leftTopA, rightTopA, leftTopB, leftTopB, rightTopA, rightTopB);
    sideIndices.push(
      leftBottomA,
      leftBottomB,
      rightBottomA,
      rightBottomA,
      leftBottomB,
      rightBottomB,
      leftTopA,
      leftTopB,
      leftBottomA,
      leftBottomA,
      leftTopB,
      leftBottomB,
      rightTopA,
      rightBottomA,
      rightTopB,
      rightTopB,
      rightBottomA,
      rightBottomB,
    );
  }
  const indices = [...topIndices, ...sideIndices];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  addPlanarXZUVs(geometry);
  geometry.setIndex(indices);
  geometry.clearGroups();
  geometry.addGroup(0, topIndices.length, 0);
  geometry.addGroup(topIndices.length, sideIndices.length, 1);
  geometry.computeVertexNormals();
  return geometry;
}

function addRoadRibbon(
  name: string,
  path: RoadPathPoint[],
  width: number,
  material: THREE.Material,
  closed: boolean,
  yLift: number,
) {
  const mesh = new THREE.Mesh(
    createRoadRibbonSurfaceGeometry(path, width, closed, yLift),
    material,
  );
  mesh.name = name;
  mesh.renderOrder = 10;
  mesh.receiveShadow = true;
  roadElements.add(mesh);
}

function addDashedRoadRibbon(
  name: string,
  path: RoadPathPoint[],
  width: number,
  material: THREE.Material,
  closed: boolean,
  yLift: number,
) {
  const mesh = new THREE.Mesh(
    createDashedRoadRibbonSurfaceGeometry(
      path,
      width,
      closed,
      yLift,
      HIGHWAY_DASH_SEGMENTS,
      HIGHWAY_DASH_GAP_SEGMENTS,
    ),
    material,
  );
  mesh.name = name;
  mesh.renderOrder = 11;
  mesh.receiveShadow = true;
  roadElements.add(mesh);
}

function addRoadDeck(name: string, path: RoadPathPoint[], closed: boolean) {
  const mesh = new THREE.Mesh(
    createRoadRibbonVolumeGeometry(
      path,
      HIGHWAY_TOTAL_WIDTH_M,
      HIGHWAY_DECK_THICKNESS_M,
      closed,
    ),
    [highwayAsphaltMaterial, highwaySideMaterial],
  );
  mesh.name = name;
  mesh.renderOrder = 9;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  roadElements.add(mesh);
}

function highwayLaneOffset(direction: "clockwise" | "counterclockwise", laneIndex: number) {
  const offset =
    HIGHWAY_MEDIAN_WIDTH_M * 0.5 +
    HIGHWAY_LANE_WIDTH_M * 0.5 +
    laneIndex * HIGHWAY_LANE_WIDTH_M;
  return direction === "clockwise" ? -offset : offset;
}

function buildHighwayLanePaths(centerPath: RoadPathPoint[]) {
  const lanes: LanePath[] = [];

  for (let laneIndex = 0; laneIndex < HIGHWAY_LANES_PER_DIRECTION; laneIndex += 1) {
    const clockwiseOffset = highwayLaneOffset("clockwise", laneIndex);
    const counterclockwiseOffset = highwayLaneOffset("counterclockwise", laneIndex);
    lanes.push({
      id: `highway-loop-cw-lane-${laneIndex + 1}`,
      roadId: "smart-highway-loop",
      direction: "clockwise",
      laneIndex,
      centerOffsetM: clockwiseOffset,
      points: offsetRoadPath(centerPath, clockwiseOffset, true),
    });
    lanes.push({
      id: `highway-loop-ccw-lane-${laneIndex + 1}`,
      roadId: "smart-highway-loop",
      direction: "counterclockwise",
      laneIndex,
      centerOffsetM: counterclockwiseOffset,
      points: offsetRoadPath(centerPath, counterclockwiseOffset, true).reverse(),
    });
  }

  return lanes;
}

function addHighwayMarkings(centerPath: RoadPathPoint[], closed: boolean) {
  for (const offset of [
    -HIGHWAY_MEDIAN_WIDTH_M * 0.5 - HIGHWAY_LANE_WIDTH_M * 0.5,
    -HIGHWAY_MEDIAN_WIDTH_M * 0.5 - HIGHWAY_LANE_WIDTH_M * 1.5,
    HIGHWAY_MEDIAN_WIDTH_M * 0.5 + HIGHWAY_LANE_WIDTH_M * 0.5,
    HIGHWAY_MEDIAN_WIDTH_M * 0.5 + HIGHWAY_LANE_WIDTH_M * 1.5,
  ]) {
    addRoadRibbon(
      `highway-tire-wear-strip-${offset.toFixed(1)}`,
      offsetRoadPath(centerPath, offset, closed),
      1.1,
      highwayTireWearMaterial,
      closed,
      0.16,
    );
  }

  for (const offset of [
    -(HIGHWAY_TOTAL_WIDTH_M * 0.5 - HIGHWAY_SHOULDER_WIDTH_M * 0.5),
    HIGHWAY_TOTAL_WIDTH_M * 0.5 - HIGHWAY_SHOULDER_WIDTH_M * 0.5,
  ]) {
    addRoadRibbon(
      `highway-loop-outer-shoulder-${offset < 0 ? "cw" : "ccw"}`,
      offsetRoadPath(centerPath, offset, closed),
      HIGHWAY_SHOULDER_WIDTH_M,
      highwayShoulderMaterial,
      closed,
      0.06,
    );
  }

  addRoadRibbon(
    "highway-loop-raised-median",
    centerPath,
    HIGHWAY_MEDIAN_WIDTH_M,
    highwayMedianMaterial,
    closed,
    0.11,
  );
  addRoadRibbon(
    "highway-loop-concrete-median-barrier",
    centerPath,
    1.2,
    roadStructureConcreteMaterial,
    closed,
    0.75,
  );

  for (const offset of [
    -HIGHWAY_MEDIAN_WIDTH_M * 0.5,
    HIGHWAY_MEDIAN_WIDTH_M * 0.5,
  ]) {
    addRoadRibbon(
      `highway-loop-yellow-median-line-${offset < 0 ? "cw" : "ccw"}`,
      offsetRoadPath(centerPath, offset, closed),
      0.62,
      roadMarkingYellowMaterial,
      closed,
      0.18,
    );
  }

  for (const offset of [
    -(HIGHWAY_MEDIAN_WIDTH_M * 0.5 + HIGHWAY_LANE_WIDTH_M),
    HIGHWAY_MEDIAN_WIDTH_M * 0.5 + HIGHWAY_LANE_WIDTH_M,
  ]) {
    addDashedRoadRibbon(
      `highway-loop-dashed-lane-line-${offset.toFixed(1)}`,
      offsetRoadPath(centerPath, offset, closed),
      0.56,
      roadMarkingWhiteMaterial,
      closed,
      0.21,
    );
  }

  for (const offset of [
    -(HIGHWAY_TOTAL_WIDTH_M * 0.5 - HIGHWAY_SHOULDER_WIDTH_M),
    HIGHWAY_TOTAL_WIDTH_M * 0.5 - HIGHWAY_SHOULDER_WIDTH_M,
  ]) {
    addRoadRibbon(
      `highway-loop-white-lane-line-${offset.toFixed(1)}`,
      offsetRoadPath(centerPath, offset, closed),
      0.56,
      roadMarkingWhiteMaterial,
      closed,
      0.19,
    );
  }

  for (const offset of [
    -(HIGHWAY_TOTAL_WIDTH_M * 0.5 + 0.9),
    HIGHWAY_TOTAL_WIDTH_M * 0.5 + 0.9,
  ]) {
    addRoadRibbon(
      `highway-continuous-side-barrier-${offset < 0 ? "left" : "right"}`,
      offsetRoadPath(centerPath, offset, closed),
      0.85,
      roadStructureConcreteMaterial,
      closed,
      0.98,
    );
  }

  for (const offset of [
    -(HIGHWAY_TOTAL_WIDTH_M * 0.5 - 1.25),
    HIGHWAY_TOTAL_WIDTH_M * 0.5 - 1.25,
  ]) {
    addRoadRibbon(
      `highway-edge-drainage-channel-${offset < 0 ? "left" : "right"}`,
      offsetRoadPath(centerPath, offset, closed),
      0.72,
      roadDrainMaterial,
      closed,
      0.31,
    );
  }
}

function addHighwaySurfaceDecals(name: string, path: RoadPathPoint[]) {
  const expansionJointPlacements: OrientedXYZPlacement[] = [];
  const crackPlacements: OrientedXYZPlacement[] = [];
  const reflectorPlacements: OrientedXYZPlacement[] = [];
  const signPlacements: OrientedXYZPlacement[] = [];

  for (let index = 0; index < HIGHWAY_EXPANSION_JOINT_COUNT; index += 1) {
    const pathIndex = Math.round(((index + 1) / (HIGHWAY_EXPANSION_JOINT_COUNT + 1)) * (path.length - 1));
    const point = path[pathIndex];
    const tangent = pathTangent(path, pathIndex, false);
    expansionJointPlacements.push({
      x: point.x,
      y: point.y + 0.36,
      z: point.z,
      rotationY: Math.atan2(tangent.x, tangent.z),
    });
  }

  for (let index = 0; index < HIGHWAY_CRACK_DECAL_COUNT; index += 1) {
    const pathIndex = 3 + ((index * 5) % Math.max(path.length - 7, 1));
    const point = path[pathIndex];
    const tangent = pathTangent(path, pathIndex, false);
    const sideOffset = THREE.MathUtils.lerp(
      -HIGHWAY_TOTAL_WIDTH_M * 0.34,
      HIGHWAY_TOTAL_WIDTH_M * 0.34,
      ((index * 37) % 100) / 100,
    );

    crackPlacements.push({
      x: point.x + tangent.normalX * sideOffset,
      y: point.y + 0.39,
      z: point.z + tangent.normalZ * sideOffset,
      rotationY: Math.atan2(tangent.x, tangent.z) + ((index % 5) - 2) * 0.18,
    });
  }

  for (let index = 0; index < HIGHWAY_REFLECTOR_POST_COUNT / 2; index += 1) {
    const pathIndex = Math.round(((index + 1) / (HIGHWAY_REFLECTOR_POST_COUNT / 2 + 1)) * (path.length - 1));
    const point = path[pathIndex];
    const tangent = pathTangent(path, pathIndex, false);
    const rotationY = Math.atan2(tangent.x, tangent.z);

    for (const sideSign of [-1, 1]) {
      const offset = sideSign * (HIGHWAY_TOTAL_WIDTH_M * 0.5 + 4.8);
      reflectorPlacements.push({
        x: point.x + tangent.normalX * offset,
        y: point.y + 1.35,
        z: point.z + tangent.normalZ * offset,
        rotationY,
      });
    }
  }

  for (let index = 0; index < 4; index += 1) {
    const pathIndex = Math.round(((index + 1) / 5) * (path.length - 1));
    const point = path[pathIndex];
    const tangent = pathTangent(path, pathIndex, false);
    const offset = HIGHWAY_TOTAL_WIDTH_M * 0.5 + 9;
    signPlacements.push({
      x: point.x + tangent.normalX * offset,
      y: point.y + 9,
      z: point.z + tangent.normalZ * offset,
      rotationY: Math.atan2(tangent.x, tangent.z),
    });
  }

  addOrientedBoxInstances(
    `${name}-asphalt-expansion-joints`,
    HIGHWAY_TOTAL_WIDTH_M - 2.4,
    0.08,
    0.72,
    concreteSeamMaterial,
    expansionJointPlacements,
    roadElements,
    false,
  );
  addOrientedBoxInstances(
    `${name}-asphalt-crack-decals`,
    12,
    0.07,
    0.34,
    roadCrackMaterial,
    crackPlacements,
    roadElements,
    false,
  );
  addOrientedBoxInstances(
    `${name}-edge-reflector-posts`,
    1.1,
    2.7,
    1.1,
    roadMarkingWhiteMaterial,
    reflectorPlacements,
    roadElements,
  );
  addOrientedBoxInstances(
    `${name}-highway-wayfinding-signs`,
    17,
    6,
    0.8,
    safetySignMaterial,
    signPlacements,
    roadElements,
  );
}

function getRiverBridgePath() {
  const controlPoints = getHighwayLoopControlPoints().slice(
    HIGHWAY_RIVER_BRIDGE_START_CONTROL_INDEX,
    HIGHWAY_RIVER_BRIDGE_END_CONTROL_INDEX,
  );
  return sampleRoadControlPath(controlPoints, false, 44);
}

function getDamCrossingPath() {
  return sampleRoadControlPath(getDamRoadControlPoints(), false, 32);
}

function getVisibleHighwaySegments() {
  const controlPoints = getHighwayLoopControlPoints();

  return [
    {
      name: "outside-mountain-tunnel-highway",
      path: sampleRoadControlPath(
        [
          ...controlPoints.slice(HIGHWAY_TUNNEL_EXIT_CONTROL_INDEX),
          ...controlPoints.slice(0, HIGHWAY_TUNNEL_ENTRY_CONTROL_INDEX + 1),
        ],
        false,
        272,
      ),
    },
  ];
}

function addRoadEdgeRails(name: string, path: RoadPathPoint[]) {
  const edgeOffset = HIGHWAY_TOTAL_WIDTH_M * 0.5 + 1.2;
  for (const [index, offset] of [-edgeOffset, edgeOffset].entries()) {
    addRoadRibbon(
      `${name}-${index + 1}`,
      offsetRoadPath(path, offset, false),
      1.25,
      roadStructureConcreteMaterial,
      false,
      1.35,
    );
  }
}

function isOnDamCrossing(point: GroundPathPoint) {
  const fromDam = {
    x: point.x - damCenter.x,
    z: point.z - damCenter.z,
  };
  const alongDam = fromDam.x * damLongAxis.x + fromDam.z * damLongAxis.z;
  const acrossDam =
    fromDam.x * reservoirOutletDirection.x + fromDam.z * reservoirOutletDirection.z;

  return (
    Math.abs(alongDam) <= DAM_LENGTH_M * 0.72 &&
    Math.abs(acrossDam) <= DAM_THICKNESS_M * 1.55
  );
}

function isOnRiverBridge(point: GroundPathPoint) {
  return point.x >= 655 && point.x <= 820 && point.z >= -125 && point.z <= 310;
}

function isNearTunnelPortal(point: GroundPathPoint) {
  const controlPoints = getHighwayLoopControlPoints();
  const tunnelEntry = controlPoints[HIGHWAY_TUNNEL_ENTRY_CONTROL_INDEX];
  const tunnelExit = controlPoints[HIGHWAY_TUNNEL_EXIT_CONTROL_INDEX];

  return (
    Math.hypot(point.x - tunnelEntry.x, point.z - tunnelEntry.z) < 80 ||
    Math.hypot(point.x - tunnelExit.x, point.z - tunnelExit.z) < 80
  );
}

function shouldSkipGeneralHighwaySupport(point: GroundPathPoint) {
  return isOnDamCrossing(point) || isOnRiverBridge(point) || isNearTunnelPortal(point);
}

function addRoadSupportColumns(
  name: string,
  path: RoadPathPoint[],
  useWaterBase = false,
  skipPoint: (point: RoadPathPoint, index: number) => boolean = () => false,
) {
  const placements: Array<{ x: number; y: number; z: number; height: number }> = [];
  let distanceSinceLastSupport = 0;

  for (let index = 1; index < path.length; index += 1) {
    const previousPoint = path[index - 1];
    const point = path[index];

    distanceSinceLastSupport += Math.hypot(
      point.x - previousPoint.x,
      point.z - previousPoint.z,
    );

    if (distanceSinceLastSupport < HIGHWAY_SUPPORT_SPACING_M) {
      continue;
    }

    if (skipPoint(point, index)) {
      continue;
    }

    const baseY = useWaterBase ? SEA_Y : fullTerrainSurfaceYAt(point);
    const topY = point.y - HIGHWAY_DECK_THICKNESS_M * 0.55;
    const height = topY - baseY;

    if (height < 5) {
      continue;
    }

    placements.push({
      x: point.x,
      y: baseY + height * 0.5,
      z: point.z,
      height,
    });
    distanceSinceLastSupport = 0;
  }

  if (placements.length === 0) {
    return;
  }

  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(7, 1, 7),
    roadStructureConcreteMaterial,
    placements.length,
  );
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  placements.forEach((placement, index) => {
    position.set(placement.x, placement.y, placement.z);
    scale.set(1, placement.height, 1);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.name = name;
  mesh.renderOrder = 8;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  roadElements.add(mesh);
}

function addOrientedBox(
  name: string,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  rotationY: number,
  parent: THREE.Object3D = roadElements,
) {
  const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  box.name = name;
  box.position.set(x, y, z);
  box.rotation.y = rotationY;
  box.castShadow = true;
  box.receiveShadow = true;
  parent.add(box);
}

function bridgeFrameAtProgress(path: RoadPathPoint[], progress: number) {
  const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);
  const scaledIndex = clampedProgress * (path.length - 1);
  const lowerIndex = Math.floor(scaledIndex);
  const upperIndex = Math.min(path.length - 1, lowerIndex + 1);
  const localProgress = scaledIndex - lowerIndex;
  const lowerPoint = path[lowerIndex];
  const upperPoint = path[upperIndex];
  const tangent = pathTangent(path, Math.round(scaledIndex), false);

  return {
    point: {
      x: THREE.MathUtils.lerp(lowerPoint.x, upperPoint.x, localProgress),
      y: THREE.MathUtils.lerp(lowerPoint.y, upperPoint.y, localProgress),
      z: THREE.MathUtils.lerp(lowerPoint.z, upperPoint.z, localProgress),
    },
    tangent,
  };
}

function bridgeSideVectorAtProgress(
  path: RoadPathPoint[],
  progress: number,
  offset: number,
  yLift = 0,
) {
  const { point, tangent } = bridgeFrameAtProgress(path, progress);

  return new THREE.Vector3(
    point.x + tangent.normalX * offset,
    point.y + yLift,
    point.z + tangent.normalZ * offset,
  );
}

function addBridgeStayCableSegments(
  name: string,
  segments: Array<{ start: THREE.Vector3; end: THREE.Vector3 }>,
) {
  if (segments.length === 0) {
    return;
  }

  const mesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(
      HIGHWAY_BRIDGE_STAY_CABLE_RADIUS_M,
      HIGHWAY_BRIDGE_STAY_CABLE_RADIUS_M,
      1,
      10,
    ),
    bridgeCableMaterial,
    segments.length,
  );
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const verticalAxis = new THREE.Vector3(0, 1, 0);

  segments.forEach((segment, index) => {
    direction.subVectors(segment.end, segment.start);
    const length = direction.length();

    if (length <= 0.01) {
      return;
    }

    position.copy(segment.start).add(segment.end).multiplyScalar(0.5);
    quaternion.setFromUnitVectors(verticalAxis, direction.normalize());
    scale.set(1, length, 1);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.name = name;
  mesh.renderOrder = 14;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  roadElements.add(mesh);
}

function addBridgeStayDeckAnchors(
  name: string,
  anchors: Array<{ position: THREE.Vector3; rotationY: number }>,
) {
  if (anchors.length === 0) {
    return;
  }

  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(4.4, 0.9, 2.8),
    bridgeSteelMaterial,
    anchors.length,
  );
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const yAxis = new THREE.Vector3(0, 1, 0);

  anchors.forEach((anchor, index) => {
    quaternion.setFromAxisAngle(yAxis, anchor.rotationY);
    matrix.compose(anchor.position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.name = name;
  mesh.renderOrder = 13;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  roadElements.add(mesh);
}

function bridgeStayFanTargetProgress(towerProgress: number, fanDirection: -1 | 1) {
  return THREE.MathUtils.clamp(
    towerProgress + fanDirection * HIGHWAY_BRIDGE_STAY_FAN_REACH_PROGRESS,
    0.02,
    0.98,
  );
}

function addBridgeStayCables(name: string, path: RoadPathPoint[]) {
  const towerOffsets = [
    -HIGHWAY_BRIDGE_TOWER_SIDE_OFFSET_M,
    HIGHWAY_BRIDGE_TOWER_SIDE_OFFSET_M,
  ];
  const towerProgresses = [0.24, 0.76];
  const segments: Array<{ start: THREE.Vector3; end: THREE.Vector3 }> = [];
  const anchors: Array<{ position: THREE.Vector3; rotationY: number }> = [];

  for (const towerProgress of towerProgresses) {
    for (const offset of towerOffsets) {
      const deckOffset = Math.sign(offset) * HIGHWAY_BRIDGE_DECK_CABLE_ANCHOR_OFFSET_M;

      for (const fanDirection of [-1, 1] as const) {
        const targetProgress = bridgeStayFanTargetProgress(towerProgress, fanDirection);

        for (
          let cableIndex = 1;
          cableIndex <= HIGHWAY_BRIDGE_STAY_CABLE_COUNT_PER_FAN;
          cableIndex += 1
        ) {
          const progress = cableIndex / (HIGHWAY_BRIDGE_STAY_CABLE_COUNT_PER_FAN + 1);
          const towerAnchorLift = THREE.MathUtils.lerp(
            HIGHWAY_BRIDGE_TOWER_HEIGHT_M - 30,
            HIGHWAY_BRIDGE_TOWER_HEIGHT_M - 6,
            progress,
          );
          const deckProgress = THREE.MathUtils.lerp(towerProgress, targetProgress, progress);
          const towerAnchor = bridgeSideVectorAtProgress(
            path,
            towerProgress,
            offset,
            towerAnchorLift,
          );
          const deckAnchor = bridgeSideVectorAtProgress(
            path,
            deckProgress,
            deckOffset,
            HIGHWAY_BRIDGE_DECK_CABLE_ANCHOR_LIFT_M,
          );
          const { tangent } = bridgeFrameAtProgress(path, deckProgress);
          segments.push({ start: towerAnchor.clone(), end: deckAnchor });
          anchors.push({
            position: deckAnchor.clone().setY(deckAnchor.y - HIGHWAY_BRIDGE_DECK_CABLE_ANCHOR_LIFT_M + 0.46),
            rotationY: Math.atan2(tangent.x, tangent.z),
          });
        }
      }
    }
  }

  addBridgeStayDeckAnchors(`${name}-deck-anchors`, anchors);
  addBridgeStayCableSegments(name, segments);
}

function addCableStayedBridgeTower(name: string, path: RoadPathPoint[], progress: number) {
  const { point, tangent } = bridgeFrameAtProgress(path, progress);
  const rotationY = Math.atan2(tangent.x, tangent.z);
  const towerTopY = point.y + HIGHWAY_BRIDGE_TOWER_HEIGHT_M;
  const towerHeight = towerTopY - SEA_Y;
  const towerOffsets = [
    -HIGHWAY_BRIDGE_TOWER_SIDE_OFFSET_M,
    HIGHWAY_BRIDGE_TOWER_SIDE_OFFSET_M,
  ];

  towerOffsets.forEach((offset, sideIndex) => {
    const sidePoint = bridgeSideVectorAtProgress(path, progress, offset);
    addOrientedBox(
      `${name}-tower-${sideIndex + 1}`,
      HIGHWAY_BRIDGE_TOWER_WIDTH_M,
      towerHeight,
      HIGHWAY_BRIDGE_TOWER_WIDTH_M,
      bridgeSteelMaterial,
      sidePoint.x,
      SEA_Y + towerHeight * 0.5,
      sidePoint.z,
      rotationY,
    );
  });

  addOrientedBox(
    `${name}-upper-crossbeam`,
    HIGHWAY_BRIDGE_TOWER_SIDE_OFFSET_M * 2 + 10,
    5,
    7,
    bridgeSteelMaterial,
    point.x,
    towerTopY,
    point.z,
    rotationY,
  );
  addOrientedBox(
    `${name}-deck-crossbeam`,
    HIGHWAY_BRIDGE_TOWER_SIDE_OFFSET_M * 2 + 7,
    3.5,
    6,
    bridgeSteelMaterial,
    point.x,
    point.y + 12,
    point.z,
    rotationY,
  );
}

function addCableStayedBridgeStructure(name: string, path: RoadPathPoint[]) {
  addCableStayedBridgeTower(`${name}-south-pylon`, path, 0.24);
  addCableStayedBridgeTower(`${name}-north-pylon`, path, 0.76);
  addBridgeStayCables(`${name}-tirantes`, path);
  addBridgeDeckCrossGirders(`${name}-deck-cross-girders`, path);
}

function addBridgeDeckCrossGirders(name: string, path: RoadPathPoint[]) {
  const placements: OrientedXYZPlacement[] = [];

  for (let index = 0; index < 12; index += 1) {
    const progress = (index + 0.5) / 12;
    const frame = bridgeFrameAtProgress(path, progress);
    placements.push({
      x: frame.point.x,
      y: frame.point.y - HIGHWAY_DECK_THICKNESS_M - 1.1,
      z: frame.point.z,
      rotationY: Math.atan2(frame.tangent.x, frame.tangent.z),
    });
  }

  addOrientedBoxInstances(
    name,
    HIGHWAY_TOTAL_WIDTH_M + 18,
    2.4,
    2.2,
    bridgeSteelMaterial,
    placements,
    roadElements,
  );
}

function createArchShape(width: number, height: number) {
  const radius = width * 0.5;
  const springY = Math.max(0, height - radius);
  const shape = new THREE.Shape();

  shape.moveTo(-width * 0.5, 0);
  shape.lineTo(-width * 0.5, springY);
  for (let index = 1; index <= 32; index += 1) {
    const angle = Math.PI - (index / 32) * Math.PI;
    shape.lineTo(Math.cos(angle) * radius, springY + Math.sin(angle) * radius);
  }
  shape.lineTo(width * 0.5, 0);
  shape.lineTo(-width * 0.5, 0);
  return shape;
}

function createArchHolePath(width: number, height: number) {
  const radius = width * 0.5;
  const springY = Math.max(0, height - radius);
  const path = new THREE.Path();

  path.moveTo(-width * 0.5, 0);
  path.lineTo(width * 0.5, 0);
  path.lineTo(width * 0.5, springY);
  for (let index = 1; index <= 32; index += 1) {
    const angle = (index / 32) * Math.PI;
    path.lineTo(Math.cos(angle) * radius, springY + Math.sin(angle) * radius);
  }
  path.lineTo(-width * 0.5, 0);
  return path;
}

function createArchRingGeometry(
  outerWidth: number,
  outerHeight: number,
  innerWidth: number,
  innerHeight: number,
) {
  const shape = createArchShape(outerWidth, outerHeight);
  shape.holes.push(createArchHolePath(innerWidth, innerHeight));
  const geometry = new THREE.ShapeGeometry(shape, 32);
  geometry.computeVertexNormals();
  return geometry;
}

function createArchFaceGeometry(width: number, height: number) {
  const geometry = new THREE.ShapeGeometry(createArchShape(width, height), 32);
  geometry.computeVertexNormals();
  return geometry;
}

function createTunnelRockSleeveGeometry(
  outerWidth: number,
  outerHeight: number,
  innerWidth: number,
  innerHeight: number,
  depth: number,
) {
  const shape = createArchShape(outerWidth, outerHeight);
  shape.holes.push(createArchHolePath(innerWidth, innerHeight));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 24,
    steps: 1,
  });
  geometry.translate(0, 0, -depth);
  geometry.computeVertexNormals();
  return geometry;
}

function addOrientedArchRing(
  name: string,
  outerWidth: number,
  outerHeight: number,
  innerWidth: number,
  innerHeight: number,
  material: THREE.Material,
  x: number,
  bottomY: number,
  z: number,
  rotationY: number,
  normalOffset: number,
  renderOrder: number,
) {
  const mesh = new THREE.Mesh(
    createArchRingGeometry(outerWidth, outerHeight, innerWidth, innerHeight),
    material,
  );
  const normalX = Math.sin(rotationY);
  const normalZ = Math.cos(rotationY);

  mesh.name = name;
  mesh.position.set(x + normalX * normalOffset, bottomY, z + normalZ * normalOffset);
  mesh.rotation.y = rotationY;
  mesh.renderOrder = renderOrder;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  roadElements.add(mesh);
}

function addOrientedArchFace(
  name: string,
  width: number,
  height: number,
  material: THREE.Material,
  x: number,
  bottomY: number,
  z: number,
  rotationY: number,
  normalOffset: number,
  renderOrder: number,
) {
  const mesh = new THREE.Mesh(createArchFaceGeometry(width, height), material);
  const normalX = Math.sin(rotationY);
  const normalZ = Math.cos(rotationY);

  mesh.name = name;
  mesh.position.set(x + normalX * normalOffset, bottomY, z + normalZ * normalOffset);
  mesh.rotation.y = rotationY;
  mesh.renderOrder = renderOrder;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  roadElements.add(mesh);
}

function addOrientedTunnelRockSleeve(
  name: string,
  outerWidth: number,
  outerHeight: number,
  innerWidth: number,
  innerHeight: number,
  depth: number,
  x: number,
  bottomY: number,
  z: number,
  rotationY: number,
  normalOffset: number,
  renderOrder: number,
  material: THREE.Material = mountainCutMaterial,
) {
  const mesh = new THREE.Mesh(
    createTunnelRockSleeveGeometry(
      outerWidth,
      outerHeight,
      innerWidth,
      innerHeight,
      depth,
    ),
    material,
  );
  const normalX = Math.sin(rotationY);
  const normalZ = Math.cos(rotationY);

  mesh.name = name;
  mesh.position.set(x + normalX * normalOffset, bottomY, z + normalZ * normalOffset);
  mesh.rotation.y = rotationY;
  mesh.renderOrder = renderOrder;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  roadElements.add(mesh);
}

function addTunnelPortal(
  name: string,
  point: RoadPathPoint,
  outwardNormal: GroundPathPoint,
  portalOutsetM = 0,
) {
  const normalLength = Math.hypot(outwardNormal.x, outwardNormal.z) || 1;
  const outwardX = outwardNormal.x / normalLength;
  const outwardZ = outwardNormal.z / normalLength;
  const portalX = point.x + outwardX * portalOutsetM;
  const portalZ = point.z + outwardZ * portalOutsetM;
  const rotationY = Math.atan2(outwardX, outwardZ);
  const portalBaseY = point.y - HIGHWAY_DECK_THICKNESS_M;
  const centerY = portalBaseY + HIGHWAY_TUNNEL_PORTAL_HEIGHT_M * 0.34;
  const frameOffset = HIGHWAY_TUNNEL_ROCK_COLLAR_WIDTH_M * 0.5 + 3;
  const frameAxisX = Math.cos(rotationY);
  const frameAxisZ = -Math.sin(rotationY);
  const sideWallDepth = HIGHWAY_TUNNEL_ROCK_SLEEVE_DEPTH_M * 0.88;
  const sideWallNormalOffset = -sideWallDepth * 0.38;
  const wallCenterX = outwardX * sideWallNormalOffset;
  const wallCenterZ = outwardZ * sideWallNormalOffset;

  addOrientedTunnelRockSleeve(
    `${name}-mountain-backfill`,
    HIGHWAY_TUNNEL_ROCK_COLLAR_WIDTH_M + 48,
    HIGHWAY_TUNNEL_ROCK_COLLAR_HEIGHT_M + 26,
    HIGHWAY_TUNNEL_ROCK_COLLAR_WIDTH_M - 4,
    HIGHWAY_TUNNEL_ROCK_COLLAR_HEIGHT_M - 3,
    HIGHWAY_TUNNEL_ROCK_SLEEVE_DEPTH_M * 0.9,
    portalX,
    portalBaseY - 12,
    portalZ,
    rotationY,
    -7.5,
    8,
  );
  addOrientedTunnelRockSleeve(
    `${name}-rock-sleeve`,
    HIGHWAY_TUNNEL_ROCK_COLLAR_WIDTH_M,
    HIGHWAY_TUNNEL_ROCK_COLLAR_HEIGHT_M,
    HIGHWAY_TOTAL_WIDTH_M + 6,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 7,
    HIGHWAY_TUNNEL_ROCK_SLEEVE_DEPTH_M,
    portalX,
    portalBaseY - 5,
    portalZ,
    rotationY,
    -3.5,
    9,
  );
  addOrientedArchRing(
    `${name}-rock-collar`,
    HIGHWAY_TUNNEL_ROCK_COLLAR_WIDTH_M,
    HIGHWAY_TUNNEL_ROCK_COLLAR_HEIGHT_M,
    HIGHWAY_TUNNEL_PORTAL_WIDTH_M + 8,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M + 5,
    mountainCutMaterial,
    portalX,
    portalBaseY - 5,
    portalZ,
    rotationY,
    -1.25,
    10,
  );
  addOrientedArchRing(
    `${name}-concrete-rounded-frame`,
    HIGHWAY_TUNNEL_PORTAL_WIDTH_M,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M,
    HIGHWAY_TOTAL_WIDTH_M + 9,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 6,
    roadStructureConcreteMaterial,
    portalX,
    portalBaseY - 0.5,
    portalZ,
    rotationY,
    0,
    11,
  );
  addOrientedArchFace(
    `${name}-black-mouth-shadow`,
    HIGHWAY_TUNNEL_MOUTH_SHADOW_WIDTH_M,
    HIGHWAY_TUNNEL_MOUTH_SHADOW_HEIGHT_M,
    tunnelOpeningMaterial,
    portalX,
    portalBaseY + 0.25,
    portalZ,
    rotationY,
    0.18,
    11.5,
  );
  addOrientedArchRing(
    `${name}-dark-tunnel-liner`,
    HIGHWAY_TOTAL_WIDTH_M + 5,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 8,
    HIGHWAY_TOTAL_WIDTH_M + 1.5,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 14,
    tunnelOpeningMaterial,
    portalX,
    portalBaseY + 0.6,
    portalZ,
    rotationY,
    0.45,
    12,
  );
  addOrientedTunnelRockSleeve(
    `${name}-dark-interior-throat`,
    HIGHWAY_TOTAL_WIDTH_M + 5,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 8,
    HIGHWAY_TOTAL_WIDTH_M + 1.5,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 14,
    HIGHWAY_TUNNEL_DARK_MASK_DEPTH_M,
    portalX,
    portalBaseY + 0.6,
    portalZ,
    rotationY,
    -0.85,
    12,
    tunnelOpeningMaterial,
  );
  addOrientedArchFace(
    `${name}-dark-depth-mask`,
    HIGHWAY_TOTAL_WIDTH_M + 1.5,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 14,
    tunnelOpeningMaterial,
    portalX,
    portalBaseY + 0.6,
    portalZ,
    rotationY,
    -HIGHWAY_TUNNEL_DARK_MASK_DEPTH_M - 1.1,
    13,
  );
  for (let ribIndex = 0; ribIndex < HIGHWAY_TUNNEL_LINING_RIB_COUNT_PER_PORTAL; ribIndex += 1) {
    addOrientedArchRing(
      `${name}-interior-concrete-lining-rib-${ribIndex + 1}`,
      HIGHWAY_TOTAL_WIDTH_M + 8,
      HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 5,
      HIGHWAY_TOTAL_WIDTH_M + 2,
      HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 12,
      roadStructureConcreteMaterial,
      portalX,
      portalBaseY + 0.85,
      portalZ,
      rotationY,
      -5 - ribIndex * 7,
      12.5,
    );
  }
  addOrientedBox(
    `${name}-left-retaining-wall`,
    5,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M * 0.68,
    sideWallDepth,
    mountainCutMaterial,
    portalX + frameAxisX * frameOffset + wallCenterX,
    centerY,
    portalZ + frameAxisZ * frameOffset + wallCenterZ,
    rotationY,
  );
  addOrientedBox(
    `${name}-right-retaining-wall`,
    5,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M * 0.68,
    sideWallDepth,
    mountainCutMaterial,
    portalX - frameAxisX * frameOffset + wallCenterX,
    centerY,
    portalZ - frameAxisZ * frameOffset + wallCenterZ,
    rotationY,
  );
}

function addMountainTunnelPortals(controlPoints: RoadPathPoint[]) {
  addTunnelPortal(
    "high-mountain-tunnel-entry-portal",
    controlPoints[HIGHWAY_TUNNEL_ENTRY_CONTROL_INDEX],
    snowMountainFaceOutwardNormalAt(controlPoints[HIGHWAY_TUNNEL_ENTRY_CONTROL_INDEX]),
  );
  addTunnelPortal(
    "high-mountain-tunnel-north-exit-portal",
    controlPoints[HIGHWAY_TUNNEL_EXIT_CONTROL_INDEX],
    snowMountainFaceOutwardNormalAt(controlPoints[HIGHWAY_TUNNEL_EXIT_CONTROL_INDEX]),
    HIGHWAY_TUNNEL_NORTH_EXIT_PORTAL_OUTSET_M,
  );
}

function getMountainTunnelRoadPath() {
  const controlPoints = getHighwayLoopControlPoints();
  return sampleRoadControlPath(
    controlPoints.slice(
      HIGHWAY_TUNNEL_ENTRY_CONTROL_INDEX,
      HIGHWAY_TUNNEL_EXIT_CONTROL_INDEX + 1,
    ),
    false,
    112,
  );
}

function addHighwayLoopRoadNetwork() {
  const controlPoints = getHighwayLoopControlPoints();
  highwayLoopCenterPath = sampleRoadControlPath(controlPoints, true, HIGHWAY_SAMPLE_COUNT);
  highwayLoopLanePaths = buildHighwayLanePaths(highwayLoopCenterPath);

  for (const segment of getVisibleHighwaySegments()) {
    addRoadDeck(`${segment.name}-road-deck`, segment.path, false);
    addHighwayMarkings(segment.path, false);
    addHighwaySurfaceDecals(segment.name, segment.path);
    addRoadSupportColumns(
      `${segment.name}-support-columns`,
      segment.path,
      false,
      shouldSkipGeneralHighwaySupport,
    );
  }

  const tunnelRoadPath = getMountainTunnelRoadPath();
  const riverBridgePath = getRiverBridgePath();
  const damCrossingPath = getDamCrossingPath();

  addRoadDeck("high-mountain-tunnel-interior-road-deck", tunnelRoadPath, false);
  addHighwayMarkings(tunnelRoadPath, false);
  addRoadEdgeRails("river-bridge-guard-rail", riverBridgePath);
  addRoadEdgeRails("dam-crossing-guard-rail", damCrossingPath);
  addCableStayedBridgeStructure("river-cable-stayed-bridge", riverBridgePath);
  addMountainTunnelPortals(controlPoints);
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

function createDamSideShoreClosureGeometry(sideSign: -1 | 1) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const lakeY = reservoirLakeY();
  const topPoints = [
    {
      point: curvedDamPoint(sideSign * (DAM_LENGTH_M * 0.5 - 12), -DAM_THICKNESS_M * 0.5 - 4),
      liftM: 1.8,
    },
    {
      point: curvedDamPoint(sideSign * (DAM_LENGTH_M * 0.5 + 10), -DAM_THICKNESS_M * 0.5 - 14),
      liftM: 3.4,
    },
    {
      point: curvedDamPoint(sideSign * (DAM_LENGTH_M * 0.5 + 48), -DAM_THICKNESS_M * 0.5 - 46),
      liftM: 8,
    },
    {
      point: curvedDamPoint(sideSign * (DAM_LENGTH_M * 0.5 + 38), -DAM_THICKNESS_M * 0.5 - 82),
      liftM: 12,
    },
    {
      point: curvedDamPoint(sideSign * (DAM_LENGTH_M * 0.5 - 14), -DAM_THICKNESS_M * 0.5 - 62),
      liftM: 6.5,
    },
  ];
  const terrainPointY = (point: GroundPathPoint) =>
    GRASS_SURFACE_Y + mountainHeightAt(point.x, point.z) + 0.6;

  topPoints.forEach(({ point, liftM }) => {
    addReservoirBankVertex(
      positions,
      colors,
      point,
      Math.max(lakeY + liftM, terrainPointY(point) + 1),
    );
  });

  topPoints.forEach(({ point }) => {
    addReservoirBankVertex(positions, colors, point, Math.min(lakeY - 6, terrainPointY(point)));
  });

  indices.push(0, 1, 2, 0, 2, 3, 0, 3, 4);

  for (let index = 0; index < topPoints.length; index += 1) {
    const next = (index + 1) % topPoints.length;
    const bottom = index + topPoints.length;
    const nextBottom = next + topPoints.length;
    indices.push(index, bottom, next, next, bottom, nextBottom);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addDamSideShoreClosures() {
  for (const sideSign of [-1, 1] as const) {
    const closure = new THREE.Mesh(createDamSideShoreClosureGeometry(sideSign), mountainMaterial);
    closure.name =
      sideSign < 0
        ? "reservoir-dam-left-shore-closure"
        : "reservoir-dam-right-shore-closure";
    closure.renderOrder = 6;
    closure.castShadow = true;
    closure.receiveShadow = true;
    naturalElements.add(closure);
  }
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
  const lake = addSharedSeaWaterMesh(
    "mountain-reservoir-lake",
    createReservoirLakeGeometry(),
    5,
  );
  lake.name = "mountain-reservoir-lake";
}

function damBaseY() {
  return Math.max(
    GRASS_SURFACE_Y + mountainHeightAt(damCenter.x, damCenter.z),
    reservoirLakeY() - DAM_HEIGHT_M * 0.46,
  );
}

function addDam() {
  const baseY = damBaseY();
  const dam = new THREE.Mesh(createCurvedDamGeometry(baseY), damMaterial);
  dam.name = "curved-reservoir-dam";
  dam.renderOrder = 7;
  dam.castShadow = true;
  dam.receiveShadow = true;
  artificialElements.add(dam);
}

function addDamDetail() {
  const baseY = damBaseY();
  const crestY = baseY + DAM_HEIGHT_M;
  const rotationY = Math.atan2(reservoirOutletDirection.x, reservoirOutletDirection.z);
  const railPostPlacements: XZPlacement[] = [];
  const spillwayGatePlacements: OrientedXYZPlacement[] = [];

  for (let index = 0; index < DAM_CREST_RAIL_POST_COUNT; index += 1) {
    const lengthOffset = THREE.MathUtils.lerp(
      -DAM_LENGTH_M * 0.44,
      DAM_LENGTH_M * 0.44,
      index / (DAM_CREST_RAIL_POST_COUNT - 1),
    );
    const point = curvedDamPoint(lengthOffset, DAM_THICKNESS_M * 0.5 - 4);
    railPostPlacements.push({ x: point.x, z: point.z });
  }

  addCylinderInstances(
    "dam-crest-safety-rail-posts",
    0.7,
    5,
    bridgeSteelMaterial,
    crestY + 5,
    railPostPlacements,
    artificialElements,
  );

  for (const sideOffset of [DAM_THICKNESS_M * 0.5 - 4, -DAM_THICKNESS_M * 0.5 + 4]) {
    const railCenter = curvedDamPoint(0, sideOffset);
    addOrientedBox(
      `dam-crest-continuous-rail-${sideOffset > 0 ? "downstream" : "upstream"}`,
      DAM_LENGTH_M * 0.9,
      1.2,
      1.8,
      bridgeSteelMaterial,
      railCenter.x,
      crestY + 5.2,
      railCenter.z,
      rotationY,
      artificialElements,
    );
  }

  for (let index = 0; index < DAM_SPILLWAY_GATE_COUNT; index += 1) {
    const lengthOffset = THREE.MathUtils.lerp(
      -DAM_LENGTH_M * 0.32,
      DAM_LENGTH_M * 0.32,
      index / (DAM_SPILLWAY_GATE_COUNT - 1),
    );
    const point = curvedDamPoint(lengthOffset, DAM_THICKNESS_M * 0.5 + 0.6);
    spillwayGatePlacements.push({
      x: point.x,
      y: baseY + DAM_HEIGHT_M * 0.48,
      z: point.z,
      rotationY,
    });
  }

  addOrientedBoxInstances(
    "dam-downstream-spillway-gates",
    18,
    18,
    1.4,
    roadDrainMaterial,
    spillwayGatePlacements,
    artificialElements,
  );

  const galleryPoint = curvedDamPoint(0, DAM_THICKNESS_M * 0.5 + 1.8);
  addOrientedBox(
    "dam-downstream-service-gallery",
    DAM_LENGTH_M * 0.74,
    4.2,
    2,
    concreteSeamMaterial,
    galleryPoint.x,
    baseY + DAM_HEIGHT_M * 0.32,
    galleryPoint.z,
    rotationY,
    artificialElements,
  );
}

function addRiver() {
  const river = addSharedSeaWaterMesh(
    "mountain-to-sea-river",
    createRiverStripGeometry(riverPath),
    5,
  );
  river.name = "mountain-to-sea-river";
}

function addRiverChannelBanks() {
  const banks = new THREE.Mesh(createRiverChannelBankGeometry(riverPath), riverBankMaterial);
  banks.name = "sloped-natural-river-channel-banks";
  banks.renderOrder = 4;
  banks.receiveShadow = true;
  naturalElements.add(banks);
}

function addCoastalEstuary() {
  const estuary = addSharedSeaWaterMesh(
    "river-sea-estuary",
    createEstuaryStripGeometry(riverSeaTransitionPath),
    5.2,
  );
  estuary.name = "river-sea-estuary";
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
addSnowCapOverlay();
addMountainStrataRidges();
addMountainTalusFields();
addReservoirBasin();
addDamSideShoreClosures();
addReservoirLake();
addDamAbutments();
addDam();
addDamDetail();
addRiverChannelBanks();
addCoastalEstuaryBanks();
addRiver();
addCoastalEstuary();
addHighwayLoopRoadNetwork();
window.__SITY_ASSETS_READY__ = startImportedAssetPipeline();

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  ssaoPass.setSize(
    window.innerWidth * POSTPROCESS_AO_SCALE,
    window.innerHeight * POSTPROCESS_AO_SCALE,
  );
  bloomPass.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", handleResize);

function updateCategoryVisibility() {
  naturalElements.visible = naturalToggle?.checked ?? true;
  artificialElements.visible = artificialToggle?.checked ?? true;
  roadElements.visible = roadsToggle?.checked ?? true;

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
roadsToggle?.addEventListener("change", updateCategoryVisibility);
helpToggle?.addEventListener("change", updateCategoryVisibility);
updateCategoryVisibility();
updateScaleMeasureLabels();

function triangleCountForGeometry(geometry: THREE.BufferGeometry) {
  const index = geometry.getIndex();
  const position = geometry.getAttribute("position");

  if (index) {
    return Math.floor(index.count / 3);
  }

  return position ? Math.floor(position.count / 3) : 0;
}

function materialDrawCallCount(mesh: THREE.Mesh) {
  if (Array.isArray(mesh.material)) {
    return Math.max(mesh.geometry.groups.length, mesh.material.length, 1);
  }

  return 1;
}

function estimateSceneRenderStats(object: THREE.Object3D): { drawCalls: number; triangles: number } {
  if (!object.visible) {
    return { drawCalls: 0, triangles: 0 };
  }

  if (object instanceof THREE.LOD) {
    const highDetail = object.levels[0]?.object;
    return highDetail ? estimateSceneRenderStats(highDetail) : { drawCalls: 0, triangles: 0 };
  }

  if (object instanceof THREE.InstancedMesh) {
    const drawCalls = materialDrawCallCount(object);
    return {
      drawCalls,
      triangles: triangleCountForGeometry(object.geometry) * object.count,
    };
  }

  if (object instanceof THREE.Mesh) {
    return {
      drawCalls: materialDrawCallCount(object),
      triangles: triangleCountForGeometry(object.geometry),
    };
  }

  return object.children.reduce(
    (total, child) => {
      const childStats = estimateSceneRenderStats(child);
      total.drawCalls += childStats.drawCalls;
      total.triangles += childStats.triangles;
      return total;
    },
    { drawCalls: 0, triangles: 0 },
  );
}

function estimateVisibleSceneRenderStats() {
  const naturalStats = estimateSceneRenderStats(naturalElements);
  const artificialStats = estimateSceneRenderStats(artificialElements);
  const roadStats = estimateSceneRenderStats(roadElements);

  return {
    drawCalls: naturalStats.drawCalls + artificialStats.drawCalls + roadStats.drawCalls,
    triangles: naturalStats.triangles + artificialStats.triangles + roadStats.triangles,
  };
}

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
      hasErosionEdges: true,
      hasReedClusters: true,
      reedClusterCount: RIVER_REED_CLUSTER_COUNT,
      hasPebbleFields: true,
      pebbleCount: RIVER_PEBBLE_COUNT,
    },
    estuary: {
      start: riverSeaTransitionPath[0],
      end: riverSeaTransitionPath[riverSeaTransitionPath.length - 1],
      extendsPastCoastlineM:
        riverSeaTransitionPath[riverSeaTransitionPath.length - 1].x - mainBoundaryMaxX,
      hasSlopedBanks: true,
      banksTaperIntoSea: true,
      hasSeamlessSeaBlend: sharedSeaWaterMaterial.name === seaWater.material.name,
      blendStartsBeforeCoastlineM: mainBoundaryMaxX - estuarySeaBlendStartX,
      fadeLengthM: estuarySeaBlendEndX - estuarySeaBlendStartX,
      finalWaterHeightDeltaM: Math.abs(estuaryWaterYAt(1) - SEA_Y),
    },
    reservoir: {
      center: reservoirCenter,
      radiusXM: RESERVOIR_RADIUS_X_M,
      radiusZM: RESERVOIR_RADIUS_Z_M,
      hasVolumetricWater: true,
      waterDepthM: RESERVOIR_WATER_DEPTH_M,
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
      hasCrestRail: true,
      hasSpillwayGates: true,
      spillwayGateCount: DAM_SPILLWAY_GATE_COUNT,
      hasServiceGallery: true,
    },
    realism: {
      qualityProfile: HIGH_END_QUALITY_PROFILE,
      hasToneMappedRenderer: renderer.toneMapping === THREE.ACESFilmicToneMapping,
      hasProceduralMaterialTextures: true,
      hasWaterSurfaceBump: true,
      hasAnimatedWaterMaterial: true,
      hasShaderWater: sharedSeaWaterMaterial instanceof THREE.ShaderMaterial,
      hasPostprocessingComposer: true,
      hasSsao: true,
      hasBloom: true,
      hasPbrEnvironmentMap: scene.environment === environmentMap,
      hasPhysicalSky: sky instanceof Sky,
      usesUnifiedSeaWaterMaterial: unifiedSeaWaterMaterialInstalled,
      allWaterUsesExactSeaShader:
        seaWater.material === sharedSeaWaterMaterial &&
        sharedSeaWaterSurfaceCount >= UNIFIED_SEA_WATER_SURFACE_COUNT,
      sharedWaterMaterialName: sharedSeaWaterMaterial.name,
      waterTextureVariantCount: 1,
      unifiedWaterSurfaceCount: sharedSeaWaterSurfaceCount,
      hasTerrainDisplacementMesh: true,
      hasTerrainSplatShader: terrainSplatShaderInstalled,
      terrainReliefHeightM: MICRO_TERRAIN_HEIGHT_M,
      hasVisibleLowlandRelief: MICRO_TERRAIN_HEIGHT_M >= 6 && lowlandGroundCoverInstanceCount > 0,
      hasMountainSurfaceShader: mountainSurfaceShaderInstalled,
      hasMountainStrataRidges: mountainStrataRidgeMeshCount > 0,
      mountainStrataRidgeCount: mountainStrataRidgeMeshCount,
      hasSnowCapOverlay: snowCapOverlayInstalled,
      hasTalusFields: talusBoulderInstanceCount > 0,
      talusBoulderCount: talusBoulderInstanceCount,
      hasDepthAwareWaterShaders: depthAwareWaterShadersInstalled,
      hasShorelineFoamShader: shorelineFoamShaderInstalled,
      hasPlanarSurfaceUvs: true,
      usesRoundedBuiltGeometry: true,
      hasContactShadowPlanes: true,
      hasWeatheringDecals: true,
      hasNaturalRockClusters: true,
      naturalRockClusterCount: NATURAL_ROCK_CLUSTER_COUNT,
      hasAssetPipelineScaffold: true,
      hasAssetManifest: assetManifestLoaded,
      hasImportedTextureAssets: loadedTextureAssetKeys.size >= TEXTURE_ASSET_KEYS.length,
      importedTextureCount: loadedTextureAssetKeys.size,
      hasPbrTextureMaps: pbrTextureMapCount >= TEXTURE_ASSET_KEYS.length * 3,
      pbrTextureMapCount,
      hasImportedModelAssets: importedModelInstanceCount >= ASSET_STYLE_VESSEL_COUNT,
      importedModelSourceCount: importedModelSources.size,
      importedModelInstanceCount,
      importedAssetKinds: [...importedModelSources.keys()],
      textureAssetKinds: [...loadedTextureAssetKeys],
      assetLoadComplete,
      assetLoadFailures: [...assetLoadFailures],
      hasGltfLoader: gltfLoader instanceof GLTFLoader,
      hasKtx2Loader: ktx2Loader instanceof KTX2Loader,
      hasDracoLoader: dracoLoader instanceof DRACOLoader,
      hasMeshoptDecoder: Boolean(MeshoptDecoder),
      hasDecoderRuntimeAssets: decoderRuntimeAssetsAvailable,
      supportedAssetFormats: [...ASSET_PIPELINE_SUPPORTED_FORMATS],
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
      hasConcreteSeams: true,
      cargoPortSeamCount: CARGO_PORT_SEAM_COUNT,
      hasQuayFenders: true,
      quayFenderCount: QUAY_FENDER_COUNT,
      hasMarinaCleats: true,
      marinaCleatCount: MARINA_CLEAT_COUNT,
      wetSandWidthM: WET_SAND_WIDTH_M,
      hasShallowWaterShelf: true,
      shallowWaterShelfWidthM: SHALLOW_WATER_SHELF_WIDTH_M,
      hasShorelineFoam: true,
      beachFoamStripCount: BEACH_FOAM_STRIP_COUNT,
      hasBeachDunes: true,
      beachDuneCount: BEACH_DUNE_COUNT,
      beachGrassClusterCount: BEACH_GRASS_CLUSTER_COUNT,
      hasBeachShells: true,
      beachShellCount: BEACH_SHELL_COUNT,
      hasBeachAmenities: true,
      beachUmbrellaCount: BEACH_UMBRELLA_COUNT,
      beachSunbedCount: BEACH_SUNBED_COUNT,
      beachTowelCount: BEACH_TOWEL_COUNT,
      hasBeachVolleyballCourt: true,
      hasLifeguardTower: true,
      hasBeachAccessBoardwalk: true,
      hasBeachShowers: true,
      hasBeachSafetyFlags: true,
      beachTrashBinCount: BEACH_TRASH_BIN_COUNT,
      beachAmenitiesAvoidWetSand: true,
      beachDetailsInsideVisibleBoundary: true,
      beachDryDetailSeaMarginM: BEACH_DRY_DETAIL_SEA_MARGIN_M,
      beachOppositePier: true,
      hasLongWoodenAttractionPier: true,
      attractionPierLengthM: ATTRACTION_PIER_LENGTH_M,
      pierDeckThicknessM: PIER_DECK_THICKNESS_M,
      hasPierRailings: true,
      pierRailPostCount: ATTRACTION_PIER_RAIL_POST_COUNT + 8,
      hasPierUnderstructure: true,
      pierBeamCount: ATTRACTION_PIER_BEAM_COUNT + 3,
      hasConcreteShipPort: true,
      cargoPortHeightM: CARGO_PORT_HEIGHT_M,
      cargoShipBerthCount: CARGO_SHIP_BERTH_COUNT,
      cargoBerthDockLengthM: CARGO_BERTH_DOCK_LENGTH_M,
      cargoShipHullLengthM: CARGO_SHIP_HULL_LENGTH_M,
      cargoShipCenterOffsetFromPortEdgeM: CARGO_SHIP_CENTER_OFFSET_FROM_PORT_EDGE_M,
      cargoShipWaterGapM: CARGO_SHIP_WATER_GAP_M,
      hasAssetStyleVessels: true,
      vesselLodCount: ASSET_STYLE_VESSEL_COUNT,
      hasPrivateMarina: true,
      privateBerthCount: PRIVATE_MARINA_BERTH_COUNT,
    },
  }),
  getRoadNetwork: () => {
    const laneSummaries = highwayLoopLanePaths.map((lanePath) => ({
      id: lanePath.id,
      roadId: lanePath.roadId,
      direction: lanePath.direction,
      laneIndex: lanePath.laneIndex,
      centerOffsetM: lanePath.centerOffsetM,
      pointCount: lanePath.points.length,
      closedLoop:
        highwayLoopCenterPath.length > 0 &&
        lanePath.points.length === highwayLoopCenterPath.length,
    }));

    return {
      roads: [
        {
          id: "smart-highway-loop",
          type: "bidirectional-highway-loop",
          closedLoop: true,
          lanesPerDirection: HIGHWAY_LANES_PER_DIRECTION,
          totalLaneCount: HIGHWAY_TOTAL_LANE_COUNT,
          laneWidthM: HIGHWAY_LANE_WIDTH_M,
          totalRoadWidthM: HIGHWAY_TOTAL_WIDTH_M,
          features: {
            crossesDam: true,
            hasMountainTunnel: true,
            reachesPort: true,
            hasRiverBridge: true,
            hasCableStayedBridge: true,
            hasBridgeStayCables: true,
            roadFitsDam: DAM_THICKNESS_M >= HIGHWAY_TOTAL_WIDTH_M,
            hasTireWearStrips: true,
            hasContinuousSideBarriers: true,
            hasExpansionJoints: true,
            expansionJointCount: HIGHWAY_EXPANSION_JOINT_COUNT,
            hasRoadCrackDecals: true,
            roadCrackCount: HIGHWAY_CRACK_DECAL_COUNT,
            hasDrainageChannels: true,
            hasReflectorPosts: true,
            reflectorPostCount: HIGHWAY_REFLECTOR_POST_COUNT,
            hasTunnelLiningRibs: true,
            tunnelLiningRibCount: HIGHWAY_TUNNEL_LINING_RIB_COUNT_PER_PORTAL * 2,
          },
        },
      ],
      lanePaths: laneSummaries,
      directedLanePathCount: laneSummaries.length,
      graph: {
        nodeCount: highwayLoopCenterPath.length,
        allLanePathsClosed: laneSummaries.every((lanePath) => lanePath.closedLoop),
        laneDirections: Array.from(
          new Set(laneSummaries.map((lanePath) => lanePath.direction)),
        ),
      },
    };
  },
  getCategoryVisibility: () => ({
    natural: naturalElements.visible,
    artificial: artificialElements.visible,
    roads: roadElements.visible,
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
  getPerformance: () => {
    const sceneStats = estimateVisibleSceneRenderStats();

    return {
      drawCalls: sceneStats.drawCalls,
      triangles: sceneStats.triangles,
      rendererDrawCalls: renderer.info.render.calls,
      rendererTriangles: renderer.info.render.triangles,
      postprocessingPassCount: composer.passes.length,
      usesComposer: true,
    };
  },
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
  const elapsedSeconds = animationClock.getElapsedTime();
  sharedSeaWaterMaterial.uniforms.sityTime.value = elapsedSeconds;
  controls.update();
  updateCompass();
  updateAxisScale();
  composer.render();
  requestAnimationFrame(animate);
}

animate();
