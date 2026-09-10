import type { Lane, RoadNetwork, Vec3 } from "./network";

export interface RouteResult {
  laneIds: string[];
  lengthM: number;
  points: Vec3[];
  laneChanges: number;
}

const LANE_CHANGE_COST_M = 40;

export interface NetworkStats {
  nodeCount: number;
  roadCount: number;
  laneCount: number;
  laneCountByKind: Record<string, number>;
  junctionCount: number;
  roundaboutCount: number;
  totalLaneLengthKm: number;
  sourceLaneCount: number;
  sinkLaneCount: number;
}

export interface NetworkInvariants {
  everyLaneHasPoints: boolean;
  noNaNCoordinates: boolean;
  connectorsTouchNeighbours: boolean;
  everyLinkIsBidirectional: boolean;
  strandedLaneIds: string[];
  maxConnectorGapM: number;
}

export class RoadGraph {
  constructor(public readonly network: RoadNetwork) {}

  lane(id: string) {
    return this.network.lanes.get(id);
  }

  successors(id: string): Lane[] {
    const lane = this.lane(id);
    if (!lane) {
      return [];
    }
    return lane.next.map((nextId) => this.network.lanes.get(nextId)).filter((next): next is Lane => Boolean(next));
  }

  predecessors(id: string): Lane[] {
    const lane = this.lane(id);
    if (!lane) {
      return [];
    }
    return lane.prev.map((prevId) => this.network.lanes.get(prevId)).filter((prev): prev is Lane => Boolean(prev));
  }

  laneIds() {
    return [...this.network.lanes.keys()];
  }

  drivableLaneIds() {
    return [...this.network.lanes.values()].filter((lane) => lane.kind !== "connector").map((lane) => lane.id);
  }

  sources() {
    return [...this.network.lanes.values()].filter((lane) => lane.prev.length === 0 && lane.kind !== "connector");
  }

  sinks() {
    return [...this.network.lanes.values()].filter((lane) => lane.next.length === 0 && lane.kind !== "connector");
  }

  findRoute(fromLaneId: string, toLaneId: string): RouteResult | undefined {
    const from = this.lane(fromLaneId);
    const to = this.lane(toLaneId);
    if (!from || !to) {
      return undefined;
    }
    const distances = new Map<string, number>([[from.id, from.length]]);
    const previous = new Map<string, { id: string; change: boolean }>();
    const visited = new Set<string>();
    const frontier: Array<{ id: string; cost: number }> = [{ id: from.id, cost: from.length }];

    while (frontier.length > 0) {
      frontier.sort((a, b) => a.cost - b.cost);
      const current = frontier.shift();
      if (!current || visited.has(current.id)) {
        continue;
      }
      visited.add(current.id);
      if (current.id === to.id) {
        break;
      }
      const currentLane = this.lane(current.id);
      if (!currentLane) {
        continue;
      }
      const candidates: Array<{ lane: Lane; cost: number; change: boolean }> = [
        ...this.successors(current.id).map((lane) => ({ lane, cost: current.cost + lane.length, change: false })),
        ...currentLane.adjacent
          .map((id) => this.lane(id))
          .filter((lane): lane is Lane => Boolean(lane))
          .map((lane) => ({ lane, cost: current.cost + LANE_CHANGE_COST_M, change: true })),
      ];
      for (const candidate of candidates) {
        const known = distances.get(candidate.lane.id);
        if (known === undefined || candidate.cost < known) {
          distances.set(candidate.lane.id, candidate.cost);
          previous.set(candidate.lane.id, { id: current.id, change: candidate.change });
          frontier.push({ id: candidate.lane.id, cost: candidate.cost });
        }
      }
    }

    if (!visited.has(to.id)) {
      return undefined;
    }
    const steps: Array<{ id: string; change: boolean }> = [];
    let cursor: string | undefined = to.id;
    let changeIntoCursor = false;
    while (cursor) {
      steps.unshift({ id: cursor, change: changeIntoCursor });
      const link: { id: string; change: boolean } | undefined = previous.get(cursor);
      changeIntoCursor = link?.change ?? false;
      cursor = link?.id;
    }
    const points: Vec3[] = [];
    let lengthM = 0;
    let laneChanges = 0;
    for (const step of steps) {
      const lane = this.lane(step.id);
      if (!lane) {
        continue;
      }
      const startIndex = step.change ? Math.floor(lane.points.length * 0.5) : 0;
      if (step.change) {
        laneChanges += 1;
        lengthM += lane.length * 0.5;
      } else {
        lengthM += lane.length;
      }
      for (let index = startIndex; index < lane.points.length; index += 1) {
        const point = lane.points[index];
        const last = points[points.length - 1];
        if (!last || Math.hypot(last.x - point.x, last.z - point.z) > 0.05) {
          points.push(point);
        }
      }
    }
    return { laneIds: steps.map((step) => step.id), lengthM, points, laneChanges };
  }

  enumeratePaths(fromLaneId: string, maxLengthM: number, limit = 200): string[][] {
    const results: string[][] = [];
    const walk = (laneId: string, path: string[], travelled: number) => {
      if (results.length >= limit) {
        return;
      }
      const lane = this.lane(laneId);
      if (!lane) {
        return;
      }
      const nextPath = [...path, laneId];
      const nextTravelled = travelled + lane.length;
      if (nextTravelled >= maxLengthM || lane.next.length === 0) {
        results.push(nextPath);
        return;
      }
      for (const nextId of lane.next) {
        if (nextPath.includes(nextId)) {
          results.push(nextPath);
          continue;
        }
        walk(nextId, nextPath, nextTravelled);
      }
    };
    walk(fromLaneId, [], 0);
    return results;
  }

  randomRoute(seed: number, minLengthM = 800): RouteResult | undefined {
    const ids = this.drivableLaneIds();
    if (ids.length === 0) {
      return undefined;
    }
    let state = seed >>> 0 || 1;
    const random = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const from = ids[Math.floor(random() * ids.length)];
      const to = ids[Math.floor(random() * ids.length)];
      if (from === to) {
        continue;
      }
      const route = this.findRoute(from, to);
      if (route && route.lengthM >= minLengthM) {
        return route;
      }
    }
    return undefined;
  }

  stats(): NetworkStats {
    const laneCountByKind: Record<string, number> = {};
    let totalLength = 0;
    for (const lane of this.network.lanes.values()) {
      laneCountByKind[lane.kind] = (laneCountByKind[lane.kind] ?? 0) + 1;
      totalLength += lane.length;
    }
    return {
      nodeCount: this.network.nodes.size,
      roadCount: this.network.roads.size,
      laneCount: this.network.lanes.size,
      laneCountByKind,
      junctionCount: this.network.junctions.size,
      roundaboutCount: this.network.roundabouts.size,
      totalLaneLengthKm: totalLength / 1000,
      sourceLaneCount: this.sources().length,
      sinkLaneCount: this.sinks().length,
    };
  }

  invariants(): NetworkInvariants {
    let everyLaneHasPoints = true;
    let noNaNCoordinates = true;
    let connectorsTouchNeighbours = true;
    let everyLinkIsBidirectional = true;
    let maxConnectorGapM = 0;
    const stranded: string[] = [];
    const edgeNodeIds = new Set(
      [...this.network.nodes.values()].filter((node) => node.spec.edge).map((node) => node.spec.id),
    );

    for (const lane of this.network.lanes.values()) {
      if (lane.points.length < 2) {
        everyLaneHasPoints = false;
      }
      for (const point of lane.points) {
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z)) {
          noNaNCoordinates = false;
        }
      }
      for (const nextId of lane.next) {
        const next = this.network.lanes.get(nextId);
        if (!next) {
          everyLinkIsBidirectional = false;
          continue;
        }
        if (!next.prev.includes(lane.id)) {
          everyLinkIsBidirectional = false;
        }
        const a = lane.points[lane.points.length - 1];
        const b = next.points[0];
        const gap = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
        maxConnectorGapM = Math.max(maxConnectorGapM, gap);
        if (gap > 0.75) {
          connectorsTouchNeighbours = false;
        }
      }
      const startsAtEdge = edgeNodeIds.has(lane.fromNode);
      const endsAtEdge = edgeNodeIds.has(lane.toNode);
      if ((lane.prev.length === 0 && !startsAtEdge) || (lane.next.length === 0 && !endsAtEdge)) {
        stranded.push(lane.id);
      }
    }

    return {
      everyLaneHasPoints,
      noNaNCoordinates,
      connectorsTouchNeighbours,
      everyLinkIsBidirectional,
      strandedLaneIds: stranded,
      maxConnectorGapM,
    };
  }

  toJSON() {
    return {
      nodes: [...this.network.nodes.values()].map((node) => ({
        id: node.spec.id,
        x: node.position.x,
        y: node.position.y,
        z: node.position.z,
        control: node.spec.control ?? null,
        roundabout: node.spec.roundabout ?? null,
        edge: Boolean(node.spec.edge),
        roads: node.roadIds,
      })),
      roads: [...this.network.roads.values()].map((road) => ({
        id: road.spec.id,
        name: road.spec.name ?? road.spec.id,
        class: road.spec.class,
        forward: road.spec.forward,
        backward: road.spec.backward,
        lengthM: road.length,
        widthM: road.width,
        closed: Boolean(road.spec.closed),
      })),
      lanes: [...this.network.lanes.values()].map((lane) => ({
        id: lane.id,
        kind: lane.kind,
        roadId: lane.roadId ?? null,
        nodeId: lane.nodeId ?? null,
        direction: lane.direction ?? null,
        laneIndex: lane.laneIndex ?? null,
        turn: lane.turn ?? null,
        fromNode: lane.fromNode,
        toNode: lane.toNode,
        lengthM: lane.length,
        speedKph: lane.speedKph,
        pointCount: lane.points.length,
        next: lane.next,
        prev: lane.prev,
        adjacent: lane.adjacent,
      })),
    };
  }
}
