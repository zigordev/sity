# Performance and verification

Sity renders the static city and road network only; there is no simulation logic yet. The whole scene is
built once at load time from deterministic plans and seeds, so every run produces the same geometry and the
same lane graph.

## Budget

Measured through `window.__SITY_DEBUG__.getPerformance()` (scene traversal estimate, all layers visible):

- Draw calls: about 290.
- Triangles: about 850 k.
- Postprocessing passes: render, SSAO, bloom, output.

How the scene stays cheap:

- Roads are merged per material: one mesh each for asphalt tops, deck sides, sidewalks, kerbs, medians,
  white markings, yellow markings, barriers, guardrails, piers and embankments.
- Every repeated object is an `InstancedMesh`: buildings and roofs, trees (three kinds), street lamps,
  signal poles, arms, heads and lenses, sign faces and poles, benches, boulders, reeds, pebbles, piles,
  containers and cleats.
- Building facades are a shader, not geometry: window grids, floor bands, glass and roofs come from
  per-instance attributes and local box coordinates.
- Terrain relief, mountains and water use single meshes with shader detail; the terrain skin is flattened
  under road corridors and city zones so buildings and streets sit on level ground.

Because the final frame goes through an `EffectComposer`, `renderer.info.render` only reports the last
fullscreen pass; the debug API exposes both the renderer counters and the traversal estimate.

## Verification

`npm run verify:render` starts from a running dev server (`npm run dev`), loads the page in headless Chromium
with software WebGL, and checks:

- assets loaded without failures (manifest, texture families, imported vessels);
- the site frame (north is `-Z`, the sea is east, the river flows to the sea);
- road graph size and invariants: no NaN coordinates, every link bidirectional, connectors touching
  their neighbours, no stranded lanes, ramps present;
- routing: a route from the ring highway to Main Street and back, and a random route of at least 900 m;
- city size: lots, buildings and trees above minimum counts;
- default layer visibility, camera views, compass movement and the draw-call and triangle budgets;
- rendered pixels for the overview, downtown, interchange and street views on desktop and the overview on
  mobile, saved as PNG files under `verify-output/`.

## Simulation readiness

The lane graph is the contract for the next stages:

- Vehicles spawn on source lanes (roads entering the map) or any lane, follow `points` in order, pick a
  successor at each lane end (`next`), and may move to an `adjacent` lane; `speedKph` gives the limit.
- Junctions carry their control type (`signal`, `stop`, `yield`, `priority`) and the connectors that cross
  them, so signal controllers can gate connectors and detectors can watch lanes.
- `findRoute` gives shortest paths for routing and rerouting; `enumeratePaths` lists alternatives.
