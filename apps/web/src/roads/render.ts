import * as THREE from "three";
import { SEA_Y } from "../config/constants";
import { fullTerrainSurfaceYAt, groundSurfaceYAt } from "../natural/terrain";
import { roadElements } from "../render/context";
import {
  barrierArmMaterial,
  busLaneMaterial,
  embankmentMaterial,
  fenceMeshMaterial,
  grassMaterial,
  guardrailMaterial,
  highwayAsphaltMaterial,
  highwaySideMaterial,
  kerbMaterial,
  lampHeadMaterial,
  lampPoleMaterial,
  medianGrassMaterial,
  pierConcreteMaterial,
  roadMarkingWhiteMaterial,
  roadMarkingYellowMaterial,
  roadStructureConcreteMaterial,
  shelterGlassMaterial,
  sidewalkMaterial,
  signMaterials,
  signPoleMaterial,
  signalHeadMaterial,
  signalLensDarkMaterial,
  signalLensGreenMaterial,
  signalLensRedMaterial,
  tollGantryMaterial,
  tollSignMaterial,
} from "../render/materials";
import { addCableStayedBridgeStructure, addTunnelPortal } from "./structures";
import { roadNetwork } from "./build";
import {
  boxBetween,
  mergeAll,

  polygonVolume,
  polylineStations,
  skirtFromStations,
  stationsBetween,
  stripFromStations,
  volumeFromStations,
  type Station,
} from "./geometry";
import type { RoadClass } from "./classes";
import { RING_BRIDGE_CONTROLS, RING_ROAD_ID, RING_TUNNEL_CONTROLS } from "./plan";
import { perpRight, sampleAtStation, type BuiltDestination, type BuiltJunction, type BuiltRoad, type Lane, type RoadEnd, type StructureKind, type Vec3 } from "./network";

const LANE_OVERLAY_COLORS: Record<Lane["kind"], number> = {
  road: 0x35d07f,
  connector: 0xffa63d,
  ring: 0xc46bff,
  ramp: 0x4fb3ff,
};

const CLASS_RANK: Record<RoadClass, number> = {
  highway: 6,
  ramp: 5,
  arterial: 4,
  collector: 3,
  industrial: 3,
  rural: 3,
  mountain: 2,
  local: 1,
  service: 0,
};

export const laneOverlayGroup = new THREE.Group();
laneOverlayGroup.name = "lane-graph-overlay";
laneOverlayGroup.visible = false;
roadElements.add(laneOverlayGroup);

export const routeHighlightGroup = new THREE.Group();
routeHighlightGroup.name = "route-highlight";
roadElements.add(routeHighlightGroup);

export const roadFurnitureGroup = new THREE.Group();
roadFurnitureGroup.name = "road-furniture";
roadElements.add(roadFurnitureGroup);

export interface OrientedSlot extends Vec3 {
  heading: number;
}

export const roadSideSlots = {
  streetTrees: [] as Vec3[],
  medianTrees: [] as Vec3[],
  lamps: [] as Vec3[],
  parkingBays: [] as OrientedSlot[],
  busStops: [] as OrientedSlot[],
};

interface Placement {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  scaleY?: number;
  scaleX?: number;
  scaleZ?: number;
}

const asphaltTops: THREE.BufferGeometry[] = [];
const asphaltSides: THREE.BufferGeometry[] = [];
const concreteTops: THREE.BufferGeometry[] = [];
const sidewalkTops: THREE.BufferGeometry[] = [];
const kerbSides: THREE.BufferGeometry[] = [];
const medianTops: THREE.BufferGeometry[] = [];
const whiteMarkings: THREE.BufferGeometry[] = [];
const yellowMarkings: THREE.BufferGeometry[] = [];
const barrierGeometries: THREE.BufferGeometry[] = [];
const guardrailGeometries: THREE.BufferGeometry[] = [];
const pierGeometries: THREE.BufferGeometry[] = [];
const grassTops: THREE.BufferGeometry[] = [];
const embankmentGeometries: THREE.BufferGeometry[] = [];
const fenceGeometries: THREE.BufferGeometry[] = [];
const glassGeometries: THREE.BufferGeometry[] = [];
const barrierArmGeometries: THREE.BufferGeometry[] = [];
const busLaneGeometries: THREE.BufferGeometry[] = [];
const destinationLampPlacements: Placement[] = [];

function addMergedMesh(name: string, geometries: THREE.BufferGeometry[], material: THREE.Material, options: { castShadow?: boolean; renderOrder?: number; polygonOffset?: boolean } = {}) {
  const merged = mergeAll(geometries);
  if (!merged) {
    return;
  }
  const mesh = new THREE.Mesh(merged, material);
  mesh.name = name;
  mesh.castShadow = options.castShadow ?? false;
  mesh.receiveShadow = true;
  mesh.renderOrder = options.renderOrder ?? 9;
  roadElements.add(mesh);
}

function structureRuns(road: BuiltRoad): Array<{ kind: StructureKind; s0: number; s1: number }> {
  const s0 = road.spec.closed ? 0 : road.startTrim;
  const s1 = road.spec.closed ? road.samples[road.samples.length - 1].s : road.length - road.endTrim;
  const runs: Array<{ kind: StructureKind; s0: number; s1: number }> = [];
  let current: { kind: StructureKind; s0: number; s1: number } | undefined;
  for (const sample of road.samples) {
    if (sample.s < s0 - 0.01 || sample.s > s1 + 0.01) {
      continue;
    }
    if (!current || current.kind !== sample.structure) {
      if (current) {
        current.s1 = sample.s;
        runs.push(current);
      }
      current = { kind: sample.structure, s0: current ? current.s1 : Math.max(sample.s, s0), s1: sample.s };
    }
    current.s1 = sample.s;
  }
  if (current) {
    current.s1 = s1;
    runs.push(current);
  }
  if (runs.length > 0) {
    runs[0].s0 = s0;
  }
  return runs;
}

function deckThickness(road: BuiltRoad, kind: StructureKind) {
  if (kind === "viaduct" || kind === "bridge") {
    return road.spec.class === "highway" ? 1.8 : road.spec.class === "ramp" ? 1.2 : 1.4;
  }
  return 0.55;
}

function buildEmbankments() {
  for (const road of roadNetwork.roads.values()) {
    const edgeOffset = road.halfWidth + road.cls.sidewalkWidth;
    for (const run of structureRuns(road)) {
      if (run.kind !== "ground") {
        continue;
      }
      const stations = stationsBetween(road.samples, run.s0, run.s1).filter((station) => {
        const ground = groundSurfaceYAt(station.x, station.z);
        return station.y - ground > 0.4;
      });
      if (stations.length < 2) {
        continue;
      }
      let segment: Station[] = [];
      const flush = () => {
        if (segment.length >= 2) {
          for (const sign of [-1, 1] as const) {
            embankmentGeometries.push(skirtFromStations(segment, sign, edgeOffset, groundSurfaceYAt));
          }
        }
        segment = [];
      };
      for (let index = 0; index < stations.length; index += 1) {
        const station = stations[index];
        const previous = stations[index - 1];
        if (previous && station.s - previous.s > 12) {
          flush();
        }
        segment.push(station);
      }
      flush();
    }
  }
}

function buildSurfaces() {
  for (const road of roadNetwork.roads.values()) {
    const closedWhole = Boolean(road.spec.closed);
    for (const run of structureRuns(road)) {
      const stations = stationsBetween(road.samples, run.s0, run.s1);
      if (stations.length < 2) {
        continue;
      }
      const thickness = deckThickness(road, run.kind);
      const volume = volumeFromStations(stations, -road.halfWidth, road.halfWidth, 0, thickness, false);
      asphaltTops.push(volume.top);
      asphaltSides.push(volume.side);
    }
    if (closedWhole) {
      const last = road.samples[road.samples.length - 1];
      const first = road.samples[0];
      const joint = polylineStations([
        { x: last.x, y: last.y, z: last.z },
        { x: first.x, y: first.y, z: first.z },
      ]);
      const volume = volumeFromStations(joint, -road.halfWidth, road.halfWidth, 0, deckThickness(road, last.structure), false);
      asphaltTops.push(volume.top);
      asphaltSides.push(volume.side);
    }
  }

  for (const junction of roadNetwork.junctions.values()) {
    const top = polygonVolume(junction.pad, 0.004, 0.55);
    if (top) {
      asphaltTops.push(top.top);
      asphaltSides.push(top.side);
    }
  }

  for (const roundabout of roadNetwork.roundabouts.values()) {
    const outer = roundabout.ringRadius + roundabout.ringWidth * 0.5;
    const inner = roundabout.ringRadius - roundabout.ringWidth * 0.5;
    const ring = new THREE.RingGeometry(inner - 0.3, outer, 56);
    ring.rotateX(-Math.PI / 2);
    ring.translate(roundabout.center.x, roundabout.center.y + 0.006, roundabout.center.z);
    asphaltTops.push(ring);
    const apron = new THREE.RingGeometry(inner - roundabout.apronWidth, inner, 56);
    apron.rotateX(-Math.PI / 2);
    apron.translate(roundabout.center.x, roundabout.center.y + 0.05, roundabout.center.z);
    concreteTops.push(apron);
    const islandRadius = inner - roundabout.apronWidth;
    const island = new THREE.CylinderGeometry(islandRadius - 0.35, islandRadius, 0.42, 40);
    island.translate(roundabout.center.x, roundabout.center.y + 0.21, roundabout.center.z);
    grassTops.push(island);
    for (const approach of roundabout.approaches) {
      const pad = polygonVolume(approach.pad, 0.003, 0.55);
      if (pad) {
        asphaltTops.push(pad.top);
        asphaltSides.push(pad.side);
      }
    }
  }
}

function dashedLine(road: BuiltRoad, s0: number, s1: number, offset: number, width: number, dash: number, gap: number, target: THREE.BufferGeometry[], lift = 0.02) {
  for (let s = s0; s < s1; s += dash + gap) {
    const end = Math.min(s + dash, s1);
    if (end - s < 0.4) {
      break;
    }
    target.push(stripFromStations(stationsBetween(road.samples, s, end), offset - width * 0.5, offset + width * 0.5, lift));
  }
}

function solidLine(road: BuiltRoad, s0: number, s1: number, offset: number, width: number, target: THREE.BufferGeometry[], lift = 0.02) {
  if (s1 - s0 < 0.5) {
    return;
  }
  target.push(stripFromStations(stationsBetween(road.samples, s0, s1), offset - width * 0.5, offset + width * 0.5, lift));
}

function gapsFor(road: BuiltRoad) {
  return road.markingGaps;
}

function solidLineWithGaps(road: BuiltRoad, s0: number, s1: number, offset: number, width: number, target: THREE.BufferGeometry[]) {
  const gaps = gapsFor(road).slice().sort((a, b) => a.s0 - b.s0);
  let cursor = s0;
  for (const gap of gaps) {
    if (gap.s1 < cursor || gap.s0 > s1) {
      continue;
    }
    solidLine(road, cursor, Math.min(gap.s0, s1), offset, width, target);
    cursor = Math.max(cursor, gap.s1);
  }
  solidLine(road, cursor, s1, offset, width, target);
}

function buildRoadMarkings() {
  for (const road of roadNetwork.roads.values()) {
    const cls = road.cls;
    const closed = Boolean(road.spec.closed);
    const s0 = closed ? 0 : road.startTrim;
    const s1 = closed ? road.samples[road.samples.length - 1].s : road.length - road.endTrim;
    const forward = road.spec.forward;
    const backward = road.spec.backward;
    const median = road.median;

    for (const direction of ["forward", "backward"] as const) {
      const offsets = road.laneOffsets[direction];
      const sign = direction === "forward" ? 1 : -1;
      for (let index = 1; index < offsets.length; index += 1) {
        const boundary = sign * (offsets[index - 1] + offsets[index]) * 0.5;
        if (road.spec.busLane && index === offsets.length - 1) {
          solidLine(road, s0 + 1, s1 - 1, boundary, 0.18, whiteMarkings);
          const outer = offsets[index];
          const stations = stationsBetween(road.samples, s0 + 1, s1 - 1);
          busLaneGeometries.push(stripFromStations(stations, sign * (outer - cls.laneWidth * 0.5 + 0.15), sign * (outer + cls.laneWidth * 0.5 - 0.1), 0.012));
          for (let s = s0 + 20; s < s1 - 12; s += 60) {
            const letter = stationsBetween(road.samples, s, s + 4.5);
            whiteMarkings.push(stripFromStations(letter, sign * (outer - 0.45), sign * (outer + 0.45), 0.025));
          }
          continue;
        }
        dashedLine(road, s0 + 1, s1 - 1, boundary, 0.14, 3, 6, whiteMarkings);
      }
    }

    if (forward > 0 && backward > 0 && median === 0) {
      if (cls.centerMarking === "double-yellow") {
        solidLine(road, s0, s1, -0.16, 0.12, yellowMarkings);
        solidLine(road, s0, s1, 0.16, 0.12, yellowMarkings);
      } else if (cls.centerMarking === "dashed-yellow") {
        dashedLine(road, s0 + 1, s1 - 1, 0, 0.14, 3, 6, yellowMarkings);
      } else if (cls.centerMarking === "dashed-white") {
        dashedLine(road, s0 + 1, s1 - 1, 0, 0.14, 3, 6, whiteMarkings);
      }
    }

    if (cls.edgeLine) {
      const edge = road.halfWidth - cls.outerShoulder - 0.2;
      if (forward > 0 && backward > 0) {
        solidLineWithGaps(road, s0, s1, edge, 0.15, whiteMarkings);
        solidLineWithGaps(road, s0, s1, -edge, 0.15, whiteMarkings);
        if (median > 0 && road.spec.class === "highway") {
          solidLine(road, s0, s1, median * 0.5 + 0.1, 0.12, yellowMarkings);
          solidLine(road, s0, s1, -median * 0.5 - 0.1, 0.12, yellowMarkings);
        }
      } else {
        solidLine(road, s0, s1, edge, 0.15, whiteMarkings);
        solidLine(road, s0, s1, -edge, 0.15, whiteMarkings);
      }
    }

    if (road.spec.parkingLane) {
      const inner = road.halfWidth - 2.2;
      for (const sign of [-1, 1]) {
        solidLine(road, s0 + 6, s1 - 6, sign * inner, 0.12, whiteMarkings);
        for (let s = s0 + 8; s < s1 - 8; s += 6) {
          const stations = stationsBetween(road.samples, s - 0.06, s + 0.06);
          whiteMarkings.push(stripFromStations(stations, sign * inner, sign * (inner + 2.0), 0.02));
          if (s + 6 < s1 - 8) {
            const bay = sampleAtStation(road.samples, s + 3);
            const right = perpRight({ x: bay.tx, z: bay.tz });
            const across = sign * (inner + 1.05);
            roadSideSlots.parkingBays.push({
              x: bay.x + right.x * across,
              y: bay.y,
              z: bay.z + right.z * across,
              heading: sign > 0 ? Math.atan2(bay.tx, bay.tz) : Math.atan2(-bay.tx, -bay.tz),
            });
          }
        }
      }
    }
  }

  for (const junction of roadNetwork.junctions.values()) {
    if (junction.ends.length < 2) {
      continue;
    }
    for (const end of junction.ends) {
      const road = roadNetwork.roads.get(end.roadId);
      if (!road) {
        continue;
      }
      const incomingDirection = end.atStart ? "backward" : "forward";
      const incomingOffsets = road.laneOffsets[incomingDirection];
      if (incomingOffsets.length === 0) {
        continue;
      }
      const sign = end.atStart ? -1 : 1;
      const lanesInner = sign * (incomingOffsets[0] - road.cls.laneWidth * 0.5);
      const lanesOuter = sign * (incomingOffsets[incomingOffsets.length - 1] + road.cls.laneWidth * 0.5);
      const lineStation = end.atStart ? road.startTrim + 2.1 : road.length - road.endTrim - 2.1;
      const control = junction.control;
      const urban = road.cls.sidewalkWidth > 0;
      if (control === "signal" || control === "stop") {
        const stations = stationsBetween(road.samples, lineStation - 0.25, lineStation + 0.25);
        whiteMarkings.push(stripFromStations(stations, Math.min(lanesInner, lanesOuter), Math.max(lanesInner, lanesOuter), 0.022));
      }
      if (urban && (control === "signal" || (control === "stop" && junction.ends.length >= 3))) {
        const crossStart = end.atStart ? road.startTrim + 0.6 : road.length - road.endTrim - 0.6 - 2.6;
        const crossStations = stationsBetween(road.samples, crossStart, crossStart + 2.6);
        const inset = 0.35;
        for (let u = -road.halfWidth + inset + 0.3; u <= road.halfWidth - inset - 0.3; u += 1.0) {
          whiteMarkings.push(stripFromStations(crossStations, u - 0.25, u + 0.25, 0.024));
        }
      }
    }
  }

  for (const roundabout of roadNetwork.roundabouts.values()) {
    for (const end of roundabout.ends) {
      const road = roadNetwork.roads.get(end.roadId);
      if (!road) {
        continue;
      }
      const incomingDirection = end.atStart ? "backward" : "forward";
      const incomingOffsets = road.laneOffsets[incomingDirection];
      if (incomingOffsets.length === 0) {
        continue;
      }
      const sign = end.atStart ? -1 : 1;
      const inner = sign * (incomingOffsets[0] - road.cls.laneWidth * 0.5);
      const outer = sign * (incomingOffsets[incomingOffsets.length - 1] + road.cls.laneWidth * 0.5);
      const lineStation = end.atStart ? road.startTrim + 0.8 : road.length - road.endTrim - 0.8;
      const stations = stationsBetween(road.samples, lineStation - 0.25, lineStation + 0.25);
      const from = Math.min(inner, outer);
      const to = Math.max(inner, outer);
      for (let u = from; u < to; u += 1.0) {
        whiteMarkings.push(stripFromStations(stations, u, Math.min(u + 0.5, to), 0.022));
      }
    }
    const outer = roundabout.ringRadius + roundabout.ringWidth * 0.5 - 0.25;
    const ringLine = new THREE.RingGeometry(outer - 0.12, outer, 64);
    ringLine.rotateX(-Math.PI / 2);
    ringLine.translate(roundabout.center.x, roundabout.center.y + 0.026, roundabout.center.z);
    whiteMarkings.push(ringLine);
  }
}

function buildSidewalksAndMedians() {
  for (const road of roadNetwork.roads.values()) {
    const cls = road.cls;
    const closed = Boolean(road.spec.closed);
    const s0 = closed ? 0 : road.startTrim;
    const s1 = closed ? road.samples[road.samples.length - 1].s : road.length - road.endTrim;
    if (s1 - s0 < 2) {
      continue;
    }
    const stations = stationsBetween(road.samples, s0, s1);
    if (cls.sidewalkWidth > 0) {
      for (const sign of [-1, 1]) {
        const a = sign * road.halfWidth;
        const b = sign * (road.halfWidth + cls.sidewalkWidth);
        const volume = volumeFromStations(stations, Math.min(a, b), Math.max(a, b), 0.15, 0.6);
        sidewalkTops.push(volume.top);
        kerbSides.push(volume.side);
      }
      if ((road.spec.class === "arterial" || road.spec.class === "collector") && s1 - s0 > 260) {
        let stopSide = road.spec.id.length % 2 === 0 ? 1 : -1;
        for (let s = s0 + 130; s < s1 - 60; s += 240) {
          const station = sampleAtStation(road.samples, s);
          if (station.structure !== "ground") {
            continue;
          }
          const right = perpRight({ x: station.tx, z: station.tz });
          const offset = stopSide * (road.halfWidth + cls.sidewalkWidth * 0.62);
          roadSideSlots.busStops.push({
            x: station.x + right.x * offset,
            y: station.y + 0.15,
            z: station.z + right.z * offset,
            heading: stopSide > 0 ? Math.atan2(station.tx, station.tz) : Math.atan2(-station.tx, -station.tz),
          });
          stopSide *= -1;
        }
      }
      const treeSpacing = cls.streetTrees ? 13 : 0;
      if (treeSpacing > 0) {
        for (let s = s0 + 16; s < s1 - 16; s += treeSpacing) {
          const station = sampleAtStation(road.samples, s);
          if (station.structure !== "ground") {
            continue;
          }
          const right = perpRight({ x: station.tx, z: station.tz });
          const offset = road.halfWidth + cls.sidewalkWidth - 0.9;
          for (const sign of [-1, 1]) {
            roadSideSlots.streetTrees.push({ x: station.x + right.x * offset * sign, y: station.y + 0.15, z: station.z + right.z * offset * sign });
          }
        }
      }
    }
    if (road.median > 0 && cls.medianKind === "planted" && s1 - s0 > 40) {
      const medianStations = stationsBetween(road.samples, s0 + 14, s1 - 14);
      const half = road.median * 0.5 - 0.3;
      const volume = volumeFromStations(medianStations, -half, half, 0.18, 0.6);
      medianTops.push(volume.top);
      kerbSides.push(volume.side);
      for (let s = s0 + 22; s < s1 - 22; s += 12) {
        const station = sampleAtStation(road.samples, s);
        roadSideSlots.medianTrees.push({ x: station.x, y: station.y + 0.18, z: station.z });
      }
    }
    if (road.median > 0 && cls.medianKind === "barrier") {
      const volume = volumeFromStations(stations, -0.3, 0.3, 0.9, 0.9, false);
      barrierGeometries.push(volume.top, volume.side);
      if (closed) {
        const last = road.samples[road.samples.length - 1];
        const first = road.samples[0];
        const joint = volumeFromStations(polylineStations([{ x: last.x, y: last.y, z: last.z }, { x: first.x, y: first.y, z: first.z }]), -0.3, 0.3, 0.9, 0.9, false);
        barrierGeometries.push(joint.top, joint.side);
      }
    }
  }

  for (const junction of roadNetwork.junctions.values()) {
    if (!junction.hasSidewalks) {
      continue;
    }
    for (const corner of junction.corners) {
      const roadA = roadNetwork.roads.get(corner.fromRoadId);
      const roadB = roadNetwork.roads.get(corner.toRoadId);
      const width = Math.max(roadA?.cls.sidewalkWidth ?? 0, roadB?.cls.sidewalkWidth ?? 0);
      if (width <= 0) {
        continue;
      }
      const outward = corner.points.map((point) => {
        const dx = point.x - junction.center.x;
        const dz = point.z - junction.center.z;
        const length = Math.hypot(dx, dz) || 1;
        return { x: point.x + (dx / length) * width, y: point.y, z: point.z + (dz / length) * width };
      });
      const polygon = [...corner.points, ...outward.slice().reverse()];
      const volume = polygonVolume(polygon, 0.15, 0.6);
      if (volume) {
        sidewalkTops.push(volume.top);
        kerbSides.push(volume.side);
      }
    }
  }
}

function lineStrip(a: Vec3, b: Vec3, width: number, lift: number, target: THREE.BufferGeometry[]) {
  target.push(stripFromStations(polylineStations([a, b]), -width * 0.5, width * 0.5, lift));
}

function postBox(x: number, y: number, z: number, size: number, height: number, target: THREE.BufferGeometry[]) {
  const post = new THREE.BoxGeometry(size, height, size);
  post.translate(x, y + height * 0.5, z);
  target.push(post);
}

function buildParkingStalls(destination: BuiltDestination, alongFrom: number, alongTo: number, acrossFrom: number, acrossTo: number) {
  const { origin, axis, right } = destination;
  const at = (along: number, across: number, lift = 0): Vec3 => ({
    x: origin.x + axis.x * along + right.x * across,
    y: origin.y + lift,
    z: origin.z + axis.z * along + right.z * across,
  });
  const usable = acrossTo - acrossFrom;
  const module = 16.5;
  if (usable < 12 || alongTo - alongFrom < 6) {
    return;
  }
  const modules = Math.max(1, Math.floor(usable / module));
  const start = acrossFrom + (usable - modules * module) * 0.5;
  for (let index = 0; index < modules; index += 1) {
    const centre = start + module * (index + 0.5);
    for (const side of [-1, 1] as const) {
      const inner = centre + side * 3.25;
      const outer = centre + side * 8.25;
      lineStrip(at(alongFrom, outer), at(alongTo, outer), 0.12, 0.02, whiteMarkings);
      for (let along = alongFrom; along <= alongTo + 0.01; along += 2.6) {
        lineStrip(at(along, inner), at(along, outer), 0.12, 0.02, whiteMarkings);
        if (along + 2.6 <= alongTo + 0.01) {
          const bay = at(along + 1.3, (inner + outer) * 0.5);
          roadSideSlots.parkingBays.push({ ...bay, heading: Math.atan2(right.x * side, right.z * side) });
        }
      }
    }
    lineStrip(at(alongFrom, centre), at(alongTo, centre), 0.14, 0.02, yellowMarkings);
  }
}

function buildDestination(junction: BuiltJunction, destination: BuiltDestination) {
  const { spec, origin, axis, right } = destination;
  const y = origin.y;
  const at = (along: number, across: number, lift = 0): Vec3 => ({
    x: origin.x + axis.x * along + right.x * across,
    y: y + lift,
    z: origin.z + axis.z * along + right.z * across,
  });
  if (spec.kind === "culdesac") {
    const centre = junction.center;
    const island = new THREE.CylinderGeometry(3.0, 3.4, 0.42, 24);
    island.translate(centre.x, y + 0.21, centre.z);
    grassTops.push(island);
    const kerb = new THREE.CylinderGeometry(3.6, 3.6, 0.3, 24);
    kerb.translate(centre.x, y + 0.15, centre.z);
    kerbSides.push(kerb);
    const arc = junction.pad.slice(1, -1);
    const outward = arc.map((point) => {
      const dx = point.x - centre.x;
      const dz = point.z - centre.z;
      const length = Math.hypot(dx, dz) || 1;
      return { x: point.x + (dx / length) * 1.6, y: point.y, z: point.z + (dz / length) * 1.6 };
    });
    const ring = polygonVolume([...arc, ...outward.slice().reverse()], 0.15, 0.6);
    if (ring) {
      sidewalkTops.push(ring.top);
      kerbSides.push(ring.side);
    }
    destinationLampPlacements.push({ x: centre.x, y: y + 0.21, z: centre.z, rotationY: Math.atan2(axis.x, axis.z) });
    return;
  }
  const half = spec.width * 0.5;
  const depth = spec.depth;
  const footway = 1.6;
  const inner = [at(4, half), at(depth, half), at(depth, -half), at(4, -half)];
  const outer = [at(4, half + footway), at(depth + footway, half + footway), at(depth + footway, -half - footway), at(4, -half - footway)];
  const ring = polygonVolume([...inner, ...outer.slice().reverse()], 0.15, 0.6);
  if (ring) {
    sidewalkTops.push(ring.top);
    kerbSides.push(ring.side);
  }
  const rim = polylineStations([at(4, -half - footway - 0.2), at(depth + footway + 0.2, -half - footway - 0.2), at(depth + footway + 0.2, half + footway + 0.2), at(4, half + footway + 0.2)]);
  embankmentGeometries.push(skirtFromStations(rim, -1, 0, groundSurfaceYAt));
  for (const across of [-(half - 2.2), half - 2.2]) {
    for (const along of [10, depth - 4]) {
      const point = at(along, across, 0.15);
      destinationLampPlacements.push({ x: point.x, y: point.y, z: point.z, rotationY: Math.atan2(-right.x * Math.sign(across), -right.z * Math.sign(across)) });
    }
  }
  for (const across of [-half - footway * 0.5, half + footway * 0.5]) {
    for (let along = 12; along < depth - 4; along += 14) {
      roadSideSlots.streetTrees.push(at(along, across, 0.15));
    }
  }

  if (spec.kind === "parking" || spec.kind === "viewpoint") {
    const deckRadius = spec.kind === "viewpoint" ? Math.min(half - 2, 13) : 0;
    const stallsTo = spec.kind === "viewpoint" ? depth - deckRadius - 4 : depth - 2.5;
    buildParkingStalls(destination, 9, stallsTo, -half + 1.2, half - 1.2);
    lineStrip(at(9, -half + 1.2), at(9, half - 1.2), 0.12, 0.02, whiteMarkings);
  }
  if (spec.kind === "viewpoint") {
    const deckRadius = Math.min(half - 2, 13);
    const deck: Vec3[] = [];
    const segments = 18;
    for (let index = 0; index <= segments; index += 1) {
      const angle = -Math.PI * 0.5 + (index / segments) * Math.PI;
      deck.push(at(depth - deckRadius - 1 + Math.cos(angle) * (deckRadius + 5), Math.sin(angle) * (deckRadius + 5)));
    }
    const platform = polygonVolume(deck, 0.32, 0.9);
    if (platform) {
      concreteTops.push(platform.top);
      asphaltSides.push(platform.side);
    }
    const deckRim = polylineStations(deck);
    embankmentGeometries.push(skirtFromStations(deckRim, -1, 0, groundSurfaceYAt));
    for (let index = 0; index <= segments; index += 1) {
      const angle = -Math.PI * 0.5 + (index / segments) * Math.PI;
      const post = at(depth - deckRadius - 1 + Math.cos(angle) * (deckRadius + 4.4), Math.sin(angle) * (deckRadius + 4.4), 0.32);
      postBox(post.x, post.y, post.z, 0.12, 1.1, guardrailGeometries);
      if (index < segments) {
        const nextAngle = -Math.PI * 0.5 + ((index + 1) / segments) * Math.PI;
        const next = at(depth - deckRadius - 1 + Math.cos(nextAngle) * (deckRadius + 4.4), Math.sin(nextAngle) * (deckRadius + 4.4), 0.32);
        guardrailGeometries.push(boxBetween(post, next, 0.08, 0.08, 1.02));
        guardrailGeometries.push(boxBetween(post, next, 0.06, 0.06, 0.55));
      }
    }
    const kiosk = new THREE.BoxGeometry(7, 3.4, 4);
    kiosk.rotateY(Math.atan2(axis.x, axis.z));
    const kioskAt = at(depth - deckRadius - 9, -half + 5, 0.15);
    kiosk.translate(kioskAt.x, kioskAt.y + 1.7, kioskAt.z);
    barrierGeometries.push(kiosk);
    const kioskRoof = new THREE.BoxGeometry(8, 0.3, 5);
    kioskRoof.rotateY(Math.atan2(axis.x, axis.z));
    kioskRoof.translate(kioskAt.x, kioskAt.y + 3.5, kioskAt.z);
    barrierGeometries.push(kioskRoof);
    const bench = at(depth - deckRadius - 1, 0, 0.32);
    postBox(bench.x, bench.y, bench.z, 0.4, 1.3, guardrailGeometries);
  }
  if (spec.kind === "yard") {
    const perimeter = [at(4, half + footway), at(depth + footway, half + footway), at(depth + footway, -half - footway), at(4, -half - footway)];
    for (let index = 0; index < perimeter.length - 1; index += 1) {
      const a = perimeter[index];
      const b = perimeter[index + 1];
      const length = Math.hypot(b.x - a.x, b.z - a.z);
      const steps = Math.max(1, Math.round(length / 3));
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        postBox(a.x + (b.x - a.x) * t, a.y + 0.15, a.z + (b.z - a.z) * t, 0.12, 2.4, guardrailGeometries);
      }
      const mesh = boxBetween({ ...a, y: a.y + 0.15 }, { ...b, y: b.y + 0.15 }, 0.04, 2.1, 0.2);
      fenceGeometries.push(mesh);
      guardrailGeometries.push(boxBetween({ ...a, y: a.y + 0.15 }, { ...b, y: b.y + 0.15 }, 0.07, 0.07, 2.3));
    }
    const gateY = y + 0.15;
    for (const side of [-1, 1] as const) {
      const post = at(4, side * (destination.entryHalfWidth + 0.6), 0.15);
      postBox(post.x, post.y, post.z, 0.3, 2.6, guardrailGeometries);
      const wingFrom = at(4, side * (destination.entryHalfWidth + 0.6), 0.15);
      const wingTo = at(4, side * (half + footway), 0.15);
      fenceGeometries.push(boxBetween(wingFrom, wingTo, 0.04, 2.1, 0.2));
      guardrailGeometries.push(boxBetween(wingFrom, wingTo, 0.07, 0.07, 2.3));
    }
    const armFrom = at(5.2, -destination.entryHalfWidth - 0.4, 0.15);
    const armTo = at(5.2, 0.4, 0.15);
    barrierArmGeometries.push(boxBetween(armFrom, armTo, 0.12, 0.12, 0.95));
    const armFrom2 = at(5.2, destination.entryHalfWidth + 0.4, 0.15);
    const armTo2 = at(5.2, -0.4, 0.15);
    barrierArmGeometries.push(boxBetween(armFrom2, armTo2, 0.12, 0.12, 0.95));
    const house = at(9, -(destination.entryHalfWidth + 3.4), 0.15);
    const houseBox = new THREE.BoxGeometry(4.2, 3.0, 3.2);
    houseBox.rotateY(Math.atan2(axis.x, axis.z));
    houseBox.translate(house.x, gateY + 1.5, house.z);
    barrierGeometries.push(houseBox);
    const houseGlass = new THREE.BoxGeometry(4.4, 1.1, 3.4);
    houseGlass.rotateY(Math.atan2(axis.x, axis.z));
    houseGlass.translate(house.x, gateY + 1.9, house.z);
    glassGeometries.push(houseGlass);
    const houseRoof = new THREE.BoxGeometry(5.0, 0.25, 4.0);
    houseRoof.rotateY(Math.atan2(axis.x, axis.z));
    houseRoof.translate(house.x, gateY + 3.1, house.z);
    barrierGeometries.push(houseRoof);
    buildParkingStalls(destination, 12, depth - 3, half * 0.1, half - 1.2);
    for (let along = 12; along < depth - 4; along += 9) {
      lineStrip(at(along, -half + 1.4), at(along, -half * 0.35), 0.16, 0.02, yellowMarkings);
    }
  }
  if (spec.kind === "forecourt") {
    const islandInner = [at(10, 3.4), at(depth - 6, 3.4), at(depth - 6, -3.4), at(10, -3.4)];
    const island = polygonVolume(islandInner, 0.15, 0.6);
    if (island) {
      sidewalkTops.push(island.top);
      kerbSides.push(island.side);
    }
    for (const side of [-1, 1] as const) {
      for (let along = 14; along < depth - 12; along += 16) {
        const heading = Math.atan2(axis.x, axis.z);
        const centre = at(along + 4, side * 1.4, 0.15);
        for (const dx of [-2.8, 2.8]) {
          for (const dz of [-1.0, 1.0]) {
            const post = at(along + 4 + dx, side * 1.4 + dz, 0.15);
            postBox(post.x, post.y, post.z, 0.12, 2.7, guardrailGeometries);
          }
        }
        const roof = new THREE.BoxGeometry(6.4, 0.16, 2.6);
        roof.rotateY(heading);
        roof.translate(centre.x, centre.y + 2.75, centre.z);
        barrierGeometries.push(roof);
        const back = new THREE.BoxGeometry(6.2, 2.3, 0.06);
        back.rotateY(heading);
        const backAt = at(along + 4, side * 0.5, 0.15);
        back.translate(backAt.x, backAt.y + 1.4, backAt.z);
        glassGeometries.push(back);
        const seat = new THREE.BoxGeometry(4.6, 0.08, 0.45);
        seat.rotateY(heading);
        const seatAt = at(along + 4, side * 1.0, 0.15);
        seat.translate(seatAt.x, seatAt.y + 0.5, seatAt.z);
        guardrailGeometries.push(seat);
        lineStrip(at(along - 1, side * 3.6), at(along + 11, side * 3.6), 0.14, 0.02, yellowMarkings);
        lineStrip(at(along - 1, side * 3.6), at(along - 1, side * 7.2), 0.14, 0.02, yellowMarkings);
        lineStrip(at(along + 11, side * 3.6), at(along + 11, side * 7.2), 0.14, 0.02, yellowMarkings);
      }
    }
    buildParkingStalls(destination, 12, depth - 3, 9, half - 1.2);
    buildParkingStalls(destination, 12, depth - 3, -half + 1.2, -9);
  }
}

function buildTollGantries() {
  const frames: THREE.BufferGeometry[] = [];
  const signs: THREE.BufferGeometry[] = [];
  for (const node of roadNetwork.nodes.values()) {
    if (node.spec.control !== "toll" || !node.isCut) {
      continue;
    }
    const road = roadNetwork.roads.get(node.roadIds[0]);
    if (!road) {
      continue;
    }
    const cut = road.cutStations.find((station) => station.nodeId === node.spec.id);
    if (!cut) {
      continue;
    }
    const station = sampleAtStation(road.samples, cut.s);
    const right = perpRight({ x: station.tx, z: station.tz });
    const heading = Math.atan2(station.tx, station.tz);
    const span = road.width + 3;
    for (const sign of [-1, 1]) {
      const post = new THREE.BoxGeometry(0.6, 7.2, 0.6);
      post.translate(station.x + right.x * sign * span * 0.5, station.y + 3.6, station.z + right.z * sign * span * 0.5);
      frames.push(post);
    }
    const beam = new THREE.BoxGeometry(span + 0.6, 0.9, 0.7);
    beam.rotateY(heading + Math.PI / 2);
    beam.translate(station.x, station.y + 6.9, station.z);
    frames.push(beam);
    for (const offset of [...road.laneOffsets.forward, ...road.laneOffsets.backward.map((value) => -value)]) {
      const camera = new THREE.BoxGeometry(0.5, 0.5, 0.9);
      camera.rotateY(heading);
      camera.translate(station.x + right.x * offset, station.y + 6.1, station.z + right.z * offset);
      frames.push(camera);
      const panel = new THREE.BoxGeometry(1.6, 1.0, 0.08);
      panel.rotateY(heading);
      panel.translate(station.x + right.x * offset, station.y + 5.4, station.z + right.z * offset);
      signs.push(panel);
    }
    const bar = new THREE.BoxGeometry(road.width - 1.5, 0.05, 0.6);
    bar.rotateY(heading + Math.PI / 2);
    bar.translate(station.x, station.y + 0.03, station.z);
    whiteMarkings.push(bar);
  }
  addMergedMesh("toll-gantries", frames, tollGantryMaterial, { renderOrder: 10, castShadow: true });
  addMergedMesh("toll-gantry-signs", signs, tollSignMaterial, { renderOrder: 10 });
}

function buildBusStops() {
  const posts: THREE.BufferGeometry[] = [];
  const roofs: THREE.BufferGeometry[] = [];
  const glass: THREE.BufferGeometry[] = [];
  const signs: THREE.BufferGeometry[] = [];
  for (const stop of roadSideSlots.busStops) {
    const forward = { x: Math.sin(stop.heading), z: Math.cos(stop.heading) };
    const outward = { x: -perpRight(forward).x, z: -perpRight(forward).z };
    const at = (along: number, out: number, lift: number): Vec3 => ({
      x: stop.x + forward.x * along + outward.x * out,
      y: stop.y + lift,
      z: stop.z + forward.z * along + outward.z * out,
    });
    for (const along of [-2.1, 2.1]) {
      for (const out of [-0.9, 0.9]) {
        const post = at(along, out, 0);
        postBox(post.x, post.y, post.z, 0.1, 2.6, posts);
      }
    }
    const roof = new THREE.BoxGeometry(4.6, 0.14, 2.2);
    roof.rotateY(stop.heading);
    const roofAt = at(0, 0, 2.62);
    roof.translate(roofAt.x, roofAt.y, roofAt.z);
    roofs.push(roof);
    const back = new THREE.BoxGeometry(4.4, 2.3, 0.05);
    back.rotateY(stop.heading);
    const backAt = at(0, 0.92, 1.4);
    back.translate(backAt.x, backAt.y, backAt.z);
    glass.push(back);
    for (const along of [-2.15, 2.15]) {
      const side = new THREE.BoxGeometry(0.05, 2.3, 1.8);
      side.rotateY(stop.heading);
      const sideAt = at(along, 0, 1.4);
      side.translate(sideAt.x, sideAt.y, sideAt.z);
      glass.push(side);
    }
    const bench = new THREE.BoxGeometry(3.2, 0.08, 0.45);
    bench.rotateY(stop.heading);
    const benchAt = at(0, 0.55, 0.5);
    bench.translate(benchAt.x, benchAt.y, benchAt.z);
    posts.push(bench);
    const pole = at(3.4, -0.6, 0);
    postBox(pole.x, pole.y, pole.z, 0.07, 3.0, posts);
    const flag = new THREE.BoxGeometry(0.06, 0.5, 0.5);
    flag.rotateY(stop.heading);
    flag.translate(pole.x, pole.y + 2.7, pole.z);
    signs.push(flag);
  }
  const attach = (name: string, parts: THREE.BufferGeometry[], material: THREE.Material, castShadow: boolean) => {
    const merged = mergeAll(parts);
    if (!merged) {
      return;
    }
    const mesh = new THREE.Mesh(merged, material);
    mesh.name = name;
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    roadFurnitureGroup.add(mesh);
  };
  attach("bus-stop-frames", posts, guardrailMaterial, true);
  attach("bus-stop-roofs", roofs, roadStructureConcreteMaterial, true);
  attach("bus-stop-glass", glass, shelterGlassMaterial, false);
  attach("bus-stop-flags", signs, signMaterials.stop, false);
}

function buildDestinations() {
  for (const junction of roadNetwork.junctions.values()) {
    if (junction.destination) {
      buildDestination(junction, junction.destination);
    }
  }
}

function otherRoadClearance(x: number, z: number, excludeRoadId: string) {
  let best = Number.POSITIVE_INFINITY;
  for (const road of roadNetwork.roads.values()) {
    if (road.spec.id === excludeRoadId) {
      continue;
    }
    for (const sample of road.samples) {
      const distance = Math.hypot(sample.x - x, sample.z - z) - road.halfWidth;
      if (distance < best) {
        best = distance;
      }
    }
  }
  return best;
}

function buildStructures() {
  const ring = roadNetwork.roads.get(RING_ROAD_ID);
  let bridgeStations: Station[] = [];
  if (ring) {
    const controlStations = ringControlStations(ring);
    const bridgeS0 = controlStations[RING_BRIDGE_CONTROLS.from];
    const bridgeS1 = controlStations[RING_BRIDGE_CONTROLS.to];
    bridgeStations = stationsBetween(ring.samples, bridgeS0, bridgeS1);
    addCableStayedBridgeStructure(
      "ring-river-cable-stayed-bridge",
      bridgeStations.map((station) => ({ x: station.x, y: station.y, z: station.z })),
    );
    const entry = sampleAtStation(ring.samples, controlStations[RING_TUNNEL_CONTROLS.from] + 2);
    const exit = sampleAtStation(ring.samples, controlStations[RING_TUNNEL_CONTROLS.to] - 2);
    addTunnelPortal("ring-tunnel-west-portal", { x: entry.x, y: entry.y, z: entry.z }, { x: -entry.tx, z: -entry.tz }, 0);
    addTunnelPortal("ring-tunnel-north-portal", { x: exit.x, y: exit.y, z: exit.z }, { x: exit.tx, z: exit.tz }, 0);
  }

  for (const road of roadNetwork.roads.values()) {
    for (const run of structureRuns(road)) {
      if (run.kind !== "viaduct" && run.kind !== "bridge") {
        continue;
      }
      const thickness = deckThickness(road, run.kind);
      const stations = stationsBetween(road.samples, run.s0, run.s1);
      if (road.spec.class === "highway" || road.spec.class === "ramp") {
        for (const sign of [-1, 1]) {
          const parapet = volumeFromStations(stations, sign * (road.halfWidth - 0.5), sign * road.halfWidth, 1.05, 1.05, false);
          barrierGeometries.push(parapet.top, parapet.side);
        }
      } else {
        for (const sign of [-1, 1]) {
          const kerb = volumeFromStations(stations, sign * (road.halfWidth + road.cls.sidewalkWidth), sign * (road.halfWidth + road.cls.sidewalkWidth + 0.3), 1.15, 1.15, false);
          barrierGeometries.push(kerb.top, kerb.side);
        }
      }
      const spacing = road.spec.class === "highway" ? 32 : 26;
      const isRingBridge = road.spec.id === RING_ROAD_ID && run.kind === "bridge";
      for (let s = run.s0 + spacing * 0.5; s < run.s1 - 6; s += spacing) {
        const station = sampleAtStation(road.samples, s);
        if (isRingBridge) {
          const bridgeProgress = (s - run.s0) / Math.max(run.s1 - run.s0, 1);
          if (bridgeProgress > 0.12 && bridgeProgress < 0.88) {
            continue;
          }
        }
        if (otherRoadClearance(station.x, station.z, road.spec.id) < 9) {
          continue;
        }
        const groundY = Math.min(fullTerrainSurfaceYAt({ x: station.x, z: station.z }), station.y - 4);
        const baseY = Math.min(groundY, SEA_Y + 1.5) - 1.5;
        const topY = station.y - thickness;
        const height = topY - baseY;
        if (height < 1.5) {
          continue;
        }
        const angle = Math.atan2(station.tx, station.tz);
        if (road.spec.class === "highway") {
          const column = new THREE.BoxGeometry(2.6, height - 1.5, 3.0);
          column.rotateY(angle);
          column.translate(station.x, baseY + (height - 1.5) * 0.5, station.z);
          const head = new THREE.BoxGeometry(road.width - 2.2, 1.5, 3.2);
          head.rotateY(angle);
          head.translate(station.x, topY - 0.75, station.z);
          pierGeometries.push(column, head);
        } else if (road.spec.class === "ramp") {
          const column = new THREE.CylinderGeometry(1.0, 1.1, height, 12);
          column.translate(station.x, baseY + height * 0.5, station.z);
          pierGeometries.push(column);
        } else {
          const right = perpRight({ x: station.tx, z: station.tz });
          const wallWidth = road.width + road.cls.sidewalkWidth * 2 - 1.2;
          const column = new THREE.BoxGeometry(wallWidth, height - 1.0, 2.2);
          column.rotateY(angle);
          column.translate(station.x, baseY + (height - 1.0) * 0.5, station.z);
          const head = new THREE.BoxGeometry(wallWidth + 0.6, 1.0, 2.6);
          head.rotateY(angle);
          head.translate(station.x + right.x * 0, topY - 0.5, station.z);
          pierGeometries.push(column, head);
        }
      }
    }
  }

  for (const road of roadNetwork.roads.values()) {
    if (road.spec.class !== "highway" && road.spec.class !== "ramp" && road.spec.class !== "mountain" && road.spec.class !== "rural") {
      continue;
    }
    for (const run of structureRuns(road)) {
      if (run.kind !== "ground") {
        continue;
      }
      const stations = stationsBetween(road.samples, run.s0, run.s1);
      for (const sign of [-1, 1]) {
        const offset = sign * (road.halfWidth + 0.55);
        const rail = volumeFromStations(stations, offset - 0.06, offset + 0.06, 0.78, 0.32, false);
        guardrailGeometries.push(rail.top, rail.side);
        for (let s = run.s0 + 2; s < run.s1 - 2; s += 4) {
          const station = sampleAtStation(road.samples, s);
          const right = perpRight({ x: station.tx, z: station.tz });
          const post = new THREE.BoxGeometry(0.14, 0.78, 0.14);
          post.translate(station.x + right.x * offset, station.y + 0.39, station.z + right.z * offset);
          guardrailGeometries.push(post);
        }
      }
    }
  }
}

function ringControlStations(ring: BuiltRoad) {
  const controls = ring.spec.via ?? [];
  const stations: number[] = [];
  for (const control of controls) {
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const sample of ring.samples) {
      const distance = Math.hypot(sample.x - control.x, sample.z - control.z);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = sample.s;
      }
    }
    stations.push(best);
  }
  return stations;
}

function addInstances(name: string, geometry: THREE.BufferGeometry, material: THREE.Material | THREE.Material[], placements: Placement[], castShadow = true) {
  if (placements.length === 0) {
    return;
  }
  const mesh = new THREE.InstancedMesh(geometry, material, placements.length);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);
  placements.forEach((placement, index) => {
    position.set(placement.x, placement.y, placement.z);
    quaternion.setFromAxisAngle(yAxis, placement.rotationY);
    scale.set(placement.scaleX ?? 1, placement.scaleY ?? 1, placement.scaleZ ?? 1);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  roadFurnitureGroup.add(mesh);
}

function createLampGeometry(height: number, armLength: number, doubleArm: boolean) {
  const parts: THREE.BufferGeometry[] = [];
  const pole = new THREE.CylinderGeometry(0.11, 0.17, height, 8);
  pole.translate(0, height * 0.5, 0);
  parts.push(pole);
  const arms = doubleArm ? [-1, 1] : [1];
  for (const sign of arms) {
    const arm = new THREE.CylinderGeometry(0.07, 0.09, armLength, 6);
    arm.rotateZ(Math.PI / 2);
    arm.translate((sign * armLength) / 2, height - 0.25, 0);
    parts.push(arm);
  }
  return mergeAll(parts) ?? pole;
}

function createLampHeadGeometry(armLength: number, doubleArm: boolean, height: number) {
  const parts: THREE.BufferGeometry[] = [];
  const arms = doubleArm ? [-1, 1] : [1];
  for (const sign of arms) {
    const head = new THREE.BoxGeometry(1.1, 0.22, 0.42);
    head.translate(sign * (armLength - 0.4), height - 0.28, 0);
    parts.push(head);
  }
  return mergeAll(parts) ?? parts[0];
}

function buildLamps() {
  const urbanPlacements: Placement[] = [];
  const highwayPlacements: Placement[] = [];
  for (const road of roadNetwork.roads.values()) {
    const spacing = road.cls.lightingSpacing;
    if (spacing <= 0) {
      continue;
    }
    const closed = Boolean(road.spec.closed);
    const s0 = closed ? 0 : road.startTrim;
    const s1 = closed ? road.samples[road.samples.length - 1].s : road.length - road.endTrim;
    let side = 1;
    for (let s = s0 + spacing * 0.5; s < s1 - 6; s += spacing) {
      const station = sampleAtStation(road.samples, s);
      const right = perpRight({ x: station.tx, z: station.tz });
      const heading = Math.atan2(station.tx, station.tz);
      if (road.spec.class === "highway") {
        if (station.y - fullTerrainSurfaceYAt({ x: station.x, z: station.z }) > 60) {
          continue;
        }
        highwayPlacements.push({ x: station.x, y: station.y + 0.9, z: station.z, rotationY: heading + Math.PI / 2 });
        roadSideSlots.lamps.push({ x: station.x, y: station.y, z: station.z });
        continue;
      }
      const offset = side * (road.halfWidth + Math.max(road.cls.sidewalkWidth * 0.5, 0.6));
      const x = station.x + right.x * offset;
      const z = station.z + right.z * offset;
      urbanPlacements.push({ x, y: station.y + 0.15, z, rotationY: heading + (side > 0 ? Math.PI / 2 : -Math.PI / 2) + Math.PI });
      roadSideSlots.lamps.push({ x, y: station.y, z });
      side *= -1;
    }
  }
  urbanPlacements.push(...destinationLampPlacements);
  addInstances("street-lamp-poles", createLampGeometry(8.5, 2.4, false), lampPoleMaterial, urbanPlacements);
  addInstances("street-lamp-heads", createLampHeadGeometry(2.4, false, 8.5), lampHeadMaterial, urbanPlacements, false);
  addInstances("highway-lamp-poles", createLampGeometry(12, 3.2, true), lampPoleMaterial, highwayPlacements);
  addInstances("highway-lamp-heads", createLampHeadGeometry(3.2, true, 12), lampHeadMaterial, highwayPlacements, false);
}

function approachRight(end: RoadEnd) {
  const right = perpRight(end.dir);
  return { x: -right.x, z: -right.z };
}

function buildTrafficSignals() {
  const poles: Placement[] = [];
  const arms: Placement[] = [];
  const heads: Placement[] = [];
  const redLenses: Placement[] = [];
  const greenLenses: Placement[] = [];
  const darkLenses: Placement[] = [];

  for (const junction of roadNetwork.junctions.values()) {
    if (junction.control !== "signal") {
      continue;
    }
    for (const end of junction.ends) {
      const road = roadNetwork.roads.get(end.roadId);
      if (!road) {
        continue;
      }
      const incomingOffsets = road.laneOffsets[end.atStart ? "backward" : "forward"];
      if (incomingOffsets.length === 0) {
        continue;
      }
      const right = approachRight(end);
      const back = end.dir;
      const poleX = end.cornerA.x + right.x * 1.1 + back.x * 1.2;
      const poleZ = end.cornerA.z + right.z * 1.1 + back.z * 1.2;
      const facing = Math.atan2(end.dir.x, end.dir.z);
      const armLength = incomingOffsets[incomingOffsets.length - 1] + road.cls.laneWidth * 0.5 + 1.1 + (end.halfWidth - (incomingOffsets[incomingOffsets.length - 1] + road.cls.laneWidth * 0.5));
      poles.push({ x: poleX, y: end.cornerA.y, z: poleZ, rotationY: facing });
      arms.push({ x: poleX, y: end.cornerA.y, z: poleZ, rotationY: facing, scaleX: armLength });
      const axisEastWest = Math.abs(end.dir.x) > Math.abs(end.dir.z);
      const lit = axisEastWest ? "red" : "green";
      for (const offset of incomingOffsets) {
        const distanceFromKerb = end.halfWidth - offset;
        const headX = poleX - right.x * distanceFromKerb;
        const headZ = poleZ - right.z * distanceFromKerb;
        heads.push({ x: headX, y: end.cornerA.y, z: headZ, rotationY: facing });
        const lensSet = [
          { color: "red", height: 6.2 },
          { color: "yellow", height: 5.85 },
          { color: "green", height: 5.5 },
        ];
        for (const lens of lensSet) {
          const placement = { x: headX + back.x * 0.22, y: end.cornerA.y + lens.height, z: headZ + back.z * 0.22, rotationY: facing };
          if (lens.color === lit) {
            (lit === "red" ? redLenses : greenLenses).push(placement);
          } else {
            darkLenses.push(placement);
          }
        }
      }
    }
  }

  const pole = new THREE.CylinderGeometry(0.14, 0.18, 7.2, 8);
  pole.translate(0, 3.6, 0);
  addInstances("signal-poles", pole, signalHeadMaterial, poles);
  const arm = new THREE.CylinderGeometry(0.09, 0.11, 1, 6);
  arm.rotateZ(Math.PI / 2);
  arm.translate(-0.5, 6.85, 0);
  addInstances("signal-arms", arm, signalHeadMaterial, arms);
  const head = new THREE.BoxGeometry(0.5, 1.3, 0.4);
  head.translate(0, 5.85, 0);
  addInstances("signal-heads", head, signalHeadMaterial, heads);
  const lens = new THREE.CylinderGeometry(0.17, 0.17, 0.08, 12);
  lens.rotateX(Math.PI / 2);
  addInstances("signal-lenses-red", lens, signalLensRedMaterial, redLenses, false);
  addInstances("signal-lenses-green", lens, signalLensGreenMaterial, greenLenses, false);
  addInstances("signal-lenses-dark", lens, signalLensDarkMaterial, darkLenses, false);
}

function buildSigns() {
  const stopSigns: Placement[] = [];
  const yieldSigns: Placement[] = [];
  const speed30: Placement[] = [];
  const speed50: Placement[] = [];
  const noEntry: Placement[] = [];
  const poles: Placement[] = [];

  const push = (list: Placement[], end: RoadEnd, back: number, roadY: number) => {
    const right = approachRight(end);
    const x = end.cornerA.x + right.x * 0.8 + end.dir.x * back;
    const z = end.cornerA.z + right.z * 0.8 + end.dir.z * back;
    const facing = Math.atan2(end.dir.x, end.dir.z);
    list.push({ x, y: roadY, z, rotationY: facing });
    poles.push({ x, y: roadY, z, rotationY: facing });
  };

  for (const junction of roadNetwork.junctions.values()) {
    if (junction.control !== "stop" || junction.ends.length < 3) {
      continue;
    }
    const maxRank = Math.max(...junction.ends.map((end) => CLASS_RANK[roadNetwork.roads.get(end.roadId)?.spec.class ?? "local"]));
    const allEqual = junction.ends.every((end) => CLASS_RANK[roadNetwork.roads.get(end.roadId)?.spec.class ?? "local"] === maxRank);
    for (const end of junction.ends) {
      const road = roadNetwork.roads.get(end.roadId);
      if (!road) {
        continue;
      }
      const incoming = road.laneOffsets[end.atStart ? "backward" : "forward"];
      if (incoming.length === 0) {
        continue;
      }
      if (allEqual || CLASS_RANK[road.spec.class] < maxRank) {
        push(stopSigns, end, 1.6, end.cornerA.y);
      }
    }
  }

  for (const roundabout of roadNetwork.roundabouts.values()) {
    for (const end of roundabout.ends) {
      const road = roadNetwork.roads.get(end.roadId);
      if (!road) {
        continue;
      }
      const incoming = road.laneOffsets[end.atStart ? "backward" : "forward"];
      if (incoming.length === 0) {
        continue;
      }
      push(yieldSigns, end, 2.2, end.cornerA.y);
    }
  }

  for (const junction of roadNetwork.junctions.values()) {
    for (const end of junction.ends) {
      const road = roadNetwork.roads.get(end.roadId);
      if (!road || road.length < 90) {
        continue;
      }
      const outgoing = road.laneOffsets[end.atStart ? "forward" : "backward"];
      const incoming = road.laneOffsets[end.atStart ? "backward" : "forward"];
      if (outgoing.length === 0 && incoming.length > 0) {
        const right = perpRight(end.dir);
        const x = end.endCenter.x + right.x * (end.halfWidth + 0.8) + end.dir.x * 6;
        const z = end.endCenter.z + right.z * (end.halfWidth + 0.8) + end.dir.z * 6;
        const facing = Math.atan2(-end.dir.x, -end.dir.z);
        noEntry.push({ x, y: end.endCenter.y, z, rotationY: facing });
        poles.push({ x, y: end.endCenter.y, z, rotationY: facing });
        continue;
      }
      if (outgoing.length === 0 || road.spec.class === "highway" || road.spec.class === "ramp") {
        continue;
      }
      const station = sampleAtStation(road.samples, end.atStart ? road.startTrim + 28 : road.length - road.endTrim - 28);
      const travel = end.atStart ? { x: station.tx, z: station.tz } : { x: -station.tx, z: -station.tz };
      const right = perpRight(travel);
      const offset = road.halfWidth + Math.max(road.cls.sidewalkWidth * 0.55, 0.9);
      const x = station.x + right.x * offset;
      const z = station.z + right.z * offset;
      const facing = Math.atan2(-travel.x, -travel.z);
      const list = road.cls.speedKph <= 30 ? speed30 : speed50;
      list.push({ x, y: station.y, z, rotationY: facing });
      poles.push({ x, y: station.y, z, rotationY: facing });
    }
  }

  const pole = new THREE.CylinderGeometry(0.05, 0.06, 2.6, 6);
  pole.translate(0, 1.3, 0);
  addInstances("sign-poles", pole, signPoleMaterial, poles, false);
  const face = new THREE.PlaneGeometry(0.8, 0.8);
  face.translate(0, 2.55, 0.05);
  addInstances("signs-stop", face, signMaterials.stop, stopSigns, false);
  addInstances("signs-yield", face, signMaterials.yield, yieldSigns, false);
  addInstances("signs-speed-30", face, signMaterials.speed30, speed30, false);
  addInstances("signs-speed-50", face, signMaterials.speed50, speed50, false);
  addInstances("signs-no-entry", face, signMaterials.noentry, noEntry, false);
}

export function addRoadNetworkMeshes() {
  buildSurfaces();
  buildEmbankments();
  buildRoadMarkings();
  buildSidewalksAndMedians();
  buildDestinations();
  buildStructures();
  buildTollGantries();

  addMergedMesh("road-surfaces", asphaltTops, highwayAsphaltMaterial, { renderOrder: 9 });
  addMergedMesh("road-surface-sides", asphaltSides, highwaySideMaterial, { renderOrder: 9, castShadow: true });
  addMergedMesh("road-concrete-aprons", concreteTops, roadStructureConcreteMaterial, { renderOrder: 9 });
  addMergedMesh("sidewalks", sidewalkTops, sidewalkMaterial, { renderOrder: 10 });
  addMergedMesh("kerbs", kerbSides, kerbMaterial, { renderOrder: 10 });
  addMergedMesh("planted-medians", medianTops, medianGrassMaterial, { renderOrder: 10 });
  addMergedMesh("roundabout-islands", grassTops, grassMaterial, { renderOrder: 10, castShadow: true });
  addMergedMesh("bus-lanes", busLaneGeometries, busLaneMaterial, { renderOrder: 10.5 });
  addMergedMesh("road-markings-white", whiteMarkings, roadMarkingWhiteMaterial, { renderOrder: 11 });
  addMergedMesh("road-markings-yellow", yellowMarkings, roadMarkingYellowMaterial, { renderOrder: 11 });
  addMergedMesh("road-barriers", barrierGeometries, roadStructureConcreteMaterial, { renderOrder: 10, castShadow: true });
  addMergedMesh("road-guardrails", guardrailGeometries, guardrailMaterial, { renderOrder: 10, castShadow: true });
  addMergedMesh("road-piers", pierGeometries, pierConcreteMaterial, { renderOrder: 8, castShadow: true });
  addMergedMesh("road-embankments", embankmentGeometries, embankmentMaterial, { renderOrder: 8 });
  addMergedMesh("yard-fences", fenceGeometries, fenceMeshMaterial, { renderOrder: 12 });
  addMergedMesh("shelter-glass", glassGeometries, shelterGlassMaterial, { renderOrder: 12 });
  addMergedMesh("barrier-arms", barrierArmGeometries, barrierArmMaterial, { renderOrder: 10, castShadow: true });

  buildLamps();
  buildTrafficSignals();
  buildSigns();
  buildBusStops();
  addLaneOverlay();
}

function addLaneOverlay() {
  const positions: number[] = [];
  const colors: number[] = [];
  const color = new THREE.Color();
  const arrowPlacements: Array<{ x: number; y: number; z: number; tx: number; tz: number; kind: Lane["kind"] }> = [];

  for (const lane of roadNetwork.lanes.values()) {
    color.setHex(LANE_OVERLAY_COLORS[lane.kind]);
    for (let index = 1; index < lane.points.length; index += 1) {
      const a = lane.points[index - 1];
      const b = lane.points[index];
      positions.push(a.x, a.y + 0.9, a.z, b.x, b.y + 0.9, b.z);
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    }
    const middle = Math.floor(lane.points.length / 2);
    const spacing = lane.kind === "road" ? 40 : Number.POSITIVE_INFINITY;
    let travelled = 0;
    for (let index = 1; index < lane.points.length; index += 1) {
      const p = lane.points[index - 1];
      const q = lane.points[index];
      const segment = Math.hypot(q.x - p.x, q.z - p.z);
      travelled += segment;
      if (travelled >= spacing || (index === middle && lane.kind !== "road")) {
        travelled = 0;
        arrowPlacements.push({ x: q.x, y: q.y + 0.9, z: q.z, tx: (q.x - p.x) / (segment || 1), tz: (q.z - p.z) / (segment || 1), kind: lane.kind });
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const lines = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ vertexColors: true, depthTest: false, transparent: true, opacity: 0.95 }),
  );
  lines.name = "lane-overlay-lines";
  lines.renderOrder = 40;
  laneOverlayGroup.add(lines);

  const arrowGeometry = new THREE.ConeGeometry(0.9, 2.6, 6);
  arrowGeometry.rotateX(Math.PI / 2);
  const arrows = new THREE.InstancedMesh(
    arrowGeometry,
    new THREE.MeshBasicMaterial({ depthTest: false, transparent: true, opacity: 0.95 }),
    arrowPlacements.length,
  );
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const forward = new THREE.Vector3(0, 0, 1);
  const direction = new THREE.Vector3();
  arrowPlacements.forEach((placement, index) => {
    position.set(placement.x, placement.y, placement.z);
    direction.set(placement.tx, 0, placement.tz).normalize();
    quaternion.setFromUnitVectors(forward, direction);
    matrix.compose(position, quaternion, scale);
    arrows.setMatrixAt(index, matrix);
    arrows.setColorAt(index, color.setHex(LANE_OVERLAY_COLORS[placement.kind]));
  });
  arrows.instanceMatrix.needsUpdate = true;
  arrows.name = "lane-overlay-arrows";
  arrows.renderOrder = 41;
  laneOverlayGroup.add(arrows);
}

export function clearRouteHighlight() {
  const existing = routeHighlightGroup.getObjectByName("route-highlight-strip");
  if (existing) {
    routeHighlightGroup.remove(existing);
  }
}

export function addRouteHighlight(points: Vec3[]) {
  clearRouteHighlight();
  if (points.length < 2) {
    return;
  }
  const stations = polylineStations(points);
  const geometry = stripFromStations(stations, -1.3, 1.3, 1.2);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: 0xff2fb0, depthTest: false, transparent: true, opacity: 0.92, side: THREE.DoubleSide }),
  );
  mesh.name = "route-highlight-strip";
  mesh.renderOrder = 42;
  routeHighlightGroup.add(mesh);
}

export function roadSurfaceYAt(x: number, z: number) {
  let best: { distance: number; y: number } | undefined;
  for (const road of roadNetwork.roads.values()) {
    for (const sample of road.samples) {
      const distance = Math.hypot(sample.x - x, sample.z - z);
      if (!best || distance < best.distance) {
        best = { distance, y: sample.y };
      }
    }
  }
  return best?.y ?? fullTerrainSurfaceYAt({ x, z });
}

export function debugBoxBetween(a: Vec3, b: Vec3) {
  return boxBetween(a, b, 0.5, 0.5);
}
