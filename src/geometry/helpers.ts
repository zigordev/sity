import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import * as THREE from "three";
import { GroundPathPoint, OrientedXYZPlacement, ScaledOrientedXYZPlacement, ScaledXYZPlacement, XYZPlacement, XZPlacement } from "./types";
import { artificialElements, naturalElements, roadElements } from "../render/context";
import { contactShadowMaterial } from "../render/materials";

export function addPlanarXZUVs(geometry: THREE.BufferGeometry, textureScaleM = 80) {
  const position = geometry.getAttribute("position");
  const uvs: number[] = [];

  for (let index = 0; index < position.count; index += 1) {
    uvs.push(position.getX(index) / textureScaleM, position.getZ(index) / textureScaleM);
  }

  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
}

export function addFlatPlane(
  name: string,
  width: number,
  depth: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  renderOrder: number,
  parent: THREE.Object3D = naturalElements,
) {
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
  plane.name = name;
  plane.renderOrder = renderOrder;
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(x, y, z);
  plane.receiveShadow = true;
  parent.add(plane);
}

export function addContactShadowPlane(
  name: string,
  width: number,
  depth: number,
  x: number,
  y: number,
  z: number,
  parent: THREE.Object3D = artificialElements,
) {
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), contactShadowMaterial);
  plane.name = name;
  plane.renderOrder = 18;
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(x, y, z);
  parent.add(plane);
}

export function addExtrudedPolygonSurface(
  name: string,
  points: GroundPathPoint[],
  material: THREE.Material,
  topY: number,
  thickness: number,
  renderOrder: number,
  parent: THREE.Object3D = naturalElements,
) {
  const positions: number[] = [];
  const topTriangles = THREE.ShapeUtils.triangulateShape(
    points.map((point) => new THREE.Vector2(point.x, point.z)),
    [],
  );
  const indices: number[] = [];
  const bottomY = topY - thickness;

  for (const point of points) {
    positions.push(point.x, topY, point.z);
  }

  for (const point of points) {
    positions.push(point.x, bottomY, point.z);
  }

  indices.push(...topTriangles.flat());

  for (const triangle of topTriangles) {
    indices.push(
      triangle[2] + points.length,
      triangle[1] + points.length,
      triangle[0] + points.length,
    );
  }

  for (let index = 0; index < points.length; index += 1) {
    const nextIndex = (index + 1) % points.length;
    const topA = index;
    const topB = nextIndex;
    const bottomA = index + points.length;
    const bottomB = nextIndex + points.length;
    indices.push(topA, bottomA, topB, topB, bottomA, bottomB);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  addPlanarXZUVs(geometry);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.renderOrder = renderOrder;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

export function addLayeredPolygonVolume(
  name: string,
  points: GroundPathPoint[],
  topMaterial: THREE.Material,
  sideMaterial: THREE.Material,
  topY: number,
  thickness: number,
  renderOrder: number,
  parent: THREE.Object3D = naturalElements,
  castShadow = true,
) {
  const positions: number[] = [];
  const topTriangles = THREE.ShapeUtils.triangulateShape(
    points.map((point) => new THREE.Vector2(point.x, point.z)),
    [],
  );
  const indices: number[] = [];
  const bottomY = topY - thickness;

  for (const point of points) {
    positions.push(point.x, topY, point.z);
  }

  for (const point of points) {
    positions.push(point.x, bottomY, point.z);
  }

  const topIndexStart = indices.length;
  indices.push(...topTriangles.flat());
  const topIndexCount = indices.length - topIndexStart;

  const bottomIndexStart = indices.length;
  for (const triangle of topTriangles) {
    indices.push(
      triangle[2] + points.length,
      triangle[1] + points.length,
      triangle[0] + points.length,
    );
  }
  const bottomIndexCount = indices.length - bottomIndexStart;

  const sideIndexStart = indices.length;
  for (let index = 0; index < points.length; index += 1) {
    const nextIndex = (index + 1) % points.length;
    const topA = index;
    const topB = nextIndex;
    const bottomA = index + points.length;
    const bottomB = nextIndex + points.length;
    indices.push(topA, bottomA, topB, topB, bottomA, bottomB);
  }
  const sideIndexCount = indices.length - sideIndexStart;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  addPlanarXZUVs(geometry);
  geometry.setIndex(indices);
  geometry.clearGroups();
  geometry.addGroup(topIndexStart, topIndexCount, 0);
  geometry.addGroup(bottomIndexStart, bottomIndexCount, 1);
  geometry.addGroup(sideIndexStart, sideIndexCount, 1);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, [topMaterial, sideMaterial]);
  mesh.name = name;
  mesh.renderOrder = renderOrder;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

export function distanceToSegment2D(point: GroundPathPoint, start: GroundPathPoint, end: GroundPathPoint) {
  const segmentX = end.x - start.x;
  const segmentZ = end.z - start.z;
  const lengthSq = segmentX * segmentX + segmentZ * segmentZ;

  if (lengthSq <= 0.0001) {
    return Math.hypot(point.x - start.x, point.z - start.z);
  }

  const t = THREE.MathUtils.clamp(
    ((point.x - start.x) * segmentX + (point.z - start.z) * segmentZ) / lengthSq,
    0,
    1,
  );
  const projectedX = start.x + segmentX * t;
  const projectedZ = start.z + segmentZ * t;
  return Math.hypot(point.x - projectedX, point.z - projectedZ);
}

export function distanceToPath2D(point: GroundPathPoint, path: GroundPathPoint[], closed = false) {
  let minDistance = Number.POSITIVE_INFINITY;
  const segmentCount = closed ? path.length : path.length - 1;

  for (let index = 0; index < segmentCount; index += 1) {
    minDistance = Math.min(
      minDistance,
      distanceToSegment2D(point, path[index], path[(index + 1) % path.length]),
    );
  }

  return minDistance;
}

export function addBox(
  name: string,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  parent: THREE.Object3D = artificialElements,
) {
  const bevelRadius = Math.min(width, height, depth) * 0.08;
  const geometry =
    bevelRadius > 0.25
      ? new RoundedBoxGeometry(width, height, depth, 2, Math.min(bevelRadius, 2.4))
      : new THREE.BoxGeometry(width, height, depth);
  const box = new THREE.Mesh(geometry, material);
  box.name = name;
  box.position.set(x, y, z);
  box.castShadow = true;
  box.receiveShadow = true;
  parent.add(box);
}

export function addTopAlignedBox(
  name: string,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  x: number,
  topY: number,
  z: number,
  renderOrder: number,
  parent: THREE.Object3D = artificialElements,
) {
  const bevelRadius = Math.min(width, height, depth) * 0.08;
  const geometry =
    bevelRadius > 0.22
      ? new RoundedBoxGeometry(width, height, depth, 2, Math.min(bevelRadius, 2.2))
      : new THREE.BoxGeometry(width, height, depth);
  const box = new THREE.Mesh(geometry, material);
  box.name = name;
  box.renderOrder = renderOrder;
  box.position.set(x, topY - height * 0.5, z);
  box.castShadow = true;
  box.receiveShadow = true;
  parent.add(box);
}

export function addCylinderInstances(
  name: string,
  radius: number,
  height: number,
  material: THREE.Material,
  topY: number,
  placements: XZPlacement[],
  parent: THREE.Object3D = artificialElements,
) {
  const mesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(radius, radius, height, 12),
    material,
    placements.length,
  );
  const matrix = new THREE.Matrix4();

  placements.forEach((placement, index) => {
    matrix.makeTranslation(placement.x, topY - height * 0.5, placement.z);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;

  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

export function addBoxInstances(
  name: string,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  placements: XYZPlacement[],
  parent: THREE.Object3D = artificialElements,
) {
  const bevelRadius = Math.min(width, height, depth) * 0.08;
  const mesh = new THREE.InstancedMesh(
    bevelRadius > 0.18
      ? new RoundedBoxGeometry(width, height, depth, 2, Math.min(bevelRadius, 1.4))
      : new THREE.BoxGeometry(width, height, depth),
    material,
    placements.length,
  );
  const matrix = new THREE.Matrix4();

  placements.forEach((placement, index) => {
    matrix.makeTranslation(placement.x, placement.y, placement.z);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;

  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

export function addOrientedBoxInstances(
  name: string,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  placements: OrientedXYZPlacement[],
  parent: THREE.Object3D = artificialElements,
  castShadow = true,
) {
  if (placements.length === 0) {
    return;
  }

  const bevelRadius = Math.min(width, height, depth) * 0.06;
  const mesh = new THREE.InstancedMesh(
    bevelRadius > 0.18
      ? new RoundedBoxGeometry(width, height, depth, 2, Math.min(bevelRadius, 1.1))
      : new THREE.BoxGeometry(width, height, depth),
    material,
    placements.length,
  );
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const yAxis = new THREE.Vector3(0, 1, 0);

  placements.forEach((placement, index) => {
    position.set(placement.x, placement.y, placement.z);
    quaternion.setFromAxisAngle(yAxis, placement.rotationY);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;

  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

export function addScaledSphereInstances(
  name: string,
  material: THREE.Material,
  placements: ScaledXYZPlacement[],
  parent: THREE.Object3D = naturalElements,
) {
  const mesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 14, 8),
    material,
    placements.length,
  );
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  placements.forEach((placement, index) => {
    position.set(placement.x, placement.y, placement.z);
    scale.set(placement.scaleX, placement.scaleY, placement.scaleZ);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;

  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

export function addScaledOrientedSphereInstances(
  name: string,
  material: THREE.Material,
  placements: ScaledOrientedXYZPlacement[],
  parent: THREE.Object3D = naturalElements,
) {
  if (placements.length === 0) {
    return;
  }

  const mesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 12, 7),
    material,
    placements.length,
  );
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);

  placements.forEach((placement, index) => {
    position.set(placement.x, placement.y, placement.z);
    quaternion.setFromAxisAngle(yAxis, placement.rotationY);
    scale.set(placement.scaleX, placement.scaleY, placement.scaleZ);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;

  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

export function createLocalMesh(
  name: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function isInsideBounds(
  point: GroundPathPoint,
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number },
  marginM = 0,
) {
  return (
    point.x >= bounds.minX + marginM &&
    point.x <= bounds.maxX - marginM &&
    point.z >= bounds.minZ + marginM &&
    point.z <= bounds.maxZ - marginM
  );
}

export function addOrientedBox(
  name: string,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  rotationY: number,
  parent: THREE.Object3D = roadElements,
) {
  const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  box.name = name;
  box.position.set(x, y, z);
  box.rotation.y = rotationY;
  box.castShadow = true;
  box.receiveShadow = true;
  parent.add(box);
}
