import * as THREE from "three";
import { HIGHWAY_BRIDGE_DECK_CABLE_ANCHOR_LIFT_M, HIGHWAY_BRIDGE_DECK_CABLE_ANCHOR_OFFSET_M, HIGHWAY_BRIDGE_STAY_CABLE_COUNT_PER_FAN, HIGHWAY_BRIDGE_STAY_CABLE_RADIUS_M, HIGHWAY_BRIDGE_STAY_FAN_REACH_PROGRESS, HIGHWAY_BRIDGE_TOWER_HEIGHT_M, HIGHWAY_BRIDGE_TOWER_SIDE_OFFSET_M, HIGHWAY_BRIDGE_TOWER_WIDTH_M, HIGHWAY_DECK_THICKNESS_M, HIGHWAY_TOTAL_WIDTH_M, HIGHWAY_TUNNEL_DARK_MASK_DEPTH_M, HIGHWAY_TUNNEL_LINING_RIB_COUNT_PER_PORTAL, HIGHWAY_TUNNEL_MOUTH_SHADOW_HEIGHT_M, HIGHWAY_TUNNEL_MOUTH_SHADOW_WIDTH_M, HIGHWAY_TUNNEL_PORTAL_HEIGHT_M, HIGHWAY_TUNNEL_PORTAL_WIDTH_M, HIGHWAY_TUNNEL_ROCK_SLEEVE_DEPTH_M, SEA_Y } from "../config/constants";
import { addOrientedBox, addOrientedBoxInstances } from "../geometry/helpers";
import { pathTangent } from "../geometry/ribbons";
import { GroundPathPoint, OrientedXYZPlacement, RoadPathPoint } from "../geometry/types";
import { fullTerrainSurfaceYAt } from "../natural/terrain";
import { roadElements } from "../render/context";
import { bridgeCableMaterial, bridgeSteelMaterial, mountainCutMaterial, roadStructureConcreteMaterial, tunnelOpeningMaterial } from "../render/materials";

export function bridgeFrameAtProgress(path: RoadPathPoint[], progress: number) {
  const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1);
  const scaledIndex = clampedProgress * (path.length - 1);
  const lowerIndex = Math.floor(scaledIndex);
  const upperIndex = Math.min(path.length - 1, lowerIndex + 1);
  const localProgress = scaledIndex - lowerIndex;
  const lowerPoint = path[lowerIndex];
  const upperPoint = path[upperIndex];
  const tangent = pathTangent(path, Math.round(scaledIndex), false);

  return {
    point: {
      x: THREE.MathUtils.lerp(lowerPoint.x, upperPoint.x, localProgress),
      y: THREE.MathUtils.lerp(lowerPoint.y, upperPoint.y, localProgress),
      z: THREE.MathUtils.lerp(lowerPoint.z, upperPoint.z, localProgress),
    },
    tangent,
  };
}

export function bridgeSideVectorAtProgress(
  path: RoadPathPoint[],
  progress: number,
  offset: number,
  yLift = 0,
) {
  const { point, tangent } = bridgeFrameAtProgress(path, progress);

  return new THREE.Vector3(
    point.x + tangent.normalX * offset,
    point.y + yLift,
    point.z + tangent.normalZ * offset,
  );
}

export function addBridgeStayCableSegments(
  name: string,
  segments: Array<{ start: THREE.Vector3; end: THREE.Vector3 }>,
) {
  if (segments.length === 0) {
    return;
  }

  const mesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(
      HIGHWAY_BRIDGE_STAY_CABLE_RADIUS_M,
      HIGHWAY_BRIDGE_STAY_CABLE_RADIUS_M,
      1,
      10,
    ),
    bridgeCableMaterial,
    segments.length,
  );
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const verticalAxis = new THREE.Vector3(0, 1, 0);

  segments.forEach((segment, index) => {
    direction.subVectors(segment.end, segment.start);
    const length = direction.length();

    if (length <= 0.01) {
      return;
    }

    position.copy(segment.start).add(segment.end).multiplyScalar(0.5);
    quaternion.setFromUnitVectors(verticalAxis, direction.normalize());
    scale.set(1, length, 1);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.name = name;
  mesh.renderOrder = 14;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  roadElements.add(mesh);
}

export function addBridgeStayDeckAnchors(
  name: string,
  anchors: Array<{ position: THREE.Vector3; rotationY: number }>,
) {
  if (anchors.length === 0) {
    return;
  }

  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(4.4, 0.9, 2.8),
    bridgeSteelMaterial,
    anchors.length,
  );
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const yAxis = new THREE.Vector3(0, 1, 0);

  anchors.forEach((anchor, index) => {
    quaternion.setFromAxisAngle(yAxis, anchor.rotationY);
    matrix.compose(anchor.position, quaternion, scale);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.name = name;
  mesh.renderOrder = 13;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  roadElements.add(mesh);
}

export function bridgeStayFanTargetProgress(towerProgress: number, fanDirection: -1 | 1) {
  return THREE.MathUtils.clamp(
    towerProgress + fanDirection * HIGHWAY_BRIDGE_STAY_FAN_REACH_PROGRESS,
    0.02,
    0.98,
  );
}

export function addBridgeStayCables(name: string, path: RoadPathPoint[]) {
  const towerOffsets = [
    -HIGHWAY_BRIDGE_TOWER_SIDE_OFFSET_M,
    HIGHWAY_BRIDGE_TOWER_SIDE_OFFSET_M,
  ];
  const towerProgresses = [0.24, 0.76];
  const segments: Array<{ start: THREE.Vector3; end: THREE.Vector3 }> = [];
  const anchors: Array<{ position: THREE.Vector3; rotationY: number }> = [];

  for (const towerProgress of towerProgresses) {
    for (const offset of towerOffsets) {
      const deckOffset = Math.sign(offset) * HIGHWAY_BRIDGE_DECK_CABLE_ANCHOR_OFFSET_M;

      for (const fanDirection of [-1, 1] as const) {
        const targetProgress = bridgeStayFanTargetProgress(towerProgress, fanDirection);

        for (
          let cableIndex = 1;
          cableIndex <= HIGHWAY_BRIDGE_STAY_CABLE_COUNT_PER_FAN;
          cableIndex += 1
        ) {
          const progress = cableIndex / (HIGHWAY_BRIDGE_STAY_CABLE_COUNT_PER_FAN + 1);
          const towerAnchorLift = THREE.MathUtils.lerp(
            HIGHWAY_BRIDGE_TOWER_HEIGHT_M - 30,
            HIGHWAY_BRIDGE_TOWER_HEIGHT_M - 6,
            progress,
          );
          const deckProgress = THREE.MathUtils.lerp(towerProgress, targetProgress, progress);
          const towerAnchor = bridgeSideVectorAtProgress(
            path,
            towerProgress,
            offset,
            towerAnchorLift,
          );
          const deckAnchor = bridgeSideVectorAtProgress(
            path,
            deckProgress,
            deckOffset,
            HIGHWAY_BRIDGE_DECK_CABLE_ANCHOR_LIFT_M,
          );
          const { tangent } = bridgeFrameAtProgress(path, deckProgress);
          segments.push({ start: towerAnchor.clone(), end: deckAnchor });
          anchors.push({
            position: deckAnchor.clone().setY(deckAnchor.y - HIGHWAY_BRIDGE_DECK_CABLE_ANCHOR_LIFT_M + 0.46),
            rotationY: Math.atan2(tangent.x, tangent.z),
          });
        }
      }
    }
  }

  addBridgeStayDeckAnchors(`${name}-deck-anchors`, anchors);
  addBridgeStayCableSegments(name, segments);
}

export function addCableStayedBridgeTower(name: string, path: RoadPathPoint[], progress: number) {
  const { point, tangent } = bridgeFrameAtProgress(path, progress);
  const rotationY = Math.atan2(tangent.x, tangent.z);
  const towerTopY = point.y + HIGHWAY_BRIDGE_TOWER_HEIGHT_M;
  const towerHeight = towerTopY - SEA_Y;
  const towerOffsets = [
    -HIGHWAY_BRIDGE_TOWER_SIDE_OFFSET_M,
    HIGHWAY_BRIDGE_TOWER_SIDE_OFFSET_M,
  ];

  towerOffsets.forEach((offset, sideIndex) => {
    const sidePoint = bridgeSideVectorAtProgress(path, progress, offset);
    addOrientedBox(
      `${name}-tower-${sideIndex + 1}`,
      HIGHWAY_BRIDGE_TOWER_WIDTH_M,
      towerHeight,
      HIGHWAY_BRIDGE_TOWER_WIDTH_M,
      bridgeSteelMaterial,
      sidePoint.x,
      SEA_Y + towerHeight * 0.5,
      sidePoint.z,
      rotationY,
    );
  });

  addOrientedBox(
    `${name}-upper-crossbeam`,
    HIGHWAY_BRIDGE_TOWER_SIDE_OFFSET_M * 2 + 10,
    5,
    7,
    bridgeSteelMaterial,
    point.x,
    towerTopY,
    point.z,
    rotationY,
  );
  addOrientedBox(
    `${name}-deck-crossbeam`,
    HIGHWAY_BRIDGE_TOWER_SIDE_OFFSET_M * 2 + 7,
    3.5,
    6,
    bridgeSteelMaterial,
    point.x,
    point.y + 12,
    point.z,
    rotationY,
  );
}

export function addCableStayedBridgeStructure(name: string, path: RoadPathPoint[]) {
  addCableStayedBridgeTower(`${name}-south-pylon`, path, 0.24);
  addCableStayedBridgeTower(`${name}-north-pylon`, path, 0.76);
  addBridgeStayCables(`${name}-tirantes`, path);
  addBridgeDeckCrossGirders(`${name}-deck-cross-girders`, path);
}

export function addBridgeDeckCrossGirders(name: string, path: RoadPathPoint[]) {
  const placements: OrientedXYZPlacement[] = [];

  for (let index = 0; index < 12; index += 1) {
    const progress = (index + 0.5) / 12;
    const frame = bridgeFrameAtProgress(path, progress);
    placements.push({
      x: frame.point.x,
      y: frame.point.y - HIGHWAY_DECK_THICKNESS_M - 1.1,
      z: frame.point.z,
      rotationY: Math.atan2(frame.tangent.x, frame.tangent.z),
    });
  }

  addOrientedBoxInstances(
    name,
    HIGHWAY_TOTAL_WIDTH_M + 18,
    2.4,
    2.2,
    bridgeSteelMaterial,
    placements,
    roadElements,
  );
}

export function createArchShape(width: number, height: number) {
  const radius = width * 0.5;
  const springY = Math.max(0, height - radius);
  const shape = new THREE.Shape();

  shape.moveTo(-width * 0.5, 0);
  shape.lineTo(-width * 0.5, springY);
  for (let index = 1; index <= 32; index += 1) {
    const angle = Math.PI - (index / 32) * Math.PI;
    shape.lineTo(Math.cos(angle) * radius, springY + Math.sin(angle) * radius);
  }
  shape.lineTo(width * 0.5, 0);
  shape.lineTo(-width * 0.5, 0);
  return shape;
}

export function createArchHolePath(width: number, height: number) {
  const radius = width * 0.5;
  const springY = Math.max(0, height - radius);
  const path = new THREE.Path();

  path.moveTo(-width * 0.5, 0);
  path.lineTo(width * 0.5, 0);
  path.lineTo(width * 0.5, springY);
  for (let index = 1; index <= 32; index += 1) {
    const angle = (index / 32) * Math.PI;
    path.lineTo(Math.cos(angle) * radius, springY + Math.sin(angle) * radius);
  }
  path.lineTo(-width * 0.5, 0);
  return path;
}

export function createArchRingGeometry(
  outerWidth: number,
  outerHeight: number,
  innerWidth: number,
  innerHeight: number,
) {
  const shape = createArchShape(outerWidth, outerHeight);
  shape.holes.push(createArchHolePath(innerWidth, innerHeight));
  const geometry = new THREE.ShapeGeometry(shape, 32);
  geometry.computeVertexNormals();
  return geometry;
}

export function createArchFaceGeometry(width: number, height: number) {
  const geometry = new THREE.ShapeGeometry(createArchShape(width, height), 32);
  geometry.computeVertexNormals();
  return geometry;
}

export function createTunnelRockSleeveGeometry(
  outerWidth: number,
  outerHeight: number,
  innerWidth: number,
  innerHeight: number,
  depth: number,
) {
  const shape = createArchShape(outerWidth, outerHeight);
  shape.holes.push(createArchHolePath(innerWidth, innerHeight));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 24,
    steps: 1,
  });
  geometry.translate(0, 0, -depth);
  geometry.computeVertexNormals();
  return geometry;
}

export function addOrientedArchRing(
  name: string,
  outerWidth: number,
  outerHeight: number,
  innerWidth: number,
  innerHeight: number,
  material: THREE.Material,
  x: number,
  bottomY: number,
  z: number,
  rotationY: number,
  normalOffset: number,
  renderOrder: number,
) {
  const mesh = new THREE.Mesh(
    createArchRingGeometry(outerWidth, outerHeight, innerWidth, innerHeight),
    material,
  );
  const normalX = Math.sin(rotationY);
  const normalZ = Math.cos(rotationY);

  mesh.name = name;
  mesh.position.set(x + normalX * normalOffset, bottomY, z + normalZ * normalOffset);
  mesh.rotation.y = rotationY;
  mesh.renderOrder = renderOrder;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  roadElements.add(mesh);
}

export function addOrientedArchFace(
  name: string,
  width: number,
  height: number,
  material: THREE.Material,
  x: number,
  bottomY: number,
  z: number,
  rotationY: number,
  normalOffset: number,
  renderOrder: number,
) {
  const mesh = new THREE.Mesh(createArchFaceGeometry(width, height), material);
  const normalX = Math.sin(rotationY);
  const normalZ = Math.cos(rotationY);

  mesh.name = name;
  mesh.position.set(x + normalX * normalOffset, bottomY, z + normalZ * normalOffset);
  mesh.rotation.y = rotationY;
  mesh.renderOrder = renderOrder;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  roadElements.add(mesh);
}

export function addOrientedTunnelRockSleeve(
  name: string,
  outerWidth: number,
  outerHeight: number,
  innerWidth: number,
  innerHeight: number,
  depth: number,
  x: number,
  bottomY: number,
  z: number,
  rotationY: number,
  normalOffset: number,
  renderOrder: number,
  material: THREE.Material = mountainCutMaterial,
) {
  const mesh = new THREE.Mesh(
    createTunnelRockSleeveGeometry(
      outerWidth,
      outerHeight,
      innerWidth,
      innerHeight,
      depth,
    ),
    material,
  );
  const normalX = Math.sin(rotationY);
  const normalZ = Math.cos(rotationY);

  mesh.name = name;
  mesh.position.set(x + normalX * normalOffset, bottomY, z + normalZ * normalOffset);
  mesh.rotation.y = rotationY;
  mesh.renderOrder = renderOrder;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  roadElements.add(mesh);
}

export function createHeadwallGeometry(width: number, height: number, archWidth: number, archHeight: number, thickness: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-width * 0.5, 0);
  shape.lineTo(width * 0.5, 0);
  shape.lineTo(width * 0.5, height);
  shape.lineTo(-width * 0.5, height);
  shape.lineTo(-width * 0.5, 0);
  shape.holes.push(createArchHolePath(archWidth, archHeight));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false, curveSegments: 24, steps: 1 });
  geometry.translate(0, 0, -thickness);
  geometry.computeVertexNormals();
  return geometry;
}

export function addTunnelPortal(
  name: string,
  point: RoadPathPoint,
  outwardNormal: GroundPathPoint,
  portalOutsetM = 0,
) {
  const normalLength = Math.hypot(outwardNormal.x, outwardNormal.z) || 1;
  const outwardX = outwardNormal.x / normalLength;
  const outwardZ = outwardNormal.z / normalLength;
  const portalX = point.x + outwardX * portalOutsetM;
  const portalZ = point.z + outwardZ * portalOutsetM;
  const rotationY = Math.atan2(outwardX, outwardZ);
  const portalBaseY = point.y - HIGHWAY_DECK_THICKNESS_M;
  const frameOffset = HIGHWAY_TUNNEL_PORTAL_WIDTH_M * 0.5 + 4.5;
  const frameAxisX = Math.cos(rotationY);
  const frameAxisZ = -Math.sin(rotationY);
  const coverY = Math.min(
    fullTerrainSurfaceYAt({ x: portalX - outwardX * 22, z: portalZ - outwardZ * 22 }),
    fullTerrainSurfaceYAt({ x: portalX - outwardX * 36, z: portalZ - outwardZ * 36 }),
  );
  const cover = coverY - portalBaseY;
  const headwallHeight = HIGHWAY_TUNNEL_PORTAL_HEIGHT_M + 4.5;
  const collarHeight = Math.max(HIGHWAY_TUNNEL_PORTAL_HEIGHT_M + 1, Math.min(headwallHeight - 0.6, cover + 2));
  const sleeveDepth = Math.min(HIGHWAY_TUNNEL_ROCK_SLEEVE_DEPTH_M, 12);

  addOrientedTunnelRockSleeve(
    `${name}-rock-sleeve`,
    HIGHWAY_TUNNEL_PORTAL_WIDTH_M + 8,
    collarHeight,
    HIGHWAY_TOTAL_WIDTH_M + 6,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 7,
    sleeveDepth,
    portalX,
    portalBaseY - 5,
    portalZ,
    rotationY,
    -3.5,
    9,
  );
  const headwall = new THREE.Mesh(
    createHeadwallGeometry(HIGHWAY_TUNNEL_PORTAL_WIDTH_M + 10, headwallHeight, HIGHWAY_TUNNEL_PORTAL_WIDTH_M, HIGHWAY_TUNNEL_PORTAL_HEIGHT_M, 2.4),
    roadStructureConcreteMaterial,
  );
  headwall.name = `${name}-concrete-headwall`;
  headwall.position.set(portalX + outwardX * 0.6, portalBaseY - 0.5, portalZ + outwardZ * 0.6);
  headwall.rotation.y = rotationY;
  headwall.renderOrder = 10.5;
  headwall.castShadow = true;
  headwall.receiveShadow = true;
  roadElements.add(headwall);
  addOrientedBox(
    `${name}-headwall-parapet`,
    HIGHWAY_TUNNEL_PORTAL_WIDTH_M + 10.6,
    0.9,
    3.2,
    roadStructureConcreteMaterial,
    portalX - outwardX * 0.6,
    portalBaseY - 0.5 + headwallHeight + 0.45,
    portalZ - outwardZ * 0.6,
    rotationY,
  );
  addOrientedArchRing(
    `${name}-concrete-rounded-frame`,
    HIGHWAY_TUNNEL_PORTAL_WIDTH_M,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M,
    HIGHWAY_TOTAL_WIDTH_M + 9,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 6,
    roadStructureConcreteMaterial,
    portalX,
    portalBaseY - 0.5,
    portalZ,
    rotationY,
    0.8,
    11,
  );
  addOrientedArchFace(
    `${name}-black-mouth-shadow`,
    HIGHWAY_TUNNEL_MOUTH_SHADOW_WIDTH_M,
    HIGHWAY_TUNNEL_MOUTH_SHADOW_HEIGHT_M,
    tunnelOpeningMaterial,
    portalX,
    portalBaseY + 0.25,
    portalZ,
    rotationY,
    0.18,
    11.5,
  );
  addOrientedArchRing(
    `${name}-dark-tunnel-liner`,
    HIGHWAY_TOTAL_WIDTH_M + 5,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 8,
    HIGHWAY_TOTAL_WIDTH_M + 1.5,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 14,
    tunnelOpeningMaterial,
    portalX,
    portalBaseY + 0.6,
    portalZ,
    rotationY,
    0.45,
    12,
  );
  addOrientedTunnelRockSleeve(
    `${name}-dark-interior-throat`,
    HIGHWAY_TOTAL_WIDTH_M + 5,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 8,
    HIGHWAY_TOTAL_WIDTH_M + 1.5,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 14,
    HIGHWAY_TUNNEL_DARK_MASK_DEPTH_M,
    portalX,
    portalBaseY + 0.6,
    portalZ,
    rotationY,
    -0.85,
    12,
    tunnelOpeningMaterial,
  );
  addOrientedArchFace(
    `${name}-dark-depth-mask`,
    HIGHWAY_TOTAL_WIDTH_M + 1.5,
    HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 14,
    tunnelOpeningMaterial,
    portalX,
    portalBaseY + 0.6,
    portalZ,
    rotationY,
    -HIGHWAY_TUNNEL_DARK_MASK_DEPTH_M - 1.1,
    13,
  );
  for (let ribIndex = 0; ribIndex < HIGHWAY_TUNNEL_LINING_RIB_COUNT_PER_PORTAL; ribIndex += 1) {
    addOrientedArchRing(
      `${name}-interior-concrete-lining-rib-${ribIndex + 1}`,
      HIGHWAY_TOTAL_WIDTH_M + 8,
      HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 5,
      HIGHWAY_TOTAL_WIDTH_M + 2,
      HIGHWAY_TUNNEL_PORTAL_HEIGHT_M - 12,
      roadStructureConcreteMaterial,
      portalX,
      portalBaseY + 0.85,
      portalZ,
      rotationY,
      -5 - ribIndex * 7,
      12.5,
    );
  }
  for (const side of [-1, 1] as const) {
    const wingLength = 22;
    const wingAngle = side * 0.42;
    const hingeX = portalX + frameAxisX * frameOffset * side;
    const hingeZ = portalZ + frameAxisZ * frameOffset * side;
    const dirX = frameAxisX * side * Math.cos(wingAngle) + outwardX * Math.sin(wingAngle) * 1;
    const dirZ = frameAxisZ * side * Math.cos(wingAngle) + outwardZ * Math.sin(wingAngle) * 1;
    addOrientedBox(
      `${name}-${side < 0 ? "left" : "right"}-wing-wall`,
      wingLength,
      headwallHeight * 0.6,
      1.6,
      roadStructureConcreteMaterial,
      hingeX + dirX * wingLength * 0.5,
      portalBaseY - 0.5 + headwallHeight * 0.3,
      hingeZ + dirZ * wingLength * 0.5,
      Math.atan2(dirX, dirZ) + Math.PI / 2,
    );
  }
}
