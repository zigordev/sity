# Sity

Sity is a Three.js scene of a small coastal city with a complete, machine-readable road network. It is the
base layer for a smart-traffic simulation: vehicles, traffic devices and control logic come later and only need
the lane graph that this scene already builds and exposes.

One Three.js unit is one meter. North is `-Z`, east is `+X`, and the sea lies east of the city.

## Geography

- A 4.2 km² site (1,732 m east to west, 2,432 m north to south) on a green mainland, with open sea along
  the whole east edge.
- A high snow-capped mountain fills the north-west quadrant and a lower rocky mountain the south-west corner.
- A reservoir sits between them behind a curved dam; the river it releases meanders east across the plain
  and reaches the sea through a widening estuary.
- The coast has a container terminal with two berths (north): ship-to-shore gantries over the quay, yard
  gantries over stacked containers, a transit shed, trucks on marked lanes, light masts and a fenced gate
  onto Harbour Road. A private marina and a wooden attraction pier sit north of the river mouth and a sandy
  beach with amenities south of it.
- Conifer and broadleaf forest covers the mountain foothills; meadow trees dot the open plain.
- North of the ring highway the plain opens into countryside: hedged fields with a farmstead, the village of
  Northfield around a green and a chapel, a district hospital with a helipad, and a railway running in from
  the north edge to Sity North station.

## Road network

Every road is described once in `apps/web/src/roads/plan.ts` as nodes and roads (class, lane counts,
control points, elevation mode, structures, junction control). `apps/web/src/roads/network.ts` turns that
plan into geometry and a directed lane graph, `apps/web/src/roads/graph.ts` answers routing queries over it,
and `apps/web/src/roads/render.ts` draws it.

Road classes: highway, ramp, arterial, collector, local, industrial, mountain and service roads, each with its
own lane width, shoulders, median, sidewalk, speed and marking rules (`apps/web/src/roads/classes.ts`).

Scenarios in the plan:

- A closed 2+2 ring highway around the plain: a tunnel through the snow mountain, a cable-stayed bridge over
  the river, elevated viaduct sections on piers, guardrails and a barrier median.
- Three interchanges on the ring: a diamond at Central Avenue with four ramps, a dumbbell at Main Street with
  two roundabouts, and a half-diamond serving the port at Harbour Road.
- A downtown grid with a tree-lined arterial (Central Avenue and Main Street), collectors with parking
  lanes, local streets, and a one-way pair (King Street southbound, Queen Street northbound).
- Signalised, stop-controlled and priority junctions, T-junctions, urban roundabouts, and roads that leave
  the map at its edge (vehicle sources and sinks).
- A curved collector along the river (Riverside Drive), girder bridges on Main Street and Weir Bridge Road,
  and a further bridge carrying the coastal boulevard over the estuary.
- Every dead end is a destination rather than a stub: car parks at the arena, the pier, the marina and the
  beach, a bus-station forecourt at the west end of Station Street, gated yards at the port and the depot,
  a farmyard, and a mountain road climbing the western slope to a viewpoint car park with a lookout deck.
- North of the ring: Coast Boulevard continues to the north edge; Northgate Road passes under the ring
  viaduct from the depot to a rural roundabout; Rail Road crosses the railway at a gated level crossing
  (junction control `crossing`) and serves the station forecourt with its bus and taxi bays; Northfield
  Road runs through the village to the north edge with the Chapel Lane loop and a farm track; Hospital
  Drive ends in the hospital forecourt.

Lane graph:

- Each drivable path is a `Lane` with an id, kind (`road`, `connector`, `ring`, `ramp`), sampled 3D points in
  driving order, length, speed limit, and `next`/`prev` links. Same-direction neighbours are listed in
  `adjacent` so routes can change lanes.
- Junction connectors are generated per allowed turn from the lane position (left lane turns left, right lane
  turns right), roundabouts get circulating arc lanes with entry and exit connectors, and ramps diverge from
  and merge into the outer highway lane.
- `RoadGraph` provides `successors`, `predecessors`, Dijkstra `findRoute`, `enumeratePaths`, `randomRoute`,
  network statistics and invariant checks (no stranded lanes, links closed, connectors touching).

Rendering per road: asphalt surface volume, lane and centre markings, edge lines, stop lines, crosswalks,
yield markings, parking bays, raised sidewalks with kerbs and corner fillets, planted or barrier medians,
embankment skirts, viaduct piers, bridge parapets, tunnel headwalls with wing walls, street lamps,
traffic-signal masts with heads, and stop, yield, speed and no-entry signs. Destination pads get parking
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
  an arena with floodlights, surface parking, a school with a sports field, two churches, the station
  building with its concourse and clock tower, the hospital campus with its wings and helipad, and the
  village green with a memorial.
- Countryside (`countryside.ts`): ground-hugging fields in four tones with furrows and hedgerows, and a
  farmstead with a barn, farmhouse and silo.
- `auditCity()` records every building footprint and reports any pair that overlaps and any footprint that
  crosses a pavement; the Playwright suite requires both lists to be empty.
- Vegetation (`vegetation.ts`): street trees, median trees, garden trees, riverside groves, coastal palms,
  meadow trees and mountain forests, all as three instanced tree kinds.
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
  village and hospital.
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
