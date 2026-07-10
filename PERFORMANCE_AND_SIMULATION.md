# Sity Baseline Performance

The current application intentionally contains no simulation logic. It renders
only the static geographic baseline:

- Surrounding sea.
- Grey mainland outside the city boundary.
- One 3 km2 green mainland planning boundary.
- One separate 1 km2 green island.
- One DOM compass overlay pointing north from mainland to island.

## Render Check

Latest verification target:

- Desktop canvas: 1440 x 900.
- Mobile canvas: 390 x 844.
- Geometry: 4 planes.
- Draw calls: 4.
- Triangles: 8.

## Scale

One Three.js unit equals one meter:

- Main green boundary side: 1,732.05 m.
- Secondary island side: 1,000 m.
- Sea gap from the green mainland boundary/coast to island: 400 m.

No roads, buildings, vehicles, pedestrians, sensors, traffic lights, or generated
districts are present in the active scene.
