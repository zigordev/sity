import * as THREE from "three";
import { groundSurfaceYAt } from "../natural/terrain";
import { artificialElements } from "../render/context";
import {
  ballastMaterial,
  barrierArmMaterial,
  craneWhiteMaterial,
  crossbuckMaterial,
  guardrailMaterial,
  lampPoleMaterial,
  railSteelMaterial,
  roadMarkingWhiteMaterial,
  shelterGlassMaterial,
  sidewalkMaterial,
  signalLensRedMaterial,
  sleeperMaterial,
  steelDarkMaterial,
  trainBodyMaterial,
  trainTrimMaterial,
} from "../render/materials";
import { roadNetwork } from "../roads/build";
import { boxBetween, mergeAll, polylineStations, volumeFromStations, type Station } from "../roads/geometry";
import { perpRight, type Vec3 } from "../roads/network";
import { registerCorridor } from "../world/occupancy";

export interface RailwayLine {
  id: string;
  points: Array<{ x: number; z: number }>;
  platformFromZ: number;
  platformToZ: number;
}

export const RAIL_GAUGE_M = 1.435;
export const RAILWAY_LINES: RailwayLine[] = [
  {
    id: "north-line",
    points: [
      { x: 520, z: -1566 },
      { x: 520, z: -868 },
    ],
    platformFromZ: -962,
    platformToZ: -874,
  },
];

const BALLAST_HALF_WIDTH_M = 3.2;
const TRACK_LIFT_M = 0.12;

const RAIL_EMBED_M = 0.33;
const TRACK_STEP_M = 2;

function crossingSites() {
  return [...roadNetwork.junctions.values()]
    .filter((junction) => junction.control === "crossing")
    .map((junction) => ({
      x: junction.center.x,
      z: junction.center.z,
      y: junction.center.y,
      reach: Math.max(...junction.ends.map((end) => end.halfWidth)) + 2.5,
    }));
}

function trackStations(line: RailwayLine): Station[] {
  const crossings = crossingSites();
  const points: Vec3[] = [];
  const push = (x: number, z: number) => {
    let y = groundSurfaceYAt(x, z) + TRACK_LIFT_M;
    for (const crossing of crossings) {
      const distance = Math.hypot(x - crossing.x, z - crossing.z);
      if (distance >= crossing.reach + 10) {
        continue;
      }
      const weight = distance <= crossing.reach ? 1 : 1 - (distance - crossing.reach) / 10;
      y = Math.min(y, THREE.MathUtils.lerp(y, crossing.y - RAIL_EMBED_M, weight));
    }
    points.push({ x, y, z });
  };
  for (let index = 0; index < line.points.length - 1; index += 1) {
    const a = line.points[index];
    const b = line.points[index + 1];
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    const steps = Math.max(1, Math.ceil(length / TRACK_STEP_M));
    for (let step = 0; step < steps; step += 1) {
      const t = step / steps;
      push(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t);
    }
  }
  const last = line.points[line.points.length - 1];
  push(last.x, last.z);
  return polylineStations(points);
}

function addMerged(name: string, parts: THREE.BufferGeometry[], material: THREE.Material, castShadow = true) {
  const merged = mergeAll(parts);
  if (!merged) {
    return undefined;
  }
  const mesh = new THREE.Mesh(merged, material);
  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  artificialElements.add(mesh);
  return mesh;
}

function stationAt(stations: Station[], s: number) {
  let low = 0;
  let high = stations.length - 1;
  if (s <= stations[0].s) {
    return stations[0];
  }
  if (s >= stations[high].s) {
    return stations[high];
  }
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (stations[middle].s <= s) {
      low = middle;
    } else {
      high = middle;
    }
  }
  const a = stations[low];
  const b = stations[high];
  const t = (s - a.s) / Math.max(b.s - a.s, 0.0001);
  return { ...a, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, s };
}

export function registerRailwayCorridors() {
  for (const line of RAILWAY_LINES) {
    registerCorridor(line.points, BALLAST_HALF_WIDTH_M + 2.5, `pavement:railway:${line.id}`);
    registerCorridor(line.points, BALLAST_HALF_WIDTH_M + 12, `railway:${line.id}`);
  }
}

function addTrack(line: RailwayLine, stations: Station[]) {
  const ballast = volumeFromStations(stations, -BALLAST_HALF_WIDTH_M, BALLAST_HALF_WIDTH_M, 0, 0.5, false);
  addMerged(`${line.id}-ballast`, [ballast.top, ballast.side], ballastMaterial, false);
  const rails: THREE.BufferGeometry[] = [];
  for (const sign of [-1, 1]) {
    const offset = sign * RAIL_GAUGE_M * 0.5;
    const rail = volumeFromStations(stations, offset - 0.035, offset + 0.035, 0.34, 0.17, false);
    rails.push(rail.top, rail.side);
  }
  addMerged(`${line.id}-rails`, rails, railSteelMaterial, false);

  const sleeper = new THREE.BoxGeometry(2.5, 0.16, 0.26);
  const total = stations[stations.length - 1].s;
  const count = Math.floor(total / 0.68);
  const sleepers = new THREE.InstancedMesh(sleeper, sleeperMaterial, count);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const up = new THREE.Vector3(0, 1, 0);
  for (let index = 0; index < count; index += 1) {
    const station = stationAt(stations, index * 0.68 + 0.3);
    position.set(station.x, station.y + 0.08, station.z);
    quaternion.setFromAxisAngle(up, Math.atan2(station.tx, station.tz));
    matrix.compose(position, quaternion, scale);
    sleepers.setMatrixAt(index, matrix);
  }
  sleepers.instanceMatrix.needsUpdate = true;
  sleepers.name = `${line.id}-sleepers`;
  sleepers.receiveShadow = true;
  artificialElements.add(sleepers);

  const masts: THREE.BufferGeometry[] = [];
  const wires: THREE.BufferGeometry[] = [];
  let previousWireAnchor: Vec3 | undefined;
  for (let s = 20; s < total - 10; s += 55) {
    const station = stationAt(stations, s);
    const right = perpRight({ x: station.tx, z: station.tz });
    const baseX = station.x + right.x * -4.2;
    const baseZ = station.z + right.z * -4.2;
    const pole = new THREE.BoxGeometry(0.22, 7.2, 0.22);
    pole.translate(baseX, station.y + 3.6, baseZ);
    masts.push(pole);
    masts.push(boxBetween({ x: baseX, y: station.y + 6.6, z: baseZ }, { x: station.x, y: station.y + 6.2, z: station.z }, 0.12, 0.12));
    const anchor = { x: station.x, y: station.y + 5.6, z: station.z };
    if (previousWireAnchor) {
      wires.push(boxBetween(previousWireAnchor, anchor, 0.035, 0.035));
    }
    previousWireAnchor = anchor;
  }
  addMerged(`${line.id}-catenary-masts`, masts, lampPoleMaterial);
  addMerged(`${line.id}-catenary-wire`, wires, steelDarkMaterial, false);

  const end = stations[stations.length - 1];
  const buffer = new THREE.BoxGeometry(3.2, 1.4, 1.2);
  buffer.rotateY(Math.atan2(end.tx, end.tz));
  buffer.translate(end.x, end.y + 0.7, end.z);
  addMerged(`${line.id}-buffer-stop`, [buffer], barrierArmMaterial);
}

function addPlatforms(line: RailwayLine, stations: Station[]) {
  const from = Math.min(line.platformFromZ, line.platformToZ);
  const to = Math.max(line.platformFromZ, line.platformToZ);
  const platformStations = stations.filter((station) => station.z >= from - 10 && station.z <= to + 10);
  if (platformStations.length < 2) {
    return;
  }
  const clipped = platformStations.map((station) => ({ ...station, z: Math.min(Math.max(station.z, from), to) }));
  const platforms: THREE.BufferGeometry[] = [];
  const canopy: THREE.BufferGeometry[] = [];
  const posts: THREE.BufferGeometry[] = [];
  const glass: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1] as const) {
    const inner = side * (RAIL_GAUGE_M * 0.5 + 1.15);
    const outer = side * (RAIL_GAUGE_M * 0.5 + 1.15 + 5.5);
    const volume = volumeFromStations(clipped, Math.min(inner, outer), Math.max(inner, outer), 0.95, 1.0, false);
    platforms.push(volume.top, volume.side);
    const edge = volumeFromStations(clipped, Math.min(inner, inner + side * 0.6), Math.max(inner, inner + side * 0.6), 0.97, 0.05, false);
    posts.push(edge.top);
    if (side === 1) {
      const roof = volumeFromStations(clipped, inner + 0.6, outer - 0.4, 4.2, 0.18, false);
      canopy.push(roof.top, roof.side);
      for (let z = from + 6; z < to - 4; z += 10) {
        const station = stationAt(clipped, clipped[0].s + (z - clipped[0].z));
        const px = station.x + (inner + outer) * 0.5;
        const post = new THREE.BoxGeometry(0.22, 3.3, 0.22);
        post.translate(px, station.y + 0.95 + 1.65, station.z);
        posts.push(post);
      }
    } else {
      for (let z = from + 20; z < to - 20; z += 34) {
        const station = stationAt(clipped, clipped[0].s + (z - clipped[0].z));
        const px = station.x + (inner + outer) * 0.5;
        const roof = new THREE.BoxGeometry(4.4, 0.14, 6);
        roof.translate(px, station.y + 0.95 + 2.7, station.z);
        canopy.push(roof);
        for (const [dx, dz] of [[-1.8, -2.6], [1.8, -2.6], [-1.8, 2.6], [1.8, 2.6]]) {
          const post = new THREE.BoxGeometry(0.14, 2.7, 0.14);
          post.translate(px + dx, station.y + 0.95 + 1.35, station.z + dz);
          posts.push(post);
        }
        const back = new THREE.BoxGeometry(0.06, 2.2, 5.6);
        back.translate(px - 1.9, station.y + 0.95 + 1.2, station.z);
        glass.push(back);
      }
    }
  }
  addMerged(`${line.id}-platforms`, platforms, sidewalkMaterial, false);
  addMerged(`${line.id}-platform-canopies`, canopy, craneWhiteMaterial);
  addMerged(`${line.id}-platform-posts`, posts, guardrailMaterial);
  addMerged(`${line.id}-platform-shelter-glass`, glass, shelterGlassMaterial, false);

  const train: THREE.BufferGeometry[] = [];
  const trim: THREE.BufferGeometry[] = [];
  const windows: THREE.BufferGeometry[] = [];
  const cars = 3;
  const carLength = 21;
  const startZ = to - 12;
  for (let car = 0; car < cars; car += 1) {
    const centreZ = startZ - carLength * 0.5 - car * (carLength + 0.8);
    const station = stationAt(clipped, clipped[0].s + (centreZ - clipped[0].z));
    const body = new THREE.BoxGeometry(2.9, 2.6, carLength);
    body.translate(station.x, station.y + 0.95 + 1.3 + 0.35, station.z);
    train.push(body);
    const roof = new THREE.BoxGeometry(2.7, 0.3, carLength - 0.6);
    roof.translate(station.x, station.y + 0.95 + 2.6 + 0.5, station.z);
    trim.push(roof);
    const skirt = new THREE.BoxGeometry(2.8, 0.6, carLength - 0.2);
    skirt.translate(station.x, station.y + 0.65, station.z);
    trim.push(skirt);
    for (const side of [-1, 1]) {
      const band = new THREE.BoxGeometry(0.04, 1.0, carLength - 3);
      band.translate(station.x + side * 1.47, station.y + 0.95 + 1.55, station.z);
      windows.push(band);
    }
    if (car === 0) {
      const nose = new THREE.BoxGeometry(2.6, 2.2, 1.6);
      nose.translate(station.x, station.y + 0.95 + 1.15 + 0.35, station.z + carLength * 0.5 + 0.7);
      trim.push(nose);
    }
  }
  addMerged(`${line.id}-train-bodies`, train, trainBodyMaterial);
  addMerged(`${line.id}-train-trim`, trim, trainTrimMaterial);
  addMerged(`${line.id}-train-windows`, windows, shelterGlassMaterial, false);
}

function addLevelCrossings() {
  const posts: THREE.BufferGeometry[] = [];
  const arms: THREE.BufferGeometry[] = [];
  const crossbucks: THREE.BufferGeometry[] = [];
  const lights: THREE.BufferGeometry[] = [];
  const markings: THREE.BufferGeometry[] = [];
  const decks: THREE.BufferGeometry[] = [];
  for (const junction of roadNetwork.junctions.values()) {
    if (junction.control !== "crossing") {
      continue;
    }
    const centre = junction.center;
    for (const end of junction.ends) {
      const road = roadNetwork.roads.get(end.roadId);
      if (!road) {
        continue;
      }
      const dir = end.dir;
      const right = { x: -perpRight(dir).x, z: -perpRight(dir).z };
      const back = 9;
      const postX = centre.x + dir.x * back + right.x * (road.halfWidth + 0.9);
      const postZ = centre.z + dir.z * back + right.z * (road.halfWidth + 0.9);
      const y = centre.y;
      const post = new THREE.BoxGeometry(0.24, 3.6, 0.24);
      post.translate(postX, y + 1.8, postZ);
      posts.push(post);
      const armFrom = { x: postX, y: y + 1.05, z: postZ };
      const armTo = { x: postX - right.x * (road.halfWidth + 0.6), y: y + 1.05, z: postZ - right.z * (road.halfWidth + 0.6) };
      arms.push(boxBetween(armFrom, armTo, 0.14, 0.14));
      const heading = Math.atan2(dir.x, dir.z);
      for (const angle of [Math.PI / 4, -Math.PI / 4]) {
        const blade = new THREE.BoxGeometry(1.2, 0.18, 0.05);
        blade.rotateZ(angle);
        blade.rotateY(heading);
        blade.translate(postX, y + 3.1, postZ);
        crossbucks.push(blade);
      }
      for (const dx of [-0.32, 0.32]) {
        const lamp = new THREE.CylinderGeometry(0.14, 0.14, 0.12, 12);
        lamp.rotateX(Math.PI / 2);
        lamp.rotateY(heading);
        const sideways = perpRight(dir);
        lamp.translate(postX + sideways.x * dx, y + 2.55, postZ + sideways.z * dx);
        lights.push(lamp);
      }
      const lineDistance = back + 2.5;
      const lineCentreX = centre.x + dir.x * lineDistance;
      const lineCentreZ = centre.z + dir.z * lineDistance;
      const stopLine = new THREE.BoxGeometry(road.halfWidth - 0.2, 0.02, 0.35);
      stopLine.rotateY(heading);
      stopLine.translate(lineCentreX + right.x * (road.halfWidth * 0.5), y + 0.03, lineCentreZ + right.z * (road.halfWidth * 0.5));
      markings.push(stopLine);
      for (let offset = 14; offset < 30; offset += 5) {
        const dash = new THREE.BoxGeometry(0.16, 0.02, 2.2);
        dash.rotateY(heading);
        const px = centre.x + dir.x * offset + right.x * (road.halfWidth - 0.4);
        const pz = centre.z + dir.z * offset + right.z * (road.halfWidth - 0.4);
        dash.translate(px, y + 0.03, pz);
        markings.push(dash);
      }
    }
    const first = junction.ends[0];
    const deck = new THREE.BoxGeometry(8.8, 0.14, first.halfWidth * 2 + 0.4);
    deck.rotateY(Math.atan2(first.dir.x, first.dir.z) + Math.PI / 2);
    deck.translate(centre.x, centre.y - 0.058, centre.z);
    decks.push(deck);
  }
  addMerged("level-crossing-posts", posts, lampPoleMaterial);
  addMerged("level-crossing-arms", arms, barrierArmMaterial);
  addMerged("level-crossing-crossbucks", crossbucks, crossbuckMaterial, false);
  addMerged("level-crossing-lights", lights, signalLensRedMaterial, false);
  for (const mesh of [addMerged("level-crossing-markings", markings, roadMarkingWhiteMaterial, false), addMerged("level-crossing-decks", decks, sleeperMaterial, false)]) {
    if (mesh) {
      mesh.userData.roadClearanceIgnore = true;
    }
  }
}

export function addRailway() {
  for (const line of RAILWAY_LINES) {
    const stations = trackStations(line);
    addTrack(line, stations);
    addPlatforms(line, stations);
  }
  addLevelCrossings();
}
