import { buildLotBuildings, buildingFootprints, footprintCorners, type BuildingFootprint } from "./buildings";
import { corridorClearance, registerZone } from "../world/occupancy";
import { DISTRICTS } from "./districts";
import { buildSpecialBlocks } from "./landmarks";
import { generateLots, markSpecialBlocks } from "./lots";
import {
  commitTrees,
  placeCoastPalms,
  placeForest,
  placeGardenTrees,
  placeLowlandMeadowTrees,
  placeParkTrees,
  placeRiversideTrees,
  placeSpecialBlockTrees,
  placeStreetTrees,
} from "./vegetation";
import { SPECIAL_BLOCKS } from "./districts";

export const cityStats = {
  lotCount: 0,
  buildingCount: 0,
  treeCount: 0,
  forestTreeCount: 0,
  specialBlockCount: SPECIAL_BLOCKS.length,
};

export function registerCityZones() {
  for (const district of DISTRICTS) {
    registerZone({ minX: district.minX, maxX: district.maxX, minZ: district.minZ, maxZ: district.maxZ, tag: `district:${district.kind}` });
  }
  for (const block of SPECIAL_BLOCKS) {
    registerZone({ minX: block.minX, maxX: block.maxX, minZ: block.minZ, maxZ: block.maxZ, tag: `block:${block.id}` });
  }
}

function projectPolygon(points: Array<{ x: number; z: number }>, axis: { x: number; z: number }) {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const point of points) {
    const value = point.x * axis.x + point.z * axis.z;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  return { min, max };
}

function footprintsOverlap(a: BuildingFootprint, b: BuildingFootprint, tolerance = 0.25) {
  const cornersA = footprintCorners(a);
  const cornersB = footprintCorners(b);
  const axes = [a.rotationY, a.rotationY + Math.PI / 2, b.rotationY, b.rotationY + Math.PI / 2].map((angle) => ({ x: Math.cos(angle), z: -Math.sin(angle) }));
  for (const axis of axes) {
    const pa = projectPolygon(cornersA, axis);
    const pb = projectPolygon(cornersB, axis);
    if (pa.max <= pb.min + tolerance || pb.max <= pa.min + tolerance) {
      return false;
    }
  }
  return true;
}

export function auditCity() {
  const pairs: string[] = [];
  const onPavement: string[] = [];
  for (let i = 0; i < buildingFootprints.length; i += 1) {
    const a = buildingFootprints[i];
    for (let j = i + 1; j < buildingFootprints.length; j += 1) {
      const b = buildingFootprints[j];
      if (a.group === b.group) {
        continue;
      }
      if (Math.hypot(a.x - b.x, a.z - b.z) > (a.width + a.depth + b.width + b.depth) * 0.5) {
        continue;
      }
      if (footprintsOverlap(a, b)) {
        pairs.push(`${a.group}|${b.group}`);
      }
    }
    const corners = footprintCorners(a);
    let hit: string | undefined;
    for (let edge = 0; edge < 4 && !hit; edge += 1) {
      const from = corners[edge];
      const to = corners[(edge + 1) % 4];
      const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) / 2));
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const x = from.x + (to.x - from.x) * t;
        const z = from.z + (to.z - from.z) * t;
        if (corridorClearance(x, z, 40, "pavement:") < -0.2) {
          hit = `${a.group}@${x.toFixed(0)},${z.toFixed(0)}`;
          break;
        }
      }
    }
    if (hit) {
      onPavement.push(hit);
    }
  }
  return {
    footprintCount: buildingFootprints.length,
    overlappingPairs: pairs,
    buildingsOnPavement: onPavement,
  };
}

export function addCity() {
  markSpecialBlocks();
  const lots = generateLots();
  cityStats.lotCount = lots.length;
  cityStats.buildingCount = buildLotBuildings(lots);
  buildSpecialBlocks();
  placeStreetTrees();
  placeGardenTrees(lots);
  placeRiversideTrees();
  placeSpecialBlockTrees();
  placeCoastPalms();
  placeLowlandMeadowTrees();
  cityStats.forestTreeCount = placeForest();
  cityStats.treeCount = commitTrees();
  void placeParkTrees;
}
