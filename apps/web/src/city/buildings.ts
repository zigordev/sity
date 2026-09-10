import * as THREE from "three";
import { cityElements } from "../render/context";
import type { Lot } from "./lots";
import { DISTRICT_STYLES } from "./districts";
import { createRandom, hash2 } from "./random";

export interface BuildingInstance {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  rotationY: number;
  color: THREE.Color;
  floorHeight: number;
  windowWidth: number;
  windowRatio: number;
  seed: number;
}

export interface BuildingFootprint {
  group: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  rotationY: number;
  baseY: number;
  height: number;
}

export const buildingFootprints: BuildingFootprint[] = [];

export function footprintCorners(footprint: BuildingFootprint) {
  const cos = Math.cos(footprint.rotationY);
  const sin = Math.sin(footprint.rotationY);
  const halfW = footprint.width * 0.5;
  const halfD = footprint.depth * 0.5;
  return [
    { x: -halfW, z: -halfD },
    { x: halfW, z: -halfD },
    { x: halfW, z: halfD },
    { x: -halfW, z: halfD },
  ].map((corner) => ({
    x: footprint.x + corner.x * cos + corner.z * sin,
    z: footprint.z - corner.x * sin + corner.z * cos,
  }));
}

export interface RoofInstance {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  rotationY: number;
  color: THREE.Color;
}

const WALL_PALETTES: Record<string, number[]> = {
  plaster: [0xe8e2d4, 0xd9d2c1, 0xf1ebdc, 0xcfc9b8, 0xe4dccb],
  brick: [0xa8674f, 0x9c5f4a, 0xb37a5e, 0x8f5544],
  concrete: [0xb8b6ad, 0xa9a89f, 0xc3c1b8, 0x9d9c94],
  glass: [0x7f9bb0, 0x6d8ca5, 0x88a4b8, 0x5f7f99],
  metal: [0x9aa5ad, 0x8794a0, 0xb0b8bf, 0x6f8fa6, 0xc9cdd1],
  white: [0xf2f2ee, 0xe9ecef, 0xdfe6ea],
};

function pick(list: number[], random: () => number) {
  return list[Math.floor(random() * list.length) % list.length];
}

export function createFacadeMaterial() {
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.72,
    metalness: 0.08,
  });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute vec4 aFacade;
varying vec4 vFacade;
varying vec3 vLocalPosition;
varying vec3 vLocalNormal;
varying vec3 vInstanceScale;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vFacade = aFacade;
vLocalPosition = position;
vLocalNormal = normal;
#ifdef USE_INSTANCING
vInstanceScale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
#else
vInstanceScale = vec3(1.0);
#endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec4 vFacade;
varying vec3 vLocalPosition;
varying vec3 vLocalNormal;
varying vec3 vInstanceScale;
float sityHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float sityWindow = 0.0;
float sityBand = 0.0;
float sityRoof = step(0.5, vLocalNormal.y);
float sityWall = 1.0 - abs(vLocalNormal.y);
if (sityWall > 0.5) {
  float extent = abs(vLocalNormal.x) > 0.5 ? vInstanceScale.z : vInstanceScale.x;
  float along = (abs(vLocalNormal.x) > 0.5 ? vLocalPosition.z * sign(vLocalNormal.x) : -vLocalPosition.x * sign(vLocalNormal.z)) * (abs(vLocalNormal.x) > 0.5 ? vInstanceScale.z : vInstanceScale.x) + extent * 0.5;
  float up = (vLocalPosition.y + 0.5) * vInstanceScale.y;
  float floorHeight = vFacade.x;
  float windowWidth = vFacade.y;
  float windowRatio = vFacade.z;
  float columns = max(1.0, floor((extent - 1.2) / windowWidth));
  float margin = (extent - columns * windowWidth) * 0.5;
  float u = along - margin;
  float floorIndex = floor(up / floorHeight);
  float cellU = fract(u / windowWidth);
  float cellV = fract(up / floorHeight);
  float inColumns = step(0.0, u) * step(u, columns * windowWidth);
  float halfW = windowRatio * 0.5;
  float halfH = mix(0.22, 0.42, windowRatio);
  float windowU = step(0.5 - halfW, cellU) * step(cellU, 0.5 + halfW);
  float windowV = step(0.5 - halfH, cellV) * step(cellV, 0.5 + halfH);
  float ground = step(1.0, floorIndex);
  float topFloor = step(up, vInstanceScale.y - 0.9);
  sityWindow = windowU * windowV * inColumns * topFloor * mix(0.65, 1.0, ground);
  sityBand = step(cellV, 0.05) * step(0.45, windowRatio) * ground;
  float shade = sityHash(vec2(floor(u / windowWidth) + vFacade.w, floorIndex * 3.1 + vFacade.w));
  vec3 glassA = vec3(0.16, 0.22, 0.29);
  vec3 glassB = vec3(0.36, 0.44, 0.52);
  vec3 glass = mix(glassA, glassB, step(0.72, shade) * 0.8 + shade * 0.2);
  vec3 wall = diffuseColor.rgb;
  wall *= mix(0.86, 1.0, smoothstep(0.0, 1.4, up));
  diffuseColor.rgb = mix(wall, glass, sityWindow);
  diffuseColor.rgb = mix(diffuseColor.rgb, wall * 0.72, sityBand * (1.0 - sityWindow));
} else if (sityRoof > 0.5) {
  float edge = min(min(0.5 - abs(vLocalPosition.x), 0.5 - abs(vLocalPosition.z)) * min(vInstanceScale.x, vInstanceScale.z), 1.2);
  float parapet = 1.0 - smoothstep(0.35, 0.9, edge);
  diffuseColor.rgb = mix(diffuseColor.rgb * 0.5 + vec3(0.14, 0.13, 0.12), diffuseColor.rgb * 0.82, parapet);
}`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.16, sityWindow);`,
      )
      .replace(
        "#include <metalnessmap_fragment>",
        `#include <metalnessmap_fragment>
metalnessFactor = mix(metalnessFactor, 0.62, sityWindow);`,
      );
  };
  return material;
}

export function createGableRoofGeometry() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array([
    -0.5, 0, -0.5, 0.5, 0, -0.5, 0, 1, -0.5,
    0.5, 0, 0.5, -0.5, 0, 0.5, 0, 1, 0.5,
    -0.5, 0, -0.5, 0, 1, -0.5, 0, 1, 0.5,
    -0.5, 0, -0.5, 0, 1, 0.5, -0.5, 0, 0.5,
    0.5, 0, -0.5, 0.5, 0, 0.5, 0, 1, 0.5,
    0.5, 0, -0.5, 0, 1, 0.5, 0, 1, -0.5,
  ]);
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const uvs = new Float32Array((positions.length / 3) * 2);
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

export class BuildingBatch {
  readonly walls: BuildingInstance[] = [];
  readonly roofs: RoofInstance[] = [];

  addBox(instance: BuildingInstance, footprintGroup?: string) {
    this.walls.push(instance);
    if (footprintGroup) {
      buildingFootprints.push({
        group: footprintGroup,
        x: instance.x,
        z: instance.z,
        width: instance.width,
        depth: instance.depth,
        rotationY: instance.rotationY,
        baseY: instance.y,
        height: instance.height,
      });
    }
  }

  addPlinth(lot: Lot, width: number, depth: number, centre: { x: number; z: number }, color: THREE.Color) {
    const rise = lot.groundMaxY - lot.groundMinY;
    if (rise < 0.3) {
      return lot.groundY;
    }
    const top = lot.groundMaxY + 0.2;
    this.walls.push({
      x: centre.x,
      y: lot.groundMinY - 0.4,
      z: centre.z,
      width: width + 0.6,
      height: top - lot.groundMinY + 0.4,
      depth: depth + 0.6,
      rotationY: lot.rotationY,
      color,
      floorHeight: 40,
      windowWidth: 1,
      windowRatio: 0,
      seed: 0,
    });
    return top;
  }

  addRoof(instance: RoofInstance) {
    this.roofs.push(instance);
  }

  commit(name: string) {
    if (this.walls.length > 0) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const facade = new Float32Array(this.walls.length * 4);
      this.walls.forEach((instance, index) => {
        facade[index * 4] = instance.floorHeight;
        facade[index * 4 + 1] = instance.windowWidth;
        facade[index * 4 + 2] = instance.windowRatio;
        facade[index * 4 + 3] = instance.seed;
      });
      geometry.setAttribute("aFacade", new THREE.InstancedBufferAttribute(facade, 4));
      const mesh = new THREE.InstancedMesh(geometry, createFacadeMaterial(), this.walls.length);
      const matrix = new THREE.Matrix4();
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      const yAxis = new THREE.Vector3(0, 1, 0);
      this.walls.forEach((instance, index) => {
        position.set(instance.x, instance.y + instance.height * 0.5, instance.z);
        quaternion.setFromAxisAngle(yAxis, instance.rotationY);
        scale.set(instance.width, instance.height, instance.depth);
        matrix.compose(position, quaternion, scale);
        mesh.setMatrixAt(index, matrix);
        mesh.setColorAt(index, instance.color);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.name = `${name}-walls`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      cityElements.add(mesh);
    }
    if (this.roofs.length > 0) {
      const geometry = createGableRoofGeometry();
      const mesh = new THREE.InstancedMesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0.02 }),
        this.roofs.length,
      );
      const matrix = new THREE.Matrix4();
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      const yAxis = new THREE.Vector3(0, 1, 0);
      this.roofs.forEach((instance, index) => {
        position.set(instance.x, instance.y, instance.z);
        quaternion.setFromAxisAngle(yAxis, instance.rotationY);
        scale.set(instance.width, instance.height, instance.depth);
        matrix.compose(position, quaternion, scale);
        mesh.setMatrixAt(index, matrix);
        mesh.setColorAt(index, instance.color);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.name = `${name}-roofs`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      cityElements.add(mesh);
    }
  }
}

const DOWNTOWN_CENTER = { x: 290, z: -220 };

export function buildLotBuildings(lots: Lot[]) {
  const batch = new BuildingBatch();
  const random = createRandom(9137);
  const color = new THREE.Color();
  let count = 0;

  for (const lot of lots) {
    const style = DISTRICT_STYLES[lot.district];
    const seed = hash2(lot.center.x, lot.center.z, 7) * 1000;
    const floors = Math.round(style.floors[0] + random() * (style.floors[1] - style.floors[0]));
    const rotation = lot.rotationY;
    const centerAt = (frontDistance: number) => ({
      x: lot.front.x + lot.inward.x * frontDistance,
      z: lot.front.z + lot.inward.z * frontDistance,
    });
    const plinthColor = color.setHex(0x8f8c84).clone();
    const groundedBase = (width: number, depth: number, centre: { x: number; z: number }) => batch.addPlinth(lot, width, depth, centre, plinthColor);

    if (style.building === "tower") {
      const closeness = 1 - Math.min(1, Math.hypot(lot.center.x - DOWNTOWN_CENTER.x, lot.center.z - DOWNTOWN_CENTER.z) / 240);
      const towerFloors = Math.round(8 + closeness * 20 + random() * 8);
      const podiumFloors = 3;
      const podiumWidth = lot.width - 1.5;
      const podiumDepth = lot.depth - 2;
      const podiumCenter = centerAt(podiumDepth * 0.5 + 1);
      const podiumColor = color.setHex(pick(WALL_PALETTES.concrete, random)).clone();
      const baseY = groundedBase(podiumWidth, podiumDepth, podiumCenter);
      batch.addBox({
        x: podiumCenter.x, y: baseY, z: podiumCenter.z,
        width: podiumWidth, height: podiumFloors * 4.2, depth: podiumDepth, rotationY: rotation,
        color: podiumColor, floorHeight: 4.2, windowWidth: 3.2, windowRatio: 0.62, seed,
      }, lot.id);
      const towerWidth = Math.max(14, podiumWidth - 6 - random() * 4);
      const towerDepth = Math.max(14, podiumDepth - 6 - random() * 4);
      const towerCenter = centerAt(podiumDepth * 0.5 + 1);
      const glassy = random() > 0.35;
      const towerColor = color.setHex(pick(glassy ? WALL_PALETTES.glass : WALL_PALETTES.white, random)).clone();
      batch.addBox({
        x: towerCenter.x, y: baseY + podiumFloors * 4.2, z: towerCenter.z,
        width: towerWidth, height: towerFloors * style.floorHeight, depth: towerDepth, rotationY: rotation,
        color: towerColor, floorHeight: style.floorHeight, windowWidth: glassy ? 2.2 : 2.8, windowRatio: glassy ? 0.9 : 0.55, seed: seed + 3,
      });
      if (random() > 0.5) {
        const crownWidth = towerWidth * 0.6;
        batch.addBox({
          x: towerCenter.x, y: baseY + podiumFloors * 4.2 + towerFloors * style.floorHeight, z: towerCenter.z,
          width: crownWidth, height: 4.5 + random() * 6, depth: towerDepth * 0.6, rotationY: rotation,
          color: towerColor, floorHeight: 3.2, windowWidth: 2.4, windowRatio: 0.4, seed: seed + 5,
        });
      }
      count += 2;
    } else if (style.building === "block") {
      const width = lot.width - 1.2;
      const depth = Math.min(lot.depth - 1.5, 22 + random() * 6);
      const center = centerAt(depth * 0.5 + 0.6);
      const paletteName = random() > 0.6 ? "brick" : random() > 0.5 ? "plaster" : "concrete";
      const wallColor = color.setHex(pick(WALL_PALETTES[paletteName], random)).clone();
      const height = floors * style.floorHeight;
      const baseY = groundedBase(width, depth, center);
      batch.addBox({
        x: center.x, y: baseY, z: center.z, width, height, depth, rotationY: rotation,
        color: wallColor, floorHeight: style.floorHeight, windowWidth: 2.4 + random() * 0.8, windowRatio: 0.42 + random() * 0.18, seed,
      }, lot.id);
      if (random() > 0.45) {
        batch.addBox({
          x: center.x, y: baseY + height, z: center.z,
          width: Math.max(4, width * 0.3), height: 2.8, depth: Math.max(4, depth * 0.35), rotationY: rotation,
          color: wallColor.clone().multiplyScalar(0.85), floorHeight: 2.8, windowWidth: 2, windowRatio: 0.2, seed: seed + 1,
        });
      }
      count += 1;
    } else if (style.building === "house") {
      const width = Math.min(lot.width - 3, 9 + random() * 3.5);
      const depth = Math.min(lot.depth - 8, 9 + random() * 3);
      const center = centerAt(depth * 0.5 + 3.5);
      const paletteName = random() > 0.5 ? "plaster" : random() > 0.4 ? "white" : "brick";
      const wallColor = color.setHex(pick(WALL_PALETTES[paletteName], random)).clone();
      const height = floors * style.floorHeight;
      const baseY = groundedBase(width, depth, center);
      batch.addBox({
        x: center.x, y: baseY, z: center.z, width, height, depth, rotationY: rotation,
        color: wallColor, floorHeight: style.floorHeight, windowWidth: 2.6, windowRatio: 0.38, seed,
      }, lot.id);
      const roofColor = color.setHex(random() > 0.5 ? 0x8d4a3b : random() > 0.5 ? 0x5b5f66 : 0xa35f45).clone();
      batch.addRoof({
        x: center.x, y: baseY + height, z: center.z,
        width: width + 1.2, height: 2.6 + random() * 1.2, depth: depth + 1.2, rotationY: rotation,
        color: roofColor,
      });
      count += 1;
    } else if (style.building === "shed") {
      const width = lot.width - 6;
      const depth = Math.min(lot.depth - 10, 34 + random() * 16);
      const center = centerAt(depth * 0.5 + 8);
      const wallColor = color.setHex(pick(WALL_PALETTES.metal, random)).clone();
      const height = 8 + random() * 5;
      const baseY = groundedBase(width, depth, center);
      batch.addBox({
        x: center.x, y: baseY, z: center.z, width, height, depth, rotationY: rotation,
        color: wallColor, floorHeight: height, windowWidth: 4, windowRatio: 0.28, seed,
      }, lot.id);
      if (random() > 0.4) {
        const officeWidth = Math.min(16, width * 0.4);
        const officeCenter = centerAt(4.2);
        batch.addBox({
          x: officeCenter.x + lot.tangent.x * (width * 0.5 - officeWidth * 0.5), y: baseY, z: officeCenter.z + lot.tangent.z * (width * 0.5 - officeWidth * 0.5),
          width: officeWidth, height: 6.6, depth: 8, rotationY: rotation,
          color: color.setHex(pick(WALL_PALETTES.plaster, random)).clone(), floorHeight: 3.3, windowWidth: 2.4, windowRatio: 0.5, seed: seed + 2,
        }, lot.id);
        count += 1;
      }
      count += 1;
    } else if (style.building === "hotel") {
      const width = lot.width - 2;
      const depth = Math.min(lot.depth - 3, 20 + random() * 8);
      const center = centerAt(depth * 0.5 + 1.5);
      const wallColor = color.setHex(pick(random() > 0.5 ? WALL_PALETTES.white : WALL_PALETTES.glass, random)).clone();
      const height = floors * style.floorHeight;
      const baseY = groundedBase(width, depth, center);
      batch.addBox({
        x: center.x, y: baseY, z: center.z, width, height, depth, rotationY: rotation,
        color: wallColor, floorHeight: style.floorHeight, windowWidth: 3.0, windowRatio: 0.7, seed,
      }, lot.id);
      batch.addBox({
        x: center.x, y: baseY + height, z: center.z,
        width: width * 0.5, height: 3.2, depth: depth * 0.5, rotationY: rotation,
        color: wallColor.clone().multiplyScalar(0.9), floorHeight: 3.2, windowWidth: 2.4, windowRatio: 0.3, seed: seed + 4,
      });
      count += 2;
    }
  }

  batch.commit("city-buildings");
  return count;
}
