# Sity Baseline

The project is now a minimal geographic and road-network baseline before any
city building, vehicle, pedestrian, or smart-infrastructure logic is added.

## Current Scene

- One 3 km2 green planning boundary on mainland, now modeled as a shallow terrain slab with visible earth-cut sides.
- Grey land around that green boundary to show terrain outside the city limits.
- Open sea east of the mainland coastline, rendered with the exact same custom sea shader material used by every water body.
- A high-end renderer profile named `cinematic-pbr-terrain-water`, with tone mapping, a PMREM environment map, physical sky, SSAO, subtle bloom, and output color management through an `EffectComposer`.
- A local production-style asset pack under `public/assets/sity`, loaded through a manifest instead of hard-coded runtime primitives.
- File-backed PNG PBR texture sets for grass, asphalt, concrete, dry sand, wet sand, rock, wood, water assets, and worn metal surfaces, replacing canvas-only maps after load while keeping canvas maps as fallback; runtime water itself now uses one shared shader instead of separate PBR water materials.
- Three.js `GLTFLoader`, `KTX2Loader`, `DRACOLoader`, and Meshopt decoder support configured for imported model, texture-compression, and geometry-compression workflows.
- Local Basis/KTX2 and Draco decoder runtime files copied into `public/assets/sity/decoders`, so compressed production assets have real decoder paths instead of placeholder paths.
- A mainland beach north of the river mouth, bounded by the river's north bank instead of crossing to the opposite side.
- A shallow volumetric beach and darker wet-sand band along the beach's sea edge.
- A subtle shallow-water shelf east of the coast to make the sea edge read as coastal depth instead of a flat infinite plane.
- A micro-displaced grass terrain skin over the active mainland so the lowland no longer reads as a perfectly flat 2D plane.
- Shader-level terrain macro variation over the active green mainland to blend meadow, dry grass, and subtle soil tones at landscape scale.
- Static beach detail: shoreline foam placed seaward of the wet sand, plus low dry-sand dunes with grass clumps, shells, umbrellas, sunbeds, towels, a volleyball court, a lifeguard tower, shower station, safety flags, bins, and a boardwalk access path.
- Procedural surface materials for grass, grey mainland, earth cuts, sand, wet sand, asphalt, concrete, wood, and metal, with bump detail where it helps the surface read as 3D.
- One exact shared sea shader material for all water: open sea, shallow coastal shelf, reservoir/lake, river, and estuary all use the same shader, generated normal map, sea color, and animation uniforms.
- Rounded/beveled built geometry for box-based structures and repeated props, replacing the sharpest primitive edges.
- Natural rock clusters, pebbles, erosion-edge ribbons, and reed clusters along the river banks and near the coast to break up flat terrain edges.
- A raised wooden attraction pier south of the river mouth, starting on land and extending into the sea, now with railings, under-deck beams, support shadows, and attraction pieces.
- Instanced support piles under the attraction pier and private marina docks.
- A raised concrete cargo port with two big-ship berths.
- Static cargo-port details: container stacks, bollards, concrete seams, slot drains, rubber quay fenders, and two small cranes.
- Imported GLTF cargo-ship and private-boat assets replace the procedural vessel fallbacks once loaded, keeping the same water/berth placement constraints.
- A separate raised private marina with four leisure-boat berths and mooring cleats.
- Soft directional shadows for 3D terrain and raised artificial structures.
- Contact-shadow planes under large raised waterfront structures.
- A UI compass whose north direction points from the mainland toward the sea.
- A UI axis scale widget whose X, Y, and Z directions rotate with the camera and show meter-based size references.
- A UI control pane for natural, artificial, roads, and help scene-element visibility.
- A clipped mountain in the southwest corner with a lifted 42 m foothill blend into the grass.
- A separate clipped snow-capped mountain mass whose center is outside the southwest boundary, leaving only about a quarter visible with filled rock/snow cut faces and a wider horizontal footprint.
- A flat-topped volumetric reservoir lake enclosed by a natural mountain bank with a clear outlet opening for the dam.
- A curved dam spanning the reservoir outlet without natural bank geometry underneath it, with crest rails, spillway gates, and a downstream service gallery.
- Natural terrain abutments and sloped shore-closure wings at both dam ends to merge the dam into the lake enclosure.
- A reservoir water boundary clipped to the dam's upstream face.
- A river starting as a narrow outlet at the downstream dam face and flowing through sloped natural channel banks into a tapered coastal estuary.
- A widened closed bidirectional highway loop at a consistent deck elevation that curves over the dam as one continuous outside-tunnel pavement segment, immediately bends toward the west-side road corridor instead of entering the reservoir mountain, enters a high-mountain tunnel through portals oriented to the local mountain face with black interior masks where the road is lost from sight, continues through a rendered throat and road segment inside the high mountain, exits facing the port, reaches toward the industrial port side, turns toward the river, crosses the river on a cable-stayed bridge with symmetric diagonal stay cables, and returns from the flatter inland side to the dam.
- Highway detail now includes asphalt aggregate, tire-wear strips, lane markings, shoulders, median, continuous side barriers, drainage channels, expansion joints, road-crack decals, reflector posts, bridge cross-girders, and tunnel lining ribs.
- Trackable highway lane paths generated from the same route data used to render the road.
- An asset pipeline scaffold that now actively imports local `gltf` model assets and is ready for `glb`, `ktx2` texture compression, Draco-compressed geometry, and Meshopt-compressed geometry when production assets are added.
- One Three.js unit equals one meter.

## Dimensions

- Main green boundary area: 3,000,000 m2.
- Main green boundary side length: 1,732.05 m.
- Main green boundary slab thickness: 2 m.
- Mainland micro-displacement terrain skin: 116 by 116 grid segments with up to 8.5 m of visible relief.
- Grey mainland margin: 10,000 m west, 0 m east, 10,000 m north and south.
- Shared sea water shader: 5 water surfaces, 1 generated 256 px normal map, and 1 runtime water material variant.
- Postprocessing chain: render pass, SSAO pass, subtle bloom pass, and output pass.
- Local asset pack: 1 manifest, 2 GLTF model assets, 45 generated 512 px PNG texture-map files, and 5 local decoder runtime files.
- Runtime texture replacements currently applied to 9 surface families: grass, asphalt, concrete, dry sand, wet sand, rock, wood, water, and metal.
- Runtime PBR map applications: 69 albedo/normal/ORM-derived maps across repeated non-water scene materials; water uses the shared sea shader instead.
- Imported model instances: 2 cargo ships and 4 private boats.
- Axis scale references: X 1,732.05 m, Y 864 m, Z 1,732.05 m.
- Mountain max height: 420 m.
- Snow-capped mountain max height above its base: 864 m.
- Snow-capped mountain footprint radius: 1,292 m by 1,190 m.
- Snow-capped mountain foothill blend height: 128 m.
- Snow-capped mountain snow line: 587.52 m.
- Snow-capped mountain visible footprint: about 23.3%.
- River width: 90 m.
- River natural channel bank width: 48 m per side, with about 1.95 m of local channel relief.
- River detail counts: 96 reed clusters and 96 pebble-field stones.
- Coastal estuary overlap into sea: 262 m.
- Shallow coastal water shelf width: 360 m.
- Beach inland width: 160 m, constrained to the north/east river mouth bank.
- Wet-sand band width: 30 m.
- Beach thickness: 1.3 m dry sand, 0.7 m wet sand.
- Beach detail counts: 7 foam strips, 16 dune mounds, 40 grass clumps, 72 shells/small stones, 12 umbrellas, 24 sunbeds, 10 towels, and 4 bins.
- Natural rock clusters: 36.
- Beach amenity placement: all furniture and utilities keep a 52 m sea-side dry-sand margin, so they do not sit on the 30 m wet-sand band or outside the visible beach bounds.
- Wooden attraction pier size: 420 m by 180 m by 5 m thick, with 55 m overlapping the mainland.
- Attraction pier detail: 50 railing posts and 25 under-deck beams.
- Waterfront support piles: 27 total across attraction pier and private marina.
- Cargo port size: 330 m by 230 m by 8 m high, with two big-ship berths.
- Cargo port equipment: 12 containers, 8 bollards, 12 concrete seams, 10 quay fenders, 8 slot drains, and 2 cranes.
- Cargo ships sit beyond the berth dock outer edge, leaving a 24 m water gap from dock to hull.
- Vessel count: 6 imported GLTF cargo/private vessel instances with procedural LOD fallbacks kept available.
- Private marina berths: 4, with 20 mooring cleats.
- Reservoir size: 340 m by 210 m, with 28 m of visible water depth.
- Dam size: 180 m long, 36 m thick, 46 m high, curved 10 m toward the downstream side.
- Dam details: 18 crest rail posts and 5 spillway gates.
- River source outlet width: 42 m.
- Highway loop: 2 lanes per direction, 4 directed lane paths total, with continuous rendered pavement through the mountain tunnel segment.
- Highway lane width: 3.8 m.
- Highway total paved width including median and shoulders: 26.2 m.
- Highway lane graph: 224 sampled centerline nodes per directed lane loop.
- Highway elevated support target spacing: 240 m.
- River cable-stayed bridge pylon height above deck: 78 m.
- Highway surface detail: 18 expansion joints, 56 crack/weathering decals, 48 reflector posts, and 10 tunnel lining ribs.

## Categories

- Natural: shared-shader sea water, shallow coastal shelf, mainland surfaces, micro-displaced lowland terrain, volumetric green planning slab, volumetric reservoir water, volumetric river-integrated beach, wet sand, shoreline foam, dune mounds, beach grass, shells, river/coast rock clusters, riverbank pebbles, reeds, mountains, reservoir bank, river, sloped river channel banks, erosion edges, and tapered coastal estuary banks.
- Artificial: beach umbrellas, sunbeds, towels, volleyball court, lifeguard tower, shower station, safety flags, bins, boardwalk access, dam details, raised wooden attraction pier, pier railings, pier understructure, pier support piles, attraction pieces, raised concrete cargo port, port equipment, quay fenders, raised private marina docks, marina cleats, marina support piles, imported GLTF ships, imported GLTF boats, and procedural vessel fallbacks.
- Roads: smart highway loop, curved dam road crossing, terrain-aligned volumetric rock-backed high-mountain tunnel portals with dark entry masks and lining ribs, river cable-stayed bridge with pylons, cross-girders, and symmetric diagonal stay cables, tire-wear strips, expansion joints, crack decals, drainage channels, lane markings, continuous side barriers, bridge rails, reflector posts, and sparse instanced elevated-road pillars.
- Help: compass and X/Y/Z measurements.

## Next Step

The next iteration should refine road-planning constraints before adding moving
elements:

- Mainland coastline rules.
- Main city zone placement inside the green boundary.
- Terrain height rules for the clipped mountain and later terrain features.
- Road junction/interchange rules for connecting future city streets to the highway loop.
- Vehicle routing rules over the directed lane graph.
- Replace the locally generated GLTF/PNG pack with externally authored production GLB assets, compressed KTX2 textures, and Draco geometry once final city districts and prop libraries are chosen.
