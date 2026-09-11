import * as THREE from "three";
import { roadNetwork } from "./build";
import { perpRight, sampleAtStation, type BuiltRoad, type Vec3 } from "./network";
import { deckThickness } from "./render";

export const PAVEMENT_FLOOR_DROP_M = 0.12;
const BUCKET_M = 24;
const DISC_SEGMENTS = 48;

export type PavementTriangleVisitor = (a: Vec3, b: Vec3, c: Vec3, lift: number, floor: number, owner: string) => void;

type Triangle2 = [number, number, number, number, number, number];

interface FloorTriangle {
  points: Triangle2;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  floor: number;
}

function visitPolygon(polygon: Vec3[], lift: number, owner: string, visit: PavementTriangleVisitor) {
  if (polygon.length < 3) {
    return;
  }
  const faces = THREE.ShapeUtils.triangulateShape(
    polygon.map((point) => new THREE.Vector2(point.x, point.z)),
    [],
  );
  for (const [i, j, k] of faces) {
    const a = polygon[i];
    const b = polygon[j];
    const c = polygon[k];
    visit(a, b, c, lift, Math.min(a.y, b.y, c.y) - PAVEMENT_FLOOR_DROP_M, owner);
  }
}

function visitDisc(center: Vec3, outer: number, inner: number, lift: number, owner: string, visit: PavementTriangleVisitor) {
  const floor = center.y - PAVEMENT_FLOOR_DROP_M;
  const at = (radius: number, angle: number): Vec3 => ({ x: center.x + Math.cos(angle) * radius, y: center.y, z: center.z + Math.sin(angle) * radius });
  for (let index = 0; index < DISC_SEGMENTS; index += 1) {
    const a0 = (index / DISC_SEGMENTS) * Math.PI * 2;
    const a1 = ((index + 1) / DISC_SEGMENTS) * Math.PI * 2;
    if (inner <= 0.01) {
      visit(center, at(outer, a0), at(outer, a1), lift, floor, owner);
      continue;
    }
    visit(at(inner, a0), at(outer, a0), at(outer, a1), lift, floor, owner);
    visit(at(inner, a0), at(outer, a1), at(inner, a1), lift, floor, owner);
  }
}

function visitRoad(road: BuiltRoad, visit: PavementTriangleVisitor) {
  const closed = Boolean(road.spec.closed);
  const s0 = closed ? 0 : road.startTrim;
  const s1 = closed ? road.samples[road.samples.length - 1].s : road.length - road.endTrim;
  if (s1 - s0 < 0.5) {
    return;
  }
  const stations = [sampleAtStation(road.samples, s0), ...road.samples.filter((sample) => sample.s > s0 + 0.01 && sample.s < s1 - 0.01), sampleAtStation(road.samples, s1)];
  if (closed) {
    stations.push(road.samples[0]);
  }
  const owner = `road:${road.spec.id}`;
  const sidewalk = road.cls.sidewalkWidth;
  const bands: Array<[number, number, number]> = [[-road.halfWidth, road.halfWidth, 0]];
  if (sidewalk > 0) {
    bands.push([road.halfWidth, road.halfWidth + sidewalk, 0.15], [-road.halfWidth - sidewalk, -road.halfWidth, 0.15]);
  }
  for (let index = 0; index < stations.length - 1; index += 1) {
    const from = stations[index];
    const to = stations[index + 1];
    if (from.structure === "tunnel" || to.structure === "tunnel") {
      continue;
    }
    const deck = from.structure !== "ground" ? from.structure : to.structure;
    const floor = Math.min(from.y, to.y) - (deck === "ground" ? PAVEMENT_FLOOR_DROP_M : deckThickness(road, deck) + 0.15);
    const rightFrom = perpRight({ x: from.tx, z: from.tz });
    const rightTo = perpRight({ x: to.tx, z: to.tz });
    for (const [u0, u1, lift] of bands) {
      const a = { x: from.x + rightFrom.x * u0, y: from.y, z: from.z + rightFrom.z * u0 };
      const b = { x: from.x + rightFrom.x * u1, y: from.y, z: from.z + rightFrom.z * u1 };
      const c = { x: to.x + rightTo.x * u0, y: to.y, z: to.z + rightTo.z * u0 };
      const d = { x: to.x + rightTo.x * u1, y: to.y, z: to.z + rightTo.z * u1 };
      visit(a, b, c, lift, floor, owner);
      visit(b, d, c, lift, floor, owner);
    }
  }
}

function visitJunctions(visit: PavementTriangleVisitor) {
  for (const junction of roadNetwork.junctions.values()) {
    const owner = `junction:${junction.nodeId}`;
    visitPolygon(junction.pad, 0.004, owner, visit);
    if (junction.hasSidewalks) {
      for (const corner of junction.corners) {
        const width = Math.max(roadNetwork.roads.get(corner.fromRoadId)?.cls.sidewalkWidth ?? 0, roadNetwork.roads.get(corner.toRoadId)?.cls.sidewalkWidth ?? 0);
        if (width <= 0) {
          continue;
        }
        const outward = corner.points.map((point) => {
          const dx = point.x - junction.center.x;
          const dz = point.z - junction.center.z;
          const length = Math.hypot(dx, dz) || 1;
          return { x: point.x + (dx / length) * width, y: point.y, z: point.z + (dz / length) * width };
        });
        visitPolygon([...corner.points, ...outward.slice().reverse()], 0.15, owner, visit);
      }
    }
    const destination = junction.destination;
    if (!destination) {
      continue;
    }
    const { spec, origin, axis, right } = destination;
    const at = (along: number, across: number): Vec3 => ({ x: origin.x + axis.x * along + right.x * across, y: origin.y, z: origin.z + axis.z * along + right.z * across });
    if (spec.kind === "culdesac") {
      const centre = junction.center;
      visitDisc({ x: centre.x, y: origin.y, z: centre.z }, 3.6, 0, 0.42, owner, visit);
      const arc = junction.pad.slice(1, -1);
      const outward = arc.map((point) => {
        const dx = point.x - centre.x;
        const dz = point.z - centre.z;
        const length = Math.hypot(dx, dz) || 1;
        return { x: point.x + (dx / length) * 1.6, y: point.y, z: point.z + (dz / length) * 1.6 };
      });
      for (let index = 0; index < arc.length - 1; index += 1) {
        visitPolygon([arc[index], arc[index + 1], outward[index + 1], outward[index]], 0.15, owner, visit);
      }
      continue;
    }
    const half = spec.width * 0.5;
    const footway = 1.6;
    visitPolygon([at(4, half + footway), at(spec.depth + footway, half + footway), at(spec.depth + footway, -half - footway), at(4, -half - footway)], 0.15, owner, visit);
    visitPolygon([at(4, half), at(spec.depth, half), at(spec.depth, -half), at(4, -half)], 0.004, owner, visit);
    if (spec.kind === "viewpoint") {
      const deckRadius = Math.min(half - 2, 13);
      const deck: Vec3[] = [];
      for (let index = 0; index <= 18; index += 1) {
        const angle = -Math.PI * 0.5 + (index / 18) * Math.PI;
        deck.push(at(spec.depth - deckRadius - 1 + Math.cos(angle) * (deckRadius + 5), Math.sin(angle) * (deckRadius + 5)));
      }
      visitPolygon(deck, 0.32, owner, visit);
    }
  }
}

function visitRoundabouts(visit: PavementTriangleVisitor) {
  for (const roundabout of roadNetwork.roundabouts.values()) {
    const owner = `roundabout:${roundabout.nodeId}`;
    const outer = roundabout.ringRadius + roundabout.ringWidth * 0.5;
    const inner = roundabout.ringRadius - roundabout.ringWidth * 0.5;
    visitDisc(roundabout.center, outer, inner - 0.3, 0.006, owner, visit);
    visitDisc(roundabout.center, inner, inner - roundabout.apronWidth, 0.05, owner, visit);
    visitDisc(roundabout.center, inner - roundabout.apronWidth, 0, 0.42, owner, visit);
    for (const approach of roundabout.approaches) {
      visitPolygon(approach.pad, 0.003, owner, visit);
    }
  }
}

export function forEachPavementTriangle(visit: PavementTriangleVisitor) {
  for (const road of roadNetwork.roads.values()) {
    visitRoad(road, visit);
  }
  visitJunctions(visit);
  visitRoundabouts(visit);
}

function separatedByEdges(edges: ArrayLike<number>, points: ArrayLike<number>) {
  for (let edge = 0; edge < 3; edge += 1) {
    const x0 = edges[edge * 2];
    const z0 = edges[edge * 2 + 1];
    const x1 = edges[((edge + 1) % 3) * 2];
    const z1 = edges[((edge + 1) % 3) * 2 + 1];
    const nx = z1 - z0;
    const nz = x0 - x1;
    let edgeMin = Number.POSITIVE_INFINITY;
    let edgeMax = Number.NEGATIVE_INFINITY;
    for (let k = 0; k < 6; k += 2) {
      const value = edges[k] * nx + edges[k + 1] * nz;
      edgeMin = Math.min(edgeMin, value);
      edgeMax = Math.max(edgeMax, value);
    }
    let pointsMin = Number.POSITIVE_INFINITY;
    let pointsMax = Number.NEGATIVE_INFINITY;
    for (let k = 0; k < points.length; k += 2) {
      const value = points[k] * nx + points[k + 1] * nz;
      pointsMin = Math.min(pointsMin, value);
      pointsMax = Math.max(pointsMax, value);
    }
    const epsilon = 1e-6 * (Math.abs(nx) + Math.abs(nz));
    if (pointsMax <= edgeMin + epsilon || pointsMin >= edgeMax - epsilon) {
      return true;
    }
  }
  return false;
}

export class PavementFloor {
  private readonly triangles: FloorTriangle[] = [];
  private readonly buckets = new Map<string, number[]>();

  constructor() {
    forEachPavementTriangle((a, b, c, _lift, floor) => {
      const area = (b.x - a.x) * (c.z - a.z) - (c.x - a.x) * (b.z - a.z);
      if (Math.abs(area) < 1e-6) {
        return;
      }
      const triangle: FloorTriangle = {
        points: [a.x, a.z, b.x, b.z, c.x, c.z],
        minX: Math.min(a.x, b.x, c.x),
        maxX: Math.max(a.x, b.x, c.x),
        minZ: Math.min(a.z, b.z, c.z),
        maxZ: Math.max(a.z, b.z, c.z),
        floor,
      };
      const id = this.triangles.length;
      this.triangles.push(triangle);
      for (let ix = Math.floor(triangle.minX / BUCKET_M); ix <= Math.floor(triangle.maxX / BUCKET_M); ix += 1) {
        for (let iz = Math.floor(triangle.minZ / BUCKET_M); iz <= Math.floor(triangle.maxZ / BUCKET_M); iz += 1) {
          const key = `${ix}:${iz}`;
          const list = this.buckets.get(key);
          if (list) {
            list.push(id);
          } else {
            this.buckets.set(key, [id]);
          }
        }
      }
    });
  }

  clampGrid(minX: number, maxX: number, minZ: number, maxZ: number, columns: number, rows: number, positions: number[]) {
    const cellX = (maxX - minX) / columns;
    const cellZ = (maxZ - minZ) / rows;
    const stride = columns + 1;
    const corners = new Float64Array(8);
    for (const triangle of this.triangles) {
      const c0 = Math.max(0, Math.floor((triangle.minX - minX) / cellX));
      const c1 = Math.min(columns - 1, Math.floor((triangle.maxX - minX) / cellX));
      const r0 = Math.max(0, Math.floor((triangle.minZ - minZ) / cellZ));
      const r1 = Math.min(rows - 1, Math.floor((triangle.maxZ - minZ) / cellZ));
      for (let row = r0; row <= r1; row += 1) {
        const z0 = minZ + row * cellZ;
        const z1 = z0 + cellZ;
        for (let column = c0; column <= c1; column += 1) {
          const x0 = minX + column * cellX;
          const x1 = x0 + cellX;
          corners[0] = x0;
          corners[1] = z0;
          corners[2] = x1;
          corners[3] = z0;
          corners[4] = x1;
          corners[5] = z1;
          corners[6] = x0;
          corners[7] = z1;
          if (separatedByEdges(triangle.points, corners)) {
            continue;
          }
          for (const [dr, dc] of [
            [0, 0],
            [0, 1],
            [1, 0],
            [1, 1],
          ]) {
            const index = ((row + dr) * stride + column + dc) * 3 + 1;
            if (positions[index] > triangle.floor) {
              positions[index] = triangle.floor;
            }
          }
        }
      }
    }
  }

  clampGeometry(geometry: THREE.BufferGeometry) {
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    const index = geometry.index;
    const count = index ? index.count : position.count;
    const stamps = new Int32Array(this.triangles.length);
    const floors = new Float64Array(position.count).fill(Number.POSITIVE_INFINITY);
    const points = new Float64Array(6);
    let stamp = 0;
    for (let offset = 0; offset + 2 < count; offset += 3) {
      const ids = [0, 1, 2].map((corner) => (index ? index.getX(offset + corner) : offset + corner));
      for (let corner = 0; corner < 3; corner += 1) {
        points[corner * 2] = position.getX(ids[corner]);
        points[corner * 2 + 1] = position.getZ(ids[corner]);
      }
      const area = (points[2] - points[0]) * (points[5] - points[1]) - (points[4] - points[0]) * (points[3] - points[1]);
      if (Math.abs(area) < 1e-6) {
        continue;
      }
      const minX = Math.min(points[0], points[2], points[4]);
      const maxX = Math.max(points[0], points[2], points[4]);
      const minZ = Math.min(points[1], points[3], points[5]);
      const maxZ = Math.max(points[1], points[3], points[5]);
      stamp += 1;
      let best = Number.POSITIVE_INFINITY;
      for (let ix = Math.floor(minX / BUCKET_M); ix <= Math.floor(maxX / BUCKET_M); ix += 1) {
        for (let iz = Math.floor(minZ / BUCKET_M); iz <= Math.floor(maxZ / BUCKET_M); iz += 1) {
          for (const id of this.buckets.get(`${ix}:${iz}`) ?? []) {
            if (stamps[id] === stamp) {
              continue;
            }
            stamps[id] = stamp;
            const triangle = this.triangles[id];
            if (triangle.floor >= best || triangle.maxX <= minX || triangle.minX >= maxX || triangle.maxZ <= minZ || triangle.minZ >= maxZ) {
              continue;
            }
            if (separatedByEdges(triangle.points, points) || separatedByEdges(points, triangle.points)) {
              continue;
            }
            best = triangle.floor;
          }
        }
      }
      if (best < Number.POSITIVE_INFINITY) {
        for (const id of ids) {
          floors[id] = Math.min(floors[id], best);
        }
      }
    }
    let changed = false;
    for (let vertex = 0; vertex < position.count; vertex += 1) {
      if (position.getY(vertex) > floors[vertex]) {
        position.setY(vertex, floors[vertex]);
        changed = true;
      }
    }
    if (changed) {
      position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  }
}
