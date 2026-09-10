import * as THREE from "three";
import { BEACH_SAND_COLOR, CONCRETE_PORT_COLOR, GRASS_COLOR, HIGHWAY_ASPHALT_COLOR, WET_SAND_COLOR, WOOD_PIER_COLOR } from "../config/constants";

export function createSpeckledTexture(
  name: string,
  baseColor: number,
  speckleColors: number[],
  size = 256,
  repeat = 24,
) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext("2d");

  if (!context) {
    throw new Error(`Could not create ${name} texture.`);
  }

  context.fillStyle = `#${baseColor.toString(16).padStart(6, "0")}`;
  context.fillRect(0, 0, size, size);

  for (let index = 0; index < size * 10; index += 1) {
    const color = speckleColors[index % speckleColors.length];
    const radius = 0.7 + ((index * 13) % 7) * 0.18;
    const x = (index * 47 + Math.sin(index) * 91) % size;
    const y = (index * 83 + Math.cos(index * 0.7) * 67) % size;
    context.globalAlpha = 0.16 + ((index * 11) % 9) * 0.025;
    context.fillStyle = `#${color.toString(16).padStart(6, "0")}`;
    context.beginPath();
    context.arc((x + size) % size, (y + size) % size, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.name = name;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 8;
  return texture;
}

export function createLinearTexture(
  name: string,
  baseColor: number,
  stripeColor: number,
  size = 256,
  repeatX = 12,
  repeatY = 12,
  stripeEvery = 28,
) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext("2d");

  if (!context) {
    throw new Error(`Could not create ${name} texture.`);
  }

  context.fillStyle = `#${baseColor.toString(16).padStart(6, "0")}`;
  context.fillRect(0, 0, size, size);
  context.strokeStyle = `#${stripeColor.toString(16).padStart(6, "0")}`;
  context.globalAlpha = 0.32;
  context.lineWidth = 2;

  for (let line = -size; line < size * 2; line += stripeEvery) {
    context.beginPath();
    context.moveTo(line, 0);
    context.lineTo(line + size, size);
    context.stroke();
  }

  context.globalAlpha = 0.14;
  for (let index = 0; index < 120; index += 1) {
    const x = (index * 37) % size;
    const y = (index * 61) % size;
    context.fillRect(x, y, 1 + (index % 5), 1);
  }

  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.name = name;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 8;
  return texture;
}

export function createWaterNormalTexture(name: string, size = 256) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext("2d");

  if (!context) {
    throw new Error(`Could not create ${name} texture.`);
  }

  const imageData = context.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const waveA = Math.sin(x * 0.12 + y * 0.045);
      const waveB = Math.cos(x * 0.035 - y * 0.16);
      const waveC = Math.sin((x + y) * 0.055);
      const nx = Math.round(128 + waveA * 38 + waveC * 18);
      const ny = Math.round(128 + waveB * 34 - waveC * 14);
      const offset = (y * size + x) * 4;
      imageData.data[offset] = THREE.MathUtils.clamp(nx, 0, 255);
      imageData.data[offset + 1] = THREE.MathUtils.clamp(ny, 0, 255);
      imageData.data[offset + 2] = 224;
      imageData.data[offset + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.name = name;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(18, 18);
  texture.anisotropy = 8;
  return texture;
}

export const grassTexture = createSpeckledTexture("grass-varied-ground-texture", GRASS_COLOR, [
  0x7fb567,
  0xa6d28b,
  0x6f9f58,
  0xb0d79a,
], 256, 34);

export const mainlandTexture = createSpeckledTexture("outside-mainland-muted-ground-texture", 0x9da19b, [
  0x8f958d,
  0xb0b4ab,
  0x7f857c,
], 256, 28);

export const terrainCutTexture = createSpeckledTexture("earth-cut-strata-texture", 0x68705d, [
  0x575d4e,
  0x7b806e,
  0x4f5448,
], 256, 18);

export const drySandTexture = createSpeckledTexture("dry-sand-grain-texture", BEACH_SAND_COLOR, [
  0xc8b275,
  0xead99c,
  0xbda66e,
], 256, 26);

export const wetSandTexture = createSpeckledTexture("wet-sand-grain-texture", WET_SAND_COLOR, [
  0xa69668,
  0xc6b783,
  0x8f805d,
], 256, 18);

export const asphaltTexture = createSpeckledTexture("asphalt-aggregate-texture", HIGHWAY_ASPHALT_COLOR, [
  0x53585a,
  0x747a7d,
  0x3f4446,
], 256, 36);

export const concreteTexture = createSpeckledTexture("weathered-concrete-texture", CONCRETE_PORT_COLOR, [
  0x8a867b,
  0xb0aa9a,
  0x777368,
], 256, 16);

export const woodTexture = createLinearTexture("weathered-wood-plank-texture", WOOD_PIER_COLOR, 0x5f4d38, 256, 10, 8, 34);

export const metalTexture = createSpeckledTexture("dull-metal-wear-texture", 0x596368, [
  0x485155,
  0x727d82,
  0x30383b,
], 256, 10);

export const darkWearTexture = createSpeckledTexture("dark-weathering-decal-texture", 0x2f302d, [
  0x1f211f,
  0x454640,
  0x555149,
], 256, 12);

export const waterNormalTexture = createWaterNormalTexture("generated-water-normal-map");
