import { corridorClearance, cutLimitAt, terrainReliefFactor, zoneFlattenFactor } from "../world/occupancy";
import * as THREE from "three";
import { BEACH_INLAND_WIDTH_M, GRASS_SURFACE_Y, MAINLAND_NORTH_SOUTH_MARGIN_M, MAINLAND_WEST_MARGIN_M, MAINLAND_Y, MAIN_BOUNDARY_TERRAIN_THICKNESS_M, MICRO_TERRAIN_CELL_M, MICRO_TERRAIN_HEIGHT_M, MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M, MOUNTAIN_GRID_SEGMENTS, MOUNTAIN_HEIGHT_M, MOUNTAIN_RADIUS_X_M, MOUNTAIN_RADIUS_Z_M, MOUNTAIN_STRATA_RIDGE_COUNT, MOUNTAIN_SURFACE_LIFT_M, MOUNTAIN_TALUS_BOULDER_COUNT, RESERVOIR_RADIUS_X_M, RESERVOIR_RADIUS_Z_M, RIVER_WIDTH_M, SNOW_MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M, SNOW_MOUNTAIN_GRID_SEGMENTS, SNOW_MOUNTAIN_HEIGHT_M, SNOW_MOUNTAIN_MIN_RENDER_HEIGHT_M, SNOW_MOUNTAIN_RADIUS_X_M, SNOW_MOUNTAIN_RADIUS_Z_M, SNOW_MOUNTAIN_SNOWLINE_M, SNOW_MOUNTAIN_STRATA_RIDGE_COUNT, SNOW_MOUNTAIN_SURFACE_LIFT_M, SNOW_MOUNTAIN_TALUS_BOULDER_COUNT } from "../config/constants";
import { addFlatPlane, addLayeredPolygonVolume, addPlanarXZUVs, addScaledSphereInstances, distanceToPath2D, isInsideBounds } from "../geometry/helpers";
import { GroundPathPoint, ScaledXYZPlacement } from "../geometry/types";
import { naturalElements } from "../render/context";
import { grassMaterial, mainlandMaterial, mountainCutMaterial, mountainHighColor, mountainLowColor, mountainMaterial, mountainMidColor, mountainRidgeMaterial, talusRockMaterial, snowColor, snowPatchMaterial, snowShadowColor, terrainCutMaterial, terrainGrassColor, terrainMicroDisplacementMaterial } from "../render/materials";
import { mainBoundaryCenterX, mainBoundaryCoastlinePoints, mainBoundaryMaxX, mainBoundaryMaxZ, mainBoundaryMinX, mainBoundaryMinZ, mainlandCenterZ, mainlandDepth, mainlandMaxZ, mainlandMinX, mainlandMinZ, mountainCenter, mountainVisibleBounds, reservoirCenter, riverPath, snowMountainCenter, snowMountainVisibleBounds } from "../world/frame";

export let mountainStrataRidgeMeshCount = 0;

export let talusBoulderInstanceCount = 0;

export let snowCapOverlayInstalled = false;

export function addMainBoundarySurface() {
  addLayeredPolygonVolume(
    "main-boundary-grass-terrain-slab",
    mainBoundaryCoastlinePoints,
    grassMaterial,
    terrainCutMaterial,
    GRASS_SURFACE_Y,
    MAIN_BOUNDARY_TERRAIN_THICKNESS_M,
    2,
    naturalElements,
    false,
  );
}

export function terrainMicroNoise(x: number, z: number) {
  const point = { x, z };
  const riverDistance = distanceToPath2D(point, riverPath);
  const riverMask = THREE.MathUtils.smoothstep(riverDistance, RIVER_WIDTH_M * 1.1, RIVER_WIDTH_M * 3.4);
  const roadMask = terrainReliefFactor(x, z);
  const mountainMask =
    1 -
    THREE.MathUtils.smoothstep(
      Math.max(mountainHeightAt(x, z), snowMountainHeightAt(x, z)),
      0,
      36,
    );
  const coastMask = 1 - THREE.MathUtils.smoothstep(x, mainBoundaryMaxX - 420, mainBoundaryMaxX - 170);
  const broad = Math.sin(x * 0.0042 + z * 0.0031) * 0.5 + 0.5;
  const middle = Math.sin(x * 0.012 - z * 0.009) * 0.5 + 0.5;
  const fine = Math.sin(x * 0.034 + z * 0.027) * 0.5 + 0.5;
  const drainage = Math.max(
    0,
    Math.sin((x - z) * 0.0068) * 0.5 + 0.5 - 0.52,
  );
  const relief = (broad * 0.46 + middle * 0.34 + fine * 0.2 + drainage * 0.36) * MICRO_TERRAIN_HEIGHT_M;

  return relief * riverMask * roadMask * mountainMask * coastMask;
}

export const TERRAIN_SKIN_MAX_MOUNTAIN_HEIGHT_M = 34;

export function groundSurfaceBaseYAt(x: number, z: number) {
  const height = Math.max(mountainHeightAt(x, z), snowMountainHeightAt(x, z));
  const foothill = THREE.MathUtils.smoothstep(height, 2, 22);
  return fullTerrainSurfaceYAt({ x, z }) + 0.11 + 0.25 * foothill;
}

export function groundSurfaceYAt(x: number, z: number) {
  return Math.min(groundSurfaceBaseYAt(x, z), cutLimitAt(x, z));
}

export function addMicroDisplacedGrassTerrain() {
  const westX = mainBoundaryMinX + 1;
  const eastX = mainBoundaryMaxX - BEACH_INLAND_WIDTH_M - 55;
  const southZ = mainBoundaryMinZ + 1;
  const northZ = mainBoundaryMaxZ - 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const heights: number[] = [];
  const columns = Math.ceil((eastX - westX) / MICRO_TERRAIN_CELL_M);
  const rows = Math.ceil((northZ - southZ) / MICRO_TERRAIN_CELL_M);

  for (let row = 0; row <= rows; row += 1) {
    const z = THREE.MathUtils.lerp(southZ, northZ, row / rows);

    for (let column = 0; column <= columns; column += 1) {
      const x = THREE.MathUtils.lerp(westX, eastX, column / columns);
      const height = Math.max(mountainHeightAt(x, z), snowMountainHeightAt(x, z));
      heights.push(height);
      const displacedY = Math.min(groundSurfaceYAt(x, z) + terrainMicroNoise(x, z), cutLimitAt(x, z));
      positions.push(x, displacedY, z);
      uvs.push(x / 95, z / 95);
    }
  }

  const rowStride = columns + 1;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const a = row * rowStride + column;
      const b = a + 1;
      const c = a + rowStride;
      const d = c + 1;
      const cellMaxHeight = Math.max(heights[a], heights[b], heights[c], heights[d]);
      if (cellMaxHeight > TERRAIN_SKIN_MAX_MOUNTAIN_HEIGHT_M) {
        continue;
      }
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, terrainMicroDisplacementMaterial);
  mesh.name = "micro-displaced-grass-terrain-skin";
  mesh.renderOrder = 2.4;
  mesh.receiveShadow = true;
  naturalElements.add(mesh);
}

export function visibleLowlandSurfaceYAt(point: GroundPathPoint) {
  return GRASS_SURFACE_Y + 0.11 + terrainMicroNoise(point.x, point.z);
}

export function isInsideMainBoundary(point: GroundPathPoint, marginM = 0) {
  return (
    point.x >= mainBoundaryMinX + marginM &&
    point.x <= mainBoundaryMaxX - marginM &&
    point.z >= mainBoundaryMinZ + marginM &&
    point.z <= mainBoundaryMaxZ - marginM
  );
}

export function isInsideReservoirFootprint(point: GroundPathPoint, scale = 1.45) {
  return (
    ((point.x - reservoirCenter.x) / (RESERVOIR_RADIUS_X_M * scale)) ** 2 +
      ((point.z - reservoirCenter.z) / (RESERVOIR_RADIUS_Z_M * scale)) ** 2 <
    1
  );
}

export function isLowlandDetailAllowed(point: GroundPathPoint) {
  if (!isInsideMainBoundary(point, 120)) {
    return false;
  }

  if (point.x > mainBoundaryMaxX - BEACH_INLAND_WIDTH_M - 130) {
    return false;
  }

  if (distanceToPath2D(point, riverPath) < RIVER_WIDTH_M * 1.75) {
    return false;
  }

  if (corridorClearance(point.x, point.z) < 14 || zoneFlattenFactor(point.x, point.z) < 1) {
    return false;
  }

  if (isInsideReservoirFootprint(point)) {
    return false;
  }

  return Math.max(mountainHeightAt(point.x, point.z), snowMountainHeightAt(point.x, point.z)) < 7;
}

export function addTubePath(
  name: string,
  points: THREE.Vector3[],
  radius: number,
  material: THREE.Material,
  renderOrder: number,
) {
  if (points.length < 4) {
    return;
  }

  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.35);
  const geometry = new THREE.TubeGeometry(curve, Math.max(12, points.length * 2), radius, 6, false);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.renderOrder = renderOrder;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  naturalElements.add(mesh);
  mountainStrataRidgeMeshCount += 1;
}

export function addMountainContourRidges(
  name: string,
  center: GroundPathPoint,
  radiusX: number,
  radiusZ: number,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  ridgeCount: number,
  heightAt: (x: number, z: number) => number,
  yAt: (x: number, z: number, height: number) => number,
  minHeight: number,
  material: THREE.Material,
  renderOrder: number,
) {
  const samples = 132;

  for (let ridgeIndex = 0; ridgeIndex < ridgeCount; ridgeIndex += 1) {
    const ratio = THREE.MathUtils.lerp(0.24, 0.88, ridgeIndex / Math.max(ridgeCount - 1, 1));
    let run: THREE.Vector3[] = [];

    for (let sample = 0; sample <= samples; sample += 1) {
      const angle = (sample / samples) * Math.PI * 2;
      const contourNoise =
        1 +
        0.028 * Math.sin(angle * 3.1 + ridgeIndex * 0.7) +
        0.018 * Math.sin(angle * 7.3 + ridgeIndex * 1.9);
      const x = center.x + Math.cos(angle) * radiusX * ratio * contourNoise;
      const z = center.z + Math.sin(angle) * radiusZ * ratio * contourNoise;
      const point = { x, z };
      const height = heightAt(x, z);

      if (isInsideBounds(point, bounds, 4) && height > minHeight) {
        run.push(new THREE.Vector3(x, yAt(x, z, height) + 1.2, z));
        continue;
      }

      addTubePath(
        `${name}-ridge-${ridgeIndex + 1}-${sample}`,
        run,
        0.66 + (ridgeIndex % 3) * 0.12,
        material,
        renderOrder,
      );
      run = [];
    }

    addTubePath(
      `${name}-ridge-${ridgeIndex + 1}-end`,
      run,
      0.66 + (ridgeIndex % 3) * 0.12,
      material,
      renderOrder,
    );
  }
}

export function addMountainStrataRidges() {
  addMountainContourRidges(
    "reservoir-mountain-visible-rock-strata",
    mountainCenter,
    MOUNTAIN_RADIUS_X_M,
    MOUNTAIN_RADIUS_Z_M,
    mountainVisibleBounds,
    MOUNTAIN_STRATA_RIDGE_COUNT,
    mountainHeightAt,
    (_x, _z, height) => mountainSurfaceYAt(height),
    MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M * 2.6,
    mountainRidgeMaterial,
    4.2,
  );
  addMountainContourRidges(
    "snow-mountain-visible-rock-strata",
    snowMountainCenter,
    SNOW_MOUNTAIN_RADIUS_X_M,
    SNOW_MOUNTAIN_RADIUS_Z_M,
    snowMountainVisibleBounds,
    SNOW_MOUNTAIN_STRATA_RIDGE_COUNT,
    snowMountainHeightAt,
    snowMountainSurfaceYAt,
    SNOW_MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M * 1.9,
    mountainRidgeMaterial,
    4.6,
  );
}

export function createSnowCapOverlayGeometry() {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const heights: number[] = [];

  for (let zIndex = 0; zIndex <= SNOW_MOUNTAIN_GRID_SEGMENTS; zIndex += 1) {
    const z = THREE.MathUtils.lerp(
      snowMountainVisibleBounds.minZ,
      snowMountainVisibleBounds.maxZ,
      zIndex / SNOW_MOUNTAIN_GRID_SEGMENTS,
    );

    for (let xIndex = 0; xIndex <= SNOW_MOUNTAIN_GRID_SEGMENTS; xIndex += 1) {
      const x = THREE.MathUtils.lerp(
        snowMountainVisibleBounds.minX,
        snowMountainVisibleBounds.maxX,
        xIndex / SNOW_MOUNTAIN_GRID_SEGMENTS,
      );
      const height = snowMountainHeightAt(x, z);
      const windRipple = 0.8 * Math.sin(x * 0.018 + z * 0.011);

      heights.push(height);
      positions.push(x, snowMountainSurfaceYAt(x, z, height) + 1.1 + windRipple, z);
      uvs.push(x / 72, z / 72);
    }
  }

  const rowLength = SNOW_MOUNTAIN_GRID_SEGMENTS + 1;
  for (let zIndex = 0; zIndex < SNOW_MOUNTAIN_GRID_SEGMENTS; zIndex += 1) {
    for (let xIndex = 0; xIndex < SNOW_MOUNTAIN_GRID_SEGMENTS; xIndex += 1) {
      const a = zIndex * rowLength + xIndex;
      const b = a + 1;
      const c = a + rowLength;
      const d = c + 1;
      const cellMinHeight = Math.min(heights[a], heights[b], heights[c], heights[d]);

      if (cellMinHeight > SNOW_MOUNTAIN_SNOWLINE_M * 0.96) {
        indices.push(a, c, b, b, c, d);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function addSnowCapOverlay() {
  const cap = new THREE.Mesh(createSnowCapOverlayGeometry(), snowPatchMaterial);
  cap.name = "high-mountain-separate-snow-cap-overlay";
  cap.renderOrder = 4.7;
  cap.castShadow = true;
  cap.receiveShadow = true;
  naturalElements.add(cap);
  snowCapOverlayInstalled = true;
}

export function addMountainTalusField(
  name: string,
  center: GroundPathPoint,
  radiusX: number,
  radiusZ: number,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  targetCount: number,
  heightAt: (x: number, z: number) => number,
  yAt: (x: number, z: number, height: number) => number,
  minHeight: number,
  maxHeight: number,
) {
  const placements: ScaledXYZPlacement[] = [];

  for (let index = 0; placements.length < targetCount && index < targetCount * 6; index += 1) {
    const angle = index * 2.399963229728653;
    const ratio = 0.58 + ((index * 37) % 100) / 100 * 0.38;
    const x = center.x + Math.cos(angle) * radiusX * ratio;
    const z = center.z + Math.sin(angle) * radiusZ * ratio;
    const point = { x, z };
    const height = heightAt(x, z);

    if (
      !isInsideBounds(point, bounds, 10) ||
      height < minHeight ||
      height > maxHeight ||
      corridorClearance(x, z) < 20
    ) {
      continue;
    }

    placements.push({
      x,
      y: yAt(x, z, height) + 1.2,
      z,
      scaleX: 4.2 + (index % 5) * 0.9,
      scaleY: 1.5 + (index % 4) * 0.42,
      scaleZ: 3.5 + (index % 6) * 0.75,
    });
  }

  addScaledSphereInstances(name, talusRockMaterial, placements);
  talusBoulderInstanceCount += placements.length;
}

export function addMountainTalusFields() {
  addMountainTalusField(
    "reservoir-mountain-talus-boulder-field",
    mountainCenter,
    MOUNTAIN_RADIUS_X_M,
    MOUNTAIN_RADIUS_Z_M,
    mountainVisibleBounds,
    MOUNTAIN_TALUS_BOULDER_COUNT,
    mountainHeightAt,
    (_x, _z, height) => mountainSurfaceYAt(height),
    MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M * 1.6,
    MOUNTAIN_HEIGHT_M * 0.7,
  );
  addMountainTalusField(
    "snow-mountain-talus-boulder-field",
    snowMountainCenter,
    SNOW_MOUNTAIN_RADIUS_X_M,
    SNOW_MOUNTAIN_RADIUS_Z_M,
    snowMountainVisibleBounds,
    SNOW_MOUNTAIN_TALUS_BOULDER_COUNT,
    snowMountainHeightAt,
    snowMountainSurfaceYAt,
    SNOW_MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M * 1.35,
    SNOW_MOUNTAIN_SNOWLINE_M * 0.9,
  );
}

export function addMainlandOutsideBoundary() {
  addFlatPlane(
    "mainland-outside-boundary-west",
    MAINLAND_WEST_MARGIN_M,
    mainlandDepth,
    mainlandMaterial,
    (mainlandMinX + mainBoundaryMinX) / 2,
    MAINLAND_Y,
    mainlandCenterZ,
    1,
  );
  addFlatPlane(
    "mainland-outside-boundary-south",
    mainBoundaryMaxX - mainBoundaryMinX,
    MAINLAND_NORTH_SOUTH_MARGIN_M,
    mainlandMaterial,
    mainBoundaryCenterX,
    MAINLAND_Y,
    (mainlandMinZ + mainBoundaryMinZ) / 2,
    1,
  );
  addFlatPlane(
    "mainland-outside-boundary-north",
    mainBoundaryMaxX - mainBoundaryMinX,
    MAINLAND_NORTH_SOUTH_MARGIN_M,
    mainlandMaterial,
    mainBoundaryCenterX,
    MAINLAND_Y,
    (mainBoundaryMaxZ + mainlandMaxZ) / 2,
    1,
  );
}

export function mountainHeightAt(x: number, z: number) {
  const normalizedX = (x - mountainCenter.x) / MOUNTAIN_RADIUS_X_M;
  const normalizedZ = (z - mountainCenter.z) / MOUNTAIN_RADIUS_Z_M;
  const distance = Math.sqrt(normalizedX * normalizedX + normalizedZ * normalizedZ);

  if (distance >= 1) {
    return 0;
  }

  const ridgeNoise =
    0.93 +
    0.05 * Math.sin(x * 0.021 + z * 0.013) +
    0.035 * Math.sin(x * 0.009 - z * 0.017);
  return MOUNTAIN_HEIGHT_M * Math.pow(1 - distance, 1.72) * ridgeNoise;
}

export function mountainSurfaceYAt(height: number) {
  return GRASS_SURFACE_Y + height + MOUNTAIN_SURFACE_LIFT_M;
}

export function setMountainVertexColor(height: number, color: THREE.Color) {
  if (height <= MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M) {
    const foothillBlend = THREE.MathUtils.smoothstep(
      height / MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M,
      0,
      1,
    );
    color.copy(terrainGrassColor).lerp(mountainLowColor, foothillBlend);
    return;
  }

  const mountainRatio = THREE.MathUtils.clamp(
    (height - MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M) /
      (MOUNTAIN_HEIGHT_M - MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M),
    0,
    1,
  );

  if (mountainRatio < 0.5) {
    color.copy(mountainLowColor).lerp(mountainMidColor, mountainRatio / 0.5);
  } else {
    color.copy(mountainMidColor).lerp(mountainHighColor, (mountainRatio - 0.5) / 0.5);
  }
}

export function createMountainSurfaceGeometry(
  shouldIncludeCell: (cellMaxHeight: number) => boolean,
) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const heights: number[] = [];
  const color = new THREE.Color();

  for (let zIndex = 0; zIndex <= MOUNTAIN_GRID_SEGMENTS; zIndex += 1) {
    const zRatio = zIndex / MOUNTAIN_GRID_SEGMENTS;
    const z = THREE.MathUtils.lerp(
      mountainVisibleBounds.minZ,
      mountainVisibleBounds.maxZ,
      zRatio,
    );

    for (let xIndex = 0; xIndex <= MOUNTAIN_GRID_SEGMENTS; xIndex += 1) {
      const xRatio = xIndex / MOUNTAIN_GRID_SEGMENTS;
      const x = THREE.MathUtils.lerp(
        mountainVisibleBounds.minX,
        mountainVisibleBounds.maxX,
        xRatio,
      );
      const height = mountainHeightAt(x, z);
      heights.push(height);
      setMountainVertexColor(height, color);

      positions.push(x, Math.min(mountainSurfaceYAt(height), cutLimitAt(x, z)), z);
      colors.push(color.r, color.g, color.b);
    }
  }

  const rowLength = MOUNTAIN_GRID_SEGMENTS + 1;
  for (let zIndex = 0; zIndex < MOUNTAIN_GRID_SEGMENTS; zIndex += 1) {
    for (let xIndex = 0; xIndex < MOUNTAIN_GRID_SEGMENTS; xIndex += 1) {
      const a = zIndex * rowLength + xIndex;
      const b = a + 1;
      const c = a + rowLength;
      const d = c + 1;
      const cellMaxHeight = Math.max(heights[a], heights[b], heights[c], heights[d]);

      if (shouldIncludeCell(cellMaxHeight)) {
        indices.push(a, c, b, b, c, d);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function addMountainFoothillBlend() {
  const foothill = new THREE.Mesh(
    createMountainSurfaceGeometry(
      (cellMaxHeight) =>
        cellMaxHeight > TERRAIN_SKIN_MAX_MOUNTAIN_HEIGHT_M - 6 &&
        cellMaxHeight <= MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M,
    ),
    mountainMaterial,
  );
  foothill.name = "mountain-grass-foothill-blend";
  foothill.renderOrder = 3;
  foothill.receiveShadow = true;
  naturalElements.add(foothill);
}

export function addClippedMountain() {
  const mountain = new THREE.Mesh(
    createMountainSurfaceGeometry(
      (cellMaxHeight) => cellMaxHeight > MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M,
    ),
    mountainMaterial,
  );
  mountain.name = "clipped-corner-mountain";
  mountain.renderOrder = 3;
  mountain.castShadow = false;
  mountain.receiveShadow = true;
  naturalElements.add(mountain);

  addMountainCutWall("mountain-west-vertical-cut", "west");
  addMountainCutWall("mountain-south-vertical-cut", "south");
}

export function addMountainCutWall(name: string, edge: "west" | "south") {
  const positions: number[] = [];
  const indices: number[] = [];
  const samples = MOUNTAIN_GRID_SEGMENTS;

  for (let index = 0; index <= samples; index += 1) {
    const ratio = index / samples;
    const x =
      edge === "west"
        ? mountainVisibleBounds.minX
        : THREE.MathUtils.lerp(mountainVisibleBounds.minX, mountainVisibleBounds.maxX, ratio);
    const z =
      edge === "south"
        ? mountainVisibleBounds.maxZ
        : THREE.MathUtils.lerp(mountainVisibleBounds.minZ, mountainVisibleBounds.maxZ, ratio);
    const y = GRASS_SURFACE_Y + mountainHeightAt(x, z);

    positions.push(x, y, z, x, GRASS_SURFACE_Y, z);
  }

  for (let index = 0; index < samples; index += 1) {
    const topA = index * 2;
    const bottomA = topA + 1;
    const topB = topA + 2;
    const bottomB = topA + 3;
    indices.push(topA, bottomA, topB, topB, bottomA, bottomB);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  addPlanarXZUVs(geometry);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const cut = new THREE.Mesh(geometry, mountainCutMaterial);
  cut.name = name;
  cut.renderOrder = 3;
  cut.castShadow = false;
  cut.receiveShadow = true;
  naturalElements.add(cut);
}

export function snowMountainHeightAt(x: number, z: number) {
  const normalizedX = (x - snowMountainCenter.x) / SNOW_MOUNTAIN_RADIUS_X_M;
  const normalizedZ = (z - snowMountainCenter.z) / SNOW_MOUNTAIN_RADIUS_Z_M;
  const distance = Math.sqrt(normalizedX * normalizedX + normalizedZ * normalizedZ);

  if (distance >= 1) {
    return 0;
  }

  const summitDistance = Math.sqrt(
    ((normalizedX + 0.07) / 0.96) ** 2 + ((normalizedZ - 0.04) / 1.02) ** 2,
  );
  const ridgeAngle = Math.atan2(normalizedZ, normalizedX);
  const centerMass = THREE.MathUtils.smoothstep(1 - distance, 0, 1);
  const ridgeNoise =
    0.96 +
    0.028 * Math.sin(x * 0.01 + z * 0.008) +
    0.022 * Math.sin(x * 0.006 - z * 0.012) +
    0.016 * Math.sin((x + z) * 0.005);
  const broadSlope = Math.pow(centerMass, 1.04);
  const summitLift =
    0.8 + 0.2 * Math.pow(Math.max(0, 1 - summitDistance / 0.76), 1.55);
  const ridgeLift =
    1 + 0.055 * Math.cos(ridgeAngle * 2.1 + distance * 4.8) * centerMass;
  return SNOW_MOUNTAIN_HEIGHT_M * broadSlope * summitLift * ridgeLift * ridgeNoise;
}

export function snowMountainFaceOutwardNormalAt(point: GroundPathPoint) {
  const sampleStepM = 8;
  const heightGradientX =
    (snowMountainHeightAt(point.x + sampleStepM, point.z) -
      snowMountainHeightAt(point.x - sampleStepM, point.z)) /
    (sampleStepM * 2);
  const heightGradientZ =
    (snowMountainHeightAt(point.x, point.z + sampleStepM) -
      snowMountainHeightAt(point.x, point.z - sampleStepM)) /
    (sampleStepM * 2);
  let outwardX = -heightGradientX;
  let outwardZ = -heightGradientZ;
  let length = Math.hypot(outwardX, outwardZ);

  if (length < 0.0001) {
    outwardX = (point.x - snowMountainCenter.x) / SNOW_MOUNTAIN_RADIUS_X_M ** 2;
    outwardZ = (point.z - snowMountainCenter.z) / SNOW_MOUNTAIN_RADIUS_Z_M ** 2;
    length = Math.hypot(outwardX, outwardZ) || 1;
  }

  return {
    x: outwardX / length,
    z: outwardZ / length,
  };
}

export function estimateSnowMountainVisiblePortion() {
  let fullFootprintSamples = 0;
  let visibleFootprintSamples = 0;
  const samples = 72;

  for (let zIndex = 0; zIndex <= samples; zIndex += 1) {
    const z = THREE.MathUtils.lerp(
      snowMountainCenter.z - SNOW_MOUNTAIN_RADIUS_Z_M,
      snowMountainCenter.z + SNOW_MOUNTAIN_RADIUS_Z_M,
      zIndex / samples,
    );

    for (let xIndex = 0; xIndex <= samples; xIndex += 1) {
      const x = THREE.MathUtils.lerp(
        snowMountainCenter.x - SNOW_MOUNTAIN_RADIUS_X_M,
        snowMountainCenter.x + SNOW_MOUNTAIN_RADIUS_X_M,
        xIndex / samples,
      );
      const normalizedX = (x - snowMountainCenter.x) / SNOW_MOUNTAIN_RADIUS_X_M;
      const normalizedZ = (z - snowMountainCenter.z) / SNOW_MOUNTAIN_RADIUS_Z_M;

      if (normalizedX * normalizedX + normalizedZ * normalizedZ > 1) {
        continue;
      }

      fullFootprintSamples += 1;

      if (
        x >= mainBoundaryMinX &&
        x <= mainBoundaryMaxX &&
        z >= mainBoundaryMinZ &&
        z <= mainBoundaryMaxZ
      ) {
        visibleFootprintSamples += 1;
      }
    }
  }

  return visibleFootprintSamples / fullFootprintSamples;
}

export function snowMountainBaseYAt(x: number, z: number) {
  return mountainSurfaceYAt(mountainHeightAt(x, z)) + SNOW_MOUNTAIN_SURFACE_LIFT_M;
}

export function snowMountainSurfaceYAt(x: number, z: number, height: number) {
  return snowMountainBaseYAt(x, z) + height;
}

export function setSnowMountainVertexColor(height: number, color: THREE.Color) {
  if (height <= SNOW_MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M) {
    const foothillBlend = THREE.MathUtils.smoothstep(
      height / SNOW_MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M,
      0,
      1,
    );
    color.copy(terrainGrassColor).lerp(mountainLowColor, foothillBlend);
    return;
  }

  if (height < SNOW_MOUNTAIN_SNOWLINE_M) {
    const rockBlend = THREE.MathUtils.smoothstep(
      (height - SNOW_MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M) /
        (SNOW_MOUNTAIN_SNOWLINE_M - SNOW_MOUNTAIN_FOOTHILL_BLEND_HEIGHT_M),
      0,
      1,
    );
    color.copy(mountainLowColor).lerp(mountainHighColor, rockBlend);
    return;
  }

  const snowBlend = THREE.MathUtils.smoothstep(
    (height - SNOW_MOUNTAIN_SNOWLINE_M) /
      (SNOW_MOUNTAIN_HEIGHT_M - SNOW_MOUNTAIN_SNOWLINE_M),
    0,
    1,
  );
  color.copy(snowShadowColor).lerp(snowColor, snowBlend);
}

export function createSnowMountainSurfaceGeometry() {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const heights: number[] = [];
  const color = new THREE.Color();

  for (let zIndex = 0; zIndex <= SNOW_MOUNTAIN_GRID_SEGMENTS; zIndex += 1) {
    const zRatio = zIndex / SNOW_MOUNTAIN_GRID_SEGMENTS;
    const z = THREE.MathUtils.lerp(
      snowMountainVisibleBounds.minZ,
      snowMountainVisibleBounds.maxZ,
      zRatio,
    );

    for (let xIndex = 0; xIndex <= SNOW_MOUNTAIN_GRID_SEGMENTS; xIndex += 1) {
      const xRatio = xIndex / SNOW_MOUNTAIN_GRID_SEGMENTS;
      const x = THREE.MathUtils.lerp(
        snowMountainVisibleBounds.minX,
        snowMountainVisibleBounds.maxX,
        xRatio,
      );
      const height = snowMountainHeightAt(x, z);

      heights.push(height);
      setSnowMountainVertexColor(height, color);
      positions.push(x, Math.min(snowMountainSurfaceYAt(x, z, height), cutLimitAt(x, z)), z);
      colors.push(color.r, color.g, color.b);
    }
  }

  const rowLength = SNOW_MOUNTAIN_GRID_SEGMENTS + 1;
  for (let zIndex = 0; zIndex < SNOW_MOUNTAIN_GRID_SEGMENTS; zIndex += 1) {
    for (let xIndex = 0; xIndex < SNOW_MOUNTAIN_GRID_SEGMENTS; xIndex += 1) {
      const a = zIndex * rowLength + xIndex;
      const b = a + 1;
      const c = a + rowLength;
      const d = c + 1;
      const cellMaxHeight = Math.max(heights[a], heights[b], heights[c], heights[d]);

      if (cellMaxHeight > TERRAIN_SKIN_MAX_MOUNTAIN_HEIGHT_M - 6) {
        indices.push(a, c, b, b, c, d);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function addSnowCappedMountain() {
  const mountain = new THREE.Mesh(createSnowMountainSurfaceGeometry(), mountainMaterial);
  mountain.name = "higher-snow-capped-southwest-mountain";
  mountain.renderOrder = 4;
  mountain.castShadow = false;
  mountain.receiveShadow = true;
  naturalElements.add(mountain);

  addSnowMountainCutWall("snow-mountain-west-vertical-cut", "west");
  addSnowMountainCutWall("snow-mountain-south-vertical-cut", "south");
}

export function addSnowMountainCutWall(name: string, edge: "west" | "south") {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const samples = SNOW_MOUNTAIN_GRID_SEGMENTS;
  const verticalSegments = 10;
  const rowLength = verticalSegments + 1;
  const color = new THREE.Color();

  for (let index = 0; index <= samples; index += 1) {
    const ratio = index / samples;
    const x =
      edge === "west"
        ? snowMountainVisibleBounds.minX
        : THREE.MathUtils.lerp(
            snowMountainVisibleBounds.minX,
            snowMountainVisibleBounds.maxX,
            ratio,
          );
    const z =
      edge === "south"
        ? snowMountainVisibleBounds.minZ
        : THREE.MathUtils.lerp(
            snowMountainVisibleBounds.minZ,
            snowMountainVisibleBounds.maxZ,
            ratio,
          );
    const height = snowMountainHeightAt(x, z);
    const bottomY = snowMountainBaseYAt(x, z);

    for (let verticalIndex = 0; verticalIndex <= verticalSegments; verticalIndex += 1) {
      const heightRatio = verticalIndex / verticalSegments;
      const localHeight = height * heightRatio;

      setSnowMountainVertexColor(localHeight, color);
      positions.push(x, bottomY + localHeight, z);
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let index = 0; index < samples; index += 1) {
    for (let verticalIndex = 0; verticalIndex < verticalSegments; verticalIndex += 1) {
      const a = index * rowLength + verticalIndex;
      const b = a + 1;
      const c = a + rowLength;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const cut = new THREE.Mesh(geometry, mountainMaterial);
  cut.name = name;
  cut.renderOrder = 4;
  cut.castShadow = false;
  cut.receiveShadow = true;
  naturalElements.add(cut);
}

export function terrainSurfaceYAt(point: GroundPathPoint) {
  return GRASS_SURFACE_Y + mountainHeightAt(point.x, point.z);
}

export function fullTerrainSurfaceYAt(point: GroundPathPoint) {
  const snowHeight = snowMountainHeightAt(point.x, point.z);
  const baseTerrainY = terrainSurfaceYAt(point);

  if (snowHeight <= SNOW_MOUNTAIN_MIN_RENDER_HEIGHT_M) {
    return baseTerrainY;
  }

  return Math.max(
    baseTerrainY,
    snowMountainSurfaceYAt(point.x, point.z, snowHeight),
  );
}
