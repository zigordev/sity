import { groundSurfaceYAt } from "../natural/terrain";
import { registerCorridor, registerCut } from "../world/occupancy";
import { RoadGraph } from "./graph";
import { buildRoadNetwork, type RoadNetwork } from "./network";
import { NETWORK_SPEC } from "./plan";

export const ROAD_SURFACE_LIFT_M = 0.16;

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
  for (const sample of road.samples) {
    registerCut(
      sample.x,
      sample.z,
      sample.y - ROAD_SURFACE_LIFT_M - 0.35,
      road.halfWidth + sidewalk + 2.5,
      sample.structure === "ground" && sample.y < sample.terrainY - 0.25,
    );
  }
}

for (const junction of roadNetwork.junctions.values()) {
  const radius = junction.ends.reduce((max, end) => Math.max(max, end.trim + end.halfWidth), 12);
  registerCorridor([junction.center, { x: junction.center.x + 0.01, z: junction.center.z }], radius + 4, `junction:${junction.nodeId}`);
}

for (const roundabout of roadNetwork.roundabouts.values()) {
  registerCorridor(
    [roundabout.center, { x: roundabout.center.x + 0.01, z: roundabout.center.z }],
    roundabout.ringRadius + roundabout.ringWidth + 14,
    `roundabout:${roundabout.nodeId}`,
  );
}
