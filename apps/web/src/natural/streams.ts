import * as THREE from "three";
import { groundSurfaceBaseYAt, groundSurfaceYAt } from "./terrain";
import { naturalElements } from "../render/context";
import { riverBankMaterial, roadStructureConcreteMaterial, sharedSeaWaterMaterial, steelDarkMaterial } from "../render/materials";
import { roadNetwork } from "../roads/build";
import { mergeAll, polylineStations, volumeFromStations } from "../roads/geometry";
import { registerCorridor, registerCut } from "../world/occupancy";
import { sampleGroundPath } from "../world/frame";
import type { GroundPathPoint } from "../geometry/types";

export interface StreamSpec {
  id: string;
  controls: GroundPathPoint[];
  width: number;
  depth: number;
}

export interface LakeSpec {
  id: string;
  x: number;
  z: number;
  radiusX: number;
  radiusZ: number;
  depth: number;
}

export const STREAMS: StreamSpec[] = [
  {
    id: "mill-brook",
    controls: [
      { x: -2640, z: -230 },
      { x: -2685, z: 120 },
      { x: -2700, z: 420 },
      { x: -2698, z: 770 },
      { x: -2688, z: 1100 },
      { x: -2704, z: 1380 },
      { x: -2720, z: 1566 },
    ],
    width: 6,
    depth: 1.4,
  },
  {
    id: "pine-brook",
    controls: [
      { x: -2280, z: -1230 },
      { x: -2420, z: -930 },
      { x: -2500, z: -640 },
      { x: -2560, z: -400 },
      { x: -2610, z: -260 },
      { x: -2640, z: -230 },
    ],
    width: 4,
    depth: 1.1,
  },
  {
    id: "lake-outflow",
    controls: [
      { x: -2400, z: -420 },
      { x: -2470, z: -480 },
      { x: -2500, z: -640 },
    ],
    width: 3,
    depth: 0.9,
  },
  {
    id: "hill-brook",
    controls: [
      { x: -1900, z: 560 },
      { x: -2120, z: 600 },
      { x: -2300, z: 660 },
      { x: -2520, z: 700 },
      { x: -2698, z: 770 },
    ],
    width: 3.5,
    depth: 1.0,
  },
];

export const LAKES: LakeSpec[] = [{ id: "forest-lake", x: -2350, z: -470, radiusX: 78, radiusZ: 56, depth: 3.2 }];

const streamPaths = new Map<string, GroundPathPoint[]>();

function pathFor(stream: StreamSpec) {
  let path = streamPaths.get(stream.id);
  if (!path) {
    const length = stream.controls.reduce((sum, point, index) => (index === 0 ? 0 : sum + Math.hypot(point.x - stream.controls[index - 1].x, point.z - stream.controls[index - 1].z)), 0);
    path = sampleGroundPath(stream.controls, Math.max(12, Math.ceil(length / 12)));
    streamPaths.set(stream.id, path);
  }
  return path;
}

export function registerStreamCuts() {
  for (const stream of STREAMS) {
    const path = pathFor(stream);
    registerCorridor(path, stream.width * 0.5 + 6, `stream:${stream.id}`);
    for (const point of path) {
      const bed = groundSurfaceBaseYAt(point.x, point.z) - stream.depth;
      registerCut(point.x, point.z, bed, stream.width * 0.5, true, `stream:${stream.id}`);
    }
  }
  for (const lake of LAKES) {
    registerCorridor([{ x: lake.x, z: lake.z }, { x: lake.x + 0.01, z: lake.z }], Math.max(lake.radiusX, lake.radiusZ) + 8, `lake:${lake.id}`);
    const bed = groundSurfaceBaseYAt(lake.x, lake.z) - lake.depth;
    for (let angle = 0; angle < Math.PI * 2; angle += 0.16) {
      for (const scale of [0.25, 0.55, 0.85]) {
        registerCut(lake.x + Math.cos(angle) * lake.radiusX * scale, lake.z + Math.sin(angle) * lake.radiusZ * scale, bed, 10, true, `lake:${lake.id}`);
      }
    }
    registerCut(lake.x, lake.z, bed, 12, true, `lake:${lake.id}`);
  }
}

function addMesh(name: string, geometry: THREE.BufferGeometry, material: THREE.Material, castShadow = false) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  naturalElements.add(mesh);
}

function addCulverts() {
  const pipes: THREE.BufferGeometry[] = [];
  const headwalls: THREE.BufferGeometry[] = [];
  const parapets: THREE.BufferGeometry[] = [];
  for (const stream of STREAMS) {
    const path = pathFor(stream);
    for (const road of roadNetwork.roads.values()) {
      if (road.spec.class === "ramp") {
        continue;
      }
      let best: { distance: number; sample: (typeof road.samples)[number]; point: GroundPathPoint } | undefined;
      for (const sample of road.samples) {
        if (sample.structure !== "ground") {
          continue;
        }
        for (const point of path) {
          const distance = Math.hypot(sample.x - point.x, sample.z - point.z);
          if (!best || distance < best.distance) {
            best = { distance, sample, point };
          }
        }
      }
      if (!best || best.distance > 4) {
        continue;
      }
      const { sample } = best;
      const index = path.indexOf(best.point);
      const previous = path[Math.max(index - 1, 0)];
      const next = path[Math.min(index + 1, path.length - 1)];
      const flow = { x: next.x - previous.x, z: next.z - previous.z };
      const length = Math.hypot(flow.x, flow.z) || 1;
      const heading = Math.atan2(flow.x / length, flow.z / length);
      const span = road.width + road.cls.sidewalkWidth * 2 + 4;
      const bedY = groundSurfaceBaseYAt(sample.x, sample.z) - stream.depth;
      const radius = Math.min(stream.width * 0.45, 1.1);
      const pipe = new THREE.CylinderGeometry(radius, radius, span, 12, 1, true);
      pipe.rotateX(Math.PI / 2);
      pipe.rotateY(heading);
      pipe.translate(sample.x, bedY + radius, sample.z);
      pipes.push(pipe);
      for (const sign of [-1, 1]) {
        const wall = new THREE.BoxGeometry(stream.width + 3, stream.depth + 1.4, 0.5);
        wall.rotateY(heading);
        wall.translate(sample.x + (flow.x / length) * sign * span * 0.5, bedY + (stream.depth + 1.4) * 0.5 - 0.4, sample.z + (flow.z / length) * sign * span * 0.5);
        headwalls.push(wall);
      }
      if (stream.width >= 5) {
        const roadHeading = Math.atan2(sample.tx, sample.tz);
        const rightX = -sample.tz;
        const rightZ = sample.tx;
        for (const sign of [-1, 1]) {
          const offset = road.halfWidth + road.cls.sidewalkWidth + 0.35;
          const parapet = new THREE.BoxGeometry(0.4, 1.0, stream.width + 6);
          parapet.rotateY(roadHeading);
          parapet.translate(sample.x + rightX * offset * sign, sample.y + 0.5, sample.z + rightZ * offset * sign);
          parapets.push(parapet);
        }
      }
    }
  }
  const pipeMerged = mergeAll(pipes);
  if (pipeMerged) {
    addMesh("stream-culvert-pipes", pipeMerged, steelDarkMaterial);
  }
  const wallMerged = mergeAll(headwalls);
  if (wallMerged) {
    addMesh("stream-culvert-headwalls", wallMerged, roadStructureConcreteMaterial, true);
  }
  const parapetMerged = mergeAll(parapets);
  if (parapetMerged) {
    addMesh("stream-bridge-parapets", parapetMerged, roadStructureConcreteMaterial, true);
  }
}

export function addStreams() {
  const water: THREE.BufferGeometry[] = [];
  const beds: THREE.BufferGeometry[] = [];
  for (const stream of STREAMS) {
    const path = pathFor(stream);
    const stations = polylineStations(path.map((point) => ({ x: point.x, y: groundSurfaceBaseYAt(point.x, point.z) - stream.depth + 0.55, z: point.z })));
    const surface = volumeFromStations(stations, -stream.width * 0.5, stream.width * 0.5, 0, 0.3, false);
    water.push(surface.top);
    const bed = volumeFromStations(
      polylineStations(path.map((point) => ({ x: point.x, y: groundSurfaceBaseYAt(point.x, point.z) - stream.depth + 0.1, z: point.z }))),
      -stream.width * 0.5 - 0.8,
      stream.width * 0.5 + 0.8,
      0,
      0.2,
      false,
    );
    beds.push(bed.top);
  }
  for (const lake of LAKES) {
    const surfaceY = groundSurfaceYAt(lake.x, lake.z) + 0.9;
    const disc = new THREE.CircleGeometry(1, 48);
    disc.rotateX(-Math.PI / 2);
    disc.scale(lake.radiusX * 0.97, 1, lake.radiusZ * 0.97);
    disc.translate(lake.x, surfaceY, lake.z);
    water.push(disc);
  }
  const waterMerged = mergeAll(water);
  if (waterMerged) {
    const mesh = new THREE.Mesh(waterMerged, sharedSeaWaterMaterial);
    mesh.name = "streams-and-lakes-water";
    mesh.renderOrder = 6;
    mesh.receiveShadow = true;
    naturalElements.add(mesh);
  }
  const bedMerged = mergeAll(beds);
  if (bedMerged) {
    bedMerged.setAttribute("color", new THREE.Float32BufferAttribute(new Array((bedMerged.getAttribute("position").count) * 3).fill(0.42), 3));
    addMesh("stream-beds", bedMerged, riverBankMaterial);
  }
  addCulverts();
}
