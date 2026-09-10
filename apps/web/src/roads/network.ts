import * as THREE from "three";
import { ROAD_CLASSES, roadTotalWidth, type RoadClass, type RoadClassSpec } from "./classes";

export interface Vec2 {
  x: number;
  z: number;
}

export interface Vec3 extends Vec2 {
  y: number;
}

export type JunctionControl = "signal" | "stop" | "yield" | "priority" | "none";
export type LaneDirection = "forward" | "backward";
export type LaneKind = "road" | "connector" | "ring" | "ramp";
export type TurnKind = "straight" | "left" | "right" | "uturn" | "merge" | "diverge" | "circulate" | "enter" | "exit";
export type StructureKind = "ground" | "viaduct" | "bridge" | "tunnel";

export type DestinationKind = "parking" | "yard" | "forecourt" | "viewpoint" | "culdesac";

export interface DestinationSpec {
  kind: DestinationKind;
  width: number;
  depth: number;
  name?: string;
}

export interface NodeSpec {
  id: string;
  x: number;
  z: number;
  y?: number;
  control?: JunctionControl;
  roundabout?: { radius: number };
  turnaround?: boolean;
  destination?: DestinationSpec;
  edge?: boolean;
  name?: string;
}

export interface StructureSpec {
  kind: "tunnel" | "bridge";
  fromControl: number;
  toControl: number;
}

export interface RoadSpec {
  id: string;
  name?: string;
  class: RoadClass;
  forward: number;
  backward: number;
  from?: string;
  to?: string;
  via?: Array<Vec2 & { y?: number }>;
  closed?: boolean;
  elevation?: "terrain" | "control";
  cuts?: string[];
  structures?: StructureSpec[];
  tension?: number;
  spacing?: number;
  attachFrom?: { roadId: string; direction: LaneDirection };
  attachTo?: { roadId: string; direction: LaneDirection };
  parkingLane?: boolean;
}

export interface NetworkSpec {
  nodes: NodeSpec[];
  roads: RoadSpec[];
}

export interface RoadSample extends Vec3 {
  s: number;
  tx: number;
  tz: number;
  terrainY: number;
  structure: StructureKind;
}

export interface Lane {
  id: string;
  kind: LaneKind;
  roadId?: string;
  nodeId?: string;
  direction?: LaneDirection;
  laneIndex?: number;
  turn?: TurnKind;
  fromNode: string;
  toNode: string;
  points: Vec3[];
  length: number;
  width: number;
  speedKph: number;
  next: string[];
  prev: string[];
  adjacent: string[];
}

export interface RoadEnd {
  roadId: string;
  atStart: boolean;
  dir: Vec2;
  angle: number;
  halfWidth: number;
  trim: number;
  cornerRadius: number;
  endCenter: Vec3;
  cornerA: Vec3;
  cornerB: Vec3;
}

export interface JunctionCorner {
  fromRoadId: string;
  toRoadId: string;
  points: Vec3[];
}

export interface BuiltDestination {
  spec: DestinationSpec;
  origin: Vec3;
  axis: Vec2;
  right: Vec2;
  entryHalfWidth: number;
}

export interface BuiltJunction {
  nodeId: string;
  center: Vec3;
  control: JunctionControl;
  ends: RoadEnd[];
  pad: Vec3[];
  corners: JunctionCorner[];
  hasSidewalks: boolean;
  destination?: BuiltDestination;
}

export interface BuiltRoundabout {
  nodeId: string;
  center: Vec3;
  ringRadius: number;
  ringWidth: number;
  apronWidth: number;
  ends: RoadEnd[];
  approaches: Array<{ roadId: string; entryAngle: number; exitAngle: number; pad: Vec3[] }>;
}

export interface BuiltRoad {
  spec: RoadSpec;
  cls: RoadClassSpec;
  width: number;
  halfWidth: number;
  median: number;
  samples: RoadSample[];
  length: number;
  startTrim: number;
  endTrim: number;
  cutStations: Array<{ nodeId: string; s: number }>;
  laneOffsets: { forward: number[]; backward: number[] };
  markingGaps: Array<{ s0: number; s1: number; side: "left" | "right" }>;
}

export interface BuiltNode {
  spec: NodeSpec;
  position: Vec3;
  roadIds: string[];
  isCut: boolean;
}

export interface RoadNetwork {
  nodes: Map<string, BuiltNode>;
  roads: Map<string, BuiltRoad>;
  lanes: Map<string, Lane>;
  junctions: Map<string, BuiltJunction>;
  roundabouts: Map<string, BuiltRoundabout>;
}

export interface BuildOptions {
  terrainY: (x: number, z: number) => number;
  roadLift?: number;
}

const DEFAULT_SPACING = 5;
const CONNECTOR_SAMPLES = 12;
const RING_LANE_WIDTH = 6.4;
const RING_APRON_WIDTH = 2.2;

export function perpRight(dir: Vec2): Vec2 {
  return { x: -dir.z, z: dir.x };
}

function normalize(v: Vec2): Vec2 {
  const length = Math.hypot(v.x, v.z) || 1;
  return { x: v.x / length, z: v.z / length };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function polylineLength(points: Vec3[]) {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += Math.hypot(
      points[index].x - points[index - 1].x,
      points[index].y - points[index - 1].y,
      points[index].z - points[index - 1].z,
    );
  }
  return total;
}

function cubicBezier(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, samples: number): Vec3[] {
  const points: Vec3[] = [];
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    const mt = 1 - t;
    const a = mt * mt * mt;
    const b = 3 * mt * mt * t;
    const c = 3 * mt * t * t;
    const d = t * t * t;
    points.push({
      x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
      y: lerp(p0.y, p3.y, t * t * (3 - 2 * t)),
      z: a * p0.z + b * p1.z + c * p2.z + d * p3.z,
    });
  }
  return points;
}

function smoothProfile(values: number[], spacing: number, radiusM: number, passes: number) {
  const window = Math.max(1, Math.round(radiusM / spacing));
  let current = values.slice();
  for (let pass = 0; pass < passes; pass += 1) {
    const next = current.slice();
    for (let index = 0; index < current.length; index += 1) {
      let sum = 0;
      let count = 0;
      for (let offset = -window; offset <= window; offset += 1) {
        const sampleIndex = index + offset;
        if (sampleIndex < 0 || sampleIndex >= current.length) {
          continue;
        }
        sum += current[sampleIndex];
        count += 1;
      }
      next[index] = sum / count;
    }
    current = next;
  }
  return current;
}

function limitGrade(values: number[], spacing: number, maxGrade: number) {
  const result = values.slice();
  for (let index = 1; index < result.length; index += 1) {
    const maxRise = maxGrade * spacing;
    result[index] = Math.min(result[index], result[index - 1] + maxRise);
  }
  for (let index = result.length - 2; index >= 0; index -= 1) {
    const maxRise = maxGrade * spacing;
    result[index] = Math.min(result[index], result[index + 1] + maxRise);
  }
  return result;
}

export function sampleAtStation(samples: RoadSample[], s: number): Vec3 & { tx: number; tz: number; structure: StructureKind } {
  if (samples.length === 0) {
    throw new Error("Cannot sample an empty road.");
  }
  if (s <= samples[0].s) {
    const first = samples[0];
    return { x: first.x, y: first.y, z: first.z, tx: first.tx, tz: first.tz, structure: first.structure };
  }
  const last = samples[samples.length - 1];
  if (s >= last.s) {
    return { x: last.x, y: last.y, z: last.z, tx: last.tx, tz: last.tz, structure: last.structure };
  }
  let low = 0;
  let high = samples.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (samples[middle].s <= s) {
      low = middle;
    } else {
      high = middle;
    }
  }
  const a = samples[low];
  const b = samples[high];
  const t = (s - a.s) / Math.max(b.s - a.s, 0.0001);
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
    tx: lerp(a.tx, b.tx, t),
    tz: lerp(a.tz, b.tz, t),
    structure: t < 0.5 ? a.structure : b.structure,
  };
}

export function sliceSamples(samples: RoadSample[], s0: number, s1: number): Vec3[] {
  const start = sampleAtStation(samples, s0);
  const end = sampleAtStation(samples, s1);
  const points: Vec3[] = [{ x: start.x, y: start.y, z: start.z }];
  for (const sample of samples) {
    if (sample.s > s0 + 0.01 && sample.s < s1 - 0.01) {
      points.push({ x: sample.x, y: sample.y, z: sample.z });
    }
  }
  points.push({ x: end.x, y: end.y, z: end.z });
  return points;
}

export function offsetSamples(samples: RoadSample[], s0: number, s1: number, offset: number): Vec3[] {
  const start = sampleAtStation(samples, s0);
  const end = sampleAtStation(samples, s1);
  const points: Vec3[] = [];
  const push = (sample: Vec3 & { tx: number; tz: number }) => {
    const right = perpRight({ x: sample.tx, z: sample.tz });
    points.push({ x: sample.x + right.x * offset, y: sample.y, z: sample.z + right.z * offset });
  };
  push(start);
  for (const sample of samples) {
    if (sample.s > s0 + 0.01 && sample.s < s1 - 0.01) {
      push(sample);
    }
  }
  push(end);
  return points;
}

export class NetworkBuilder {
  private readonly nodes = new Map<string, BuiltNode>();
  private readonly roads = new Map<string, BuiltRoad>();
  private readonly lanes = new Map<string, Lane>();
  private readonly junctions = new Map<string, BuiltJunction>();
  private readonly roundabouts = new Map<string, BuiltRoundabout>();
  private readonly roadLanePieces = new Map<string, { forward: Lane[][]; backward: Lane[][] }>();
  private readonly terrainY: (x: number, z: number) => number;
  private readonly roadLift: number;

  constructor(private readonly spec: NetworkSpec, options: BuildOptions) {
    this.terrainY = options.terrainY;
    this.roadLift = options.roadLift ?? 0.05;
  }

  build(): RoadNetwork {
    for (const node of this.spec.nodes) {
      const y = node.y ?? this.terrainY(node.x, node.z) + this.roadLift;
      this.nodes.set(node.id, { spec: node, position: { x: node.x, y, z: node.z }, roadIds: [], isCut: false });
    }

    const { plain, attached } = this.orderRoads();
    for (const road of plain) {
      this.buildRoadCenterline(road);
    }
    for (const road of plain) {
      this.applyCuts(road);
    }
    for (const road of attached) {
      this.buildRoadCenterline(road);
    }
    this.computeTrims();
    for (const road of [...plain, ...attached]) {
      this.buildRoadLanes(road);
    }
    for (const node of this.nodes.values()) {
      this.connectNode(node);
    }
    this.finalizeLinks();

    return {
      nodes: this.nodes,
      roads: this.roads,
      lanes: this.lanes,
      junctions: this.junctions,
      roundabouts: this.roundabouts,
    };
  }

  private orderRoads() {
    const attached = this.spec.roads.filter((road) => road.attachFrom || road.attachTo);
    const plain = this.spec.roads.filter((road) => !road.attachFrom && !road.attachTo);
    return { plain, attached };
  }

  private nodeOf(id: string) {
    const node = this.nodes.get(id);
    if (!node) {
      throw new Error(`Unknown node "${id}".`);
    }
    return node;
  }

  private outerLaneFrame(roadId: string, direction: LaneDirection, nodeId: string) {
    const road = this.roads.get(roadId);
    if (!road) {
      throw new Error(`Ramp attaches to unknown road "${roadId}".`);
    }
    const cut = road.cutStations.find((station) => station.nodeId === nodeId);
    if (!cut) {
      throw new Error(`Road "${roadId}" has no cut at node "${nodeId}".`);
    }
    const offsets = road.laneOffsets[direction];
    const laneOffset = offsets[offsets.length - 1];
    const base = sampleAtStation(road.samples, cut.s);
    const travel = direction === "forward" ? { x: base.tx, z: base.tz } : { x: -base.tx, z: -base.tz };
    const right = perpRight(travel);
    const signedOffset = direction === "forward" ? laneOffset : -laneOffset;
    const rightOfCenter = perpRight({ x: base.tx, z: base.tz });
    return {
      point: {
        x: base.x + rightOfCenter.x * signedOffset,
        y: base.y,
        z: base.z + rightOfCenter.z * signedOffset,
      },
      travel,
      right,
      laneWidth: road.cls.laneWidth,
      shoulder: road.cls.outerShoulder,
    };
  }

  private buildRoadCenterline(spec: RoadSpec) {
    const cls = ROAD_CLASSES[spec.class];
    const controls: Array<Vec2 & { y?: number }> = [];
    let elevationMode = spec.elevation ?? "terrain";

    if (spec.attachFrom) {
      const frame = this.outerLaneFrame(spec.attachFrom.roadId, spec.attachFrom.direction, spec.from ?? "");
      controls.push({ x: frame.point.x, z: frame.point.z, y: frame.point.y });
      controls.push({
        x: frame.point.x + frame.travel.x * 34 + frame.right.x * (frame.laneWidth * 0.55),
        z: frame.point.z + frame.travel.z * 34 + frame.right.z * (frame.laneWidth * 0.55),
        y: frame.point.y - 0.15,
      });
      controls.push({
        x: frame.point.x + frame.travel.x * 80 + frame.right.x * (frame.laneWidth * 1.9),
        z: frame.point.z + frame.travel.z * 80 + frame.right.z * (frame.laneWidth * 1.9),
      });
      elevationMode = "control";
    } else if (spec.from) {
      const from = this.nodeOf(spec.from);
      controls.push({ x: from.position.x, z: from.position.z, y: from.position.y });
    }

    for (const via of spec.via ?? []) {
      controls.push(via);
    }

    if (spec.attachTo) {
      const frame = this.outerLaneFrame(spec.attachTo.roadId, spec.attachTo.direction, spec.to ?? "");
      controls.push({
        x: frame.point.x - frame.travel.x * 80 + frame.right.x * (frame.laneWidth * 1.9),
        z: frame.point.z - frame.travel.z * 80 + frame.right.z * (frame.laneWidth * 1.9),
      });
      controls.push({
        x: frame.point.x - frame.travel.x * 34 + frame.right.x * (frame.laneWidth * 0.55),
        z: frame.point.z - frame.travel.z * 34 + frame.right.z * (frame.laneWidth * 0.55),
        y: frame.point.y - 0.15,
      });
      controls.push({ x: frame.point.x, z: frame.point.z, y: frame.point.y });
      elevationMode = "control";
    } else if (spec.to) {
      const to = this.nodeOf(spec.to);
      controls.push({ x: to.position.x, z: to.position.z, y: to.position.y });
    }

    const spacing = spec.spacing ?? DEFAULT_SPACING;
    const closed = Boolean(spec.closed);
    const curve = new THREE.CatmullRomCurve3(
      controls.map((point) => new THREE.Vector3(point.x, 0, point.z)),
      closed,
      "centripetal",
      spec.tension ?? 0.35,
    );
    const approxLength = curve.getLength();
    const sampleCount = Math.max(8, Math.ceil(approxLength / spacing));
    const spaced = curve.getSpacedPoints(sampleCount);
    if (closed) {
      spaced.pop();
    }

    const controlStations = this.controlStations(curve, controls.length, closed);
    const samples: RoadSample[] = [];
    let cumulative = 0;
    for (let index = 0; index < spaced.length; index += 1) {
      const point = spaced[index];
      if (index > 0) {
        cumulative += point.distanceTo(spaced[index - 1]);
      }
      samples.push({
        x: point.x,
        y: 0,
        z: point.z,
        s: cumulative,
        tx: 0,
        tz: 0,
        terrainY: this.terrainY(point.x, point.z),
        structure: "ground",
      });
    }
    const totalLength = closed
      ? cumulative + spaced[spaced.length - 1].distanceTo(spaced[0])
      : cumulative;

    for (let index = 0; index < samples.length; index += 1) {
      const previous = samples[index === 0 ? (closed ? samples.length - 1 : 0) : index - 1];
      const next = samples[index === samples.length - 1 ? (closed ? 0 : samples.length - 1) : index + 1];
      const tangent = normalize({ x: next.x - previous.x, z: next.z - previous.z });
      samples[index].tx = tangent.x;
      samples[index].tz = tangent.z;
    }

    const stationOf = (controlIndex: number) => controlStations[Math.min(controlIndex, controlStations.length - 1)];
    for (const structure of spec.structures ?? []) {
      const s0 = stationOf(structure.fromControl);
      const s1 = stationOf(structure.toControl);
      for (const sample of samples) {
        if (sample.s >= s0 - 0.01 && sample.s <= s1 + 0.01) {
          sample.structure = structure.kind;
        }
      }
    }

    if (elevationMode === "control") {
      const knownIndices = controls.map((point, index) => (point.y !== undefined ? index : -1)).filter((index) => index >= 0);
      const knownStations = knownIndices.map((index) => controlStations[index]);
      const knownValues = knownIndices.map((index) => controls[index].y as number);
      if (knownValues.length === 0) {
        throw new Error(`Road "${spec.id}" uses control elevation without any known heights.`);
      }
      const spline = new THREE.CatmullRomCurve3(
        knownIndices.map((index) => new THREE.Vector3(controlStations[index], controls[index].y as number, 0)),
        false,
        "catmullrom",
        0.5,
      );
      const profile = samples.map((sample) => {
        if (knownValues.length === 1) {
          return knownValues[0];
        }
        const s = closed ? sample.s : Math.min(Math.max(sample.s, knownStations[0]), knownStations[knownStations.length - 1]);
        const t = (s - knownStations[0]) / Math.max(knownStations[knownStations.length - 1] - knownStations[0], 0.0001);
        if (closed) {
          return this.closedProfile(sample.s, knownStations, knownValues, totalLength);
        }
        return spline.getPoint(Math.min(Math.max(t, 0), 1)).y;
      });
      samples.forEach((sample, index) => {
        sample.y = profile[index];
      });
    } else {
      let profile = samples.map((sample) => sample.terrainY + this.roadLift);
      profile = smoothProfile(profile, spacing, 22, 2);
      profile = limitGrade(profile, spacing, 0.13);
      const endpointBlend = (index: number, target: number | undefined) => {
        if (target === undefined) {
          return;
        }
        const reach = Math.min(samples.length - 1, Math.round(70 / spacing));
        for (let offset = 0; offset <= reach; offset += 1) {
          const sampleIndex = index === 0 ? offset : samples.length - 1 - offset;
          const weight = 1 - offset / (reach + 1);
          profile[sampleIndex] = lerp(profile[sampleIndex], target, weight);
        }
      };
      if (!closed) {
        endpointBlend(0, spec.from ? this.nodeOf(spec.from).position.y : undefined);
        endpointBlend(samples.length - 1, spec.to ? this.nodeOf(spec.to).position.y : undefined);
      }
      samples.forEach((sample, index) => {
        sample.y = profile[index];
      });
    }

    for (const sample of samples) {
      if (sample.structure === "ground" && sample.y - sample.terrainY > 2.4) {
        sample.structure = "viaduct";
      }
    }

    const forward = spec.forward;
    const backward = spec.backward;
    const width = roadTotalWidth(cls, forward, backward) + (spec.parkingLane ? 2.2 * 2 : 0);
    const median = forward > 0 && backward > 0 ? cls.medianWidth : 0;
    const innerShoulder = median > 0 ? cls.innerShoulder : 0;
    const laneOffsets = {
      forward: Array.from({ length: forward }, (_, index) =>
        median * 0.5 + innerShoulder + cls.laneWidth * (index + 0.5) + (backward === 0 ? -(forward * cls.laneWidth) * 0.5 : 0),
      ),
      backward: Array.from({ length: backward }, (_, index) =>
        median * 0.5 + innerShoulder + cls.laneWidth * (index + 0.5) + (forward === 0 ? -(backward * cls.laneWidth) * 0.5 : 0),
      ),
    };

    const built: BuiltRoad = {
      spec,
      cls,
      width,
      halfWidth: width * 0.5,
      median,
      samples,
      length: totalLength,
      startTrim: 0,
      endTrim: 0,
      cutStations: [],
      laneOffsets,
      markingGaps: [],
    };
    this.roads.set(spec.id, built);

    if (spec.from) {
      this.nodeOf(spec.from).roadIds.push(spec.id);
    }
    if (spec.to) {
      this.nodeOf(spec.to).roadIds.push(spec.id);
    }
  }

  private closedProfile(s: number, stations: number[], values: number[], totalLength: number) {
    const count = stations.length;
    for (let index = 0; index < count; index += 1) {
      const s0 = stations[index];
      const s1 = index + 1 < count ? stations[index + 1] : stations[0] + totalLength;
      let local = s;
      if (local < s0) {
        local += totalLength;
      }
      if (local >= s0 && local <= s1) {
        const t = (local - s0) / Math.max(s1 - s0, 0.0001);
        const eased = t * t * (3 - 2 * t);
        return lerp(values[index], values[(index + 1) % count], eased);
      }
    }
    return values[0];
  }

  private controlStations(curve: THREE.CatmullRomCurve3, controlCount: number, closed: boolean) {
    const stations: number[] = [];
    const divisions = closed ? controlCount : controlCount - 1;
    const resolution = 4000;
    const lengths = curve.getLengths(resolution);
    for (let index = 0; index < controlCount; index += 1) {
      const t = index / divisions;
      stations.push(lengths[Math.min(resolution, Math.round(t * resolution))]);
    }
    return stations;
  }

  private applyCuts(spec: RoadSpec) {
    const road = this.roads.get(spec.id);
    if (!road) {
      return;
    }
    for (const nodeId of spec.cuts ?? []) {
      const node = this.nodeOf(nodeId);
      let best = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      road.samples.forEach((sample, index) => {
        const distance = Math.hypot(sample.x - node.position.x, sample.z - node.position.z);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });
      const sample = road.samples[best];
      node.position = { x: sample.x, y: sample.y, z: sample.z };
      node.isCut = true;
      node.roadIds.push(spec.id);
      road.cutStations.push({ nodeId, s: sample.s });
      road.markingGaps.push({ s0: sample.s - 70, s1: sample.s + 70, side: "right" });
    }
    road.cutStations.sort((a, b) => a.s - b.s);
  }

  private roadEndsAt(nodeId: string): Array<{ road: BuiltRoad; atStart: boolean }> {
    const result: Array<{ road: BuiltRoad; atStart: boolean }> = [];
    for (const road of this.roads.values()) {
      if (road.spec.from === nodeId && !road.spec.attachFrom) {
        result.push({ road, atStart: true });
      }
      if (road.spec.to === nodeId && !road.spec.attachTo) {
        result.push({ road, atStart: false });
      }
    }
    return result;
  }

  private endDirection(road: BuiltRoad, atStart: boolean): Vec2 {
    const samples = road.samples;
    const reference = atStart ? sampleAtStation(samples, Math.min(18, road.length * 0.3)) : sampleAtStation(samples, Math.max(road.length - 18, road.length * 0.7));
    const anchor = atStart ? samples[0] : samples[samples.length - 1];
    const dir = normalize({ x: reference.x - anchor.x, z: reference.z - anchor.z });
    return dir;
  }

  private computeTrims() {
    for (const node of this.nodes.values()) {
      if (node.isCut) {
        continue;
      }
      const ends = this.roadEndsAt(node.spec.id);
      if (ends.length === 0) {
        continue;
      }
      if (node.spec.roundabout) {
        const ringOuter = node.spec.roundabout.radius + RING_LANE_WIDTH * 0.5;
        for (const end of ends) {
          const trim = ringOuter + 9;
          if (end.atStart) {
            end.road.startTrim = trim;
          } else {
            end.road.endTrim = trim;
          }
        }
        continue;
      }
      const dirs = ends.map((end) => this.endDirection(end.road, end.atStart));
      ends.forEach((end, index) => {
        let trim = end.road.cls.cornerRadius * 0.5;
        ends.forEach((other, otherIndex) => {
          if (otherIndex === index) {
            return;
          }
          const dot = dirs[index].x * dirs[otherIndex].x + dirs[index].z * dirs[otherIndex].z;
          const angle = Math.acos(Math.min(1, Math.max(-1, dot)));
          const tangentHalf = Math.tan(Math.max(angle * 0.5, 0.2));
          const needed = other.road.halfWidth / tangentHalf + Math.max(end.road.cls.cornerRadius, other.road.cls.cornerRadius) * 0.9;
          trim = Math.max(trim, needed);
        });
        if (ends.length === 1) {
          const destination = node.spec.destination;
          trim = destination && destination.kind !== "culdesac" ? 6 : node.spec.turnaround ? end.road.cls.cornerRadius * 1.4 : 0;
        }
        trim = Math.min(trim, Math.max(end.road.length * 0.42, 1));
        if (end.atStart) {
          end.road.startTrim = trim;
        } else {
          end.road.endTrim = trim;
        }
      });
    }
  }

  private buildRoadLanes(spec: RoadSpec) {
    const road = this.roads.get(spec.id);
    if (!road) {
      return;
    }
    const closed = Boolean(spec.closed);
    const stations: Array<{ nodeId: string; s: number }> = [];
    if (!closed) {
      stations.push({ nodeId: spec.from ?? `${spec.id}:start`, s: road.startTrim });
    }
    for (const cut of road.cutStations) {
      stations.push(cut);
    }
    if (!closed) {
      stations.push({ nodeId: spec.to ?? `${spec.id}:end`, s: road.length - road.endTrim });
    }
    if (closed && stations.length === 0) {
      stations.push({ nodeId: `${spec.id}:loop`, s: 0 });
    }

    const pieces = { forward: [] as Lane[][], backward: [] as Lane[][] };
    const laneKind: LaneKind = spec.class === "ramp" ? "ramp" : "road";
    const pieceCount = closed ? stations.length : stations.length - 1;

    for (const direction of ["forward", "backward"] as const) {
      const offsets = road.laneOffsets[direction];
      const perLane: Lane[][] = offsets.map(() => []);
      offsets.forEach((offset, laneIndex) => {
        const signedOffset = direction === "forward" ? offset : -offset;
        for (let pieceIndex = 0; pieceIndex < pieceCount; pieceIndex += 1) {
          const start = stations[pieceIndex];
          const end = stations[(pieceIndex + 1) % stations.length];
          let points: Vec3[];
          if (closed && stations.length === 1) {
            points = offsetSamples(road.samples, 0, road.length, signedOffset);
            const first = points[0];
            points.push({ ...first });
          } else if (closed && end.s <= start.s) {
            points = [
              ...offsetSamples(road.samples, start.s, road.samples[road.samples.length - 1].s, signedOffset),
              ...offsetSamples(road.samples, 0, end.s, signedOffset).slice(1),
            ];
          } else {
            points = offsetSamples(road.samples, start.s, end.s, signedOffset);
          }
          if (direction === "backward") {
            points = points.slice().reverse();
          }
          const fromNode = direction === "forward" ? start.nodeId : end.nodeId;
          const toNode = direction === "forward" ? end.nodeId : start.nodeId;
          const lane: Lane = {
            id: `${spec.id}:${direction}:${laneIndex}${pieceCount > 1 ? `:${pieceIndex}` : ""}`,
            kind: laneKind,
            roadId: spec.id,
            direction,
            laneIndex,
            fromNode,
            toNode,
            points,
            length: polylineLength(points),
            width: road.cls.laneWidth,
            speedKph: road.cls.speedKph,
            next: [],
            prev: [],
            adjacent: [],
          };
          this.lanes.set(lane.id, lane);
          perLane[laneIndex].push(lane);
        }
      });
      for (let laneIndex = 1; laneIndex < perLane.length; laneIndex += 1) {
        perLane[laneIndex].forEach((lane, pieceIndex) => {
          const neighbour = perLane[laneIndex - 1][pieceIndex];
          if (neighbour) {
            lane.adjacent.push(neighbour.id);
            neighbour.adjacent.push(lane.id);
          }
        });
      }
      pieces[direction] = perLane;
    }
    this.roadLanePieces.set(spec.id, pieces);

    if (closed && stations.length === 1) {
      for (const direction of ["forward", "backward"] as const) {
        for (const laneList of pieces[direction]) {
          for (const lane of laneList) {
            lane.next.push(lane.id);
          }
        }
      }
    }
  }

  private lanesEndingAt(nodeId: string) {
    return [...this.lanes.values()].filter((lane) => lane.toNode === nodeId && lane.kind !== "connector");
  }

  private lanesStartingAt(nodeId: string) {
    return [...this.lanes.values()].filter((lane) => lane.fromNode === nodeId && lane.kind !== "connector");
  }

  private link(from: Lane, to: Lane) {
    if (!from.next.includes(to.id)) {
      from.next.push(to.id);
    }
    if (!to.prev.includes(from.id)) {
      to.prev.push(from.id);
    }
  }

  private addConnector(nodeId: string, from: Lane, to: Lane, turn: TurnKind, tightness = 0.38) {
    const p0 = from.points[from.points.length - 1];
    const p3 = to.points[0];
    const before = from.points[Math.max(from.points.length - 2, 0)];
    const after = to.points[Math.min(1, to.points.length - 1)];
    const hIn = normalize({ x: p0.x - before.x, z: p0.z - before.z });
    const hOut = normalize({ x: after.x - p3.x, z: after.z - p3.z });
    const chord = Math.hypot(p3.x - p0.x, p3.z - p0.z);
    if (chord < 0.6) {
      this.link(from, to);
      return;
    }
    const reach = chord * tightness;
    const p1 = { x: p0.x + hIn.x * reach, y: p0.y, z: p0.z + hIn.z * reach };
    const p2 = { x: p3.x - hOut.x * reach, y: p3.y, z: p3.z - hOut.z * reach };
    const points = cubicBezier(p0, p1, p2, p3, CONNECTOR_SAMPLES);
    const lane: Lane = {
      id: `${nodeId}|${from.id}>${to.id}`,
      kind: "connector",
      nodeId,
      turn,
      fromNode: nodeId,
      toNode: nodeId,
      points,
      length: polylineLength(points),
      width: Math.min(from.width, to.width),
      speedKph: turn === "straight" || turn === "merge" || turn === "diverge" ? Math.min(from.speedKph, to.speedKph) : 25,
      next: [to.id],
      prev: [from.id],
      adjacent: [],
    };
    this.lanes.set(lane.id, lane);
    from.next.push(lane.id);
    to.prev.push(lane.id);
  }

  private connectNode(node: BuiltNode) {
    const nodeId = node.spec.id;
    if (node.isCut) {
      this.connectCutNode(node);
      return;
    }
    if (node.spec.roundabout) {
      this.buildRoundabout(node);
      return;
    }
    const ends = this.roadEndsAt(nodeId);
    if (ends.length === 0 || node.spec.edge) {
      return;
    }
    if (ends.length > 1 || node.spec.turnaround || node.spec.destination) {
      this.buildJunctionGeometry(node, ends);
    }

    const incoming = this.lanesEndingAt(nodeId);
    const outgoing = this.lanesStartingAt(nodeId);

    if (ends.length === 1) {
      if (node.spec.turnaround || node.spec.destination) {
        for (const lane of incoming) {
          for (const target of outgoing) {
            this.addConnector(nodeId, lane, target, "uturn", 0.9);
          }
        }
      }
      return;
    }

    if (ends.length === 2) {
      for (const lane of incoming) {
        for (const target of outgoing) {
          if (target.roadId === lane.roadId) {
            continue;
          }
          const outRoad = this.roads.get(target.roadId ?? "");
          const outCount = outRoad ? outRoad.laneOffsets[target.direction ?? "forward"].length : 1;
          const inRoad = this.roads.get(lane.roadId ?? "");
          const inCount = inRoad ? inRoad.laneOffsets[lane.direction ?? "forward"].length : 1;
          const laneIndex = lane.laneIndex ?? 0;
          const targetIndex = Math.min(
            outCount - 1,
            inCount === outCount ? laneIndex : Math.round((laneIndex / Math.max(inCount - 1, 1)) * (outCount - 1)),
          );
          const overflowMerge = inCount > outCount && laneIndex >= outCount;
          if ((target.laneIndex ?? 0) === targetIndex || (overflowMerge && (target.laneIndex ?? 0) === outCount - 1)) {
            this.addConnector(nodeId, lane, target, "straight", 0.3);
          }
        }
      }
      return;
    }

    for (const lane of incoming) {
      const arrivalHeading = this.laneEndHeading(lane);
      const inRoad = this.roads.get(lane.roadId ?? "");
      const inCount = inRoad ? inRoad.laneOffsets[lane.direction ?? "forward"].length : 1;
      const laneIndex = lane.laneIndex ?? 0;
      const candidates = outgoing
        .filter((target) => target.roadId !== lane.roadId)
        .map((target) => ({ target, turn: this.classifyTurn(arrivalHeading, this.laneStartHeading(target)) }));
      const hasStraight = candidates.some((candidate) => candidate.turn === "straight");
      const hasLeft = candidates.some((candidate) => candidate.turn === "left");
      const hasRight = candidates.some((candidate) => candidate.turn === "right");

      let allowed: TurnKind[];
      if (inCount === 1) {
        allowed = ["straight", "left", "right"];
      } else if (laneIndex === 0) {
        allowed = hasStraight ? ["straight"] : [];
        if (hasLeft) {
          allowed.push("left");
        }
        if (allowed.length === 0) {
          allowed.push("right");
        }
      } else if (laneIndex === inCount - 1) {
        allowed = hasStraight ? ["straight"] : [];
        if (hasRight) {
          allowed.push("right");
        }
        if (allowed.length === 0) {
          allowed.push("left");
        }
      } else {
        allowed = hasStraight ? ["straight"] : hasRight ? ["right"] : ["left"];
      }

      for (const candidate of candidates) {
        if (!allowed.includes(candidate.turn)) {
          continue;
        }
        const outRoad = this.roads.get(candidate.target.roadId ?? "");
        const outCount = outRoad ? outRoad.laneOffsets[candidate.target.direction ?? "forward"].length : 1;
        const outIndex = candidate.target.laneIndex ?? 0;
        let targetIndex: number;
        if (candidate.turn === "straight") {
          targetIndex = Math.min(laneIndex, outCount - 1);
        } else if (candidate.turn === "right") {
          targetIndex = outCount - 1;
        } else {
          targetIndex = 0;
        }
        const fanOut = inCount === 1 && outCount > 1 && candidate.turn === "straight";
        if (outIndex !== targetIndex && !fanOut) {
          continue;
        }
        this.addConnector(nodeId, lane, candidate.target, candidate.turn, candidate.turn === "straight" ? 0.3 : 0.42);
      }
    }
  }

  private connectCutNode(node: BuiltNode) {
    const nodeId = node.spec.id;
    const hostIds = node.roadIds.filter((roadId) => {
      const road = this.roads.get(roadId);
      return road?.cutStations.some((station) => station.nodeId === nodeId);
    });
    for (const hostId of hostIds) {
      const pieces = this.roadLanePieces.get(hostId);
      if (!pieces) {
        continue;
      }
      for (const direction of ["forward", "backward"] as const) {
        for (const laneList of pieces[direction]) {
          const ending = laneList.find((lane) => lane.toNode === nodeId);
          const starting = laneList.find((lane) => lane.fromNode === nodeId);
          if (ending && starting) {
            this.link(ending, starting);
          }
        }
      }
    }
    for (const road of this.roads.values()) {
      if (road.spec.attachFrom && road.spec.from === nodeId) {
        const host = this.roadLanePieces.get(road.spec.attachFrom.roadId);
        const rampPieces = this.roadLanePieces.get(road.spec.id);
        if (!host || !rampPieces) {
          continue;
        }
        const hostLanes = host[road.spec.attachFrom.direction];
        const outer = hostLanes[hostLanes.length - 1]?.find((lane) => lane.toNode === nodeId);
        const rampLane = rampPieces.forward[0]?.[0];
        if (outer && rampLane) {
          this.addConnector(nodeId, outer, rampLane, "diverge", 0.3);
        }
      }
      if (road.spec.attachTo && road.spec.to === nodeId) {
        const host = this.roadLanePieces.get(road.spec.attachTo.roadId);
        const rampPieces = this.roadLanePieces.get(road.spec.id);
        if (!host || !rampPieces) {
          continue;
        }
        const hostLanes = host[road.spec.attachTo.direction];
        const outer = hostLanes[hostLanes.length - 1]?.find((lane) => lane.fromNode === nodeId);
        const rampLanes = rampPieces.forward[0];
        const rampLane = rampLanes?.[rampLanes.length - 1];
        if (outer && rampLane) {
          this.addConnector(nodeId, rampLane, outer, "merge", 0.3);
        }
      }
    }
  }

  private laneEndHeading(lane: Lane): Vec2 {
    const count = lane.points.length;
    const a = lane.points[Math.max(count - 4, 0)];
    const b = lane.points[count - 1];
    return normalize({ x: b.x - a.x, z: b.z - a.z });
  }

  private laneStartHeading(lane: Lane): Vec2 {
    const a = lane.points[0];
    const b = lane.points[Math.min(3, lane.points.length - 1)];
    return normalize({ x: b.x - a.x, z: b.z - a.z });
  }

  private classifyTurn(hIn: Vec2, hOut: Vec2): TurnKind {
    const dot = hIn.x * hOut.x + hIn.z * hOut.z;
    const cross = hIn.x * hOut.z - hIn.z * hOut.x;
    if (dot < -0.75) {
      return "uturn";
    }
    if (dot > 0.8) {
      return "straight";
    }
    return cross > 0 ? "right" : "left";
  }

  private buildJunctionGeometry(node: BuiltNode, ends: Array<{ road: BuiltRoad; atStart: boolean }>) {
    const center = node.position;
    const roadEnds: RoadEnd[] = ends.map((end) => {
      const road = end.road;
      const trimStation = end.atStart ? road.startTrim : road.length - road.endTrim;
      const base = sampleAtStation(road.samples, trimStation);
      const dir = end.atStart ? { x: base.tx, z: base.tz } : { x: -base.tx, z: -base.tz };
      const right = perpRight(dir);
      const halfWidth = road.halfWidth;
      return {
        roadId: road.spec.id,
        atStart: end.atStart,
        dir,
        angle: Math.atan2(dir.z, dir.x),
        halfWidth,
        trim: end.atStart ? road.startTrim : road.endTrim,
        cornerRadius: road.cls.cornerRadius,
        endCenter: { x: base.x, y: base.y, z: base.z },
        cornerA: { x: base.x - right.x * halfWidth, y: base.y, z: base.z - right.z * halfWidth },
        cornerB: { x: base.x + right.x * halfWidth, y: base.y, z: base.z + right.z * halfWidth },
      };
    });
    roadEnds.sort((a, b) => a.angle - b.angle);

    const pad: Vec3[] = [];
    const corners: JunctionCorner[] = [];
    let destination: BuiltDestination | undefined;
    const destinationSpec = node.spec.destination;
    if (roadEnds.length === 1 && destinationSpec && destinationSpec.kind !== "culdesac") {
      const end = roadEnds[0];
      const axis = { x: -end.dir.x, z: -end.dir.z };
      const right = perpRight(end.dir);
      const origin = end.endCenter;
      const half = destinationSpec.width * 0.5;
      const at = (along: number, across: number): Vec3 => ({
        x: origin.x + axis.x * along + right.x * across,
        y: origin.y,
        z: origin.z + axis.z * along + right.z * across,
      });
      pad.push(end.cornerA, end.cornerB, at(4, half), at(destinationSpec.depth, half), at(destinationSpec.depth, -half), at(4, -half));
      destination = { spec: destinationSpec, origin, axis, right, entryHalfWidth: end.halfWidth };
    } else if (roadEnds.length === 1) {
      const end = roadEnds[0];
      const radius = destinationSpec ? Math.max(end.halfWidth + 3, 10) : Math.max(end.halfWidth + 2, end.cornerRadius * 1.1);
      const backward = { x: -end.dir.x, z: -end.dir.z };
      const segments = 14;
      pad.push(end.cornerA);
      for (let index = 0; index <= segments; index += 1) {
        const angle = Math.atan2(backward.z, backward.x) + Math.PI * 0.5 - (index / segments) * Math.PI;
        pad.push({
          x: center.x + Math.cos(angle) * radius,
          y: center.y,
          z: center.z + Math.sin(angle) * radius,
        });
      }
      pad.push(end.cornerB);
      if (destinationSpec) {
        destination = { spec: destinationSpec, origin: end.endCenter, axis: backward, right: perpRight(end.dir), entryHalfWidth: end.halfWidth };
      }
    } else {
      for (let index = 0; index < roadEnds.length; index += 1) {
        const current = roadEnds[index];
        const next = roadEnds[(index + 1) % roadEnds.length];
        pad.push(current.cornerA, current.cornerB);
        const fillet = this.filletBetween(current, next, center);
        pad.push(...fillet.slice(1, -1));
        corners.push({ fromRoadId: current.roadId, toRoadId: next.roadId, points: fillet });
      }
    }

    const hasSidewalks = ends.some((end) => end.road.cls.sidewalkWidth > 0);
    this.junctions.set(node.spec.id, {
      nodeId: node.spec.id,
      center,
      control: node.spec.control ?? (ends.length >= 3 ? "priority" : "none"),
      ends: roadEnds,
      pad,
      corners,
      hasSidewalks,
      destination,
    });
  }

  private filletBetween(current: RoadEnd, next: RoadEnd, center: Vec3): Vec3[] {
    const a = current.cornerB;
    const b = next.cornerA;
    const da = current.dir;
    const db = next.dir;
    const denominator = da.x * db.z - da.z * db.x;
    let control: Vec3;
    if (Math.abs(denominator) < 0.05) {
      control = { x: (a.x + b.x) * 0.5, y: center.y, z: (a.z + b.z) * 0.5 };
    } else {
      const t = ((b.x - a.x) * db.z - (b.z - a.z) * db.x) / denominator;
      const px = a.x + da.x * t;
      const pz = a.z + da.z * t;
      const maxReach = Math.hypot(a.x - b.x, a.z - b.z) * 1.6 + 4;
      const reach = Math.hypot(px - a.x, pz - a.z);
      if (reach > maxReach || t > 0) {
        control = { x: (a.x + b.x) * 0.5, y: center.y, z: (a.z + b.z) * 0.5 };
      } else {
        control = { x: px, y: center.y, z: pz };
      }
    }
    const points: Vec3[] = [];
    const segments = 7;
    for (let index = 0; index <= segments; index += 1) {
      const t = index / segments;
      const mt = 1 - t;
      points.push({
        x: mt * mt * a.x + 2 * mt * t * control.x + t * t * b.x,
        y: lerp(a.y, b.y, t),
        z: mt * mt * a.z + 2 * mt * t * control.z + t * t * b.z,
      });
    }
    return points;
  }

  private buildRoundabout(node: BuiltNode) {
    const nodeId = node.spec.id;
    const radius = node.spec.roundabout?.radius ?? 16;
    const center = node.position;
    const ends = this.roadEndsAt(nodeId);
    const roadEnds: RoadEnd[] = ends.map((end) => {
      const road = end.road;
      const trimStation = end.atStart ? road.startTrim : road.length - road.endTrim;
      const base = sampleAtStation(road.samples, trimStation);
      const dir = normalize({ x: base.x - center.x, z: base.z - center.z });
      const right = perpRight(dir);
      return {
        roadId: road.spec.id,
        atStart: end.atStart,
        dir,
        angle: Math.atan2(dir.z, dir.x),
        halfWidth: road.halfWidth,
        trim: end.atStart ? road.startTrim : road.endTrim,
        cornerRadius: road.cls.cornerRadius,
        endCenter: { x: base.x, y: base.y, z: base.z },
        cornerA: { x: base.x - right.x * road.halfWidth, y: base.y, z: base.z - right.z * road.halfWidth },
        cornerB: { x: base.x + right.x * road.halfWidth, y: base.y, z: base.z + right.z * road.halfWidth },
      };
    });

    type RingEvent = { angle: number; kind: "entry" | "exit"; end: RoadEnd };
    const events: RingEvent[] = [];
    const approaches: BuiltRoundabout["approaches"] = [];
    for (const end of roadEnds) {
      const road = this.roads.get(end.roadId);
      if (!road) {
        continue;
      }
      const delta = Math.asin(Math.min(0.9, (road.cls.laneWidth * 0.5 + 1.6) / radius));
      const entryAngle = end.angle - delta;
      const exitAngle = end.angle + delta;
      events.push({ angle: entryAngle, kind: "entry", end });
      events.push({ angle: exitAngle, kind: "exit", end });
      const padPoints: Vec3[] = [end.cornerA, end.cornerB];
      const arcSteps = 6;
      for (let index = 0; index <= arcSteps; index += 1) {
        const angle = lerp(exitAngle + delta * 0.8, entryAngle - delta * 0.8, index / arcSteps);
        padPoints.push({
          x: center.x + Math.cos(angle) * (radius + RING_LANE_WIDTH * 0.5 - 0.2),
          y: center.y,
          z: center.z + Math.sin(angle) * (radius + RING_LANE_WIDTH * 0.5 - 0.2),
        });
      }
      approaches.push({ roadId: end.roadId, entryAngle, exitAngle, pad: padPoints });
    }

    const normalizeAngle = (angle: number) => {
      let value = angle;
      while (value < 0) {
        value += Math.PI * 2;
      }
      while (value >= Math.PI * 2) {
        value -= Math.PI * 2;
      }
      return value;
    };
    const sorted = events
      .map((event) => ({ ...event, angle: normalizeAngle(event.angle) }))
      .sort((a, b) => b.angle - a.angle);

    const ringLanes: Lane[] = [];
    const ringPoint = (angle: number): Vec3 => ({
      x: center.x + Math.cos(angle) * radius,
      y: center.y,
      z: center.z + Math.sin(angle) * radius,
    });
    for (let index = 0; index < sorted.length; index += 1) {
      const start = sorted[index];
      const end = sorted[(index + 1) % sorted.length];
      let span = start.angle - end.angle;
      if (span <= 0) {
        span += Math.PI * 2;
      }
      const steps = Math.max(3, Math.ceil((span * radius) / 3));
      const points: Vec3[] = [];
      for (let step = 0; step <= steps; step += 1) {
        points.push(ringPoint(start.angle - (span * step) / steps));
      }
      const lane: Lane = {
        id: `${nodeId}:ring:${index}`,
        kind: "ring",
        nodeId,
        turn: "circulate",
        fromNode: nodeId,
        toNode: nodeId,
        points,
        length: polylineLength(points),
        width: RING_LANE_WIDTH,
        speedKph: 30,
        next: [],
        prev: [],
        adjacent: [],
      };
      this.lanes.set(lane.id, lane);
      ringLanes.push(lane);
    }
    for (let index = 0; index < ringLanes.length; index += 1) {
      this.link(ringLanes[index], ringLanes[(index + 1) % ringLanes.length]);
    }

    for (let index = 0; index < sorted.length; index += 1) {
      const event = sorted[index];
      const segmentStartingHere = ringLanes[index];
      const segmentEndingHere = ringLanes[(index - 1 + ringLanes.length) % ringLanes.length];
      const incoming = this.lanesEndingAt(nodeId).filter((lane) => lane.roadId === event.end.roadId);
      const outgoing = this.lanesStartingAt(nodeId).filter((lane) => lane.roadId === event.end.roadId);
      if (event.kind === "entry") {
        for (const lane of incoming) {
          this.addConnector(nodeId, lane, segmentStartingHere, "enter", 0.45);
        }
      } else {
        for (const lane of outgoing) {
          this.addConnector(nodeId, segmentEndingHere, lane, "exit", 0.45);
        }
      }
    }

    this.roundabouts.set(nodeId, {
      nodeId,
      center,
      ringRadius: radius,
      ringWidth: RING_LANE_WIDTH,
      apronWidth: RING_APRON_WIDTH,
      ends: roadEnds,
      approaches,
    });
  }

  private finalizeLinks() {
    for (const lane of this.lanes.values()) {
      for (const nextId of lane.next) {
        const next = this.lanes.get(nextId);
        if (next && !next.prev.includes(lane.id)) {
          next.prev.push(lane.id);
        }
      }
    }
  }
}

export function buildRoadNetwork(spec: NetworkSpec, options: BuildOptions) {
  return new NetworkBuilder(spec, options).build();
}
