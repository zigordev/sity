import * as THREE from "three";
import { vehicleElements } from "../render/context";
import { carGlassMaterial, carPaintMaterials, tyreMaterial } from "../render/materials";
import { mergeAll } from "../roads/geometry";
import { roadSideSlots, type OrientedSlot } from "../roads/render";

function hash(x: number, z: number) {
  const value = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function createBodyGeometry() {
  const lower = new THREE.BoxGeometry(1.78, 0.62, 4.3);
  lower.translate(0, 0.62, 0);
  const bonnet = new THREE.BoxGeometry(1.7, 0.16, 1.2);
  bonnet.translate(0, 0.98, 1.4);
  const boot = new THREE.BoxGeometry(1.7, 0.16, 0.9);
  boot.translate(0, 0.98, -1.6);
  return mergeAll([lower, bonnet, boot]) ?? lower;
}

function createCabinGeometry() {
  const cabin = new THREE.BoxGeometry(1.6, 0.6, 2.1);
  cabin.translate(0, 1.22, -0.25);
  return cabin;
}

function createWheelsGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  for (const dx of [-0.82, 0.82]) {
    for (const dz of [-1.35, 1.35]) {
      const wheel = new THREE.CylinderGeometry(0.31, 0.31, 0.22, 12);
      wheel.rotateZ(Math.PI / 2);
      wheel.translate(dx, 0.31, dz);
      parts.push(wheel);
    }
  }
  return mergeAll(parts) ?? parts[0];
}

function instanced(name: string, geometry: THREE.BufferGeometry, material: THREE.Material, matrices: THREE.Matrix4[]) {
  if (matrices.length === 0) {
    return;
  }
  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  vehicleElements.add(mesh);
}

export const parkedVehicleStats = { count: 0 };

export function addParkedVehicles() {
  const byColour: THREE.Matrix4[][] = carPaintMaterials.map(() => []);
  const all: THREE.Matrix4[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const place = (slot: OrientedSlot, occupancy: number, flip: boolean) => {
    const seed = hash(slot.x, slot.z);
    if (seed > occupancy) {
      return;
    }
    const heading = flip && hash(slot.z, slot.x) > 0.5 ? slot.heading + Math.PI : slot.heading;
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3(slot.x, slot.y, slot.z),
      new THREE.Quaternion().setFromAxisAngle(up, heading),
      new THREE.Vector3(1, 1, 1),
    );
    const colour = Math.floor(hash(slot.x * 3.1, slot.z * 1.7) * byColour.length) % byColour.length;
    byColour[colour].push(matrix);
    all.push(matrix);
  };
  for (const slot of roadSideSlots.parkingBays) {
    place(slot, 0.52, false);
  }
  const body = createBodyGeometry();
  byColour.forEach((matrices, index) => instanced(`parked-car-bodies-${index + 1}`, body, carPaintMaterials[index], matrices));
  instanced("parked-car-cabins", createCabinGeometry(), carGlassMaterial, all);
  instanced("parked-car-wheels", createWheelsGeometry(), tyreMaterial, all);
  parkedVehicleStats.count = all.length;
  return all.length;
}
