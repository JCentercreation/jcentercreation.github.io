import { CanvasTexture, RepeatWrapping, SRGBColorSpace, NoColorSpace, type Texture } from 'three';
import { makeNoise, mulberry32 } from './noise';

/**
 * PROVISIONAL materials, generated at load time so the prototype needs no downloads.
 * Final versions will be scanned / baked texture sets (KTX2) from Blender — the material
 * slots that consume these (map / roughnessMap / normalMap) stay the same.
 */

export interface TextureSet {
  map: Texture;
  roughnessMap: Texture;
  normalMap: Texture;
}

const cache = new Map<string, TextureSet>();

function canvas(size: number) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

function finish(c: HTMLCanvasElement, srgb: boolean): Texture {
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** Build albedo, roughness and a normal map (from a height field) in one pass. */
function build(
  key: string,
  size: number,
  sample: (u: number, v: number) => { r: number; g: number; b: number; rough: number; height: number },
  normalStrength: number,
): TextureSet {
  const hit = cache.get(key);
  if (hit) return hit;

  const albedo = canvas(size);
  const rough = canvas(size);
  const normal = canvas(size);
  const a = albedo.getContext('2d')!.createImageData(size, size);
  const r = rough.getContext('2d')!.createImageData(size, size);
  const n = normal.getContext('2d')!.createImageData(size, size);
  const heights = new Float32Array(size * size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const s = sample(x / size, y / size);
      const i = (y * size + x) * 4;
      a.data[i] = s.r * 255;
      a.data[i + 1] = s.g * 255;
      a.data[i + 2] = s.b * 255;
      a.data[i + 3] = 255;
      const rr = Math.max(0, Math.min(1, s.rough)) * 255;
      r.data[i] = r.data[i + 1] = r.data[i + 2] = rr;
      r.data[i + 3] = 255;
      heights[y * size + x] = s.height;
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const h = (xx: number, yy: number) => heights[((yy + size) % size) * size + ((xx + size) % size)]!;
      const dx = (h(x + 1, y) - h(x - 1, y)) * normalStrength;
      const dy = (h(x, y + 1) - h(x, y - 1)) * normalStrength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      n.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      n.data[i + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      n.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      n.data[i + 3] = 255;
    }
  }
  albedo.getContext('2d')!.putImageData(a, 0, 0);
  rough.getContext('2d')!.putImageData(r, 0, 0);
  normal.getContext('2d')!.putImageData(n, 0, 0);

  const set = { map: finish(albedo, true), roughnessMap: finish(rough, false), normalMap: finish(normal, false) };
  cache.set(key, set);
  return set;
}

/** Slightly aged, sealed industrial concrete floor. One tile ≈ 3 m. */
export function concreteFloor(): TextureSet {
  const { fbm } = makeNoise(11);
  const fine = makeNoise(12);
  return build(
    'concreteFloor',
    512,
    (u, v) => {
      const big = fbm(u, v, 4, 5);
      const stain = Math.max(0, fbm(u + 0.3, v + 0.7, 2, 4) - 0.55) * 1.6;
      const grain = fine.fbm(u, v, 64, 2);
      const speck = grain > 0.78 ? 0.06 : 0;
      const base = 0.36 + big * 0.12 - stain * 0.12 + (grain - 0.5) * 0.05 - speck;
      return {
        r: base * 1.0,
        g: base * 0.985,
        b: base * 0.96,
        // Polished where worn, dull in stains.
        rough: 0.62 + big * 0.18 + stain * 0.2 - grain * 0.08,
        height: grain * 0.6 + big * 0.4,
      };
    },
    1.5,
  );
}

/** Exposed brick with recessed mortar. One tile = 1 m × 1 m (≈ 4.4 bricks × 13 courses). */
export function brickWall(): TextureSet {
  const { fbm } = makeNoise(21);
  const fine = makeNoise(22);
  const rand = mulberry32(23);
  const courses = 13;
  const perRow = 4;
  const tones: number[] = Array.from({ length: courses * perRow * 2 }, () => rand());
  return build(
    'brickWall',
    1024,
    (u, v) => {
      const row = Math.floor(v * courses);
      const rv = v * courses - row;
      const offset = row % 2 ? 0.5 : 0;
      const bu = u * perRow + offset;
      const col = Math.floor(bu);
      const cu = bu - col;
      const mortarU = 0.045;
      const mortarV = 0.13;
      const inMortar = cu < mortarU || rv < mortarV;
      const edge = Math.min(cu - mortarU, 1 - cu, rv - mortarV, 1 - rv);
      const tone = tones[(row * perRow * 2 + ((col % (perRow * 2)) + perRow * 2)) % tones.length]!;
      const n = fbm(u, v, 16, 4);
      const g = fine.fbm(u, v, 128, 2);
      if (inMortar) {
        const m = 0.33 + n * 0.08 + g * 0.05;
        return { r: m, g: m * 0.97, b: m * 0.93, rough: 0.95, height: 0 };
      }
      // Muted, slightly sooty industrial brick.
      const dark = 0.75 + tone * 0.35 + (n - 0.5) * 0.25;
      return {
        r: 0.36 * dark,
        g: 0.2 * dark,
        b: 0.15 * dark,
        rough: 0.82 + g * 0.15,
        height: 0.7 + Math.min(edge * 6, 0.3) + g * 0.12,
      };
    },
    3,
  );
}

/** Smooth trowelled cement plaster for the side walls. One tile ≈ 2 m. */
export function cementWall(): TextureSet {
  const { fbm } = makeNoise(31);
  return build(
    'cementWall',
    512,
    (u, v) => {
      const n = fbm(u, v, 4, 5);
      const m = fbm(u + 0.5, v, 16, 3);
      const base = 0.42 + n * 0.1 + (m - 0.5) * 0.06;
      return { r: base, g: base * 0.98, b: base * 0.95, rough: 0.85 - n * 0.1, height: m };
    },
    1,
  );
}

/** Natural oak with straight grain along u. One tile ≈ 1 m of board. */
export function oakWood(): TextureSet {
  const { fbm, noise } = makeNoise(41);
  return build(
    'oakWood',
    1024,
    (u, v) => {
      const warp = fbm(u, v, 4, 4) * 0.7;
      const rings = Math.sin((v * 64 + warp * 3) * Math.PI);
      const fibre = noise(u * 320, v * 24);
      const streak = fbm(u, v, 32, 2);
      const t = 0.55 + rings * 0.12 + (fibre - 0.5) * 0.12 + (streak - 0.5) * 0.18;
      return {
        r: 0.5 * t + 0.12,
        g: 0.33 * t + 0.07,
        b: 0.19 * t + 0.03,
        rough: 0.48 + (1 - t) * 0.2,
        height: rings * 0.3 + fibre * 0.4,
      };
    },
    1.2,
  );
}

/** Perforated hardboard for the workshop pegboard. */
export function pegboard(): Texture {
  const key = 'pegboard';
  const hit = cache.get(key);
  if (hit) return hit.map;
  const c = canvas(256);
  const g = c.getContext('2d')!;
  g.fillStyle = '#6e5a43';
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#1b1510';
  for (let y = 16; y < 256; y += 32) for (let x = 16; x < 256; x += 32) g.beginPath(), g.arc(x, y, 4, 0, Math.PI * 2), g.fill();
  const t = finish(c, true);
  cache.set(key, { map: t, roughnessMap: t, normalMap: t });
  return t;
}
