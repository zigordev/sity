import * as THREE from "three";
import { COASTAL_INLET_OVERLAP_M, DAM_CURVE_BOW_M, DAM_LENGTH_M, DAM_THICKNESS_M, DAM_UPSTREAM_FACE_OFFSET_M, ESTUARY_SEA_BLEND_END_OFFSET_M, ESTUARY_SEA_BLEND_START_OFFSET_M, MAINLAND_EAST_MARGIN_M, MAINLAND_NORTH_SOUTH_MARGIN_M, MAINLAND_WEST_MARGIN_M, MAIN_BOUNDARY_NORTH_EXTENSION_M, MAIN_BOUNDARY_SIDE_M, MOUNTAIN_VISIBLE_SPAN_M, RESERVOIR_RADIUS_X_M, RESERVOIR_RADIUS_Z_M, SNOW_MOUNTAIN_RADIUS_Z_M, SNOW_MOUNTAIN_VISIBLE_SPAN_M } from "../config/constants";
import { GroundPathPoint } from "../geometry/types";

export const mainBoundaryCenterX = 0;

export const mainBoundaryCenterZ = 0;

export const mainBoundaryMinX = mainBoundaryCenterX - MAIN_BOUNDARY_SIDE_M / 2;

export const mainBoundaryMaxX = mainBoundaryCenterX + MAIN_BOUNDARY_SIDE_M / 2;

export const mainBoundaryMinZ = mainBoundaryCenterZ - MAIN_BOUNDARY_SIDE_M / 2 - MAIN_BOUNDARY_NORTH_EXTENSION_M;

export const mainBoundaryMaxZ = mainBoundaryCenterZ + MAIN_BOUNDARY_SIDE_M / 2;

export const estuarySeaBlendStartX = mainBoundaryMaxX + ESTUARY_SEA_BLEND_START_OFFSET_M;

export const estuarySeaBlendEndX = mainBoundaryMaxX + ESTUARY_SEA_BLEND_END_OFFSET_M;

export const mainlandMinX = mainBoundaryMinX - MAINLAND_WEST_MARGIN_M;

export const mainlandMaxX = mainBoundaryMaxX + MAINLAND_EAST_MARGIN_M;

export const mainlandMinZ = mainBoundaryMinZ - MAINLAND_NORTH_SOUTH_MARGIN_M;

export const mainlandMaxZ = mainBoundaryMaxZ + MAINLAND_NORTH_SOUTH_MARGIN_M;

export const mainlandDepth = mainlandMaxZ - mainlandMinZ;

export const mainlandCenterZ = (mainlandMinZ + mainlandMaxZ) / 2;

export const minWorldX = mainlandMinX;

export const maxWorldX = mainlandMaxX;

export const minWorldZ = mainlandMinZ;

export const maxWorldZ = mainlandMaxZ;

export const seaCenter = new THREE.Vector3(
  (minWorldX + maxWorldX) / 2,
  0,
  (minWorldZ + maxWorldZ) / 2,
);

export const mountainCenter = {
  x: mainBoundaryMinX - 160,
  z: mainBoundaryMaxZ + 160,
};

export const mountainVisibleBounds = {
  minX: mainBoundaryMinX,
  maxX: Math.min(mainBoundaryMinX + MOUNTAIN_VISIBLE_SPAN_M, mainBoundaryMaxX),
  minZ: Math.max(mainBoundaryMaxZ - MOUNTAIN_VISIBLE_SPAN_M, mainBoundaryMinZ),
  maxZ: mainBoundaryMaxZ,
};

export const snowMountainCenter = {
  x: mainBoundaryMinX - 35,
  z: mainBoundaryCenterZ - MAIN_BOUNDARY_SIDE_M / 2 - 35,
};

export const snowMountainVisibleBounds = {
  minX: mainBoundaryMinX,
  maxX: Math.min(mainBoundaryMinX + SNOW_MOUNTAIN_VISIBLE_SPAN_M, mainBoundaryMaxX),
  minZ: mainBoundaryMinZ,
  maxZ: Math.min(snowMountainCenter.z + SNOW_MOUNTAIN_RADIUS_Z_M, mainBoundaryMaxZ),
};

export const reservoirCenter = {
  x: mainBoundaryMinX + 300,
  z: mainBoundaryMaxZ - 360,
};

export const reservoirOutletDirection = (() => {
  const x = 0.78;
  const z = -0.62;
  const length = Math.hypot(x, z);
  return { x: x / length, z: z / length };
})();

export const reservoirOutletScale =
  1 /
  Math.sqrt(
    (reservoirOutletDirection.x / RESERVOIR_RADIUS_X_M) ** 2 +
      (reservoirOutletDirection.z / RESERVOIR_RADIUS_Z_M) ** 2,
  );

export const reservoirOutletEdge = {
  x: reservoirCenter.x + reservoirOutletDirection.x * reservoirOutletScale,
  z: reservoirCenter.z + reservoirOutletDirection.z * reservoirOutletScale,
};

export const damCenterOutletOffsetM =
  DAM_THICKNESS_M * 0.5 + DAM_UPSTREAM_FACE_OFFSET_M - DAM_CURVE_BOW_M;

export const damCenter = {
  x: reservoirOutletEdge.x + reservoirOutletDirection.x * damCenterOutletOffsetM,
  z: reservoirOutletEdge.z + reservoirOutletDirection.z * damCenterOutletOffsetM,
};

export const damLongAxis = {
  x: -reservoirOutletDirection.z,
  z: reservoirOutletDirection.x,
};

export const damUpstreamEdge = damUpstreamFacePoint(0);

export const damDownstreamEdge = damDownstreamFacePoint(0);

export const riverSource = {
  x: damDownstreamEdge.x,
  z: damDownstreamEdge.z,
};

export const riverControlPath: GroundPathPoint[] = [
  riverSource,
  { x: mainBoundaryMinX + 590, z: mainBoundaryMaxZ - 585 },
  { x: mainBoundaryMinX + 840, z: mainBoundaryMaxZ - 475 },
  { x: mainBoundaryMinX + 1_070, z: mainBoundaryMaxZ - 545 },
  { x: mainBoundaryMinX + 1_315, z: mainBoundaryMaxZ - 405 },
  { x: mainBoundaryMaxX - 210, z: 185 },
  { x: mainBoundaryMaxX - 185, z: 130 },
  { x: mainBoundaryMaxX - 150, z: 96 },
];

export const riverPath = sampleGroundPath(riverControlPath, 72);

export const riverMouth = {
  x: mainBoundaryMaxX,
  z: 82,
};

export const riverEstuaryStart = riverControlPath[riverControlPath.length - 1];

export const riverSeaTransitionPath = sampleGroundPath(
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

export const mainBoundaryCoastlinePoints: GroundPathPoint[] = [
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

export function sampleGroundPath(controlPath: GroundPathPoint[], segments: number) {
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

export function damCurveOffsetAt(lengthOffset: number) {
  const normalizedLength = lengthOffset / (DAM_LENGTH_M * 0.5);
  return DAM_CURVE_BOW_M * (1 - normalizedLength * normalizedLength);
}

export function curvedDamPoint(lengthOffset: number, sideOffset: number) {
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

export function damUpstreamFacePoint(lengthOffset: number) {
  return curvedDamPoint(lengthOffset, -DAM_THICKNESS_M * 0.5);
}

export function damDownstreamFacePoint(lengthOffset: number) {
  return curvedDamPoint(lengthOffset, DAM_THICKNESS_M * 0.5);
}
