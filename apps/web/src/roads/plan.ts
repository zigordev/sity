import type { NetworkSpec, NodeSpec, RoadSpec, JunctionControl } from "./network";
import type { RoadClass } from "./classes";

type NodeExtra = Partial<Omit<NodeSpec, "id" | "x" | "z">>;
type RoadExtra = Partial<Omit<RoadSpec, "id" | "class" | "from" | "to" | "forward" | "backward">>;

const nodes: NodeSpec[] = [];
const roads: RoadSpec[] = [];

function node(id: string, x: number, z: number, extra: NodeExtra = {}) {
  nodes.push({ id, x, z, ...extra });
  return id;
}

function road(
  id: string,
  cls: RoadClass,
  from: string | undefined,
  to: string | undefined,
  forward: number,
  backward: number,
  extra: RoadExtra = {},
) {
  roads.push({ id, class: cls, from, to, forward, backward, ...extra });
  return id;
}

function chain(
  idPrefix: string,
  cls: RoadClass,
  nodeIds: string[],
  forward: number,
  backward: number,
  extra: RoadExtra = {},
) {
  for (let index = 0; index < nodeIds.length - 1; index += 1) {
    road(`${idPrefix}-${index + 1}`, cls, nodeIds[index], nodeIds[index + 1], forward, backward, extra);
  }
}

const signal: JunctionControl = "signal";
const stop: JunctionControl = "stop";

export const RING_ROAD_ID = "ring-highway";
export const RING_TUNNEL_CONTROLS = { from: 0, to: 3 };
export const RING_BRIDGE_CONTROLS = { from: 12, to: 13 };

node("ring-e-n", 651, -440);
node("ring-e-s", 638, -120);
node("ring-n-off", 520, -716);
node("ring-n-on", 450, -724);
node("ring-s-e", 300, 665);
node("ring-s-w", -40, 690);

road(RING_ROAD_ID, "highway", undefined, undefined, 2, 2, {
  name: "Ring Highway",
  closed: true,
  elevation: "control",
  spacing: 6,
  via: [
    { x: -660, z: 50, y: 30 },
    { x: -560, z: -260, y: 31 },
    { x: -250, z: -560, y: 32 },
    { x: 125, z: -672, y: 33 },
    { x: 300, z: -712, y: 22 },
    { x: 470, z: -722, y: 13 },
    { x: 600, z: -692, y: 13 },
    { x: 650, z: -600, y: 13 },
    { x: 650, z: -470, y: 13 },
    { x: 642, z: -300, y: 12 },
    { x: 636, z: -130, y: 12 },
    { x: 626, z: 40, y: 13 },
    { x: 616, z: 110, y: 14 },
    { x: 590, z: 350, y: 14 },
    { x: 566, z: 470, y: 13 },
    { x: 470, z: 585, y: 12 },
    { x: 320, z: 660, y: 12 },
    { x: 140, z: 690, y: 12 },
    { x: -40, z: 690, y: 12 },
    { x: -200, z: 640, y: 12 },
    { x: -290, z: 530, y: 12 },
    { x: -335, z: 400, y: 12 },
    { x: -330, z: 290, y: 13 },
    { x: -420, z: 205, y: 18 },
    { x: -540, z: 125, y: 24 },
  ],
  cuts: ["ring-n-off", "ring-n-on", "ring-e-n", "ring-e-s", "ring-s-e", "ring-s-w"],
  structures: [
    { kind: "tunnel", fromControl: RING_TUNNEL_CONTROLS.from, toControl: RING_TUNNEL_CONTROLS.to },
    { kind: "bridge", fromControl: RING_BRIDGE_CONTROLS.from, toControl: RING_BRIDGE_CONTROLS.to },
  ],
});

node("blvd-n-edge", 760, -866, { edge: true });
node("blvd-harbour", 760, -560, { control: signal });
node("blvd-station", 760, -400, { control: signal });
node("blvd-central", 760, -280, { control: signal });
node("blvd-market", 760, -160, { control: signal });
node("blvd-bridge-n", 760, -100);
node("blvd-bridge-s", 760, 290);
node("blvd-southbank", 760, 520, { control: signal });
node("blvd-beach-end", 760, 740, { destination: { kind: "parking", width: 30, depth: 60, name: "Beach car park" } });

chain("coast-blvd-n", "arterial", ["blvd-n-edge", "blvd-harbour", "blvd-station", "blvd-central", "blvd-market", "blvd-bridge-n"], 2, 2, { name: "Coast Boulevard" });
road("coast-blvd-bridge", "arterial", "blvd-bridge-n", "blvd-bridge-s", 2, 2, {
  name: "Coast Boulevard",
  elevation: "control",
  via: [
    { x: 760, z: -34, y: 8.4 },
    { x: 760, z: 224, y: 8.4 },
  ],
  structures: [{ kind: "bridge", fromControl: 1, toControl: 2 }],
});
chain("coast-blvd-s", "arterial", ["blvd-bridge-s", "blvd-southbank", "blvd-beach-end"], 2, 2, { name: "Coast Boulevard" });

node("harbour-w-end", 290, -560, { destination: { kind: "parking", width: 64, depth: 84, name: "Arena car park" } });
node("harbour-park", 450, -560, { control: stop });
node("harbour-off", 560, -560, { control: signal });
node("harbour-on", 600, -560, { control: signal });
node("harbour-port-end", 805, -560, { destination: { kind: "yard", width: 44, depth: 20, name: "Port gate" } });
chain("harbour-road", "industrial", ["harbour-w-end", "harbour-park", "harbour-off", "harbour-on", "blvd-harbour", "harbour-port-end"], 1, 1, { name: "Harbour Road" });

node("depot-park", 450, -650);
node("depot-end", 556, -650, { destination: { kind: "yard", width: 44, depth: 32, name: "Depot yard" } });
road("park-st-north", "industrial", "harbour-park", "depot-park", 1, 1, { name: "Park Street" });
road("depot-street", "industrial", "depot-park", "depot-end", 1, 1, { name: "Depot Street" });

road("ramp-n-off", "ramp", "ring-n-off", "harbour-off", 1, 0, {
  name: "Harbour off-ramp",
  attachFrom: { roadId: RING_ROAD_ID, direction: "forward" },
  via: [{ x: 598, z: -690 }, { x: 570, z: -630 }],
});
road("ramp-n-on", "ramp", "harbour-on", "ring-n-on", 1, 0, {
  name: "Harbour on-ramp",
  attachTo: { roadId: RING_ROAD_ID, direction: "backward" },
  via: [{ x: 606, z: -640 }, { x: 604, z: -700 }, { x: 570, z: -742 }],
});

node("station-w-end", 200, -400, { destination: { kind: "forecourt", width: 46, depth: 56, name: "Bus station" } });
node("station-oneway-s", 240, -400, { control: stop });
node("station-oneway-n", 320, -400, { control: stop });
node("station-park", 450, -400, { roundabout: { radius: 20 } });
node("station-x520", 520, -400, { control: stop });
chain("station-street", "collector", ["station-w-end", "station-oneway-s", "station-oneway-n", "station-park", "station-x520", "blvd-station"], 1, 1, { name: "Station Street", parkingLane: true });

node("central-west", 40, -280, { control: stop });
node("central-main", 120, -280, { control: signal });
node("central-oneway-s", 240, -280, { control: signal });
node("central-oneway-n", 320, -280, { control: signal });
node("central-park", 450, -280, { control: signal });
node("central-x520", 520, -280, { control: signal });
node("central-ramp-w", 590, -280, { control: signal });
node("central-ramp-e", 695, -280, { control: signal });
chain("central-avenue", "arterial", ["central-west", "central-main", "central-oneway-s", "central-oneway-n", "central-park", "central-x520", "central-ramp-w", "central-ramp-e", "blvd-central"], 2, 2, { name: "Central Avenue" });

road("ramp-e-sb-off", "ramp", "ring-e-n", "central-ramp-w", 1, 0, {
  name: "Central SB off-ramp",
  attachFrom: { roadId: RING_ROAD_ID, direction: "forward" },
  via: [{ x: 596, z: -340 }],
});
road("ramp-e-sb-on", "ramp", "central-ramp-w", "ring-e-s", 1, 0, {
  name: "Central SB on-ramp",
  attachTo: { roadId: RING_ROAD_ID, direction: "forward" },
  via: [{ x: 592, z: -232 }],
});
road("ramp-e-nb-off", "ramp", "ring-e-s", "central-ramp-e", 1, 0, {
  name: "Central NB off-ramp",
  attachFrom: { roadId: RING_ROAD_ID, direction: "backward" },
  via: [{ x: 690, z: -226 }],
});
road("ramp-e-nb-on", "ramp", "central-ramp-e", "ring-e-n", 1, 0, {
  name: "Central NB on-ramp",
  attachTo: { roadId: RING_ROAD_ID, direction: "backward" },
  via: [{ x: 694, z: -330 }],
});

node("market-w-end", -60, -160, { control: stop });
node("market-west", 40, -160, { control: stop });
node("market-main", 120, -160, { control: signal });
node("market-oneway-s", 240, -160, { control: signal });
node("market-oneway-n", 320, -160, { control: signal });
node("market-park", 450, -160, { control: signal });
node("market-x520", 520, -160, { control: stop });
node("pier-end", 788, -160, { destination: { kind: "parking", width: 34, depth: 24, name: "Pier car park" } });
chain("market-street", "collector", ["market-w-end", "market-west", "market-main", "market-oneway-s", "market-oneway-n", "market-park", "market-x520", "blvd-market"], 1, 1, { name: "Market Street", parkingLane: true });
road("pier-access", "local", "blvd-market", "pier-end", 1, 1, { name: "Pier Access" });
node("marina-end", 800, -400, { destination: { kind: "parking", width: 40, depth: 48, name: "Marina car park" } });
road("marina-access", "local", "blvd-station", "marina-end", 1, 1, { name: "Marina Access" });

node("riverside-w-end", -140, 176);
node("riverside-x-60", -60, 228, { control: stop });
node("riverside-west", 40, 247, { control: stop });
node("riverside-main", 120, 215, { control: signal });
node("riverside-oneway-s", 240, 200, { control: stop });
node("riverside-oneway-n", 320, 225, { control: stop });
node("riverside-park", 450, 330, { control: signal });
node("riverside-x520", 520, 220, { control: stop });
road("riverside-1", "collector", "riverside-w-end", "riverside-x-60", 1, 1, { name: "Riverside Drive", via: [{ x: -100, z: 215 }] });
road("riverside-2", "collector", "riverside-x-60", "riverside-west", 1, 1, { name: "Riverside Drive", via: [{ x: -10, z: 262 }] });
road("riverside-3", "collector", "riverside-west", "riverside-main", 1, 1, { name: "Riverside Drive", via: [{ x: 80, z: 232 }] });
road("riverside-4", "collector", "riverside-main", "riverside-oneway-s", 1, 1, { name: "Riverside Drive", via: [{ x: 180, z: 200 }] });
road("riverside-5", "collector", "riverside-oneway-s", "riverside-oneway-n", 1, 1, { name: "Riverside Drive" });
road("riverside-6", "collector", "riverside-oneway-n", "riverside-park", 1, 1, { name: "Riverside Drive", via: [{ x: 390, z: 300 }] });
road("riverside-7", "collector", "riverside-park", "riverside-x520", 1, 1, { name: "Riverside Drive", via: [{ x: 500, z: 270 }] });
road("riverside-8", "collector", "riverside-x520", "blvd-market", 1, 1, { name: "Riverside Drive", via: [{ x: 620, z: 120 }, { x: 700, z: -40 }] });

node("bridge-west", 40, 30, { control: stop });
node("bridge-main", 120, 30, { control: signal });
node("bridge-oneway-s", 240, 30, { control: stop });
node("bridge-oneway-n", 320, 30, { control: stop });
node("bridge-park", 450, 30, { control: stop });
node("bridge-x520", 520, 30, { control: stop });
chain("bridge-street", "local", ["bridge-west", "bridge-main", "bridge-oneway-s", "bridge-oneway-n", "bridge-park", "bridge-x520"], 1, 1, { name: "Bridge Street", parkingLane: true });
road("west-street", "collector", "central-west", "market-west", 1, 1, { name: "West Street" });
road("west-street-2", "collector", "market-west", "bridge-west", 1, 1, { name: "West Street" });
road("west-street-3", "collector", "bridge-west", "riverside-west", 1, 1, { name: "West Street" });
road("elm-street", "local", "market-w-end", "riverside-x-60", 1, 1, { name: "Elm Street" });
road("weir-bridge-road", "collector", "riverside-w-end", "southbank-w-end", 1, 1, {
  name: "Weir Bridge Road",
  elevation: "control",
  via: [
    { x: -140, z: 250, y: 8.2 },
    { x: -140, z: 440, y: 8.2 },
  ],
  structures: [{ kind: "bridge", fromControl: 1, toControl: 2 }],
});

road("main-street-1", "arterial", "central-main", "market-main", 2, 2, { name: "Main Street" });
road("main-street-2", "arterial", "market-main", "bridge-main", 2, 2, { name: "Main Street" });
road("main-street-2b", "arterial", "bridge-main", "riverside-main", 2, 2, { name: "Main Street" });
node("main-southbank", 120, 520, { control: signal });
node("rb-s-n", 120, 600, { roundabout: { radius: 18 } });
node("rb-s-s", 120, 780, { roundabout: { radius: 18 } });
node("main-s-edge", 120, 866, { edge: true });
road("main-street-bridge", "arterial", "riverside-main", "main-southbank", 2, 2, {
  name: "Main Street",
  elevation: "control",
  via: [
    { x: 120, z: 278, y: 6.4 },
    { x: 120, z: 412, y: 6.4 },
  ],
  structures: [{ kind: "bridge", fromControl: 1, toControl: 2 }],
});
road("main-street-3", "arterial", "main-southbank", "rb-s-n", 2, 2, { name: "Main Street" });
road("main-street-4", "arterial", "rb-s-n", "rb-s-s", 2, 2, { name: "Main Street" });
road("main-street-5", "arterial", "rb-s-s", "main-s-edge", 2, 2, { name: "Main Street" });

road("ramp-s-wb-off", "ramp", "ring-s-e", "rb-s-n", 1, 0, {
  name: "Main WB off-ramp",
  attachFrom: { roadId: RING_ROAD_ID, direction: "forward" },
  via: [{ x: 178, z: 626 }],
});
road("ramp-s-wb-on", "ramp", "rb-s-n", "ring-s-w", 1, 0, {
  name: "Main WB on-ramp",
  attachTo: { roadId: RING_ROAD_ID, direction: "forward" },
  via: [{ x: 66, z: 632 }],
});
road("ramp-s-eb-off", "ramp", "ring-s-w", "rb-s-s", 1, 0, {
  name: "Main EB off-ramp",
  attachFrom: { roadId: RING_ROAD_ID, direction: "backward" },
  via: [{ x: 58, z: 748 }],
});
road("ramp-s-eb-on", "ramp", "rb-s-s", "ring-s-e", 1, 0, {
  name: "Main EB on-ramp",
  attachTo: { roadId: RING_ROAD_ID, direction: "backward" },
  via: [{ x: 186, z: 752 }],
});

road("king-street-1", "local", "station-oneway-s", "central-oneway-s", 2, 0, { name: "King Street", parkingLane: true });
road("king-street-2", "local", "central-oneway-s", "market-oneway-s", 2, 0, { name: "King Street", parkingLane: true });
road("king-street-3", "local", "market-oneway-s", "bridge-oneway-s", 2, 0, { name: "King Street", parkingLane: true });
road("king-street-4", "local", "bridge-oneway-s", "riverside-oneway-s", 2, 0, { name: "King Street", parkingLane: true });
road("queen-street-0", "local", "riverside-oneway-n", "bridge-oneway-n", 2, 0, { name: "Queen Street", parkingLane: true });
road("queen-street-1", "local", "bridge-oneway-n", "market-oneway-n", 2, 0, { name: "Queen Street", parkingLane: true });
road("queen-street-2", "local", "market-oneway-n", "central-oneway-n", 2, 0, { name: "Queen Street", parkingLane: true });
road("queen-street-3", "local", "central-oneway-n", "station-oneway-n", 2, 0, { name: "Queen Street", parkingLane: true });

road("park-street-1", "collector", "station-park", "central-park", 1, 1, { name: "Park Street" });
road("park-street-2", "collector", "central-park", "market-park", 1, 1, { name: "Park Street" });
road("park-street-3", "collector", "market-park", "bridge-park", 1, 1, { name: "Park Street" });
road("park-street-4", "collector", "bridge-park", "riverside-park", 1, 1, { name: "Park Street" });
road("park-street-0", "collector", "harbour-park", "station-park", 1, 1, { name: "Park Street" });

road("mill-street-1", "local", "station-x520", "central-x520", 1, 1, { name: "Mill Street" });
road("mill-street-2", "local", "central-x520", "market-x520", 1, 1, { name: "Mill Street" });
road("mill-street-3", "local", "market-x520", "bridge-x520", 1, 1, { name: "Mill Street" });
road("mill-street-4", "local", "bridge-x520", "riverside-x520", 1, 1, { name: "Mill Street" });

node("southbank-w-end", -140, 520);
node("southbank-x-60", -60, 520, { control: stop });
node("southbank-x30", 30, 520, { control: stop });
node("southbank-x220", 220, 520, { control: stop });
node("southbank-x320", 320, 520, { control: stop });
node("southbank-x420", 420, 520, { control: stop });
chain("southbank-road", "collector", ["southbank-w-end", "southbank-x-60", "southbank-x30", "main-southbank", "southbank-x220", "southbank-x320", "southbank-x420", "blvd-southbank"], 1, 1, { name: "South Bank Road" });

node("orchard-x-60", -60, 640, { control: stop });
node("orchard-x30", 30, 640);
node("orchard-x220", 220, 640);
node("orchard-x320", 320, 640, { control: stop });
node("orchard-x420", 420, 640, { control: stop });
road("cedar-lane", "local", "southbank-x-60", "orchard-x-60", 1, 1, { name: "Cedar Lane" });
road("birch-lane", "local", "southbank-x30", "orchard-x30", 1, 1, { name: "Birch Lane" });
road("orchard-lane-w", "local", "orchard-x-60", "orchard-x30", 1, 1, { name: "Orchard Lane" });
road("maple-lane", "local", "southbank-x220", "orchard-x220", 1, 1, { name: "Maple Lane" });
road("willow-lane", "local", "southbank-x320", "orchard-x320", 1, 1, { name: "Willow Lane" });
road("ash-lane", "local", "southbank-x420", "orchard-x420", 1, 1, { name: "Ash Lane" });
road("orchard-lane-e1", "local", "orchard-x220", "orchard-x320", 1, 1, { name: "Orchard Lane" });
road("orchard-lane-e2", "local", "orchard-x320", "orchard-x420", 1, 1, { name: "Orchard Lane" });

node("mountain-viewpoint", -250, -70, { destination: { kind: "viewpoint", width: 40, depth: 44, name: "Westhill viewpoint" } });
road("mountain-road", "mountain", "central-west", "mountain-viewpoint", 1, 1, {
  name: "Mountain Road",
  via: [
    { x: -10, z: -268 },
    { x: -70, z: -236 },
    { x: -130, z: -196 },
    { x: -190, z: -150 },
    { x: -235, z: -118 },
    { x: -262, z: -98 },
  ],
});

export const NETWORK_SPEC: NetworkSpec = { nodes, roads };
