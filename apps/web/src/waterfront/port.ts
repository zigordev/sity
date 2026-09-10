import * as THREE from "three";
import { CARGO_BOLLARD_COUNT, CARGO_PORT_DEPTH_M, PLATFORM_SURFACE_Y } from "../config/constants";
import { addCylinderInstances } from "../geometry/helpers";
import { artificialElements } from "../render/context";
import {
  cargoContainerMaterials,
  craneBlueMaterial,
  craneWhiteMaterial,
  dockMaterial,
  fenceMeshMaterial,
  guardrailMaterial,
  lampHeadMaterial,
  lampPoleMaterial,
  portCraneMaterial,
  roadMarkingWhiteMaterial,
  roadMarkingYellowMaterial,
  roadStructureConcreteMaterial,
  rollerDoorMaterial,
  shelterGlassMaterial,
  steelDarkMaterial,
  truckCabMaterials,
  truckChassisMaterial,
  warehouseWallMaterial,
} from "../render/materials";
import { boxBetween, mergeAll } from "../roads/geometry";

export interface PortFrame {
  westEdge: number;
  eastEdge: number;
  northEdge: number;
  southEdge: number;
  gateZ: number;
  gateHalfWidth: number;
}

export const CONTAINER_LENGTH_M = 12.2;
export const CONTAINER_WIDTH_M = 2.44;
export const CONTAINER_HEIGHT_M = 2.6;
const CONTAINER_ROW_PITCH_M = 3.0;
const CONTAINER_SLOT_PITCH_M = 12.9;
const YARD_ROWS_PER_BLOCK = 6;
const YARD_BLOCK_PITCH_M = 32;

const surfaceY = PLATFORM_SURFACE_Y;

function hash(a: number, b: number) {
  const value = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function addMerged(name: string, parts: THREE.BufferGeometry[], material: THREE.Material, castShadow = true) {
  const merged = mergeAll(parts);
  if (!merged) {
    return;
  }
  const mesh = new THREE.Mesh(merged, material);
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

function containerMatrix(x: number, y: number, z: number, rotationY: number) {
  const matrix = new THREE.Matrix4();
  matrix.compose(
    new THREE.Vector3(x, y + CONTAINER_HEIGHT_M * 0.5, z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationY),
    new THREE.Vector3(1, 1, 1),
  );
  return matrix;
}

function yardBlockCentres(frame: PortFrame, yardEast: number) {
  const centres: number[] = [];
  const first = frame.westEdge + 46 + YARD_BLOCK_PITCH_M * 0.5;
  for (let x = first; x + YARD_BLOCK_PITCH_M * 0.5 <= yardEast; x += YARD_BLOCK_PITCH_M) {
    centres.push(x);
  }
  return centres;
}

function addContainerYard(frame: PortFrame, yardEast: number, yardNorth: number, yardSouth: number) {
  const byMaterial: THREE.Matrix4[][] = cargoContainerMaterials.map(() => []);
  const blockCentres = yardBlockCentres(frame, yardEast);
  const slots = Math.floor((yardNorth - yardSouth) / CONTAINER_SLOT_PITCH_M);
  const firstSlotZ = yardSouth + ((yardNorth - yardSouth) - slots * CONTAINER_SLOT_PITCH_M) * 0.5 + CONTAINER_SLOT_PITCH_M * 0.5;
  blockCentres.forEach((centreX, blockIndex) => {
    for (let row = 0; row < YARD_ROWS_PER_BLOCK; row += 1) {
      const x = centreX + (row - (YARD_ROWS_PER_BLOCK - 1) * 0.5) * CONTAINER_ROW_PITCH_M;
      for (let slot = 0; slot < slots; slot += 1) {
        const z = firstSlotZ + slot * CONTAINER_SLOT_PITCH_M;
        const seed = hash(blockIndex * 31 + row, slot);
        if (seed < 0.12) {
          continue;
        }
        const stack = seed < 0.3 ? 1 : seed < 0.62 ? 2 : seed < 0.88 ? 3 : 4;
        for (let level = 0; level < stack; level += 1) {
          const materialIndex = Math.floor(hash(slot * 7 + level, row * 13 + blockIndex) * byMaterial.length) % byMaterial.length;
          byMaterial[materialIndex].push(containerMatrix(x, surfaceY + level * CONTAINER_HEIGHT_M, z, 0));
        }
      }
    }
  });
  const geometry = new THREE.BoxGeometry(CONTAINER_WIDTH_M, CONTAINER_HEIGHT_M, CONTAINER_LENGTH_M);
  byMaterial.forEach((matrices, index) => {
    instanced(`cargo-container-stacks-${index + 1}`, geometry, cargoContainerMaterials[index], matrices);
  });
  return blockCentres;
}

function addShipToShoreCranes(frame: PortFrame, craneZs: number[]) {
  const yellow: THREE.BufferGeometry[] = [];
  const white: THREE.BufferGeometry[] = [];
  const dark: THREE.BufferGeometry[] = [];
  const glass: THREE.BufferGeometry[] = [];
  const lifted: THREE.Matrix4[] = [];
  const waterLegX = frame.eastEdge - 10;
  const landLegX = frame.eastEdge - 30;
  const legHeight = 44;
  const gauge = 9;

  for (const railX of [waterLegX, landLegX]) {
    dark.push(boxAt(0.3, 0.16, frame.northEdge - frame.southEdge - 40, railX, surfaceY, (frame.northEdge + frame.southEdge) * 0.5));
  }

  craneZs.forEach((z, index) => {
    for (const legX of [waterLegX, landLegX]) {
      for (const side of [-1, 1]) {
        yellow.push(boxAt(2.2, legHeight, 2.2, legX, surfaceY, z + side * gauge));
        dark.push(boxAt(3.2, 1.6, 6, legX, surfaceY, z + side * gauge));
      }
      yellow.push(boxAt(2, 2, gauge * 2 + 2.2, legX, surfaceY + 18, z));
      yellow.push(boxAt(2, 2, gauge * 2 + 2.2, legX, surfaceY + legHeight - 2, z));
    }
    for (const side of [-1, 1]) {
      yellow.push(boxAt(landLegX - waterLegX + 2.2, 2, 2, (waterLegX + landLegX) * 0.5, surfaceY + 18, z + side * gauge));
      yellow.push(boxAt(landLegX - waterLegX + 2.2, 2, 2, (waterLegX + landLegX) * 0.5, surfaceY + legHeight - 2, z + side * gauge));
    }
    const boomY = surfaceY + legHeight + 1.5;
    const boomTip = frame.eastEdge + 42;
    const backreach = landLegX - 18;
    for (const side of [-1, 1]) {
      yellow.push(boxAt(boomTip - backreach, 2.4, 1.2, (boomTip + backreach) * 0.5, boomY, z + side * 3.2));
    }
    for (let x = backreach + 6; x < boomTip - 4; x += 8) {
      yellow.push(boxAt(0.8, 2.4, 6.4, x, boomY, z));
    }
    const apexY = boomY + 16;
    const apexX = landLegX + 4;
    yellow.push(boxAt(2.4, 16, 2.4, apexX, boomY + 2.4, z));
    yellow.push(boxBetween({ x: apexX, y: apexY, z }, { x: boomTip - 2, y: boomY + 2.4, z }, 0.5, 0.5));
    yellow.push(boxBetween({ x: apexX, y: apexY, z }, { x: backreach + 2, y: boomY + 2.4, z }, 0.5, 0.5));
    white.push(boxAt(11, 4.2, 9, landLegX - 4, boomY + 2.4, z));
    const trolleyX = index === 1 ? frame.eastEdge + 14 : frame.eastEdge - 2;
    yellow.push(boxAt(5, 1.6, 8.6, trolleyX, boomY - 1.6, z));
    glass.push(boxAt(3.4, 2.2, 3.4, trolleyX + 1, boomY - 4.2, z + 5.2));
    const hookY = index === 1 ? surfaceY + 22 : surfaceY + 8;
    for (const dz of [-2.6, 2.6]) {
      dark.push(boxAt(0.12, boomY - 1.6 - hookY, 0.12, trolleyX + dz, hookY, z + dz));
    }
    dark.push(boxAt(CONTAINER_LENGTH_M + 0.4, 0.8, CONTAINER_WIDTH_M + 0.4, trolleyX, hookY - 0.8, z));
    lifted.push(containerMatrix(trolleyX, hookY - 0.8 - CONTAINER_HEIGHT_M, z, Math.PI * 0.5));
  });

  addMerged("port-ship-to-shore-cranes", yellow, portCraneMaterial);
  addMerged("port-crane-machinery-houses", white, craneWhiteMaterial);
  addMerged("port-crane-rails-and-rigging", dark, steelDarkMaterial);
  addMerged("port-crane-cabins", glass, shelterGlassMaterial, false);
  instanced("port-lifted-containers", new THREE.BoxGeometry(CONTAINER_LENGTH_M, CONTAINER_HEIGHT_M, CONTAINER_WIDTH_M), cargoContainerMaterials[1], lifted);
}

function addYardGantries(blockCentres: number[], positions: Array<{ block: number; z: number }>) {
  const blue: THREE.BufferGeometry[] = [];
  const dark: THREE.BufferGeometry[] = [];
  const span = YARD_ROWS_PER_BLOCK * CONTAINER_ROW_PITCH_M + 5;
  for (const position of positions) {
    const centreX = blockCentres[Math.min(position.block, blockCentres.length - 1)];
    const z = position.z;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        blue.push(boxAt(1.3, 16, 1.3, centreX + sx * span * 0.5, surfaceY + 1.1, z + sz * 6));
        const wheel = new THREE.CylinderGeometry(0.75, 0.75, 1.1, 12);
        wheel.rotateZ(Math.PI / 2);
        wheel.translate(centreX + sx * span * 0.5, surfaceY + 0.75, z + sz * 6);
        dark.push(wheel);
      }
      blue.push(boxAt(1.4, 1.4, 14, centreX + sx * span * 0.5, surfaceY + 16.4, z));
    }
    for (const sz of [-1, 1]) {
      blue.push(boxAt(span + 1.4, 1.6, 1.6, centreX, surfaceY + 16.6, z + sz * 6));
    }
    blue.push(boxAt(4, 1.4, 13, centreX - 4, surfaceY + 18.2, z));
    dark.push(boxAt(CONTAINER_WIDTH_M + 0.3, 0.6, CONTAINER_LENGTH_M + 0.3, centreX - 4, surfaceY + 12.6, z));
  }
  addMerged("port-yard-gantry-cranes", blue, craneBlueMaterial);
  addMerged("port-yard-gantry-wheels", dark, steelDarkMaterial);
}

function addTrucks(placements: Array<{ x: number; z: number; heading: number; loaded: boolean; colour: number }>) {
  const cabs: THREE.Matrix4[][] = truckCabMaterials.map(() => []);
  const chassis: THREE.Matrix4[] = [];
  const loads: THREE.Matrix4[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (const placement of placements) {
    const rotation = new THREE.Quaternion().setFromAxisAngle(up, placement.heading);
    const forward = new THREE.Vector3(Math.sin(placement.heading), 0, Math.cos(placement.heading));
    const cab = new THREE.Matrix4().compose(
      new THREE.Vector3(placement.x, surfaceY + 1.1 + 1.45, placement.z).addScaledVector(forward, 7.2),
      rotation,
      new THREE.Vector3(1, 1, 1),
    );
    cabs[placement.colour % cabs.length].push(cab);
    chassis.push(new THREE.Matrix4().compose(new THREE.Vector3(placement.x, surfaceY + 0.55, placement.z), rotation, new THREE.Vector3(1, 1, 1)));
    if (placement.loaded) {
      loads.push(containerMatrix(placement.x, surfaceY + 1.1, placement.z, placement.heading));
    }
  }
  const cabGeometry = new THREE.BoxGeometry(2.5, 2.9, 2.6);
  cabs.forEach((matrices, index) => instanced(`port-truck-cabs-${index + 1}`, cabGeometry, truckCabMaterials[index], matrices));
  const chassisParts: THREE.BufferGeometry[] = [boxAt(2.5, 0.7, 16.2, 0, 0, 0.6)];
  for (const dz of [-6.2, -4.6, 2.6, 7.6]) {
    const axle = new THREE.CylinderGeometry(0.52, 0.52, 2.6, 10);
    axle.rotateZ(Math.PI / 2);
    axle.translate(0, -0.15, dz);
    chassisParts.push(axle);
  }
  instanced("port-truck-chassis", mergeAll(chassisParts) ?? chassisParts[0], truckChassisMaterial, chassis);
  instanced("port-truck-loads", new THREE.BoxGeometry(CONTAINER_WIDTH_M, CONTAINER_HEIGHT_M, CONTAINER_LENGTH_M), cargoContainerMaterials[3], loads);
}

function addLightMasts(points: Array<{ x: number; z: number }>) {
  const poles: THREE.BufferGeometry[] = [];
  const heads: THREE.BufferGeometry[] = [];
  for (const point of points) {
    const pole = new THREE.CylinderGeometry(0.28, 0.5, 30, 10);
    pole.translate(point.x, surfaceY + 15, point.z);
    poles.push(pole);
    poles.push(boxAt(3.2, 0.3, 3.2, point.x, surfaceY + 29.6, point.z));
    for (const [dx, dz] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]]) {
      heads.push(boxAt(0.9, 0.5, 0.9, point.x + dx, surfaceY + 29.9, point.z + dz));
    }
  }
  addMerged("port-light-masts", poles, lampPoleMaterial);
  addMerged("port-light-mast-heads", heads, lampHeadMaterial, false);
}

function addTransitShed(x0: number, x1: number, z0: number, z1: number) {
  const walls: THREE.BufferGeometry[] = [];
  const doors: THREE.BufferGeometry[] = [];
  const width = x1 - x0;
  const depth = z1 - z0;
  const cx = (x0 + x1) * 0.5;
  const cz = (z0 + z1) * 0.5;
  walls.push(boxAt(width, 9.5, depth, cx, surfaceY, cz));
  walls.push(boxAt(width + 1.2, 0.6, depth + 1.2, cx, surfaceY + 9.5, cz));
  for (let x = x0 + 9; x < x1 - 6; x += 14) {
    doors.push(boxAt(6.5, 5.2, 0.3, x, surfaceY + 0.05, z1 + 0.1));
    doors.push(boxAt(6.5, 5.2, 0.3, x, surfaceY + 0.05, z0 - 0.1));
  }
  walls.push(boxAt(width * 0.4, 3.2, 6, cx, surfaceY + 10.1, cz));
  addMerged("port-transit-shed", walls, warehouseWallMaterial);
  addMerged("port-transit-shed-doors", doors, rollerDoorMaterial, false);
}

function addPerimeterFence(frame: PortFrame, landEdge: number) {
  const posts: THREE.BufferGeometry[] = [];
  const mesh: THREE.BufferGeometry[] = [];
  const runs: Array<[{ x: number; z: number }, { x: number; z: number }]> = [
    [{ x: frame.westEdge + 1.2, z: frame.southEdge + 1 }, { x: frame.westEdge + 1.2, z: frame.gateZ - frame.gateHalfWidth }],
    [{ x: frame.westEdge + 1.2, z: frame.gateZ + frame.gateHalfWidth }, { x: frame.westEdge + 1.2, z: frame.northEdge - 1 }],
    [{ x: frame.westEdge + 1.2, z: frame.northEdge - 1 }, { x: landEdge, z: frame.northEdge - 1 }],
    [{ x: frame.westEdge + 1.2, z: frame.southEdge + 1 }, { x: landEdge, z: frame.southEdge + 1 }],
  ];
  for (const [a, b] of runs) {
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    const steps = Math.max(1, Math.round(length / 3));
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      posts.push(boxAt(0.12, 2.6, 0.12, a.x + (b.x - a.x) * t, surfaceY, a.z + (b.z - a.z) * t));
    }
    const from = { x: a.x, y: surfaceY, z: a.z };
    const to = { x: b.x, y: surfaceY, z: b.z };
    mesh.push(boxBetween(from, to, 0.04, 2.3, 0.2));
    posts.push(boxBetween(from, to, 0.07, 0.07, 2.5));
  }
  addMerged("port-perimeter-fence-posts", posts, guardrailMaterial);
  addMerged("port-perimeter-fence-mesh", mesh, fenceMeshMaterial, false);
}

function addApronMarkings(frame: PortFrame, blockCentres: number[], yardNorth: number, yardSouth: number) {
  const yellow: THREE.BufferGeometry[] = [];
  const white: THREE.BufferGeometry[] = [];
  const laneZ = frame.gateZ;
  const laneHalf = 4;
  const laneEnd = frame.eastEdge - 36;
  yellow.push(boxAt(laneEnd - frame.westEdge - 4, 0.02, 0.16, (laneEnd + frame.westEdge + 4) * 0.5, surfaceY + 0.01, laneZ - laneHalf));
  yellow.push(boxAt(laneEnd - frame.westEdge - 4, 0.02, 0.16, (laneEnd + frame.westEdge + 4) * 0.5, surfaceY + 0.01, laneZ + laneHalf));
  for (let x = frame.westEdge + 12; x < laneEnd; x += 9) {
    white.push(boxAt(3, 0.02, 0.14, x, surfaceY + 0.01, laneZ));
  }
  yellow.push(boxAt(0.18, 0.02, frame.northEdge - frame.southEdge - 30, frame.eastEdge - 34, surfaceY + 0.01, (frame.northEdge + frame.southEdge) * 0.5));
  for (const centre of blockCentres) {
    for (const side of [-1, 1]) {
      const x = centre + side * (YARD_ROWS_PER_BLOCK * CONTAINER_ROW_PITCH_M * 0.5 + 0.6);
      white.push(boxAt(0.14, 0.02, yardNorth - yardSouth, x, surfaceY + 0.01, (yardNorth + yardSouth) * 0.5));
    }
  }
  for (let z = frame.southEdge + 16; z < frame.northEdge - 16; z += 6) {
    yellow.push(boxAt(2.2, 0.02, 0.16, frame.eastEdge - 3.2, surfaceY + 0.01, z));
  }
  const hatchX0 = frame.westEdge + 4;
  for (let index = 0; index < 8; index += 1) {
    yellow.push(boxAt(10, 0.02, 0.18, hatchX0 + 6 + index * 1.6, surfaceY + 0.01, laneZ + laneHalf + 5));
  }
  addMerged("port-apron-markings-yellow", yellow, roadMarkingYellowMaterial, false);
  addMerged("port-apron-markings-white", white, roadMarkingWhiteMaterial, false);
}

function addQuayEdge(frame: PortFrame) {
  const kerb: THREE.BufferGeometry[] = [];
  kerb.push(boxAt(0.8, 0.5, frame.northEdge - frame.southEdge - 2, frame.eastEdge - 0.5, surfaceY, (frame.northEdge + frame.southEdge) * 0.5));
  addMerged("port-quay-edge-kerb", kerb, roadStructureConcreteMaterial);
  const bollards: Array<{ x: number; z: number }> = [];
  for (let index = 0; index < CARGO_BOLLARD_COUNT; index += 1) {
    const z = THREE.MathUtils.lerp(
      (frame.northEdge + frame.southEdge) * 0.5 - CARGO_PORT_DEPTH_M * 0.42,
      (frame.northEdge + frame.southEdge) * 0.5 + CARGO_PORT_DEPTH_M * 0.42,
      index / (CARGO_BOLLARD_COUNT - 1),
    );
    bollards.push({ x: frame.eastEdge - 3, z });
  }
  addCylinderInstances("cargo-port-bollards", 0.6, 1.1, dockMaterial, surfaceY + 1.1, bollards);
}

export function addCargoPortYard(frame: PortFrame, landEdge: number) {
  const yardEast = frame.eastEdge - 62;
  const yardNorth = frame.gateZ - 14;
  const yardSouth = frame.southEdge + 30;
  const blockCentres = addContainerYard(frame, yardEast, yardNorth, yardSouth);
  addShipToShoreCranes(frame, [frame.southEdge + 46, (frame.northEdge + frame.southEdge) * 0.5, frame.northEdge - 46]);
  addYardGantries(blockCentres, [
    { block: 1, z: yardSouth + 40 },
    { block: 4, z: yardNorth - 52 },
  ]);
  addTrucks([
    { x: frame.westEdge + 30, z: frame.gateZ - 2, heading: Math.PI * 0.5, loaded: true, colour: 0 },
    { x: frame.westEdge + 92, z: frame.gateZ - 2, heading: Math.PI * 0.5, loaded: false, colour: 1 },
    { x: frame.westEdge + 150, z: frame.gateZ + 2, heading: -Math.PI * 0.5, loaded: true, colour: 2 },
    { x: blockCentres[2] + YARD_BLOCK_PITCH_M * 0.5, z: yardSouth + 70, heading: 0, loaded: true, colour: 3 },
    { x: blockCentres[5] + YARD_BLOCK_PITCH_M * 0.5, z: yardNorth - 30, heading: Math.PI, loaded: false, colour: 0 },
    { x: frame.eastEdge - 44, z: frame.southEdge + 46, heading: 0, loaded: false, colour: 1 },
  ]);
  addLightMasts([
    { x: frame.westEdge + 40, z: yardSouth - 6 },
    { x: frame.westEdge + 40, z: yardNorth + 6 },
    { x: yardEast + 8, z: yardSouth - 6 },
    { x: yardEast + 8, z: yardNorth + 6 },
    { x: frame.eastEdge - 44, z: (frame.northEdge + frame.southEdge) * 0.5 },
  ]);
  addTransitShed(frame.westEdge + 44, frame.westEdge + 170, frame.southEdge + 6, frame.southEdge + 26);
  addPerimeterFence(frame, landEdge);
  addApronMarkings(frame, blockCentres, yardNorth, yardSouth);
  addQuayEdge(frame);
}
