import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import * as THREE from "three";
import { queueImportedModelReplacement } from "../assets/pipeline";
import { ATTRACTION_PIER_BEAM_COUNT, ATTRACTION_PIER_DEPTH_M, ATTRACTION_PIER_LAND_OVERLAP_M, ATTRACTION_PIER_LENGTH_M, ATTRACTION_PIER_RAIL_POST_COUNT, ATTRACTION_PIER_SUPPORT_COLUMNS, ATTRACTION_PIER_SUPPORT_ROWS, CARGO_BOLLARD_COUNT, CARGO_CONTAINER_COUNT, CARGO_PORT_DEPTH_M, CARGO_PORT_LENGTH_M, CARGO_SHIP_HULL_LENGTH_M, PIER_DECK_THICKNESS_M, PLATFORM_SURFACE_Y, PRIVATE_MARINA_BERTH_COUNT, QUAY_FENDER_COUNT, SEA_Y } from "../config/constants";
import { addBox, addBoxInstances, addContactShadowPlane, addCylinderInstances, addTopAlignedBox, createLocalMesh } from "../geometry/helpers";
import { XYZPlacement, XZPlacement } from "../geometry/types";
import { artificialElements } from "../render/context";
import { attractionBlueMaterial, attractionRedMaterial, attractionYellowMaterial, bridgeSteelMaterial, cargoContainerMaterials, concretePortMaterial, concreteSeamMaterial, dockMaterial, portCraneMaterial, privateBoatMaterial, roadDrainMaterial, rubberFenderMaterial, safetySignMaterial, shipCabinMaterial, shipHullMaterial, woodPierMaterial } from "../render/materials";
import { mainBoundaryMaxX } from "../world/frame";

export function addCargoShip(name: string, x: number, z: number) {
  const lod = new THREE.LOD();
  const highDetail = new THREE.Group();
  const lowDetail = createLocalMesh(
    `${name}-low-detail-hull`,
    new RoundedBoxGeometry(CARGO_SHIP_HULL_LENGTH_M, 15, 34, 2, 1.6),
    shipHullMaterial,
    0,
    10,
    0,
  );
  const deckContainers: XYZPlacement[] = [];
  const railPlacements: XYZPlacement[] = [];

  highDetail.name = `${name}-high-detail-model`;
  highDetail.add(
    createLocalMesh(
      `${name}-rounded-hull`,
      new RoundedBoxGeometry(CARGO_SHIP_HULL_LENGTH_M, 16, 34, 3, 2.8),
      shipHullMaterial,
      0,
      10,
      0,
    ),
  );
  const bow = createLocalMesh(
    `${name}-tapered-bow`,
    new THREE.ConeGeometry(18, 30, 4),
    shipHullMaterial,
    CARGO_SHIP_HULL_LENGTH_M * 0.5 + 10,
    10,
    0,
  );
  bow.rotation.z = -Math.PI / 2;
  bow.rotation.y = Math.PI * 0.25;
  highDetail.add(bow);
  highDetail.add(
    createLocalMesh(
      `${name}-stern-cabin-block`,
      new RoundedBoxGeometry(42, 18, 22, 2, 1.4),
      shipCabinMaterial,
      -38,
      27,
      0,
    ),
    createLocalMesh(
      `${name}-bridge-window-band`,
      new RoundedBoxGeometry(36, 4, 23, 1, 0.5),
      safetySignMaterial,
      -36,
      30,
      0,
    ),
    createLocalMesh(
      `${name}-foredeck-cover`,
      new RoundedBoxGeometry(54, 3.2, 24, 1, 0.8),
      concretePortMaterial,
      34,
      20.1,
      0,
    ),
  );

  for (let index = 0; index < 8; index += 1) {
    deckContainers.push({
      x: -10 + (index % 4) * 18,
      y: 23.2 + Math.floor(index / 4) * 4.2,
      z: index < 4 ? -9 : 9,
    });
  }
  addBoxInstances(
    `${name}-deck-container-stack`,
    14,
    4,
    7,
    cargoContainerMaterials[0],
    deckContainers,
    highDetail,
  );

  for (let index = 0; index < 12; index += 1) {
    const localX = THREE.MathUtils.lerp(-68, 72, index / 11);
    railPlacements.push(
      { x: localX, y: 21.8, z: -18.3 },
      { x: localX, y: 21.8, z: 18.3 },
    );
  }
  addBoxInstances(
    `${name}-side-rail-posts`,
    0.8,
    4.2,
    0.8,
    bridgeSteelMaterial,
    railPlacements,
    highDetail,
  );
  highDetail.add(
    createLocalMesh(
      `${name}-port-side-rail`,
      new THREE.BoxGeometry(145, 0.75, 0.75),
      bridgeSteelMaterial,
      2,
      24,
      -18.3,
    ),
    createLocalMesh(
      `${name}-starboard-side-rail`,
      new THREE.BoxGeometry(145, 0.75, 0.75),
      bridgeSteelMaterial,
      2,
      24,
      18.3,
    ),
    createLocalMesh(
      `${name}-mast`,
      new THREE.CylinderGeometry(0.9, 0.9, 22, 10),
      bridgeSteelMaterial,
      -58,
      43,
      0,
    ),
    createLocalMesh(
      `${name}-radar-bar`,
      new THREE.BoxGeometry(16, 1.2, 1.2),
      bridgeSteelMaterial,
      -58,
      53.5,
      0,
    ),
  );

  lod.name = name;
  lod.position.set(x, SEA_Y, z);
  lod.addLevel(highDetail, 0);
  lod.addLevel(lowDetail, 2_800);
  artificialElements.add(lod);
  queueImportedModelReplacement("cargoShip", name, x, z, lod);
}

export function addPrivateBoat(name: string, x: number, z: number) {
  const lod = new THREE.LOD();
  const highDetail = new THREE.Group();
  const lowDetail = createLocalMesh(
    `${name}-low-detail-hull`,
    new RoundedBoxGeometry(42, 6, 12, 2, 1.1),
    privateBoatMaterial,
    0,
    5,
    0,
  );

  highDetail.name = `${name}-high-detail-model`;
  const bow = createLocalMesh(
    `${name}-pointed-bow`,
    new THREE.ConeGeometry(6.4, 11, 4),
    privateBoatMaterial,
    24,
    5,
    0,
  );
  bow.rotation.z = -Math.PI / 2;
  bow.rotation.y = Math.PI * 0.25;
  highDetail.add(
    createLocalMesh(
      `${name}-rounded-hull`,
      new RoundedBoxGeometry(42, 6, 12, 3, 1.3),
      privateBoatMaterial,
      0,
      5,
      0,
    ),
    bow,
    createLocalMesh(
      `${name}-small-cabin`,
      new RoundedBoxGeometry(13, 7, 8, 2, 0.8),
      shipCabinMaterial,
      -5,
      11,
      0,
    ),
    createLocalMesh(
      `${name}-windshield`,
      new RoundedBoxGeometry(9, 2.4, 8.4, 1, 0.3),
      safetySignMaterial,
      1,
      14.8,
      0,
    ),
    createLocalMesh(
      `${name}-stern-outboard`,
      new RoundedBoxGeometry(3.4, 5.2, 4.4, 1, 0.4),
      rubberFenderMaterial,
      -24.5,
      5,
      0,
    ),
  );

  lod.name = name;
  lod.position.set(x, SEA_Y, z);
  lod.addLevel(highDetail, 0);
  lod.addLevel(lowDetail, 1_400);
  artificialElements.add(lod);
  queueImportedModelReplacement("privateBoat", name, x, z, lod);
}

export function addPierAttractionPark(pierCenterX: number, pierCenterZ: number) {
  const ferrisWheel = new THREE.Mesh(
    new THREE.TorusGeometry(42, 2.8, 8, 44),
    attractionRedMaterial,
  );
  ferrisWheel.name = "wooden-pier-ferris-wheel";
  ferrisWheel.castShadow = true;
  ferrisWheel.receiveShadow = true;
  ferrisWheel.position.set(pierCenterX - 110, PLATFORM_SURFACE_Y + 48, pierCenterZ - 58);
  artificialElements.add(ferrisWheel);

  addBox(
    "ferris-wheel-left-support",
    5,
    58,
    5,
    dockMaterial,
    pierCenterX - 134,
    PLATFORM_SURFACE_Y + 29,
    pierCenterZ - 58,
  );
  addBox(
    "ferris-wheel-right-support",
    5,
    58,
    5,
    dockMaterial,
    pierCenterX - 86,
    PLATFORM_SURFACE_Y + 29,
    pierCenterZ - 58,
  );
  addBox(
    "pier-carousel-base",
    52,
    10,
    52,
    attractionYellowMaterial,
    pierCenterX + 34,
    PLATFORM_SURFACE_Y + 6,
    pierCenterZ - 58,
  );
  addBox(
    "pier-attraction-building",
    68,
    18,
    42,
    attractionBlueMaterial,
    pierCenterX - 52,
    PLATFORM_SURFACE_Y + 10,
    pierCenterZ + 58,
  );
  addBox(
    "pier-ticket-booth",
    34,
    14,
    26,
    attractionRedMaterial,
    pierCenterX + 104,
    PLATFORM_SURFACE_Y + 8,
    pierCenterZ + 58,
  );
}

export function addAttractionPierSupportPiles(pierCenterZ: number) {
  const placements: XZPlacement[] = [];

  for (let column = 0; column < ATTRACTION_PIER_SUPPORT_COLUMNS; column += 1) {
    const x = THREE.MathUtils.lerp(
      mainBoundaryMaxX + 28,
      mainBoundaryMaxX + ATTRACTION_PIER_LENGTH_M - 95,
      column / (ATTRACTION_PIER_SUPPORT_COLUMNS - 1),
    );

    for (let row = 0; row < ATTRACTION_PIER_SUPPORT_ROWS; row += 1) {
      const z = THREE.MathUtils.lerp(
        pierCenterZ - ATTRACTION_PIER_DEPTH_M * 0.36,
        pierCenterZ + ATTRACTION_PIER_DEPTH_M * 0.36,
        row / (ATTRACTION_PIER_SUPPORT_ROWS - 1),
      );
      placements.push({ x, z });
    }
  }

  addCylinderInstances(
    "attraction-pier-support-piles",
    3.4,
    PLATFORM_SURFACE_Y - SEA_Y + 3,
    woodPierMaterial,
    PLATFORM_SURFACE_Y + 0.1,
    placements,
  );
}

export function addPrivateMarinaSupportPiles(marinaCenterZ: number) {
  const walkwayPlacements = [
    marinaCenterZ - 60,
    marinaCenterZ - 20,
    marinaCenterZ + 20,
    marinaCenterZ + 60,
  ].map((z) => ({ x: mainBoundaryMaxX + 10, z }));
  const berthPlacements: XZPlacement[] = [];

  for (let index = 0; index < PRIVATE_MARINA_BERTH_COUNT; index += 1) {
    const berthZ = marinaCenterZ - 45 + index * 30;
    berthPlacements.push(
      { x: mainBoundaryMaxX + 123, z: berthZ - 4 },
      { x: mainBoundaryMaxX + 123, z: berthZ + 4 },
    );
  }

  addCylinderInstances(
    "private-marina-walkway-piles",
    2.4,
    PLATFORM_SURFACE_Y - SEA_Y + 3,
    dockMaterial,
    PLATFORM_SURFACE_Y + 0.1,
    walkwayPlacements,
  );
  addCylinderInstances(
    "private-marina-berth-piles",
    2.1,
    PLATFORM_SURFACE_Y - SEA_Y + 3,
    dockMaterial,
    PLATFORM_SURFACE_Y + 0.1,
    berthPlacements,
  );
}

export function addCargoCrane(name: string, x: number, z: number) {
  addBox(`${name}-mast`, 8, 38, 8, portCraneMaterial, x, PLATFORM_SURFACE_Y + 19, z);
  addBox(`${name}-boom`, 78, 5, 7, portCraneMaterial, x + 34, PLATFORM_SURFACE_Y + 39, z);
  addBox(`${name}-counterweight`, 16, 8, 10, concretePortMaterial, x - 13, PLATFORM_SURFACE_Y + 35, z);
  addBox(`${name}-cabin`, 12, 9, 12, shipCabinMaterial, x + 10, PLATFORM_SURFACE_Y + 31, z);
}

export function addCargoContainers(cargoPortCenterX: number, cargoPortCenterZ: number) {
  const placementsByMaterial: XYZPlacement[][] = cargoContainerMaterials.map(() => []);

  for (let index = 0; index < CARGO_CONTAINER_COUNT; index += 1) {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const x = cargoPortCenterX - 70 + column * 38;
    const z = cargoPortCenterZ - 66 + row * 38;
    const materialIndex = index % cargoContainerMaterials.length;
    placementsByMaterial[materialIndex].push({
      x,
      y: PLATFORM_SURFACE_Y + 4,
      z,
    });
  }

  placementsByMaterial.forEach((placements, materialIndex) => {
    addBoxInstances(
      `cargo-containers-${materialIndex + 1}`,
      28,
      8,
      12,
      cargoContainerMaterials[materialIndex],
      placements,
    );
  });
}

export function addCargoPortEquipment(
  cargoPortCenterX: number,
  cargoPortCenterZ: number,
  cargoPortEastEdge: number,
) {
  addCargoContainers(cargoPortCenterX, cargoPortCenterZ);

  for (const [index, z] of [cargoPortCenterZ - 72, cargoPortCenterZ + 72].entries()) {
    addCargoCrane(`cargo-port-crane-${index + 1}`, cargoPortEastEdge - 64, z);
  }

  const bollardPlacements: XZPlacement[] = [];
  for (let index = 0; index < CARGO_BOLLARD_COUNT; index += 1) {
    const z = THREE.MathUtils.lerp(
      cargoPortCenterZ - CARGO_PORT_DEPTH_M * 0.42,
      cargoPortCenterZ + CARGO_PORT_DEPTH_M * 0.42,
      index / (CARGO_BOLLARD_COUNT - 1),
    );
    bollardPlacements.push({ x: cargoPortEastEdge - 16, z });
  }

  addCylinderInstances(
    "cargo-port-bollards",
    3.2,
    4.8,
    dockMaterial,
    PLATFORM_SURFACE_Y + 4.8,
    bollardPlacements,
  );
}

export function addPierStructuralDetail(pierCenterX: number, pierCenterZ: number) {
  const pierWestEdge = pierCenterX - ATTRACTION_PIER_LENGTH_M * 0.5;
  const pierEastEdge = pierCenterX + ATTRACTION_PIER_LENGTH_M * 0.5;
  const pierNorthEdge = pierCenterZ + ATTRACTION_PIER_DEPTH_M * 0.5;
  const pierSouthEdge = pierCenterZ - ATTRACTION_PIER_DEPTH_M * 0.5;
  const sidePostPlacements: XZPlacement[] = [];
  const endPostPlacements: XZPlacement[] = [];
  const crossBeamPlacements: XYZPlacement[] = [];
  const longBeamPlacements: XYZPlacement[] = [];

  for (let index = 0; index < ATTRACTION_PIER_RAIL_POST_COUNT / 2; index += 1) {
    const x = THREE.MathUtils.lerp(
      pierWestEdge + 18,
      pierEastEdge - 18,
      index / (ATTRACTION_PIER_RAIL_POST_COUNT / 2 - 1),
    );
    sidePostPlacements.push(
      { x, z: pierNorthEdge - 5 },
      { x, z: pierSouthEdge + 5 },
    );
  }

  for (let index = 0; index < 8; index += 1) {
    const z = THREE.MathUtils.lerp(pierSouthEdge + 18, pierNorthEdge - 18, index / 7);
    endPostPlacements.push({ x: pierEastEdge - 7, z });
  }

  addCylinderInstances(
    "attraction-pier-railing-posts",
    1.1,
    7.2,
    dockMaterial,
    PLATFORM_SURFACE_Y + 7.2,
    [...sidePostPlacements, ...endPostPlacements],
    artificialElements,
  );

  for (const z of [pierNorthEdge - 5, pierSouthEdge + 5]) {
    addTopAlignedBox(
      `attraction-pier-long-railing-${z > pierCenterZ ? "north" : "south"}`,
      ATTRACTION_PIER_LENGTH_M - 28,
      1.3,
      2.4,
      dockMaterial,
      pierCenterX,
      PLATFORM_SURFACE_Y + 6.8,
      z,
      12,
      artificialElements,
    );
  }
  addTopAlignedBox(
    "attraction-pier-seaward-end-railing",
    2.4,
    1.3,
    ATTRACTION_PIER_DEPTH_M - 30,
    dockMaterial,
    pierEastEdge - 7,
    PLATFORM_SURFACE_Y + 6.8,
    pierCenterZ,
    12,
    artificialElements,
  );

  for (let index = 0; index < ATTRACTION_PIER_BEAM_COUNT; index += 1) {
    const x = THREE.MathUtils.lerp(pierWestEdge + 18, pierEastEdge - 18, index / (ATTRACTION_PIER_BEAM_COUNT - 1));
    crossBeamPlacements.push({
      x,
      y: PLATFORM_SURFACE_Y - PIER_DECK_THICKNESS_M - 0.8,
      z: pierCenterZ,
    });
  }

  for (const z of [
    pierSouthEdge + ATTRACTION_PIER_DEPTH_M * 0.24,
    pierCenterZ,
    pierNorthEdge - ATTRACTION_PIER_DEPTH_M * 0.24,
  ]) {
    longBeamPlacements.push({
      x: pierCenterX,
      y: PLATFORM_SURFACE_Y - PIER_DECK_THICKNESS_M - 1.7,
      z,
    });
  }

  addBoxInstances(
    "attraction-pier-cross-beams",
    4.8,
    3.2,
    ATTRACTION_PIER_DEPTH_M - 20,
    woodPierMaterial,
    crossBeamPlacements,
    artificialElements,
  );
  addBoxInstances(
    "attraction-pier-longitudinal-beams",
    ATTRACTION_PIER_LENGTH_M - 34,
    2.8,
    4.2,
    woodPierMaterial,
    longBeamPlacements,
    artificialElements,
  );
  addContactShadowPlane(
    "attraction-pier-water-contact-shadow",
    ATTRACTION_PIER_LENGTH_M - ATTRACTION_PIER_LAND_OVERLAP_M + 40,
    ATTRACTION_PIER_DEPTH_M + 20,
    pierCenterX + ATTRACTION_PIER_LAND_OVERLAP_M * 0.22,
    SEA_Y + 0.065,
    pierCenterZ,
  );
}

export function addPrivateMarinaHardware(marinaCenterZ: number) {
  const cleatPlacements: XYZPlacement[] = [];

  for (let index = 0; index < PRIVATE_MARINA_BERTH_COUNT; index += 1) {
    const berthZ = marinaCenterZ - 45 + index * 30;
    cleatPlacements.push(
      { x: mainBoundaryMaxX + 34, y: PLATFORM_SURFACE_Y + 1.7, z: berthZ - 4.4 },
      { x: mainBoundaryMaxX + 76, y: PLATFORM_SURFACE_Y + 1.7, z: berthZ - 4.4 },
      { x: mainBoundaryMaxX + 116, y: PLATFORM_SURFACE_Y + 1.7, z: berthZ + 4.4 },
      { x: mainBoundaryMaxX + 146, y: PLATFORM_SURFACE_Y + 1.7, z: berthZ + 4.4 },
    );
  }

  for (const z of [marinaCenterZ - 62, marinaCenterZ - 22, marinaCenterZ + 22, marinaCenterZ + 62]) {
    cleatPlacements.push({ x: mainBoundaryMaxX + 7, y: PLATFORM_SURFACE_Y + 1.7, z });
  }

  addBoxInstances(
    "private-marina-mooring-cleats",
    5.2,
    0.9,
    1.8,
    bridgeSteelMaterial,
    cleatPlacements,
    artificialElements,
  );
  addContactShadowPlane(
    "private-marina-water-contact-shadow",
    160,
    150,
    mainBoundaryMaxX + 70,
    SEA_Y + 0.07,
    marinaCenterZ,
  );
}

export function addCargoPortSurfaceDetail(
  cargoPortCenterX: number,
  cargoPortCenterZ: number,
  cargoPortEastEdge: number,
) {
  const seamPlacements: XYZPlacement[] = [];
  const drainPlacements: XYZPlacement[] = [];
  const fenderPlacements: XYZPlacement[] = [];

  for (let index = 0; index < 6; index += 1) {
    seamPlacements.push({
      x: THREE.MathUtils.lerp(
        cargoPortCenterX - CARGO_PORT_LENGTH_M * 0.38,
        cargoPortCenterX + CARGO_PORT_LENGTH_M * 0.32,
        index / 5,
      ),
      y: PLATFORM_SURFACE_Y + 0.18,
      z: cargoPortCenterZ,
    });
  }

  for (let index = 0; index < 6; index += 1) {
    seamPlacements.push({
      x: cargoPortCenterX,
      y: PLATFORM_SURFACE_Y + 0.19,
      z: THREE.MathUtils.lerp(
        cargoPortCenterZ - CARGO_PORT_DEPTH_M * 0.39,
        cargoPortCenterZ + CARGO_PORT_DEPTH_M * 0.39,
        index / 5,
      ),
    });
  }

  addBoxInstances(
    "cargo-port-longitudinal-concrete-seams",
    1.2,
    0.08,
    CARGO_PORT_DEPTH_M - 24,
    concreteSeamMaterial,
    seamPlacements.slice(0, 6),
    artificialElements,
  );
  addBoxInstances(
    "cargo-port-cross-concrete-seams",
    CARGO_PORT_LENGTH_M - 36,
    0.08,
    1.2,
    concreteSeamMaterial,
    seamPlacements.slice(6),
    artificialElements,
  );

  for (let index = 0; index < QUAY_FENDER_COUNT; index += 1) {
    const z = THREE.MathUtils.lerp(
      cargoPortCenterZ - CARGO_PORT_DEPTH_M * 0.42,
      cargoPortCenterZ + CARGO_PORT_DEPTH_M * 0.42,
      index / (QUAY_FENDER_COUNT - 1),
    );
    fenderPlacements.push({
      x: cargoPortEastEdge + 1.4,
      y: PLATFORM_SURFACE_Y - 1.6,
      z,
    });
  }
  addBoxInstances(
    "cargo-port-rubber-quay-fenders",
    4.6,
    12,
    11,
    rubberFenderMaterial,
    fenderPlacements,
    artificialElements,
  );

  for (let index = 0; index < 8; index += 1) {
    drainPlacements.push({
      x: cargoPortCenterX - 112 + (index % 4) * 70,
      y: PLATFORM_SURFACE_Y + 0.24,
      z: cargoPortCenterZ + (index < 4 ? -92 : 92),
    });
  }
  addBoxInstances(
    "cargo-port-slot-drains",
    18,
    0.12,
    2.4,
    roadDrainMaterial,
    drainPlacements,
    artificialElements,
  );
  addContactShadowPlane(
    "cargo-port-quay-contact-shadow",
    CARGO_PORT_LENGTH_M + 85,
    CARGO_PORT_DEPTH_M + 32,
    cargoPortCenterX + 24,
    SEA_Y + 0.07,
    cargoPortCenterZ,
  );
}
