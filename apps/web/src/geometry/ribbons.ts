import * as THREE from "three";
import { HIGHWAY_DASH_GAP_SEGMENTS, HIGHWAY_DASH_SEGMENTS } from "../config/constants";
import { addPlanarXZUVs } from "./helpers";
import { RoadPathPoint } from "./types";
import { roadElements } from "../render/context";

export function sampleRoadControlPath(
  controlPoints: RoadPathPoint[],
  closed: boolean,
  samples: number,
) {
  const curve = new THREE.CatmullRomCurve3(
    controlPoints.map((point) => new THREE.Vector3(point.x, point.y, point.z)),
    closed,
    "centripetal",
    0.35,
  );
  const sampled = curve.getSpacedPoints(samples).map((point) => ({
    x: point.x,
    y: point.y,
    z: point.z,
  }));

  if (closed) {
    sampled.pop();
  }

  return sampled;
}

export function pathTangent(path: RoadPathPoint[], index: number, closed: boolean) {
  const previous =
    index === 0
      ? closed
        ? path[path.length - 1]
        : path[0]
      : path[index - 1];
  const next =
    index === path.length - 1
      ? closed
        ? path[0]
        : path[path.length - 1]
      : path[index + 1];
  const tangentX = next.x - previous.x;
  const tangentZ = next.z - previous.z;
  const length = Math.hypot(tangentX, tangentZ) || 1;
  return {
    x: tangentX / length,
    z: tangentZ / length,
    normalX: -tangentZ / length,
    normalZ: tangentX / length,
  };
}

export function offsetRoadPath(path: RoadPathPoint[], offset: number, closed: boolean) {
  return path.map((point, index) => {
    const tangent = pathTangent(path, index, closed);
    return {
      x: point.x + tangent.normalX * offset,
      y: point.y,
      z: point.z + tangent.normalZ * offset,
    };
  });
}

export function createRoadRibbonSurfaceGeometry(
  path: RoadPathPoint[],
  width: number,
  closed: boolean,
  yLift = 0,
) {
  const positions: number[] = [];
  const indices: number[] = [];

  path.forEach((point, index) => {
    const tangent = pathTangent(path, index, closed);
    const halfWidth = width * 0.5;
    positions.push(
      point.x + tangent.normalX * halfWidth,
      point.y + yLift,
      point.z + tangent.normalZ * halfWidth,
      point.x - tangent.normalX * halfWidth,
      point.y + yLift,
      point.z - tangent.normalZ * halfWidth,
    );
  });

  const segmentCount = closed ? path.length : path.length - 1;
  for (let index = 0; index < segmentCount; index += 1) {
    const nextIndex = (index + 1) % path.length;
    const leftA = index * 2;
    const rightA = leftA + 1;
    const leftB = nextIndex * 2;
    const rightB = leftB + 1;
    indices.push(leftA, rightA, leftB, leftB, rightA, rightB);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createDashedRoadRibbonSurfaceGeometry(
  path: RoadPathPoint[],
  width: number,
  closed: boolean,
  yLift: number,
  dashSegments: number,
  gapSegments: number,
) {
  const positions: number[] = [];
  const indices: number[] = [];
  const segmentCount = closed ? path.length : path.length - 1;
  const cycleLength = dashSegments + gapSegments;

  for (let index = 0; index < segmentCount; index += 1) {
    if (Math.floor(index / dashSegments) % Math.ceil(cycleLength / dashSegments) !== 0) {
      continue;
    }

    const nextIndex = (index + 1) % path.length;
    const pointA = path[index];
    const pointB = path[nextIndex];
    const tangent = pathTangent(path, index, closed);
    const halfWidth = width * 0.5;
    const baseIndex = positions.length / 3;

    positions.push(
      pointA.x + tangent.normalX * halfWidth,
      pointA.y + yLift,
      pointA.z + tangent.normalZ * halfWidth,
      pointA.x - tangent.normalX * halfWidth,
      pointA.y + yLift,
      pointA.z - tangent.normalZ * halfWidth,
      pointB.x + tangent.normalX * halfWidth,
      pointB.y + yLift,
      pointB.z + tangent.normalZ * halfWidth,
      pointB.x - tangent.normalX * halfWidth,
      pointB.y + yLift,
      pointB.z - tangent.normalZ * halfWidth,
    );
    indices.push(
      baseIndex,
      baseIndex + 1,
      baseIndex + 2,
      baseIndex + 2,
      baseIndex + 1,
      baseIndex + 3,
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createRoadRibbonVolumeGeometry(
  path: RoadPathPoint[],
  width: number,
  thickness: number,
  closed: boolean,
) {
  const positions: number[] = [];
  const topIndices: number[] = [];
  const sideIndices: number[] = [];

  path.forEach((point, index) => {
    const tangent = pathTangent(path, index, closed);
    const halfWidth = width * 0.5;
    const leftX = point.x + tangent.normalX * halfWidth;
    const leftZ = point.z + tangent.normalZ * halfWidth;
    const rightX = point.x - tangent.normalX * halfWidth;
    const rightZ = point.z - tangent.normalZ * halfWidth;

    positions.push(
      leftX,
      point.y,
      leftZ,
      rightX,
      point.y,
      rightZ,
      leftX,
      point.y - thickness,
      leftZ,
      rightX,
      point.y - thickness,
      rightZ,
    );
  });

  const segmentCount = closed ? path.length : path.length - 1;
  for (let index = 0; index < segmentCount; index += 1) {
    const nextIndex = (index + 1) % path.length;
    const leftTopA = index * 4;
    const rightTopA = leftTopA + 1;
    const leftBottomA = leftTopA + 2;
    const rightBottomA = leftTopA + 3;
    const leftTopB = nextIndex * 4;
    const rightTopB = leftTopB + 1;
    const leftBottomB = leftTopB + 2;
    const rightBottomB = leftTopB + 3;

    topIndices.push(leftTopA, rightTopA, leftTopB, leftTopB, rightTopA, rightTopB);
    sideIndices.push(
      leftBottomA,
      leftBottomB,
      rightBottomA,
      rightBottomA,
      leftBottomB,
      rightBottomB,
      leftTopA,
      leftTopB,
      leftBottomA,
      leftBottomA,
      leftTopB,
      leftBottomB,
      rightTopA,
      rightBottomA,
      rightTopB,
      rightTopB,
      rightBottomA,
      rightBottomB,
    );
  }
  const indices = [...topIndices, ...sideIndices];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  addPlanarXZUVs(geometry);
  geometry.setIndex(indices);
  geometry.clearGroups();
  geometry.addGroup(0, topIndices.length, 0);
  geometry.addGroup(topIndices.length, sideIndices.length, 1);
  geometry.computeVertexNormals();
  return geometry;
}

export function addRoadRibbon(
  name: string,
  path: RoadPathPoint[],
  width: number,
  material: THREE.Material,
  closed: boolean,
  yLift: number,
) {
  const mesh = new THREE.Mesh(
    createRoadRibbonSurfaceGeometry(path, width, closed, yLift),
    material,
  );
  mesh.name = name;
  mesh.renderOrder = 10;
  mesh.receiveShadow = true;
  roadElements.add(mesh);
}

export function addDashedRoadRibbon(
  name: string,
  path: RoadPathPoint[],
  width: number,
  material: THREE.Material,
  closed: boolean,
  yLift: number,
) {
  const mesh = new THREE.Mesh(
    createDashedRoadRibbonSurfaceGeometry(
      path,
      width,
      closed,
      yLift,
      HIGHWAY_DASH_SEGMENTS,
      HIGHWAY_DASH_GAP_SEGMENTS,
    ),
    material,
  );
  mesh.name = name;
  mesh.renderOrder = 11;
  mesh.receiveShadow = true;
  roadElements.add(mesh);
}
