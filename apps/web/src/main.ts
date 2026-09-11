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
import { PavementFloor } from "./roads/pavement";
import { addCity, registerCityZones } from "./city";
import { addCountryside } from "./city/countryside";
import { addRailway, registerRailwayCorridors } from "./rail/railway";
import { addStreams, registerStreamCuts } from "./natural/streams";
import { addParkedVehicles } from "./vehicles/parked";
import "./roads/build";
import { updateAxisScale, updateCategoryVisibility, updateCompass } from "./ui/overlays";
import { flyToViewId, initPanel, updateCameraFlight } from "./ui/panel";

addSurroundingShaderSea();

addCoastalShallowWaterShelf();

addMainlandOutsideBoundary();

addMainBoundarySurface();

registerCityZones();

registerRailwayCorridors();

registerStreamCuts();

const pavementFloor = new PavementFloor();

addMicroDisplacedGrassTerrain(pavementFloor);

addSimpleMainlandCoast();

addNaturalRockClusters();

addLowlandGroundCover();

addNaturalDetailPass();

addMountainFoothillBlend(pavementFloor);

addClippedMountain(pavementFloor);

addSnowCappedMountain(pavementFloor);

addSnowCapOverlay();

addMountainStrataRidges();

addMountainTalusFields();

addReservoirBasin(pavementFloor);

addDamSideShoreClosures();

addReservoirLake();

addDamAbutments();

addDam();

addDamDetail();

addRiverChannelBanks(pavementFloor);

addCoastalEstuaryBanks(pavementFloor);

addRiver();

addCoastalEstuary();

addRoadNetworkMeshes();

addStreams();

addRailway();

addCountryside();

addCity();

addParkedVehicles();

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
