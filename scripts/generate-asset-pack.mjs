import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { deflateSync } from "node:zlib";

const outRoot = join(process.cwd(), "public", "assets", "sity");
const textureRoot = join(outRoot, "textures");
const modelRoot = join(outRoot, "models");
const decoderRoot = join(outRoot, "decoders");
const threeLibRoot = join(process.cwd(), "node_modules", "three", "examples", "jsm", "libs");

const textureSpecs = [
  { name: "grass_meadow_albedo", base: 0x8fc877, kind: "grass" },
  { name: "asphalt_aggregate_albedo", base: 0x555a5c, kind: "asphalt" },
  { name: "concrete_weathered_albedo", base: 0x9b9588, kind: "concrete" },
  { name: "sand_dry_albedo", base: 0xd8c58d, kind: "sand" },
  { name: "sand_wet_albedo", base: 0xb5a36f, kind: "wetSand" },
  { name: "rock_strata_albedo", base: 0x6f6b61, kind: "rock" },
  { name: "wood_planks_albedo", base: 0x806a4f, kind: "wood" },
  { name: "sea_ripple_albedo", base: 0x2e96c4, kind: "water" },
  { name: "metal_worn_albedo", base: 0x596368, kind: "metal" },
  { name: "hull_painted_metal", base: 0x4f6376, kind: "hull" },
  { name: "boat_fiberglass", base: 0xd8f2f5, kind: "fiberglass" },
  { name: "cabin_offwhite", base: 0xe9e4d4, kind: "cabin" },
  { name: "cargo_container_worn", base: 0xa94f3f, kind: "container" },
  { name: "dark_rubber", base: 0x171a1a, kind: "rubber" },
  { name: "blue_green_glass", base: 0x2d7fa6, kind: "glass" },
];

function colorToRgb(hex) {
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hashNoise(x, y, seed = 1) {
  const value = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43_758.5453;
  return value - Math.floor(value);
}

function mixChannel(a, b, t) {
  return a + (b - a) * t;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data = Buffer.alloc(0)) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function pngBuffer(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const scanlines = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1);
    scanlines[rowOffset] = 0;
    for (let x = 0; x < width; x += 1) {
      const pixel = pixels(x, y, width, height);
      const offset = rowOffset + 1 + x * 4;
      scanlines[offset] = pixel[0];
      scanlines[offset + 1] = pixel[1];
      scanlines[offset + 2] = pixel[2];
      scanlines[offset + 3] = pixel[3] ?? 255;
    }
  }

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(scanlines, { level: 9 })),
    pngChunk("IEND"),
  ]);
}

function materialPixel(spec, x, y, width, height) {
  const base = colorToRgb(spec.base);
  const n1 = hashNoise(x, y, spec.name.length);
  const n2 = hashNoise(Math.floor(x / 7), Math.floor(y / 7), spec.name.length * 3);
  const n3 = hashNoise(Math.floor(x / 23), Math.floor(y / 23), spec.name.length * 5);
  let light = (n1 - 0.5) * 28 + (n2 - 0.5) * 16;
  let tint = [0, 0, 0];

  if (spec.kind === "grass") {
    light += Math.sin(x * 0.35 + y * 0.08) * 10;
    tint = n3 > 0.72 ? [-18, 26, -10] : [8, 18, 0];
  } else if (spec.kind === "asphalt") {
    light += n3 > 0.78 ? 32 : -8;
    tint = n1 > 0.92 ? [38, 38, 36] : [-12, -10, -8];
  } else if (spec.kind === "concrete") {
    light += Math.sin(y * 0.05) * 7;
    tint = Math.abs((x % 96) - 48) < 1 || Math.abs((y % 96) - 48) < 1 ? [-55, -53, -48] : [0, 0, 0];
  } else if (spec.kind === "sand" || spec.kind === "wetSand") {
    light += Math.sin((x + y) * 0.12) * 5;
    tint = n1 > 0.86 ? [26, 19, 6] : [0, 0, 0];
  } else if (spec.kind === "rock") {
    light += Math.sin(y * 0.16) * 18;
    tint = Math.abs((y % 37) - 18) < 2 ? [-35, -32, -27] : [0, 0, 0];
  } else if (spec.kind === "wood") {
    light += Math.sin(x * 0.2) * 14;
    tint = Math.abs((x % 44) - 22) < 2 ? [-42, -32, -22] : [10, 3, -5];
  } else if (spec.kind === "water") {
    light += Math.sin(x * 0.12 + y * 0.04) * 18 + Math.cos(x * 0.04 - y * 0.14) * 16;
    tint = [0, 14, 24];
  } else if (spec.kind === "metal" || spec.kind === "hull") {
    light += Math.sin(y * 0.08) * 8;
    tint = n3 > 0.82 ? [34, 35, 31] : [-8, -6, -4];
  } else if (spec.kind === "container") {
    light += Math.abs((x % 42) - 21) < 1 ? -48 : 0;
    light += Math.abs((y % 72) - 36) < 1 ? -26 : 0;
  } else if (spec.kind === "glass") {
    light += Math.sin((x + y) * 0.08) * 24;
    tint = [0, 28, 42];
  }

  return [
    clamp(base[0] + light + tint[0]),
    clamp(base[1] + light + tint[1]),
    clamp(base[2] + light + tint[2]),
    255,
  ];
}

function materialHeight(spec, x, y) {
  const n1 = hashNoise(x, y, spec.name.length);
  const n2 = hashNoise(Math.floor(x / 5), Math.floor(y / 5), spec.name.length * 3);
  const n3 = hashNoise(Math.floor(x / 19), Math.floor(y / 19), spec.name.length * 7);
  let height = n1 * 0.4 + n2 * 0.35 + n3 * 0.25;

  if (spec.kind === "asphalt") {
    height = height * 0.35 + (n3 > 0.82 ? 0.55 : 0);
  } else if (spec.kind === "concrete") {
    height = height * 0.42 + (Math.abs((x % 96) - 48) < 1 || Math.abs((y % 96) - 48) < 1 ? 0.05 : 0.25);
  } else if (spec.kind === "rock") {
    height = height * 0.55 + (Math.sin(y * 0.16) + 1) * 0.22;
  } else if (spec.kind === "wood") {
    height = height * 0.28 + (Math.abs((x % 44) - 22) < 2 ? 0.1 : 0.42);
  } else if (spec.kind === "water") {
    height = (Math.sin(x * 0.12 + y * 0.04) + Math.cos(x * 0.04 - y * 0.14) + 2) * 0.25;
  } else if (spec.kind === "metal" || spec.kind === "hull") {
    height = height * 0.22 + (n3 > 0.84 ? 0.55 : 0.3);
  }

  return Math.max(0, Math.min(1, height));
}

function normalPixel(spec, x, y, width, height) {
  const left = materialHeight(spec, x - 1, y);
  const right = materialHeight(spec, x + 1, y);
  const down = materialHeight(spec, x, y - 1);
  const up = materialHeight(spec, x, y + 1);
  const strength = spec.kind === "water" ? 3.8 : spec.kind === "rock" ? 4.4 : 2.6;
  const nx = (left - right) * strength;
  const ny = (down - up) * strength;
  const nz = 1;
  const length = Math.hypot(nx, ny, nz) || 1;

  return [
    clamp((nx / length) * 127 + 128),
    clamp((ny / length) * 127 + 128),
    clamp((nz / length) * 127 + 128),
    255,
  ];
}

function ormPixel(spec, x, y) {
  const n = hashNoise(x, y, spec.name.length * 11);
  const height = materialHeight(spec, x, y);
  const occlusion = clamp(218 - height * 42 - n * 18);
  const roughnessByKind = {
    grass: 230,
    asphalt: 214,
    concrete: 204,
    sand: 232,
    wetSand: 178,
    rock: 224,
    wood: 210,
    water: 118,
    metal: 132,
    hull: 156,
    fiberglass: 146,
    cabin: 172,
    container: 198,
    rubber: 218,
    glass: 82,
  };
  const metalnessByKind = {
    metal: 152,
    hull: 22,
    container: 16,
    glass: 12,
  };

  return [
    occlusion,
    clamp((roughnessByKind[spec.kind] ?? 200) + (n - 0.5) * 18),
    clamp(metalnessByKind[spec.kind] ?? 0),
    255,
  ];
}

async function writeTexture(spec) {
  const albedoFile = join(textureRoot, `${spec.name}.png`);
  const normalFile = join(textureRoot, `${spec.name}_normal.png`);
  const ormFile = join(textureRoot, `${spec.name}_orm.png`);
  await mkdir(dirname(albedoFile), { recursive: true });
  await Promise.all([
    writeFile(albedoFile, pngBuffer(512, 512, (x, y, width, height) => materialPixel(spec, x, y, width, height))),
    writeFile(normalFile, pngBuffer(512, 512, (x, y, width, height) => normalPixel(spec, x, y, width, height))),
    writeFile(ormFile, pngBuffer(512, 512, (x, y) => ormPixel(spec, x, y))),
  ]);
}

function createModelBuilder(materials) {
  const groups = new Map(materials.map((material) => [material.name, { ...material, positions: [], normals: [], uvs: [], indices: [] }]));

  function addVertex(group, position, normal, uv) {
    const index = group.positions.length / 3;
    group.positions.push(...position);
    group.normals.push(...normal);
    group.uvs.push(...uv);
    return index;
  }

  function addQuad(group, corners, normal) {
    const uvs = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const start = corners.map((corner, index) => addVertex(group, corner, normal, uvs[index]));
    group.indices.push(start[0], start[1], start[2], start[0], start[2], start[3]);
  }

  function addBox(materialName, center, size) {
    const group = groups.get(materialName);
    if (!group) {
      throw new Error(`Unknown material ${materialName}`);
    }

    const [cx, cy, cz] = center;
    const [w, h, d] = size;
    const x0 = cx - w / 2;
    const x1 = cx + w / 2;
    const y0 = cy - h / 2;
    const y1 = cy + h / 2;
    const z0 = cz - d / 2;
    const z1 = cz + d / 2;

    addQuad(group, [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], [1, 0, 0]);
    addQuad(group, [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]], [-1, 0, 0]);
    addQuad(group, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0]);
    addQuad(group, [[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]], [0, -1, 0]);
    addQuad(group, [[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]], [0, 0, 1]);
    addQuad(group, [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1]);
  }

  return { groups, addBox };
}

function align4(value) {
  return (value + 3) & ~3;
}

function accessorMinMax(values, itemSize) {
  const min = Array(itemSize).fill(Number.POSITIVE_INFINITY);
  const max = Array(itemSize).fill(Number.NEGATIVE_INFINITY);
  for (let offset = 0; offset < values.length; offset += itemSize) {
    for (let item = 0; item < itemSize; item += 1) {
      min[item] = Math.min(min[item], values[offset + item]);
      max[item] = Math.max(max[item], values[offset + item]);
    }
  }
  return { min, max };
}

function makeBufferPart(typedArray) {
  const buffer = Buffer.from(typedArray.buffer);
  return buffer.byteOffset === 0 && buffer.byteLength === typedArray.buffer.byteLength
    ? buffer
    : Buffer.from(buffer.subarray(typedArray.byteOffset, typedArray.byteOffset + typedArray.byteLength));
}

async function writeGltfModel(fileName, builder) {
  const images = [];
  const textures = [];
  const materials = [];
  const bufferViews = [];
  const accessors = [];
  const primitives = [];
  const chunks = [];
  let byteOffset = 0;

  function addBufferView(buffer, target) {
    const paddedOffset = align4(byteOffset);
    if (paddedOffset > byteOffset) {
      chunks.push(Buffer.alloc(paddedOffset - byteOffset));
      byteOffset = paddedOffset;
    }

    const viewIndex = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset, byteLength: buffer.byteLength, target });
    chunks.push(buffer);
    byteOffset += buffer.byteLength;
    return viewIndex;
  }

  function addAccessor(values, itemSize, componentType, type, target, includeMinMax = false) {
    const typedArray = componentType === 5125 ? new Uint32Array(values) : new Float32Array(values);
    const buffer = makeBufferPart(typedArray);
    const bufferView = addBufferView(buffer, target);
    const accessor = {
      bufferView,
      componentType,
      count: values.length / itemSize,
      type,
    };

    if (includeMinMax) {
      Object.assign(accessor, accessorMinMax(values, itemSize));
    }

    accessors.push(accessor);
    return accessors.length - 1;
  }

  for (const group of builder.groups.values()) {
    if (group.positions.length === 0) {
      continue;
    }

    const imageIndex = images.length;
    images.push({ uri: `../textures/${group.texture}.png` });
    textures.push({ source: imageIndex });
    const materialIndex = materials.length;
    materials.push({
      name: group.name,
      pbrMetallicRoughness: {
        baseColorTexture: { index: textures.length - 1 },
        metallicFactor: group.metallic,
        roughnessFactor: group.roughness,
      },
      doubleSided: true,
    });

    primitives.push({
      attributes: {
        POSITION: addAccessor(group.positions, 3, 5126, "VEC3", 34962, true),
        NORMAL: addAccessor(group.normals, 3, 5126, "VEC3", 34962),
        TEXCOORD_0: addAccessor(group.uvs, 2, 5126, "VEC2", 34962),
      },
      indices: addAccessor(group.indices, 1, 5125, "SCALAR", 34963),
      material: materialIndex,
    });
  }

  const binary = Buffer.concat(chunks);
  const gltf = {
    asset: {
      version: "2.0",
      generator: "Sity local asset pack generator",
    },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: fileName.replace(".gltf", ""), mesh: 0 }],
    meshes: [{ name: `${fileName.replace(".gltf", "")}-mesh`, primitives }],
    materials,
    textures,
    images,
    buffers: [{ byteLength: binary.byteLength, uri: `data:application/octet-stream;base64,${binary.toString("base64")}` }],
    bufferViews,
    accessors,
  };

  const file = join(modelRoot, fileName);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(gltf, null, 2)}\n`);
}

async function writeCargoShipModel() {
  const builder = createModelBuilder([
    { name: "painted_hull", texture: "hull_painted_metal", metallic: 0.05, roughness: 0.58 },
    { name: "cabin", texture: "cabin_offwhite", metallic: 0, roughness: 0.52 },
    { name: "deck", texture: "concrete_weathered_albedo", metallic: 0, roughness: 0.68 },
    { name: "containers", texture: "cargo_container_worn", metallic: 0.02, roughness: 0.76 },
    { name: "metal", texture: "metal_worn_albedo", metallic: 0.32, roughness: 0.48 },
    { name: "glass", texture: "blue_green_glass", metallic: 0.04, roughness: 0.25 },
  ]);

  builder.addBox("painted_hull", [0, 7.5, 0], [150, 15, 34]);
  builder.addBox("painted_hull", [83, 8.4, 0], [20, 13, 24]);
  builder.addBox("deck", [8, 16.6, 0], [126, 2.6, 30]);
  builder.addBox("cabin", [-42, 27, 0], [44, 18, 23]);
  builder.addBox("glass", [-38, 31, 0], [36, 4, 24]);
  builder.addBox("metal", [-58, 45, 0], [2, 26, 2]);
  builder.addBox("metal", [-58, 58, 0], [17, 1.2, 1.2]);
  builder.addBox("metal", [0, 24, -18.8], [146, 1.1, 1.1]);
  builder.addBox("metal", [0, 24, 18.8], [146, 1.1, 1.1]);

  for (let index = 0; index < 8; index += 1) {
    builder.addBox("containers", [-10 + (index % 4) * 18, 21.8 + Math.floor(index / 4) * 4.4, index < 4 ? -8.5 : 8.5], [14, 4.2, 7]);
  }

  for (let index = 0; index < 12; index += 1) {
    const x = -68 + (140 * index) / 11;
    builder.addBox("metal", [x, 22.2, -18.8], [0.85, 4.5, 0.85]);
    builder.addBox("metal", [x, 22.2, 18.8], [0.85, 4.5, 0.85]);
  }

  await writeGltfModel("cargo_ship_optimized.gltf", builder);
}

async function writePrivateBoatModel() {
  const builder = createModelBuilder([
    { name: "fiberglass_hull", texture: "boat_fiberglass", metallic: 0.01, roughness: 0.42 },
    { name: "cabin", texture: "cabin_offwhite", metallic: 0, roughness: 0.5 },
    { name: "glass", texture: "blue_green_glass", metallic: 0.04, roughness: 0.2 },
    { name: "rubber", texture: "dark_rubber", metallic: 0, roughness: 0.76 },
  ]);

  builder.addBox("fiberglass_hull", [0, 3.2, 0], [42, 6.4, 12]);
  builder.addBox("fiberglass_hull", [24, 3.4, 0], [9, 5.4, 8.8]);
  builder.addBox("cabin", [-5, 10.5, 0], [13, 7, 8]);
  builder.addBox("glass", [1, 14.8, 0], [9, 2.5, 8.5]);
  builder.addBox("rubber", [-24, 4.5, 0], [3.6, 5.4, 4.6]);
  builder.addBox("rubber", [0, 6.8, -6.5], [38, 1.3, 1.2]);
  builder.addBox("rubber", [0, 6.8, 6.5], [38, 1.3, 1.2]);

  await writeGltfModel("private_boat_optimized.gltf", builder);
}

async function writeManifest() {
  const manifest = {
    version: 1,
    units: "meters",
    renderer: "three.js",
    compressionReady: ["ktx2", "draco", "meshopt"],
    decoders: {
      basis: "/assets/sity/decoders/basis/",
      draco: "/assets/sity/decoders/draco/gltf/",
      meshopt: "bundled",
    },
    models: {
      cargoShip: "/assets/sity/models/cargo_ship_optimized.gltf",
      privateBoat: "/assets/sity/models/private_boat_optimized.gltf",
    },
    textures: Object.fromEntries(
      textureSpecs.map((spec) => [spec.name, `/assets/sity/textures/${spec.name}.png`]),
    ),
    pbrTextures: Object.fromEntries(
      textureSpecs.map((spec) => [
        spec.name,
        {
          albedo: `/assets/sity/textures/${spec.name}.png`,
          normal: `/assets/sity/textures/${spec.name}_normal.png`,
          orm: `/assets/sity/textures/${spec.name}_orm.png`,
        },
      ]),
    ),
  };

  await writeFile(join(outRoot, "asset-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

async function copyDecoderRuntimeAssets() {
  const copies = [
    {
      from: join(threeLibRoot, "basis", "basis_transcoder.js"),
      to: join(decoderRoot, "basis", "basis_transcoder.js"),
    },
    {
      from: join(threeLibRoot, "basis", "basis_transcoder.wasm"),
      to: join(decoderRoot, "basis", "basis_transcoder.wasm"),
    },
    {
      from: join(threeLibRoot, "draco", "gltf", "draco_decoder.js"),
      to: join(decoderRoot, "draco", "gltf", "draco_decoder.js"),
    },
    {
      from: join(threeLibRoot, "draco", "gltf", "draco_decoder.wasm"),
      to: join(decoderRoot, "draco", "gltf", "draco_decoder.wasm"),
    },
    {
      from: join(threeLibRoot, "draco", "gltf", "draco_wasm_wrapper.js"),
      to: join(decoderRoot, "draco", "gltf", "draco_wasm_wrapper.js"),
    },
  ];

  await Promise.all(
    copies.map(async ({ from, to }) => {
      await mkdir(dirname(to), { recursive: true });
      await copyFile(from, to);
    }),
  );
}

await mkdir(textureRoot, { recursive: true });
await mkdir(modelRoot, { recursive: true });
await mkdir(decoderRoot, { recursive: true });
await Promise.all(textureSpecs.map(writeTexture));
await writeCargoShipModel();
await writePrivateBoatModel();
await copyDecoderRuntimeAssets();
await writeManifest();

console.log(`Generated Sity asset pack in ${outRoot}`);
