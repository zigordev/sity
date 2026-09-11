import * as THREE from "three";
import type { PavementFloor } from "../roads/pavement";
import { pavementClearance } from "../world/occupancy";
import { COASTAL_INLET_OVERLAP_M, DAM_NATURAL_BANK_OPENING_HALF_LENGTH_M, DAM_THICKNESS_M, DAM_WATER_FACE_HALF_LENGTH_M, ESTUARY_BANK_CREST_OFFSET_M, ESTUARY_BANK_CREST_RISE_M, ESTUARY_BANK_INNER_DROP_M, ESTUARY_BANK_WIDTH_M, GRASS_SURFACE_Y, MOUNTAIN_HEIGHT_M, RESERVOIR_BANK_CREST_SCALE, RESERVOIR_BANK_INNER_SCALE, RESERVOIR_BANK_OUTER_SCALE, RESERVOIR_BANK_SEGMENTS, RESERVOIR_DAM_FACE_SAMPLES, RESERVOIR_DAM_OPENING_HALF_ANGLE_RAD, RESERVOIR_RADIUS_X_M, RESERVOIR_RADIUS_Z_M, RESERVOIR_SEGMENTS, RESERVOIR_WATER_DAM_FACE_SETBACK_M, RESERVOIR_WATER_DEPTH_M, RIVER_CHANNEL_BANK_WIDTH_M, RIVER_CHANNEL_CREST_OFFSET_M, RIVER_CHANNEL_CREST_RISE_M, RIVER_CHANNEL_INNER_DROP_M, RIVER_CHANNEL_WATER_EDGE_OVERLAP_M, RIVER_LOWLAND_WATER_CLEARANCE_M, RIVER_MOUTH_WIDTH_M, RIVER_PEBBLE_COUNT, RIVER_REED_CLUSTER_COUNT, RIVER_SOURCE_TAPER_PROGRESS, RIVER_SOURCE_WIDTH_M, RIVER_WIDTH_M, SEA_MARGIN_M, SEA_Y, SHALLOW_WATER_SHELF_WIDTH_M } from "../config/constants";
import { addPlanarXZUVs, addScaledOrientedSphereInstances } from "../geometry/helpers";
import { createRoadRibbonSurfaceGeometry, offsetRoadPath, pathTangent } from "../geometry/ribbons";
import { GroundPathPoint, RoadPathPoint, ScaledOrientedXYZPlacement } from "../geometry/types";
import { fullTerrainSurfaceYAt, mountainHeightAt, terrainSurfaceYAt } from "./terrain";
import { naturalElements } from "../render/context";
import { concreteSeamMaterial, mountainMaterial, reedMaterial, riverBankCrestColor, riverBankMaterial, riverBankOuterColor, riverBankWetColor, sharedSeaWaterMaterial, smallPebbleMaterial } from "../render/materials";
import { curvedDamPoint, damCenter, damLongAxis, mainBoundaryMaxX, mainBoundaryMaxZ, mainBoundaryMinX, mainBoundaryMinZ, maxWorldZ, minWorldZ, reservoirCenter, reservoirOutletDirection, reservoirOutletEdge, reservoirOutletScale, riverEstuaryStart, riverMouth, riverPath, riverSeaTransitionPath, seaCenter } from "../world/frame";

export type ReservoirLakeBoundaryPoint = GroundPathPoint & {
  isDamFace: boolean;
};

export let seaWater: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

export let sharedSeaWaterSurfaceCount = 0;

export function addSharedSeaWaterMesh(
  name: string,
  geometry: THREE.BufferGeometry,
  renderOrder: number,
  parent: THREE.Object3D = naturalElements,
) {
  if (!geometry.getAttribute("uv")) {
    addPlanarXZUVs(geometry);
  }

  const mesh = new THREE.Mesh(geometry, sharedSeaWaterMaterial);
  mesh.name = name;
  mesh.renderOrder = renderOrder;
  mesh.receiveShadow = true;
  parent.add(mesh);
  sharedSeaWaterSurfaceCount += 1;
  return mesh;
}

export function addSurroundingShaderSea() {
  const shaderSeaWidth = SEA_MARGIN_M + COASTAL_INLET_OVERLAP_M + 420;
  const shaderSeaDepth = maxWorldZ - minWorldZ + SEA_MARGIN_M * 2;
  seaWater = addSharedSeaWaterMesh(
    "surrounding-sea-shader-water",
    new THREE.PlaneGeometry(shaderSeaWidth, shaderSeaDepth, 1, 1),
    0,
  );
  seaWater.rotation.x = -Math.PI / 2;
  seaWater.position.set(
    mainBoundaryMaxX + shaderSeaWidth * 0.5 - COASTAL_INLET_OVERLAP_M,
    SEA_Y - 0.06,
    seaCenter.z,
  );
}

export function addCoastalShallowWaterShelf() {
  const shelfSouthZ = mainBoundaryMinZ;
  const points = [
    { x: mainBoundaryMaxX - 2, z: shelfSouthZ },
    { x: mainBoundaryMaxX + SHALLOW_WATER_SHELF_WIDTH_M * 0.38, z: shelfSouthZ - 16 },
    { x: mainBoundaryMaxX + SHALLOW_WATER_SHELF_WIDTH_M, z: riverMouth.z - 76 },
    { x: mainBoundaryMaxX + SHALLOW_WATER_SHELF_WIDTH_M * 0.86, z: mainBoundaryMaxZ + 108 },
    { x: mainBoundaryMaxX + SHALLOW_WATER_SHELF_WIDTH_M * 0.16, z: mainBoundaryMaxZ + 74 },
    { x: mainBoundaryMaxX - 2, z: mainBoundaryMaxZ },
    { x: mainBoundaryMaxX - 2, z: riverMouth.z + 140 },
  ];
  const positions: number[] = [];
  const indices = THREE.ShapeUtils.triangulateShape(
    points.map((point) => new THREE.Vector2(point.x, point.z)),
    [],
  ).flat();

  for (const point of points) {
    positions.push(point.x, SEA_Y + 0.045, point.z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  addPlanarXZUVs(geometry);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  addSharedSeaWaterMesh("coastal-shallow-water-shelf", geometry, 1);
}

export function riverRoadLikePath(yLift = 0): RoadPathPoint[] {
  return riverPath.map((point, index) => {
    const progress = index / Math.max(riverPath.length - 1, 1);
    return {
      x: point.x,
      y: riverWaterYAt(point, progress) + yLift,
      z: point.z,
    };
  });
}

export function addNaturalSurfaceRibbon(
  name: string,
  path: RoadPathPoint[],
  width: number,
  material: THREE.Material,
  renderOrder: number,
) {
  const mesh = new THREE.Mesh(
    createRoadRibbonSurfaceGeometry(path, width, false, 0),
    material,
  );
  mesh.name = name;
  mesh.renderOrder = renderOrder;
  mesh.receiveShadow = true;
  naturalElements.add(mesh);
}

export function addRiverErosionRibbons() {
  const basePath = riverRoadLikePath(0.36);

  for (const [index, offset] of [
    -(RIVER_WIDTH_M * 0.5 + 4),
    RIVER_WIDTH_M * 0.5 + 4,
  ].entries()) {
    addNaturalSurfaceRibbon(
      `river-wet-erosion-edge-${index + 1}`,
      offsetRoadPath(basePath, offset, false),
      3.8,
      concreteSeamMaterial,
      6,
    );
  }
}

export function addRiverReedsAndPebbles() {
  const riverSurfacePath = riverRoadLikePath();
  const reedMatrix = new THREE.Matrix4();
  const reedPosition = new THREE.Vector3();
  const reedQuaternion = new THREE.Quaternion();
  const reedScale = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const reedMatrices: THREE.Matrix4[] = [];
  const pebblePlacements: ScaledOrientedXYZPlacement[] = [];

  for (let index = 0; index < RIVER_REED_CLUSTER_COUNT; index += 1) {
    const pathIndex = 5 + ((index * 7) % Math.max(riverSurfacePath.length - 11, 1));
    const point = riverSurfacePath[pathIndex];
    const tangent = pathTangent(riverSurfacePath, pathIndex, false);
    const sideSign = index % 2 === 0 ? -1 : 1;
    const offset = (RIVER_WIDTH_M * 0.5 + 12 + (index % 4) * 5) * sideSign;
    const x = point.x + tangent.normalX * offset;
    const z = point.z + tangent.normalZ * offset;
    if (pavementClearance(x, z, 30) < 3) {
      continue;
    }
    const height = 3.8 + (index % 5) * 0.55;
    const groundY = fullTerrainSurfaceYAt({ x, z });

    reedPosition.set(x, groundY + height * 0.5, z);
    reedQuaternion.setFromAxisAngle(yAxis, index * 0.77);
    reedScale.set(0.9 + (index % 3) * 0.12, height, 0.9 + (index % 4) * 0.08);
    reedMatrix.compose(reedPosition, reedQuaternion, reedScale);
    reedMatrices.push(reedMatrix.clone());
  }

  const reedMesh = new THREE.InstancedMesh(new THREE.ConeGeometry(0.85, 1, 5), reedMaterial, reedMatrices.length);
  reedMatrices.forEach((matrix, index) => reedMesh.setMatrixAt(index, matrix));
  reedMesh.instanceMatrix.needsUpdate = true;
  reedMesh.name = "riverbank-reed-clusters";
  reedMesh.castShadow = true;
  reedMesh.receiveShadow = true;
  naturalElements.add(reedMesh);

  for (let index = 0; index < RIVER_PEBBLE_COUNT; index += 1) {
    const pathIndex = 4 + ((index * 5) % Math.max(riverSurfacePath.length - 9, 1));
    const point = riverSurfacePath[pathIndex];
    const tangent = pathTangent(riverSurfacePath, pathIndex, false);
    const sideSign = index % 2 === 0 ? -1 : 1;
    const offset = (RIVER_WIDTH_M * 0.5 + 3 + (index % 5) * 2.1) * sideSign;
    const x = point.x + tangent.normalX * offset;
    const z = point.z + tangent.normalZ * offset;
    if (pavementClearance(x, z, 30) < 3) {
      continue;
    }

    pebblePlacements.push({
      x,
      y: fullTerrainSurfaceYAt({ x, z }) + 0.45,
      z,
      rotationY: index * 0.41,
      scaleX: 1.2 + (index % 4) * 0.32,
      scaleY: 0.35 + (index % 3) * 0.08,
      scaleZ: 0.85 + (index % 5) * 0.2,
    });
  }

  addScaledOrientedSphereInstances("riverbank-pebble-fields", smallPebbleMaterial, pebblePlacements);
}

export function addNaturalDetailPass() {
  addRiverErosionRibbons();
  addRiverReedsAndPebbles();
}

export function reservoirOutletAngle() {
  return Math.atan2(
    (reservoirOutletEdge.z - reservoirCenter.z) / RESERVOIR_RADIUS_Z_M,
    (reservoirOutletEdge.x - reservoirCenter.x) / RESERVOIR_RADIUS_X_M,
  );
}

export function signedAngleDistance(angle: number, target: number) {
  return Math.atan2(Math.sin(angle - target), Math.cos(angle - target));
}

export function reservoirLakeBoundaryPoint(angle: number, index: number) {
  const edgeNoise = reservoirEdgeNoise(index);
  return {
    x: reservoirCenter.x + Math.cos(angle) * RESERVOIR_RADIUS_X_M * edgeNoise,
    z: reservoirCenter.z + Math.sin(angle) * RESERVOIR_RADIUS_Z_M * edgeNoise,
    isDamFace: false,
  };
}

export function reservoirWaterDamFacePoint(lengthOffset: number) {
  const point = curvedDamPoint(
    lengthOffset,
    -DAM_THICKNESS_M * 0.5 - RESERVOIR_WATER_DAM_FACE_SETBACK_M,
  );

  return {
    ...point,
    isDamFace: true,
  };
}

export function createReservoirLakeBoundaryPoints() {
  const boundaryPoints: ReservoirLakeBoundaryPoint[] = [];
  const outletAngle = reservoirOutletAngle();
  let damFaceInserted = false;

  for (let index = 0; index < RESERVOIR_SEGMENTS; index += 1) {
    const angle = (index / RESERVOIR_SEGMENTS) * Math.PI * 2;
    const inDamOpening =
      Math.abs(signedAngleDistance(angle, outletAngle)) <
      RESERVOIR_DAM_OPENING_HALF_ANGLE_RAD;

    if (!inDamOpening) {
      boundaryPoints.push(reservoirLakeBoundaryPoint(angle, index));
      continue;
    }

    if (!damFaceInserted) {
      for (let station = 0; station <= RESERVOIR_DAM_FACE_SAMPLES; station += 1) {
        const ratio = station / RESERVOIR_DAM_FACE_SAMPLES;
        const lengthOffset = THREE.MathUtils.lerp(
          -DAM_WATER_FACE_HALF_LENGTH_M,
          DAM_WATER_FACE_HALF_LENGTH_M,
          ratio,
        );
        boundaryPoints.push(reservoirWaterDamFacePoint(lengthOffset));
      }

      damFaceInserted = true;
    }
  }

  return boundaryPoints;
}

export function createReservoirLakeGeometry() {
  const topY = reservoirLakeY();
  const bottomY = topY - RESERVOIR_WATER_DEPTH_M;
  const boundaryPoints = createReservoirLakeBoundaryPoints();
  const topTriangles = THREE.ShapeUtils.triangulateShape(
    boundaryPoints.map((point) => new THREE.Vector2(point.x, point.z)),
    [],
  );
  const signedArea =
    boundaryPoints.reduce((area, point, index) => {
      const next = boundaryPoints[(index + 1) % boundaryPoints.length];
      return area + point.x * next.z - next.x * point.z;
    }, 0) * 0.5;
  const boundaryRunsClockwise = signedArea < 0;
  const positions = [
    reservoirCenter.x,
    topY,
    reservoirCenter.z,
    reservoirCenter.x,
    bottomY,
    reservoirCenter.z,
  ];
  const topIndices: number[] = [];
  const bottomIndices: number[] = [];
  const sideIndices: number[] = [];

  for (const point of boundaryPoints) {
    positions.push(point.x, topY, point.z, point.x, bottomY, point.z);
  }

  for (const triangle of topTriangles) {
    const topA = 2 + triangle[0] * 2;
    const topB = 2 + triangle[1] * 2;
    const topC = 2 + triangle[2] * 2;
    const bottomA = topA + 1;
    const bottomB = topB + 1;
    const bottomC = topC + 1;

    if (boundaryRunsClockwise) {
      topIndices.push(topA, topB, topC);
      bottomIndices.push(bottomA, bottomC, bottomB);
    } else {
      topIndices.push(topA, topC, topB);
      bottomIndices.push(bottomA, bottomB, bottomC);
    }
  }

  for (let index = 0; index < boundaryPoints.length; index += 1) {
    const nextIndex = (index + 1) % boundaryPoints.length;
    const topCurrent = 2 + index * 2;
    const bottomCurrent = topCurrent + 1;
    const topNext = 2 + nextIndex * 2;
    const bottomNext = topNext + 1;

    if (boundaryPoints[index].isDamFace && boundaryPoints[nextIndex].isDamFace) {
      sideIndices.push(topCurrent, bottomCurrent, topNext);
      sideIndices.push(topNext, bottomCurrent, bottomNext);
    }
  }

  const indices = [...topIndices, ...bottomIndices, ...sideIndices];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  addPlanarXZUVs(geometry);
  geometry.setIndex(indices);
  geometry.clearGroups();
  geometry.addGroup(0, topIndices.length + bottomIndices.length, 0);
  geometry.addGroup(topIndices.length + bottomIndices.length, sideIndices.length, 1);
  geometry.computeVertexNormals();
  return geometry;
}

export function reservoirEdgeNoise(index: number) {
  return 1 + 0.045 * Math.sin(index * 1.7) + 0.025 * Math.sin(index * 3.1);
}

export function addReservoirBankVertex(
  positions: number[],
  colors: number[],
  point: GroundPathPoint,
  y: number,
) {
  const lowColor = new THREE.Color(0x6f8d57);
  const midColor = new THREE.Color(0x887c68);
  const highColor = new THREE.Color(0xb0aaa0);
  const color = new THREE.Color();
  const heightRatio = THREE.MathUtils.clamp((y - GRASS_SURFACE_Y) / MOUNTAIN_HEIGHT_M, 0, 1);

  if (heightRatio < 0.5) {
    color.copy(lowColor).lerp(midColor, heightRatio / 0.5);
  } else {
    color.copy(midColor).lerp(highColor, (heightRatio - 0.5) / 0.5);
  }

  positions.push(point.x, y, point.z);
  colors.push(color.r, color.g, color.b);
}

export function reservoirBankPoint(angle: number, index: number, scale: number) {
  const noise = reservoirEdgeNoise(index);
  return {
    x: reservoirCenter.x + Math.cos(angle) * RESERVOIR_RADIUS_X_M * scale * noise,
    z: reservoirCenter.z + Math.sin(angle) * RESERVOIR_RADIUS_Z_M * scale * noise,
  };
}

export function isReservoirBankInDamOpening(point: GroundPathPoint) {
  const fromReservoir = {
    x: point.x - reservoirCenter.x,
    z: point.z - reservoirCenter.z,
  };
  const fromDam = {
    x: point.x - damCenter.x,
    z: point.z - damCenter.z,
  };
  const alongOutlet =
    fromReservoir.x * reservoirOutletDirection.x +
    fromReservoir.z * reservoirOutletDirection.z;
  const alongDam = fromDam.x * damLongAxis.x + fromDam.z * damLongAxis.z;

  return (
    alongOutlet > reservoirOutletScale * 0.62 &&
    Math.abs(alongDam) < DAM_NATURAL_BANK_OPENING_HALF_LENGTH_M
  );
}

export function createReservoirBasinGeometry() {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const stationInDamOpening: boolean[] = [];
  const lakeY = reservoirLakeY();

  for (let index = 0; index <= RESERVOIR_BANK_SEGMENTS; index += 1) {
    const angle = (index / RESERVOIR_BANK_SEGMENTS) * Math.PI * 2;
    const inner = reservoirBankPoint(angle, index, RESERVOIR_BANK_INNER_SCALE);
    const crest = reservoirBankPoint(angle, index, RESERVOIR_BANK_CREST_SCALE);
    const outer = reservoirBankPoint(angle, index, RESERVOIR_BANK_OUTER_SCALE);
    const outerGroundY = GRASS_SURFACE_Y + mountainHeightAt(outer.x, outer.z) + 0.8;
    const crestGroundY = GRASS_SURFACE_Y + mountainHeightAt(crest.x, crest.z) + 1.2;
    const bankVariation = 2.6 * Math.sin(angle * 2.4) + 1.8 * Math.sin(angle * 5.1);
    const crestY = Math.max(lakeY + 8 + bankVariation, crestGroundY);

    stationInDamOpening.push(isReservoirBankInDamOpening(crest));
    addReservoirBankVertex(positions, colors, inner, lakeY + 0.9);
    addReservoirBankVertex(positions, colors, crest, crestY);
    addReservoirBankVertex(positions, colors, outer, outerGroundY);
  }

  for (let index = 0; index < RESERVOIR_BANK_SEGMENTS; index += 1) {
    if (stationInDamOpening[index] && stationInDamOpening[index + 1]) {
      continue;
    }

    const current = index * 3;
    const next = current + 3;

    indices.push(current, next, current + 1, current + 1, next, next + 1);
    indices.push(current + 1, next + 1, current + 2, current + 2, next + 1, next + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function riverWaterYAt(point: GroundPathPoint, progress: number) {
  void progress;
  return Math.max(
    GRASS_SURFACE_Y + RIVER_LOWLAND_WATER_CLEARANCE_M,
    GRASS_SURFACE_Y + mountainHeightAt(point.x, point.z) + RIVER_LOWLAND_WATER_CLEARANCE_M,
  );
}

export function riverWidthAt(progress: number) {
  const outletBlend = THREE.MathUtils.smoothstep(progress, 0, RIVER_SOURCE_TAPER_PROGRESS);
  const upperCourseWidth = THREE.MathUtils.lerp(
    RIVER_SOURCE_WIDTH_M,
    RIVER_WIDTH_M,
    outletBlend,
  );
  const lowerCourseBlend = THREE.MathUtils.smoothstep(progress, 0.62, 1);
  return THREE.MathUtils.lerp(upperCourseWidth, RIVER_MOUTH_WIDTH_M, lowerCourseBlend);
}

export function estuaryWidthAt(progress: number) {
  return THREE.MathUtils.lerp(
    RIVER_MOUTH_WIDTH_M * 1.05,
    RIVER_MOUTH_WIDTH_M * 2.28,
    THREE.MathUtils.smoothstep(progress, 0, 1),
  );
}

export function estuaryWaterYAt(progress: number) {
  const riverMouthY = riverWaterYAt(riverEstuaryStart, 1);
  const seaBlend = THREE.MathUtils.smoothstep(progress, 0.1, 1);
  return THREE.MathUtils.lerp(riverMouthY, SEA_Y + 0.02, seaBlend);
}

export function addRiverBankVertex(
  positions: number[],
  colors: number[],
  x: number,
  y: number,
  z: number,
  color: THREE.Color,
) {
  positions.push(
    THREE.MathUtils.clamp(x, mainBoundaryMinX, mainBoundaryMaxX),
    y,
    THREE.MathUtils.clamp(z, mainBoundaryMinZ, mainBoundaryMaxZ),
  );
  colors.push(color.r, color.g, color.b);
}

export function addChannelBankStrip(indices: number[], rowLength: number, columnA: number, columnB: number) {
  for (let index = 0; index < rowLength - 1; index += 1) {
    const current = index * 6;
    const next = current + 6;
    indices.push(
      current + columnA,
      next + columnA,
      current + columnB,
      current + columnB,
      next + columnA,
      next + columnB,
    );
  }
}

export function createRiverChannelBankGeometry(path: GroundPathPoint[]) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  path.forEach((point, index) => {
    const progress = index / (path.length - 1);
    const previous = path[Math.max(index - 1, 0)];
    const next = path[Math.min(index + 1, path.length - 1)];
    const tangentX = next.x - previous.x;
    const tangentZ = next.z - previous.z;
    const tangentLength = Math.hypot(tangentX, tangentZ) || 1;
    const normalX = -tangentZ / tangentLength;
    const normalZ = tangentX / tangentLength;
    const waterY = riverWaterYAt(point, progress);
    const terrainY = terrainSurfaceYAt(point);
    const width = riverWidthAt(progress);
    const channelVariation =
      0.18 * Math.sin(progress * Math.PI * 5.2) + 0.1 * Math.sin(progress * Math.PI * 13.1);
    const outerY = Math.max(terrainY + 0.12, waterY - RIVER_CHANNEL_INNER_DROP_M - 0.2);
    const crestY = waterY + RIVER_CHANNEL_CREST_RISE_M + channelVariation;
    const innerY = waterY - RIVER_CHANNEL_INNER_DROP_M;
    const waterEdgeOffset = width * 0.5 + RIVER_CHANNEL_WATER_EDGE_OVERLAP_M;
    const crestOffset = width * 0.5 + RIVER_CHANNEL_CREST_OFFSET_M;
    const outerOffset = width * 0.5 + RIVER_CHANNEL_BANK_WIDTH_M;

    addRiverBankVertex(
      positions,
      colors,
      point.x + normalX * outerOffset,
      outerY,
      point.z + normalZ * outerOffset,
      riverBankOuterColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x + normalX * crestOffset,
      crestY,
      point.z + normalZ * crestOffset,
      riverBankCrestColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x + normalX * waterEdgeOffset,
      innerY,
      point.z + normalZ * waterEdgeOffset,
      riverBankWetColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x - normalX * waterEdgeOffset,
      innerY,
      point.z - normalZ * waterEdgeOffset,
      riverBankWetColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x - normalX * crestOffset,
      crestY,
      point.z - normalZ * crestOffset,
      riverBankCrestColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x - normalX * outerOffset,
      outerY,
      point.z - normalZ * outerOffset,
      riverBankOuterColor,
    );
  });

  addChannelBankStrip(indices, path.length, 0, 1);
  addChannelBankStrip(indices, path.length, 1, 2);
  addChannelBankStrip(indices, path.length, 3, 4);
  addChannelBankStrip(indices, path.length, 4, 5);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createRiverStripGeometry(path: GroundPathPoint[]) {
  const positions: number[] = [];
  const indices: number[] = [];

  path.forEach((point, index) => {
    const progress = index / (path.length - 1);
    const previous = path[Math.max(index - 1, 0)];
    const next = path[Math.min(index + 1, path.length - 1)];
    const tangentX = next.x - previous.x;
    const tangentZ = next.z - previous.z;
    const tangentLength = Math.hypot(tangentX, tangentZ) || 1;
    const normalX = -tangentZ / tangentLength;
    const normalZ = tangentX / tangentLength;
    const y = riverWaterYAt(point, progress);
    const width = riverWidthAt(progress);
    const leftX = THREE.MathUtils.clamp(
      point.x + normalX * width * 0.5,
      mainBoundaryMinX,
      mainBoundaryMaxX,
    );
    const leftZ = THREE.MathUtils.clamp(
      point.z + normalZ * width * 0.5,
      mainBoundaryMinZ,
      mainBoundaryMaxZ,
    );
    const rightX = THREE.MathUtils.clamp(
      point.x - normalX * width * 0.5,
      mainBoundaryMinX,
      mainBoundaryMaxX,
    );
    const rightZ = THREE.MathUtils.clamp(
      point.z - normalZ * width * 0.5,
      mainBoundaryMinZ,
      mainBoundaryMaxZ,
    );

    positions.push(leftX, y, leftZ, rightX, y, rightZ);
  });

  for (let index = 0; index < path.length - 1; index += 1) {
    const leftA = index * 2;
    const rightA = leftA + 1;
    const leftB = leftA + 2;
    const rightB = leftA + 3;
    indices.push(leftA, rightA, leftB, leftB, rightA, rightB);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  addPlanarXZUVs(geometry);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createEstuaryStripGeometry(path: GroundPathPoint[]) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  path.forEach((point, index) => {
    const progress = index / (path.length - 1);
    const previous = path[Math.max(index - 1, 0)];
    const next = path[Math.min(index + 1, path.length - 1)];
    const tangentX = next.x - previous.x;
    const tangentZ = next.z - previous.z;
    const tangentLength = Math.hypot(tangentX, tangentZ) || 1;
    const normalX = -tangentZ / tangentLength;
    const normalZ = tangentX / tangentLength;
    const width = estuaryWidthAt(progress);
    const y = estuaryWaterYAt(progress);

    positions.push(
      point.x + normalX * width * 0.5,
      y,
      point.z + normalZ * width * 0.5,
      point.x - normalX * width * 0.5,
      y,
      point.z - normalZ * width * 0.5,
    );
    uvs.push(progress * 4, 0, progress * 4, 1);
  });

  for (let index = 0; index < path.length - 1; index += 1) {
    const leftA = index * 2;
    const rightA = leftA + 1;
    const leftB = leftA + 2;
    const rightB = leftA + 3;
    indices.push(leftA, rightA, leftB, leftB, rightA, rightB);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  void uvs;
  return geometry;
}

export function createEstuaryBankGeometry(path: GroundPathPoint[]) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const bankPath = path.filter((point) => point.x <= mainBoundaryMaxX);

  bankPath.forEach((point, index) => {
    const progress = index / Math.max(bankPath.length - 1, 1);
    const previous = bankPath[Math.max(index - 1, 0)];
    const next = bankPath[Math.min(index + 1, bankPath.length - 1)];
    const tangentX = next.x - previous.x;
    const tangentZ = next.z - previous.z;
    const tangentLength = Math.hypot(tangentX, tangentZ) || 1;
    const normalX = -tangentZ / tangentLength;
    const normalZ = tangentX / tangentLength;
    const sourceProgress = path.indexOf(point) / (path.length - 1);
    const waterY = estuaryWaterYAt(sourceProgress);
    const terrainY = terrainSurfaceYAt(point);
    const taper = 1 - THREE.MathUtils.smoothstep(progress, 0.62, 1);
    const width = estuaryWidthAt(sourceProgress);
    const waterEdgeOffset = width * 0.5 + RIVER_CHANNEL_WATER_EDGE_OVERLAP_M * taper;
    const crestOffset = width * 0.5 + ESTUARY_BANK_CREST_OFFSET_M * taper;
    const outerOffset = width * 0.5 + ESTUARY_BANK_WIDTH_M * taper;
    const outerY = Math.max(terrainY + 0.08 * taper, waterY - ESTUARY_BANK_INNER_DROP_M);
    const crestY = Math.max(outerY, waterY + ESTUARY_BANK_CREST_RISE_M * taper);
    const innerY = waterY - ESTUARY_BANK_INNER_DROP_M;

    addRiverBankVertex(
      positions,
      colors,
      point.x + normalX * outerOffset,
      outerY,
      point.z + normalZ * outerOffset,
      riverBankOuterColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x + normalX * crestOffset,
      crestY,
      point.z + normalZ * crestOffset,
      riverBankCrestColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x + normalX * waterEdgeOffset,
      innerY,
      point.z + normalZ * waterEdgeOffset,
      riverBankWetColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x - normalX * waterEdgeOffset,
      innerY,
      point.z - normalZ * waterEdgeOffset,
      riverBankWetColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x - normalX * crestOffset,
      crestY,
      point.z - normalZ * crestOffset,
      riverBankCrestColor,
    );
    addRiverBankVertex(
      positions,
      colors,
      point.x - normalX * outerOffset,
      outerY,
      point.z - normalZ * outerOffset,
      riverBankOuterColor,
    );
  });

  addChannelBankStrip(indices, bankPath.length, 0, 1);
  addChannelBankStrip(indices, bankPath.length, 1, 2);
  addChannelBankStrip(indices, bankPath.length, 3, 4);
  addChannelBankStrip(indices, bankPath.length, 4, 5);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function reservoirLakeY() {
  return GRASS_SURFACE_Y + mountainHeightAt(reservoirCenter.x, reservoirCenter.z) + 4;
}

export function addReservoirBasin(floor?: PavementFloor) {
  const geometry = createReservoirBasinGeometry();
  floor?.clampGeometry(geometry);
  const basin = new THREE.Mesh(geometry, mountainMaterial);
  basin.name = "natural-reservoir-basin";
  basin.renderOrder = 4;
  basin.receiveShadow = true;
  naturalElements.add(basin);
}

export function addReservoirLake() {
  const lake = addSharedSeaWaterMesh(
    "mountain-reservoir-lake",
    createReservoirLakeGeometry(),
    5,
  );
  lake.name = "mountain-reservoir-lake";
}

export function addRiver() {
  const river = addSharedSeaWaterMesh(
    "mountain-to-sea-river",
    createRiverStripGeometry(riverPath),
    5,
  );
  river.name = "mountain-to-sea-river";
}

export function addRiverChannelBanks(floor?: PavementFloor) {
  const geometry = createRiverChannelBankGeometry(riverPath);
  floor?.clampGeometry(geometry);
  const banks = new THREE.Mesh(geometry, riverBankMaterial);
  banks.name = "sloped-natural-river-channel-banks";
  banks.renderOrder = 4;
  banks.receiveShadow = true;
  naturalElements.add(banks);
}

export function addCoastalEstuary() {
  const estuary = addSharedSeaWaterMesh(
    "river-sea-estuary",
    createEstuaryStripGeometry(riverSeaTransitionPath),
    5.2,
  );
  estuary.name = "river-sea-estuary";
}

export function addCoastalEstuaryBanks(floor?: PavementFloor) {
  const geometry = createEstuaryBankGeometry(riverSeaTransitionPath);
  floor?.clampGeometry(geometry);
  const banks = new THREE.Mesh(geometry, riverBankMaterial);
  banks.name = "tapered-natural-estuary-banks";
  banks.renderOrder = 4;
  banks.receiveShadow = true;
  naturalElements.add(banks);
}
