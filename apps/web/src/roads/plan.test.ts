import { describe, expect, it } from 'vitest';
import { RoadGraph } from './graph';
import { buildRoadNetwork } from './network';
import { NETWORK_SPEC, RING_ROAD_ID } from './plan';

describe('the city plan', () => {
  const graph = new RoadGraph(buildRoadNetwork(NETWORK_SPEC, { terrainY: () => 2 }));

  it('declares every node exactly once and every road between known nodes', () => {
    const ids = NETWORK_SPEC.nodes.map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    const known = new Set(ids);
    for (const road of NETWORK_SPEC.roads) {
      if (road.from) {
        expect(known.has(road.from), `${road.id} starts at unknown node ${road.from}`).toBe(true);
      }
      if (road.to) {
        expect(known.has(road.to), `${road.id} ends at unknown node ${road.to}`).toBe(true);
      }
    }
  });

  it('produces a closed lane graph with the expected inventory', () => {
    const stats = graph.stats();
    expect(stats.roadCount).toBeGreaterThanOrEqual(90);
    expect(stats.laneCount).toBeGreaterThanOrEqual(600);
    expect(stats.roundaboutCount).toBe(3);
    expect(stats.laneCountByKind.ramp).toBe(10);
    const invariants = graph.invariants();
    expect(invariants.strandedLaneIds).toEqual([]);
    expect(invariants.everyLinkIsBidirectional).toBe(true);
    expect(invariants.connectorsTouchNeighbours).toBe(true);
    expect(invariants.noNaNCoordinates).toBe(true);
  });

  it('routes from the ring highway to Main Street and back', () => {
    const ringLane = graph.laneIds().find((id) => id.startsWith(`${RING_ROAD_ID}:forward:0`));
    const mainLane = 'main-street-1:forward:0';
    expect(ringLane).toBeDefined();
    const out = graph.findRoute(ringLane!, mainLane);
    const back = graph.findRoute(mainLane, ringLane!);
    expect(out?.lengthM ?? 0).toBeGreaterThan(200);
    expect(back?.lengthM ?? 0).toBeGreaterThan(200);
  });

  it('enumerates bounded paths and finds long random routes', () => {
    const paths = graph.enumeratePaths('main-street-1:forward:0', 400, 50);
    expect(paths.length).toBeGreaterThan(1);
    expect(paths.length).toBeLessThanOrEqual(50);
    const route = graph.randomRoute(3, 900);
    expect(route?.lengthM ?? 0).toBeGreaterThanOrEqual(900);
  });
});
