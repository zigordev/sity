import * as THREE from "three";
import { artificialElements, cityElements, naturalElements, roadElements, vegetationElements } from "./context";

function triangleCountForGeometry(geometry: THREE.BufferGeometry) {
  const index = geometry.getIndex();
  const position = geometry.getAttribute("position");
  if (index) {
    return Math.floor(index.count / 3);
  }
  return position ? Math.floor(position.count / 3) : 0;
}

function materialDrawCallCount(mesh: THREE.Mesh) {
  if (Array.isArray(mesh.material)) {
    return Math.max(mesh.geometry.groups.length, mesh.material.length, 1);
  }
  return 1;
}

export function estimateSceneRenderStats(object: THREE.Object3D): { drawCalls: number; triangles: number } {
  if (!object.visible) {
    return { drawCalls: 0, triangles: 0 };
  }
  if (object instanceof THREE.LOD) {
    const highDetail = object.levels[0]?.object;
    return highDetail ? estimateSceneRenderStats(highDetail) : { drawCalls: 0, triangles: 0 };
  }
  if (object instanceof THREE.InstancedMesh) {
    return {
      drawCalls: materialDrawCallCount(object),
      triangles: triangleCountForGeometry(object.geometry) * object.count,
    };
  }
  if (object instanceof THREE.Mesh) {
    return {
      drawCalls: materialDrawCallCount(object),
      triangles: triangleCountForGeometry(object.geometry),
    };
  }
  if (object instanceof THREE.LineSegments || object instanceof THREE.Line) {
    return { drawCalls: 1, triangles: 0 };
  }
  return object.children.reduce(
    (total, child) => {
      const childStats = estimateSceneRenderStats(child);
      total.drawCalls += childStats.drawCalls;
      total.triangles += childStats.triangles;
      return total;
    },
    { drawCalls: 0, triangles: 0 },
  );
}

export function estimateVisibleSceneRenderStats() {
  const groups = [naturalElements, artificialElements, roadElements, cityElements, vegetationElements];
  return groups.reduce(
    (total, group) => {
      const stats = estimateSceneRenderStats(group);
      total.drawCalls += stats.drawCalls;
      total.triangles += stats.triangles;
      return total;
    },
    { drawCalls: 0, triangles: 0 },
  );
}
