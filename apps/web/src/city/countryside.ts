import * as THREE from "three";
import { groundSurfaceYAt } from "../natural/terrain";
import { cityElements } from "../render/context";
import { fieldMaterials, gravelVergeMaterial } from "../render/materials";
import { mergeAll } from "../roads/geometry";
import { corridorClearance } from "../world/occupancy";
import { rasterValueAt } from "./lots";
import { districtAt } from "./districts";
import { WESTERN_COUNTRY_SPLIT_Z_M } from "../config/constants";
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

function generateFarmland(random: () => number) {
  const fields: Field[] = [];
  const minX = -3380;
  const maxX = -1930;
  const minZ = WESTERN_COUNTRY_SPLIT_Z_M + 40;
  const maxZ = 1550;
  const columns = 7;
  const rows = 6;
  const cellW = (maxX - minX) / columns;
  const cellD = (maxZ - minZ) / rows;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x0 = minX + column * cellW + 14;
      const x1 = minX + (column + 1) * cellW - 14;
      const z0 = minZ + row * cellD + 14;
      const z1 = minZ + (row + 1) * cellD - 14;
      const candidate: Field = { minX: x0, maxX: x1, minZ: z0, maxZ: z1, material: (column * 3 + row * 5 + Math.floor(random() * 2)) % 4, furrows: random() > 0.62 };
      const probes = [
        [x0, z0], [x1, z0], [x0, z1], [x1, z1], [(x0 + x1) * 0.5, (z0 + z1) * 0.5], [(x0 + x1) * 0.5, z0], [(x0 + x1) * 0.5, z1], [x0, (z0 + z1) * 0.5], [x1, (z0 + z1) * 0.5],
      ];
      let blocked = false;
      for (const [px, pz] of probes) {
        if (corridorClearance(px, pz, 80) < 12 || rasterValueAt(px, pz) !== 0 || districtAt(px, pz)) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        for (const [sx0, sx1, sz0, sz1] of [
          [x0, (x0 + x1) * 0.5 - 8, z0, (z0 + z1) * 0.5 - 8],
          [(x0 + x1) * 0.5 + 8, x1, z0, (z0 + z1) * 0.5 - 8],
          [x0, (x0 + x1) * 0.5 - 8, (z0 + z1) * 0.5 + 8, z1],
          [(x0 + x1) * 0.5 + 8, x1, (z0 + z1) * 0.5 + 8, z1],
        ]) {
          const subProbes = [[sx0, sz0], [sx1, sz0], [sx0, sz1], [sx1, sz1], [(sx0 + sx1) * 0.5, (sz0 + sz1) * 0.5]];
          if (subProbes.every(([px, pz]) => corridorClearance(px, pz, 80) >= 12 && rasterValueAt(px, pz) === 0 && !districtAt(px, pz))) {
            fields.push({ minX: sx0, maxX: sx1, minZ: sz0, maxZ: sz1, material: Math.floor(random() * 4), furrows: random() > 0.6 });
          }
        }
        continue;
      }
      fields.push(candidate);
    }
  }
  return fields;
}

function addFarmyard(x: number, z: number, rotation: number, seed: number) {
  const random = createRandom(seed);
  const batch = new BuildingBatch();
  const y = groundSurfaceYAt(x, z);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const at = (dx: number, dz: number) => ({ x: x + dx * cos + dz * sin, z: z - dx * sin + dz * cos });
  const house = at(-22, 0);
  batch.addBox({ x: house.x, y, z: house.z, width: 12, height: 6.4, depth: 9, rotationY: rotation, color: new THREE.Color(0xe6dfcf), floorHeight: 3.2, windowWidth: 2.2, windowRatio: 0.42, seed }, `farm-${seed}-house`);
  batch.addRoof({ x: house.x, y: y + 6.4, z: house.z, width: 13.4, height: 3.2, depth: 10.4, rotationY: rotation, color: new THREE.Color(0x8d4a3b) });
  const barn = at(4, -18);
  batch.addBox({ x: barn.x, y, z: barn.z, width: 26, height: 7, depth: 13, rotationY: rotation, color: new THREE.Color(0x8c4a3b), floorHeight: 7, windowWidth: 3, windowRatio: 0.12, seed: seed + 1 }, `farm-${seed}-barn`);
  batch.addRoof({ x: barn.x, y: y + 7, z: barn.z, width: 27.4, height: 4.6, depth: 14.4, rotationY: rotation, color: new THREE.Color(0x5a5f66) });
  const shed = at(6, 18);
  batch.addBox({ x: shed.x, y, z: shed.z, width: 22, height: 5.2, depth: 11, rotationY: rotation, color: new THREE.Color(0x9aa5ad), floorHeight: 5.2, windowWidth: 4, windowRatio: 0.1, seed: seed + 2 }, `farm-${seed}-shed`);
  batch.commit(`farmyard-${seed}`);
  const silos: THREE.BufferGeometry[] = [];
  for (const dx of [24, 30]) {
    const point = at(dx, -12);
    const silo = new THREE.CylinderGeometry(2.4, 2.4, 12, 16);
    silo.translate(point.x, y + 6, point.z);
    silos.push(silo);
    const cap = new THREE.ConeGeometry(2.6, 2.2, 16);
    cap.translate(point.x, y + 13.1, point.z);
    silos.push(cap);
  }
  const merged = mergeAll(silos);
  if (merged) {
    const mesh = new THREE.Mesh(merged, gravelVergeMaterial);
    mesh.name = `farmyard-${seed}-silos`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    cityElements.add(mesh);
  }
  for (let index = 0; index < 4; index += 1) {
    const point = at(-30 + random() * 60, 26 + random() * 10);
    addTree("broadleaf", point.x, point.z, groundSurfaceYAt(point.x, point.z), 0.9 + random() * 0.5, seed + 9);
  }
}

export function addCountryside() {
  const random = createRandom(2718);
  const farmland = generateFarmland(random);
  for (const [x, z, rotation, seed] of [
    [-2318, 500, 0.1, 301],
    [-3080, 548, -0.2, 302],
    [-1900, 1050, 0.4, 303],
    [-2770, 1052, 0.05, 304],
  ] as const) {
    addFarmyard(x, z, rotation, seed);
  }
  [...FIELDS, ...farmland].forEach((field, index) => {
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
