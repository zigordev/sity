import * as THREE from "three";
import { COAST_SURFACE_Y } from "../config/constants";
import { artificialElements } from "../render/context";
import {
  attractionBlueMaterial,
  attractionRedMaterial,
  attractionYellowMaterial,
  beachBinMaterial,
  beachFlagMaterial,
  beachTowelMaterials,
  beachUmbrellaMaterials,
  beachWhiteMaterial,
  craneWhiteMaterial,
  dockMaterial,
  guardrailMaterial,
  lampHeadMaterial,
  lampPoleMaterial,
  roadStructureConcreteMaterial,
  sidewalkMaterial,
  steelDarkMaterial,
  woodPierMaterial,
} from "../render/materials";
import { boxBetween, mergeAll } from "../roads/geometry";
import { MaterialBatch } from "../geometry/batch";
import { mainBoundaryMaxZ, riverMouth } from "../world/frame";

const surfaceY = COAST_SURFACE_Y;

function hash(a: number, b: number) {
  const value = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

const batch = new MaterialBatch(artificialElements, "beach");

function addMerged(_name: string, parts: THREE.BufferGeometry[], material: THREE.Material, castShadow = true) {
  batch.add(material, parts, castShadow);
}

function instanced(name: string, geometry: THREE.BufferGeometry, material: THREE.Material, matrices: THREE.Matrix4[], castShadow = true) {
  if (matrices.length === 0) {
    return;
  }
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  artificialElements.add(mesh);
}

function boxAt(width: number, height: number, depth: number, x: number, bottomY: number, z: number, rotationY = 0) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  geometry.rotateY(rotationY);
  geometry.translate(x, bottomY + height * 0.5, z);
  return geometry;
}

function placement(x: number, y: number, z: number, rotationY = 0, scale = 1) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationY),
    new THREE.Vector3(scale, scale, scale),
  );
}

function addPromenade(beachInnerX: number, fromZ: number, toZ: number) {
  const width = 6;
  const centreX = beachInnerX + width * 0.5;
  addMerged("beach-promenade", [boxAt(width, 0.5, toZ - fromZ, centreX, surfaceY - 0.15, (fromZ + toZ) * 0.5)], sidewalkMaterial, false);
  addMerged("beach-promenade-kerb", [boxAt(0.4, 0.62, toZ - fromZ, beachInnerX + width + 0.2, surfaceY - 0.2, (fromZ + toZ) * 0.5)], roadStructureConcreteMaterial, false);
  const posts: THREE.BufferGeometry[] = [];
  const rails: THREE.BufferGeometry[] = [];
  const railX = beachInnerX + width - 0.3;
  for (let z = fromZ + 2; z <= toZ - 2; z += 4) {
    posts.push(boxAt(0.1, 1.1, 0.1, railX, surfaceY + 0.35, z));
  }
  for (const lift of [0.75, 1.35]) {
    rails.push(boxBetween({ x: railX, y: surfaceY + 0.35, z: fromZ + 2 }, { x: railX, y: surfaceY + 0.35, z: toZ - 2 }, 0.06, 0.06, lift - 0.03));
  }
  addMerged("beach-promenade-rail-posts", posts, guardrailMaterial);
  addMerged("beach-promenade-rails", rails, guardrailMaterial, false);
  const lampPoles: THREE.BufferGeometry[] = [];
  const lampHeads: THREE.BufferGeometry[] = [];
  const benches: THREE.BufferGeometry[] = [];
  for (let z = fromZ + 16; z < toZ - 10; z += 30) {
    const pole = new THREE.CylinderGeometry(0.07, 0.11, 4.6, 8);
    pole.translate(beachInnerX + 1.0, surfaceY + 2.65, z);
    lampPoles.push(pole);
    const head = new THREE.SphereGeometry(0.32, 10, 8);
    head.translate(beachInnerX + 1.0, surfaceY + 5.1, z);
    lampHeads.push(head);
    if (Math.floor(z / 30) % 2 === 0) {
      benches.push(boxAt(0.45, 0.08, 1.8, beachInnerX + 1.6, surfaceY + 0.8, z + 12));
      benches.push(boxAt(0.06, 0.4, 1.8, beachInnerX + 1.4, surfaceY + 0.88, z + 12));
      benches.push(boxAt(0.5, 0.44, 0.08, beachInnerX + 1.6, surfaceY + 0.35, z + 12 - 0.8));
      benches.push(boxAt(0.5, 0.44, 0.08, beachInnerX + 1.6, surfaceY + 0.35, z + 12 + 0.8));
    }
  }
  addMerged("beach-promenade-lamp-poles", lampPoles, lampPoleMaterial);
  addMerged("beach-promenade-lamp-heads", lampHeads, lampHeadMaterial, false);
  addMerged("beach-promenade-benches", benches, dockMaterial);
}

function addBeachHuts(beachInnerX: number, fromZ: number, count: number) {
  const hutMaterials = [attractionRedMaterial, attractionBlueMaterial, attractionYellowMaterial, craneWhiteMaterial];
  const byMaterial: THREE.Matrix4[][] = hutMaterials.map(() => []);
  const roofs: THREE.Matrix4[] = [];
  for (let index = 0; index < count; index += 1) {
    const z = fromZ + index * 5.2;
    const x = beachInnerX + 11;
    byMaterial[index % hutMaterials.length].push(placement(x, surfaceY + 1.35, z));
    roofs.push(placement(x, surfaceY + 2.7, z));
  }
  const body = new THREE.BoxGeometry(3.2, 2.7, 3.6);
  byMaterial.forEach((matrices, index) => instanced(`beach-huts-${index + 1}`, body, hutMaterials[index], matrices));
  const roof = new THREE.ConeGeometry(2.6, 1.3, 4);
  roof.rotateY(Math.PI / 4);
  roof.translate(0, 0.65, 0);
  instanced("beach-hut-roofs", roof, steelDarkMaterial, roofs);
}

function addKiosks(beachInnerX: number, zs: number[]) {
  const walls: THREE.BufferGeometry[] = [];
  const awnings: THREE.BufferGeometry[] = [];
  const counters: THREE.BufferGeometry[] = [];
  for (const z of zs) {
    const x = beachInnerX + 12;
    walls.push(boxAt(5, 3.2, 4, x, surfaceY, z));
    awnings.push(boxAt(6.2, 0.12, 2.4, x + 3.1, surfaceY + 2.9, z));
    counters.push(boxAt(0.6, 1.1, 4.2, x + 2.8, surfaceY, z));
    for (const dz of [-1.8, 1.8]) {
      counters.push(boxAt(0.08, 2.8, 0.08, x + 6.1, surfaceY, z + dz));
    }
  }
  addMerged("beach-kiosk-walls", walls, craneWhiteMaterial);
  addMerged("beach-kiosk-awnings", awnings, attractionRedMaterial, false);
  addMerged("beach-kiosk-counters", counters, dockMaterial);
}

function addUmbrellaGrid(beachInnerX: number, fromZ: number, toZ: number) {
  const poles: THREE.Matrix4[] = [];
  const canopies: THREE.Matrix4[][] = beachUmbrellaMaterials.map(() => []);
  const sunbeds: THREE.Matrix4[] = [];
  const towels: THREE.Matrix4[][] = beachTowelMaterials.map(() => []);
  for (let z = fromZ; z < toZ; z += 12) {
    for (const column of [0, 1, 2]) {
      const seed = hash(z, column);
      if (seed > 0.62) {
        continue;
      }
      const x = beachInnerX + 26 + column * 11 + (hash(column, z) - 0.5) * 4;
      const zz = z + (hash(z * 3, column) - 0.5) * 4;
      poles.push(placement(x, surfaceY + 1.15, zz));
      canopies[Math.floor(hash(x, zz) * canopies.length) % canopies.length].push(placement(x, surfaceY + 2.35, zz, hash(zz, x) * Math.PI));
      for (const side of [-1, 1]) {
        sunbeds.push(placement(x + side * 1.3, surfaceY + 0.18, zz + 1.6, Math.PI * 0.5));
      }
    }
    if (hash(z, 9) > 0.5) {
      const tx = beachInnerX + 40 + hash(z, 4) * 40;
      towels[Math.floor(hash(tx, z) * towels.length) % towels.length].push(placement(tx, surfaceY + 0.06, z + 6, hash(z, tx) * Math.PI));
    }
  }
  instanced("beach-umbrella-poles", new THREE.CylinderGeometry(0.035, 0.045, 2.3, 6), dockMaterial, poles, false);
  const canopy = new THREE.ConeGeometry(1.7, 0.75, 10);
  canopy.translate(0, 0.37, 0);
  canopies.forEach((matrices, index) => instanced(`beach-umbrella-canopies-${index + 1}`, canopy, beachUmbrellaMaterials[index], matrices));
  const sunbed = mergeAll([
    (() => { const g = new THREE.BoxGeometry(0.7, 0.08, 1.9); g.translate(0, 0.2, 0); return g; })(),
    (() => { const g = new THREE.BoxGeometry(0.7, 0.5, 0.06); g.rotateX(-0.6); g.translate(0, 0.42, -0.85); return g; })(),
    (() => { const g = new THREE.BoxGeometry(0.66, 0.2, 1.7); g.translate(0, 0.1, 0.1); return g; })(),
  ]);
  if (sunbed) {
    instanced("beach-sunbeds", sunbed, beachWhiteMaterial, sunbeds);
  }
  const towel = new THREE.BoxGeometry(1.0, 0.03, 1.9);
  towels.forEach((matrices, index) => instanced(`beach-towels-${index + 1}`, towel, beachTowelMaterials[index], matrices, false));
}

function addVolleyballCourts(beachInnerX: number, zs: number[]) {
  const lines: THREE.BufferGeometry[] = [];
  const posts: THREE.BufferGeometry[] = [];
  const nets: THREE.BufferGeometry[] = [];
  for (const z of zs) {
    const cx = beachInnerX + 48;
    lines.push(boxAt(0.1, 0.03, 16, cx - 4, surfaceY + 0.05, z));
    lines.push(boxAt(0.1, 0.03, 16, cx + 4, surfaceY + 0.05, z));
    lines.push(boxAt(8, 0.03, 0.1, cx, surfaceY + 0.05, z - 8));
    lines.push(boxAt(8, 0.03, 0.1, cx, surfaceY + 0.05, z + 8));
    for (const dx of [-4.6, 4.6]) {
      posts.push(boxAt(0.1, 2.5, 0.1, cx + dx, surfaceY, z));
    }
    nets.push(boxAt(9.2, 1.0, 0.03, cx, surfaceY + 1.4, z));
  }
  addMerged("beach-volleyball-lines", lines, beachWhiteMaterial, false);
  addMerged("beach-volleyball-posts", posts, steelDarkMaterial);
  addMerged("beach-volleyball-nets", nets, beachWhiteMaterial, false);
}

function addLifeguardTowers(beachInnerX: number, zs: number[]) {
  const wood: THREE.BufferGeometry[] = [];
  const cabins: THREE.BufferGeometry[] = [];
  const roofs: THREE.BufferGeometry[] = [];
  for (const z of zs) {
    const x = beachInnerX + 66;
    for (const dx of [-1.3, 1.3]) {
      for (const dz of [-1.3, 1.3]) {
        wood.push(boxAt(0.2, 3.2, 0.2, x + dx, surfaceY, z + dz));
      }
    }
    wood.push(boxAt(3.4, 0.16, 3.4, x, surfaceY + 3.1, z));
    wood.push(boxBetween({ x: x - 1.7, y: surfaceY + 3.1, z: z + 1.7 }, { x: x - 1.7, y: surfaceY, z: z + 6.5 }, 0.9, 0.08));
    cabins.push(boxAt(2.6, 2.3, 2.4, x, surfaceY + 3.26, z));
    roofs.push(boxAt(3.2, 0.14, 3.0, x, surfaceY + 5.56, z));
    for (const dz of [-1.7, 1.7]) {
      wood.push(boxAt(3.4, 0.9, 0.06, x, surfaceY + 3.26, z + dz));
    }
    for (const dx of [-1.7, 1.7]) {
      wood.push(boxAt(0.06, 0.9, 3.4, x + dx, surfaceY + 3.26, z));
    }
  }
  addMerged("lifeguard-tower-timber", wood, woodPierMaterial);
  addMerged("lifeguard-tower-cabins", cabins, beachWhiteMaterial);
  addMerged("lifeguard-tower-roofs", roofs, attractionRedMaterial);
}

function addShowersBinsFlags(beachInnerX: number, fromZ: number, toZ: number) {
  const showers: THREE.BufferGeometry[] = [];
  const bins: THREE.Matrix4[] = [];
  const flagPoles: THREE.BufferGeometry[] = [];
  const flags: THREE.BufferGeometry[] = [];
  for (let z = fromZ + 40; z < toZ - 20; z += 200) {
    const x = beachInnerX + 9;
    showers.push(boxAt(0.12, 2.6, 0.12, x, surfaceY, z));
    showers.push(boxAt(0.5, 0.08, 0.5, x, surfaceY + 2.55, z));
    showers.push(boxAt(1.4, 0.06, 1.4, x, surfaceY + 0.02, z));
  }
  for (let z = fromZ + 10; z < toZ - 10; z += 45) {
    bins.push(placement(beachInnerX + 7.2, surfaceY + 0.45, z));
  }
  for (let z = fromZ + 90; z < toZ - 40; z += 240) {
    const x = beachInnerX + 70;
    const pole = new THREE.CylinderGeometry(0.05, 0.07, 4.2, 6);
    pole.translate(x, surfaceY + 2.1, z);
    flagPoles.push(pole);
    flags.push(boxAt(0.9, 0.55, 0.03, x + 0.45, surfaceY + 3.5, z));
  }
  addMerged("beach-showers", showers, roadStructureConcreteMaterial);
  instanced("beach-bins", new THREE.CylinderGeometry(0.32, 0.28, 0.9, 10), beachBinMaterial, bins);
  addMerged("beach-flag-poles", flagPoles, lampPoleMaterial, false);
  addMerged("beach-flags", flags, beachFlagMaterial, false);
}

function addBoardwalks(beachInnerX: number, fromZ: number, toZ: number) {
  const planks: THREE.Matrix4[] = [];
  const plank = new THREE.BoxGeometry(0.28, 0.05, 2.4);
  for (let z = fromZ + 60; z < toZ - 30; z += 200) {
    for (let x = beachInnerX + 7; x < beachInnerX + 62; x += 0.34) {
      planks.push(placement(x, surfaceY + 0.06, z));
    }
  }
  instanced("beach-boardwalks", plank, woodPierMaterial, planks, false);
}

function addBeachBar(beachInnerX: number, z: number) {
  const x = beachInnerX + 22;
  addMerged("beach-bar-building", [boxAt(10, 3.4, 8, x, surfaceY, z)], craneWhiteMaterial);
  const roof = new THREE.ConeGeometry(8.5, 3.2, 8);
  roof.translate(x, surfaceY + 5.0, z);
  addMerged("beach-bar-roof", [roof], dockMaterial);
  const terrace: THREE.BufferGeometry[] = [];
  terrace.push(boxAt(18, 0.16, 12, x, surfaceY - 0.02, z + 10));
  addMerged("beach-bar-terrace", terrace, woodPierMaterial, false);
  const parasols: THREE.Matrix4[] = [];
  const tables: THREE.BufferGeometry[] = [];
  for (let index = 0; index < 8; index += 1) {
    const px = x - 7 + (index % 4) * 4.6;
    const pz = z + 7 + Math.floor(index / 4) * 5;
    parasols.push(placement(px, surfaceY + 2.4, pz));
    const table = new THREE.CylinderGeometry(0.6, 0.6, 0.06, 10);
    table.translate(px, surfaceY + 0.9, pz);
    tables.push(table);
    const leg = new THREE.CylinderGeometry(0.04, 0.05, 0.9, 6);
    leg.translate(px, surfaceY + 0.45, pz);
    tables.push(leg);
  }
  const parasol = new THREE.ConeGeometry(1.5, 0.6, 8);
  parasol.translate(0, 0.3, 0);
  instanced("beach-bar-parasols", parasol, attractionYellowMaterial, parasols);
  addMerged("beach-bar-tables", tables, steelDarkMaterial);
  const stools: THREE.Matrix4[] = [];
  for (let index = 0; index < 6; index += 1) {
    stools.push(placement(x - 5 + index * 2, surfaceY + 0.32, z - 5.4));
  }
  instanced("beach-bar-stools", new THREE.CylinderGeometry(0.22, 0.22, 0.64, 8), dockMaterial, stools);
}

export function addHumanScaleBeach(beachInnerX: number) {
  const fromZ = riverMouth.z + 300;
  const toZ = mainBoundaryMaxZ - 30;
  addPromenade(beachInnerX, fromZ - 10, toZ);
  addBeachHuts(beachInnerX, fromZ + 40, 18);
  addKiosks(beachInnerX, [fromZ + 200, fromZ + 520, fromZ + 860]);
  addUmbrellaGrid(beachInnerX, fromZ + 20, toZ - 20);
  addVolleyballCourts(beachInnerX, [fromZ + 300, fromZ + 760]);
  addLifeguardTowers(beachInnerX, [fromZ + 160, fromZ + 560, fromZ + 940]);
  addShowersBinsFlags(beachInnerX, fromZ, toZ);
  addBoardwalks(beachInnerX, fromZ, toZ);
  addBeachBar(beachInnerX, fromZ + 680);
  batch.commit();
}
