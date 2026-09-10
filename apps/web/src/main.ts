import "./style.css";
import "./debug";
import { startImportedAssetPipeline } from "./assets/pipeline";
import { addLowlandGroundCover, addNaturalRockClusters, addSimpleMainlandCoast } from "./natural/coast";
import { addDam, addDamAbutments, addDamDetail, addDamSideShoreClosures } from "./natural/dam";
import { addClippedMountain, addMainBoundarySurface, addMainlandOutsideBoundary, addMicroDisplacedGrassTerrain, addMountainFoothillBlend, addMountainStrataRidges, addMountainTalusFields, addSnowCapOverlay, addSnowCappedMountain } from "./natural/terrain";
import { addCoastalEstuary, addCoastalEstuaryBanks, addCoastalShallowWaterShelf, addNaturalDetailPass, addReservoirBasin, addReservoirLake, addRiver, addRiverChannelBanks, addSurroundingShaderSea } from "./natural/water";
import { animationClock, camera, composer, controls } from "./render/context";
import { sharedSeaWaterMaterial } from "./render/materials";
import { addRoadNetworkMeshes } from "./roads/render";
import { addCity, registerCityZones } from "./city";
import "./roads/build";
import { updateAxisScale, updateCategoryVisibility, updateCompass } from "./ui/overlays";
import { flyToViewId, initPanel, updateCameraFlight } from "./ui/panel";

addSurroundingShaderSea();

addCoastalShallowWaterShelf();

addMainlandOutsideBoundary();

addMainBoundarySurface();

registerCityZones();

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

addRoadNetworkMeshes();

addCity();

updateCategoryVisibility();
initPanel();
flyToViewId("overview", true);

window.__SITY_ASSETS_READY__ = startImportedAssetPipeline();

export function updateDepthRange() {
  const distance = camera.position.distanceTo(controls.target);
  const near = Math.min(30, Math.max(0.6, distance * 0.006));
  if (Math.abs(camera.near - near) > near * 0.05) {
    camera.near = near;
    camera.updateProjectionMatrix();
  }
}

export function animate() {
  const elapsedSeconds = animationClock.getElapsedTime();
  sharedSeaWaterMaterial.uniforms.sityTime.value = elapsedSeconds;
  updateCameraFlight();
  controls.update();
  updateDepthRange();
  updateCompass();
  updateAxisScale();
  composer.render();
  requestAnimationFrame(animate);
}

animate();
