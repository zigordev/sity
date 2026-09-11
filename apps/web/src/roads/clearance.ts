import * as THREE from "three";
import { artificialElements, cityElements, naturalElements, vegetationElements } from "../render/context";
import { mainBoundaryMaxX, mainBoundaryMaxZ, mainBoundaryMinX, mainBoundaryMinZ } from "../world/frame";
import type { Vec3 } from "./network";
import { forEachPavementTriangle } from "./pavement";
import { roadSideSlots } from "./render";

const LEVEL_GAP_M = 2.5;
const FLUSH_TOLERANCE_M = 0.05;
const VISIBLE_RISE_M = 0.02;
const CLEARANCE_ENVELOPE_M = 4.5;
const OVERHEAD_ENVELOPE_M = 12;
const SAMPLE_SPACING_M = 25;
const MAX_SAMPLES = 16;

interface Raster {
  minX: number;
  minZ: number;
  columns: number;
  rows: number;
  low: Float32Array;
  high: Map<number, number>;
  multiLevel: Uint8Array;
  owner: Uint16Array;
  owners: string[];
  ownerIds: Map<string, number>;
  rowStart: Int32Array;
  cells: Int32Array;
}

export interface RoadClearanceSample {
  x: number;
  z: number;
  rise: number;
  owner: string;
}

export interface RoadClearanceOffender {
  mesh: string;
  group: string;
  visibleCells: number;
  flushCells: number;
  overheadCells: number;
  maxRise: number;
  samples: RoadClearanceSample[];
}

export interface RoadClearanceAudit {
  pavementCells: number;
  multiLevelCells: number;
  meshesScanned: number;
  trianglesScanned: number;
  elapsedMs: number;
  offenders: RoadClearanceOffender[];
}

interface OffenderState {
  mesh: string;
  group: string;
  visible: Set<number>;
  flush: Set<number>;
  overhead: Set<number>;
  maxRise: number;
  samples: RoadClearanceSample[];
}

function createRaster(): Raster {
  const minX = Math.floor(mainBoundaryMinX) - 2;
  const minZ = Math.floor(mainBoundaryMinZ) - 2;
  const columns = Math.ceil(mainBoundaryMaxX) + 2 - minX;
  const rows = Math.ceil(mainBoundaryMaxZ) + 2 - minZ;
  const low = new Float32Array(columns * rows);
  low.fill(Number.NaN);
  return {
    minX,
    minZ,
    columns,
    rows,
    low,
    high: new Map(),
    multiLevel: new Uint8Array(columns * rows),
    owner: new Uint16Array(columns * rows),
    owners: [""],
    ownerIds: new Map(),
    rowStart: new Int32Array(0),
    cells: new Int32Array(0),
  };
}

function ownerIndex(raster: Raster, name: string) {
  let id = raster.ownerIds.get(name);
  if (id === undefined) {
    id = raster.owners.length;
    raster.owners.push(name);
    raster.ownerIds.set(name, id);
  }
  return id;
}

function markCell(raster: Raster, index: number, top: number, owner: number) {
  const current = raster.low[index];
  if (Number.isNaN(current)) {
    raster.low[index] = top;
    raster.owner[index] = owner;
    return;
  }
  if (top < current - LEVEL_GAP_M) {
    raster.high.set(index, Math.max(raster.high.get(index) ?? current, current));
    raster.multiLevel[index] = 1;
    raster.low[index] = top;
    raster.owner[index] = owner;
    return;
  }
  if (top > current + LEVEL_GAP_M) {
    raster.high.set(index, Math.max(raster.high.get(index) ?? top, top));
    raster.multiLevel[index] = 1;
    return;
  }
  if (top < current) {
    raster.low[index] = top;
  }
}

function markTriangle(raster: Raster, a: Vec3, b: Vec3, c: Vec3, lift: number, owner: number) {
  const denominator = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
  if (Math.abs(denominator) < 1e-9) {
    return;
  }
  const minColumn = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x) - raster.minX));
  const maxColumn = Math.min(raster.columns - 1, Math.floor(Math.max(a.x, b.x, c.x) - raster.minX));
  const minRow = Math.max(0, Math.floor(Math.min(a.z, b.z, c.z) - raster.minZ));
  const maxRow = Math.min(raster.rows - 1, Math.floor(Math.max(a.z, b.z, c.z) - raster.minZ));
  for (let row = minRow; row <= maxRow; row += 1) {
    const pz = raster.minZ + row + 0.5;
    for (let column = minColumn; column <= maxColumn; column += 1) {
      const px = raster.minX + column + 0.5;
      const u = ((b.z - c.z) * (px - c.x) + (c.x - b.x) * (pz - c.z)) / denominator;
      const v = ((c.z - a.z) * (px - c.x) + (a.x - c.x) * (pz - c.z)) / denominator;
      const w = 1 - u - v;
      if (u < -1e-6 || v < -1e-6 || w < -1e-6) {
        continue;
      }
      markCell(raster, row * raster.columns + column, a.y * u + b.y * v + c.y * w + lift, owner);
    }
  }
}

function indexRaster(raster: Raster) {
  const rowStart = new Int32Array(raster.rows + 1);
  let count = 0;
  for (let row = 0; row < raster.rows; row += 1) {
    rowStart[row] = count;
    const base = row * raster.columns;
    for (let column = 0; column < raster.columns; column += 1) {
      if (!Number.isNaN(raster.low[base + column])) {
        count += 1;
      }
    }
  }
  rowStart[raster.rows] = count;
  const cells = new Int32Array(count);
  let cursor = 0;
  for (let row = 0; row < raster.rows; row += 1) {
    const base = row * raster.columns;
    for (let column = 0; column < raster.columns; column += 1) {
      if (!Number.isNaN(raster.low[base + column])) {
        cells[cursor] = column;
        cursor += 1;
      }
    }
  }
  raster.rowStart = rowStart;
  raster.cells = cells;
}

function firstCellAtOrAfter(raster: Raster, start: number, end: number, column: number) {
  let lo = start;
  let hi = end;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (raster.cells[mid] < column) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

function anyPavement(raster: Raster, minX: number, maxX: number, minZ: number, maxZ: number) {
  const minColumn = Math.max(0, Math.floor(minX - raster.minX));
  const maxColumn = Math.min(raster.columns - 1, Math.floor(maxX - raster.minX));
  const minRow = Math.max(0, Math.floor(minZ - raster.minZ));
  const maxRow = Math.min(raster.rows - 1, Math.floor(maxZ - raster.minZ));
  for (let row = minRow; row <= maxRow; row += 1) {
    const start = raster.rowStart[row];
    const end = raster.rowStart[row + 1];
    if (start === end) {
      continue;
    }
    const k = firstCellAtOrAfter(raster, start, end, minColumn);
    if (k < end && raster.cells[k] <= maxColumn) {
      return true;
    }
  }
  return false;
}

function record(raster: Raster, state: OffenderState, index: number, rise: number, envelope: number, px: number, pz: number) {
  if (rise <= -FLUSH_TOLERANCE_M || rise > envelope) {
    return;
  }
  if (rise <= VISIBLE_RISE_M) {
    state.flush.add(index);
    return;
  }
  if (rise > CLEARANCE_ENVELOPE_M) {
    state.overhead.add(index);
    return;
  }
  state.visible.add(index);
  state.maxRise = Math.max(state.maxRise, rise);
  if (state.samples.length < MAX_SAMPLES && state.samples.every((sample) => Math.hypot(sample.x - px, sample.z - pz) > SAMPLE_SPACING_M)) {
    state.samples.push({ x: Math.round(px), z: Math.round(pz), rise: Math.round(rise * 100) / 100, owner: raster.owners[raster.owner[index]] });
  }
}

function scanTriangle(raster: Raster, state: OffenderState, ax: number, ay: number, az: number, bx: number, by: number, bz: number, cx: number, cy: number, cz: number) {
  const denominator = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
  if (Math.abs(denominator) < 1e-9) {
    return;
  }
  const minColumn = Math.max(0, Math.floor(Math.min(ax, bx, cx) - raster.minX));
  const maxColumn = Math.min(raster.columns - 1, Math.floor(Math.max(ax, bx, cx) - raster.minX));
  const minRow = Math.max(0, Math.floor(Math.min(az, bz, cz) - raster.minZ));
  const maxRow = Math.min(raster.rows - 1, Math.floor(Math.max(az, bz, cz) - raster.minZ));
  if (minColumn > maxColumn || minRow > maxRow) {
    return;
  }
  for (let row = minRow; row <= maxRow; row += 1) {
    const start = raster.rowStart[row];
    const end = raster.rowStart[row + 1];
    if (start === end) {
      continue;
    }
    const pz = raster.minZ + row + 0.5;
    for (let k = firstCellAtOrAfter(raster, start, end, minColumn); k < end; k += 1) {
      const column = raster.cells[k];
      if (column > maxColumn) {
        break;
      }
      const px = raster.minX + column + 0.5;
      const u = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / denominator;
      const v = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / denominator;
      const w = 1 - u - v;
      if (u < -1e-6 || v < -1e-6 || w < -1e-6) {
        continue;
      }
      const y = ay * u + by * v + cy * w;
      const index = row * raster.columns + column;
      const low = raster.low[index];
      if (raster.multiLevel[index]) {
        const high = raster.high.get(index) ?? low;
        record(raster, state, index, y - low, Math.min(OVERHEAD_ENVELOPE_M, high - low - 2), px, pz);
        record(raster, state, index, y - high, OVERHEAD_ENVELOPE_M, px, pz);
      } else {
        record(raster, state, index, y - low, OVERHEAD_ENVELOPE_M, px, pz);
      }
    }
  }
}

function isShown(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (!current.visible) {
      return false;
    }
    current = current.parent;
  }
  return true;
}

function furnitureTreeKeys() {
  const keys = new Set<string>();
  for (const slot of [...roadSideSlots.streetTrees, ...roadSideSlots.medianTrees]) {
    keys.add(`${slot.x.toFixed(1)}:${slot.z.toFixed(1)}`);
  }
  return keys;
}

export function auditRoadClearance(): RoadClearanceAudit {
  const started = performance.now();
  const raster = createRaster();
  forEachPavementTriangle((a, b, c, lift, _floor, owner) => markTriangle(raster, a, b, c, lift, ownerIndex(raster, owner)));
  indexRaster(raster);
  const furnitureTrees = furnitureTreeKeys();
  const states = new Map<string, OffenderState>();
  let meshesScanned = 0;
  let trianglesScanned = 0;
  const matrix = new THREE.Matrix4();
  const instanceMatrix = new THREE.Matrix4();
  const center = new THREE.Vector3();
  const groups: Array<[string, THREE.Object3D]> = [
    ["natural", naturalElements],
    ["artificial", artificialElements],
    ["city", cityElements],
    ["vegetation", vegetationElements],
  ];
  for (const [groupName, group] of groups) {
    group.updateMatrixWorld(true);
    group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh || !isShown(object) || object.userData.roadClearanceIgnore) {
        return;
      }
      const geometry = mesh.geometry as THREE.BufferGeometry;
      const position = geometry.getAttribute("position");
      if (!position) {
        return;
      }
      if (!geometry.boundingSphere) {
        geometry.computeBoundingSphere();
      }
      const sphere = geometry.boundingSphere;
      const instanced = (mesh as THREE.InstancedMesh).isInstancedMesh ? (mesh as THREE.InstancedMesh) : undefined;
      const count = instanced ? instanced.count : 1;
      const key = `${groupName}:${mesh.name || "unnamed"}`;
      let state = states.get(key);
      if (!state) {
        state = { mesh: mesh.name || "unnamed", group: groupName, visible: new Set(), flush: new Set(), overhead: new Set(), maxRise: 0, samples: [] };
        states.set(key, state);
      }
      meshesScanned += 1;
      const index = geometry.index;
      const triangleCount = index ? Math.floor(index.count / 3) : Math.floor(position.count / 3);
      const world = new Float32Array(position.count * 3);
      const isTree = mesh.name.startsWith("trees-");
      for (let instance = 0; instance < count; instance += 1) {
        if (instanced) {
          instanced.getMatrixAt(instance, instanceMatrix);
          if (isTree && furnitureTrees.has(`${instanceMatrix.elements[12].toFixed(1)}:${instanceMatrix.elements[14].toFixed(1)}`)) {
            continue;
          }
          matrix.multiplyMatrices(mesh.matrixWorld, instanceMatrix);
        } else {
          matrix.copy(mesh.matrixWorld);
        }
        if (sphere) {
          center.copy(sphere.center).applyMatrix4(matrix);
          const radius = sphere.radius * matrix.getMaxScaleOnAxis();
          if (!anyPavement(raster, center.x - radius, center.x + radius, center.z - radius, center.z + radius)) {
            continue;
          }
        }
        const e = matrix.elements;
        for (let vertex = 0; vertex < position.count; vertex += 1) {
          const x = position.getX(vertex);
          const y = position.getY(vertex);
          const z = position.getZ(vertex);
          world[vertex * 3] = x * e[0] + y * e[4] + z * e[8] + e[12];
          world[vertex * 3 + 1] = x * e[1] + y * e[5] + z * e[9] + e[13];
          world[vertex * 3 + 2] = x * e[2] + y * e[6] + z * e[10] + e[14];
        }
        for (let triangle = 0; triangle < triangleCount; triangle += 1) {
          const ia = index ? index.getX(triangle * 3) : triangle * 3;
          const ib = index ? index.getX(triangle * 3 + 1) : triangle * 3 + 1;
          const ic = index ? index.getX(triangle * 3 + 2) : triangle * 3 + 2;
          scanTriangle(
            raster,
            state,
            world[ia * 3],
            world[ia * 3 + 1],
            world[ia * 3 + 2],
            world[ib * 3],
            world[ib * 3 + 1],
            world[ib * 3 + 2],
            world[ic * 3],
            world[ic * 3 + 1],
            world[ic * 3 + 2],
          );
        }
        trianglesScanned += triangleCount;
      }
    });
  }
  const offenders = [...states.values()]
    .filter((state) => state.visible.size > 0 || state.flush.size > 0 || state.overhead.size > 0)
    .map((state) => ({
      mesh: state.mesh,
      group: state.group,
      visibleCells: state.visible.size,
      flushCells: state.flush.size,
      overheadCells: state.overhead.size,
      maxRise: Math.round(state.maxRise * 100) / 100,
      samples: state.samples,
    }))
    .sort((a, b) => b.visibleCells - a.visibleCells || b.flushCells - a.flushCells || b.overheadCells - a.overheadCells);
  return {
    pavementCells: raster.cells.length,
    multiLevelCells: raster.high.size,
    meshesScanned,
    trianglesScanned,
    elapsedMs: Math.round(performance.now() - started),
    offenders,
  };
}
