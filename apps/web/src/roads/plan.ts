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
const crossing: JunctionControl = "crossing";
const toll: JunctionControl = "toll";

export const RING_ROAD_ID = "ring-highway";
export const RING_TUNNEL_CONTROLS = { from: 0, to: 3 };
export const RING_BRIDGE_CONTROLS = { from: 12, to: 13 };

node("ring-e-n", 651, -440);
node("ring-e-s", 638, -120);
node("ring-n-off", 520, -716);
node("ring-n-on", 450, -724);
node("ring-s-e", 300, 840);
node("ring-s-w", -60, 900);
node("ring-t-c", 545, 526);
node("ring-t-b", 500, 635);
node("ring-t-a", 350, 807);

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
    { x: 510, z: 620, y: 13 },
    { x: 410, z: 770, y: 12 },
    { x: 250, z: 870, y: 12 },
    { x: 60, z: 900, y: 12 },
    { x: -120, z: 900, y: 12 },
    { x: -250, z: 820, y: 12 },
    { x: -320, z: 660, y: 12 },
    { x: -335, z: 400, y: 12 },
    { x: -330, z: 290, y: 13 },
    { x: -420, z: 205, y: 18 },
    { x: -540, z: 125, y: 24 },
  ],
  cuts: ["ring-n-off", "ring-n-on", "ring-e-n", "ring-e-s", "ring-t-c", "ring-t-b", "ring-t-a", "ring-s-e", "ring-s-w"],
  structures: [
    { kind: "tunnel", fromControl: RING_TUNNEL_CONTROLS.from, toControl: RING_TUNNEL_CONTROLS.to },
    { kind: "bridge", fromControl: RING_BRIDGE_CONTROLS.from, toControl: RING_BRIDGE_CONTROLS.to },
  ],
});

node("blvd-port-north", 760, -866);
node("blvd-rail", 760, -1000, { control: signal });
node("blvd-hospital", 760, -1190, { control: signal });
node("blvd-village", 760, -1340, { control: stop });
node("blvd-n-edge", 760, -1566, { edge: true });
node("blvd-harbour", 760, -560, { control: signal });
node("blvd-station", 760, -400, { control: signal });
node("blvd-central", 760, -280, { control: signal });
node("blvd-market", 760, -160, { control: signal });
node("blvd-bridge-n", 760, -100);
node("blvd-bridge-s", 760, 290);
node("blvd-southbank", 760, 520, { control: signal });
node("blvd-beach", 760, 740, { control: signal });
node("beach-park-end", 716, 740, { destination: { kind: "parking", width: 44, depth: 50, name: "Beach car park" } });
node("blvd-golf", 760, 1100, { control: signal });
node("blvd-resort", 760, 1320, { control: stop });
node("blvd-s-edge", 760, 1566, { edge: true });

chain("coast-blvd-nx", "arterial", ["blvd-n-edge", "blvd-village", "blvd-hospital", "blvd-rail", "blvd-port-north"], 2, 2, { name: "Coast Boulevard" });
chain("coast-blvd-n", "arterial", ["blvd-port-north", "blvd-harbour", "blvd-station", "blvd-central", "blvd-market", "blvd-bridge-n"], 2, 2, { name: "Coast Boulevard" });

node("station-access", 630, -1000, { control: stop });
node("rail-crossing", 520, -1000, { control: crossing });
node("northgate-rb", 400, -1000, { roundabout: { radius: 20 } });
chain("rail-road", "collector", ["blvd-rail", "station-access", "rail-crossing", "northgate-rb"], 1, 1, { name: "Rail Road" });
node("station-forecourt", 600, -905, { destination: { kind: "forecourt", width: 56, depth: 60, name: "Sity North station" } });
road("station-approach", "local", "station-access", "station-forecourt", 1, 1, { name: "Station Approach", via: [{ x: 606, z: -968 }, { x: 600, z: -940 }] });

node("hospital-end", 716, -1190, { destination: { kind: "forecourt", width: 60, depth: 44, name: "Northfield hospital" } });
road("hospital-drive", "collector", "blvd-hospital", "hospital-end", 1, 1, { name: "Hospital Drive" });

node("village-s", 420, -1150, { control: stop });
node("village-n", 430, -1330, { control: stop });
node("north-edge-w", 430, -1566, { edge: true });
chain("northfield-road", "collector", ["northgate-rb", "village-s", "village-n", "north-edge-w"], 1, 1, { name: "Northfield Road" });
node("chapel-e1", 484, -1172, { control: stop });
node("chapel-e2", 484, -1308, { control: stop });
road("chapel-lane-1", "local", "village-s", "chapel-e1", 1, 1, { name: "Chapel Lane" });
road("chapel-lane-2", "local", "chapel-e1", "chapel-e2", 1, 1, { name: "Chapel Lane" });
road("chapel-lane-3", "local", "chapel-e2", "village-n", 1, 1, { name: "Chapel Lane" });
node("farm-end", 330, -1470, { destination: { kind: "yard", width: 36, depth: 30, name: "Northfield farm" } });
road("farm-track", "local", "village-n", "farm-end", 1, 1, { name: "Farm Track", via: [{ x: 380, z: -1400 }] });

road("northgate-road", "collector", "depot-park", "northgate-rb", 1, 1, {
  name: "Northgate Road",
  via: [
    { x: 395, z: -652 },
    { x: 350, z: -680 },
    { x: 342, z: -740 },
    { x: 350, z: -850 },
    { x: 380, z: -950 },
  ],
});
road("coast-blvd-bridge", "arterial", "blvd-bridge-n", "blvd-bridge-s", 2, 2, {
  name: "Coast Boulevard",
  elevation: "control",
  via: [
    { x: 760, z: -34, y: 8.4 },
    { x: 760, z: 224, y: 8.4 },
  ],
  structures: [{ kind: "bridge", fromControl: 1, toControl: 2 }],
});
chain("coast-blvd-s", "arterial", ["blvd-bridge-s", "blvd-southbank", "blvd-beach"], 2, 2, { name: "Coast Boulevard" });
chain("coast-blvd-ss", "arterial", ["blvd-beach", "blvd-golf", "blvd-resort", "blvd-s-edge"], 2, 2, { name: "Coast Boulevard" });
road("beach-park-access", "local", "blvd-beach", "beach-park-end", 1, 1, { name: "Beach Park Access" });

node("golf-access", 640, 1100, { control: stop });
node("camp-access", 300, 1100, { control: stop });
node("main-golf", 120, 1100, { control: signal });
node("main-s-edge", 120, 1566, { edge: true });
road("golf-road-1", "rural", "blvd-golf", "golf-access", 1, 1, { name: "Golf Road" });
road("golf-road-2", "rural", "golf-access", "camp-access", 1, 1, {
  name: "Golf Road",
  elevation: "control",
  via: [
    { x: 560, z: 1100, y: 9 },
    { x: 410, z: 1100, y: 9 },
  ],
  structures: [{ kind: "bridge", fromControl: 1, toControl: 2 }],
});
road("golf-road-3", "rural", "camp-access", "main-golf", 1, 1, { name: "Golf Road" });
node("golf-club", 640, 1178, { destination: { kind: "parking", width: 54, depth: 60, name: "Golf club" } });
road("golf-drive", "local", "golf-access", "golf-club", 1, 1, { name: "Golf Drive" });
node("camp-end", 300, 1182, { destination: { kind: "yard", width: 40, depth: 32, name: "Campsite" } });
road("camp-lane", "local", "camp-access", "camp-end", 1, 1, { name: "Camp Lane" });

node("smw-sb-n", 470, 940);
node("smw-sb-edge", 470, 1566, { edge: true });
node("smw-nb-n", 500, 940);
node("smw-nb-edge", 500, 1566, { edge: true });
node("svc-sb-off", 470, 1190);
node("svc-sb-on", 470, 1400);
node("toll-sb", 470, 1500, { control: toll });
node("toll-nb", 500, 1500, { control: toll });
export const SOUTH_MOTORWAY_SB_ID = "motorway-south-sb";
export const SOUTH_MOTORWAY_NB_ID = "motorway-south-nb";
road(SOUTH_MOTORWAY_SB_ID, "highway", "smw-sb-n", "smw-sb-edge", 2, 0, {
  name: "Southern Motorway",
  spacing: 6,
  via: [{ x: 470, z: 1250 }],
  cuts: ["svc-sb-off", "svc-sb-on", "toll-sb"],
});
road(SOUTH_MOTORWAY_NB_ID, "highway", "smw-nb-edge", "smw-nb-n", 2, 0, {
  name: "Southern Motorway",
  spacing: 6,
  via: [{ x: 500, z: 1250 }],
  cuts: ["toll-nb"],
});
road("ramp-t1", "ramp", "ring-t-a", "smw-sb-n", 1, 0, {
  name: "Southern Motorway link",
  attachFrom: { roadId: RING_ROAD_ID, direction: "backward" },
  via: [{ x: 445, z: 820 }, { x: 460, z: 880 }],
});
road("ramp-t3", "ramp", "ring-t-b", "smw-sb-n", 1, 0, {
  name: "Southern Motorway loop",
  attachFrom: { roadId: RING_ROAD_ID, direction: "forward" },
  via: [
    { x: 423, z: 714 },
    { x: 393, z: 708 },
    { x: 377, z: 682 },
    { x: 383, z: 652 },
    { x: 409, z: 636 },
    { x: 439, z: 642 },
    { x: 477, z: 669 },
    { x: 485, z: 700 },
    { x: 480, z: 800 },
    { x: 472, z: 880 },
  ],
});
road("ramp-t2", "ramp", "smw-nb-n", "ring-t-c", 1, 0, {
  name: "Ring north-east link",
  attachTo: { roadId: RING_ROAD_ID, direction: "backward" },
  via: [{ x: 506, z: 850 }, { x: 513, z: 740 }, { x: 518, z: 650 }],
});
road("ramp-t4", "ramp", "smw-nb-n", "ring-t-a", 1, 0, {
  name: "Ring south-west link",
  attachTo: { roadId: RING_ROAD_ID, direction: "forward" },
  via: [{ x: 485, z: 860 }, { x: 456, z: 790 }, { x: 440, z: 726 }, { x: 426, z: 741 }],
});
node("svc-sb-in", 400, 1250, { control: stop });
node("svc-sb-out", 400, 1340, { control: stop });
road("ramp-svc-sb-off", "ramp", "svc-sb-off", "svc-sb-in", 1, 0, {
  name: "Services exit",
  attachFrom: { roadId: SOUTH_MOTORWAY_SB_ID, direction: "forward" },
  via: [{ x: 430, z: 1226 }],
});
road("services-sb-road", "service", "svc-sb-in", "svc-sb-out", 1, 0, { name: "Services road", via: [{ x: 386, z: 1295 }] });
road("ramp-svc-sb-on", "ramp", "svc-sb-out", "svc-sb-on", 1, 0, {
  name: "Services entry",
  attachTo: { roadId: SOUTH_MOTORWAY_SB_ID, direction: "forward" },
  via: [{ x: 430, z: 1368 }],
});

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
chain("central-avenue", "arterial", ["central-west", "central-main", "central-oneway-s", "central-oneway-n", "central-park", "central-x520", "central-ramp-w", "central-ramp-e", "blvd-central"], 2, 2, { name: "Central Avenue", busLane: true });

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

road("main-street-1", "arterial", "central-main", "market-main", 2, 2, { name: "Main Street", busLane: true });
road("main-street-2", "arterial", "market-main", "bridge-main", 2, 2, { name: "Main Street", busLane: true });
road("main-street-2b", "arterial", "bridge-main", "riverside-main", 2, 2, { name: "Main Street", busLane: true });
node("main-southbank", 120, 520, { control: signal });
node("rb-s-n", 120, 800, { roundabout: { radius: 18 } });
node("rb-s-s", 120, 980, { roundabout: { radius: 18 } });
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
road("main-street-5", "arterial", "rb-s-s", "main-golf", 2, 2, { name: "Main Street" });
road("main-street-6", "arterial", "main-golf", "main-s-edge", 2, 2, { name: "Main Street" });

road("ramp-s-wb-off", "ramp", "ring-s-e", "rb-s-n", 1, 0, {
  name: "Main WB off-ramp",
  attachFrom: { roadId: RING_ROAD_ID, direction: "forward" },
  via: [{ x: 200, z: 828 }],
});
road("ramp-s-wb-on", "ramp", "rb-s-n", "ring-s-w", 1, 0, {
  name: "Main WB on-ramp",
  attachTo: { roadId: RING_ROAD_ID, direction: "forward" },
  via: [{ x: 50, z: 842 }],
});
road("ramp-s-eb-off", "ramp", "ring-s-w", "rb-s-s", 1, 0, {
  name: "Main EB off-ramp",
  attachFrom: { roadId: RING_ROAD_ID, direction: "backward" },
  via: [{ x: 40, z: 958 }],
});
road("ramp-s-eb-on", "ramp", "rb-s-s", "ring-s-e", 1, 0, {
  name: "Main EB on-ramp",
  attachTo: { roadId: RING_ROAD_ID, direction: "backward" },
  via: [{ x: 210, z: 962 }],
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
chain("southbank-road", "collector", ["southbank-w-end", "southbank-x-60", "southbank-x30", "main-southbank", "southbank-x220", "southbank-x320", "blvd-southbank"], 1, 1, { name: "South Bank Road" });

node("orchard-x-60", -60, 640, { control: stop });
node("orchard-x30", 30, 640);
node("orchard-x220", 220, 640);
node("orchard-x320", 320, 640, { control: stop });
road("cedar-lane", "local", "southbank-x-60", "orchard-x-60", 1, 1, { name: "Cedar Lane" });
road("birch-lane", "local", "southbank-x30", "orchard-x30", 1, 1, { name: "Birch Lane" });
road("orchard-lane-w", "local", "orchard-x-60", "orchard-x30", 1, 1, { name: "Orchard Lane" });
road("maple-lane", "local", "southbank-x220", "orchard-x220", 1, 1, { name: "Maple Lane" });
road("willow-lane", "local", "southbank-x320", "orchard-x320", 1, 1, { name: "Willow Lane" });
road("orchard-lane-e1", "local", "orchard-x220", "orchard-x320", 1, 1, { name: "Orchard Lane" });

node("mountain-fork", -235, -118, { control: stop });
node("mountain-viewpoint", -250, -70, { destination: { kind: "viewpoint", width: 40, depth: 44, name: "Westhill viewpoint" } });
road("mountain-road-1", "mountain", "central-west", "mountain-fork", 1, 1, {
  name: "Mountain Road",
  via: [
    { x: -10, z: -268 },
    { x: -70, z: -236 },
    { x: -130, z: -196 },
    { x: -190, z: -150 },
  ],
});
road("mountain-road-2", "mountain", "mountain-fork", "mountain-viewpoint", 1, 1, { name: "Mountain Road", via: [{ x: -262, z: -98 }] });

node("valley-x", -680, 340, { roundabout: { radius: 16 } });
node("valley-w-edge", -1366, 255, { edge: true });
node("lake-view", -600, 352, { destination: { kind: "viewpoint", width: 36, depth: 40, name: "Reservoir viewpoint" } });
node("col-village", -1200, 590, { destination: { kind: "parking", width: 40, depth: 44, name: "Col village" } });
road("forest-road", "mountain", "mountain-fork", "valley-x", 1, 1, {
  name: "Forest Road",
  via: [
    { x: -310, z: -60 },
    { x: -400, z: 40 },
    { x: -440, z: 110 },
    { x: -478, z: 166 },
    { x: -560, z: 240 },
    { x: -640, z: 300 },
  ],
});
road("valley-road", "rural", "valley-x", "valley-w-edge", 1, 1, {
  name: "Valley Road",
  via: [
    { x: -800, z: 300 },
    { x: -1000, z: 275 },
    { x: -1200, z: 262 },
  ],
});
road("lake-view-road", "rural", "valley-x", "lake-view", 1, 1, { name: "Reservoir Road" });
node("col-x", -1150, 570, { control: stop });
node("col-lane-end", -1230, 480, { destination: { kind: "culdesac", width: 0, depth: 0 } });
road("col-road-1", "mountain", "valley-x", "col-x", 1, 1, {
  name: "Col Road",
  via: [
    { x: -760, z: 368 },
    { x: -940, z: 398 },
    { x: -975, z: 405 },
    { x: -1000, z: 425 },
    { x: -980, z: 448 },
    { x: -830, z: 495 },
    { x: -812, z: 515 },
    { x: -830, z: 536 },
    { x: -1000, z: 556 },
  ],
});
road("col-road-2", "mountain", "col-x", "col-village", 1, 1, { name: "Col Road" });
road("col-lane", "local", "col-x", "col-lane-end", 1, 1, { name: "Col Lane", via: [{ x: -1180, z: 520 }] });

node("hollow-end", 372, -1352, { destination: { kind: "culdesac", width: 0, depth: 0 } });
road("hollow-lane", "local", "village-n", "hollow-end", 1, 1, { name: "Hollow Lane" });

export const NETWORK_SPEC: NetworkSpec = { nodes, roads };
