# Sity Baseline

The project is now a minimal geographic and road-network baseline before any
city building, vehicle, pedestrian, or smart-infrastructure logic is added.

## Current Scene

- One 3 km2 green planning boundary on mainland, now modeled as a shallow terrain slab with visible earth-cut sides.
- Grey land around that green boundary to show terrain outside the city limits.
- Open sea east of the mainland coastline.
- A mainland beach north of the river mouth, bounded by the river's north bank instead of crossing to the opposite side.
- A shallow volumetric beach and darker wet-sand band along the beach's sea edge.
- A raised wooden attraction pier south of the river mouth, starting on land and extending into the sea.
- Instanced support piles under the attraction pier and private marina docks.
- A raised concrete cargo port with two big-ship berths.
- Static cargo-port details: container stacks, bollards, and two small cranes.
- A separate raised private marina with four leisure-boat berths.
- Soft directional shadows for 3D terrain and raised artificial structures.
- A UI compass whose north direction points from the mainland toward the sea.
- A UI axis scale widget whose X, Y, and Z directions rotate with the camera and show meter-based size references.
- A UI control pane for natural, artificial, roads, and help scene-element visibility.
- A clipped mountain in the southwest corner with a lifted 42 m foothill blend into the grass.
- A separate clipped snow-capped mountain mass whose center is outside the southwest boundary, leaving only about a quarter visible with filled rock/snow cut faces and a wider horizontal footprint.
- A flat-topped volumetric reservoir lake enclosed by a natural mountain bank with a clear outlet opening for the dam.
- A curved dam spanning the reservoir outlet without natural bank geometry underneath it.
- Natural terrain abutments and sloped shore-closure wings at both dam ends to merge the dam into the lake enclosure.
- A reservoir water boundary clipped to the dam's upstream face.
- A river starting as a narrow outlet at the downstream dam face and flowing through sloped natural channel banks into a tapered coastal estuary.
- A widened closed bidirectional highway loop at a consistent deck elevation that curves over the dam as one continuous outside-tunnel pavement segment, immediately bends toward the west-side road corridor instead of entering the reservoir mountain, enters a high-mountain tunnel through portals oriented to the local mountain face with black interior masks where the road is lost from sight, continues through a rendered throat and road segment inside the high mountain, exits facing the port, reaches toward the industrial port side, turns toward the river, crosses the river on a cable-stayed bridge with symmetric diagonal stay cables, and returns from the flatter inland side to the dam.
- Trackable highway lane paths generated from the same route data used to render the road.
- One Three.js unit equals one meter.

## Dimensions

- Main green boundary area: 3,000,000 m2.
- Main green boundary side length: 1,732.05 m.
- Main green boundary slab thickness: 2 m.
- Grey mainland margin: 10,000 m west, 0 m east, 10,000 m north and south.
- Axis scale references: X 1,732.05 m, Y 864 m, Z 1,732.05 m.
- Mountain max height: 420 m.
- Snow-capped mountain max height above its base: 864 m.
- Snow-capped mountain footprint radius: 1,292 m by 1,190 m.
- Snow-capped mountain foothill blend height: 128 m.
- Snow-capped mountain snow line: 587.52 m.
- Snow-capped mountain visible footprint: about 23.3%.
- River width: 90 m.
- River natural channel bank width: 48 m per side, with about 1.95 m of local channel relief.
- Coastal estuary overlap into sea: 262 m.
- Beach inland width: 160 m, constrained to the north/east river mouth bank.
- Wet-sand band width: 30 m.
- Beach thickness: 1.3 m dry sand, 0.7 m wet sand.
- Wooden attraction pier size: 420 m by 180 m by 5 m thick, with 55 m overlapping the mainland.
- Waterfront support piles: 27 total across attraction pier and private marina.
- Cargo port size: 330 m by 230 m by 8 m high, with two big-ship berths.
- Cargo port equipment: 12 containers, 8 bollards, and 2 cranes.
- Cargo ships sit beyond the berth dock outer edge, leaving a 24 m water gap from dock to hull.
- Private marina berths: 4.
- Reservoir size: 340 m by 210 m, with 28 m of visible water depth.
- Dam size: 180 m long, 36 m thick, 46 m high, curved 10 m toward the downstream side.
- River source outlet width: 42 m.
- Highway loop: 2 lanes per direction, 4 directed lane paths total, with continuous rendered pavement through the mountain tunnel segment.
- Highway lane width: 3.8 m.
- Highway total paved width including median and shoulders: 26.2 m.
- Highway lane graph: 224 sampled centerline nodes per directed lane loop.
- Highway elevated support target spacing: 240 m.
- River cable-stayed bridge pylon height above deck: 78 m.

## Categories

- Natural: sea, mainland surfaces, volumetric green planning slab, volumetric reservoir water, volumetric river-integrated beach, wet sand, mountains, reservoir bank, river, sloped river channel banks, and tapered coastal estuary banks.
- Artificial: dam, raised wooden attraction pier, pier support piles, attraction pieces, raised concrete cargo port, port equipment, raised private marina docks, marina support piles, ships, and boats.
- Roads: smart highway loop, curved dam road crossing, terrain-aligned volumetric rock-backed high-mountain tunnel portals with dark entry masks, river cable-stayed bridge with pylons and symmetric diagonal stay cables, lane markings, bridge rails, and sparse instanced elevated-road pillars.
- Help: compass and X/Y/Z measurements.

## Next Step

The next iteration should refine road-planning constraints before adding moving
elements:

- Mainland coastline rules.
- Main city zone placement inside the green boundary.
- Terrain height rules for the clipped mountain and later terrain features.
- Road junction/interchange rules for connecting future city streets to the highway loop.
- Vehicle routing rules over the directed lane graph.
