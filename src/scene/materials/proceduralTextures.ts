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

function canvas(w: number, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
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
  height = size,
): TextureSet {
  const hit = cache.get(key);
  if (hit) return hit;

  const W = size;
  const H = height;
  const albedo = canvas(W, H);
  const rough = canvas(W, H);
  const normal = canvas(W, H);
  const a = albedo.getContext('2d')!.createImageData(W, H);
  const r = rough.getContext('2d')!.createImageData(W, H);
  const n = normal.getContext('2d')!.createImageData(W, H);
  const heights = new Float32Array(W * H);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const s = sample(x / W, y / H);
      const i = (y * W + x) * 4;
      a.data[i] = s.r * 255;
      a.data[i + 1] = s.g * 255;
      a.data[i + 2] = s.b * 255;
      a.data[i + 3] = 255;
      const rr = Math.max(0, Math.min(1, s.rough)) * 255;
      r.data[i] = r.data[i + 1] = r.data[i + 2] = rr;
      r.data[i + 3] = 255;
      heights[y * W + x] = s.height;
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const h = (xx: number, yy: number) => heights[((yy + H) % H) * W + ((xx + W) % W)]!;
      const dx = (h(x + 1, y) - h(x - 1, y)) * normalStrength;
      const dy = (h(x, y + 1) - h(x, y - 1)) * normalStrength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * W + x) * 4;
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

/** Polished, slightly aged concrete floor with saw-cut joints every 1.5 m. One tile = 3 m. */
export function concreteFloor(): TextureSet {
  const { fbm } = makeNoise(11);
  const fine = makeNoise(12);
  return build(
    'concreteFloor',
    1024,
    (u, v) => {
      const big = fbm(u, v, 4, 5);
      const stain = Math.max(0, fbm(u + 0.3, v + 0.7, 2, 4) - 0.56) * 1.4;
      const grain = fine.fbm(u, v, 64, 2);
      const aggregate = fine.noise(u * 380, v * 380) > 0.82 ? 0.035 : 0;
      // Joints at u,v = 0 and 0.5 of the tile.
      const ju = Math.min(Math.abs(((u * 2) % 1) - 0), Math.abs(((u * 2) % 1) - 1));
      const jv = Math.min(Math.abs(((v * 2) % 1) - 0), Math.abs(((v * 2) % 1) - 1));
      const joint = Math.min(ju, jv) < 0.0018 ? 1 : 0;
      const base = 0.47 + big * 0.1 - stain * 0.09 + (grain - 0.5) * 0.04 + aggregate - joint * 0.22;
      return {
        r: base * 1.0,
        g: base * 0.99,
        b: base * 0.965,
        rough: 0.42 + big * 0.2 + stain * 0.18 - grain * 0.06 + joint * 0.4,
        height: grain * 0.5 + big * 0.3 - joint * 2,
      };
    },
    1.6,
  );
}

/** Board-formed architectural concrete: 1.2 × 0.6 m panels, tie holes, soft timber imprint. One tile = 2.4 m. */
export function concretePanels(): TextureSet {
  const { fbm, noise } = makeNoise(51);
  return build(
    'concretePanels',
    1024,
    (u, v) => {
      const pu = (u * 2) % 1; // 2 panels across (1.2 m each)
      const pv = (v * 4) % 1; // 4 panels down (0.6 m each)
      const panel = Math.floor(u * 2) * 7 + Math.floor(v * 4) * 3;
      const seam = Math.min(pu, 1 - pu) < 0.003 || Math.min(pv, 1 - pv) < 0.006 ? 1 : 0;
      // Formwork tie holes.
      const holeD = Math.min(Math.hypot(pu - 0.2, (pv - 0.25) / 2), Math.hypot(pu - 0.8, (pv - 0.25) / 2), Math.hypot(pu - 0.2, (pv - 0.75) / 2), Math.hypot(pu - 0.8, (pv - 0.75) / 2));
      const hole = holeD < 0.011 ? 1 : 0;
      const imprint = noise(u * 6, v * 220) * 0.5 + noise(u * 3, v * 90) * 0.5;
      const cloud = fbm(u, v, 4, 5);
      const tone = 0.5 + ((panel * 0.137) % 1) * 0.05 + (cloud - 0.5) * 0.12 + (imprint - 0.5) * 0.04 - seam * 0.16 - hole * 0.25;
      return {
        r: tone * 0.98,
        g: tone * 0.975,
        b: tone * 0.96,
        rough: 0.82 + cloud * 0.1,
        height: imprint * 0.35 + cloud * 0.2 - seam * 1.2 - hole * 1.5,
      };
    },
    1.4,
  );
}

/** Oak slat acoustic panel: vertical slats with dark felt gaps. One tile = 0.6 m wide. */
export function oakSlats(): TextureSet {
  const { fbm, noise } = makeNoise(61);
  return build(
    'oakSlats',
    512,
    (u, v) => {
      const slats = 12; // 5 cm pitch
      const su = (u * slats) % 1;
      const idx = Math.floor(u * slats);
      const gap = su > 0.62;
      if (gap) return { r: 0.05, g: 0.05, b: 0.05, rough: 1, height: 0 };
      const grain = noise(u * 40 + idx * 3.1, v * 6) * 0.5 + fbm(u, v, 8, 3) * 0.5;
      const t = 0.62 + (grain - 0.5) * 0.25 + ((idx * 0.37) % 1) * 0.08;
      return { r: 0.55 * t + 0.14, g: 0.38 * t + 0.08, b: 0.22 * t + 0.04, rough: 0.6, height: 1 - Math.abs(su - 0.31) };
    },
    2,
  );
}

/** Warm limewash plaster (behind the bookshelf). One tile = 2 m. */
export function limewash(): TextureSet {
  const { fbm } = makeNoise(71);
  return build(
    'limewash',
    512,
    (u, v) => {
      const n = fbm(u, v, 3, 5);
      const m = fbm(u + 0.4, v, 12, 3);
      const base = 0.58 + n * 0.1 + (m - 0.5) * 0.05;
      return { r: base * 1.0, g: base * 0.95, b: base * 0.87, rough: 0.92, height: m };
    },
    0.6,
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
        const m = 0.42 + n * 0.06 + g * 0.04;
        return { r: m, g: m * 0.98, b: m * 0.95, rough: 0.95, height: 0 };
      }
      // Muted reclaimed brick: greyed terracotta with some darker headers.
      const dark = 0.8 + tone * 0.32 + (n - 0.5) * 0.22;
      return {
        r: 0.4 * dark,
        g: 0.27 * dark,
        b: 0.22 * dark,
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

function oakSample(seed: number, boards: number) {
  const { fbm, noise } = makeNoise(seed);
  return (u: number, v: number) => {
    const board = Math.min(boards - 1, Math.floor(v * boards));
    const bv = v * boards - board;
    const offset = board * 0.37;
    // Cathedral figure: arches whose apex wanders along the board.
    const apex = 0.3 + 0.4 * fbm(offset, 0.1, 2, 2);
    const arch = Math.pow(Math.abs(u - apex) * 1.6, 2) * 0.35;
    const warp = fbm(u * 0.6 + offset, bv, 3, 4) * 0.35;
    const t = (bv + arch + warp) * 18;
    const ring = Math.pow(Math.abs(Math.sin(t * Math.PI)), 0.6);
    const pores = noise(u * 700 + offset * 50, bv * 30);
    const streak = fbm(u * 2 + offset, bv * 8, 4, 3);
    const boardTone = [0.0, 0.05, -0.04, 0.03][board % 4]!;
    const k = 0.62 + boardTone - ring * 0.1 + (pores - 0.5) * 0.07 + (streak - 0.5) * 0.12;
    const glue = Math.min(bv, 1 - bv) < 0.002 ? 0.08 : 0;
    return {
      r: 0.66 * k + 0.2 - glue,
      g: 0.5 * k + 0.13 - glue,
      b: 0.34 * k + 0.06 - glue,
      rough: 0.5 + ring * 0.08 + (1 - k) * 0.15,
      height: ring * 0.4 + pores * 0.25,
    };
  };
}

/** Desk top: one texture spanning the whole 1.9 × 0.82 m top — no visible repetition. */
export function oakDesk(): TextureSet {
  return build('oakDesk', 2048, oakSample(41, 3), 0.8, 1024);
}

/** Tiling oak boards for shelves. One tile ≈ 1 m. */
export function oakWood(): TextureSet {
  return build('oakWood', 1024, oakSample(43, 4), 0.8, 512);
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

/**
 * Timber boards for the American-garage architecture (provisional, generated).
 * `boards` boards per tile along v; grain runs along u. Each board gets its own tone so the
 * cladding has the subtle variation of real timber, with a narrow shadow gap between boards.
 */
function boardsSample(seed: number, boards: number, base: [number, number, number], variation: number, gap: number) {
  const { fbm, noise } = makeNoise(seed);
  const rand = mulberry32(seed + 1);
  const tones = Array.from({ length: boards }, () => (rand() - 0.5) * variation);
  const offsets = Array.from({ length: boards }, () => rand() * 10);
  return (u: number, v: number) => {
    const b = Math.min(boards - 1, Math.floor(v * boards));
    const bv = v * boards - b;
    if (bv < gap) return { r: 0.08, g: 0.065, b: 0.05, rough: 1, height: 0 };
    const o = offsets[b]!;
    const warp = fbm(u * 0.8 + o, bv * 0.5, 3, 4) * 0.5;
    const ring = Math.pow(Math.abs(Math.sin((bv * 3 + warp + o) * Math.PI * 4)), 0.7);
    const pores = noise(u * 600 + o * 40, bv * 22);
    const streak = fbm(u * 3 + o, bv * 2, 6, 3);
    // Occasional small knot.
    const kx = (o * 0.137) % 1;
    const knot = Math.max(0, 1 - Math.hypot((u - kx) * 18, (bv - 0.5) * 3)) * (o > 6 ? 1 : 0);
    const k = 1 + tones[b]! - ring * 0.06 + (pores - 0.5) * 0.06 + (streak - 0.5) * 0.1 - knot * 0.35;
    const edge = Math.min(bv - gap, 1 - bv) < 0.02 ? 0.88 : 1;
    return {
      r: base[0] * k * edge,
      g: base[1] * k * edge,
      b: base[2] * k * edge,
      rough: 0.62 + ring * 0.06 + knot * 0.1,
      height: 0.6 + ring * 0.15 + pores * 0.1 - (edge < 1 ? 0.3 : 0),
    };
  };
}

/** Horizontal white-oak cladding: 16 boards of 15 cm per 2.4 m tile. */
export function woodCladding(): TextureSet {
  return build('woodCladding', 1024, boardsSample(81, 16, [0.63, 0.53, 0.41], 0.14, 0.022), 2.2);
}

/** Tongue-and-groove ceiling planks, slightly paler and narrower (24 per 2.4 m). */
export function ceilingPlanks(): TextureSet {
  return build('ceilingPlanks', 1024, boardsSample(91, 24, [0.66, 0.56, 0.44], 0.1, 0.03), 1.8);
}

/** Vertical boards for the carriage doors (same oak family, a little darker). */
export function doorBoards(): TextureSet {
  return build('doorBoards', 512, boardsSample(101, 8, [0.5, 0.36, 0.24], 0.12, 0.035), 2);
}

/** Glued-laminated timber (glulam) beam faces: visible lamination lines. One tile = 1 m × 0.4 m. */
export function glulam(): TextureSet {
  return build('glulam', 1024, boardsSample(111, 10, [0.52, 0.38, 0.25], 0.07, 0.008), 1.2, 512);
}
