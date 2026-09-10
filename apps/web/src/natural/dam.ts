import * as THREE from "three";
import { DAM_ABUTMENT_CREST_RISE_M, DAM_ABUTMENT_FLARE_M, DAM_ABUTMENT_OUTER_LENGTH_M, DAM_BANK_OPENING_HALF_LENGTH_M, DAM_CREST_RAIL_POST_COUNT, DAM_CURVE_SEGMENTS, DAM_HEIGHT_M, DAM_LENGTH_M, DAM_SPILLWAY_GATE_COUNT, DAM_THICKNESS_M, GRASS_SURFACE_Y } from "../config/constants";
import { addCylinderInstances, addOrientedBox, addOrientedBoxInstances } from "../geometry/helpers";
import { GroundPathPoint, OrientedXYZPlacement, XZPlacement } from "../geometry/types";
import { mountainHeightAt } from "./terrain";
import { addReservoirBankVertex, reservoirLakeY } from "./water";
import { artificialElements, naturalElements } from "../render/context";
import { bridgeSteelMaterial, concreteSeamMaterial, damMaterial, mountainMaterial, roadDrainMaterial } from "../render/materials";
import { curvedDamPoint, damCenter, damDownstreamFacePoint, damUpstreamFacePoint, reservoirOutletDirection } from "../world/frame";

export function createDamAbutmentGeometry(sideSign: -1 | 1) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const lakeY = reservoirLakeY();
  const damEndOffset = sideSign * (DAM_LENGTH_M * 0.5);
  const terrainPointY = (point: GroundPathPoint) =>
    GRASS_SURFACE_Y + mountainHeightAt(point.x, point.z) + 0.7;
  const boundaryPoints = [
    damUpstreamFacePoint(damEndOffset),
    curvedDamPoint(
      sideSign * (DAM_BANK_OPENING_HALF_LENGTH_M + DAM_ABUTMENT_OUTER_LENGTH_M),
      -DAM_THICKNESS_M * 0.5 - DAM_ABUTMENT_FLARE_M,
    ),
    curvedDamPoint(
      sideSign * (DAM_BANK_OPENING_HALF_LENGTH_M + DAM_ABUTMENT_OUTER_LENGTH_M),
      DAM_THICKNESS_M * 0.5 + DAM_ABUTMENT_FLARE_M,
    ),
    damDownstreamFacePoint(damEndOffset),
  ];
  const crestPoint = curvedDamPoint(
    sideSign * (DAM_LENGTH_M * 0.5 + DAM_ABUTMENT_OUTER_LENGTH_M * 0.42),
    0,
  );

  addReservoirBankVertex(
    positions,
    colors,
    crestPoint,
    Math.max(lakeY + DAM_ABUTMENT_CREST_RISE_M, terrainPointY(crestPoint) + 5),
  );

  boundaryPoints.forEach((point, index) => {
    const nearDam = index === 0 || index === 3;
    addReservoirBankVertex(
      positions,
      colors,
      point,
      Math.max(lakeY + (nearDam ? 12 : 7), terrainPointY(point) + 1.5),
    );
  });

  boundaryPoints.forEach((point) => {
    addReservoirBankVertex(positions, colors, point, terrainPointY(point));
  });

  indices.push(0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1);

  for (let index = 0; index < boundaryPoints.length; index += 1) {
    const top = index + 1;
    const nextTop = ((index + 1) % boundaryPoints.length) + 1;
    const bottom = index + 5;
    const nextBottom = ((index + 1) % boundaryPoints.length) + 5;
    indices.push(top, bottom, nextTop, nextTop, bottom, nextBottom);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createDamSideShoreClosureGeometry(sideSign: -1 | 1) {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const lakeY = reservoirLakeY();
  const topPoints = [
    {
      point: curvedDamPoint(sideSign * (DAM_LENGTH_M * 0.5 - 12), -DAM_THICKNESS_M * 0.5 - 4),
      liftM: 1.8,
    },
    {
      point: curvedDamPoint(sideSign * (DAM_LENGTH_M * 0.5 + 10), -DAM_THICKNESS_M * 0.5 - 14),
      liftM: 3.4,
    },
    {
      point: curvedDamPoint(sideSign * (DAM_LENGTH_M * 0.5 + 48), -DAM_THICKNESS_M * 0.5 - 46),
      liftM: 8,
    },
    {
      point: curvedDamPoint(sideSign * (DAM_LENGTH_M * 0.5 + 38), -DAM_THICKNESS_M * 0.5 - 82),
      liftM: 12,
    },
    {
      point: curvedDamPoint(sideSign * (DAM_LENGTH_M * 0.5 - 14), -DAM_THICKNESS_M * 0.5 - 62),
      liftM: 6.5,
    },
  ];
  const terrainPointY = (point: GroundPathPoint) =>
    GRASS_SURFACE_Y + mountainHeightAt(point.x, point.z) + 0.6;

  topPoints.forEach(({ point, liftM }) => {
    addReservoirBankVertex(
      positions,
      colors,
      point,
      Math.max(lakeY + liftM, terrainPointY(point) + 1),
    );
  });

  topPoints.forEach(({ point }) => {
    addReservoirBankVertex(positions, colors, point, Math.min(lakeY - 6, terrainPointY(point)));
  });

  indices.push(0, 1, 2, 0, 2, 3, 0, 3, 4);

  for (let index = 0; index < topPoints.length; index += 1) {
    const next = (index + 1) % topPoints.length;
    const bottom = index + topPoints.length;
    const nextBottom = next + topPoints.length;
    indices.push(index, bottom, next, next, bottom, nextBottom);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function addDamSideShoreClosures() {
  for (const sideSign of [-1, 1] as const) {
    const closure = new THREE.Mesh(createDamSideShoreClosureGeometry(sideSign), mountainMaterial);
    closure.name =
      sideSign < 0
        ? "reservoir-dam-left-shore-closure"
        : "reservoir-dam-right-shore-closure";
    closure.renderOrder = 6;
    closure.castShadow = true;
    closure.receiveShadow = true;
    naturalElements.add(closure);
  }
}

export function addDamAbutments() {
  for (const sideSign of [-1, 1] as const) {
    const abutment = new THREE.Mesh(createDamAbutmentGeometry(sideSign), mountainMaterial);
    abutment.name = sideSign < 0 ? "reservoir-dam-left-abutment" : "reservoir-dam-right-abutment";
    abutment.renderOrder = 6;
    abutment.castShadow = true;
    abutment.receiveShadow = true;
    naturalElements.add(abutment);
  }
}

export function createCurvedDamGeometry(baseY: number) {
  const positions: number[] = [];
  const indices: number[] = [];
  const vertexIndex = (station: number, side: number, elevation: number) =>
    station * 4 + side * 2 + elevation;

  for (let station = 0; station <= DAM_CURVE_SEGMENTS; station += 1) {
    const ratio = station / DAM_CURVE_SEGMENTS;
    const lengthOffset = THREE.MathUtils.lerp(-DAM_LENGTH_M * 0.5, DAM_LENGTH_M * 0.5, ratio);

    for (const sideOffset of [-DAM_THICKNESS_M * 0.5, DAM_THICKNESS_M * 0.5]) {
      const point = curvedDamPoint(lengthOffset, sideOffset);
      positions.push(
        point.x,
        baseY,
        point.z,
        point.x,
        baseY + DAM_HEIGHT_M,
        point.z,
      );
    }
  }

  for (let station = 0; station < DAM_CURVE_SEGMENTS; station += 1) {
    const next = station + 1;
    const upstreamBottom = vertexIndex(station, 0, 0);
    const upstreamTop = vertexIndex(station, 0, 1);
    const upstreamNextBottom = vertexIndex(next, 0, 0);
    const upstreamNextTop = vertexIndex(next, 0, 1);
    const downstreamBottom = vertexIndex(station, 1, 0);
    const downstreamTop = vertexIndex(station, 1, 1);
    const downstreamNextBottom = vertexIndex(next, 1, 0);
    const downstreamNextTop = vertexIndex(next, 1, 1);

    indices.push(upstreamBottom, upstreamNextBottom, upstreamTop);
    indices.push(upstreamTop, upstreamNextBottom, upstreamNextTop);
    indices.push(downstreamBottom, downstreamTop, downstreamNextBottom);
    indices.push(downstreamTop, downstreamNextTop, downstreamNextBottom);
    indices.push(upstreamTop, upstreamNextTop, downstreamTop);
    indices.push(downstreamTop, upstreamNextTop, downstreamNextTop);
    indices.push(upstreamBottom, downstreamBottom, upstreamNextBottom);
    indices.push(downstreamBottom, downstreamNextBottom, upstreamNextBottom);
  }

  for (const station of [0, DAM_CURVE_SEGMENTS]) {
    const upstreamBottom = vertexIndex(station, 0, 0);
    const upstreamTop = vertexIndex(station, 0, 1);
    const downstreamBottom = vertexIndex(station, 1, 0);
    const downstreamTop = vertexIndex(station, 1, 1);

    indices.push(upstreamBottom, upstreamTop, downstreamBottom);
    indices.push(downstreamBottom, upstreamTop, downstreamTop);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function damBaseY() {
  return Math.max(
    GRASS_SURFACE_Y + mountainHeightAt(damCenter.x, damCenter.z),
    reservoirLakeY() - DAM_HEIGHT_M * 0.46,
  );
}

export function addDam() {
  const baseY = damBaseY();
  const dam = new THREE.Mesh(createCurvedDamGeometry(baseY), damMaterial);
  dam.name = "curved-reservoir-dam";
  dam.renderOrder = 7;
  dam.castShadow = true;
  dam.receiveShadow = true;
  artificialElements.add(dam);
}

export function addDamDetail() {
  const baseY = damBaseY();
  const crestY = baseY + DAM_HEIGHT_M;
  const rotationY = Math.atan2(reservoirOutletDirection.x, reservoirOutletDirection.z);
  const railPostPlacements: XZPlacement[] = [];
  const spillwayGatePlacements: OrientedXYZPlacement[] = [];

  for (let index = 0; index < DAM_CREST_RAIL_POST_COUNT; index += 1) {
    const lengthOffset = THREE.MathUtils.lerp(
      -DAM_LENGTH_M * 0.44,
      DAM_LENGTH_M * 0.44,
      index / (DAM_CREST_RAIL_POST_COUNT - 1),
    );
    const point = curvedDamPoint(lengthOffset, DAM_THICKNESS_M * 0.5 - 4);
    railPostPlacements.push({ x: point.x, z: point.z });
  }

  addCylinderInstances(
    "dam-crest-safety-rail-posts",
    0.7,
    5,
    bridgeSteelMaterial,
    crestY + 5,
    railPostPlacements,
    artificialElements,
  );

  for (const sideOffset of [DAM_THICKNESS_M * 0.5 - 4, -DAM_THICKNESS_M * 0.5 + 4]) {
    const railCenter = curvedDamPoint(0, sideOffset);
    addOrientedBox(
      `dam-crest-continuous-rail-${sideOffset > 0 ? "downstream" : "upstream"}`,
      DAM_LENGTH_M * 0.9,
      1.2,
      1.8,
      bridgeSteelMaterial,
      railCenter.x,
      crestY + 5.2,
      railCenter.z,
      rotationY,
      artificialElements,
    );
  }

  for (let index = 0; index < DAM_SPILLWAY_GATE_COUNT; index += 1) {
    const lengthOffset = THREE.MathUtils.lerp(
      -DAM_LENGTH_M * 0.32,
      DAM_LENGTH_M * 0.32,
      index / (DAM_SPILLWAY_GATE_COUNT - 1),
    );
    const point = curvedDamPoint(lengthOffset, DAM_THICKNESS_M * 0.5 + 0.6);
    spillwayGatePlacements.push({
      x: point.x,
      y: baseY + DAM_HEIGHT_M * 0.48,
      z: point.z,
      rotationY,
    });
  }

  addOrientedBoxInstances(
    "dam-downstream-spillway-gates",
    18,
    18,
    1.4,
    roadDrainMaterial,
    spillwayGatePlacements,
    artificialElements,
  );

  const galleryPoint = curvedDamPoint(0, DAM_THICKNESS_M * 0.5 + 1.8);
  addOrientedBox(
    "dam-downstream-service-gallery",
    DAM_LENGTH_M * 0.74,
    4.2,
    2,
    concreteSeamMaterial,
    galleryPoint.x,
    baseY + DAM_HEIGHT_M * 0.32,
    galleryPoint.z,
    rotationY,
    artificialElements,
  );
}
