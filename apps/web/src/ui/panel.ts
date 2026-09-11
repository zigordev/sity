import * as THREE from "three";
import { cityStats } from "../city";
import { camera, cityElements, controls, roadElements, vegetationElements, vehicleElements } from "../render/context";
import { estimateVisibleSceneRenderStats } from "../render/stats";
import { roadGraph } from "../roads/build";
import { addRouteHighlight, clearRouteHighlight, laneOverlayGroup, roadFurnitureGroup } from "../roads/render";
import { CAMERA_VIEWS, findView, type CameraView } from "./views";

const naturalToggle = document.querySelector<HTMLInputElement>("#toggle-natural");
const artificialToggle = document.querySelector<HTMLInputElement>("#toggle-artificial");
const roadsToggle = document.querySelector<HTMLInputElement>("#toggle-roads");
const furnitureToggle = document.querySelector<HTMLInputElement>("#toggle-furniture");
const buildingsToggle = document.querySelector<HTMLInputElement>("#toggle-buildings");
const vegetationToggle = document.querySelector<HTMLInputElement>("#toggle-vegetation");
const vehiclesToggle = document.querySelector<HTMLInputElement>("#toggle-vehicles");
const lanesToggle = document.querySelector<HTMLInputElement>("#toggle-lanes");
const helpToggle = document.querySelector<HTMLInputElement>("#toggle-help");
const compass = document.querySelector<HTMLElement>(".compass");
const axisScale = document.querySelector<HTMLElement>(".axis-scale");
const viewButtons = document.querySelector<HTMLElement>("#view-buttons");
const routeRandomButton = document.querySelector<HTMLButtonElement>("#route-random");
const routeClearButton = document.querySelector<HTMLButtonElement>("#route-clear");
const routeInfo = document.querySelector<HTMLElement>("#route-info");
const sceneStats = document.querySelector<HTMLElement>("#scene-stats");

const flight = {
  active: false,
  startedAt: 0,
  durationMs: 900,
  fromPosition: new THREE.Vector3(),
  fromTarget: new THREE.Vector3(),
  toPosition: new THREE.Vector3(),
  toTarget: new THREE.Vector3(),
};

let routeSeed = 7;
let lastRouteSummary: { laneIds: string[]; lengthM: number } | undefined;

export function applyLayerVisibility() {
  const natural = naturalToggle?.checked ?? true;
  const artificial = artificialToggle?.checked ?? true;
  const roads = roadsToggle?.checked ?? true;
  const furniture = furnitureToggle?.checked ?? true;
  const buildings = buildingsToggle?.checked ?? true;
  const vegetation = vegetationToggle?.checked ?? true;
  const vehicles = vehiclesToggle?.checked ?? true;
  const lanes = lanesToggle?.checked ?? false;
  const help = helpToggle?.checked ?? true;

  roadElements.visible = roads;
  roadFurnitureGroup.visible = furniture;
  cityElements.visible = buildings;
  vegetationElements.visible = vegetation;
  vehicleElements.visible = vehicles;
  laneOverlayGroup.visible = lanes;
  document.dispatchEvent(new CustomEvent("sity:layers", { detail: { natural, artificial } }));
  if (compass) {
    compass.hidden = !help;
  }
  if (axisScale) {
    axisScale.hidden = !help;
  }
}

export function getLayerVisibility() {
  return {
    natural: naturalToggle?.checked ?? true,
    artificial: artificialToggle?.checked ?? true,
    roads: roadElements.visible,
    furniture: roadFurnitureGroup.visible,
    buildings: cityElements.visible,
    vegetation: vegetationElements.visible,
    vehicles: vehicleElements.visible,
    lanes: laneOverlayGroup.visible,
    help: compass ? !compass.hidden : true,
  };
}

export function setLaneOverlayVisible(visible: boolean) {
  if (lanesToggle) {
    lanesToggle.checked = visible;
  }
  laneOverlayGroup.visible = visible;
}

export function flyToView(view: CameraView, immediate = false) {
  if (immediate) {
    camera.position.set(...view.position);
    controls.target.set(...view.target);
    controls.update();
    flight.active = false;
  } else {
    flight.fromPosition.copy(camera.position);
    flight.fromTarget.copy(controls.target);
    flight.toPosition.set(...view.position);
    flight.toTarget.set(...view.target);
    flight.startedAt = performance.now();
    flight.active = true;
  }
  for (const button of viewButtons?.querySelectorAll("button") ?? []) {
    button.classList.toggle("active", button.dataset.view === view.id);
  }
}

export function flyToViewId(id: string, immediate = false) {
  const view = findView(id);
  if (view) {
    flyToView(view, immediate);
  }
  return Boolean(view);
}

export function updateCameraFlight() {
  if (!flight.active) {
    return;
  }
  const t = Math.min(1, (performance.now() - flight.startedAt) / flight.durationMs);
  const eased = t * t * (3 - 2 * t);
  camera.position.lerpVectors(flight.fromPosition, flight.toPosition, eased);
  controls.target.lerpVectors(flight.fromTarget, flight.toTarget, eased);
  if (t >= 1) {
    flight.active = false;
  }
}

export function showRandomRoute(seed = routeSeed) {
  routeSeed = seed + 1;
  const route = roadGraph.randomRoute(seed, 900);
  if (!route) {
    if (routeInfo) {
      routeInfo.textContent = "No route found for that seed.";
    }
    return undefined;
  }
  addRouteHighlight(route.points);
  lastRouteSummary = { laneIds: route.laneIds, lengthM: route.lengthM };
  const first = roadGraph.lane(route.laneIds[0]);
  const last = roadGraph.lane(route.laneIds[route.laneIds.length - 1]);
  const roadName = (laneId: string | undefined) => {
    const lane = laneId ? roadGraph.lane(laneId) : undefined;
    const road = lane?.roadId ? roadGraph.network.roads.get(lane.roadId) : undefined;
    return road?.spec.name ?? lane?.roadId ?? lane?.nodeId ?? "?";
  };
  if (routeInfo) {
    routeInfo.textContent = `${(route.lengthM / 1000).toFixed(2)} km over ${route.laneIds.length} lanes, from ${roadName(first?.id)} to ${roadName(last?.id)}.`;
  }
  return route;
}

export function clearRoute() {
  clearRouteHighlight();
  lastRouteSummary = undefined;
  if (routeInfo) {
    routeInfo.textContent = "Pick a random route to trace it through the lane graph.";
  }
}

export function lastRoute() {
  return lastRouteSummary;
}

export function refreshSceneStats() {
  if (!sceneStats) {
    return;
  }
  const graph = roadGraph.stats();
  const render = estimateVisibleSceneRenderStats();
  const rows: Array<[string, string]> = [
    ["Roads", String(graph.roadCount)],
    ["Lanes", String(graph.laneCount)],
    ["Lane km", graph.totalLaneLengthKm.toFixed(1)],
    ["Junctions", String(graph.junctionCount + graph.roundaboutCount)],
    ["Buildings", String(cityStats.buildingCount)],
    ["Trees", String(cityStats.treeCount)],
    ["Draw calls", String(render.drawCalls)],
    ["Triangles", `${(render.triangles / 1000).toFixed(0)}k`],
  ];
  sceneStats.replaceChildren(
    ...rows.flatMap(([label, value]) => {
      const term = document.createElement("dt");
      term.textContent = label;
      const detail = document.createElement("dd");
      detail.textContent = value;
      return [term, detail];
    }),
  );
}

export function initPanel() {
  if (viewButtons) {
    viewButtons.replaceChildren(
      ...CAMERA_VIEWS.map((view) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = view.label;
        button.dataset.view = view.id;
        button.addEventListener("click", () => flyToView(view));
        return button;
      }),
    );
  }
  for (const toggle of [naturalToggle, artificialToggle, roadsToggle, furnitureToggle, buildingsToggle, vegetationToggle, vehiclesToggle, lanesToggle, helpToggle]) {
    toggle?.addEventListener("change", () => {
      applyLayerVisibility();
      refreshSceneStats();
    });
  }
  routeRandomButton?.addEventListener("click", () => {
    showRandomRoute();
  });
  routeClearButton?.addEventListener("click", clearRoute);
  applyLayerVisibility();
  refreshSceneStats();
}
