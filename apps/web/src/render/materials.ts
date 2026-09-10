import * as THREE from "three";
import { ATTRACTION_BLUE_COLOR, ATTRACTION_RED_COLOR, ATTRACTION_YELLOW_COLOR, BEACH_SAND_COLOR, CONCRETE_PORT_COLOR, DOCK_COLOR, GRASS_COLOR, HIGHWAY_ASPHALT_COLOR, HIGHWAY_MEDIAN_COLOR, HIGHWAY_SHOULDER_COLOR, MICRO_TERRAIN_OPACITY, MOUNTAIN_HIGH_COLOR, MOUNTAIN_LOW_COLOR, MOUNTAIN_MID_COLOR, PRIVATE_BOAT_COLOR, ROAD_MARKING_WHITE_COLOR, ROAD_MARKING_YELLOW_COLOR, SEA_SHADER_WATER_COLOR, SHIP_CABIN_COLOR, SHIP_HULL_COLOR, SNOW_COLOR, SNOW_SHADOW_COLOR, WET_SAND_COLOR, WOOD_PIER_COLOR } from "../config/constants";
import { sunLight } from "./context";
import { asphaltTexture, concreteTexture, darkWearTexture, drySandTexture, grassTexture, metalTexture, terrainCutTexture, waterNormalTexture, wetSandTexture, woodTexture } from "./textures";

export function createSharedSeaWaterMaterial() {
  return new THREE.ShaderMaterial({
    name: "sity-shared-sea-water-shader",
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        sityTime: { value: 0 },
        normalSampler: { value: waterNormalTexture },
        waterColor: { value: new THREE.Color(SEA_SHADER_WATER_COLOR) },
        deepWaterColor: { value: new THREE.Color(0x0d4966) },
        sunColor: { value: new THREE.Color(0xffffff) },
        sunDirection: { value: sunLight.position.clone().normalize() },
      },
    ]),
    vertexShader: `
      varying vec3 vSityWaterWorldPosition;
      varying vec2 vSityWaterUv;
      #include <common>
      #include <fog_pars_vertex>

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vSityWaterWorldPosition = worldPosition.xyz;
        vSityWaterUv = uv;
        vec4 mvPosition = viewMatrix * worldPosition;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      uniform float sityTime;
      uniform sampler2D normalSampler;
      uniform vec3 waterColor;
      uniform vec3 deepWaterColor;
      uniform vec3 sunColor;
      uniform vec3 sunDirection;
      varying vec3 vSityWaterWorldPosition;
      varying vec2 vSityWaterUv;
      #include <common>
      #include <fog_pars_fragment>

      void main() {
        vec2 worldUv = vSityWaterWorldPosition.xz * 0.006;
        vec3 normalA = texture2D(normalSampler, worldUv + vec2(sityTime * 0.018, sityTime * 0.011)).rgb * 2.0 - 1.0;
        vec3 normalB = texture2D(normalSampler, worldUv * 1.73 - vec2(sityTime * 0.012, sityTime * 0.017)).rgb * 2.0 - 1.0;
        vec3 surfaceNormal = normalize(vec3((normalA.r + normalB.r) * 0.42, 1.45, (normalA.g + normalB.g) * 0.42));
        vec3 viewDirection = normalize(cameraPosition - vSityWaterWorldPosition);
        float fresnel = pow(1.0 - clamp(dot(surfaceNormal, viewDirection), 0.0, 1.0), 3.0);
        float ripple = sin(vSityWaterWorldPosition.x * 0.045 + vSityWaterWorldPosition.z * 0.031 + sityTime * 1.2) * 0.5 + 0.5;
        float sunSpecular = pow(max(dot(reflect(-normalize(sunDirection), surfaceNormal), viewDirection), 0.0), 96.0);
        vec3 baseWater = mix(waterColor, deepWaterColor, 0.34 + ripple * 0.1);
        vec3 skyReflection = mix(vec3(0.54, 0.77, 0.88), sunColor, sunSpecular * 0.55);
        vec3 finalColor = mix(baseWater, skyReflection, 0.32 + fresnel * 0.42);
        finalColor += sunColor * sunSpecular * 0.42;
        gl_FragColor = vec4(finalColor, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
    side: THREE.DoubleSide,
    fog: true,
    depthWrite: true,
  });
}

export const sharedSeaWaterMaterial = createSharedSeaWaterMaterial();

export const mainlandMaterial = new THREE.MeshStandardMaterial({
  color: 0x8fb478,
  map: grassTexture,
  roughness: 0.96,
  metalness: 0,
});

export const grassMaterial = new THREE.MeshStandardMaterial({
  color: GRASS_COLOR,
  map: grassTexture,
  roughness: 0.82,
  metalness: 0,
  side: THREE.DoubleSide,
});

export const terrainMicroDisplacementMaterial = new THREE.MeshStandardMaterial({
  color: GRASS_COLOR,
  map: grassTexture,
  roughness: 0.86,
  metalness: 0,
  opacity: MICRO_TERRAIN_OPACITY,
  side: THREE.DoubleSide,
  depthWrite: true,
});

export const terrainCutMaterial = new THREE.MeshStandardMaterial({
  color: 0x68705d,
  map: terrainCutTexture,
  roughness: 0.92,
  metalness: 0,
  side: THREE.DoubleSide,
});

export const beachSandMaterial = new THREE.MeshStandardMaterial({
  color: BEACH_SAND_COLOR,
  map: drySandTexture,
  bumpMap: drySandTexture,
  bumpScale: 0.18,
  roughness: 0.9,
  metalness: 0,
  side: THREE.DoubleSide,
});

export const wetSandMaterial = new THREE.MeshStandardMaterial({
  color: WET_SAND_COLOR,
  map: wetSandTexture,
  bumpMap: wetSandTexture,
  bumpScale: 0.08,
  roughness: 0.84,
  metalness: 0.01,
  side: THREE.DoubleSide,
});

export const shorelineFoamMaterial = new THREE.MeshStandardMaterial({
  color: 0xe9f1e8,
  roughness: 0.72,
  metalness: 0,
  side: THREE.DoubleSide,
});

export const duneSandMaterial = new THREE.MeshStandardMaterial({
  color: 0xc8b577,
  map: drySandTexture,
  bumpMap: drySandTexture,
  bumpScale: 0.2,
  roughness: 0.92,
  metalness: 0,
});

export const beachGrassMaterial = new THREE.MeshStandardMaterial({
  color: 0x6f8f4b,
  map: grassTexture,
  roughness: 0.86,
  metalness: 0,
});

export const reedMaterial = new THREE.MeshStandardMaterial({
  color: 0x597845,
  map: grassTexture,
  roughness: 0.9,
  metalness: 0,
});

export const beachShellMaterial = new THREE.MeshStandardMaterial({
  color: 0xf0e2bc,
  roughness: 0.82,
  metalness: 0,
});

export const woodPierMaterial = new THREE.MeshStandardMaterial({
  color: WOOD_PIER_COLOR,
  map: woodTexture,
  bumpMap: woodTexture,
  bumpScale: 0.12,
  roughness: 0.86,
  metalness: 0,
  side: THREE.DoubleSide,
});

export const concretePortMaterial = new THREE.MeshStandardMaterial({
  color: CONCRETE_PORT_COLOR,
  map: concreteTexture,
  bumpMap: concreteTexture,
  bumpScale: 0.08,
  roughness: 0.82,
  metalness: 0,
  side: THREE.DoubleSide,
});

export const concreteSeamMaterial = new THREE.MeshStandardMaterial({
  color: 0x4d4b45,
  map: darkWearTexture,
  roughness: 0.92,
  metalness: 0,
  transparent: true,
  opacity: 0.62,
});

export const dockMaterial = new THREE.MeshStandardMaterial({
  color: DOCK_COLOR,
  map: woodTexture,
  bumpMap: woodTexture,
  bumpScale: 0.1,
  roughness: 0.78,
  metalness: 0,
});

export const shipHullMaterial = new THREE.MeshStandardMaterial({
  color: SHIP_HULL_COLOR,
  roughness: 0.72,
  metalness: 0.03,
});

export const privateBoatMaterial = new THREE.MeshStandardMaterial({
  color: PRIVATE_BOAT_COLOR,
  roughness: 0.6,
  metalness: 0.02,
});

export const shipCabinMaterial = new THREE.MeshStandardMaterial({
  color: SHIP_CABIN_COLOR,
  roughness: 0.64,
  metalness: 0,
});

export const attractionRedMaterial = new THREE.MeshStandardMaterial({
  color: ATTRACTION_RED_COLOR,
  roughness: 0.58,
  metalness: 0.02,
});

export const attractionBlueMaterial = new THREE.MeshStandardMaterial({
  color: ATTRACTION_BLUE_COLOR,
  roughness: 0.58,
  metalness: 0.02,
});

export const attractionYellowMaterial = new THREE.MeshStandardMaterial({
  color: ATTRACTION_YELLOW_COLOR,
  roughness: 0.58,
  metalness: 0.02,
});

export const beachWhiteMaterial = new THREE.MeshStandardMaterial({
  color: 0xf1eee2,
  roughness: 0.62,
  metalness: 0,
});

export const beachUmbrellaMaterials = [
  attractionRedMaterial,
  attractionBlueMaterial,
  attractionYellowMaterial,
  new THREE.MeshStandardMaterial({ color: 0x5aa184, roughness: 0.58, metalness: 0.01 }),
];

export const beachTowelMaterials = [
  new THREE.MeshStandardMaterial({ color: 0xd75b4d, roughness: 0.82, metalness: 0 }),
  new THREE.MeshStandardMaterial({ color: 0x3f8fc0, roughness: 0.82, metalness: 0 }),
  new THREE.MeshStandardMaterial({ color: 0xf0d06a, roughness: 0.82, metalness: 0 }),
  new THREE.MeshStandardMaterial({ color: 0x77a66a, roughness: 0.82, metalness: 0 }),
];

export const beachFlagMaterial = new THREE.MeshStandardMaterial({
  color: 0xd94d42,
  roughness: 0.62,
  metalness: 0.01,
});

export const beachBinMaterial = new THREE.MeshStandardMaterial({
  color: 0x315f63,
  roughness: 0.74,
  metalness: 0.02,
});

export const highwayAsphaltMaterial = new THREE.MeshStandardMaterial({
  color: HIGHWAY_ASPHALT_COLOR,
  map: asphaltTexture,
  bumpMap: asphaltTexture,
  bumpScale: 0.05,
  roughness: 0.84,
  metalness: 0.02,
  side: THREE.DoubleSide,
});

export const highwaySideMaterial = new THREE.MeshStandardMaterial({
  color: 0x25292a,
  roughness: 0.86,
  metalness: 0.02,
  side: THREE.DoubleSide,
});

export const highwayShoulderMaterial = new THREE.MeshStandardMaterial({
  color: HIGHWAY_SHOULDER_COLOR,
  roughness: 0.86,
  metalness: 0.01,
  side: THREE.DoubleSide,
});

export const highwayMedianMaterial = new THREE.MeshStandardMaterial({
  color: HIGHWAY_MEDIAN_COLOR,
  map: concreteTexture,
  roughness: 0.88,
  metalness: 0,
  side: THREE.DoubleSide,
});

export const highwayTireWearMaterial = new THREE.MeshStandardMaterial({
  color: 0x2c3031,
  roughness: 0.9,
  metalness: 0,
  transparent: true,
  opacity: 0.42,
  side: THREE.DoubleSide,
});

export const roadCrackMaterial = new THREE.MeshStandardMaterial({
  color: 0x1f2221,
  map: darkWearTexture,
  roughness: 0.94,
  metalness: 0,
  transparent: true,
  opacity: 0.68,
  side: THREE.DoubleSide,
});

export const roadDrainMaterial = new THREE.MeshStandardMaterial({
  color: 0x2a2f31,
  roughness: 0.78,
  metalness: 0.08,
  side: THREE.DoubleSide,
});

export const roadMarkingWhiteMaterial = new THREE.MeshStandardMaterial({
  color: ROAD_MARKING_WHITE_COLOR,
  roughness: 0.55,
  metalness: 0,
  side: THREE.DoubleSide,
});

export const roadMarkingYellowMaterial = new THREE.MeshStandardMaterial({
  color: ROAD_MARKING_YELLOW_COLOR,
  roughness: 0.55,
  metalness: 0,
  side: THREE.DoubleSide,
});

export const roadStructureConcreteMaterial = new THREE.MeshStandardMaterial({
  color: 0x9e9c91,
  map: concreteTexture,
  bumpMap: concreteTexture,
  bumpScale: 0.06,
  roughness: 0.78,
  metalness: 0.02,
  side: THREE.DoubleSide,
});

export const bridgeSteelMaterial = new THREE.MeshStandardMaterial({
  color: 0x2d3437,
  map: metalTexture,
  roughness: 0.58,
  metalness: 0.24,
});

export const bridgeCableMaterial = new THREE.MeshStandardMaterial({
  color: 0x596368,
  map: metalTexture,
  roughness: 0.42,
  metalness: 0.42,
});

export const tunnelOpeningMaterial = new THREE.MeshStandardMaterial({
  color: 0x17191a,
  roughness: 0.95,
  metalness: 0,
  side: THREE.DoubleSide,
});

export const rubberFenderMaterial = new THREE.MeshStandardMaterial({
  color: 0x171a1a,
  roughness: 0.78,
  metalness: 0,
});

export const safetySignMaterial = new THREE.MeshStandardMaterial({
  color: 0x2d7fa6,
  roughness: 0.62,
  metalness: 0.03,
});

export const contactShadowMaterial = new THREE.MeshBasicMaterial({
  color: 0x111412,
  transparent: true,
  opacity: 0.18,
  depthWrite: false,
  side: THREE.DoubleSide,
});

export const cargoContainerMaterials = [
  new THREE.MeshStandardMaterial({ color: 0xa94f3f, roughness: 0.78, metalness: 0.05 }),
  new THREE.MeshStandardMaterial({ color: 0x3f6f93, roughness: 0.78, metalness: 0.05 }),
  new THREE.MeshStandardMaterial({ color: 0xd1a44f, roughness: 0.78, metalness: 0.05 }),
  new THREE.MeshStandardMaterial({ color: 0x6a7a54, roughness: 0.78, metalness: 0.05 }),
];

export const portCraneMaterial = new THREE.MeshStandardMaterial({
  color: 0xe0b34f,
  roughness: 0.62,
  metalness: 0.05,
});

export const mountainMaterial = new THREE.MeshStandardMaterial({
  roughness: 0.92,
  metalness: 0,
  vertexColors: true,
  side: THREE.DoubleSide,
});

export const mountainCutMaterial = new THREE.MeshStandardMaterial({
  color: 0x6f6b61,
  map: terrainCutTexture,
  bumpMap: terrainCutTexture,
  bumpScale: 0.16,
  roughness: 0.94,
  metalness: 0,
  side: THREE.DoubleSide,
});

export const mountainRidgeMaterial = new THREE.MeshStandardMaterial({
  color: 0x8a836d,
  roughness: 0.96,
  metalness: 0,
});

export const snowPatchMaterial = new THREE.MeshStandardMaterial({
  color: SNOW_COLOR,
  roughness: 0.68,
  metalness: 0,
  side: THREE.DoubleSide,
});

export const smallRockMaterial = new THREE.MeshStandardMaterial({
  color: 0x77715f,
  map: terrainCutTexture,
  roughness: 0.94,
  metalness: 0,
});

export const smallPebbleMaterial = new THREE.MeshStandardMaterial({
  color: 0x9b927c,
  map: terrainCutTexture,
  roughness: 0.95,
  metalness: 0,
});

export const lowlandScrubMaterial = new THREE.MeshStandardMaterial({
  color: 0x5f7f45,
  map: grassTexture,
  roughness: 0.9,
  metalness: 0,
});

export const lowlandDryGrassMaterial = new THREE.MeshStandardMaterial({
  color: 0x8a9a55,
  map: grassTexture,
  roughness: 0.92,
  metalness: 0,
});

export const riverBankMaterial = new THREE.MeshStandardMaterial({
  roughness: 0.9,
  metalness: 0,
  vertexColors: true,
  side: THREE.DoubleSide,
});

export const damMaterial = new THREE.MeshStandardMaterial({
  color: 0x8d8f8a,
  map: concreteTexture,
  bumpMap: concreteTexture,
  bumpScale: 0.08,
  roughness: 0.78,
  metalness: 0.02,
});

export const terrainGrassColor = new THREE.Color(GRASS_COLOR);

export const mountainLowColor = new THREE.Color(MOUNTAIN_LOW_COLOR);

export const mountainMidColor = new THREE.Color(MOUNTAIN_MID_COLOR);

export const mountainHighColor = new THREE.Color(MOUNTAIN_HIGH_COLOR);

export const snowColor = new THREE.Color(SNOW_COLOR);

export const snowShadowColor = new THREE.Color(SNOW_SHADOW_COLOR);

export const riverBankOuterColor = new THREE.Color(GRASS_COLOR);

export const riverBankCrestColor = new THREE.Color(0x7d9c62);

export const riverBankWetColor = new THREE.Color(0x67715b);

export let terrainSplatShaderInstalled = false;

export let mountainSurfaceShaderInstalled = false;




export function installTerrainSplatShader(material: THREE.MeshStandardMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vSityWorldPosition;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvSityWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vSityWorldPosition;
float sityTerrainNoise(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float sityTerrainValueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = sityTerrainNoise(i);
  float b = sityTerrainNoise(i + vec2(1.0, 0.0));
  float c = sityTerrainNoise(i + vec2(0.0, 1.0));
  float d = sityTerrainNoise(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}`,
      )
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
float sityMacro = sityTerrainValueNoise(vSityWorldPosition.xz * 0.0045);
float sityFine = sityTerrainValueNoise(vSityWorldPosition.xz * 0.026);
float sityCoastalDryness = smoothstep(520.0, 900.0, vSityWorldPosition.x);
float sityPatch = smoothstep(0.42, 0.78, sityMacro * 0.72 + sityFine * 0.28);
vec3 sityDryGrass = vec3(0.56, 0.67, 0.39);
vec3 sityMeadow = vec3(0.39, 0.58, 0.30);
vec3 sitySoil = vec3(0.47, 0.43, 0.31);
diffuseColor.rgb = mix(diffuseColor.rgb, sityMeadow, 0.18);
diffuseColor.rgb = mix(diffuseColor.rgb, sityDryGrass, sityPatch * 0.22);
diffuseColor.rgb = mix(diffuseColor.rgb, sitySoil, sityCoastalDryness * sityPatch * 0.16);`,
      );
  };
  material.needsUpdate = true;
  terrainSplatShaderInstalled = true;
}

export function installMountainSurfaceShader(material: THREE.MeshStandardMaterial) {
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vSityMountainWorldPosition;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvSityMountainWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vSityMountainWorldPosition;
float sityMountainNoise(vec2 p) {
  return fract(sin(dot(p, vec2(41.7, 289.3))) * 21943.331);
}
float sityMountainValueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = sityMountainNoise(i);
  float b = sityMountainNoise(i + vec2(1.0, 0.0));
  float c = sityMountainNoise(i + vec2(0.0, 1.0));
  float d = sityMountainNoise(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float sityElevationBand = fract(vSityMountainWorldPosition.y * 0.013 + sityMountainValueNoise(vSityMountainWorldPosition.xz * 0.014) * 0.34);
float sityStrata = smoothstep(0.48, 0.64, sityElevationBand) * (1.0 - smoothstep(0.72, 0.94, sityElevationBand));
float sityVerticalStain = smoothstep(0.62, 0.94, sityMountainValueNoise(vec2(vSityMountainWorldPosition.x * 0.018, vSityMountainWorldPosition.y * 0.028)));
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.78, 0.76, 0.71), sityStrata * 0.17);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.34, 0.32, 0.28), sityVerticalStain * 0.08);`,
      );
  };
  material.needsUpdate = true;
  mountainSurfaceShaderInstalled = true;
}

installTerrainSplatShader(grassMaterial);

installTerrainSplatShader(terrainMicroDisplacementMaterial);

installMountainSurfaceShader(mountainMaterial);

export const sidewalkMaterial = new THREE.MeshStandardMaterial({
  color: 0xc4c0b6,
  map: concreteTexture,
  bumpMap: concreteTexture,
  bumpScale: 0.03,
  roughness: 0.92,
  metalness: 0.0,
});

export const kerbMaterial = new THREE.MeshStandardMaterial({
  color: 0x8e8c86,
  roughness: 0.9,
  metalness: 0.0,
});

export const medianGrassMaterial = new THREE.MeshStandardMaterial({
  color: 0x6f9c52,
  map: grassTexture,
  roughness: 0.95,
  metalness: 0.0,
});

export const guardrailMaterial = new THREE.MeshStandardMaterial({
  color: 0xa7adb1,
  map: metalTexture,
  roughness: 0.42,
  metalness: 0.72,
});

export const lampPoleMaterial = new THREE.MeshStandardMaterial({
  color: 0x5d6368,
  roughness: 0.55,
  metalness: 0.65,
});

export const lampHeadMaterial = new THREE.MeshStandardMaterial({
  color: 0xe4e8e2,
  emissive: 0x3a3f36,
  roughness: 0.5,
  metalness: 0.2,
});

export const signalHeadMaterial = new THREE.MeshStandardMaterial({
  color: 0x24272a,
  roughness: 0.6,
  metalness: 0.3,
});

export const signalLensDarkMaterial = new THREE.MeshStandardMaterial({
  color: 0x1d1f21,
  roughness: 0.4,
  metalness: 0.1,
});

export const signalLensRedMaterial = new THREE.MeshStandardMaterial({
  color: 0xff3b2f,
  emissive: 0xff2a1a,
  emissiveIntensity: 1.6,
  roughness: 0.3,
});

export const signalLensGreenMaterial = new THREE.MeshStandardMaterial({
  color: 0x36e07a,
  emissive: 0x1fd465,
  emissiveIntensity: 1.5,
  roughness: 0.3,
});

export const signPoleMaterial = new THREE.MeshStandardMaterial({
  color: 0x8d9296,
  roughness: 0.5,
  metalness: 0.6,
});

export const pierConcreteMaterial = new THREE.MeshStandardMaterial({
  color: 0xa5a29a,
  map: concreteTexture,
  bumpMap: concreteTexture,
  bumpScale: 0.04,
  roughness: 0.88,
  metalness: 0.02,
});

export const gravelVergeMaterial = new THREE.MeshStandardMaterial({
  color: 0x8f9276,
  roughness: 0.96,
  metalness: 0.0,
});

export function createSignTexture(kind: "stop" | "yield" | "speed30" | "speed50" | "noentry") {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    return new THREE.Texture();
  }
  context.clearRect(0, 0, size, size);
  const center = size / 2;
  if (kind === "stop") {
    context.fillStyle = "#c8232c";
    context.beginPath();
    for (let index = 0; index < 8; index += 1) {
      const angle = Math.PI / 8 + (index * Math.PI) / 4;
      const x = center + Math.cos(angle) * 60;
      const y = center + Math.sin(angle) * 60;
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.closePath();
    context.fill();
    context.strokeStyle = "#ffffff";
    context.lineWidth = 5;
    context.stroke();
    context.fillStyle = "#ffffff";
    context.font = "bold 40px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("STOP", center, center + 2);
  } else if (kind === "yield") {
    context.fillStyle = "#c8232c";
    context.beginPath();
    context.moveTo(6, 14);
    context.lineTo(size - 6, 14);
    context.lineTo(center, size - 8);
    context.closePath();
    context.fill();
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.moveTo(24, 24);
    context.lineTo(size - 24, 24);
    context.lineTo(center, size - 30);
    context.closePath();
    context.fill();
  } else if (kind === "noentry") {
    context.fillStyle = "#c8232c";
    context.beginPath();
    context.arc(center, center, 60, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#ffffff";
    context.fillRect(24, center - 12, size - 48, 24);
  } else {
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.arc(center, center, 60, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#c8232c";
    context.lineWidth = 12;
    context.beginPath();
    context.arc(center, center, 54, 0, Math.PI * 2);
    context.stroke();
    context.fillStyle = "#111111";
    context.font = "bold 52px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(kind === "speed30" ? "30" : "50", center, center + 3);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export const signMaterials = {
  stop: new THREE.MeshStandardMaterial({ map: createSignTexture("stop"), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 }),
  yield: new THREE.MeshStandardMaterial({ map: createSignTexture("yield"), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 }),
  speed30: new THREE.MeshStandardMaterial({ map: createSignTexture("speed30"), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 }),
  speed50: new THREE.MeshStandardMaterial({ map: createSignTexture("speed50"), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 }),
  noentry: new THREE.MeshStandardMaterial({ map: createSignTexture("noentry"), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 }),
};

export const talusRockMaterial = new THREE.MeshStandardMaterial({
  color: 0x9a9384,
  map: terrainCutTexture,
  roughness: 0.94,
  metalness: 0,
});

export const embankmentMaterial = new THREE.MeshStandardMaterial({
  color: 0x7f9d5c,
  map: grassTexture,
  roughness: 0.96,
  metalness: 0,
  side: THREE.DoubleSide,
});
