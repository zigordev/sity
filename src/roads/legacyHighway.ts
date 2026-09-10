import * as THREE from "three";
import { DAM_HEIGHT_M, DAM_LENGTH_M, DAM_THICKNESS_M, GRASS_SURFACE_Y, HIGHWAY_CRACK_DECAL_COUNT, HIGHWAY_DECK_THICKNESS_M, HIGHWAY_EXPANSION_JOINT_COUNT, HIGHWAY_LANES_PER_DIRECTION, HIGHWAY_LANE_WIDTH_M, HIGHWAY_MEDIAN_WIDTH_M, HIGHWAY_REFLECTOR_POST_COUNT, HIGHWAY_RIVER_BRIDGE_END_CONTROL_INDEX, HIGHWAY_RIVER_BRIDGE_START_CONTROL_INDEX, HIGHWAY_SAMPLE_COUNT, HIGHWAY_SHOULDER_WIDTH_M, HIGHWAY_SUPPORT_SPACING_M, HIGHWAY_TOTAL_WIDTH_M, HIGHWAY_TUNNEL_ENTRY_CONTROL_INDEX, HIGHWAY_TUNNEL_EXIT_CONTROL_INDEX, HIGHWAY_TUNNEL_NORTH_EXIT_PORTAL_OUTSET_M, SEA_Y } from "../config/constants";
import { addOrientedBoxInstances } from "../geometry/helpers";
import { addDashedRoadRibbon, addRoadRibbon, createRoadRibbonVolumeGeometry, offsetRoadPath, pathTangent, sampleRoadControlPath } from "../geometry/ribbons";
import { GroundPathPoint, LanePath, OrientedXYZPlacement, RoadPathPoint } from "../geometry/types";

import { fullTerrainSurfaceYAt, mountainHeightAt, snowMountainFaceOutwardNormalAt } from "../natural/terrain";
import { reservoirLakeY } from "../natural/water";
import { roadElements } from "../render/context";
import { concreteSeamMaterial, highwayAsphaltMaterial, highwayMedianMaterial, highwayShoulderMaterial, highwaySideMaterial, highwayTireWearMaterial, roadCrackMaterial, roadDrainMaterial, roadMarkingWhiteMaterial, roadMarkingYellowMaterial, roadStructureConcreteMaterial, safetySignMaterial } from "../render/materials";
import { addCableStayedBridgeStructure, addTunnelPortal } from "./structures";
import { curvedDamPoint, damCenter, damLongAxis, reservoirOutletDirection } from "../world/frame";

export let highwayLoopCenterPath: RoadPathPoint[] = [];

export let highwayLoopLanePaths: LanePath[] = [];

export function lowlandRoadYAt(point: GroundPathPoint) {
  void point;
  return damRoadDeckY();
}

export function damRoadDeckY() {
  const damBaseY = Math.max(
    GRASS_SURFACE_Y + mountainHeightAt(damCenter.x, damCenter.z),
    reservoirLakeY() - DAM_HEIGHT_M * 0.46,
  );
  return damBaseY + DAM_HEIGHT_M + HIGHWAY_DECK_THICKNESS_M;
}

export function bridgeRoadYAt(point: GroundPathPoint) {
  void point;
  return damRoadDeckY();
}

export function roadPoint(x: number, z: number, y: number): RoadPathPoint {
  return { x, y, z };
}

export function damRoadPoint(lengthOffset: number): RoadPathPoint {
  const point = curvedDamPoint(lengthOffset, 0);
  return roadPoint(point.x, point.z, damRoadDeckY());
}

export function getDamRoadControlPoints() {
  return [112, 58, 0, -58, -112].map((lengthOffset) => damRoadPoint(lengthOffset));
}

export function tunnelRoadYAt(point: GroundPathPoint) {
  void point;
  return damRoadDeckY();
}

export function getHighwayLoopControlPoints() {
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

export function addRoadDeck(name: string, path: RoadPathPoint[], closed: boolean) {
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

export function highwayLaneOffset(direction: "clockwise" | "counterclockwise", laneIndex: number) {
  const offset =
    HIGHWAY_MEDIAN_WIDTH_M * 0.5 +
    HIGHWAY_LANE_WIDTH_M * 0.5 +
    laneIndex * HIGHWAY_LANE_WIDTH_M;
  return direction === "clockwise" ? -offset : offset;
}

export function buildHighwayLanePaths(centerPath: RoadPathPoint[]) {
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

export function addHighwayMarkings(centerPath: RoadPathPoint[], closed: boolean) {
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

export function addHighwaySurfaceDecals(name: string, path: RoadPathPoint[]) {
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

export function getRiverBridgePath() {
  const controlPoints = getHighwayLoopControlPoints().slice(
    HIGHWAY_RIVER_BRIDGE_START_CONTROL_INDEX,
    HIGHWAY_RIVER_BRIDGE_END_CONTROL_INDEX,
  );
  return sampleRoadControlPath(controlPoints, false, 44);
}

export function getDamCrossingPath() {
  return sampleRoadControlPath(getDamRoadControlPoints(), false, 32);
}

export function getVisibleHighwaySegments() {
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

export function addRoadEdgeRails(name: string, path: RoadPathPoint[]) {
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

export function isOnDamCrossing(point: GroundPathPoint) {
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

export function isOnRiverBridge(point: GroundPathPoint) {
  return point.x >= 655 && point.x <= 820 && point.z >= -125 && point.z <= 310;
}

export function isNearTunnelPortal(point: GroundPathPoint) {
  const controlPoints = getHighwayLoopControlPoints();
  const tunnelEntry = controlPoints[HIGHWAY_TUNNEL_ENTRY_CONTROL_INDEX];
  const tunnelExit = controlPoints[HIGHWAY_TUNNEL_EXIT_CONTROL_INDEX];

  return (
    Math.hypot(point.x - tunnelEntry.x, point.z - tunnelEntry.z) < 80 ||
    Math.hypot(point.x - tunnelExit.x, point.z - tunnelExit.z) < 80
  );
}

export function shouldSkipGeneralHighwaySupport(point: GroundPathPoint) {
  return isOnDamCrossing(point) || isOnRiverBridge(point) || isNearTunnelPortal(point);
}

export function addRoadSupportColumns(
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

export function addMountainTunnelPortals(controlPoints: RoadPathPoint[]) {
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

export function getMountainTunnelRoadPath() {
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

export function addHighwayLoopRoadNetwork() {
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
