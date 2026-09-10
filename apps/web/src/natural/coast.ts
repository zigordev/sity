import * as THREE from "three";
import { ATTRACTION_PIER_DEPTH_M, ATTRACTION_PIER_LAND_OVERLAP_M, ATTRACTION_PIER_LENGTH_M, ATTRACTION_PIER_RIVER_OFFSET_M, BEACH_DETAIL_NORTH_MARGIN_M, BEACH_DETAIL_RIVER_MARGIN_M, BEACH_DRY_DETAIL_INLAND_MARGIN_M, BEACH_DRY_DETAIL_SEA_MARGIN_M, BEACH_DUNE_COUNT, BEACH_FOAM_STRIP_COUNT, BEACH_GRASS_CLUSTER_COUNT, BEACH_INLAND_WIDTH_M, BEACH_SHELL_COUNT, BEACH_THICKNESS_M, CARGO_BERTH_DOCK_LENGTH_M, CARGO_BERTH_DOCK_THICKNESS_M, CARGO_PORT_DEPTH_M, CARGO_PORT_HEIGHT_M, CARGO_PORT_LAND_OVERLAP_M, CARGO_PORT_LENGTH_M, CARGO_PORT_RIVER_OFFSET_M, CARGO_SHIP_CENTER_OFFSET_FROM_PORT_EDGE_M, COAST_SURFACE_Y, LOWLAND_GRASS_TUFT_COUNT, LOWLAND_SCRUB_COUNT, MARINA_DOCK_THICKNESS_M, NATURAL_ROCK_CLUSTER_COUNT, PIER_DECK_THICKNESS_M, PLATFORM_SURFACE_Y, PRIVATE_MARINA_BERTH_COUNT, PRIVATE_MARINA_RIVER_OFFSET_M, RIVER_WIDTH_M, WET_SAND_THICKNESS_M, WET_SAND_WIDTH_M } from "../config/constants";
import { addBoxInstances, addExtrudedPolygonSurface, addScaledOrientedSphereInstances, addScaledSphereInstances, addTopAlignedBox } from "../geometry/helpers";
import { pathTangent } from "../geometry/ribbons";
import { ScaledOrientedXYZPlacement, ScaledXYZPlacement, XYZPlacement } from "../geometry/types";
import { fullTerrainSurfaceYAt, isLowlandDetailAllowed, terrainSurfaceYAt, visibleLowlandSurfaceYAt } from "./terrain";
import { artificialElements, naturalElements } from "../render/context";
import { beachGrassMaterial, beachSandMaterial, beachShellMaterial, concretePortMaterial, dockMaterial, duneSandMaterial, lowlandDryGrassMaterial, lowlandScrubMaterial, shorelineFoamMaterial, smallRockMaterial, wetSandMaterial, woodPierMaterial } from "../render/materials";
import { addAttractionPierSupportPiles, addCargoPortSurfaceDetail, addCargoShip, addPierStructuralDetail, addPrivateBoat, addPrivateMarinaHardware, addPrivateMarinaSupportPiles } from "../waterfront/structures";
import { addCargoPortYard } from "../waterfront/port";
import { addPierAmusements } from "../waterfront/pier";
import { addHumanScaleBeach } from "./beach";
import { mainBoundaryMaxX, mainBoundaryMaxZ, mainBoundaryMinX, mainBoundaryMinZ, riverEstuaryStart, riverMouth, riverPath, sampleGroundPath } from "../world/frame";
import { corridorClearance, zoneAt } from "../world/occupancy";

export let lowlandGroundCoverInstanceCount = 0;

export function beachDryDetailMinX(beachInnerX: number) {
  return beachInnerX + BEACH_DRY_DETAIL_INLAND_MARGIN_M;
}

export function beachDryDetailMaxX() {
  return mainBoundaryMaxX - BEACH_DRY_DETAIL_SEA_MARGIN_M;
}

export function beachDryDetailMinZ() {
  return riverMouth.z + BEACH_DETAIL_RIVER_MARGIN_M;
}

export function beachDryDetailMaxZ() {
  return mainBoundaryMaxZ - BEACH_DETAIL_NORTH_MARGIN_M;
}

export function clampBeachDryX(beachInnerX: number, x: number) {
  return THREE.MathUtils.clamp(x, beachDryDetailMinX(beachInnerX), beachDryDetailMaxX());
}

export function clampBeachDryXWithClearance(
  beachInnerX: number,
  x: number,
  clearanceM: number,
) {
  return THREE.MathUtils.clamp(
    x,
    beachDryDetailMinX(beachInnerX) + clearanceM,
    beachDryDetailMaxX() - clearanceM,
  );
}

export function clampBeachDryZ(z: number) {
  return THREE.MathUtils.clamp(z, beachDryDetailMinZ(), beachDryDetailMaxZ());
}

export function clampBeachDryZWithClearance(z: number, clearanceM: number) {
  return THREE.MathUtils.clamp(
    z,
    beachDryDetailMinZ() + clearanceM,
    beachDryDetailMaxZ() - clearanceM,
  );
}

export function addBeachGrassClumps(beachInnerX: number) {
  const mesh = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1.1, 5.5, 5),
    beachGrassMaterial,
    BEACH_GRASS_CLUSTER_COUNT,
  );
  const matrix = new THREE.Matrix4();

  for (let index = 0; index < BEACH_GRASS_CLUSTER_COUNT; index += 1) {
    const row = Math.floor(index / 10);
    const column = index % 10;
    const x = clampBeachDryX(
      beachInnerX,
      beachInnerX +
        12 +
        (column % 3) * 9 +
        3.2 * Math.sin(index * 1.7),
    );
    const z = clampBeachDryZ(
      riverMouth.z +
        312 +
        row * 118 +
        column * 9 +
        7 * Math.sin(index * 0.9),
    );

    matrix.makeTranslation(x, COAST_SURFACE_Y + 2.8, z);
    mesh.setMatrixAt(index, matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  mesh.name = "beach-dune-grass-clumps";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  naturalElements.add(mesh);
}

export function addBeachNaturalDetails(beachInnerX: number) {
  const foamPlacements: XYZPlacement[] = [];
  for (let index = 0; index < BEACH_FOAM_STRIP_COUNT; index += 1) {
    foamPlacements.push({
      x: mainBoundaryMaxX + 4 + (index % 2) * 2.6,
      y: COAST_SURFACE_Y + 0.14,
      z: clampBeachDryZ(
        THREE.MathUtils.lerp(
          riverMouth.z + 236,
          mainBoundaryMaxZ - 70,
          index / (BEACH_FOAM_STRIP_COUNT - 1),
        ),
      ),
    });
  }
  addBoxInstances(
    "shoreline-foam-strips",
    7,
    0.08,
    38,
    shorelineFoamMaterial,
    foamPlacements,
    naturalElements,
  );

  const dunePlacements: ScaledXYZPlacement[] = [];
  for (let index = 0; index < BEACH_DUNE_COUNT; index += 1) {
    const row = Math.floor(index / 4);
    const column = index % 4;
    dunePlacements.push({
      x: clampBeachDryX(
        beachInnerX,
        beachInnerX + 20 + column * 14 + 4 * Math.sin(index * 0.8),
      ),
      y: COAST_SURFACE_Y + 1.15 + (index % 3) * 0.12,
      z: clampBeachDryZ(riverMouth.z + 326 + row * 126 + 8 * Math.sin(index * 1.3)),
      scaleX: 5 + (index % 4) * 1.1,
      scaleY: 0.7 + (index % 3) * 0.16,
      scaleZ: 3.5 + (index % 5) * 0.7,
    });
  }
  addScaledSphereInstances("low-beach-dune-mounds", duneSandMaterial, dunePlacements);
  addBeachGrassClumps(beachInnerX);

  const shellPlacements: ScaledOrientedXYZPlacement[] = [];
  for (let index = 0; index < BEACH_SHELL_COUNT; index += 1) {
    const row = Math.floor(index / 12);
    const column = index % 12;
    shellPlacements.push({
      x: clampBeachDryXWithClearance(
        beachInnerX,
        beachInnerX + 68 + (column % 4) * 18 + 5 * Math.sin(index * 1.9),
        8,
      ),
      y: COAST_SURFACE_Y + 0.28,
      z: clampBeachDryZWithClearance(
        riverMouth.z + 274 + row * 76 + column * 5.8,
        10,
      ),
      rotationY: index * 0.91,
      scaleX: 1.8 + (index % 3) * 0.25,
      scaleY: 0.18,
      scaleZ: 0.72 + (index % 4) * 0.08,
    });
  }
  addScaledOrientedSphereInstances("dry-beach-shells-and-small-stones", beachShellMaterial, shellPlacements);
}

export function addNaturalRockClusters() {
  const placements: ScaledXYZPlacement[] = [];

  for (let index = 7; index < riverPath.length - 6 && placements.length < 24; index += 5) {
    const point = riverPath[index];
    const tangent = pathTangent(
      riverPath.map((riverPoint) => ({
        ...riverPoint,
        y: terrainSurfaceYAt(riverPoint),
      })),
      index,
      false,
    );
    const sideSign = index % 2 === 0 ? -1 : 1;
    const offset = RIVER_WIDTH_M * 0.5 + 18 + (index % 3) * 8;
    const rockPoint = {
      x: point.x + tangent.normalX * offset * sideSign,
      z: point.z + tangent.normalZ * offset * sideSign,
    };

    placements.push({
      x: rockPoint.x,
      y: fullTerrainSurfaceYAt(rockPoint) + 1.2,
      z: rockPoint.z,
      scaleX: 1.6 + (index % 4) * 0.5,
      scaleY: 0.7 + (index % 3) * 0.25,
      scaleZ: 1.3 + (index % 5) * 0.4,
    });
  }

  for (let index = 0; placements.length < NATURAL_ROCK_CLUSTER_COUNT && index < NATURAL_ROCK_CLUSTER_COUNT * 3; index += 1) {
    const z = THREE.MathUtils.lerp(
      riverMouth.z + 175,
      mainBoundaryMaxZ - 130,
      (index % (NATURAL_ROCK_CLUSTER_COUNT - 24)) / (NATURAL_ROCK_CLUSTER_COUNT - 24 - 1),
    );
    const x = mainBoundaryMaxX - BEACH_INLAND_WIDTH_M - 16 - (index % 3) * 9 + Math.floor(index / (NATURAL_ROCK_CLUSTER_COUNT - 24)) * 22;
    const point = { x, z };
    if (zoneAt(x, z) || corridorClearance(x, z, 40) < 8) {
      continue;
    }

    placements.push({
      x,
      y: fullTerrainSurfaceYAt(point) + 1,
      z,
      scaleX: 1.2 + (index % 4) * 0.4,
      scaleY: 0.5 + (index % 2) * 0.2,
      scaleZ: 1.0 + (index % 5) * 0.3,
    });
  }

  addScaledSphereInstances("natural-river-coast-rock-clusters", smallRockMaterial, placements);
}

export function addLowlandGroundCover() {
  const grassPlacements: ScaledXYZPlacement[] = [];
  const scrubPlacements: ScaledXYZPlacement[] = [];
  const westX = mainBoundaryMinX + 170;
  const eastX = mainBoundaryMaxX - BEACH_INLAND_WIDTH_M - 210;
  const southZ = mainBoundaryMinZ + 170;
  const northZ = mainBoundaryMaxZ - 170;

  for (let index = 0; grassPlacements.length < LOWLAND_GRASS_TUFT_COUNT && index < LOWLAND_GRASS_TUFT_COUNT * 3; index += 1) {
    const column = index % 28;
    const row = Math.floor(index / 28);
    const x = THREE.MathUtils.lerp(westX, eastX, column / 27) + Math.sin(index * 1.71) * 21;
    const z =
      THREE.MathUtils.lerp(
        southZ,
        northZ,
        ((row * 13) % 37) / 36,
      ) +
      Math.cos(index * 1.17) * 24;
    const point = { x, z };

    if (!isLowlandDetailAllowed(point)) {
      continue;
    }

    grassPlacements.push({
      x,
      y: visibleLowlandSurfaceYAt(point) + 1.6,
      z,
      scaleX: 1.5 + (index % 4) * 0.22,
      scaleY: 1.8 + (index % 5) * 0.35,
      scaleZ: 1.5 + (index % 3) * 0.2,
    });
  }

  for (let index = 0; scrubPlacements.length < LOWLAND_SCRUB_COUNT && index < LOWLAND_SCRUB_COUNT * 4; index += 1) {
    const column = index % 18;
    const row = Math.floor(index / 18);
    const x = THREE.MathUtils.lerp(westX, eastX, column / 17) + Math.sin(index * 1.93) * 28;
    const z =
      THREE.MathUtils.lerp(
        southZ,
        northZ,
        ((row * 11) % 31) / 30,
      ) +
      Math.cos(index * 1.41) * 30;
    const point = { x, z };

    if (!isLowlandDetailAllowed(point)) {
      continue;
    }

    scrubPlacements.push({
      x,
      y: visibleLowlandSurfaceYAt(point) + 1.05,
      z,
      scaleX: 2.8 + (index % 4) * 0.5,
      scaleY: 1.2 + (index % 3) * 0.24,
      scaleZ: 2.4 + (index % 5) * 0.42,
    });
  }

  const grassMesh = new THREE.InstancedMesh(
    new THREE.ConeGeometry(1, 4.2, 5),
    lowlandDryGrassMaterial,
    grassPlacements.length,
  );
  const scrubMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 9, 6),
    lowlandScrubMaterial,
    scrubPlacements.length,
  );
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);

  grassPlacements.forEach((placement, index) => {
    position.set(placement.x, placement.y, placement.z);
    quaternion.setFromAxisAngle(yAxis, index * 0.67);
    scale.set(placement.scaleX, placement.scaleY, placement.scaleZ);
    matrix.compose(position, quaternion, scale);
    grassMesh.setMatrixAt(index, matrix);
  });
  grassMesh.instanceMatrix.needsUpdate = true;
  grassMesh.name = "visible-lowland-dry-grass-tufts";
  grassMesh.castShadow = true;
  grassMesh.receiveShadow = true;
  naturalElements.add(grassMesh);

  scrubPlacements.forEach((placement, index) => {
    position.set(placement.x, placement.y, placement.z);
    quaternion.setFromAxisAngle(yAxis, index * 0.41);
    scale.set(placement.scaleX, placement.scaleY, placement.scaleZ);
    matrix.compose(position, quaternion, scale);
    scrubMesh.setMatrixAt(index, matrix);
  });
  scrubMesh.instanceMatrix.needsUpdate = true;
  scrubMesh.name = "visible-lowland-scrub-mounds";
  scrubMesh.castShadow = true;
  scrubMesh.receiveShadow = true;
  naturalElements.add(scrubMesh);

  lowlandGroundCoverInstanceCount = grassPlacements.length + scrubPlacements.length;
}

export function addSimpleMainlandCoast() {
  const beachInnerX = mainBoundaryMaxX - BEACH_INLAND_WIDTH_M;
  const beachInlandSouthZ = riverMouth.z + 284;
  const beachRiverEdge = sampleGroundPath(
    [
      { x: riverEstuaryStart.x - 26, z: riverEstuaryStart.z + 74 },
      { x: mainBoundaryMaxX - 138, z: riverMouth.z + 108 },
      { x: mainBoundaryMaxX - 54, z: riverMouth.z + 138 },
      { x: mainBoundaryMaxX, z: riverMouth.z + 140 },
    ],
    18,
  );

  addExtrudedPolygonSurface(
    "river-integrated-mainland-beach",
    [
      ...beachRiverEdge,
      { x: mainBoundaryMaxX, z: mainBoundaryMaxZ },
      { x: beachInnerX, z: mainBoundaryMaxZ },
      { x: beachInnerX, z: beachInlandSouthZ },
      { x: beachInnerX + 34, z: riverMouth.z + 228 },
      { x: beachInnerX + 80, z: riverMouth.z + 184 },
    ],
    beachSandMaterial,
    COAST_SURFACE_Y,
    BEACH_THICKNESS_M,
    3,
    naturalElements,
  );

  addExtrudedPolygonSurface(
    "mainland-beach-wet-sand-band",
    [
      { x: mainBoundaryMaxX - WET_SAND_WIDTH_M, z: riverMouth.z + 166 },
      { x: mainBoundaryMaxX - 10, z: riverMouth.z + 143 },
      { x: mainBoundaryMaxX, z: riverMouth.z + 140 },
      { x: mainBoundaryMaxX, z: mainBoundaryMaxZ },
      { x: mainBoundaryMaxX - WET_SAND_WIDTH_M, z: mainBoundaryMaxZ },
    ],
    wetSandMaterial,
    COAST_SURFACE_Y + 0.04,
    WET_SAND_THICKNESS_M,
    4,
    naturalElements,
  );

  addBeachNaturalDetails(beachInnerX);
  addHumanScaleBeach(beachInnerX);

  const attractionPierCenterX =
    mainBoundaryMaxX - ATTRACTION_PIER_LAND_OVERLAP_M + ATTRACTION_PIER_LENGTH_M * 0.5;
  const attractionPierCenterZ = riverMouth.z - ATTRACTION_PIER_RIVER_OFFSET_M;

  addTopAlignedBox(
    "long-wooden-attraction-pier",
    ATTRACTION_PIER_LENGTH_M,
    PIER_DECK_THICKNESS_M,
    ATTRACTION_PIER_DEPTH_M,
    woodPierMaterial,
    attractionPierCenterX,
    PLATFORM_SURFACE_Y,
    attractionPierCenterZ,
    8,
    artificialElements,
  );
  addAttractionPierSupportPiles(attractionPierCenterZ);
  addPierAmusements(attractionPierCenterX, attractionPierCenterZ);
  addPierStructuralDetail(attractionPierCenterX, attractionPierCenterZ);

  const marinaCenterZ = riverMouth.z - PRIVATE_MARINA_RIVER_OFFSET_M;
  addTopAlignedBox(
    "private-marina-shore-walkway",
    18,
    MARINA_DOCK_THICKNESS_M,
    128,
    dockMaterial,
    mainBoundaryMaxX + 9,
    PLATFORM_SURFACE_Y + 0.08,
    marinaCenterZ,
    9,
    artificialElements,
  );

  for (let index = 0; index < PRIVATE_MARINA_BERTH_COUNT; index += 1) {
    const berthZ = marinaCenterZ - 45 + index * 30;
    addTopAlignedBox(
      `private-marina-berth-${index + 1}`,
      116,
      MARINA_DOCK_THICKNESS_M,
      6,
      dockMaterial,
      mainBoundaryMaxX + 76,
      PLATFORM_SURFACE_Y + 0.08,
      berthZ,
      9,
      artificialElements,
    );
    addPrivateBoat(`private-marina-boat-${index + 1}`, mainBoundaryMaxX + 148, berthZ + 10);
  }
  addPrivateMarinaSupportPiles(marinaCenterZ);
  addPrivateMarinaHardware(marinaCenterZ);

  const cargoPortCenterX =
    mainBoundaryMaxX - CARGO_PORT_LAND_OVERLAP_M + CARGO_PORT_LENGTH_M * 0.5;
  const cargoPortCenterZ = riverMouth.z - CARGO_PORT_RIVER_OFFSET_M;
  const cargoPortEastEdge =
    cargoPortCenterX + CARGO_PORT_LENGTH_M * 0.5;

  addTopAlignedBox(
    "large-concrete-cargo-port",
    CARGO_PORT_LENGTH_M,
    CARGO_PORT_HEIGHT_M,
    CARGO_PORT_DEPTH_M,
    concretePortMaterial,
    cargoPortCenterX,
    PLATFORM_SURFACE_Y,
    cargoPortCenterZ,
    8,
    artificialElements,
  );
  addCargoPortSurfaceDetail(cargoPortCenterX, cargoPortCenterZ, cargoPortEastEdge);
  addCargoPortYard(
    {
      westEdge: cargoPortCenterX - CARGO_PORT_LENGTH_M * 0.5,
      eastEdge: cargoPortEastEdge,
      northEdge: cargoPortCenterZ + CARGO_PORT_DEPTH_M * 0.5,
      southEdge: cargoPortCenterZ - CARGO_PORT_DEPTH_M * 0.5,
      gateZ: -560,
      gateHalfWidth: 22,
    },
    mainBoundaryMaxX,
  );

  for (const [index, dockZ] of [cargoPortCenterZ - 58, cargoPortCenterZ + 58].entries()) {
    addTopAlignedBox(
      `cargo-port-berth-dock-${index + 1}`,
      CARGO_BERTH_DOCK_LENGTH_M,
      CARGO_BERTH_DOCK_THICKNESS_M,
      18,
      dockMaterial,
      cargoPortEastEdge + 40,
      PLATFORM_SURFACE_Y + 0.08,
      dockZ,
      9,
      artificialElements,
    );
    const shipZ = dockZ + (index === 0 ? 38 : -38);
    addCargoShip(
      `cargo-port-ship-${index + 1}`,
      cargoPortEastEdge + CARGO_SHIP_CENTER_OFFSET_FROM_PORT_EDGE_M,
      shipZ,
    );
  }
}
