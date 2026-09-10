import { RIVER_WIDTH_M } from "../config/constants";
import { distanceToPath2D } from "../geometry/helpers";
import { fullTerrainSurfaceYAt, groundSurfaceYAt, isInsideReservoirFootprint } from "../natural/terrain";
import { roadNetwork } from "../roads/build";
import { perpRight, sampleAtStation, type BuiltRoad } from "../roads/network";
import { corridorClearance } from "../world/occupancy";
import { mainBoundaryMaxX, mainBoundaryMaxZ, mainBoundaryMinX, mainBoundaryMinZ, riverPath, riverSeaTransitionPath } from "../world/frame";
import { DISTRICT_STYLES, SPECIAL_BLOCKS, districtAt, type DistrictKind } from "./districts";
import { createRandom } from "./random";

export const RASTER_CELL_M = 4;
const rasterColumns = Math.ceil((mainBoundaryMaxX - mainBoundaryMinX) / RASTER_CELL_M) + 2;
const rasterRows = Math.ceil((mainBoundaryMaxZ - mainBoundaryMinZ) / RASTER_CELL_M) + 2;
const raster = new Uint8Array(rasterColumns * rasterRows);

export const RASTER_LOT = 1;
export const RASTER_SPECIAL = 2;
export const RASTER_KEEP_OUT = 3;

function cellIndex(x: number, z: number) {
  const column = Math.floor((x - mainBoundaryMinX) / RASTER_CELL_M);
  const row = Math.floor((z - mainBoundaryMinZ) / RASTER_CELL_M);
  if (column < 0 || row < 0 || column >= rasterColumns || row >= rasterRows) {
    return -1;
  }
  return row * rasterColumns + column;
}

export function rasterValueAt(x: number, z: number) {
  const index = cellIndex(x, z);
  return index < 0 ? RASTER_KEEP_OUT : raster[index];
}

export function markRect(minX: number, maxX: number, minZ: number, maxZ: number, value: number) {
  for (let z = minZ; z <= maxZ; z += RASTER_CELL_M * 0.5) {
    for (let x = minX; x <= maxX; x += RASTER_CELL_M * 0.5) {
      const index = cellIndex(x, z);
      if (index >= 0) {
        raster[index] = value;
      }
    }
  }
}

export interface Quad {
  corners: Array<{ x: number; z: number }>;
}

function quadPoints(quad: Quad, spacing: number) {
  const [a, b, c, d] = quad.corners;
  const points: Array<{ x: number; z: number }> = [];
  const lengthAB = Math.hypot(b.x - a.x, b.z - a.z);
  const lengthAD = Math.hypot(d.x - a.x, d.z - a.z);
  const stepsU = Math.max(1, Math.ceil(lengthAB / spacing));
  const stepsV = Math.max(1, Math.ceil(lengthAD / spacing));
  for (let i = 0; i <= stepsU; i += 1) {
    for (let j = 0; j <= stepsV; j += 1) {
      const u = i / stepsU;
      const v = j / stepsV;
      const top = { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u };
      const bottom = { x: d.x + (c.x - d.x) * u, z: d.z + (c.z - d.z) * u };
      points.push({ x: top.x + (bottom.x - top.x) * v, z: top.z + (bottom.z - top.z) * v });
    }
  }
  return points;
}

export function markQuad(quad: Quad, value: number) {
  for (const point of quadPoints(quad, RASTER_CELL_M * 0.5)) {
    const index = cellIndex(point.x, point.z);
    if (index >= 0) {
      raster[index] = value;
    }
  }
}

export function isQuadFree(quad: Quad) {
  for (const point of quadPoints(quad, RASTER_CELL_M * 0.75)) {
    const index = cellIndex(point.x, point.z);
    if (index < 0 || raster[index] !== 0) {
      return false;
    }
  }
  return true;
}

export function isNaturalKeepOut(x: number, z: number) {
  if (x < mainBoundaryMinX + 24 || x > mainBoundaryMaxX - 96) {
    return true;
  }
  if (distanceToPath2D({ x, z }, riverPath) < RIVER_WIDTH_M * 0.5 + 62) {
    return true;
  }
  if (distanceToPath2D({ x, z }, riverSeaTransitionPath) < 150) {
    return true;
  }
  if (isInsideReservoirFootprint({ x, z }, 1.6)) {
    return true;
  }
  const height = fullTerrainSurfaceYAt({ x, z }) - 2;
  return height > 48;
}

export interface Lot {
  id: string;
  district: DistrictKind;
  roadId: string;
  center: { x: number; z: number };
  front: { x: number; z: number };
  width: number;
  depth: number;
  rotationY: number;
  tangent: { x: number; z: number };
  inward: { x: number; z: number };
  groundY: number;
  groundMinY: number;
  groundMaxY: number;
  corners: Array<{ x: number; z: number }>;
}

export const lots: Lot[] = [];

export function markSpecialBlocks() {
  for (const block of SPECIAL_BLOCKS) {
    markRect(block.minX, block.maxX, block.minZ, block.maxZ, RASTER_SPECIAL);
  }
}

const LOT_CLASSES = new Set(["arterial", "collector", "local", "industrial"]);

function lotQuad(front: { x: number; z: number }, tangent: { x: number; z: number }, inward: { x: number; z: number }, width: number, depth: number): Quad {
  const half = width * 0.5;
  const a = { x: front.x - tangent.x * half, z: front.z - tangent.z * half };
  const b = { x: front.x + tangent.x * half, z: front.z + tangent.z * half };
  const c = { x: b.x + inward.x * depth, z: b.z + inward.z * depth };
  const d = { x: a.x + inward.x * depth, z: a.z + inward.z * depth };
  return { corners: [a, b, c, d] };
}

function lotIsBuildable(quad: Quad) {
  const heights: number[] = [];
  const probes = [...quad.corners, {
    x: (quad.corners[0].x + quad.corners[2].x) * 0.5,
    z: (quad.corners[0].z + quad.corners[2].z) * 0.5,
  }];
  for (const point of probes) {
    if (isNaturalKeepOut(point.x, point.z)) {
      return false;
    }
    heights.push(groundSurfaceYAt(point.x, point.z));
  }
  for (const point of quadPoints(quad, 3.5)) {
    if (corridorClearance(point.x, point.z, 60, "pavement:") < 1.0) {
      return false;
    }
  }
  if (Math.max(...heights) - Math.min(...heights) > 3.2) {
    return false;
  }
  return isQuadFree(quad);
}

function generateLotsAlong(road: BuiltRoad, random: () => number) {
  const s0 = road.startTrim + 6;
  const s1 = road.length - road.endTrim - 6;
  if (s1 - s0 < 16) {
    return;
  }
  const edge = road.halfWidth + road.cls.sidewalkWidth;
  for (const side of [-1, 1] as const) {
    let s = s0;
    let index = 0;
    while (s < s1) {
      const probe = sampleAtStation(road.samples, Math.min(s + 6, s1));
      const right = perpRight({ x: probe.tx, z: probe.tz });
      const probeX = probe.x + right.x * side * (edge + 12);
      const probeZ = probe.z + right.z * side * (edge + 12);
      const district = districtAt(probeX, probeZ);
      if (!district) {
        s += 12;
        continue;
      }
      const style = DISTRICT_STYLES[district.kind];
      const width = style.lotWidth[0] + random() * (style.lotWidth[1] - style.lotWidth[0]);
      if (s + width > s1) {
        break;
      }
      const station = sampleAtStation(road.samples, s + width * 0.5);
      const stationRight = perpRight({ x: station.tx, z: station.tz });
      const inward = { x: stationRight.x * side, z: stationRight.z * side };
      const tangent = { x: station.tx, z: station.tz };
      const front = {
        x: station.x + inward.x * (edge + style.frontGap),
        z: station.z + inward.z * (edge + style.frontGap),
      };
      let placed = false;
      for (const depthScale of [1, 0.72, 0.5, 0.36]) {
        const depth = style.lotDepth * depthScale;
        const quad = lotQuad(front, tangent, inward, width - 1.2, depth);
        if (!lotIsBuildable(quad)) {
          continue;
        }
        markQuad(quad, RASTER_LOT);
        const center = {
          x: front.x + inward.x * depth * 0.5,
          z: front.z + inward.z * depth * 0.5,
        };
        const cornerHeights = quad.corners.map((corner) => groundSurfaceYAt(corner.x, corner.z));
        lots.push({
          id: `${road.spec.id}:${side > 0 ? "r" : "l"}:${index}`,
          district: district.kind,
          roadId: road.spec.id,
          center,
          front,
          width: width - 1.2,
          depth,
          rotationY: Math.atan2(-tangent.z, tangent.x),
          tangent,
          inward,
          groundY: groundSurfaceYAt(center.x, center.z),
          groundMinY: Math.min(...cornerHeights),
          groundMaxY: Math.max(...cornerHeights),
          corners: quad.corners,
        });
        placed = true;
        break;
      }
      s += placed ? width : Math.max(6, width * 0.5);
      index += 1;
    }
  }
}

export function generateLots() {
  const random = createRandom(4211);
  const roads = [...roadNetwork.roads.values()]
    .filter((road) => LOT_CLASSES.has(road.spec.class))
    .sort((a, b) => a.spec.id.localeCompare(b.spec.id));
  for (const road of roads) {
    generateLotsAlong(road, random);
  }
  return lots;
}
