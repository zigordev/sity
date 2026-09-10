import {
  BEACH_INLAND_WIDTH_M,
  DAM_HEIGHT_M,
  DAM_LENGTH_M,
  MAINLAND_EAST_MARGIN_M,
  MAINLAND_NORTH_SOUTH_MARGIN_M,
  MAINLAND_WEST_MARGIN_M,
  MAIN_BOUNDARY_AREA_M2,
  MAIN_BOUNDARY_DEPTH_M,
  MAIN_BOUNDARY_SIDE_M,
  MAIN_BOUNDARY_WIDTH_M,
  MOUNTAIN_HEIGHT_M,
  RESERVOIR_RADIUS_X_M,
  RESERVOIR_RADIUS_Z_M,
  RESERVOIR_WATER_DEPTH_M,
  RIVER_WIDTH_M,
  SNOW_MOUNTAIN_HEIGHT_M,
  SCALE_X_MEASURE_M,
  SCALE_Y_MEASURE_M,
  SCALE_Z_MEASURE_M,
  SNOW_MOUNTAIN_SNOWLINE_M,
} from "./config/constants";
import { assetLoadComplete, assetLoadFailures, importedModelInstanceCount, loadedTextureAssetKeys } from "./assets/pipeline";
import { auditCity, cityStats } from "./city";
import { parkedVehicleStats } from "./vehicles/parked";
import { DISTRICTS, SPECIAL_BLOCKS } from "./city/districts";
import { lots } from "./city/lots";
import { fullTerrainSurfaceYAt, groundSurfaceBaseYAt, groundSurfaceYAt, mountainHeightAt, snowMountainHeightAt } from "./natural/terrain";
import { cutLimitAt } from "./world/occupancy";
import { sharedSeaWaterSurfaceCount } from "./natural/water";
import { camera, composer, controls, renderer, scene } from "./render/context";
import { estimateVisibleSceneRenderStats } from "./render/stats";
import { roadGraph, roadNetwork } from "./roads/build";
import { roadSideSlots } from "./roads/render";
import type { NetworkInvariants, NetworkStats, RoadGraph, RouteResult } from "./roads/graph";
import { compassBearingDegrees, scaleAxisAnglesDegrees } from "./ui/overlays";
import { flyToViewId, getLayerVisibility, lastRoute, setLaneOverlayVisible, showRandomRoute } from "./ui/panel";
import { CAMERA_VIEWS } from "./ui/views";
import { damCenter, mountainCenter, reservoirCenter, riverMouth, riverPath, snowMountainCenter } from "./world/frame";

declare global {
  interface Window {
    __SITY_DEBUG__: {
      getSiteLayout: () => {
        unit: "meter";
        northDirection: { x: number; z: number };
        seaSide: "east";
        mainBoundaryAreaM2: number;
        mainBoundarySideM: number;
        mainBoundaryWidthM: number;
        mainBoundaryDepthM: number;
        mainlandWestMarginM: number;
        mainlandEastMarginM: number;
        mainlandNorthSouthMarginM: number;
      };
      getNaturalFeatures: () => {
        mountain: { center: { x: number; z: number }; maxHeightM: number };
        snowMountain: { center: { x: number; z: number }; maxHeightM: number; snowLineM: number };
        river: { source: { x: number; z: number }; mouth: { x: number; z: number }; widthM: number; path: Array<{ x: number; z: number }> };
        reservoir: { center: { x: number; z: number }; radiusXM: number; radiusZM: number; waterDepthM: number };
        dam: { center: { x: number; z: number }; lengthM: number; heightM: number };
        coast: { beachInlandWidthM: number };
        water: { sharedSurfaceCount: number };
        assets: { loadComplete: boolean; failures: string[]; importedModelInstances: number; textureFamilies: number };
        groundYAt: (x: number, z: number) => number;
      };
      getRoadGraph: () => { stats: NetworkStats; invariants: NetworkInvariants };
      probeTerrain: (x: number, z: number) => { ground: number; base: number; cutLimit: number; full: number; mountain: number; snow: number };
      getRoadSamples: (roadId: string) => Array<import("./roads/network").RoadSample> | undefined;
      exportRoadGraph: () => ReturnType<RoadGraph["toJSON"]>;
      getLane: (id: string) => import("./roads/network").Lane | undefined;
      findRoute: (fromLaneId: string, toLaneId: string) => RouteResult | undefined;
      showRandomRoute: (seed?: number) => RouteResult | undefined;
      getLastRoute: () => { laneIds: string[]; lengthM: number } | undefined;
      getCity: () => {
        lotCount: number;
        buildingCount: number;
        treeCount: number;
        forestTreeCount: number;
        districtCount: number;
        specialBlockCount: number;
        lotsByDistrict: Record<string, number>;
        parkedVehicleCount: number;
        busStopCount: number;
      };
      auditCity: () => ReturnType<typeof auditCity>;
      listDeadEnds: () => Array<{ nodeId: string; roadId: string; destination?: string; edge: boolean }>;
      getCategoryVisibility: () => ReturnType<typeof getLayerVisibility>;
      getCompassBearingDegrees: () => number;
      getAxisScale: () => {
        unit: "meter";
        visible: boolean;
        xMeasureM: number;
        yMeasureM: number;
        zMeasureM: number;
        axisAnglesDegrees: { x: number; y: number; z: number };
      };
      getPerformance: () => {
        drawCalls: number;
        triangles: number;
        rendererDrawCalls: number;
        rendererTriangles: number;
        postprocessingPassCount: number;
        usesComposer: boolean;
      };
      listViews: () => string[];
      flyTo: (viewId: string) => boolean;
      setView: (view: { position: [number, number, number]; target: [number, number, number] }) => void;
      setLaneOverlay: (visible: boolean) => void;
      __scene: unknown;
      __composer: unknown;
    };
    __SITY_ASSETS_READY__?: Promise<void>;
  }
}

const axisScaleElement = document.querySelector<HTMLElement>(".axis-scale");

window.__SITY_DEBUG__ = {
  __scene: scene,
  __composer: composer,
  getSiteLayout: () => ({
    unit: "meter",
    northDirection: { x: 0, z: -1 },
    seaSide: "east",
    mainBoundaryAreaM2: MAIN_BOUNDARY_AREA_M2,
    mainBoundarySideM: MAIN_BOUNDARY_SIDE_M,
    mainBoundaryWidthM: MAIN_BOUNDARY_WIDTH_M,
    mainBoundaryDepthM: MAIN_BOUNDARY_DEPTH_M,
    mainlandWestMarginM: MAINLAND_WEST_MARGIN_M,
    mainlandEastMarginM: MAINLAND_EAST_MARGIN_M,
    mainlandNorthSouthMarginM: MAINLAND_NORTH_SOUTH_MARGIN_M,
  }),
  getNaturalFeatures: () => ({
    mountain: { center: mountainCenter, maxHeightM: MOUNTAIN_HEIGHT_M },
    snowMountain: { center: snowMountainCenter, maxHeightM: SNOW_MOUNTAIN_HEIGHT_M, snowLineM: SNOW_MOUNTAIN_SNOWLINE_M },
    river: { source: riverPath[0], mouth: riverMouth, widthM: RIVER_WIDTH_M, path: riverPath.map((point) => ({ ...point })) },
    reservoir: { center: reservoirCenter, radiusXM: RESERVOIR_RADIUS_X_M, radiusZM: RESERVOIR_RADIUS_Z_M, waterDepthM: RESERVOIR_WATER_DEPTH_M },
    dam: { center: damCenter, lengthM: DAM_LENGTH_M, heightM: DAM_HEIGHT_M },
    coast: { beachInlandWidthM: BEACH_INLAND_WIDTH_M },
    water: { sharedSurfaceCount: sharedSeaWaterSurfaceCount },
    assets: {
      loadComplete: assetLoadComplete,
      failures: [...assetLoadFailures],
      importedModelInstances: importedModelInstanceCount,
      textureFamilies: loadedTextureAssetKeys.size,
    },
    groundYAt: (x, z) => groundSurfaceYAt(x, z),
  }),
  getRoadGraph: () => ({ stats: roadGraph.stats(), invariants: roadGraph.invariants() }),
  probeTerrain: (x, z) => ({
    ground: groundSurfaceYAt(x, z),
    base: groundSurfaceBaseYAt(x, z),
    cutLimit: cutLimitAt(x, z),
    full: fullTerrainSurfaceYAt({ x, z }),
    mountain: mountainHeightAt(x, z),
    snow: snowMountainHeightAt(x, z),
  }),
  getRoadSamples: (roadId) => roadNetwork.roads.get(roadId)?.samples.map((sample) => ({ ...sample })),
  exportRoadGraph: () => roadGraph.toJSON(),
  getLane: (id) => {
    const lane = roadNetwork.lanes.get(id);
    return lane ? { ...lane } : undefined;
  },
  findRoute: (fromLaneId, toLaneId) => roadGraph.findRoute(fromLaneId, toLaneId),
  showRandomRoute: (seed) => showRandomRoute(seed),
  getLastRoute: () => lastRoute(),
  getCity: () => {
    const lotsByDistrict: Record<string, number> = {};
    for (const lot of lots) {
      lotsByDistrict[lot.district] = (lotsByDistrict[lot.district] ?? 0) + 1;
    }
    return {
      ...cityStats,
      districtCount: DISTRICTS.length,
      specialBlockCount: SPECIAL_BLOCKS.length,
      lotsByDistrict,
      parkedVehicleCount: parkedVehicleStats.count,
      busStopCount: roadSideSlots.busStops.length,
    };
  },
  auditCity: () => auditCity(),
  listDeadEnds: () => {
    const ends: Array<{ nodeId: string; roadId: string; destination?: string; edge: boolean }> = [];
    for (const node of roadNetwork.nodes.values()) {
      if (node.isCut || node.roadIds.length !== 1) {
        continue;
      }
      ends.push({
        nodeId: node.spec.id,
        roadId: node.roadIds[0],
        destination: node.spec.destination?.kind,
        edge: Boolean(node.spec.edge),
      });
    }
    return ends;
  },
  getCategoryVisibility: () => getLayerVisibility(),
  getCompassBearingDegrees: () => compassBearingDegrees,
  getAxisScale: () => ({
    unit: "meter",
    visible: axisScaleElement ? getComputedStyle(axisScaleElement).display !== "none" : false,
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
  listViews: () => CAMERA_VIEWS.map((view) => view.id),
  flyTo: (viewId) => flyToViewId(viewId, true),
  setView: (view) => {
    camera.position.set(view.position[0], view.position[1], view.position[2]);
    controls.target.set(view.target[0], view.target[1], view.target[2]);
    controls.update();
  },
  setLaneOverlay: (visible) => setLaneOverlayVisible(visible),
};
