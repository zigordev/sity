# Sity Baseline Performance

The current application intentionally contains no simulation logic. It renders
only the static geographic baseline:

- Surrounding sea.
- Grey mainland outside the city boundary, split into surrounding strips so it
  does not sit under the active green planning area.
- One 3 km2 green mainland planning boundary modeled as a 2 m terrain slab with visible cut sides.
- Open sea east of the mainland coastline.
- One DOM compass overlay pointing north from mainland toward the sea.
- One DOM axis scale overlay showing X/Y/Z direction and meter-based size references.
- One DOM control pane for natural/artificial/roads/help visibility toggles.
- One shallow volumetric beach north of the river mouth, bounded by the river's north bank.
- One shallow darker wet-sand band along the beach's sea edge.
- Static beach detail: 7 shoreline foam strips placed seaward of the wet-sand band, 16 dry-sand dune mounds, 40 beach-grass clumps, 12 umbrellas, 24 sunbeds, 10 towels, a volleyball court, a lifeguard tower, a shower station, safety flags, 4 bins, and a boardwalk access path.
- Beach furniture and utility props keep a 52 m sea-side dry-sand margin so they avoid the 30 m wet-sand band and stay inside the visible beach bounds.
- One raised wooden attraction pier south of the river mouth with static attraction pieces.
- Instanced support piles under the attraction pier and private marina docks.
- One raised concrete cargo port with two big-ship berths.
- Static cargo-port detail: 12 containers, 8 bollards, and 2 cranes.
- Two cargo ships placed fully in the water beyond the berth docks, clear of the concrete quay.
- One raised private marina with four small-boat berths.
- Soft directional shadows for terrain receivers, dam, beach volume, pier, port, docks, boats, and attractions.
- One clipped mountain mesh with vertical boundary faces and a lifted foothill blend to avoid grass z-fighting.
- One separate snow-capped mountain mass clipped by the southwest boundary so only about a quarter is visible, with filled rock/snow cut faces.
- One reservoir lake enclosed by a natural mountain bank with a dam-sized outlet opening.
- One reservoir water boundary clipped to the curved upstream dam face.
- Two natural terrain abutments and two sloped shore-closure wings joining the dam ends into the reservoir bank.
- One flat-topped volumetric reservoir lake with 28 m of water depth and a curved dam spanning the outlet.
- One borderless river water strip starting as a narrowed outlet at the downstream dam face.
- One set of sloped natural river channel banks following the full inland river path.
- One coastal estuary water strip with natural banks that taper away before the water blends into the sea.
- One widened closed bidirectional highway loop with 2 lanes per direction, a consistent elevated deck, a curved dam crossing, a single continuous outside-tunnel pavement curve through the dam junction, a west-side post-dam bypass that avoids the reservoir mountain, a rendered high-mountain tunnel road segment with terrain-aligned volumetric rock-backed rounded portals and dark interior entry masks, an industrial-port-side approach, and a cable-stayed bridge with symmetric diagonal stay cables over the river.
- Four directed closed highway lane paths are generated for future vehicle routing.

## Render Check

Latest verification target:

- Desktop canvas: 1440 x 900.
- Mobile canvas: 390 x 844.
- Geometry: baseline land/sea surfaces plus volumetric green terrain slab, flat-topped volumetric reservoir water, dam-side reservoir shore closures, volumetric river-integrated beach, wet-sand band, beach foam/dunes/grass, beach amenities, raised attraction pier, raised cargo port, raised private marina, instanced waterfront details, cargo-port equipment, sloped river/estuary banks, highway deck including the terrain-aligned interior tunnel throat, lane markings, highway shoulder strips, sparse meter-spaced elevated-road pillars, cable-stayed bridge pylons and symmetric diagonal stay cables, volumetric rock-backed rounded tunnel portals, black tunnel-entry masks, and natural feature meshes.
- Draw calls: 164 on desktop and mobile.
- Triangles: 38,294 on desktop and mobile.

Repeated beach grass, beach umbrellas, sunbeds, towels, waterfront piles, cargo
bollards, cargo containers, bridge stay cables, and elevated-road pillars use Three.js
`InstancedMesh` so the extra 3D detail does not scale one draw call per repeated
piece.

The compass, axis scale, and visibility controls are DOM overlays. The Roads
toggle hides only the highway meshes and road structures, while the Help toggle
hides the compass and X/Y/Z measurements without adding Three.js draw calls
while visible.

## Scale

One Three.js unit equals one meter:

- Main green boundary side: 1,732.05 m.

No moving vehicles, pedestrians, sensors, traffic lights, or generated districts
are present in the active scene.
