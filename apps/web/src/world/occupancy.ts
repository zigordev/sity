import type { GroundPathPoint } from "../geometry/types";
import { mainBoundaryMaxX, mainBoundaryMaxZ, mainBoundaryMinX, mainBoundaryMinZ } from "./frame";

interface Segment {
  ax: number;
  az: number;
  bx: number;
  bz: number;
  halfWidth: number;
  tag: string;
}

export interface Zone {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  tag: string;
}

const BUCKET_M = 40;
const buckets = new Map<string, Segment[]>();
const segments: Segment[] = [];
const zones: Zone[] = [];

function bucketKey(ix: number, iz: number) {
  return `${ix}:${iz}`;
}

function bucketIndex(value: number) {
  return Math.floor(value / BUCKET_M);
}

export function registerCorridor(points: GroundPathPoint[], halfWidth: number, tag: string, closed = false) {
  const count = closed ? points.length : points.length - 1;
  for (let index = 0; index < count; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    const segment: Segment = { ax: a.x, az: a.z, bx: b.x, bz: b.z, halfWidth, tag };
    segments.push(segment);
    const minIx = bucketIndex(Math.min(a.x, b.x) - halfWidth);
    const maxIx = bucketIndex(Math.max(a.x, b.x) + halfWidth);
    const minIz = bucketIndex(Math.min(a.z, b.z) - halfWidth);
    const maxIz = bucketIndex(Math.max(a.z, b.z) + halfWidth);
    for (let ix = minIx; ix <= maxIx; ix += 1) {
      for (let iz = minIz; iz <= maxIz; iz += 1) {
        const key = bucketKey(ix, iz);
        const list = buckets.get(key);
        if (list) {
          list.push(segment);
        } else {
          buckets.set(key, [segment]);
        }
      }
    }
  }
}

export function registerZone(zone: Zone) {
  zones.push(zone);
}

function segmentDistance(x: number, z: number, segment: Segment) {
  const dx = segment.bx - segment.ax;
  const dz = segment.bz - segment.az;
  const lengthSq = dx * dx + dz * dz;
  let t = 0;
  if (lengthSq > 0.0001) {
    t = ((x - segment.ax) * dx + (z - segment.az) * dz) / lengthSq;
    t = Math.max(0, Math.min(1, t));
  }
  const px = segment.ax + dx * t;
  const pz = segment.az + dz * t;
  return Math.hypot(x - px, z - pz);
}

export function corridorClearance(x: number, z: number, searchRadius = 90, tagPrefix?: string) {
  let best = Number.POSITIVE_INFINITY;
  const reach = Math.ceil(searchRadius / BUCKET_M);
  const ix = bucketIndex(x);
  const iz = bucketIndex(z);
  const seen = new Set<Segment>();
  for (let ox = -reach; ox <= reach; ox += 1) {
    for (let oz = -reach; oz <= reach; oz += 1) {
      const list = buckets.get(bucketKey(ix + ox, iz + oz));
      if (!list) {
        continue;
      }
      for (const segment of list) {
        if (seen.has(segment)) {
          continue;
        }
        seen.add(segment);
        if (tagPrefix && !segment.tag.startsWith(tagPrefix)) {
          continue;
        }
        const distance = segmentDistance(x, z, segment) - segment.halfWidth;
        if (distance < best) {
          best = distance;
        }
      }
    }
  }
  return best;
}

export function isInsideCorridor(x: number, z: number, margin = 0) {
  return corridorClearance(x, z, Math.max(margin, 4) + 8) < margin;
}

export function zoneAt(x: number, z: number) {
  return zones.find((zone) => x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ);
}

export function zoneFlattenFactor(x: number, z: number, falloffM = 60) {
  let factor = 1;
  for (const zone of zones) {
    const dx = Math.max(zone.minX - x, 0, x - zone.maxX);
    const dz = Math.max(zone.minZ - z, 0, z - zone.maxZ);
    const distance = Math.hypot(dx, dz);
    const local = distance <= 0 ? 0 : Math.min(1, distance / falloffM);
    factor = Math.min(factor, local * local * (3 - 2 * local));
  }
  return factor;
}

export function terrainReliefFactor(x: number, z: number) {
  const clearance = corridorClearance(x, z, 70);
  const corridorFactor = clearance <= 12 ? 0 : Math.min(1, (clearance - 12) / 42);
  const smoothCorridor = corridorFactor * corridorFactor * (3 - 2 * corridorFactor);
  return Math.min(smoothCorridor, zoneFlattenFactor(x, z));
}

export function isInsideMainBoundaryRect(x: number, z: number, margin = 0) {
  return (
    x >= mainBoundaryMinX + margin &&
    x <= mainBoundaryMaxX - margin &&
    z >= mainBoundaryMinZ + margin &&
    z <= mainBoundaryMaxZ - margin
  );
}

interface CutPoint {
  x: number;
  z: number;
  roadY: number;
  halfWidth: number;
  isCut: boolean;
  group: string;
}

const CUT_BUCKET_M = 30;
const cutBuckets = new Map<string, CutPoint[]>();

export function registerCut(x: number, z: number, roadY: number, halfWidth: number, isCut = true, group = "") {
  const key = `${Math.floor(x / CUT_BUCKET_M)}:${Math.floor(z / CUT_BUCKET_M)}`;
  const list = cutBuckets.get(key);
  const point = { x, z, roadY, halfWidth, isCut, group };
  if (list) {
    list.push(point);
  } else {
    cutBuckets.set(key, [point]);
  }
}

export function cutLimitAt(x: number, z: number, slope = 1.7, reachM = 70) {
  const reach = Math.ceil(reachM / CUT_BUCKET_M);
  const ix = Math.floor(x / CUT_BUCKET_M);
  const iz = Math.floor(z / CUT_BUCKET_M);
  let nearest: CutPoint | undefined;
  let nearestClearance = Number.POSITIVE_INFINITY;
  const candidates: Array<{ point: CutPoint; clearance: number }> = [];
  for (let ox = -reach; ox <= reach; ox += 1) {
    for (let oz = -reach; oz <= reach; oz += 1) {
      const list = cutBuckets.get(`${ix + ox}:${iz + oz}`);
      if (!list) {
        continue;
      }
      for (const point of list) {
        const clearance = Math.hypot(point.x - x, point.z - z) - point.halfWidth;
        if (clearance > reachM) {
          continue;
        }
        candidates.push({ point, clearance });
        if (clearance < nearestClearance) {
          nearestClearance = clearance;
          nearest = point;
        }
      }
    }
  }
  if (!nearest) {
    return Number.POSITIVE_INFINITY;
  }
  let limit = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    if (!candidate.point.isCut || candidate.point.group !== nearest.group) {
      continue;
    }
    if (candidate.clearance > nearestClearance + 12) {
      continue;
    }
    limit = Math.min(limit, candidate.point.roadY + Math.max(0, candidate.clearance - 4) * slope);
  }
  return limit;
}

export function registeredZones() {
  return zones.slice();
}

export function registeredSegmentCount() {
  return segments.length;
}
