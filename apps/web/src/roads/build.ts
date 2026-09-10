import { groundSurfaceBaseYAt, groundSurfaceYAt } from "../natural/terrain";
import { registerCorridor, registerCut } from "../world/occupancy";
import { RoadGraph } from "./graph";
import { buildRoadNetwork, perpRight, type BuiltRoad, type RoadNetwork } from "./network";
import { NETWORK_SPEC } from "./plan";

export const ROAD_SURFACE_LIFT_M = 0.16;
export const TUNNEL_APPROACH_CUT_M = 8;

export const roadNetwork: RoadNetwork = buildRoadNetwork(NETWORK_SPEC, {
  terrainY: (x, z) => groundSurfaceYAt(x, z),
  roadLift: ROAD_SURFACE_LIFT_M,
});

export const roadGraph = new RoadGraph(roadNetwork);

for (const road of roadNetwork.roads.values()) {
  const groundRuns: Array<Array<{ x: number; z: number }>> = [];
  let current: Array<{ x: number; z: number }> = [];
  for (const sample of road.samples) {
    if (sample.structure === "ground") {
      current.push({ x: sample.x, z: sample.z });
    } else if (current.length > 1) {
      groundRuns.push(current);
      current = [];
    } else {
      current = [];
    }
  }
  if (current.length > 1) {
    groundRuns.push(current);
  }
  const sidewalk = road.cls.sidewalkWidth;
  for (const run of groundRuns) {
    registerCorridor(run, road.halfWidth + sidewalk + 2, `road:${road.spec.id}`, false);
    registerCorridor(run, road.halfWidth + sidewalk, `pavement:${road.spec.id}`, false);
  }
  if (road.spec.class === "highway" || road.spec.class === "ramp") {
    registerCorridor(road.samples.map((sample) => ({ x: sample.x, z: sample.z })), road.halfWidth + 3, `pavement:${road.spec.id}`, Boolean(road.spec.closed));
  }
  registerRoadCuts(road);
}

function registerRoadCuts(road: BuiltRoad) {
  const sidewalk = road.cls.sidewalkWidth;
  const edge = road.halfWidth + sidewalk;
  const samples = road.samples;
  const portalStations: number[] = [];
  const closed = Boolean(road.spec.closed);
  for (let index = closed ? 0 : 1; index < samples.length; index += 1) {
    const previous = samples[(index - 1 + samples.length) % samples.length];
    const current = samples[index];
    if ((previous.structure === "tunnel") !== (current.structure === "tunnel")) {
      portalStations.push(previous.structure === "tunnel" ? current.s : previous.s);
    }
  }
  for (const sample of samples) {
    const nearPortal = portalStations.some((station) => Math.abs(sample.s - station) <= TUNNEL_APPROACH_CUT_M);
    const cutsTerrain = sample.structure === "ground" || (sample.structure === "tunnel" && nearPortal);
    const roadY = sample.y - ROAD_SURFACE_LIFT_M - 0.35;
    const right = perpRight({ x: sample.tx, z: sample.tz });
    registerCut(sample.x, sample.z, roadY, edge + 2.5, cutsTerrain && sample.y < sample.terrainY - 0.25, road.spec.id);
    if (edge < 4) {
      continue;
    }
    for (const sign of [-1, 1]) {
      const x = sample.x + right.x * edge * sign;
      const z = sample.z + right.z * edge * sign;
      registerCut(x, z, roadY, 1.8, cutsTerrain && sample.y < groundSurfaceBaseYAt(x, z) - 0.25, road.spec.id);
    }
  }
}

for (const junction of roadNetwork.junctions.values()) {
  const radius = junction.ends.reduce((max, end) => Math.max(max, end.trim + end.halfWidth), 12);
  registerCorridor([junction.center, { x: junction.center.x + 0.01, z: junction.center.z }], radius + 4, `junction:${junction.nodeId}`);
  for (const corner of junction.corners) {
    const width = Math.max(...[corner.fromRoadId, corner.toRoadId].map((roadId) => roadNetwork.roads.get(roadId)?.cls.sidewalkWidth ?? 0));
    registerCorridor(corner.points.map((point) => ({ x: point.x, z: point.z })), width + 0.6, `pavement:corner:${junction.nodeId}`);
  }
  const destination = junction.destination;
  if (destination) {
    const { origin, axis, spec } = destination;
    const reach = spec.kind === "culdesac" ? 12 : spec.depth;
    const half = spec.kind === "culdesac" ? 12 : spec.width * 0.5;
    registerCorridor([origin, { x: origin.x + axis.x * reach, z: origin.z + axis.z * reach }], half + 2.5, `pavement:destination:${junction.nodeId}`);
    const roadY = origin.y - ROAD_SURFACE_LIFT_M - 0.35;
    for (let along = 0; along <= reach; along += 6) {
      for (let across = -half; across <= half; across += 6) {
        const x = origin.x + axis.x * along + destination.right.x * across;
        const z = origin.z + axis.z * along + destination.right.z * across;
        registerCut(x, z, roadY, 3.5, origin.y < groundSurfaceBaseYAt(x, z) - 0.25, `destination:${junction.nodeId}`);
      }
    }
  }
}

for (const roundabout of roadNetwork.roundabouts.values()) {
  registerCorridor(
    [roundabout.center, { x: roundabout.center.x + 0.01, z: roundabout.center.z }],
    roundabout.ringRadius + roundabout.ringWidth + 14,
    `roundabout:${roundabout.nodeId}`,
  );
}
