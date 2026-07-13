# Sity Baseline Performance

The current application intentionally contains no simulation logic. It renders
only the static geographic baseline:

- Surrounding sea.
- Grey mainland outside the city boundary, split into surrounding strips so it
  does not sit under the active green planning area.
- One 3 km2 green mainland planning boundary.
- Open sea east of the mainland coastline.
- One DOM compass overlay pointing north from mainland toward the sea.
- One DOM axis scale overlay showing X/Y/Z direction and meter-based size references.
- One DOM control pane for natural/artificial/help visibility toggles.
- One mainland beach north of the river mouth, bounded by the river's north bank.
- One darker wet-sand band along the beach's sea edge.
- One long wooden attraction pier south of the river mouth with static attraction pieces.
- One separate large concrete cargo port with two big-ship berths.
- One separate private marina with four small-boat berths.
- One clipped mountain mesh with vertical boundary faces and a lifted foothill blend to avoid grass z-fighting.
- One separate snow-capped mountain mass clipped by the southwest boundary so only about a quarter is visible, with filled rock/snow cut faces.
- One reservoir lake enclosed by a natural mountain bank with a dam-sized outlet opening.
- One reservoir water boundary clipped to the curved upstream dam face.
- Two natural terrain abutments joining the dam ends into the reservoir bank.
- One curved dam spanning the reservoir outlet.
- One borderless river strip starting as a narrowed outlet at the downstream dam face and feeding a carved coastal estuary at the coastline.

## Render Check

Latest verification target:

- Desktop canvas: 1440 x 900.
- Mobile canvas: 390 x 844.
- Geometry: baseline land/sea surfaces plus river-integrated beach, wet-sand band, attraction pier, cargo port, private marina, and natural feature meshes.
- Draw calls: 48 on desktop and mobile.
- Triangles: 14,687 on desktop and mobile.

The compass, axis scale, and visibility controls are DOM overlays. The Help
toggle hides the compass and X/Y/Z measurements without adding Three.js draw
calls while visible.

## Scale

One Three.js unit equals one meter:

- Main green boundary side: 1,732.05 m.

No road network, moving vehicles, pedestrians, sensors, traffic lights, or
generated districts are present in the active scene.
