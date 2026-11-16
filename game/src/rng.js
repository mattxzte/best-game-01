// Prismweave — a small seeded random generator, so decorative randomness
// (starfields, sparkles, drifting dust) is identical for a given seed.
// Gameplay never depends on it: every beam, mirror and prism is exact.

export function makeRng(seed) {
  let state = (seed >>> 0) || 1;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickFrom(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

export function rangeFrom(rng, low, high) {
  return low + rng() * (high - low);
}
