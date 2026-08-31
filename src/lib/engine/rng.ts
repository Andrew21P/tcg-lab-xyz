/** Seeded mulberry32 PRNG for deterministic sims. */

export type Rng = {
  seed: number;
  next(): number;
  nextInt(n: number): number;
  shuffle<T>(arr: T[]): T[];
  chance(p: number): boolean;
};

export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(n: number): number {
    if (n <= 0) return 0;
    return Math.floor(next() * n);
  }

  function shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = nextInt(i + 1);
      const tmp = a[i]!;
      a[i] = a[j]!;
      a[j] = tmp;
    }
    return a;
  }

  function chance(p: number): boolean {
    if (p <= 0) return false;
    if (p >= 1) return true;
    return next() < p;
  }

  return { seed, next, nextInt, shuffle, chance };
}
