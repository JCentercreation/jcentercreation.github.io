/** Small, fast value-noise utilities for generating textures on a 2D canvas at load time. */

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tileable 2D value noise on a `period`-sized lattice. */
export function makeNoise(seed: number, period = 256) {
  const rand = mulberry32(seed);
  const table = new Float32Array(period * period);
  for (let i = 0; i < table.length; i++) table[i] = rand();
  const at = (x: number, y: number) => table[(((y % period) + period) % period) * period + (((x % period) + period) % period)]!;
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  /** Fractal sum, roughly 0..1. `scale` = lattice cells across the tile (must divide period to tile). */
  const fbm = (x: number, y: number, scale: number, octaves = 4) => {
    let sum = 0;
    let amp = 0.5;
    let f = scale;
    for (let o = 0; o < octaves; o++) {
      sum += amp * noise(x * f, y * f);
      f *= 2;
      amp *= 0.5;
    }
    return sum / (1 - Math.pow(0.5, octaves));
  };
  return { noise, fbm };
}
