import { describe, expect, it } from 'vitest';
import { RoadGraph } from './graph';
import { buildRoadNetwork, type NetworkSpec } from './network';

const flat = { terrainY: () => 2 };

function crossroads(control: 'signal' | 'stop' = 'signal'): NetworkSpec {
  return {
    nodes: [
      { id: 'w', x: -200, z: 0, edge: true },
      { id: 'e', x: 200, z: 0, edge: true },
      { id: 'n', x: 0, z: -200, edge: true },
      { id: 's', x: 0, z: 200, edge: true },
      { id: 'c', x: 0, z: 0, control },
    ],
    roads: [
      { id: 'ew-1', class: 'arterial', from: 'w', to: 'c', forward: 2, backward: 2 },
      { id: 'ew-2', class: 'arterial', from: 'c', to: 'e', forward: 2, backward: 2 },
      { id: 'ns-1', class: 'collector', from: 'n', to: 'c', forward: 1, backward: 1 },
      { id: 'ns-2', class: 'collector', from: 'c', to: 's', forward: 1, backward: 1 },
    ],
  };
}

describe('buildRoadNetwork', () => {
  it('trims the roads at a crossroads and connects every allowed turn', () => {
    const network = buildRoadNetwork(crossroads(), flat);
    const junction = network.junctions.get('c');
    expect(junction).toBeDefined();
    expect(junction?.ends).toHaveLength(4);
    expect(junction?.pad.length).toBeGreaterThan(8);
    for (const road of network.roads.values()) {
      const trim = road.spec.from === 'c' ? road.startTrim : road.endTrim;
      expect(trim).toBeGreaterThan(road.halfWidth * 0.5);
    }
    const connectors = [...network.lanes.values()].filter((lane) => lane.kind === 'connector');
    const turns = connectors.reduce<Record<string, number>>((acc, lane) => {
      acc[lane.turn ?? 'none'] = (acc[lane.turn ?? 'none'] ?? 0) + 1;
      return acc;
    }, {});
    expect(turns.straight).toBe(6);
    expect(turns.left).toBe(4);
    expect(turns.right).toBe(4);
    expect(turns.uturn).toBeUndefined();
  });

  it('gives the inner lane the left turn and the outer lane the right turn', () => {
    const network = buildRoadNetwork(crossroads(), flat);
    const inner = network.lanes.get('ew-1:forward:0');
    const outer = network.lanes.get('ew-1:forward:1');
    expect(inner).toBeDefined();
    expect(outer).toBeDefined();
    const turnsOf = (laneId: string) => (network.lanes.get(laneId)?.next ?? []).map((id) => network.lanes.get(id)?.turn).sort();
    expect(turnsOf(inner!.id)).toEqual(['left', 'straight']);
    expect(turnsOf(outer!.id)).toEqual(['right', 'straight']);
    expect(inner!.adjacent).toContain(outer!.id);
    expect(outer!.adjacent).toContain(inner!.id);
  });

  it('keeps every link bidirectional and every connector touching its neighbours', () => {
    const graph = new RoadGraph(buildRoadNetwork(crossroads('stop'), flat));
    const invariants = graph.invariants();
    expect(invariants.everyLaneHasPoints).toBe(true);
    expect(invariants.noNaNCoordinates).toBe(true);
    expect(invariants.everyLinkIsBidirectional).toBe(true);
    expect(invariants.connectorsTouchNeighbours).toBe(true);
    expect(invariants.strandedLaneIds).toEqual([]);
    expect(invariants.maxConnectorGapM).toBeLessThan(0.01);
  });

  it('builds a roundabout as a circulating ring with an entry and an exit per arm', () => {
    const spec: NetworkSpec = {
      nodes: [
        { id: 'w', x: -200, z: 0, edge: true },
        { id: 'e', x: 200, z: 0, edge: true },
        { id: 'n', x: 0, z: -200, edge: true },
        { id: 'r', x: 0, z: 0, roundabout: { radius: 18 } },
      ],
      roads: [
        { id: 'w-r', class: 'collector', from: 'w', to: 'r', forward: 1, backward: 1 },
        { id: 'r-e', class: 'collector', from: 'r', to: 'e', forward: 1, backward: 1 },
        { id: 'n-r', class: 'collector', from: 'n', to: 'r', forward: 1, backward: 1 },
      ],
    };
    const network = buildRoadNetwork(spec, flat);
    const roundabout = network.roundabouts.get('r');
    expect(roundabout).toBeDefined();
    expect(roundabout?.approaches).toHaveLength(3);
    const ring = [...network.lanes.values()].filter((lane) => lane.kind === 'ring');
    expect(ring).toHaveLength(6);
    for (const lane of ring) {
      expect(lane.next.length).toBeGreaterThanOrEqual(1);
      for (const point of lane.points) {
        expect(Math.hypot(point.x, point.z)).toBeCloseTo(18, 0);
      }
    }
    const enters = [...network.lanes.values()].filter((lane) => lane.turn === 'enter');
    const exits = [...network.lanes.values()].filter((lane) => lane.turn === 'exit');
    expect(enters).toHaveLength(3);
    expect(exits).toHaveLength(3);
    const graph = new RoadGraph(network);
    const route = graph.findRoute('w-r:forward:0', 'n-r:backward:0');
    expect(route).toBeDefined();
    expect(route?.laneIds.some((id) => id.includes(':ring:'))).toBe(true);
  });

  it('attaches ramps to the outer highway lane with a diverge and a merge', () => {
    const spec: NetworkSpec = {
      nodes: [
        { id: 'h0', x: -600, z: 0, edge: true },
        { id: 'h1', x: 600, z: 0, edge: true },
        { id: 'off', x: -200, z: 0 },
        { id: 'on', x: 200, z: 0 },
        { id: 't', x: 0, z: 120, control: 'signal' },
        { id: 'south', x: 0, z: 400, edge: true },
      ],
      roads: [
        { id: 'hw', class: 'highway', from: 'h0', to: 'h1', forward: 2, backward: 2, elevation: 'control', via: [{ x: 0, z: 0, y: 12 }], cuts: ['off', 'on'] },
        { id: 'ramp-off', class: 'ramp', from: 'off', to: 't', forward: 1, backward: 0, attachFrom: { roadId: 'hw', direction: 'forward' }, via: [{ x: -60, z: 80 }] },
        { id: 'ramp-on', class: 'ramp', from: 't', to: 'on', forward: 1, backward: 0, attachTo: { roadId: 'hw', direction: 'forward' }, via: [{ x: 60, z: 80 }] },
        { id: 'stem', class: 'collector', from: 't', to: 'south', forward: 1, backward: 1 },
      ],
    };
    const network = buildRoadNetwork(spec, flat);
    const pieces = [...network.lanes.values()].filter((lane) => lane.roadId === 'hw' && lane.direction === 'forward' && lane.laneIndex === 1);
    expect(pieces).toHaveLength(3);
    expect(network.lanes.get('hw:forward:1:0')?.next).toContain('ramp-off:forward:0');
    expect(network.lanes.get('ramp-off:forward:0')?.prev).toContain('hw:forward:1:0');
    expect(network.lanes.get('ramp-on:forward:0')?.next).toContain('hw:forward:1:2');
    expect(network.lanes.get('hw:forward:1:2')?.prev).toContain('ramp-on:forward:0');
    expect(network.lanes.get('hw:forward:0:0')?.next).toEqual(['hw:forward:0:1']);
    const graph = new RoadGraph(network);
    const route = graph.findRoute('hw:forward:0:0', 'stem:forward:0');
    expect(route).toBeDefined();
    expect(route?.laneChanges).toBe(1);
    expect(route?.laneIds).toContain('ramp-off:forward:0');
  });

  it('marks the outer lane of a bus-lane road for buses only and keeps the rest open', () => {
    const spec: NetworkSpec = {
      nodes: [
        { id: 'a', x: -200, z: 0, edge: true },
        { id: 'm', x: 0, z: 0 },
        { id: 'b', x: 200, z: 0, edge: true },
      ],
      roads: [
        { id: 'bus-1', class: 'arterial', from: 'a', to: 'm', forward: 2, backward: 2, busLane: true },
        { id: 'bus-2', class: 'arterial', from: 'm', to: 'b', forward: 2, backward: 2, busLane: true },
      ],
    };
    const network = buildRoadNetwork(spec, flat);
    expect(network.lanes.get('bus-1:forward:1')?.access).toBe('bus');
    expect(network.lanes.get('bus-1:forward:0')?.access).toBe('all');
    expect(network.lanes.get('bus-1:backward:1')?.access).toBe('bus');
    const busConnector = [...network.lanes.values()].find((lane) => lane.kind === 'connector' && lane.prev.includes('bus-1:forward:1'));
    expect(busConnector?.access).toBe('bus');
    const carConnector = [...network.lanes.values()].find((lane) => lane.kind === 'connector' && lane.prev.includes('bus-1:forward:0'));
    expect(carConnector?.access).toBe('all');
  });

  it('keeps a toll cut as a pass-through station on a one-way highway', () => {
    const spec: NetworkSpec = {
      nodes: [
        { id: 'h0', x: -300, z: 0, edge: true },
        { id: 'toll', x: 0, z: 0, control: 'toll' },
        { id: 'h1', x: 300, z: 0, edge: true },
      ],
      roads: [{ id: 'mw', class: 'highway', from: 'h0', to: 'h1', forward: 2, backward: 0, cuts: ['toll'] }],
    };
    const network = buildRoadNetwork(spec, flat);
    const graph = new RoadGraph(network);
    expect(network.nodes.get('toll')?.isCut).toBe(true);
    expect(network.lanes.get('mw:forward:0:0')?.next).toContain('mw:forward:0:1');
    expect(graph.invariants().strandedLaneIds).toEqual([]);
    expect(graph.stats().sourceLaneCount).toBe(2);
    expect(graph.stats().sinkLaneCount).toBe(2);
  });

  it('adds a left-turn pocket that diverges from the inner lane and only turns left', () => {
    const spec = crossroads();
    spec.roads[0] = { ...spec.roads[0], pockets: [{ end: 'to', turn: 'left', length: 60 }] };
    const network = buildRoadNetwork(spec, flat);
    const graph = new RoadGraph(network);
    const pocket = network.lanes.get('ew-1:forward:pocket-left');
    expect(pocket).toBeDefined();
    expect(pocket?.pocket).toBe('left');
    expect(pocket?.prev.length).toBeGreaterThan(0);
    const turns = pocket!.next.map((id) => network.lanes.get(id)?.turn);
    expect(turns).toEqual(['left']);
    const inner = [...network.lanes.values()].find((lane) => lane.roadId === 'ew-1' && lane.direction === 'forward' && lane.laneIndex === 0 && lane.toNode === 'c');
    const innerTurns = inner!.next.map((id) => network.lanes.get(id)?.turn).filter((turn) => turn !== 'diverge');
    expect(innerTurns).not.toContain('left');
    expect(network.roads.get('ew-1')?.pocketRanges).toHaveLength(1);
    expect(innerTurns).toContain('straight');
    expect(graph.invariants().strandedLaneIds).toEqual([]);
    expect(graph.invariants().everyLinkIsBidirectional).toBe(true);
  });
});
