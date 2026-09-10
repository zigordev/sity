import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { perpRight, sampleAtStation, type RoadSample, type Vec3 } from "./network";

export type Station = Vec3 & { tx: number; tz: number; s: number };

export function stationsBetween(samples: RoadSample[], s0: number, s1: number): Station[] {
  const start = sampleAtStation(samples, s0);
  const end = sampleAtStation(samples, s1);
  const stations: Station[] = [{ ...start, s: s0 }];
  for (const sample of samples) {
    if (sample.s > s0 + 0.05 && sample.s < s1 - 0.05) {
      stations.push({ x: sample.x, y: sample.y, z: sample.z, tx: sample.tx, tz: sample.tz, s: sample.s });
    }
  }
  stations.push({ ...end, s: s1 });
  return dedupeStations(stations);
}

export function dedupeStations(stations: Station[]) {
  const result: Station[] = [];
  for (const station of stations) {
    const last = result[result.length - 1];
    if (last && Math.hypot(last.x - station.x, last.z - station.z) < 0.03) {
      continue;
    }
    result.push(station);
  }
  return result;
}

function finalize(positions: number[], indices: number[], uvs?: number[]) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (uvs && uvs.length === (positions.length / 3) * 2) {
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  } else {
    const generated: number[] = [];
    for (let index = 0; index < positions.length; index += 3) {
      generated.push(positions[index] / 24, positions[index + 2] / 24);
    }
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(generated, 2));
  }
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  sanitizeNormals(geometry);
  return geometry;
}

export function sanitizeNormals(geometry: THREE.BufferGeometry) {
  const normal = geometry.getAttribute("normal");
  if (!normal) {
    return;
  }
  const array = normal.array as Float32Array;
  for (let index = 0; index < array.length; index += 3) {
    const x = array[index];
    const y = array[index + 1];
    const z = array[index + 2];
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || x * x + y * y + z * z < 1e-6) {
      array[index] = 0;
      array[index + 1] = 1;
      array[index + 2] = 0;
    }
  }
  normal.needsUpdate = true;
}

export function skirtFromStations(
  stations: Station[],
  sign: 1 | -1,
  innerOffset: number,
  groundY: (x: number, z: number) => number,
) {
  const positions: number[] = [];
  const indices: number[] = [];
  let kept = 0;
  for (const station of stations) {
    const right = perpRight({ x: station.tx, z: station.tz });
    const inner = sign * innerOffset;
    const ix = station.x + right.x * inner;
    const iz = station.z + right.z * inner;
    const probeX = ix + right.x * sign * 2.5;
    const probeZ = iz + right.z * sign * 2.5;
    const drop = station.y - groundY(probeX, probeZ);
    const width = Math.max(1.4, drop * 1.6 + 1.2);
    const ox = station.x + right.x * (inner + sign * width);
    const oz = station.z + right.z * (inner + sign * width);
    const outerY = Math.min(groundY(ox, oz) - 0.45, station.y - 0.3);
    positions.push(ix, station.y - 0.03, iz, ox, outerY, oz);
    kept += 1;
  }
  for (let index = 0; index < kept - 1; index += 1) {
    const i0 = index * 2;
    const o0 = i0 + 1;
    const i1 = i0 + 2;
    const o1 = i0 + 3;
    if (sign > 0) {
      indices.push(i0, o0, i1, i1, o0, o1);
    } else {
      indices.push(i0, i1, o0, o0, i1, o1);
    }
  }
  return finalize(positions, indices);
}

export function stripFromStations(
  stations: Station[],
  offsetA: number,
  offsetB: number,
  yLift: number,
  offsetAt?: (station: Station, index: number) => [number, number],
) {
  const positions: number[] = [];
  const indices: number[] = [];
  stations.forEach((station, index) => {
    const right = perpRight({ x: station.tx, z: station.tz });
    const [a, b] = offsetAt ? offsetAt(station, index) : [offsetA, offsetB];
    positions.push(
      station.x + right.x * a,
      station.y + yLift,
      station.z + right.z * a,
      station.x + right.x * b,
      station.y + yLift,
      station.z + right.z * b,
    );
  });
  for (let index = 0; index < stations.length - 1; index += 1) {
    const l0 = index * 2;
    const r0 = l0 + 1;
    const l1 = l0 + 2;
    const r1 = l0 + 3;
    indices.push(l0, r0, l1, l1, r0, r1);
  }
  return finalize(positions, indices);
}

export function stripBetweenOffsets(samples: RoadSample[], s0: number, s1: number, offsetA: number, offsetB: number, yLift: number) {
  return stripFromStations(stationsBetween(samples, s0, s1), offsetA, offsetB, yLift);
}

export function volumeFromStations(
  stations: Station[],
  offsetA: number,
  offsetB: number,
  topLift: number,
  thickness: number,
  closed = false,
): { top: THREE.BufferGeometry; side: THREE.BufferGeometry } {
  const topPositions: number[] = [];
  const topIndices: number[] = [];
  const sidePositions: number[] = [];
  const sideIndices: number[] = [];
  const count = stations.length;
  stations.forEach((station) => {
    const right = perpRight({ x: station.tx, z: station.tz });
    const ax = station.x + right.x * offsetA;
    const az = station.z + right.z * offsetA;
    const bx = station.x + right.x * offsetB;
    const bz = station.z + right.z * offsetB;
    const top = station.y + topLift;
    const bottom = top - thickness;
    topPositions.push(ax, top, az, bx, top, bz);
    sidePositions.push(ax, top, az, ax, bottom, az, bx, top, bz, bx, bottom, bz);
  });
  const segmentCount = closed ? count : count - 1;
  for (let index = 0; index < segmentCount; index += 1) {
    const next = (index + 1) % count;
    const l0 = index * 2;
    const r0 = l0 + 1;
    const l1 = next * 2;
    const r1 = l1 + 1;
    topIndices.push(l0, r0, l1, l1, r0, r1);
    const at = index * 4;
    const ab = at + 1;
    const bt = at + 2;
    const bb = at + 3;
    const nat = next * 4;
    const nab = nat + 1;
    const nbt = nat + 2;
    const nbb = nat + 3;
    sideIndices.push(at, nat, ab, ab, nat, nab);
    sideIndices.push(bt, bb, nbt, nbt, bb, nbb);
    sideIndices.push(ab, nab, bb, bb, nab, nbb);
  }
  if (!closed && count > 1) {
    sideIndices.push(0, 1, 2, 2, 1, 3);
    const last = (count - 1) * 4;
    sideIndices.push(last, last + 2, last + 1, last + 1, last + 2, last + 3);
  }
  return { top: finalize(topPositions, topIndices), side: finalize(sidePositions, sideIndices) };
}

export function polylineStations(points: Vec3[]): Station[] {
  const stations: Station[] = [];
  let s = 0;
  for (let index = 0; index < points.length; index += 1) {
    const previous = points[Math.max(index - 1, 0)];
    const next = points[Math.min(index + 1, points.length - 1)];
    const tx = next.x - previous.x;
    const tz = next.z - previous.z;
    const length = Math.hypot(tx, tz) || 1;
    if (index > 0) {
      s += Math.hypot(points[index].x - points[index - 1].x, points[index].z - points[index - 1].z);
    }
    stations.push({ ...points[index], tx: tx / length, tz: tz / length, s });
  }
  return stations;
}

export function polygonSurface(polygon: Vec3[], lift: number) {
  if (polygon.length < 3) {
    return null;
  }
  let area = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const a = polygon[index];
    const b = polygon[(index + 1) % polygon.length];
    area += a.x * b.z - b.x * a.z;
  }
  const ordered = area > 0 ? polygon.slice().reverse() : polygon;
  const triangles = THREE.ShapeUtils.triangulateShape(
    ordered.map((point) => new THREE.Vector2(point.x, point.z)),
    [],
  );
  const positions: number[] = [];
  for (const point of ordered) {
    positions.push(point.x, point.y + lift, point.z);
  }
  return finalize(positions, triangles.flat());
}

export function polygonVolume(polygon: Vec3[], topLift: number, thickness: number) {
  const top = polygonSurface(polygon, topLift);
  if (!top) {
    return null;
  }
  const positions: number[] = [];
  const indices: number[] = [];
  const count = polygon.length;
  let area = 0;
  for (let index = 0; index < count; index += 1) {
    const a = polygon[index];
    const b = polygon[(index + 1) % count];
    area += a.x * b.z - b.x * a.z;
  }
  const ordered = area > 0 ? polygon.slice().reverse() : polygon;
  ordered.forEach((point) => {
    positions.push(point.x, point.y + topLift, point.z, point.x, point.y + topLift - thickness, point.z);
  });
  for (let index = 0; index < count; index += 1) {
    const next = (index + 1) % count;
    const t0 = index * 2;
    const b0 = t0 + 1;
    const t1 = next * 2;
    const b1 = t1 + 1;
    indices.push(t0, t1, b0, b0, t1, b1);
  }
  return { top, side: finalize(positions, indices) };
}

export function mergeAll(geometries: THREE.BufferGeometry[]) {
  const valid = geometries.filter((geometry) => geometry.getAttribute("position")?.count > 0);
  if (valid.length === 0) {
    return null;
  }
  const merged = mergeGeometries(valid, false);
  for (const geometry of valid) {
    geometry.dispose();
  }
  if (merged) {
    sanitizeNormals(merged);
  }
  return merged;
}

export function boxBetween(a: Vec3, b: Vec3, width: number, height: number, yLift = 0) {
  const length = Math.hypot(b.x - a.x, b.z - a.z);
  const geometry = new THREE.BoxGeometry(width, height, length);
  const angle = Math.atan2(b.x - a.x, b.z - a.z);
  geometry.rotateY(angle);
  geometry.translate((a.x + b.x) * 0.5, (a.y + b.y) * 0.5 + yLift + height * 0.5, (a.z + b.z) * 0.5);
  return geometry;
}
