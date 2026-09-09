import { buildLotBuildings } from "./buildings";
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
