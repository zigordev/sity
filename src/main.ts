import "./style.css";
import "./debug";
import { startImportedAssetPipeline } from "./assets/pipeline";
import { addLowlandGroundCover, addNaturalRockClusters, addSimpleMainlandCoast } from "./natural/coast";
import { addDam, addDamAbutments, addDamDetail, addDamSideShoreClosures } from "./natural/dam";
import { addClippedMountain, addMainBoundarySurface, addMainlandOutsideBoundary, addMicroDisplacedGrassTerrain, addMountainFoothillBlend, addMountainStrataRidges, addMountainTalusFields, addSnowCapOverlay, addSnowCappedMountain } from "./natural/terrain";
import { addCoastalEstuary, addCoastalEstuaryBanks, addCoastalShallowWaterShelf, addNaturalDetailPass, addReservoirBasin, addReservoirLake, addRiver, addRiverChannelBanks, addSurroundingShaderSea } from "./natural/water";
import { animationClock, composer, controls } from "./render/context";
import { sharedSeaWaterMaterial } from "./render/materials";
import { addHighwayLoopRoadNetwork } from "./roads/legacyHighway";
import { updateAxisScale, updateCompass } from "./ui/overlays";

addSurroundingShaderSea();

addCoastalShallowWaterShelf();

addMainlandOutsideBoundary();

addMainBoundarySurface();

addMicroDisplacedGrassTerrain();

addSimpleMainlandCoast();

addNaturalRockClusters();

addLowlandGroundCover();

addNaturalDetailPass();

addMountainFoothillBlend();

addClippedMountain();

addSnowCappedMountain();

addSnowCapOverlay();

addMountainStrataRidges();

addMountainTalusFields();

addReservoirBasin();

addDamSideShoreClosures();

addReservoirLake();

addDamAbutments();

addDam();

addDamDetail();

addRiverChannelBanks();

addCoastalEstuaryBanks();

addRiver();

addCoastalEstuary();

addHighwayLoopRoadNetwork();

window.__SITY_ASSETS_READY__ = startImportedAssetPipeline();

export function animate() {
  const elapsedSeconds = animationClock.getElapsedTime();
  sharedSeaWaterMaterial.uniforms.sityTime.value = elapsedSeconds;
  controls.update();
  updateCompass();
  updateAxisScale();
  composer.render();
  requestAnimationFrame(animate);
}

animate();
