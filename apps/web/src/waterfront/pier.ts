import * as THREE from "three";
import { ATTRACTION_PIER_DEPTH_M, ATTRACTION_PIER_LENGTH_M, PLATFORM_SURFACE_Y } from "../config/constants";
import { artificialElements } from "../render/context";
import {
  attractionBlueMaterial,
  attractionRedMaterial,
  attractionYellowMaterial,
  beachFlagMaterial,
  craneWhiteMaterial,
  dockMaterial,
  guardrailMaterial,
  lampHeadMaterial,
  lampPoleMaterial,
  shelterGlassMaterial,
  steelDarkMaterial,
  woodPierMaterial,
} from "../render/materials";
import { boxBetween, mergeAll } from "../roads/geometry";
import { MaterialBatch } from "../geometry/batch";

const deckY = PLATFORM_SURFACE_Y;

const batch = new MaterialBatch(artificialElements, "pier");

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

function addEntrance(x: number, z: number) {
  const parts: THREE.BufferGeometry[] = [];
  for (const dz of [-11, 11]) {
    parts.push(boxAt(0.7, 7.5, 0.7, x, deckY, z + dz));
  }
  parts.push(boxAt(0.6, 1.4, 23, x, deckY + 7.2, z));
  addMerged("pier-entrance-arch", parts, craneWhiteMaterial);
  addMerged("pier-entrance-sign", [boxAt(0.3, 2.2, 12, x, deckY + 8.6, z)], attractionYellowMaterial, false);
}

function addStalls(x0: number, z: number, count: number) {
  const walls: THREE.BufferGeometry[] = [];
  const awnings: THREE.BufferGeometry[] = [];
  const counters: THREE.BufferGeometry[] = [];
  for (let index = 0; index < count; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const x = x0 + index * 11;
    const zz = z + side * 12;
    walls.push(boxAt(4.2, 3.2, 3.4, x, deckY, zz));
    awnings.push(boxAt(5.2, 0.12, 2.4, x, deckY + 2.9, zz - side * 2.8));
    counters.push(boxAt(4.4, 1.05, 0.5, x, deckY, zz - side * 1.9));
    for (const dx of [-2.4, 2.4]) {
      counters.push(boxAt(0.08, 2.9, 0.08, x + dx, deckY, zz - side * 3.9));
    }
  }
  addMerged("pier-stall-walls", walls, craneWhiteMaterial);
  addMerged("pier-stall-awnings", awnings, attractionRedMaterial, false);
  addMerged("pier-stall-counters", counters, dockMaterial);
}

function addCarousel(x: number, z: number) {
  const platform = new THREE.CylinderGeometry(8.5, 8.8, 0.5, 32);
  platform.translate(x, deckY + 0.25, z);
  const step = new THREE.CylinderGeometry(9.6, 9.8, 0.25, 32);
  step.translate(x, deckY + 0.12, z);
  addMerged("pier-carousel-platform", [platform, step], woodPierMaterial);
  const column = new THREE.CylinderGeometry(0.7, 0.7, 5.6, 12);
  column.translate(x, deckY + 3.3, z);
  addMerged("pier-carousel-column", [column], attractionYellowMaterial);
  const canopy = new THREE.ConeGeometry(10.2, 3.8, 24);
  canopy.translate(x, deckY + 7.5, z);
  addMerged("pier-carousel-canopy", [canopy], attractionRedMaterial);
  const rim = new THREE.TorusGeometry(10, 0.25, 8, 32);
  rim.rotateX(Math.PI / 2);
  rim.translate(x, deckY + 5.6, z);
  addMerged("pier-carousel-rim", [rim], attractionYellowMaterial, false);
  const poles: THREE.BufferGeometry[] = [];
  const horses: THREE.Matrix4[] = [];
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2;
    const radius = index % 2 === 0 ? 6.4 : 4.6;
    const px = x + Math.cos(angle) * radius;
    const pz = z + Math.sin(angle) * radius;
    const pole = new THREE.CylinderGeometry(0.05, 0.05, 5.1, 6);
    pole.translate(px, deckY + 3.05, pz);
    poles.push(pole);
    horses.push(
      new THREE.Matrix4().compose(
        new THREE.Vector3(px, deckY + 1.25 + (index % 3) * 0.2, pz),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -angle),
        new THREE.Vector3(1, 1, 1),
      ),
    );
  }
  addMerged("pier-carousel-poles", poles, guardrailMaterial, false);
  const horse = mergeAll([
    (() => { const g = new THREE.BoxGeometry(0.45, 0.55, 1.4); return g; })(),
    (() => { const g = new THREE.BoxGeometry(0.3, 0.6, 0.45); g.translate(0, 0.5, 0.75); return g; })(),
  ]);
  if (horse) {
    instanced("pier-carousel-horses", horse, craneWhiteMaterial, horses);
  }
}

function addFerrisWheel(x: number, z: number) {
  const radius = 22;
  const hubY = deckY + radius + 3;
  const rim = new THREE.TorusGeometry(radius, 0.45, 8, 56);
  rim.translate(x, hubY, z);
  const innerRim = new THREE.TorusGeometry(radius - 2.4, 0.22, 6, 56);
  innerRim.translate(x, hubY, z);
  const hub = new THREE.CylinderGeometry(1.8, 1.8, 5, 16);
  hub.rotateX(Math.PI / 2);
  hub.translate(x, hubY, z);
  const spokes: THREE.BufferGeometry[] = [];
  const gondolas: THREE.Matrix4[] = [];
  for (let index = 0; index < 18; index += 1) {
    const angle = (index / 18) * Math.PI * 2;
    const rx = x + Math.cos(angle) * radius;
    const ry = hubY + Math.sin(angle) * radius;
    for (const dz of [-2.1, 2.1]) {
      spokes.push(boxBetween({ x, y: hubY, z: z + dz }, { x: rx, y: ry, z: z + dz }, 0.22, 0.22, 0));
    }
    gondolas.push(new THREE.Matrix4().makeTranslation(rx, ry - 1.6, z));
  }
  addMerged("pier-ferris-wheel-rim", [rim, innerRim, hub], attractionRedMaterial);
  addMerged("pier-ferris-wheel-spokes", spokes, steelDarkMaterial, false);
  const gondola = mergeAll([
    (() => { const g = new THREE.BoxGeometry(1.9, 1.9, 1.6); g.translate(0, 0, 0); return g; })(),
    (() => { const g = new THREE.BoxGeometry(0.12, 1.4, 0.12); g.translate(0, 1.55, 0); return g; })(),
  ]);
  if (gondola) {
    instanced("pier-ferris-wheel-gondolas", gondola, attractionBlueMaterial, gondolas);
  }
  const supports: THREE.BufferGeometry[] = [];
  for (const dz of [-3.2, 3.2]) {
    for (const dx of [-16, 16]) {
      supports.push(boxBetween({ x: x + dx, y: deckY, z: z + dz }, { x, y: hubY, z: z + dz }, 0.9, 0.9, 0));
    }
    supports.push(boxAt(34, 0.8, 1.6, x, deckY, z + dz));
  }
  supports.push(boxBetween({ x, y: hubY, z: z - 3.6 }, { x, y: hubY, z: z + 3.6 }, 1.2, 1.2, 0));
  addMerged("pier-ferris-wheel-supports", supports, craneWhiteMaterial);
}

function addRollerCoaster(x0: number, x1: number, z0: number, z1: number) {
  const cx = (x0 + x1) * 0.5;
  const cz = (z0 + z1) * 0.5;
  const halfX = (x1 - x0) * 0.5 - 6;
  const halfZ = (z1 - z0) * 0.5 - 6;
  const points = [
    new THREE.Vector3(cx - halfX, deckY + 3.5, cz + halfZ * 0.2),
    new THREE.Vector3(cx - halfX * 0.6, deckY + 8, cz + halfZ),
    new THREE.Vector3(cx, deckY + 16, cz + halfZ * 0.95),
    new THREE.Vector3(cx + halfX * 0.55, deckY + 21, cz + halfZ * 0.7),
    new THREE.Vector3(cx + halfX, deckY + 19, cz + halfZ * 0.1),
    new THREE.Vector3(cx + halfX * 0.8, deckY + 7, cz - halfZ * 0.5),
    new THREE.Vector3(cx + halfX * 0.3, deckY + 5, cz - halfZ),
    new THREE.Vector3(cx - halfX * 0.3, deckY + 12, cz - halfZ * 0.85),
    new THREE.Vector3(cx - halfX * 0.75, deckY + 6, cz - halfZ * 0.3),
  ];
  const curve = new THREE.CatmullRomCurve3(points, true, "centripetal", 0.6);
  const track = new THREE.TubeGeometry(curve, 220, 0.42, 8, true);
  addMerged("pier-coaster-track", [track], attractionYellowMaterial);
  const length = curve.getLength();
  const ties: THREE.Matrix4[] = [];
  const supports: THREE.BufferGeometry[] = [];
  const forward = new THREE.Vector3(0, 0, 1);
  const tieCount = Math.floor(length / 2.6);
  for (let index = 0; index < tieCount; index += 1) {
    const t = index / tieCount;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const flat = new THREE.Vector3(tangent.x, 0, tangent.z).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(forward, flat);
    ties.push(new THREE.Matrix4().compose(new THREE.Vector3(point.x, point.y - 0.5, point.z), quaternion, new THREE.Vector3(1, 1, 1)));
  }
  instanced("pier-coaster-ties", new THREE.BoxGeometry(2.4, 0.16, 0.5), steelDarkMaterial, ties, false);
  const supportCount = Math.floor(length / 6.5);
  for (let index = 0; index < supportCount; index += 1) {
    const point = curve.getPointAt(index / supportCount);
    if (point.y - deckY < 2.2) {
      continue;
    }
    supports.push(boxBetween({ x: point.x, y: deckY, z: point.z }, { x: point.x, y: point.y - 0.6, z: point.z }, 0.35, 0.35, 0));
    if (point.y - deckY > 9) {
      supports.push(boxBetween({ x: point.x - 2.2, y: deckY, z: point.z }, { x: point.x, y: point.y - 4, z: point.z }, 0.22, 0.22, 0));
      supports.push(boxBetween({ x: point.x + 2.2, y: deckY, z: point.z }, { x: point.x, y: point.y - 4, z: point.z }, 0.22, 0.22, 0));
    }
  }
  addMerged("pier-coaster-supports", supports, craneWhiteMaterial);
  const cars: THREE.Matrix4[] = [];
  for (let index = 0; index < 4; index += 1) {
    const t = 0.26 + index * 0.012;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(forward, tangent.clone().normalize());
    cars.push(new THREE.Matrix4().compose(new THREE.Vector3(point.x, point.y + 0.55, point.z), quaternion, new THREE.Vector3(1, 1, 1)));
  }
  instanced("pier-coaster-train", new THREE.BoxGeometry(1.6, 1.1, 2.8), attractionRedMaterial, cars);
  const stationPoint = curve.getPointAt(0.02);
  addMerged("pier-coaster-station", [boxAt(14, 0.9, 5, stationPoint.x + 4, deckY, stationPoint.z + 3.2)], woodPierMaterial);
  addMerged("pier-coaster-station-canopy", [boxAt(14, 0.25, 6, stationPoint.x + 4, deckY + 4.3, stationPoint.z + 3.2)], attractionBlueMaterial);
  const posts: THREE.BufferGeometry[] = [];
  for (const dx of [-6, 6]) {
    for (const dz of [-2.6, 2.6]) {
      posts.push(boxAt(0.2, 4.3, 0.2, stationPoint.x + 4 + dx, deckY, stationPoint.z + 3.2 + dz));
    }
  }
  addMerged("pier-coaster-station-posts", posts, guardrailMaterial);
}

function addArcade(x: number, z: number) {
  addMerged("pier-arcade-walls", [boxAt(34, 6.5, 14, x, deckY, z)], craneWhiteMaterial);
  const roof = new THREE.CylinderGeometry(7.2, 7.2, 34.6, 24, 1, false, 0, Math.PI);
  roof.rotateZ(Math.PI / 2);
  roof.rotateY(Math.PI / 2);
  roof.translate(x, deckY + 6.5, z);
  addMerged("pier-arcade-roof", [roof], attractionBlueMaterial);
  addMerged("pier-arcade-sign", [boxAt(12, 1.6, 0.3, x, deckY + 6.8, z + 7.2)], attractionYellowMaterial, false);
  const glass: THREE.BufferGeometry[] = [];
  for (let dx = -14; dx <= 14; dx += 7) {
    glass.push(boxAt(4.4, 3.2, 0.1, x + dx, deckY + 1.2, z + 7.05));
  }
  addMerged("pier-arcade-glass", glass, shelterGlassMaterial, false);
}

function addPierFurniture(x0: number, x1: number, z0: number, z1: number) {
  const poles: THREE.BufferGeometry[] = [];
  const heads: THREE.BufferGeometry[] = [];
  const flags: THREE.BufferGeometry[] = [];
  const benches: THREE.BufferGeometry[] = [];
  for (let x = x0 + 30; x < x1 - 20; x += 26) {
    for (const z of [z0 + 5, z1 - 5]) {
      const pole = new THREE.CylinderGeometry(0.07, 0.11, 4.8, 8);
      pole.translate(x, deckY + 2.4, z);
      poles.push(pole);
      const head = new THREE.SphereGeometry(0.34, 10, 8);
      head.translate(x, deckY + 5.2, z);
      heads.push(head);
    }
  }
  for (let x = x0 + 45; x < x1 - 30; x += 52) {
    for (const z of [z0 + 2.5, z1 - 2.5]) {
      const mast = new THREE.CylinderGeometry(0.06, 0.09, 7, 6);
      mast.translate(x, deckY + 3.5, z);
      poles.push(mast);
      flags.push(boxAt(1.4, 0.8, 0.04, x + 0.7, deckY + 6.1, z));
    }
  }
  for (let x = x0 + 40; x < x1 - 24; x += 34) {
    for (const z of [z0 + 8, z1 - 8]) {
      benches.push(boxAt(1.8, 0.08, 0.5, x, deckY + 0.46, z));
      benches.push(boxAt(1.8, 0.4, 0.06, x, deckY + 0.5, z + (z < (z0 + z1) * 0.5 ? -0.24 : 0.24)));
    }
  }
  addMerged("pier-lamp-poles", poles, lampPoleMaterial);
  addMerged("pier-lamp-heads", heads, lampHeadMaterial, false);
  addMerged("pier-flags", flags, beachFlagMaterial, false);
  addMerged("pier-benches", benches, dockMaterial);
}

export function addPierAmusements(centreX: number, centreZ: number) {
  const x0 = centreX - ATTRACTION_PIER_LENGTH_M * 0.5;
  const x1 = centreX + ATTRACTION_PIER_LENGTH_M * 0.5;
  const z0 = centreZ - ATTRACTION_PIER_DEPTH_M * 0.5;
  const z1 = centreZ + ATTRACTION_PIER_DEPTH_M * 0.5;
  addEntrance(x0 + 12, centreZ);
  addStalls(x0 + 34, centreZ, 8);
  addArcade(x0 + 150, z0 + 12);
  addCarousel(x0 + 150, z1 - 20);
  addFerrisWheel(x0 + 205, centreZ);
  addRollerCoaster(x0 + 236, x1 - 6, z0 + 6, z1 - 6);
  addPierFurniture(x0, x1, z0, z1);
  batch.commit();
}
