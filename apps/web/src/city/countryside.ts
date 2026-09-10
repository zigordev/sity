import * as THREE from "three";
import { groundSurfaceYAt } from "../natural/terrain";
import { cityElements } from "../render/context";
import { fieldMaterials, gravelVergeMaterial } from "../render/materials";
import { mergeAll } from "../roads/geometry";
import { corridorClearance } from "../world/occupancy";
import { BuildingBatch } from "./buildings";
import { createRandom } from "./random";
import { addTree } from "./vegetation";

interface Field {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  material: number;
  furrows?: boolean;
}

const FIELDS: Field[] = [
  { minX: 462, maxX: 502, minZ: -1548, maxZ: -1362, material: 3 },
  { minX: 542, maxX: 732, minZ: -1548, maxZ: -1466, material: 0, furrows: true },
  { minX: 542, maxX: 732, minZ: -1452, maxZ: -1372, material: 1 },
  { minX: 246, maxX: 322, minZ: -1556, maxZ: -1436, material: 2 },
  { minX: 300, maxX: 384, minZ: -1130, maxZ: -1042, material: 1 },
  { minX: 250, maxX: 372, minZ: -1400, maxZ: -1300, material: 2 },
];

function fieldGeometry(field: Field) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const columns = Math.max(2, Math.ceil((field.maxX - field.minX) / 8));
  const rows = Math.max(2, Math.ceil((field.maxZ - field.minZ) / 8));
  for (let row = 0; row <= rows; row += 1) {
    const z = field.minZ + ((field.maxZ - field.minZ) * row) / rows;
    for (let column = 0; column <= columns; column += 1) {
      const x = field.minX + ((field.maxX - field.minX) * column) / columns;
      positions.push(x, groundSurfaceYAt(x, z) + 0.07, z);
      uvs.push(x / 12, z / 12);
    }
  }
  const stride = columns + 1;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const a = row * stride + column;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addHedgerow(field: Field, random: () => number) {
  const perimeter: Array<[{ x: number; z: number }, { x: number; z: number }]> = [
    [{ x: field.minX, z: field.minZ }, { x: field.maxX, z: field.minZ }],
    [{ x: field.maxX, z: field.minZ }, { x: field.maxX, z: field.maxZ }],
    [{ x: field.maxX, z: field.maxZ }, { x: field.minX, z: field.maxZ }],
    [{ x: field.minX, z: field.maxZ }, { x: field.minX, z: field.minZ }],
  ];
  for (const [a, b] of perimeter) {
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    for (let s = 4; s < length - 3; s += 7 + random() * 4) {
      const t = s / length;
      const x = a.x + (b.x - a.x) * t + (random() - 0.5) * 1.5;
      const z = a.z + (b.z - a.z) * t + (random() - 0.5) * 1.5;
      if (corridorClearance(x, z, 40) < 6) {
        continue;
      }
      addTree("broadleaf", x, z, groundSurfaceYAt(x, z) - 0.6, 0.38 + random() * 0.18, 83);
    }
  }
}

function addFurrows(field: Field) {
  const parts: THREE.BufferGeometry[] = [];
  for (let z = field.minZ + 4; z < field.maxZ - 2; z += 4.5) {
    const columns = Math.ceil((field.maxX - field.minX - 8) / 12);
    for (let column = 0; column < columns; column += 1) {
      const x0 = field.minX + 4 + column * 12;
      const x1 = Math.min(x0 + 12, field.maxX - 4);
      const y0 = groundSurfaceYAt(x0, z) + 0.16;
      const y1 = groundSurfaceYAt(x1, z) + 0.16;
      const geometry = new THREE.BoxGeometry(x1 - x0, 0.18, 0.8);
      geometry.translate((x0 + x1) * 0.5, (y0 + y1) * 0.5, z);
      parts.push(geometry);
    }
  }
  const merged = mergeAll(parts);
  if (!merged) {
    return;
  }
  const mesh = new THREE.Mesh(merged, gravelVergeMaterial);
  mesh.name = "field-furrows";
  mesh.receiveShadow = true;
  cityElements.add(mesh);
}

function addFarmstead() {
  const batch = new BuildingBatch();
  const y = groundSurfaceYAt(292, -1518);
  batch.addBox({ x: 292, y, z: -1518, width: 24, height: 6.5, depth: 12, rotationY: 0.62, color: new THREE.Color(0x8c4a3b), floorHeight: 6.5, windowWidth: 3, windowRatio: 0.15, seed: 91 }, "farm-barn");
  batch.addRoof({ x: 292, y: y + 6.5, z: -1518, width: 25.4, height: 4.2, depth: 13.4, rotationY: 0.62, color: new THREE.Color(0x5a5f66) });
  batch.addBox({ x: 318, y, z: -1540, width: 11, height: 6.2, depth: 9, rotationY: 0.62, color: new THREE.Color(0xe6dfcf), floorHeight: 3.1, windowWidth: 2.4, windowRatio: 0.4, seed: 92 }, "farm-house");
  batch.addRoof({ x: 318, y: y + 6.2, z: -1540, width: 12.4, height: 3, depth: 10.4, rotationY: 0.62, color: new THREE.Color(0x8d4a3b) });
  batch.commit("northfield-farm");
  const silo = new THREE.CylinderGeometry(2.6, 2.6, 13, 18);
  silo.translate(272, y + 6.5, -1500);
  const cap = new THREE.ConeGeometry(2.8, 2.2, 18);
  cap.translate(272, y + 14.1, -1500);
  const merged = mergeAll([silo, cap]);
  if (merged) {
    const mesh = new THREE.Mesh(merged, gravelVergeMaterial);
    mesh.name = "northfield-farm-silo";
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    cityElements.add(mesh);
  }
}

export function addCountryside() {
  const random = createRandom(2718);
  FIELDS.forEach((field, index) => {
    const mesh = new THREE.Mesh(fieldGeometry(field), fieldMaterials[field.material % fieldMaterials.length]);
    mesh.name = `field-${index + 1}`;
    mesh.receiveShadow = true;
    cityElements.add(mesh);
    addHedgerow(field, random);
    if (field.furrows) {
      addFurrows(field);
    }
  });
  addFarmstead();
}
