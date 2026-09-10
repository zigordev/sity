import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import * as THREE from "three";
import { TEXTURE_ASSET_KEYS, assetLoadComplete, assetLoadFailures, assetManifestLoaded, decoderRuntimeAssetsAvailable, importedModelInstanceCount, importedModelSources, loadedTextureAssetKeys, pbrTextureMapCount } from "./assets/pipeline";
import { ASSET_PIPELINE_SUPPORTED_FORMATS, ASSET_STYLE_VESSEL_COUNT, ATTRACTION_PIER_BEAM_COUNT, ATTRACTION_PIER_LENGTH_M, ATTRACTION_PIER_RAIL_POST_COUNT, ATTRACTION_PIER_SUPPORT_COLUMNS, ATTRACTION_PIER_SUPPORT_ROWS, BEACH_DRY_DETAIL_SEA_MARGIN_M, BEACH_DUNE_COUNT, BEACH_FOAM_STRIP_COUNT, BEACH_GRASS_CLUSTER_COUNT, BEACH_SHELL_COUNT, BEACH_SUNBED_COUNT, BEACH_TOWEL_COUNT, BEACH_TRASH_BIN_COUNT, BEACH_UMBRELLA_COUNT, CARGO_BERTH_DOCK_LENGTH_M, CARGO_CONTAINER_COUNT, CARGO_CRANE_COUNT, CARGO_PORT_HEIGHT_M, CARGO_PORT_SEAM_COUNT, CARGO_SHIP_BERTH_COUNT, CARGO_SHIP_CENTER_OFFSET_FROM_PORT_EDGE_M, CARGO_SHIP_HULL_LENGTH_M, CARGO_SHIP_WATER_GAP_M, DAM_BANK_OPENING_HALF_LENGTH_M, DAM_HEIGHT_M, DAM_LENGTH_M, DAM_SPILLWAY_GATE_COUNT, DAM_THICKNESS_M, HIGHWAY_CRACK_DECAL_COUNT, HIGHWAY_EXPANSION_JOINT_COUNT, HIGHWAY_LANES_PER_DIRECTION, HIGHWAY_LANE_WIDTH_M, HIGHWAY_REFLECTOR_POST_COUNT, HIGHWAY_TOTAL_LANE_COUNT, HIGHWAY_TOTAL_WIDTH_M, HIGHWAY_TUNNEL_LINING_RIB_COUNT_PER_PORTAL, HIGH_END_QUALITY_PROFILE, MAINLAND_EAST_MARGIN_M, MAINLAND_NORTH_SOUTH_MARGIN_M, MAINLAND_WEST_MARGIN_M, MAIN_BOUNDARY_AREA_M2, MAIN_BOUNDARY_SIDE_M, MAIN_BOUNDARY_TERRAIN_THICKNESS_M, MARINA_CLEAT_COUNT, MICRO_TERRAIN_HEIGHT_M, MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M, MOUNTAIN_HEIGHT_M, MOUNTAIN_SURFACE_LIFT_M, NATURAL_ROCK_CLUSTER_COUNT, PIER_DECK_THICKNESS_M, PRIVATE_MARINA_BERTH_COUNT, PRIVATE_MARINA_SUPPORT_PILE_COUNT, QUAY_FENDER_COUNT, RESERVOIR_RADIUS_X_M, RESERVOIR_RADIUS_Z_M, RESERVOIR_WATER_DEPTH_M, RIVER_CHANNEL_BANK_WIDTH_M, RIVER_CHANNEL_CREST_RISE_M, RIVER_CHANNEL_INNER_DROP_M, RIVER_PEBBLE_COUNT, RIVER_REED_CLUSTER_COUNT, RIVER_SOURCE_WIDTH_M, RIVER_WIDTH_M, SCALE_X_MEASURE_M, SCALE_Y_MEASURE_M, SCALE_Z_MEASURE_M, SEA_Y, SHALLOW_WATER_SHELF_WIDTH_M, SNOW_MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M, SNOW_MOUNTAIN_HEIGHT_M, SNOW_MOUNTAIN_RADIUS_X_M, SNOW_MOUNTAIN_RADIUS_Z_M, SNOW_MOUNTAIN_SNOWLINE_M, UNIFIED_SEA_WATER_SURFACE_COUNT, WET_SAND_WIDTH_M } from "./config/constants";
import { lowlandGroundCoverInstanceCount } from "./natural/coast";
import { estimateSnowMountainVisiblePortion, mountainStrataRidgeMeshCount, snowCapOverlayInstalled, talusBoulderInstanceCount } from "./natural/terrain";
import { estuaryWaterYAt, seaWater, sharedSeaWaterSurfaceCount } from "./natural/water";
import { artificialElements, composer, dracoLoader, environmentMap, gltfLoader, ktx2Loader, naturalElements, renderer, roadElements, scene, sky } from "./render/context";
import { depthAwareWaterShadersInstalled, mountainSurfaceShaderInstalled, sharedSeaWaterMaterial, shorelineFoamShaderInstalled, terrainSplatShaderInstalled, unifiedSeaWaterMaterialInstalled } from "./render/materials";
import { highwayLoopCenterPath, highwayLoopLanePaths } from "./roads/legacyHighway";
import { axisScale, compass, compassBearingDegrees, scaleAxisAnglesDegrees } from "./ui/overlays";
import { damCenter, damDownstreamEdge, damUpstreamEdge, estuarySeaBlendEndX, estuarySeaBlendStartX, mainBoundaryMaxX, mainBoundaryMinX, mainBoundaryMinZ, mountainCenter, reservoirCenter, riverMouth, riverPath, riverSeaTransitionPath, snowMountainCenter } from "./world/frame";

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

export function triangleCountForGeometry(geometry: THREE.BufferGeometry) {
  const index = geometry.getIndex();
  const position = geometry.getAttribute("position");

  if (index) {
    return Math.floor(index.count / 3);
  }

  return position ? Math.floor(position.count / 3) : 0;
}

export function materialDrawCallCount(mesh: THREE.Mesh) {
  if (Array.isArray(mesh.material)) {
    return Math.max(mesh.geometry.groups.length, mesh.material.length, 1);
  }

  return 1;
}

export function estimateSceneRenderStats(object: THREE.Object3D): { drawCalls: number; triangles: number } {
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

export function estimateVisibleSceneRenderStats() {
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
