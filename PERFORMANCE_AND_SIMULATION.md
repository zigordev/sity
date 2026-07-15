# Sity Baseline Performance

The current application intentionally contains no simulation logic. It renders
only the static geographic baseline:

- Sea, shallow shelf, reservoir/lake, river, and estuary all render with one exact shared sea shader and one generated normal map.
- PMREM environment lighting, physical sky, tone mapping, SSAO, subtle bloom, and output color management through an `EffectComposer`.
- A manifest-driven local asset pack under `public/assets/sity`.
- Three.js `GLTFLoader`, `KTX2Loader`, `DRACOLoader`, and Meshopt decoder support are configured for model import, texture-compression readiness, and compressed geometry readiness.
- Local Basis/KTX2 and Draco decoder runtime files are served from `public/assets/sity/decoders`.
- Grey mainland outside the city boundary, split into surrounding strips so it
  does not sit under the active green planning area.
- One 3 km2 green mainland planning boundary modeled as a 2 m terrain slab with visible cut sides.
- Open sea east of the mainland coastline.
- One DOM compass overlay pointing north from mainland toward the sea.
- One DOM axis scale overlay showing X/Y/Z direction and meter-based size references.
- One DOM control pane for natural/artificial/roads/help visibility toggles.
- Procedural repeating material maps for grass, grey mainland, earth cuts, sand, asphalt, concrete, wood, and metal.
- File-backed 512 px PNG PBR texture sets replace the procedural maps for 9 main surface families after the asset manifest loads.
- The active high-end renderer profile is `cinematic-pbr-terrain-water`.
- Normal/roughness/metalness map support for sand, concrete, wood, asphalt, metal, and exposed rock/cut faces where the geometry is meant to read as physical surface instead of flat color.
- One exact shared sea water shader for sea, river, estuary, reservoir/lake, and shallow coastal water; water texture variants are intentionally reduced to one.
- A visible 116 by 116 micro-displaced lowland terrain skin over the active mainland, capped at 8.5 m of relief.
- Shader-level terrain macro variation over the active mainland grass surface.
- Rounded/beveled box geometry for built structures and repeated props where the dimensions can support it.
- Contact-shadow planes below large raised waterfront structures.
- A subtle shallow-water coastal shelf east of the visible mainland.
- One shallow volumetric beach north of the river mouth, bounded by the river's north bank.
- One shallow darker wet-sand band along the beach's sea edge.
- Static beach detail: 7 shoreline foam strips placed seaward of the wet-sand band, 16 dry-sand dune mounds, 40 beach-grass clumps, 72 shells/small stones, 12 umbrellas, 24 sunbeds, 10 towels, a volleyball court, a lifeguard tower, a shower station, safety flags, 4 bins, and a boardwalk access path.
- Beach furniture and utility props keep a 52 m sea-side dry-sand margin so they avoid the 30 m wet-sand band and stay inside the visible beach bounds.
- One raised wooden attraction pier south of the river mouth with static attraction pieces, railings, under-deck beams, and water contact shadow.
- Instanced support piles under the attraction pier and private marina docks.
- One raised concrete cargo port with two big-ship berths.
- Static cargo-port detail: 12 containers, 8 bollards, 12 concrete seams, 8 slot drains, 10 rubber quay fenders, and 2 cranes.
- Two cargo ships placed fully in the water beyond the berth docks, clear of the concrete quay.
- Cargo ships and private boats are imported GLTF model instances with procedural LOD fallbacks retained until the imported models load.
- One raised private marina with four small-boat berths and 20 mooring cleats.
- Soft directional shadows for terrain receivers, dam, beach volume, pier, port, docks, boats, and attractions.
- One clipped mountain mesh with vertical boundary faces and a lifted foothill blend to avoid grass z-fighting.
- One separate snow-capped mountain mass clipped by the southwest boundary so only about a quarter is visible, with filled rock/snow cut faces.
- One reservoir lake enclosed by a natural mountain bank with a dam-sized outlet opening.
- One reservoir water boundary clipped to the curved upstream dam face.
- Two natural terrain abutments and two sloped shore-closure wings joining the dam ends into the reservoir bank.
- One flat-topped volumetric reservoir lake with 28 m of water depth and a curved dam spanning the outlet.
- Dam detail: crest rail, 5 spillway gates, and a downstream service gallery.
- One borderless river water strip starting as a narrowed outlet at the downstream dam face.
- One set of sloped natural river channel banks following the full inland river path.
- Riverbank detail: erosion-edge ribbons, 96 reed clusters, and 96 pebble-field stones.
- One coastal estuary water strip with natural banks that taper away before the water blends into the sea.
- 36 instanced natural rock clusters along river/coast transition areas.
- One widened closed bidirectional highway loop with 2 lanes per direction, a consistent elevated deck, a curved dam crossing, a single continuous outside-tunnel pavement curve through the dam junction, a west-side post-dam bypass that avoids the reservoir mountain, a rendered high-mountain tunnel road segment with terrain-aligned volumetric rock-backed rounded portals and dark interior entry masks, an industrial-port-side approach, and a cable-stayed bridge with symmetric diagonal stay cables over the river.
- Asphalt tire-wear strips, continuous side barriers, drainage channels, 18 expansion joints, 56 crack/weathering decals, 48 reflector posts, bridge cross-girders, and 10 tunnel lining ribs on the highway loop.
- Four directed closed highway lane paths are generated for future vehicle routing.
- The scene includes an active asset pipeline for local `gltf` models and PNG PBR textures, plus scaffolded support for future `glb`, `ktx2`, Draco-compressed, and Meshopt-compressed assets.

## Render Check

Latest verification target:

- Desktop canvas: 1440 x 900.
- Mobile canvas: 390 x 844.
- Asset loading: 1 manifest, 45 generated texture-map files, 9 runtime texture families, 69 applied non-water PBR map bindings, 1 shared runtime water shader, 2 imported GLTF model sources, 6 imported model instances, and local Basis/Draco decoder runtime paths.
- Geometry: baseline land/sea surfaces plus shared-shader sea/shelf/river/estuary/reservoir water, coastline-following shallow coastal shelf, visible micro-displaced lowland terrain, volumetric green terrain slab, flat-topped volumetric reservoir water, dam-side reservoir shore closures, dam crest/gate/service details, volumetric river-integrated beach, wet-sand band, beach foam/dunes/grass/shells, beach amenities, raised attraction pier with railings and understructure, raised cargo port with seams/fenders/drains, raised private marina with cleats, imported GLTF vessels, contact-shadow planes, instanced waterfront details, cargo-port equipment, sloped river/estuary banks, riverbank reeds/pebbles/erosion ribbons, instanced natural rock clusters, mountain strata/snow/talus detail, highway deck including the terrain-aligned interior tunnel throat, tire-wear strips, expansion joints, crack decals, reflector posts, lane markings, highway shoulder strips, drainage channels, continuous side barriers, sparse meter-spaced elevated-road pillars, cable-stayed bridge pylons/cross-girders and symmetric diagonal stay cables, volumetric rock-backed rounded tunnel portals, tunnel lining ribs, black tunnel-entry masks, and natural feature meshes.
- Scene-estimated draw calls: 256 on desktop and mobile.
- Scene-estimated triangles: 183,207 on desktop and mobile.
- Postprocessing passes: 4.

Repeated beach grass, beach umbrellas, sunbeds, towels, shells, river reeds,
river pebbles, natural rock clusters, waterfront piles, cargo bollards, cargo containers,
marina cleats, road decals, reflector posts, bridge stay cables, and elevated-road pillars use Three.js
`InstancedMesh` so the extra 3D detail does not scale one draw call per repeated
piece.

Because the final frame is rendered through an `EffectComposer`, raw
`renderer.info.render` reports the final fullscreen composer pass instead of the
underlying scene cost. The debug performance panel therefore exposes both values
and uses scene traversal estimates for planning.

The compass, axis scale, and visibility controls are DOM overlays. The Roads
toggle hides only the highway meshes and road structures, while the Help toggle
hides the compass and X/Y/Z measurements without adding Three.js draw calls
while visible.

## Scale

One Three.js unit equals one meter:

- Main green boundary side: 1,732.05 m.

No moving vehicles, pedestrians, sensors, traffic lights, or generated districts
are present in the active scene.
