import * as THREE from "three";
import { groundSurfaceYAt } from "../natural/terrain";
import { cityElements } from "../render/context";
import { highwayAsphaltMaterial, roadMarkingWhiteMaterial, sidewalkMaterial, sharedSeaWaterMaterial, lampPoleMaterial, gravelVergeMaterial, craneWhiteMaterial, roadMarkingYellowMaterial, shelterGlassMaterial } from "../render/materials";
import { mergeAll } from "../roads/geometry";
import { SPECIAL_BLOCKS, type SpecialBlock } from "./districts";
import { BuildingBatch } from "./buildings";
import { createRandom } from "./random";
import { addTree } from "./vegetation";

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
  const canopy = new THREE.BoxGeometry(14, 0.2, 30);
  canopy.translate(eastX + 5, y + 4.6, cz);
  addMesh(`${block.id}-entrance-canopy`, canopy, craneWhiteMaterial);
  const canopyGlass = new THREE.BoxGeometry(13.6, 0.06, 29.6);
  canopyGlass.translate(eastX + 5, y + 4.72, cz);
  addMesh(`${block.id}-entrance-glass`, canopyGlass, shelterGlassMaterial, false);
  for (const dz of [-13, 0, 13]) {
    const post = new THREE.CylinderGeometry(0.16, 0.16, 4.6, 10);
    post.translate(eastX + 11, y + 2.3, cz + dz);
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
    }
  }
  commitBenches();
}
