import { CanvasTexture, NoColorSpace, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import { makeNoise, mulberry32 } from './noise';
import { textureTimings } from './proceduralTextures';

/**
 * Small tileable detail textures for Phase B materials (all generated, all shared):
 * leather grain, woven jute, felt, brushed metal, concrete micro-detail, book page edges.
 * Each is a few hundred pixels and repeats at a real-world scale set by the material.
 */

const cache = new Map<string, Texture>();

function make(key: string, w: number, h: number, srgb: boolean, px: (x: number, y: number) => [number, number, number]): Texture {
  const hit = cache.get(key);
  if (hit) return hit;
  const t0 = performance.now();
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [r, gg, b] = px(x, y);
      const i = (y * w + x) * 4;
      img.data[i] = r * 255;
      img.data[i + 1] = gg * 255;
      img.data[i + 2] = b * 255;
      img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  t.anisotropy = 8;
  cache.set(key, t);
  textureTimings[key] = Math.round(performance.now() - t0);
  return t;
}

/** Normal map from a tileable height function (w × h). */
function normalFrom(key: string, w: number, h: number, height: (x: number, y: number) => number, strength: number): Texture {
  const hs = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) hs[y * w + x] = height(x, y);
  const at = (x: number, y: number) => hs[((y + h) % h) * w + ((x + w) % w)]!;
  return make(key, w, h, false, (x, y) => {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
    const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
    const l = Math.hypot(dx, dy, 1);
    return [(-dx / l) * 0.5 + 0.5, (dy / l) * 0.5 + 0.5, (1 / l) * 0.5 + 0.5];
  });
}

/** A tileable low-frequency field on a coarse grid, sampled bilinearly (cheap). */
function coarse(n: number, fn: (u: number, v: number) => number) {
  const g = new Float32Array(n * n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) g[y * n + x] = fn(x / n, y / n);
  return (u: number, v: number) => {
    const fx = (((u % 1) + 1) % 1) * n;
    const fy = (((v % 1) + 1) % 1) * n;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    const at = (x: number, y: number) => g[(y % n) * n + (x % n)]!;
    return (at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx) * (1 - ty) + (at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx) * ty;
  };
}

/** Voronoi-like cell distance on a jittered grid (tileable), for leather pebble grain. */
function cells(seed: number, n: number) {
  const rand = mulberry32(seed);
  const pts = Array.from({ length: n * n }, () => [rand(), rand()] as [number, number]);
  return (u: number, v: number) => {
    const fx = u * n;
    const fy = v * n;
    const cx = Math.floor(fx);
    const cy = Math.floor(fy);
    let d1 = 9;
    let d2 = 9;
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) {
        const gx = cx + i;
        const gy = cy + j;
        const p = pts[(((gy % n) + n) % n) * n + (((gx % n) + n) % n)]!;
        const d = Math.hypot(gx + p[0] - fx, gy + p[1] - fy);
        if (d < d1) {
          d2 = d1;
          d1 = d;
        } else if (d < d2) d2 = d;
      }
    return [d1, d2] as const;
  };
}

// ------------------------------------------------------------------------------------------ leather

/** Leather: pebble grain (cells) + soft mottling. Height → normal; roughness; neutral tone map. One tile ≈ 12 cm. */
export function leather() {
  const S = 512;
  const cell = cells(201, 48);
  const { fbm, noise } = makeNoise(202);
  // The grain is computed once and shared by the three maps.
  const grain = new Float32Array(S * S);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const [d1, d2] = cell(x / S, y / S);
      grain[y * S + x] = Math.min(1, (d2 - d1) * 6) * 0.8 + noise(x * 0.5, y * 0.5) * 0.2; // valleys between pebbles
    }
  const height = (x: number, y: number) => grain[y * S + x]!;
  const mottle = coarse(64, (u, v) => fbm(u, v, 3, 3));
  return {
    normalMap: normalFrom('leatherN', S, S, height, 1.8),
    roughnessMap: make('leatherR', S, S, false, (x, y) => {
      const r = 0.82 + (1 - height(x, y)) * 0.18 + (mottle(x / S, y / S) - 0.5) * 0.25;
      return [r, r, r];
    }),
    map: make('leatherC', S, S, true, (x, y) => {
      const m = 0.9 + mottle(x / S + 0.37, y / S) * 0.14 - (1 - height(x, y)) * 0.06;
      return [m, m, m];
    }),
  };
}

// ------------------------------------------------------------------------------------------ textiles

/** Woven jute: alternating over/under yarns. Normal + roughness. One tile ≈ 4 cm (8 × 8 yarns). */
export function weave() {
  const S = 256;
  const yarns = 8;
  const { noise } = makeNoise(211);
  const height = (x: number, y: number) => {
    const u = (x / S) * yarns;
    const v = (y / S) * yarns;
    const iu = Math.floor(u);
    const iv = Math.floor(v);
    const fu = u - iu;
    const fv = v - iv;
    const warpOnTop = (iu + iv) % 2 === 0;
    const warp = Math.sin(fu * Math.PI); // yarn running along v
    const weft = Math.sin(fv * Math.PI); // yarn running along u
    const fuzz = noise(x * 0.8, y * 0.8) * 0.25;
    return (warpOnTop ? Math.max(warp, weft * 0.6) : Math.max(weft, warp * 0.6)) + fuzz;
  };
  return {
    normalMap: normalFrom('weaveN', S, S, height, 2.5),
    roughnessMap: make('weaveR', S, S, false, (x, y) => {
      const r = 0.88 + (1 - height(x, y)) * 0.12;
      return [r, r, r];
    }),
  };
}

/** Felt: fine, non-directional fibre noise (normal only). One tile ≈ 5 cm. */
export function felt() {
  const S = 256;
  const { fbm, noise } = makeNoise(221);
  return {
    normalMap: normalFrom('feltN', S, S, (x, y) => fbm(x / S, y / S, 16, 2) * 0.6 + noise(x * 0.9, y * 0.9) * 0.4, 1.2),
  };
}

// ------------------------------------------------------------------------------------------ metal

/** Brushed metal: fine lines along u (roughness multiplier around 1). Tile ≈ 6 cm along the brush. */
export function brushed() {
  const W = 64;
  const H = 512;
  const rand = mulberry32(231);
  const lines = Float32Array.from({ length: H }, () => rand());
  const { noise } = makeNoise(232);
  return make('brushedR', W, H, false, (x, y) => {
    // Streaks: each row (v) has its own value, slowly varying along u.
    const r = 0.86 + lines[y]! * 0.18 + (noise(x * 0.05 + y * 0.3, y * 0.9) - 0.5) * 0.08;
    return [r, r, r];
  });
}

// ------------------------------------------------------------------------------------------ concrete detail

/**
 * Concrete micro-detail (0.6 m tile): polish swirls and fine pitting. R = roughness multiplier,
 * G = albedo multiplier. Combined in world space with the 3 m base tile and a macro noise
 * (library.ts) so the floor has two scales of detail and no visible repeat.
 */
export function concreteDetail() {
  const S = 512;
  const { fbm, noise } = makeNoise(241);
  return make('concreteDetail', S, S, false, (x, y) => {
    const u = x / S;
    const v = y / S;
    const swirl = fbm(u + Math.sin(v * 6.283) * 0.05, v, 6, 3);
    const pit = noise(x * 1.3, y * 1.3) > 0.9 ? 1 : 0;
    const r = 0.5 + (swirl - 0.5) * 0.6 + pit * 0.25;
    const g = 0.5 + (fbm(u, v, 12, 2) - 0.5) * 0.25 - pit * 0.15;
    return [Math.max(0, Math.min(1, r)), Math.max(0, Math.min(1, g)), 0.5];
  });
}

// ------------------------------------------------------------------------------------------ books

/** Page edges: fine, slightly uneven lines across the page block (repeats per book face). */
export function pageEdges() {
  const W = 32;
  const H = 256;
  const rand = mulberry32(251);
  const rows = Float32Array.from({ length: H }, () => rand());
  return make('pageEdges', W, H, true, (_x, y) => {
    const k = 0.88 + rows[y]! * 0.12 - (y % 3 === 0 ? 0.04 : 0);
    return [0.94 * k, 0.91 * k, 0.84 * k];
  });
}
