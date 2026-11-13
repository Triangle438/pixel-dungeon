export interface Rng {
  /** float in [0, 1) */
  next(): number
  /** integer in [min, max], both included */
  int(min: number, max: number): number
  pick<T>(items: readonly T[]): T
  /** current internal state, to be stored and used as the seed of a later generator */
  state(): number
}

// mulberry32: a tiny, fast seeded generator. The same seed always gives the same sequence.
export function createRng(seed: number): Rng {
  let s = seed >>> 0

  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => items[Math.floor(next() * items.length)],
    state: () => s,
  }
}
