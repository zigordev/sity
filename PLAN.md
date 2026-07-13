# Sity Baseline

The project is now a minimal geographic baseline before any city, road,
building, vehicle, pedestrian, or smart-infrastructure logic is added.

## Current Scene

- One 3 km2 flat green planning boundary on mainland.
- Grey land around that green boundary to show terrain outside the city limits.
- Open sea east of the mainland coastline.
- A mainland beach north of the river mouth, bounded by the river's north bank instead of crossing to the opposite side.
- A darker wet-sand band along the beach's sea edge.
- A long wooden attraction pier south of the river mouth, starting on land and extending into the sea.
- A separate large concrete cargo port with two big-ship berths.
- A separate small private marina with four leisure-boat berths.
- A UI compass whose north direction points from the mainland toward the sea.
- A UI axis scale widget whose X, Y, and Z directions rotate with the camera and show meter-based size references.
- A UI control pane for natural, artificial, and help scene-element visibility.
- A clipped mountain in the southwest corner with a lifted 42 m foothill blend into the grass.
- A separate clipped snow-capped mountain mass whose center is outside the southwest boundary, leaving only about a quarter visible with filled rock/snow cut faces and a wider horizontal footprint.
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
- Axis scale references: X 1,732.05 m, Y 864 m, Z 1,732.05 m.
- Mountain max height: 420 m.
- Snow-capped mountain max height above its base: 864 m.
- Snow-capped mountain footprint radius: 1,292 m by 1,190 m.
- Snow-capped mountain foothill blend height: 128 m.
- Snow-capped mountain snow line: 587.52 m.
- Snow-capped mountain visible footprint: about 23.3%.
- River width: 90 m.
- Coastal estuary overlap into sea: 262 m.
- Beach inland width: 160 m, constrained to the north/east river mouth bank.
- Wet-sand band width: 30 m.
- Wooden attraction pier size: 420 m by 180 m, with 55 m overlapping the mainland.
- Cargo port size: 330 m by 230 m, with two big-ship berths.
- Private marina berths: 4.
- Reservoir size: 340 m by 210 m.
- Dam size: 180 m long, 46 m high, curved 10 m toward the downstream side.
- River source outlet width: 42 m.

## Categories

- Natural: sea, mainland surfaces, green planning area, river-integrated beach, wet sand, mountains, reservoir, reservoir bank, river, and coastal estuary.
- Artificial: dam, wooden attraction pier, attraction pieces, concrete cargo port, private marina docks, ships, and boats.
- Help: compass and X/Y/Z measurements.

## Next Step

The next iteration should define permanent terrain and road-planning constraints
before adding moving elements:

- Mainland coastline rules.
- Main city zone placement inside the green boundary.
- Terrain height rules for the clipped mountain and later terrain features.
- Primary arterial road layout.
