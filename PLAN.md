# Sity Baseline

The project is now a minimal geographic baseline before any city, road,
building, vehicle, pedestrian, or smart-infrastructure logic is added.

## Current Scene

- One 3 km2 flat green planning boundary on mainland.
- Grey land around that green boundary to show terrain outside the city limits.
- One separate 1 km2 flat green island.
- A 400 meter sea gap from the mainland coast to the island edge.
- Open sea surrounding the separate island.
- A UI compass whose north direction points from the mainland to the island.
- A UI control pane for natural and artificial scene-element visibility.
- A clipped mountain in the southwest corner with a lifted 42 m foothill blend into the grass.
- A reservoir lake enclosed by a natural mountain bank with a clear outlet opening for the dam.
- A curved dam spanning the reservoir outlet without natural bank geometry underneath it.
- Natural terrain abutments at both dam ends to merge the dam into the lake enclosure.
- A reservoir water boundary clipped to the dam's upstream face.
- A river starting as a narrow outlet at the downstream dam face and flowing through a carved coastal estuary into the sea.
- One Three.js unit equals one meter.

## Dimensions

- Main green boundary area: 3,000,000 m2.
- Main green boundary side length: 1,732.05 m.
- Grey mainland margin: 10,000 m west, 0 m east, 10,000 m north and south.
- Secondary island area: 1,000,000 m2.
- Secondary island side length: 1,000 m.
- Sea gap from mainland coast to island: 400 m.
- Mountain max height: 420 m.
- River width: 90 m.
- Coastal estuary overlap into sea: 262 m.
- Reservoir size: 340 m by 210 m.
- Dam size: 180 m long, 46 m high, curved 10 m toward the downstream side.
- River source outlet width: 42 m.

## Categories

- Natural: sea, mainland surfaces, green planning area, island, mountain, reservoir, reservoir bank, river, and coastal estuary.
- Artificial: dam.

## Next Step

The next iteration should define permanent terrain and road-planning constraints
before adding moving elements:

- Mainland coastline rules.
- Main city zone placement inside the green boundary.
- Bridge or ferry connection rules for the island.
- Terrain height rules for the clipped mountain and later terrain features.
- Primary arterial road layout.
