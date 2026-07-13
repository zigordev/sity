# Sity Baseline Performance

The current application intentionally contains no simulation logic. It renders
only the static geographic baseline:

- Surrounding sea.
- Grey mainland outside the city boundary, split into surrounding strips so it
  does not sit under the active green planning area.
- One 3 km2 green mainland planning boundary.
- One separate 1 km2 green island.
- One DOM compass overlay pointing north from mainland to island.
- One DOM control pane for natural/artificial visibility toggles.
- One clipped mountain mesh with vertical boundary faces and a lifted foothill blend to avoid grass z-fighting.
- One separate clipped snow-capped mountain mass in the southwest corner.
- One reservoir lake enclosed by a natural mountain bank with a dam-sized outlet opening.
- One reservoir water boundary clipped to the curved upstream dam face.
- Two natural terrain abutments joining the dam ends into the reservoir bank.
- One curved dam spanning the reservoir outlet.
- One borderless river strip starting as a narrowed outlet at the downstream dam face and feeding a carved coastal estuary at the coastline.

## Render Check

Latest verification target:

- Desktop canvas: 1440 x 900.
- Mobile canvas: 390 x 844.
- Geometry: 6 baseline land/sea surfaces plus natural feature meshes.
- Draw calls: 20 on desktop, 18 on mobile due viewport culling.
- Triangles: 11,070 on desktop, 10,914 on mobile.

The visibility controls toggle existing Three.js groups and do not add render
cost while both categories are visible.

## Scale

One Three.js unit equals one meter:

- Main green boundary side: 1,732.05 m.
- Secondary island side: 1,000 m.
- Sea gap from the green mainland boundary/coast to island: 400 m.

No roads, buildings, vehicles, pedestrians, sensors, traffic lights, or generated
districts are present in the active scene.
