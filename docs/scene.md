# Sity

Sity is a Three.js scene of a small coastal city with a complete, machine-readable road network. It is the
base layer for a smart-traffic simulation: vehicles, traffic devices and control logic come later and only need
the lane graph that this scene already builds and exposes.

One Three.js unit is one meter. North is `-Z`, east is `+X`, and the sea lies east of the city.

## Geography

- A 13.4 km² site (4,266 m east to west, 3,132 m north to south) on a green mainland, with open sea along
  the whole east edge.
- A high snow-capped mountain fills the north-west quadrant and a lower rocky mountain the south-west corner.
- A reservoir sits between them behind a curved dam; the river it releases meanders east across the plain
  and reaches the sea through a widening estuary.
- The coast has a container terminal with two berths (north): ship-to-shore gantries over the quay, yard
  gantries over stacked containers, a transit shed, trucks on marked lanes, light masts and a fenced gate
  onto Harbour Road. A private marina and an amusement pier (entrance arch, stalls, arcade, carousel, a
  spoked Ferris wheel and a roller coaster) sit north of the river mouth. South of it a 1.2 km beach runs to
  the south edge behind a promenade with railings, lamps and benches: beach huts, kiosks, umbrella and
  sunbed rows, volleyball courts, lifeguard towers, showers, boardwalks and a beach bar, all at human scale.
- West of the ring the snow mountain and the rocky mountain are both fully inside the site, with a low
  valley between them leading to the west edge and the reservoir and dam below the rocky mountain.
- Conifer and broadleaf forest covers the mountain foothills; meadow trees dot the open plain.
- North of the ring highway the plain opens into countryside: hedged fields with a farmstead, the village of
  Northfield around a green and a chapel, a district hospital with a helipad, and a railway running in from
  the north edge to Sity North station.
- West of the mountains the ground rises into low rolling hills (value-noise relief in `terrain.ts`). North
  of the pass a dense pine forest surrounds a lake; Forest Road crosses it with the hamlet of Pinewood, a
  sawmill and a lake viewpoint in the clearings. South of the pass the hills flatten into farmland: big
  hedged fields laid out around the roads, four farmsteads, a manor with its own drive, the village of
  Millbrook with a church and the farmers' co-op silos, and a wind farm along the ridge.
- Mill Brook, Pine Brook, Hill Brook and the lake outflow run through the west lands in cut channels
  (`apps/web/src/natural/streams.ts`): every road that crosses one gets a culvert with headwalls, and the
  wider brook gets a parapeted bridge.

## Road network

Every road is described once in `apps/web/src/roads/plan.ts` as nodes and roads (class, lane counts,
control points, elevation mode, structures, junction control). `apps/web/src/roads/network.ts` turns that
plan into geometry and a directed lane graph, `apps/web/src/roads/graph.ts` answers routing queries over it,
and `apps/web/src/roads/render.ts` draws it.

Road classes: highway, ramp, arterial, collector, local, industrial, mountain, rural and service roads, each
with its own lane width, shoulders, median, sidewalk, speed and marking rules
(`apps/web/src/roads/classes.ts`). A road can override its class speed (`speedKph`) and ask for turn
pockets, a bus lane, a parking lane or a cycle track.

Scenarios in the plan:

- A closed 2+2 ring highway around the plain: a tunnel through the snow mountain, a cable-stayed bridge over
  the river, elevated viaduct sections on piers, guardrails and a barrier median.
- Three interchanges on the ring: a diamond at Central Avenue with four ramps, a dumbbell at Main Street with
  two roundabouts, and a half-diamond serving the port at Harbour Road.
- A downtown grid with a tree-lined arterial (Central Avenue and Main Street), collectors with parking
  lanes, local streets, and a one-way pair (King Street southbound, Queen Street northbound).
- A trumpet interchange on the ring's south-east leg (two direct ramps, a loop and a semi-direct ramp under
  the viaduct) feeding the Southern Motorway: two one-way carriageways with a grass median that leave the
  map at the south edge, a rest area with fuel, shop and lorry parking reached by its own off- and on-ramp,
  Golf Road bridging over both carriageways, and free-flow toll gantries (junction control `toll`) near the
  edge. Bus lanes on Central Avenue and Main Street (`Lane.access = "bus"`).
- A cloverleaf where the Southern Motorway crosses the Western Motorway: four loops and four direct ramps
  with tapered diverges and merges. The Western Motorway (2+2 with a barrier median) starts at a roundabout
  on Coast Boulevard, runs west in a tunnel under the rocky mountain, passes a diamond interchange at Farm
  Road and a westbound services area with its own off- and on-ramp, then toll gantries before the west edge.
- Left-turn pockets (`RoadSpec.pockets`) at the signalised junctions of Central Avenue, Main Street and
  Coast Boulevard: the arterial median is 7 m wide, so a pocket lane splits off the inner lane through a
  diverge connector, gets its own stop line, arrows and a painted island, and the inner lane loses the
  left turn.
- A lane drop on the Southern Motorway southbound (three lanes to two): the last 60 m of the dropped lane
  are hatched behind a solid line.
- Cycle tracks (`cycleTrack`) on Coast Boulevard and Riverside Drive: a 1.6 m track on each sidewalk with
  bicycle symbols.
- A school zone on South Bank Road beside the school (`speedKph: 30`): zigzag kerb markings, painted
  warning triangles, school and 30 km/h signs, and lanes that carry the lower limit.
- Signalised, stop-controlled and priority junctions, T-junctions, urban roundabouts, rural roundabouts,
  cul-de-sacs, and roads that leave the map at its edge (vehicle sources and sinks: both motorways, Coast
  Boulevard, Main Street, Northfield Road, Farm Road, Forest Road and Mill Road).
- A curved collector along the river (Riverside Drive), girder bridges on Main Street and Weir Bridge Road,
  and a further bridge carrying the coastal boulevard over the estuary.
- Every dead end is a destination rather than a stub: car parks at the arena, the pier, the marina, the
  beach, the golf club and the col village, a bus-station forecourt at the west end of Station Street,
  gated yards at the port, the depot, the campsite and a farm, and viewpoints at Westhill and above the
  reservoir.
- Rural and mountain roads: Forest Road drops from the Westhill fork through the forest and under the ring
  viaduct to a valley roundabout; Valley Road runs west between the mountains to a roundabout at the pass;
  Col Road climbs the rocky mountain in three hairpin switchbacks to an alpine village with chalets, a car
  park and a chairlift; Golf Road and Camp Lane serve a golf course and a campsite south of the ring.
- West of the pass (rural class: 80 km/h, shoulders and edge lines, no sidewalks): Forest Road continues
  through the pine forest past the lake to the west edge, with the Pinewood lanes, the sawmill lane and the
  lake-view track; Farm Road runs south over the hills, through the diamond and over the motorway on its own
  bridge to the south edge; Mill Road runs west through Millbrook to the west edge; farm tracks end in
  farmyards, Church Lane in a cul-de-sac and the manor drive in its car park.
- North of the ring: Coast Boulevard continues to the north edge; Northgate Road passes under the ring
  viaduct from the depot to a rural roundabout; Rail Road crosses the railway at a gated level crossing
  (junction control `crossing`) and serves the station forecourt with its bus and taxi bays; Northfield
  Road runs through the village to the north edge with the Chapel Lane loop and a farm track; Hospital
  Drive ends in the hospital forecourt.

Lane graph:

- Each drivable path is a `Lane` with an id, kind (`road`, `connector`, `ring`, `ramp`), access (`all` or
  `bus`), sampled 3D points in driving order, length, speed limit, and `next`/`prev` links. Same-direction
  neighbours are listed in `adjacent` so routes can change lanes; a pocket lane is marked `pocket: "left"`.
- Junction connectors are generated per allowed turn from the lane position (left lane turns left, right lane
  turns right), roundabouts get circulating arc lanes with entry and exit connectors, and ramps diverge from
  and merge into the outer highway lane.
- `RoadGraph` provides `successors`, `predecessors`, Dijkstra `findRoute`, `enumeratePaths`, `randomRoute`,
  network statistics and invariant checks (no stranded lanes, links closed, connectors touching).

Rendering per road: asphalt surface volume, lane and centre markings, edge lines, stop lines, crosswalks,
yield markings, bus-lane tint, pocket arrows and painted islands, lane-drop chevrons, cycle tracks,
school-zone zigzags, parking bays, raised sidewalks with kerbs and corner fillets, planted or barrier
medians, embankment skirts, viaduct piers, bridge parapets, tunnel portals with headwalls and wing walls at
every tunnel mouth, toll gantries, guardrails, street lamps, traffic-signal masts with heads, bus shelters,
and stop, yield, speed, school and no-entry signs. Destination pads get parking
stalls, kerbed footways, lamps, fences with barrier arms and a gatehouse, bus shelters or a railed lookout
deck according to their kind.

The terrain follows the roads rather than the other way round: cut points are registered along the
centreline and both pavement edges of every road (so a road on a side slope gets a cutting on the uphill
side and an embankment on the downhill side), the cutting continues a few metres into each tunnel so the
portal face stands in it, and the terrain meshes clamp to the lowest limit of the nearest road.

## Railway

`apps/web/src/rail/railway.ts` lays the North Line as ballast, sleepers, rails and catenary from the north
edge to buffer stops at Sity North, with two platforms (canopy and shelters), a standing three-car train,
and level-crossing furniture (barrier arms, crossbucks, lights, stop lines and a crossing deck) at every
road junction whose control is `crossing`. The line registers a corridor so lots, trees and terrain relief
keep clear of it.

## City

`apps/web/src/city` fills the blocks between the streets:

- Districts (`districts.ts`) decide lot sizes and building types: downtown towers on podiums, mid-rise
  plaster, brick and concrete blocks, suburban houses with pitched roofs and gardens, industrial sheds by the
  port, and hotels along the coast boulevard.
- Lots (`lots.ts`) are cut along every urban frontage, checked against road pavements (including junction
  corners and destination pads), water, slopes and a raster of already-used ground, then filled with
  instanced buildings (`buildings.ts`) whose facades (window grid, floor bands, glass, roofs) come from a
  shader keyed by per-instance attributes. A building on a sloping lot stands on a plinth that meets the
  ground at every corner, and district zones flatten the terrain micro-relief under the city.
- Special blocks (`landmarks.ts`): a civic plaza with a domed hall and fountain, a central park with a pond,
  an arena with floodlights, surface parking, a multi-storey car park, a school with a sports field, three
  churches, the station building with its concourse and clock tower, the hospital campus with its wings
  and helipad, the village green with a memorial, two motorway services (fuel canopy, shop, car and lorry
  parking), a golf course with greens, bunkers, a pond and a clubhouse, a campsite with pitches, tents and
  caravans, the col chairlift with pylons, cable and chairs up the mountain, a sawmill with its log yard, a
  manor house in its grounds, the Millbrook co-op with silos, and a wind farm.
- Countryside (`countryside.ts`): ground-hugging fields in four tones with furrows and hedgerows around
  Northfield, a farmland grid generated west of the hills (each cell fitted around roads, streams, lots and
  slopes), and farmyards with a farmhouse, barn, shed and silos.
- `auditCity()` records every building footprint and reports any pair that overlaps and any footprint that
  crosses a pavement; the Playwright suite requires both lists to be empty.
- Vegetation (`vegetation.ts`): street trees, median trees, garden trees, riverside groves, coastal palms,
  meadow trees, mountain forests and the dense western pine forest, all as four instanced tree kinds.
- Buildings tall enough to have a flat roof carry instanced rooftop plant (vents, tanks, lift motor rooms).

## Vehicles

`apps/web/src/vehicles/parked.ts` fills about half of every parking bay (the marked bays of parking-lane
streets and the stalls of every car park, forecourt and yard) with instanced parked cars in seven colours,
on their own scene layer. The bays themselves are exported as `roadSideSlots.parkingBays` with a heading,
and bus stops (shelter, bench, flag) stand every 240 m along arterials and collectors as
`roadSideSlots.busStops`, so the traffic simulation can later park, unpark and stop at real places.

## Interface

- Layers: terrain and water, waterfront, roads, signals/lamps/signs, buildings, vegetation, parked
  vehicles, lane graph overlay (coloured by lane kind with direction arrows), and the compass/scale helpers.
- Views: camera presets that fly to the overview, downtown, street level, interchange, roundabouts,
  riverside, river bridge, tunnel, mountain road, port, beach, suburb, dam, North station, level crossing,
  village, hospital, trumpet, motorway, services, Col Road, valley, pier, cloverleaf, west portal,
  farmland, Millbrook, Pinewood, forest lake, turn pockets and school zone.
- Routing: a random route through the lane graph is drawn on the roads with its length and endpoints.
- A compass whose N points to true north (`-Z`) and an axis widget with metre references.

## Debug API

`window.__SITY_DEBUG__` exposes the site layout, natural features (including the sampled river path),
road graph statistics and invariants, the exported graph (`exportRoadGraph`), `findRoute`,
`showRandomRoute`, `getRoadSamples`, `listDeadEnds`, `probeTerrain` (ground, cut limit and mountain heights
at a point), city statistics, `auditCity`, layer visibility, performance estimates, camera views
(`listViews`, `flyTo`, `setView`) and the lane overlay toggle. The Playwright suite drives the scene
through this API.

## Next steps

- Vehicles that follow lanes, obey connectors, change lanes and respect junction control.
- Traffic devices (signal controllers, detectors, variable signs) attached to junctions and lanes, and the
  control logic that reroutes traffic with the graph.
- Replace generated textures and models with authored production assets through the existing manifest
  pipeline (GLTF, KTX2, Draco, Meshopt).
