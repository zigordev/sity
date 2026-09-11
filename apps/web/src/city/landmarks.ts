import * as THREE from "three";
import { groundSurfaceYAt } from "../natural/terrain";
import { cityElements } from "../render/context";
import { highwayAsphaltMaterial, roadMarkingWhiteMaterial, sidewalkMaterial, sharedSeaWaterMaterial, lampPoleMaterial, gravelVergeMaterial, craneWhiteMaterial, roadMarkingYellowMaterial, shelterGlassMaterial, beachSandMaterial, fieldMaterials, steelDarkMaterial, truckCabMaterials, warehouseWallMaterial, barrierArmMaterial, craneBlueMaterial } from "../render/materials";
import { fullTerrainSurfaceYAt } from "../natural/terrain";
import { boxBetween, mergeAll } from "../roads/geometry";
import { SPECIAL_BLOCKS, type SpecialBlock } from "./districts";
import { BuildingBatch } from "./buildings";
import { createRandom } from "./random";
import { addTree } from "./vegetation";
import { roadSideSlots } from "../roads/render";
import { corridorClearance, pavementClearance } from "../world/occupancy";

const plasterMaterial = new THREE.MeshStandardMaterial({ color: 0xe6dfcf, roughness: 0.8 });
const stoneMaterial = new THREE.MeshStandardMaterial({ color: 0xd9d3c4, roughness: 0.85 });
const domeMaterial = new THREE.MeshStandardMaterial({ color: 0x7f9a8c, roughness: 0.45, metalness: 0.35 });
const pitchMaterial = new THREE.MeshStandardMaterial({ color: 0x4f9b3f, roughness: 0.95 });
const fieldMaterial = new THREE.MeshStandardMaterial({ color: 0x5da34a, roughness: 0.95 });
const stadiumMaterial = new THREE.MeshStandardMaterial({ color: 0xcfd2d6, roughness: 0.7, metalness: 0.15 });
const stadiumRoofMaterial = new THREE.MeshStandardMaterial({ color: 0xe9ecef, roughness: 0.5, metalness: 0.3 });
const benchMaterial = new THREE.MeshStandardMaterial({ color: 0x7a5a3b, roughness: 0.9 });
const spireMaterial = new THREE.MeshStandardMaterial({ color: 0x5c6670, roughness: 0.6, metalness: 0.3 });

const benchPlacements: Array<{ x: number; y: number; z: number; rotationY: number }> = [];

function clearOfRoads(x: number, z: number, radius: number) {
  return corridorClearance(x, z, radius + 30) >= radius + 1;
}

function addMesh(name: string, geometry: THREE.BufferGeometry, material: THREE.Material, castShadow = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  cityElements.add(mesh);
  return mesh;
}

function box(width: number, height: number, depth: number, x: number, y: number, z: number, rotationY = 0) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  geometry.rotateY(rotationY);
  geometry.translate(x, y + height * 0.5, z);
  return geometry;
}

function slab(block: SpecialBlock, material: THREE.Material, lift: number, thickness: number, inset = 0) {
  const width = block.maxX - block.minX - inset * 2;
  const depth = block.maxZ - block.minZ - inset * 2;
  const y = groundSurfaceYAt((block.minX + block.maxX) * 0.5, (block.minZ + block.maxZ) * 0.5);
  const geometry = new THREE.BoxGeometry(width, thickness, depth);
  geometry.translate((block.minX + block.maxX) * 0.5, y + lift - thickness * 0.5, (block.minZ + block.maxZ) * 0.5);
  return { geometry: addMesh(`${block.id}-surface`, geometry, material, false), y };
}

export function addBench(x: number, y: number, z: number, rotationY: number) {
  benchPlacements.push({ x, y, z, rotationY });
}

function commitBenches() {
  if (benchPlacements.length === 0) {
    return;
  }
  const seat = new THREE.BoxGeometry(1.8, 0.08, 0.5);
  seat.translate(0, 0.46, 0);
  const back = new THREE.BoxGeometry(1.8, 0.4, 0.06);
  back.translate(0, 0.72, -0.24);
  const legA = new THREE.BoxGeometry(0.08, 0.44, 0.44);
  legA.translate(-0.75, 0.22, 0);
  const legB = new THREE.BoxGeometry(0.08, 0.44, 0.44);
  legB.translate(0.75, 0.22, 0);
  const geometry = mergeAll([seat, back, legA, legB]) ?? seat;
  const mesh = new THREE.InstancedMesh(geometry, benchMaterial, benchPlacements.length);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const yAxis = new THREE.Vector3(0, 1, 0);
  benchPlacements.forEach((placement, index) => {
    position.set(placement.x, placement.y, placement.z);
    quaternion.setFromAxisAngle(yAxis, placement.rotationY);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.name = "benches";
  mesh.castShadow = true;
  cityElements.add(mesh);
}

function parkingLines(block: SpecialBlock, y: number, lift: number) {
  const parts: THREE.BufferGeometry[] = [];
  const width = block.maxX - block.minX;
  const depth = block.maxZ - block.minZ;
  const centerX = (block.minX + block.maxX) * 0.5;
  const rows = Math.max(1, Math.floor((depth - 8) / 16));
  for (let row = 0; row < rows; row += 1) {
    const rowZ = block.minZ + 6 + row * 16;
    for (let x = -width * 0.5 + 4; x <= width * 0.5 - 4; x += 2.6) {
      const line = new THREE.BoxGeometry(0.12, 0.02, 5);
      line.translate(centerX + x, y + lift + 0.03, rowZ + 2.5);
      parts.push(line);
      const line2 = new THREE.BoxGeometry(0.12, 0.02, 5);
      line2.translate(centerX + x, y + lift + 0.03, rowZ + 9);
      parts.push(line2);
      if (x + 2.6 <= width * 0.5 - 4) {
        roadSideSlots.parkingBays.push({ x: centerX + x + 1.3, y: y + lift, z: rowZ + 2.5, heading: 0 });
        roadSideSlots.parkingBays.push({ x: centerX + x + 1.3, y: y + lift, z: rowZ + 9, heading: Math.PI });
      }
    }
  }
  const merged = mergeAll(parts);
  if (merged) {
    addMesh(`${block.id}-stalls`, merged, roadMarkingWhiteMaterial, false);
  }
}

function buildPlaza(block: SpecialBlock) {
  const { y } = slab(block, sidewalkMaterial, 0.14, 0.5);
  const cx = (block.minX + block.maxX) * 0.5;
  const cz = (block.minZ + block.maxZ) * 0.5;
  const hallWidth = 58;
  const hallDepth = 24;
  const hallZ = block.minZ + 22;
  const parts: THREE.BufferGeometry[] = [];
  parts.push(box(hallWidth, 15, hallDepth, cx, y + 0.14, hallZ));
  parts.push(box(hallWidth + 4, 1.2, hallDepth + 4, cx, y + 15.14, hallZ));
  for (let index = 0; index < 8; index += 1) {
    const column = new THREE.CylinderGeometry(0.7, 0.7, 12, 10);
    column.translate(cx - hallWidth * 0.5 + 6 + index * ((hallWidth - 12) / 7), y + 6.14, hallZ + hallDepth * 0.5 + 3);
    parts.push(column);
  }
  parts.push(box(hallWidth, 1.0, 8, cx, y + 12.2, hallZ + hallDepth * 0.5 + 3));
  const hall = mergeAll(parts);
  if (hall) {
    addMesh(`${block.id}-city-hall`, hall, plasterMaterial);
  }
  const dome = new THREE.SphereGeometry(9, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
  dome.translate(cx, y + 16.3, hallZ);
  addMesh(`${block.id}-dome`, dome, domeMaterial);
  const drum = new THREE.CylinderGeometry(9.5, 9.5, 2.2, 24);
  drum.translate(cx, y + 16.3, hallZ);
  addMesh(`${block.id}-drum`, drum, stoneMaterial);

  const fountainZ = cz + 18;
  const basin = new THREE.CylinderGeometry(9, 9.4, 1.1, 32);
  basin.translate(cx, y + 0.69, fountainZ);
  addMesh(`${block.id}-fountain-basin`, basin, stoneMaterial);
  const water = new THREE.CircleGeometry(8.4, 32);
  water.rotateX(-Math.PI / 2);
  water.translate(cx, y + 1.1, fountainZ);
  const waterMesh = new THREE.Mesh(water, sharedSeaWaterMaterial);
  waterMesh.name = `${block.id}-fountain-water`;
  cityElements.add(waterMesh);
  const column = new THREE.CylinderGeometry(0.9, 1.6, 4.2, 12);
  column.translate(cx, y + 3.2, fountainZ);
  addMesh(`${block.id}-fountain-column`, column, stoneMaterial);
  const bowl = new THREE.CylinderGeometry(3.2, 0.6, 0.8, 16);
  bowl.translate(cx, y + 5.5, fountainZ);
  addMesh(`${block.id}-fountain-bowl`, bowl, stoneMaterial);

  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    addBench(cx + Math.cos(angle) * 15, y + 0.14, fountainZ + Math.sin(angle) * 15, -angle + Math.PI * 0.5);
  }
  for (const gx of [-30, -18, 18, 30]) {
    for (const gz of [8, 22, 34]) {
      addTree("broadleaf", cx + gx, cz + gz, y + 0.14, 0.7, 12);
    }
  }
}

function buildPark(block: SpecialBlock) {
  const y = groundSurfaceYAt((block.minX + block.maxX) * 0.5, (block.minZ + block.maxZ) * 0.5);
  const width = block.maxX - block.minX;
  const depth = block.maxZ - block.minZ;
  const diagonal = new THREE.BoxGeometry(Math.hypot(width, depth) - 6, 0.12, 3);
  diagonal.rotateY(-Math.atan2(depth, width));
  diagonal.translate((block.minX + block.maxX) * 0.5, y + 0.12, (block.minZ + block.maxZ) * 0.5);
  addMesh(`${block.id}-path`, diagonal, gravelVergeMaterial, false);
  const cross = new THREE.BoxGeometry(3, 0.12, depth - 6);
  cross.translate((block.minX + block.maxX) * 0.5, y + 0.12, (block.minZ + block.maxZ) * 0.5);
  addMesh(`${block.id}-path-2`, cross, gravelVergeMaterial, false);
  const random = createRandom(19);
  for (let index = 0; index < 8; index += 1) {
    const t = (index + 1) / 9;
    const x = block.minX + width * t + 3;
    const z = block.minZ + depth * t - 3;
    addBench(x, y + 0.14, z, -Math.atan2(depth, width) + (random() > 0.5 ? Math.PI : 0));
  }
  const pond = new THREE.CircleGeometry(14, 32);
  pond.rotateX(-Math.PI / 2);
  pond.translate(block.minX + width * 0.7, y + 0.05, block.minZ + depth * 0.3);
  const pondMesh = new THREE.Mesh(pond, sharedSeaWaterMaterial);
  pondMesh.name = `${block.id}-pond`;
  cityElements.add(pondMesh);
  const pondEdge = new THREE.RingGeometry(14, 15.2, 32);
  pondEdge.rotateX(-Math.PI / 2);
  pondEdge.translate(block.minX + width * 0.7, y + 0.1, block.minZ + depth * 0.3);
  addMesh(`${block.id}-pond-edge`, pondEdge, stoneMaterial, false);
}

function buildStadium(block: SpecialBlock) {
  const cx = (block.minX + block.maxX) * 0.5;
  const cz = (block.minZ + block.maxZ) * 0.5;
  const y = groundSurfaceYAt(cx, cz);
  const outerX = (block.maxX - block.minX) * 0.5 - 3;
  const outerZ = (block.maxZ - block.minZ) * 0.5 - 3;
  const innerX = outerX - 22;
  const innerZ = outerZ - 22;
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, outerX, outerZ, 0, Math.PI * 2, false, 0);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, innerX, innerZ, 0, Math.PI * 2, true, 0);
  shape.holes.push(hole);
  const stands = new THREE.ExtrudeGeometry(shape, { depth: 17, bevelEnabled: false, curveSegments: 48 });
  stands.rotateX(-Math.PI / 2);
  stands.translate(cx, y + 17, cz);
  addMesh(`${block.id}-stands`, stands, stadiumMaterial);
  const roofShape = new THREE.Shape();
  roofShape.absellipse(0, 0, outerX + 2, outerZ + 2, 0, Math.PI * 2, false, 0);
  const roofHole = new THREE.Path();
  roofHole.absellipse(0, 0, innerX + 8, innerZ + 8, 0, Math.PI * 2, true, 0);
  roofShape.holes.push(roofHole);
  const roof = new THREE.ExtrudeGeometry(roofShape, { depth: 1.4, bevelEnabled: false, curveSegments: 48 });
  roof.rotateX(-Math.PI / 2);
  roof.translate(cx, y + 20.4, cz);
  addMesh(`${block.id}-roof`, roof, stadiumRoofMaterial);
  const pitch = new THREE.BoxGeometry(innerX * 1.5, 0.3, innerZ * 1.4);
  pitch.translate(cx, y + 0.35, cz);
  addMesh(`${block.id}-pitch`, pitch, pitchMaterial, false);
  const lines = mergeAll([
    (() => { const g = new THREE.BoxGeometry(innerX * 1.5, 0.02, 0.3); g.translate(cx, y + 0.52, cz - innerZ * 0.7); return g; })(),
    (() => { const g = new THREE.BoxGeometry(innerX * 1.5, 0.02, 0.3); g.translate(cx, y + 0.52, cz + innerZ * 0.7); return g; })(),
    (() => { const g = new THREE.BoxGeometry(0.3, 0.02, innerZ * 1.4); g.translate(cx - innerX * 0.75, y + 0.52, cz); return g; })(),
    (() => { const g = new THREE.BoxGeometry(0.3, 0.02, innerZ * 1.4); g.translate(cx + innerX * 0.75, y + 0.52, cz); return g; })(),
    (() => { const g = new THREE.BoxGeometry(0.3, 0.02, innerZ * 1.4); g.translate(cx, y + 0.52, cz); return g; })(),
  ]);
  if (lines) {
    addMesh(`${block.id}-pitch-lines`, lines, roadMarkingWhiteMaterial, false);
  }
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    const mast = new THREE.CylinderGeometry(0.5, 0.8, 34, 8);
    mast.translate(cx + sx * (outerX - 6), y + 17, cz + sz * (outerZ - 6));
    addMesh(`${block.id}-floodlight-${sx}-${sz}`, mast, lampPoleMaterial);
    const head = new THREE.BoxGeometry(6, 3, 0.8);
    head.rotateY(Math.atan2(-sx, -sz));
    head.translate(cx + sx * (outerX - 6), y + 34.5, cz + sz * (outerZ - 6));
    addMesh(`${block.id}-floodlight-head-${sx}-${sz}`, head, stadiumRoofMaterial, false);
  }
}

function buildParking(block: SpecialBlock) {
  const { y } = slab(block, highwayAsphaltMaterial, 0.1, 0.4);
  parkingLines(block, y, 0.1);
}

function buildSchool(block: SpecialBlock) {
  const batch = new BuildingBatch();
  const cx = (block.minX + block.maxX) * 0.5;
  const y = groundSurfaceYAt(cx, block.minZ + 20);
  const color = new THREE.Color(0xe4d9c4);
  batch.addBox({ x: cx, y, z: block.minZ + 14, width: block.maxX - block.minX - 12, height: 7.2, depth: 16, rotationY: 0, color, floorHeight: 3.4, windowWidth: 2.2, windowRatio: 0.62, seed: 21 });
  batch.addBox({ x: block.minX + 16, y, z: block.minZ + 38, width: 20, height: 9, depth: 26, rotationY: 0, color: new THREE.Color(0xd2d6d9), floorHeight: 9, windowWidth: 3, windowRatio: 0.25, seed: 22 });
  batch.commit(`${block.id}-buildings`);
  const field = new THREE.BoxGeometry(block.maxX - block.minX - 30, 0.2, block.maxZ - block.minZ - 60);
  field.translate(cx + 8, y + 0.15, block.maxZ - (block.maxZ - block.minZ - 60) * 0.5 - 6);
  addMesh(`${block.id}-field`, field, fieldMaterial, false);
  const track = new THREE.RingGeometry(16, 19.5, 40);
  track.rotateX(-Math.PI / 2);
  track.scale(1.4, 1, 1);
  track.translate(cx + 8, y + 0.3, block.maxZ - (block.maxZ - block.minZ - 60) * 0.5 - 6);
  addMesh(`${block.id}-track`, track, gravelVergeMaterial, false);
}

function buildChurch(block: SpecialBlock) {
  const cx = (block.minX + block.maxX) * 0.5;
  const cz = (block.minZ + block.maxZ) * 0.5;
  const y = groundSurfaceYAt(cx, cz);
  const nave = box(14, 9, 30, cx, y, cz + 4);
  addMesh(`${block.id}-nave`, nave, stoneMaterial);
  const roof = new THREE.BufferGeometry();
  const ridge = 4.5;
  const half = 7.8;
  const length = 31;
  const positions = new Float32Array([
    cx - half, y + 9, cz + 4 - length / 2, cx + half, y + 9, cz + 4 - length / 2, cx, y + 9 + ridge, cz + 4 - length / 2,
    cx + half, y + 9, cz + 4 + length / 2, cx - half, y + 9, cz + 4 + length / 2, cx, y + 9 + ridge, cz + 4 + length / 2,
    cx - half, y + 9, cz + 4 - length / 2, cx, y + 9 + ridge, cz + 4 - length / 2, cx, y + 9 + ridge, cz + 4 + length / 2,
    cx - half, y + 9, cz + 4 - length / 2, cx, y + 9 + ridge, cz + 4 + length / 2, cx - half, y + 9, cz + 4 + length / 2,
    cx + half, y + 9, cz + 4 - length / 2, cx + half, y + 9, cz + 4 + length / 2, cx, y + 9 + ridge, cz + 4 + length / 2,
    cx + half, y + 9, cz + 4 - length / 2, cx, y + 9 + ridge, cz + 4 + length / 2, cx, y + 9 + ridge, cz + 4 - length / 2,
  ]);
  roof.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  roof.computeVertexNormals();
  addMesh(`${block.id}-roof`, roof, spireMaterial);
  const tower = box(6.5, 22, 6.5, cx, y, cz - 15);
  addMesh(`${block.id}-tower`, tower, stoneMaterial);
  const spire = new THREE.ConeGeometry(4.2, 10, 4);
  spire.rotateY(Math.PI / 4);
  spire.translate(cx, y + 27, cz - 15);
  addMesh(`${block.id}-spire`, spire, spireMaterial);
  addTree("broadleaf", block.minX + 8, block.maxZ - 8, y, 0.9, 31);
  addTree("broadleaf", block.maxX - 8, block.maxZ - 8, y, 0.8, 32);
}

function buildStation(block: SpecialBlock) {
  const batch = new BuildingBatch();
  const y = groundSurfaceYAt((block.minX + block.maxX) * 0.5, (block.minZ + block.maxZ) * 0.5);
  const westX = 536;
  const eastX = block.maxX - 12;
  const cx = (westX + eastX) * 0.5;
  const cz = -906;
  batch.addBox({ x: cx, y, z: cz, width: eastX - westX, height: 8.4, depth: 54, rotationY: 0, color: new THREE.Color(0xd8cdb8), floorHeight: 4.2, windowWidth: 2.6, windowRatio: 0.55, seed: 41 }, "north-station");
  batch.addBox({ x: cx, y: y + 8.4, z: cz, width: (eastX - westX) * 0.5, height: 5.2, depth: 22, rotationY: 0, color: new THREE.Color(0xe8e0cf), floorHeight: 5.2, windowWidth: 3.2, windowRatio: 0.7, seed: 42 }, "north-station");
  batch.addBox({ x: eastX - 4, y, z: cz + 22, width: 6, height: 19, depth: 6, rotationY: 0, color: new THREE.Color(0xcdbfa4), floorHeight: 19, windowWidth: 1.4, windowRatio: 0.15, seed: 43 }, "north-station");
  batch.commit(`${block.id}-buildings`);
  const clockFace = new THREE.CylinderGeometry(1.4, 1.4, 0.2, 24);
  clockFace.rotateX(Math.PI / 2);
  clockFace.translate(eastX - 4, y + 16.5, cz + 25.1);
  addMesh(`${block.id}-clock`, clockFace, roadMarkingWhiteMaterial, false);
  const concourse = new THREE.BoxGeometry(westX - 531.5 + 1, 0.5, 60);
  concourse.translate((westX + 531.5) * 0.5, y + 0.7, cz);
  addMesh(`${block.id}-concourse`, concourse, sidewalkMaterial, false);
  let reach = 12;
  while (reach > 3 && Array.from({ length: 13 }, (_, index) => -15 + index * 2.5).some((dz) => pavementClearance(eastX + reach + 0.3, cz + dz, 30) < 0.6)) {
    reach -= 0.5;
  }
  const canopyCenterX = eastX - 2 + (reach + 2) * 0.5;
  const canopy = new THREE.BoxGeometry(reach + 2, 0.2, 30);
  canopy.translate(canopyCenterX, y + 4.6, cz);
  addMesh(`${block.id}-entrance-canopy`, canopy, craneWhiteMaterial);
  const canopyGlass = new THREE.BoxGeometry(reach + 1.6, 0.06, 29.6);
  canopyGlass.translate(canopyCenterX, y + 4.72, cz);
  addMesh(`${block.id}-entrance-glass`, canopyGlass, shelterGlassMaterial, false);
  for (const dz of [-13, 0, 13]) {
    const post = new THREE.CylinderGeometry(0.16, 0.16, 4.6, 10);
    post.translate(eastX + reach - 1, y + 2.3, cz + dz);
    addMesh(`${block.id}-canopy-post-${dz}`, post, lampPoleMaterial);
  }
}

function buildHospital(block: SpecialBlock) {
  const batch = new BuildingBatch();
  const cx = (block.minX + block.maxX) * 0.5;
  const y = groundSurfaceYAt(cx, -1190);
  const main = { x: cx, z: -1190, width: block.maxX - block.minX - 8, depth: 48 };
  batch.addBox({ ...main, y, height: 21.6, rotationY: 0, color: new THREE.Color(0xe6e9ec), floorHeight: 3.6, windowWidth: 2.4, windowRatio: 0.62, seed: 51 }, "hospital");
  batch.addBox({ x: cx, y: y + 21.6, z: -1190, width: main.width * 0.35, height: 3.4, depth: 14, rotationY: 0, color: new THREE.Color(0xd5dadf), floorHeight: 3.4, windowWidth: 2, windowRatio: 0.2, seed: 52 }, "hospital");
  batch.addBox({ x: cx - 6, y, z: -1245, width: main.width - 16, height: 11, depth: 34, rotationY: 0, color: new THREE.Color(0xdfe3e6), floorHeight: 3.6, windowWidth: 2.2, windowRatio: 0.55, seed: 53 }, "hospital");
  batch.addBox({ x: cx - 6, y, z: -1135, width: main.width - 16, height: 11, depth: 34, rotationY: 0, color: new THREE.Color(0xdfe3e6), floorHeight: 3.6, windowWidth: 2.2, windowRatio: 0.55, seed: 54 }, "hospital");
  batch.commit(`${block.id}-buildings`);
  const link1 = new THREE.BoxGeometry(6, 4, 12);
  link1.translate(cx - 6, y + 2, -1222);
  addMesh(`${block.id}-link-north`, link1, craneWhiteMaterial);
  const link2 = new THREE.BoxGeometry(6, 4, 12);
  link2.translate(cx - 6, y + 2, -1158);
  addMesh(`${block.id}-link-south`, link2, craneWhiteMaterial);
  const bayX = cx - 6 + (main.width - 16) * 0.5 + 8;
  const bay = new THREE.BoxGeometry(16, 0.3, 16);
  bay.translate(bayX, y + 4.4, -1136);
  addMesh(`${block.id}-ambulance-canopy`, bay, craneWhiteMaterial);
  for (const [dx, dz] of [[7, -7], [7, 7]]) {
    const post = new THREE.CylinderGeometry(0.2, 0.2, 4.4, 10);
    post.translate(bayX + dx, y + 2.2, -1136 + dz);
    addMesh(`${block.id}-bay-post-${dx}-${dz}`, post, lampPoleMaterial);
  }
  const pad = new THREE.CylinderGeometry(13, 13, 0.3, 32);
  pad.translate(cx, y + 0.15, block.minZ + 20);
  addMesh(`${block.id}-helipad`, pad, highwayAsphaltMaterial, false);
  const ring = new THREE.RingGeometry(11.5, 12.6, 40);
  ring.rotateX(-Math.PI / 2);
  ring.translate(cx, y + 0.33, block.minZ + 20);
  addMesh(`${block.id}-helipad-ring`, ring, roadMarkingWhiteMaterial, false);
  const h = mergeAll([
    (() => { const g = new THREE.BoxGeometry(1.2, 0.02, 8); g.translate(cx - 3, y + 0.33, block.minZ + 20); return g; })(),
    (() => { const g = new THREE.BoxGeometry(1.2, 0.02, 8); g.translate(cx + 3, y + 0.33, block.minZ + 20); return g; })(),
    (() => { const g = new THREE.BoxGeometry(5, 0.02, 1.2); g.translate(cx, y + 0.33, block.minZ + 20); return g; })(),
  ]);
  if (h) {
    addMesh(`${block.id}-helipad-h`, h, roadMarkingWhiteMaterial, false);
  }
  const cross = mergeAll([
    (() => { const g = new THREE.BoxGeometry(6, 0.2, 2); g.translate(cx, y + 22.6, -1190); return g; })(),
    (() => { const g = new THREE.BoxGeometry(2, 0.2, 6); g.translate(cx, y + 22.6, -1190); return g; })(),
  ]);
  if (cross) {
    addMesh(`${block.id}-roof-cross`, cross, roadMarkingYellowMaterial, false);
  }
}

function buildGreen(block: SpecialBlock) {
  const cx = (block.minX + block.maxX) * 0.5;
  const cz = (block.minZ + block.maxZ) * 0.5;
  const y = groundSurfaceYAt(cx, cz);
  const obelisk = new THREE.BoxGeometry(1.4, 6, 1.4);
  obelisk.translate(cx, y + 3.4, cz);
  addMesh(`${block.id}-memorial`, obelisk, stoneMaterial);
  const plinth = new THREE.BoxGeometry(3, 0.8, 3);
  plinth.translate(cx, y + 0.4, cz);
  addMesh(`${block.id}-memorial-plinth`, plinth, stoneMaterial);
  const path = new THREE.BoxGeometry(2.4, 0.1, block.maxZ - block.minZ - 4);
  path.translate(cx, y + 0.1, cz);
  addMesh(`${block.id}-path`, path, gravelVergeMaterial, false);
  for (const dz of [-16, 16]) {
    addBench(cx - 3, y + 0.1, cz + dz, Math.PI * 0.5);
    addBench(cx + 3, y + 0.1, cz + dz, -Math.PI * 0.5);
  }
  for (const [dx, dz] of [[-10, -28], [10, -28], [-10, 28], [10, 28], [-12, 0], [12, 0]]) {
    addTree("broadleaf", cx + dx, cz + dz, y, 0.85, 71);
  }
}

function buildServices(block: SpecialBlock) {
  const cx = (block.minX + block.maxX) * 0.5;
  const y = groundSurfaceYAt(cx, (block.minZ + block.maxZ) * 0.5);
  slab(block, highwayAsphaltMaterial, 0.1, 0.4);
  const canopyZ = block.minZ + 24;
  const canopy = new THREE.BoxGeometry(30, 0.5, 16);
  canopy.translate(cx, y + 5.4, canopyZ);
  addMesh(`${block.id}-fuel-canopy`, canopy, craneWhiteMaterial);
  const fascia = new THREE.BoxGeometry(30.4, 1.1, 16.4);
  fascia.translate(cx, y + 4.7, canopyZ);
  addMesh(`${block.id}-fuel-fascia`, fascia, barrierArmMaterial);
  const pumpParts: THREE.BufferGeometry[] = [];
  for (const dx of [-9, -3, 3, 9]) {
    const column = new THREE.CylinderGeometry(0.3, 0.3, 4.6, 10);
    column.translate(cx + dx, y + 2.4, canopyZ);
    pumpParts.push(column);
    for (const dz of [-3.6, 3.6]) {
      const pump = new THREE.BoxGeometry(1.1, 1.9, 0.7);
      pump.translate(cx + dx, y + 1.05, canopyZ + dz);
      pumpParts.push(pump);
      const island = new THREE.BoxGeometry(2.2, 0.2, 6);
      island.translate(cx + dx, y + 0.2, canopyZ);
      pumpParts.push(island);
    }
  }
  const pumps = mergeAll(pumpParts);
  if (pumps) {
    addMesh(`${block.id}-pumps`, pumps, steelDarkMaterial);
  }
  const batch = new BuildingBatch();
  batch.addBox({ x: cx, y, z: block.minZ + 52, width: 26, height: 4.6, depth: 14, rotationY: 0, color: new THREE.Color(0xe7e3d8), floorHeight: 4.6, windowWidth: 3.2, windowRatio: 0.72, seed: 61 }, "services-shop");
  batch.commit(`${block.id}-buildings`);
  const lines: THREE.BufferGeometry[] = [];
  for (let z = block.minZ + 70; z < block.maxZ - 6; z += 5.4) {
    for (const x0 of [block.minX + 3, block.maxX - 13]) {
      const line = new THREE.BoxGeometry(10, 0.02, 0.14);
      line.translate(x0 + 5, y + 0.14, z);
      lines.push(line);
    }
  }
  const stalls = mergeAll(lines);
  if (stalls) {
    addMesh(`${block.id}-stalls`, stalls, roadMarkingWhiteMaterial, false);
  }
  const truck = new THREE.BoxGeometry(2.5, 3.6, 16);
  truck.translate(cx, y + 1.9, block.maxZ - 14);
  addMesh(`${block.id}-parked-truck`, truck, truckCabMaterials[2]);
  for (const [dx, dz] of [[-16, 8], [16, 8], [-16, 100], [16, 100]]) {
    const mast = new THREE.CylinderGeometry(0.16, 0.24, 10, 8);
    mast.translate(cx + dx, y + 5, block.minZ + dz);
    addMesh(`${block.id}-mast-${dx}-${dz}`, mast, lampPoleMaterial);
  }
  addTree("broadleaf", block.minX + 4, block.minZ + 6, y, 0.8, 63);
  addTree("broadleaf", block.maxX - 4, block.minZ + 6, y, 0.8, 64);
}

function groundPatch(block: SpecialBlock, material: THREE.Material, name: string, lift: number, inset = 0) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const minX = block.minX + inset;
  const maxX = block.maxX - inset;
  const minZ = block.minZ + inset;
  const maxZ = block.maxZ - inset;
  const columns = Math.max(2, Math.ceil((maxX - minX) / 8));
  const rows = Math.max(2, Math.ceil((maxZ - minZ) / 8));
  for (let row = 0; row <= rows; row += 1) {
    const z = minZ + ((maxZ - minZ) * row) / rows;
    for (let column = 0; column <= columns; column += 1) {
      const x = minX + ((maxX - minX) * column) / columns;
      positions.push(x, groundSurfaceYAt(x, z) + lift, z);
      uvs.push(x / 10, z / 10);
    }
  }
  const stride = columns + 1;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const a = row * stride + column;
      if ([a, a + 1, a + stride, a + stride + 1].some((corner) => corridorClearance(positions[corner * 3], positions[corner * 3 + 2], 30) < 1)) {
        continue;
      }
      indices.push(a, a + stride, a + 1, a + 1, a + stride, a + stride + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  addMesh(name, geometry, material, false);
}

function buildGolf(block: SpecialBlock) {
  groundPatch(block, fieldMaterials[2], `${block.id}-fairways`, 0.06);
  const random = createRandom(2401);
  const cx = (block.minX + block.maxX) * 0.5;
  const y = groundSurfaceYAt(cx, block.minZ + 12);
  const club = new BuildingBatch();
  club.addBox({ x: cx, y, z: block.minZ + 12, width: 36, height: 7.4, depth: 16, rotationY: 0, color: new THREE.Color(0xf1ece0), floorHeight: 3.7, windowWidth: 2.6, windowRatio: 0.6, seed: 71 }, "golf-club");
  club.addRoof({ x: cx, y: y + 7.4, z: block.minZ + 12, width: 38, height: 3.2, depth: 18, rotationY: 0, color: new THREE.Color(0x6b4a3a) });
  club.commit(`${block.id}-clubhouse`);
  const bunkers: THREE.BufferGeometry[] = [];
  const greens: THREE.BufferGeometry[] = [];
  const flags: THREE.BufferGeometry[] = [];
  const poles: THREE.BufferGeometry[] = [];
  for (let hole = 0; hole < 7; hole += 1) {
    const gx = block.minX + 16 + random() * (block.maxX - block.minX - 32);
    const gz = block.minZ + 44 + random() * (block.maxZ - block.minZ - 60);
    const gy = groundSurfaceYAt(gx, gz);
    if (!clearOfRoads(gx, gz, 20)) {
      continue;
    }
    const green = new THREE.CylinderGeometry(9 + random() * 4, 9 + random() * 4, 0.12, 24);
    green.scale(1 + random() * 0.4, 1, 1);
    green.translate(gx, gy + 0.14, gz);
    greens.push(green);
    const pole = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6);
    pole.translate(gx, gy + 1.3, gz);
    poles.push(pole);
    const flag = new THREE.BoxGeometry(0.7, 0.4, 0.03);
    flag.translate(gx + 0.35, gy + 2.2, gz);
    flags.push(flag);
    for (let bunker = 0; bunker < 2; bunker += 1) {
      const bx = gx + (random() - 0.5) * 30;
      const bz = gz + (random() - 0.5) * 30;
      if (!clearOfRoads(bx, bz, 12)) {
        continue;
      }
      const sand = new THREE.CylinderGeometry(4 + random() * 3, 4 + random() * 3, 0.1, 16);
      sand.scale(1 + random() * 0.6, 1, 1);
      sand.rotateY(random() * Math.PI);
      sand.translate(bx, groundSurfaceYAt(bx, bz) + 0.12, bz);
      bunkers.push(sand);
    }
  }
  const greenMerged = mergeAll(greens);
  if (greenMerged) {
    addMesh(`${block.id}-greens`, greenMerged, pitchMaterial, false);
  }
  const bunkerMerged = mergeAll(bunkers);
  if (bunkerMerged) {
    addMesh(`${block.id}-bunkers`, bunkerMerged, beachSandMaterial, false);
  }
  const poleMerged = mergeAll(poles);
  if (poleMerged) {
    addMesh(`${block.id}-flag-poles`, poleMerged, lampPoleMaterial, false);
  }
  const flagMerged = mergeAll(flags);
  if (flagMerged) {
    addMesh(`${block.id}-flags`, flagMerged, barrierArmMaterial, false);
  }
  for (let index = 0; index < 26; index += 1) {
    const tx = block.minX + 6 + random() * (block.maxX - block.minX - 12);
    const tz = block.minZ + 36 + random() * (block.maxZ - block.minZ - 42);
    if (!clearOfRoads(tx, tz, 5)) {
      continue;
    }
    addTree(random() > 0.5 ? "broadleaf" : "conifer", tx, tz, groundSurfaceYAt(tx, tz), 0.8 + random() * 0.6, 72);
  }
  const px = block.minX + 30;
  const pz = block.maxZ - 30;
  if (!clearOfRoads(px, pz, 17)) {
    return;
  }
  const pond = new THREE.CircleGeometry(16, 32);
  pond.rotateX(-Math.PI / 2);
  pond.translate(px, groundSurfaceYAt(px, pz) + 0.09, pz);
  const pondMesh = new THREE.Mesh(pond, sharedSeaWaterMaterial);
  pondMesh.name = `${block.id}-pond`;
  cityElements.add(pondMesh);
}

function buildCampsite(block: SpecialBlock) {
  const random = createRandom(4400);
  const y = groundSurfaceYAt(block.minX + 20, block.minZ + 14);
  const reception = new BuildingBatch();
  reception.addBox({ x: block.minX + 20, y, z: block.minZ + 10, width: 14, height: 3.6, depth: 8, rotationY: 0, color: new THREE.Color(0xd7c9a8), floorHeight: 3.6, windowWidth: 2.2, windowRatio: 0.5, seed: 81 }, "camp-reception");
  reception.addRoof({ x: block.minX + 20, y: y + 3.6, z: block.minZ + 10, width: 15.2, height: 2.2, depth: 9.2, rotationY: 0, color: new THREE.Color(0x5b5f66) });
  reception.addBox({ x: block.minX + 44, y, z: block.minZ + 10, width: 10, height: 3.2, depth: 7, rotationY: 0, color: new THREE.Color(0xe3ded2), floorHeight: 3.2, windowWidth: 1.4, windowRatio: 0.2, seed: 82 }, "camp-washroom");
  reception.commit(`${block.id}-buildings`);
  const tracks: THREE.BufferGeometry[] = [];
  for (let z = block.minZ + 30; z < block.maxZ - 10; z += 34) {
    const xs: number[] = [];
    for (let x = block.minX + 6; x <= block.maxX - 6 + 0.01; x += 3) {
      xs.push(x);
    }
    let runStart = -1;
    xs.forEach((x, index) => {
      const open = clearOfRoads(x, z, 2);
      if (open && runStart < 0) {
        runStart = index;
      }
      if (runStart >= 0 && (!open || index === xs.length - 1)) {
        const from = xs[runStart];
        const to = open ? x : xs[index - 1];
        if (to - from >= 6) {
          const track = new THREE.BoxGeometry(to - from, 0.1, 3.2);
          track.translate((from + to) * 0.5, groundSurfaceYAt((from + to) * 0.5, z) + 0.1, z);
          tracks.push(track);
        }
        runStart = -1;
      }
    });
  }
  const trackMerged = mergeAll(tracks);
  if (trackMerged) {
    addMesh(`${block.id}-tracks`, trackMerged, gravelVergeMaterial, false);
  }
  const tents: THREE.BufferGeometry[] = [];
  const caravans: THREE.BufferGeometry[] = [];
  for (let z = block.minZ + 40; z < block.maxZ - 12; z += 17) {
    for (let x = block.minX + 12; x < block.maxX - 8; x += 15) {
      const roll = random();
      if (roll < 0.35) {
        continue;
      }
      const px = x + (random() - 0.5) * 4;
      const pz = z + (random() - 0.5) * 4;
      if (!clearOfRoads(px, pz, 4)) {
        continue;
      }
      const py = groundSurfaceYAt(px, pz);
      if (roll < 0.7) {
        const tent = new THREE.ConeGeometry(2.2, 2.0, 4);
        tent.rotateY(Math.PI / 4 + random() * 0.4);
        tent.translate(px, py + 1.0, pz);
        tents.push(tent);
      } else {
        const caravan = new THREE.BoxGeometry(2.3, 2.5, 6.2);
        caravan.rotateY(random() * Math.PI);
        caravan.translate(px, py + 1.55, pz);
        caravans.push(caravan);
      }
    }
  }
  const tentMerged = mergeAll(tents);
  if (tentMerged) {
    addMesh(`${block.id}-tents`, tentMerged, craneBlueMaterial);
  }
  const caravanMerged = mergeAll(caravans);
  if (caravanMerged) {
    addMesh(`${block.id}-caravans`, caravanMerged, warehouseWallMaterial);
  }
  for (let index = 0; index < 18; index += 1) {
    const tx = block.minX + 4 + random() * (block.maxX - block.minX - 8);
    const tz = block.minZ + 24 + random() * (block.maxZ - block.minZ - 30);
    if (!clearOfRoads(tx, tz, 5)) {
      continue;
    }
    addTree("broadleaf", tx, tz, groundSurfaceYAt(tx, tz), 0.7 + random() * 0.5, 83);
  }
}

function buildChairlift(block: SpecialBlock) {
  const baseX = (block.minX + block.maxX) * 0.5;
  const baseZ = (block.minZ + block.maxZ) * 0.5;
  const baseY = groundSurfaceYAt(baseX, baseZ);
  const direction = { x: 0.44, z: 0.9 };
  const length = 460;
  const pylonSpacing = 66;
  const frames: THREE.BufferGeometry[] = [];
  const cable: THREE.BufferGeometry[] = [];
  const chairs: THREE.BufferGeometry[] = [];
  const station = (x: number, z: number, y: number, name: string) => {
    const hall = new THREE.BoxGeometry(14, 6, 10);
    hall.rotateY(Math.atan2(direction.x, direction.z));
    hall.translate(x, y + 3, z);
    addMesh(name, hall, warehouseWallMaterial);
    const roof = new THREE.BoxGeometry(15.5, 0.5, 11.5);
    roof.rotateY(Math.atan2(direction.x, direction.z));
    roof.translate(x, y + 6.25, z);
    addMesh(`${name}-roof`, roof, steelDarkMaterial);
  };
  station(baseX, baseZ, baseY, `${block.id}-base-station`);
  const topX = baseX + direction.x * length;
  const topZ = baseZ + direction.z * length;
  const topY = fullTerrainSurfaceYAt({ x: topX, z: topZ }) + 0.3;
  station(topX, topZ, topY, `${block.id}-top-station`);
  let previous = { x: baseX, y: baseY + 7.5, z: baseZ };
  const pylons = Math.floor(length / pylonSpacing);
  for (let index = 1; index <= pylons; index += 1) {
    const px = baseX + direction.x * pylonSpacing * index;
    const pz = baseZ + direction.z * pylonSpacing * index;
    const py = fullTerrainSurfaceYAt({ x: px, z: pz });
    const pole = new THREE.CylinderGeometry(0.35, 0.55, 12, 10);
    pole.translate(px, py + 6, pz);
    frames.push(pole);
    const cross = new THREE.BoxGeometry(5, 0.4, 0.4);
    cross.rotateY(Math.atan2(direction.x, direction.z) + Math.PI / 2);
    cross.translate(px, py + 11.6, pz);
    frames.push(cross);
    const anchor = { x: px, y: py + 11.4, z: pz };
    cable.push(boxBetween(previous, anchor, 0.08, 0.08));
    const steps = 3;
    for (let step = 1; step <= steps; step += 1) {
      const t = step / (steps + 1);
      const cx = previous.x + (anchor.x - previous.x) * t;
      const cz = previous.z + (anchor.z - previous.z) * t;
      const cy = previous.y + (anchor.y - previous.y) * t - 0.6;
      const hanger = new THREE.BoxGeometry(0.08, 2.2, 0.08);
      hanger.translate(cx, cy - 1.1, cz);
      chairs.push(hanger);
      const seat = new THREE.BoxGeometry(2.2, 0.5, 0.9);
      seat.rotateY(Math.atan2(direction.x, direction.z) + Math.PI / 2);
      seat.translate(cx, cy - 2.4, cz);
      chairs.push(seat);
    }
    previous = anchor;
  }
  cable.push(boxBetween(previous, { x: topX, y: topY + 7.5, z: topZ }, 0.08, 0.08));
  const frameMerged = mergeAll(frames);
  if (frameMerged) {
    addMesh(`${block.id}-pylons`, frameMerged, lampPoleMaterial);
  }
  const cableMerged = mergeAll(cable);
  if (cableMerged) {
    addMesh(`${block.id}-cable`, cableMerged, steelDarkMaterial, false);
  }
  const chairMerged = mergeAll(chairs);
  if (chairMerged) {
    addMesh(`${block.id}-chairs`, chairMerged, barrierArmMaterial);
  }
}

function buildSawmill(block: SpecialBlock) {
  const cx = (block.minX + block.maxX) * 0.5;
  const cz = (block.minZ + block.maxZ) * 0.5;
  const y = groundSurfaceYAt(cx, cz);
  const batch = new BuildingBatch();
  batch.addBox({ x: cx - 12, y, z: cz + 20, width: 40, height: 8, depth: 24, rotationY: 0, color: new THREE.Color(0x8c7a5a), floorHeight: 8, windowWidth: 4, windowRatio: 0.2, seed: 101 }, "sawmill");
  batch.addRoof({ x: cx - 12, y: y + 8, z: cz + 20, width: 42, height: 4, depth: 26, rotationY: 0, color: new THREE.Color(0x4f5257) });
  batch.commit(`${block.id}-buildings`);
  const logs: THREE.BufferGeometry[] = [];
  const random = createRandom(311);
  for (let stack = 0; stack < 5; stack += 1) {
    const sx = block.minX + 10 + stack * 15;
    const sz = block.minZ + 14;
    const rows = 3 + Math.floor(random() * 3);
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < 5 - Math.floor(row / 2); col += 1) {
        const log = new THREE.CylinderGeometry(0.42, 0.42, 9 + random() * 3, 8);
        log.rotateX(Math.PI / 2);
        log.translate(sx + col * 0.9 + row * 0.45, y + 0.42 + row * 0.8, sz + (random() - 0.5) * 0.6);
        logs.push(log);
      }
    }
  }
  const merged = mergeAll(logs);
  if (merged) {
    addMesh(`${block.id}-log-stacks`, merged, benchMaterial);
  }
  const chimney = new THREE.CylinderGeometry(0.7, 0.9, 14, 10);
  chimney.translate(cx + 6, y + 7, cz + 30);
  addMesh(`${block.id}-chimney`, chimney, stoneMaterial);
  for (let index = 0; index < 4; index += 1) {
    addTree("pine", block.minX + 3, block.minZ + 10 + index * 26, y, 1.1, 51);
  }
}

function buildManor(block: SpecialBlock) {
  const cx = (block.minX + block.maxX) * 0.5;
  const cz = (block.minZ + block.maxZ) * 0.5;
  const y = groundSurfaceYAt(cx, cz);
  const batch = new BuildingBatch();
  batch.addBox({ x: cx, y, z: cz, width: 34, height: 9.6, depth: 16, rotationY: 0, color: new THREE.Color(0xd9c9a3), floorHeight: 4.8, windowWidth: 2.4, windowRatio: 0.5, seed: 111 }, "manor");
  batch.addRoof({ x: cx, y: y + 9.6, z: cz, width: 36, height: 5, depth: 18, rotationY: 0, color: new THREE.Color(0x4e4a48) });
  for (const dx of [-15, 15]) {
    batch.addBox({ x: cx + dx, y, z: cz + 14, width: 8, height: 6.4, depth: 12, rotationY: 0, color: new THREE.Color(0xd2c29c), floorHeight: 3.2, windowWidth: 2.0, windowRatio: 0.45, seed: 112 }, "manor");
    batch.addRoof({ x: cx + dx, y: y + 6.4, z: cz + 14, width: 9.4, height: 3.2, depth: 13.4, rotationY: 0, color: new THREE.Color(0x4e4a48) });
  }
  batch.commit(`${block.id}-buildings`);
  const wall: THREE.BufferGeometry[] = [];
  const width = block.maxX - block.minX;
  const depth = block.maxZ - block.minZ;
  wall.push(box(width, 1.4, 0.4, cx, y, block.minZ + 0.2));
  wall.push(box(width, 1.4, 0.4, cx, y, block.maxZ - 0.2));
  wall.push(box(0.4, 1.4, depth, block.minX + 0.2, y, cz));
  wall.push(box(0.4, 1.4, depth, block.maxX - 0.2, y, cz));
  const merged = mergeAll(wall);
  if (merged) {
    addMesh(`${block.id}-garden-wall`, merged, stoneMaterial);
  }
  const drive = new THREE.BoxGeometry(6, 0.1, depth * 0.5);
  drive.translate(cx, y + 0.1, cz - depth * 0.28);
  addMesh(`${block.id}-drive`, drive, gravelVergeMaterial, false);
  const pond = new THREE.CircleGeometry(9, 28);
  pond.rotateX(-Math.PI / 2);
  pond.translate(cx + 30, y + 0.06, cz - 20);
  const pondMesh = new THREE.Mesh(pond, sharedSeaWaterMaterial);
  pondMesh.name = `${block.id}-pond`;
  cityElements.add(pondMesh);
  const random = createRandom(113);
  for (let index = 0; index < 14; index += 1) {
    addTree("broadleaf", block.minX + 6 + random() * (width - 12), block.minZ + 6 + random() * (depth - 12), y, 0.9 + random() * 0.6, 53);
  }
}

function buildCoop(block: SpecialBlock) {
  const cx = (block.minX + block.maxX) * 0.5;
  const cz = (block.minZ + block.maxZ) * 0.5;
  const y = groundSurfaceYAt(cx, cz);
  const parts: THREE.BufferGeometry[] = [];
  for (let index = 0; index < 4; index += 1) {
    const silo = new THREE.CylinderGeometry(4.2, 4.2, 18, 18);
    silo.translate(block.minX + 8 + index * 10, y + 9, cz - 14);
    parts.push(silo);
    const cap = new THREE.ConeGeometry(4.4, 3.2, 18);
    cap.translate(block.minX + 8 + index * 10, y + 19.6, cz - 14);
    parts.push(cap);
  }
  const elevator = new THREE.BoxGeometry(8, 30, 8);
  elevator.translate(block.maxX - 12, y + 15, cz - 14);
  parts.push(elevator);
  const merged = mergeAll(parts);
  if (merged) {
    addMesh(`${block.id}-silos`, merged, craneWhiteMaterial);
  }
  const batch = new BuildingBatch();
  batch.addBox({ x: cx, y, z: cz + 16, width: block.maxX - block.minX - 10, height: 7, depth: 18, rotationY: 0, color: new THREE.Color(0xb9bfc4), floorHeight: 7, windowWidth: 4, windowRatio: 0.18, seed: 121 }, "coop");
  batch.commit(`${block.id}-buildings`);
  const apron = new THREE.BoxGeometry(block.maxX - block.minX, 0.2, block.maxZ - block.minZ);
  apron.translate(cx, y + 0.08, cz);
  addMesh(`${block.id}-apron`, apron, highwayAsphaltMaterial, false);
}

function buildWindfarm(block: SpecialBlock) {
  const towers: THREE.BufferGeometry[] = [];
  const nacelles: THREE.BufferGeometry[] = [];
  const blades: THREE.BufferGeometry[] = [];
  const cx = (block.minX + block.maxX) * 0.5;
  const count = 6;
  for (let index = 0; index < count; index += 1) {
    const z = block.minZ + 20 + ((block.maxZ - block.minZ - 40) * index) / (count - 1);
    const x = cx + (index % 2 === 0 ? -12 : 12);
    const y = groundSurfaceYAt(x, z);
    const tower = new THREE.CylinderGeometry(1.4, 2.6, 78, 14);
    tower.translate(x, y + 39, z);
    towers.push(tower);
    const nacelle = new THREE.BoxGeometry(3.2, 3.2, 9);
    nacelle.rotateY(0.35);
    nacelle.translate(x, y + 79, z);
    nacelles.push(nacelle);
    const hubX = x + Math.sin(0.35) * 5.2;
    const hubZ = z + Math.cos(0.35) * 5.2;
    for (let blade = 0; blade < 3; blade += 1) {
      const geometry = new THREE.BoxGeometry(0.9, 36, 0.45);
      geometry.translate(0, 18, 0);
      geometry.rotateZ((blade / 3) * Math.PI * 2 + index * 0.7);
      geometry.rotateY(0.35);
      geometry.translate(hubX, y + 79, hubZ);
      blades.push(geometry);
    }
  }
  const towerMerged = mergeAll(towers);
  if (towerMerged) {
    addMesh(`${block.id}-towers`, towerMerged, craneWhiteMaterial);
  }
  const nacelleMerged = mergeAll(nacelles);
  if (nacelleMerged) {
    addMesh(`${block.id}-nacelles`, nacelleMerged, craneWhiteMaterial);
  }
  const bladeMerged = mergeAll(blades);
  if (bladeMerged) {
    addMesh(`${block.id}-blades`, bladeMerged, craneWhiteMaterial);
  }
}

function buildGarage(block: SpecialBlock) {
  const cx = (block.minX + block.maxX) * 0.5;
  const cz = (block.minZ + block.maxZ) * 0.5;
  const y = groundSurfaceYAt(cx, cz);
  const width = block.maxX - block.minX - 4;
  const depth = block.maxZ - block.minZ - 4;
  const decks: THREE.BufferGeometry[] = [];
  const columns: THREE.BufferGeometry[] = [];
  const levels = 4;
  for (let level = 0; level <= levels; level += 1) {
    const deck = new THREE.BoxGeometry(width, 0.4, depth);
    deck.translate(cx, y + level * 3.1 + 0.2, cz);
    decks.push(deck);
    if (level < levels) {
      for (let ix = 0; ix < 5; ix += 1) {
        for (let iz = 0; iz < 5; iz += 1) {
          const column = new THREE.BoxGeometry(0.5, 3.1, 0.5);
          column.translate(block.minX + 3 + ix * (width / 4), y + level * 3.1 + 1.55, block.minZ + 3 + iz * (depth / 4));
          columns.push(column);
        }
      }
      const parapetN = new THREE.BoxGeometry(width, 1.1, 0.2);
      parapetN.translate(cx, y + level * 3.1 + 0.95, block.minZ + 2.1);
      decks.push(parapetN);
      const parapetS = new THREE.BoxGeometry(width, 1.1, 0.2);
      parapetS.translate(cx, y + level * 3.1 + 0.95, block.maxZ - 2.1);
      decks.push(parapetS);
      const parapetE = new THREE.BoxGeometry(0.2, 1.1, depth);
      parapetE.translate(block.maxX - 2.1, y + level * 3.1 + 0.95, cz);
      decks.push(parapetE);
    }
  }
  const ramp = new THREE.BoxGeometry(5, 0.3, depth * 0.7);
  ramp.rotateX(-Math.atan2(3.1, depth * 0.7));
  ramp.translate(block.minX + 6, y + 1.7, cz);
  decks.push(ramp);
  const deckMerged = mergeAll(decks);
  if (deckMerged) {
    addMesh(`${block.id}-decks`, deckMerged, roadStructureConcreteMaterialRef());
  }
  const columnMerged = mergeAll(columns);
  if (columnMerged) {
    addMesh(`${block.id}-columns`, columnMerged, stoneMaterial);
  }
  const sign = new THREE.BoxGeometry(6, 1.4, 0.2);
  sign.translate(block.minX + 8, y + 4.2, block.minZ + 1.8);
  addMesh(`${block.id}-sign`, sign, roadMarkingYellowMaterial, false);
  for (let level = 0; level < levels; level += 1) {
    for (let ix = 0; ix < 7; ix += 1) {
      const x = block.minX + 8 + ix * 5.2;
      if (x > block.maxX - 6) {
        break;
      }
      roadSideSlots.parkingBays.push({ x, y: y + level * 3.1 + 0.4, z: cz - 6, heading: 0 });
      roadSideSlots.parkingBays.push({ x, y: y + level * 3.1 + 0.4, z: cz + 6, heading: Math.PI });
    }
  }
}

function roadStructureConcreteMaterialRef() {
  return sidewalkMaterial;
}

export function buildSpecialBlocks() {
  for (const block of SPECIAL_BLOCKS) {
    if (block.kind === "plaza") {
      buildPlaza(block);
    } else if (block.kind === "park") {
      buildPark(block);
    } else if (block.kind === "stadium") {
      buildStadium(block);
    } else if (block.kind === "parking") {
      buildParking(block);
    } else if (block.kind === "school") {
      buildSchool(block);
    } else if (block.kind === "church") {
      buildChurch(block);
    } else if (block.kind === "station") {
      buildStation(block);
    } else if (block.kind === "hospital") {
      buildHospital(block);
    } else if (block.kind === "green") {
      buildGreen(block);
    } else if (block.kind === "services") {
      buildServices(block);
    } else if (block.kind === "golf") {
      buildGolf(block);
    } else if (block.kind === "campsite") {
      buildCampsite(block);
    } else if (block.kind === "chairlift") {
      buildChairlift(block);
    } else if (block.kind === "sawmill") {
      buildSawmill(block);
    } else if (block.kind === "manor") {
      buildManor(block);
    } else if (block.kind === "coop") {
      buildCoop(block);
    } else if (block.kind === "windfarm") {
      buildWindfarm(block);
    } else if (block.kind === "garage") {
      buildGarage(block);
    }
  }
  commitBenches();
}
