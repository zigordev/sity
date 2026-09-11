import * as THREE from "three";
import { mergeAll } from "../roads/geometry";

export class MaterialBatch {
  private readonly parts = new Map<THREE.Material, { geometries: THREE.BufferGeometry[]; castShadow: boolean }>();

  constructor(
    private readonly parent: THREE.Object3D,
    private readonly namePrefix: string,
  ) {}

  add(material: THREE.Material, geometries: THREE.BufferGeometry | THREE.BufferGeometry[], castShadow = true) {
    const list = Array.isArray(geometries) ? geometries : [geometries];
    const entry = this.parts.get(material);
    if (entry) {
      entry.geometries.push(...list);
      entry.castShadow = entry.castShadow || castShadow;
    } else {
      this.parts.set(material, { geometries: [...list], castShadow });
    }
  }

  commit() {
    let index = 0;
    for (const [material, entry] of this.parts) {
      const merged = mergeAll(entry.geometries);
      if (!merged) {
        continue;
      }
      index += 1;
      const mesh = new THREE.Mesh(merged, material);
      mesh.name = `${this.namePrefix}-${material.name || "material"}-${index}`;
      mesh.castShadow = entry.castShadow;
      mesh.receiveShadow = true;
      this.parent.add(mesh);
    }
    this.parts.clear();
  }
}
