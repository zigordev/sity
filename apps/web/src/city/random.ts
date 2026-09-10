export function createRandom(seed: number) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash2(x: number, z: number, seed = 0) {
  let h = Math.imul((Math.round(x * 10) | 0) ^ 0x27d4eb2d, 0x165667b1);
  h ^= Math.imul((Math.round(z * 10) | 0) ^ 0x5bd1e995, 0x85ebca6b);
  h ^= Math.imul(seed | 0, 0xc2b2ae35);
  h ^= h >>> 13;
  h = Math.imul(h, 0x27d4eb2f);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
