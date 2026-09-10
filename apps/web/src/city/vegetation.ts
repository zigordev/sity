import * as THREE from "three";
import { RIVER_WIDTH_M, WESTERN_COUNTRY_SPLIT_Z_M } from "../config/constants";
import { distanceToPath2D } from "../geometry/helpers";
import { mergeAll } from "../roads/geometry";
import { fullTerrainSurfaceYAt, groundSurfaceYAt, isInsideReservoirFootprint, mountainHeightAt, snowMountainHeightAt, terrainMicroNoise } from "../natural/terrain";
import { vegetationElements } from "../render/context";
import { roadSideSlots } from "../roads/render";
import { corridorClearance } from "../world/occupancy";
import { mainBoundaryMaxX, mainBoundaryMaxZ, mainBoundaryMinX, mainBoundaryMinZ, riverPath } from "../world/frame";
import { DISTRICTS, SPECIAL_BLOCKS } from "./districts";
import { RASTER_SPECIAL, isNaturalKeepOut, rasterValueAt, type Lot } from "./lots";
import { createRandom, hash2 } from "./random";

export type TreeKind = "broadleaf" | "conifer" | "palm" | "pine";

interface TreePlacement {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation: number;
  tint: number;
}

const placements: Record<TreeKind, TreePlacement[]> = { broadleaf: [], conifer: [], palm: [], pine: [] };

const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x6b4f35, roughness: 0.95, metalness: 0 });
const broadleafMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0 });
const coniferMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0 });
const palmMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0, side: THREE.DoubleSide });

const BROADLEAF_TINTS = [0x4f8a3c, 0x5c9a44, 0x477f38, 0x6aa04c, 0x3f7a35, 0x7aa551];
const CONIFER_TINTS = [0x2f5e34, 0x35683a, 0x2a5530, 0x3b7040, 0x2c5f38];
const PALM_TINTS = [0x5f9b3f, 0x6ba846, 0x559439];
const PINE_TINTS = [0x2b5432, 0x33613a, 0x264c2d, 0x3a6b3f, 0x2f5a35, 0x1f4527];

export function addTree(kind: TreeKind, x: number, z: number, y: number, scale = 1, seed = 0) {
  const tints = kind === "broadleaf" ? BROADLEAF_TINTS : kind === "conifer" ? CONIFER_TINTS : kind === "pine" ? PINE_TINTS : PALM_TINTS;
  const h = hash2(x, z, seed);
  placements[kind].push({ x, y, z, scale, rotation: h * Math.PI * 2, tint: tints[Math.floor(h * tints.length) % tints.length] });
}

function createBroadleafCanopy() {
  const parts: THREE.BufferGeometry[] = [];
  const lower = new THREE.IcosahedronGeometry(2.7, 1);
  lower.scale(1.15, 0.95, 1.05);
  lower.translate(0, 5.4, 0);
  parts.push(lower);
  const upper = new THREE.IcosahedronGeometry(2.0, 1);
  upper.translate(0.6, 7.3, -0.3);
  parts.push(upper);
  const side = new THREE.IcosahedronGeometry(1.7, 1);
  side.translate(-1.5, 6.1, 1.0);
  parts.push(side);
  return mergeAll(parts) ?? lower;
}

function createPineCanopy() {
  const parts: THREE.BufferGeometry[] = [];
  const lower = new THREE.ConeGeometry(2.4, 5.6, 6);
  lower.translate(0, 4.4, 0);
  parts.push(lower);
  const upper = new THREE.ConeGeometry(1.5, 4.2, 6);
  upper.translate(0, 8.0, 0);
  parts.push(upper);
  return mergeAll(parts) ?? lower;
}

function createConiferCanopy() {
  const parts: THREE.BufferGeometry[] = [];
  const tiers = [
    { radius: 2.6, height: 4.2, y: 3.2 },
    { radius: 2.0, height: 3.6, y: 5.6 },
    { radius: 1.3, height: 3.2, y: 7.8 },
  ];
  for (const tier of tiers) {
    const cone = new THREE.ConeGeometry(tier.radius, tier.height, 7);
    cone.translate(0, tier.y + tier.height * 0.5, 0);
    parts.push(cone);
  }
  return mergeAll(parts) ?? parts[0];
}

function createPalmFronds() {
  const parts: THREE.BufferGeometry[] = [];
  for (let index = 0; index < 7; index += 1) {
    const frond = new THREE.PlaneGeometry(0.9, 4.2, 1, 3);
    const position = frond.getAttribute("position");
    for (let vertex = 0; vertex < position.count; vertex += 1) {
      const py = position.getY(vertex);
      const t = (py + 2.1) / 4.2;
      position.setZ(vertex, -Math.pow(t, 2) * 1.8);
      position.setX(vertex, position.getX(vertex) * (1 - t * 0.6));
    }
    frond.rotateX(-Math.PI * 0.5 + 0.5);
    frond.translate(0, 0, 2.1);
    frond.rotateY((index / 7) * Math.PI * 2);
    frond.translate(0, 8.6, 0);
    parts.push(frond);
  }
  return mergeAll(parts) ?? parts[0];
}

function commitKind(kind: TreeKind, canopy: THREE.BufferGeometry, canopyMaterial: THREE.Material, trunk: THREE.BufferGeometry) {
  const list = placements[kind];
  if (list.length === 0) {
    return;
  }
  const canopyMesh = new THREE.InstancedMesh(canopy, canopyMaterial, list.length);
  const trunkMesh = new THREE.InstancedMesh(trunk, trunkMaterial, list.length);
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const color = new THREE.Color();
  list.forEach((placement, index) => {
    position.set(placement.x, placement.y, placement.z);
    quaternion.setFromAxisAngle(yAxis, placement.rotation);
    scale.set(placement.scale, placement.scale, placement.scale);
    matrix.compose(position, quaternion, scale);
    canopyMesh.setMatrixAt(index, matrix);
    trunkMesh.setMatrixAt(index, matrix);
    canopyMesh.setColorAt(index, color.setHex(placement.tint));
  });
  canopyMesh.instanceMatrix.needsUpdate = true;
  trunkMesh.instanceMatrix.needsUpdate = true;
  canopyMesh.name = `trees-${kind}-canopy`;
  trunkMesh.name = `trees-${kind}-trunks`;
  canopyMesh.castShadow = true;
  canopyMesh.receiveShadow = true;
  trunkMesh.castShadow = true;
  vegetationElements.add(canopyMesh);
  vegetationElements.add(trunkMesh);
}

export function commitTrees() {
  const broadleafTrunk = new THREE.CylinderGeometry(0.22, 0.36, 4.2, 6);
  broadleafTrunk.translate(0, 2.1, 0);
  const coniferTrunk = new THREE.CylinderGeometry(0.18, 0.3, 3.6, 6);
  coniferTrunk.translate(0, 1.8, 0);
  const palmTrunk = new THREE.CylinderGeometry(0.22, 0.34, 8.8, 7);
  palmTrunk.translate(0, 4.4, 0);
  commitKind("broadleaf", createBroadleafCanopy(), broadleafMaterial, broadleafTrunk);
  commitKind("conifer", createConiferCanopy(), coniferMaterial, coniferTrunk);
  commitKind("palm", createPalmFronds(), palmMaterial, palmTrunk);
  const pineTrunk = new THREE.CylinderGeometry(0.16, 0.26, 3.0, 5);
  pineTrunk.translate(0, 1.5, 0);
  commitKind("pine", createPineCanopy(), coniferMaterial, pineTrunk);
  return placements.broadleaf.length + placements.conifer.length + placements.palm.length + placements.pine.length;
}

function insideAnyDistrict(x: number, z: number) {
  return DISTRICTS.some((district) => x >= district.minX && x <= district.maxX && z >= district.minZ && z <= district.maxZ);
}

export function placeStreetTrees() {
  const random = createRandom(311);
  for (const slot of roadSideSlots.streetTrees) {
    if (rasterValueAt(slot.x, slot.z) === RASTER_SPECIAL) {
      continue;
    }
    addTree("broadleaf", slot.x, slot.z, slot.y, 0.75 + random() * 0.35, 1);
  }
  for (const slot of roadSideSlots.medianTrees) {
    const coastal = slot.x > 700;
    addTree(coastal ? "palm" : "broadleaf", slot.x, slot.z, slot.y, coastal ? 0.9 + random() * 0.3 : 0.6 + random() * 0.3, 2);
  }
}

export function placeParkTrees(minX: number, maxX: number, minZ: number, maxZ: number, spacing: number, seed: number, kind: TreeKind = "broadleaf", keepOut?: (x: number, z: number) => boolean) {
  const random = createRandom(seed);
  for (let z = minZ + spacing * 0.5; z < maxZ; z += spacing) {
    for (let x = minX + spacing * 0.5; x < maxX; x += spacing) {
      const jx = x + (random() - 0.5) * spacing * 0.8;
      const jz = z + (random() - 0.5) * spacing * 0.8;
      if (jx < minX + 2 || jx > maxX - 2 || jz < minZ + 2 || jz > maxZ - 2) {
        continue;
      }
      if (keepOut && keepOut(jx, jz)) {
        continue;
      }
      addTree(kind, jx, jz, groundSurfaceYAt(jx, jz), 0.8 + random() * 0.5, seed);
    }
  }
}

export function placeGardenTrees(lots: Lot[]) {
  const random = createRandom(552);
  for (const lot of lots) {
    if (lot.district !== "residential" && lot.district !== "westend") {
      continue;
    }
    const treeCount = random() > 0.35 ? 1 : 2;
    for (let index = 0; index < treeCount; index += 1) {
      const along = (random() - 0.5) * (lot.width - 5);
      const back = lot.depth - 4 - random() * 5;
      const x = lot.front.x + lot.tangent.x * along + lot.inward.x * back;
      const z = lot.front.z + lot.tangent.z * along + lot.inward.z * back;
      addTree("broadleaf", x, z, groundSurfaceYAt(x, z), 0.55 + random() * 0.4, 3);
    }
  }
}

export function placeRiversideTrees() {
  const random = createRandom(881);
  for (let index = 2; index < riverPath.length - 3; index += 1) {
    const point = riverPath[index];
    const next = riverPath[index + 1];
    const tangent = { x: next.x - point.x, z: next.z - point.z };
    const length = Math.hypot(tangent.x, tangent.z) || 1;
    const normal = { x: -tangent.z / length, z: tangent.x / length };
    for (const side of [-1, 1]) {
      for (const offset of [RIVER_WIDTH_M * 0.5 + 58, RIVER_WIDTH_M * 0.5 + 76, RIVER_WIDTH_M * 0.5 + 96]) {
        if (random() > 0.62) {
          continue;
        }
        const x = point.x + normal.x * offset * side + (random() - 0.5) * 10;
        const z = point.z + normal.z * offset * side + (random() - 0.5) * 10;
        if (x < mainBoundaryMinX + 40 || x > 640 || corridorClearance(x, z) < 7 || rasterValueAt(x, z) !== 0) {
          continue;
        }
        if (fullTerrainSurfaceYAt({ x, z }) - 2 > 30) {
          continue;
        }
        addTree("broadleaf", x, z, groundSurfaceYAt(x, z), 0.8 + random() * 0.6, 4);
      }
    }
  }
}

export function placeForest() {
  const random = createRandom(1213);
  const spacing = 19;
  let count = 0;
  for (let z = mainBoundaryMinZ + 30; z < mainBoundaryMaxZ - 30; z += spacing) {
    for (let x = mainBoundaryMinX + 30; x < mainBoundaryMaxX - 200; x += spacing) {
      const jx = x + (random() - 0.5) * spacing;
      const jz = z + (random() - 0.5) * spacing;
      const snow = snowMountainHeightAt(jx, jz);
      const rock = mountainHeightAt(jx, jz);
      const height = Math.max(snow, rock);
      if (height < 9 || height > 190) {
        continue;
      }
      if (insideAnyDistrict(jx, jz) && height < 30) {
        continue;
      }
      if (corridorClearance(jx, jz) < 9 || rasterValueAt(jx, jz) !== 0 || isInsideReservoirFootprint({ x: jx, z: jz }, 1.5)) {
        continue;
      }
      if (distanceToPath2D({ x: jx, z: jz }, riverPath) < RIVER_WIDTH_M * 0.5 + 40) {
        continue;
      }
      const density = height < 40 ? 0.55 : height < 120 ? 0.85 : 0.5;
      if (random() > density) {
        continue;
      }
      const kind: TreeKind = height > 45 || random() > 0.7 ? "pine" : "broadleaf";
      addTree(kind, jx, jz, groundSurfaceYAt(jx, jz) - 0.3, 0.9 + random() * 0.7, 5);
      count += 1;
    }
  }
  return count;
}

export function placeWesternForest() {
  const random = createRandom(7331);
  const spacing = 12;
  let count = 0;
  const minX = mainBoundaryMinX + 20;
  const maxX = -1880;
  const maxZ = WESTERN_COUNTRY_SPLIT_Z_M + 60;
  for (let z = mainBoundaryMinZ + 20; z < maxZ; z += spacing) {
    for (let x = minX; x < maxX; x += spacing) {
      const jx = x + (random() - 0.5) * spacing;
      const jz = z + (random() - 0.5) * spacing;
      const edge = 1 - THREE.MathUtils.smoothstep(jz, WESTERN_COUNTRY_SPLIT_Z_M - 200, maxZ);
      const eastEdge = 1 - THREE.MathUtils.smoothstep(jx, -2050, -1880);
      const density = 0.88 * edge * eastEdge;
      if (random() > density) {
        continue;
      }
      if (insideAnyDistrict(jx, jz) || rasterValueAt(jx, jz) !== 0) {
        continue;
      }
      if (corridorClearance(jx, jz, 60) < 7) {
        continue;
      }
      const kind: TreeKind = random() > 0.12 ? "pine" : "broadleaf";
      addTree(kind, jx, jz, groundSurfaceYAt(jx, jz) + terrainMicroNoise(jx, jz) - 0.25, 0.85 + random() * 0.6, 7);
      count += 1;
    }
  }
  return count;
}

export function placeCoastPalms() {
  const random = createRandom(77);
  for (let z = 250; z < 720; z += 11) {
    const x = 772 + (random() - 0.5) * 2;
    addTree("palm", x, z, groundSurfaceYAt(x, z) + 0.1, 0.85 + random() * 0.35, 6);
  }
  for (let z = -540; z < -110; z += 14) {
    const x = 776 + (random() - 0.5) * 3;
    if (corridorClearance(x, z) < 3) {
      continue;
    }
    addTree("palm", x, z, groundSurfaceYAt(x, z) + 0.1, 0.8 + random() * 0.3, 8);
  }
}

export function placeSpecialBlockTrees() {
  for (const block of SPECIAL_BLOCKS) {
    if (block.kind === "park") {
      placeParkTrees(block.minX, block.maxX, block.minZ, block.maxZ, 13, 61, "broadleaf", (x, z) => Math.abs((x - block.minX) - (z - block.minZ) * ((block.maxX - block.minX) / (block.maxZ - block.minZ))) < 4);
    }
  }
}

export function placeLowlandMeadowTrees() {
  const random = createRandom(4242);
  const spacing = 34;
  for (let z = mainBoundaryMinZ + 60; z < mainBoundaryMaxZ - 60; z += spacing) {
    for (let x = mainBoundaryMinX + 60; x < mainBoundaryMaxX - 190; x += spacing) {
      const jx = x + (random() - 0.5) * spacing;
      const jz = z + (random() - 0.5) * spacing;
      if (insideAnyDistrict(jx, jz) || isNaturalKeepOut(jx, jz) || rasterValueAt(jx, jz) !== 0) {
        continue;
      }
      if (corridorClearance(jx, jz) < 12) {
        continue;
      }
      const height = Math.max(snowMountainHeightAt(jx, jz), mountainHeightAt(jx, jz));
      if (height > 9) {
        continue;
      }
      if (random() > 0.32) {
        continue;
      }
      addTree("broadleaf", jx, jz, groundSurfaceYAt(jx, jz), 0.9 + random() * 0.6, 9);
    }
  }
}
