import * as THREE from "three";
import { ASSET_MANIFEST_URL, SEA_Y } from "../config/constants";
import { artificialElements, gltfLoader, renderer, textureLoader } from "../render/context";
import { mainlandMaterial, beachGrassMaterial, beachSandMaterial, bridgeCableMaterial, bridgeSteelMaterial, concretePortMaterial, damMaterial, dockMaterial, duneSandMaterial, grassMaterial, highwayAsphaltMaterial, lowlandDryGrassMaterial, lowlandScrubMaterial, mountainCutMaterial, portCraneMaterial, reedMaterial, roadStructureConcreteMaterial, smallPebbleMaterial, smallRockMaterial, terrainCutMaterial, terrainMicroDisplacementMaterial, wetSandMaterial, woodPierMaterial } from "../render/materials";

export const TEXTURE_ASSET_KEYS = [
  "grass_meadow_albedo",
  "asphalt_aggregate_albedo",
  "concrete_weathered_albedo",
  "sand_dry_albedo",
  "sand_wet_albedo",
  "rock_strata_albedo",
  "wood_planks_albedo",
  "sea_ripple_albedo",
  "metal_worn_albedo",
] as const;

export const IMPORTED_MODEL_KINDS = ["cargoShip", "privateBoat"] as const;

export type ImportedModelKind = (typeof IMPORTED_MODEL_KINDS)[number];

export type AssetManifest = {
  version: number;
  units: "meters";
  renderer: "three.js";
  compressionReady: string[];
  decoders?: {
    basis?: string;
    draco?: string;
    meshopt?: string;
  };
  models: Record<ImportedModelKind, string>;
  textures: Record<string, string>;
  pbrTextures?: Record<string, {
    albedo: string;
    normal: string;
    orm: string;
  }>;
};

export type TextureAssetTarget = {
  material: THREE.MeshStandardMaterial;
  repeatX: number;
  repeatY: number;
  useAsBump?: boolean;
  normalScale?: number;
  useOrm?: boolean;
};

export type ImportedModelAnchor = {
  kind: ImportedModelKind;
  name: string;
  position: THREE.Vector3;
  rotationY: number;
  scale: number;
  fallback: THREE.Object3D;
};

export let assetManifestLoaded = false;

export let decoderRuntimeAssetsAvailable = false;

export let assetLoadComplete = false;

export let importedModelInstanceCount = 0;

export let pbrTextureMapCount = 0;

export const loadedTextureAssetKeys = new Set<string>();

export const importedModelSources = new Map<ImportedModelKind, THREE.Object3D>();

export const importedModelAnchors: ImportedModelAnchor[] = [];

export const assetLoadFailures: string[] = [];

export const textureAssetTargets: Record<(typeof TEXTURE_ASSET_KEYS)[number], TextureAssetTarget[]> = {
  grass_meadow_albedo: [
    { material: grassMaterial, repeatX: 34, repeatY: 34 },
    { material: terrainMicroDisplacementMaterial, repeatX: 34, repeatY: 34 },
    { material: mainlandMaterial, repeatX: 220, repeatY: 220 },
    { material: beachGrassMaterial, repeatX: 18, repeatY: 18 },
    { material: reedMaterial, repeatX: 18, repeatY: 18 },
    { material: lowlandScrubMaterial, repeatX: 18, repeatY: 18 },
    { material: lowlandDryGrassMaterial, repeatX: 18, repeatY: 18 },
  ],
  asphalt_aggregate_albedo: [
    { material: highwayAsphaltMaterial, repeatX: 36, repeatY: 36, useAsBump: true },
  ],
  concrete_weathered_albedo: [
    { material: concretePortMaterial, repeatX: 16, repeatY: 16, useAsBump: true },
    { material: roadStructureConcreteMaterial, repeatX: 14, repeatY: 14, useAsBump: true },
    { material: damMaterial, repeatX: 12, repeatY: 12, useAsBump: true },
  ],
  sand_dry_albedo: [
    { material: beachSandMaterial, repeatX: 26, repeatY: 26, useAsBump: true },
    { material: duneSandMaterial, repeatX: 22, repeatY: 22, useAsBump: true },
  ],
  sand_wet_albedo: [
    { material: wetSandMaterial, repeatX: 18, repeatY: 18, useAsBump: true },
  ],
  rock_strata_albedo: [
    { material: terrainCutMaterial, repeatX: 18, repeatY: 18, useAsBump: true },
    { material: mountainCutMaterial, repeatX: 16, repeatY: 16, useAsBump: true },
    { material: smallRockMaterial, repeatX: 10, repeatY: 10 },
    { material: smallPebbleMaterial, repeatX: 10, repeatY: 10 },
  ],
  wood_planks_albedo: [
    { material: woodPierMaterial, repeatX: 10, repeatY: 8, useAsBump: true },
    { material: dockMaterial, repeatX: 10, repeatY: 8, useAsBump: true },
  ],
  sea_ripple_albedo: [
  ],
  metal_worn_albedo: [
    { material: bridgeSteelMaterial, repeatX: 10, repeatY: 10 },
    { material: bridgeCableMaterial, repeatX: 8, repeatY: 8 },
    { material: portCraneMaterial, repeatX: 8, repeatY: 8 },
  ],
};

export function configureTextureAsset(texture: THREE.Texture, repeatX: number, repeatY: number, colorSpace: THREE.ColorSpace) {
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  texture.needsUpdate = true;
}

export function applyTextureAsset(
  textureKey: (typeof TEXTURE_ASSET_KEYS)[number],
  sourceTexture: THREE.Texture,
  normalTexture?: THREE.Texture,
  ormTexture?: THREE.Texture,
) {
  for (const target of textureAssetTargets[textureKey]) {
    const colorMap = sourceTexture.clone();
    colorMap.name = `asset-${textureKey}-color`;
    configureTextureAsset(colorMap, target.repeatX, target.repeatY, THREE.SRGBColorSpace);
    target.material.map = colorMap;
    pbrTextureMapCount += 1;

    if (normalTexture) {
      const normalMap = normalTexture.clone();
      normalMap.name = `asset-${textureKey}-normal`;
      configureTextureAsset(normalMap, target.repeatX, target.repeatY, THREE.NoColorSpace);
      target.material.normalMap = normalMap;
      target.material.normalScale.setScalar(target.normalScale ?? 0.42);
      pbrTextureMapCount += 1;
    } else if (target.useAsBump) {
      const bumpMap = sourceTexture.clone();
      bumpMap.name = `asset-${textureKey}-fallback-bump`;
      configureTextureAsset(bumpMap, target.repeatX, target.repeatY, THREE.NoColorSpace);
      target.material.bumpMap = bumpMap;
      pbrTextureMapCount += 1;
    }

    if (ormTexture && target.useOrm !== false) {
      const roughnessMap = ormTexture.clone();
      roughnessMap.name = `asset-${textureKey}-orm-roughness`;
      configureTextureAsset(roughnessMap, target.repeatX, target.repeatY, THREE.NoColorSpace);
      target.material.roughnessMap = roughnessMap;
      pbrTextureMapCount += 1;

      if (target.material.metalness > 0.02) {
        const metalnessMap = ormTexture.clone();
        metalnessMap.name = `asset-${textureKey}-orm-metalness`;
        configureTextureAsset(metalnessMap, target.repeatX, target.repeatY, THREE.NoColorSpace);
        target.material.metalnessMap = metalnessMap;
        pbrTextureMapCount += 1;
      }
    }

    target.material.needsUpdate = true;
  }
}

export async function loadAssetManifest() {
  const response = await fetch(ASSET_MANIFEST_URL);

  if (!response.ok) {
    throw new Error(`Could not load ${ASSET_MANIFEST_URL}: ${response.status}`);
  }

  const manifest = (await response.json()) as AssetManifest;
  assetManifestLoaded = manifest.units === "meters" && manifest.renderer === "three.js";
  decoderRuntimeAssetsAvailable = Boolean(
    manifest.decoders?.basis &&
      manifest.decoders.draco &&
      manifest.decoders.meshopt &&
      manifest.compressionReady.includes("ktx2") &&
      manifest.compressionReady.includes("draco") &&
      manifest.compressionReady.includes("meshopt"),
  );
  return manifest;
}

export async function loadTextureAssetPack(manifest: AssetManifest) {
  pbrTextureMapCount = 0;
  await Promise.all(
    TEXTURE_ASSET_KEYS.map(async (textureKey) => {
      const pbrSet = manifest.pbrTextures?.[textureKey];
      const url = pbrSet?.albedo ?? manifest.textures[textureKey];

      if (!url) {
        assetLoadFailures.push(`missing-texture:${textureKey}`);
        return;
      }

      try {
        const [texture, normalTexture, ormTexture] = await Promise.all([
          textureLoader.loadAsync(url),
          pbrSet?.normal ? textureLoader.loadAsync(pbrSet.normal) : Promise.resolve(undefined),
          pbrSet?.orm ? textureLoader.loadAsync(pbrSet.orm) : Promise.resolve(undefined),
        ]);
        texture.name = `loaded-${textureKey}`;
        if (normalTexture) {
          normalTexture.name = `loaded-${textureKey}-normal`;
        }
        if (ormTexture) {
          ormTexture.name = `loaded-${textureKey}-orm`;
        }
        applyTextureAsset(textureKey, texture, normalTexture, ormTexture);
        loadedTextureAssetKeys.add(textureKey);
      } catch (error) {
        assetLoadFailures.push(`texture:${textureKey}:${error instanceof Error ? error.message : String(error)}`);
      }
    }),
  );
}

export function configureImportedModel(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (material instanceof THREE.MeshStandardMaterial && material.map) {
          material.map.colorSpace = THREE.SRGBColorSpace;
          material.map.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
          material.needsUpdate = true;
        }
      }
    }
  });
}

export async function loadImportedModelSources(manifest: AssetManifest) {
  await Promise.all(
    IMPORTED_MODEL_KINDS.map(async (kind) => {
      const url = manifest.models[kind];

      if (!url) {
        assetLoadFailures.push(`missing-model:${kind}`);
        return;
      }

      try {
        const gltf = await gltfLoader.loadAsync(url);
        gltf.scene.name = `imported-source-${kind}`;
        configureImportedModel(gltf.scene);
        importedModelSources.set(kind, gltf.scene);
      } catch (error) {
        assetLoadFailures.push(`model:${kind}:${error instanceof Error ? error.message : String(error)}`);
      }
    }),
  );
}

export function queueImportedModelReplacement(
  kind: ImportedModelKind,
  name: string,
  x: number,
  z: number,
  fallback: THREE.Object3D,
  scale = 1,
  rotationY = 0,
) {
  importedModelAnchors.push({
    kind,
    name,
    position: new THREE.Vector3(x, SEA_Y, z),
    rotationY,
    scale,
    fallback,
  });
}

export function instantiateImportedModels() {
  importedModelInstanceCount = 0;

  for (const anchor of importedModelAnchors) {
    const source = importedModelSources.get(anchor.kind);

    if (!source) {
      continue;
    }

    const model = source.clone(true);
    model.name = `${anchor.name}-imported-gltf`;
    model.position.copy(anchor.position);
    model.rotation.y = anchor.rotationY;
    model.scale.setScalar(anchor.scale);
    configureImportedModel(model);
    artificialElements.add(model);
    anchor.fallback.visible = false;
    importedModelInstanceCount += 1;
  }
}

export async function startImportedAssetPipeline() {
  try {
    const manifest = await loadAssetManifest();
    await Promise.all([loadTextureAssetPack(manifest), loadImportedModelSources(manifest)]);
    instantiateImportedModels();
  } catch (error) {
    assetLoadFailures.push(error instanceof Error ? error.message : String(error));
  } finally {
    assetLoadComplete = true;
  }
}
