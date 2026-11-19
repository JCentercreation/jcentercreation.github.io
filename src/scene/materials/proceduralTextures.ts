import { CanvasTexture, RepeatWrapping, SRGBColorSpace, NoColorSpace, type Texture } from 'three';
import { makeNoise, mulberry32 } from './noise';
import { budgetMaterialCanvas } from './textureBudget';

/**
 * Procedural PBR texture sets, generated once at load time (no downloads). Each set is an albedo
 * (sRGB), a roughness map and a normal map derived from a height field (both linear).
 * Final versions may become baked/compressed texture sets — the material slots stay the same.
 */

export interface TextureSet {
  map: Texture;
  roughnessMap: Texture;
  normalMap: Texture;
}

const cache = new Map<string, TextureSet>();

/** Generation time per set (ms), for performance reports (`?capture=1` exposes it). */
export const textureTimings: Record<string, number> = {};
if (new URLSearchParams(window.location.search).has('capture')) (window as unknown as { __textureTimings: typeof textureTimings }).__textureTimings = textureTimings;

function canvas(w: number, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function finish(c: HTMLCanvasElement, srgb: boolean): Texture {
  const t = new CanvasTexture(budgetMaterialCanvas(c));
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

export interface Sample {
  r: number;
  g: number;
  b: number;
  rough: number;
  height: number;
}

/** Build albedo, roughness and a normal map (from a height field) in one pass. */
export function build(key: string, size: number, sample: (u: number, v: number, x: number, y: number) => Sample, normalStrength: number, height = size): TextureSet {
  const hit = cache.get(key);
  if (hit) return hit;
  const t0 = performance.now();

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
      const s = sample(x / W, y / H, x, y);
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
    const ym = ((y - 1 + H) % H) * W;
    const yp = ((y + 1) % H) * W;
    const yc = y * W;
    for (let x = 0; x < W; x++) {
      const xm = (x - 1 + W) % W;
      const xp = (x + 1) % W;
      const dx = (heights[yc + xp]! - heights[yc + xm]!) * normalStrength;
      const dy = (heights[yp + x]! - heights[ym + x]!) * normalStrength;
      const len = Math.hypot(dx, dy, 1);
      const i = (yc + x) * 4;
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
  textureTimings[key] = Math.round(performance.now() - t0);
  return set;
}

// ------------------------------------------------------------------------------------------ helpers

/** Smooth tileable 1-D noise (cosine-interpolated control points), values ~0..1. */
function curve1D(rand: () => number, n: number, controls: number): Float32Array {
  const pts = Array.from({ length: controls }, () => rand());
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const f = (i / n) * controls;
    const k = Math.floor(f);
    const t = (1 - Math.cos((f - k) * Math.PI)) / 2;
    out[i] = pts[k % controls]! * (1 - t) + pts[(k + 1) % controls]! * t;
  }
  return out;
}

/** A tileable low-frequency field evaluated once on a coarse grid, then sampled bilinearly. */
function coarseField(n: number, fn: (u: number, v: number) => number) {
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

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// ------------------------------------------------------------------------------------------ timber

/**
 * Timber boards. Grain runs along u; boards are stacked along v. Each board is split by butt
 * joints into segments, and every segment has its own tone, warmth, roughness and grain figure —
 * so the tile reads as many individual pieces of wood and its repeat is hard to spot.
 *
 * Grain: flat-sawn latewood bands across the board (`rings`), bent along the board by a smooth
 * 1-D figure curve, plus fine fibre streaks. Contrast is deliberately low (contemporary, planed
 * and oiled timber, not rustic). Board edges are eased into a shallow V-groove in the height
 * field (normal map) with a little groove darkening, instead of a painted line.
 */
interface TimberStyle {
  seed: number;
  boards: number;
  base: [number, number, number];
  /** ± per-segment brightness, ± warm/cool shift. */
  toneVar: number;
  warmVar: number;
  /** Fraction of a board width: open gap (0 = tight joint) and eased edge. */
  gap: number;
  chamfer: number;
  /** Latewood bands across one board width (min, max). */
  rings: [number, number];
  /** Figure amplitude (in bands) and its smoothness (control points along the tile). */
  figure: number;
  figureControls: number;
  lineContrast: number;
  fibre: number;
  rough: number;
  roughVar: number;
  /** Butt joints per board per tile (0 = continuous boards). */
  joints: number;
  /** Probability of a small sound knot per segment. */
  knots: number;
  /** Texture size in px (u × v). */
  size: [number, number];
}

function timber(key: string, s: TimberStyle, normalStrength: number): TextureSet {
  const [W, H] = s.size;
  const rand = mulberry32(s.seed);
  const { noise } = makeNoise(s.seed + 7);
  interface Segment {
    from: number;
    tone: number;
    warm: number;
    rough: number;
    phase: number;
    freq: number;
    figure: Float32Array;
    knot: [number, number] | null;
  }
  const boards: Segment[][] = [];
  for (let b = 0; b < s.boards; b++) {
    const cuts = Array.from({ length: s.joints }, () => rand()).sort((a, c) => a - c);
    const starts = s.joints ? [0, ...cuts] : [0];
    boards.push(
      starts.map((from) => ({
        from,
        tone: 1 + (rand() - 0.5) * 2 * s.toneVar,
        warm: (rand() - 0.5) * 2 * s.warmVar,
        rough: (rand() - 0.5) * 2 * s.roughVar,
        phase: rand() * 10,
        freq: s.rings[0] + rand() * (s.rings[1] - s.rings[0]),
        figure: curve1D(rand, W, s.figureControls),
        knot: rand() < s.knots ? [rand(), 0.25 + rand() * 0.5] : null,
      })),
    );
  }
  const jointHalf = 1.2 / W; // butt-joint line half-width (u)
  return build(
    key,
    W,
    (u, v, x) => {
      const bi = Math.min(s.boards - 1, Math.floor(v * s.boards));
      const bv = v * s.boards - bi;
      const segs = boards[bi]!;
      let si = 0;
      for (let k = segs.length - 1; k > 0; k--)
        if (u >= segs[k]!.from) {
          si = k;
          break;
        }
      const seg = segs[si]!;
      if (bv < s.gap) return { r: 0.07, g: 0.055, b: 0.045, rough: 1, height: 0 };
      // Distance to the board's long edges (board-width units) → eased groove.
      const d = Math.min(bv - s.gap, 1 - bv);
      const edge = smooth(0, s.chamfer, d);
      // Butt joint: a tight seam across the board.
      let dj = 1;
      for (let k = 1; k < segs.length; k++) dj = Math.min(dj, Math.abs(u - segs[k]!.from));
      const joint = dj < jointHalf ? 1 : 0;
      const jointEase = s.joints ? smooth(0, 4 / W, dj) : 1;
      // Grain.
      const g = bv * seg.freq + seg.figure[x]! * s.figure + seg.phase;
      const band = Math.pow(0.5 + 0.5 * Math.cos(g * Math.PI * 2), 4);
      const fibre = noise(u * W * 0.18 + seg.phase * 40, bv * 26 + seg.phase);
      let k = seg.tone * (1 - s.lineContrast * band) * (1 + (fibre - 0.5) * s.fibre);
      let knotH = 0;
      if (seg.knot) {
        const kd = Math.hypot((u - seg.knot[0]) * W * 0.02, (bv - seg.knot[1]) * 2.2);
        const kn = Math.max(0, 1 - kd);
        k *= 1 - kn * 0.35;
        knotH = kn * 0.2;
      }
      const shade = (0.82 + 0.18 * edge) * (0.9 + 0.1 * jointEase) * (joint ? 0.75 : 1);
      return {
        r: s.base[0] * k * shade * (1 + seg.warm),
        g: s.base[1] * k * shade,
        b: s.base[2] * k * shade * (1 - seg.warm),
        rough: s.rough + seg.rough + band * 0.05 + (1 - edge) * 0.08 + (fibre - 0.5) * 0.04,
        height: 0.25 + 0.75 * edge * (0.6 + 0.4 * jointEase) + band * 0.05 + fibre * 0.03 - knotH,
      };
    },
    normalStrength,
    H,
  );
}

/** Horizontal white-oak cladding: 16 boards of 15 cm per 2.4 m tile, butt-jointed, matte oiled. */
export function woodCladding(): TextureSet {
  return timber(
    'woodCladding',
    {
      seed: 81,
      boards: 16,
      base: [0.64, 0.54, 0.42],
      toneVar: 0.06,
      warmVar: 0.03,
      gap: 0.012,
      chamfer: 0.06,
      rings: [3, 6],
      figure: 1.6,
      figureControls: 7,
      lineContrast: 0.1,
      fibre: 0.1,
      rough: 0.7,
      roughVar: 0.05,
      joints: 1,
      knots: 0.12,
      size: [1024, 1024],
    },
    2.4,
  );
}

/** Tongue-and-groove ceiling planks: narrower, paler, a finer grain than the walls. */
export function ceilingPlanks(): TextureSet {
  return timber(
    'ceilingPlanks',
    {
      seed: 91,
      boards: 24,
      base: [0.67, 0.57, 0.45],
      toneVar: 0.045,
      warmVar: 0.025,
      gap: 0.02,
      chamfer: 0.08,
      rings: [2, 4],
      figure: 1.2,
      figureControls: 6,
      lineContrast: 0.08,
      fibre: 0.08,
      rough: 0.74,
      roughVar: 0.04,
      joints: 1,
      knots: 0.06,
      size: [1024, 1024],
    },
    2,
  );
}

/** Boards for the carriage doors (same oak family, darker, exterior-oiled). */
export function doorBoards(): TextureSet {
  return timber(
    'doorBoards',
    {
      seed: 101,
      boards: 8,
      base: [0.5, 0.36, 0.24],
      toneVar: 0.05,
      warmVar: 0.03,
      gap: 0.03,
      chamfer: 0.07,
      rings: [4, 7],
      figure: 1.8,
      figureControls: 5,
      lineContrast: 0.12,
      fibre: 0.12,
      rough: 0.62,
      roughVar: 0.05,
      joints: 0,
      knots: 0.1,
      size: [512, 512],
    },
    2,
  );
}

/**
 * Glulam (beams, posts, window casing): 10 laminations per 0.4 m, tight glue lines, slightly
 * sealed (a little less rough than the cladding). One tile = 1 m × 0.4 m.
 */
export function glulam(): TextureSet {
  return timber(
    'glulam',
    {
      seed: 111,
      boards: 10,
      base: [0.54, 0.4, 0.27],
      toneVar: 0.05,
      warmVar: 0.03,
      gap: 0.004,
      chamfer: 0.015,
      rings: [1.5, 3],
      figure: 1.4,
      figureControls: 4,
      lineContrast: 0.12,
      fibre: 0.1,
      rough: 0.64,
      roughVar: 0.05,
      joints: 1,
      knots: 0.05,
      size: [1024, 512],
    },
    1.2,
  );
}

/** Furniture oak: tight-jointed boards, cathedral figure, fine pores, oiled-satin roughness. */
function furnitureOak(key: string, seed: number, boards: number, size: [number, number], joints: number): TextureSet {
  return timber(
    key,
    {
      seed,
      boards,
      base: [0.62, 0.45, 0.28],
      toneVar: 0.035,
      warmVar: 0.02,
      gap: 0,
      chamfer: 0.004,
      rings: [3, 5],
      figure: 2.4,
      figureControls: 5,
      lineContrast: 0.14,
      fibre: 0.09,
      rough: 0.5,
      roughVar: 0.04,
      joints,
      knots: 0,
      size,
    },
    0.8,
  );
}

/** Desk top: one texture spanning the whole 2.6 × 0.78 m top (three glued boards) — no repetition. */
export function oakDesk(): TextureSet {
  return furnitureOak('oakDesk', 41, 3, [2048, 1024], 0);
}

/** Oak boards for shelves and the sill. One tile = 1 m × 0.5 m (four boards). */
export function oakWood(): TextureSet {
  return furnitureOak('oakWood', 43, 4, [1024, 512], 0);
}

// ------------------------------------------------------------------------------------------ concrete

/**
 * Polished concrete floor, one 3 m tile with saw-cut joints every 1.5 m. Low-frequency cloud and
 * polish variation (coarse grid, cheap), sparse fine aggregate, a faint trowel sheen, and joints with
 * a chamfered edge in the height field. A world-space detail layer (library.ts) breaks the repeat.
 */
export function concreteFloor(): TextureSet {
  const { noise } = makeNoise(12);
  const big = makeNoise(11);
  const cloud = coarseField(128, (u, v) => big.fbm(u, v, 4, 5));
  const stain = coarseField(64, (u, v) => big.fbm(u + 0.3, v + 0.7, 2, 4));
  const polish = coarseField(64, (u, v) => big.fbm(u + 0.6, v + 0.1, 3, 3));
  return build(
    'concreteFloor',
    1024,
    (u, v, x, y) => {
      const c = cloud(u, v);
      const st = Math.max(0, stain(u, v) - 0.56) * 1.3;
      const pol = polish(u, v);
      const grain = noise(x * 0.35, y * 0.35);
      const aggregate = noise(x * 1.7, y * 1.7) > 0.86 ? 0.03 : 0;
      // Saw-cut joints at u, v = 0 and 0.5 (every 1.5 m): 5 mm cut with eased edges.
      const ju = Math.min(Math.abs(((u * 2) % 1) - 0), Math.abs(((u * 2) % 1) - 1));
      const jv = Math.min(Math.abs(((v * 2) % 1) - 0), Math.abs(((v * 2) % 1) - 1));
      const jd = Math.min(ju, jv);
      const cut = jd < 0.0016 ? 1 : 0;
      const lip = 1 - smooth(0.0016, 0.004, jd);
      const base = 0.47 + c * 0.1 - st * 0.08 + (grain - 0.5) * 0.025 + aggregate - cut * 0.2 - lip * 0.03;
      return {
        r: base,
        g: base * 0.99,
        b: base * 0.965,
        rough: 0.4 + c * 0.12 + st * 0.15 + (1 - pol) * 0.12 + cut * 0.45 + lip * 0.1,
        height: grain * 0.25 + c * 0.2 - cut * 2 - lip * 0.6,
      };
    },
    1.6,
  );
}

/** Board-formed architectural concrete: 1.2 × 0.6 m panels, tie holes, soft timber imprint. One tile = 2.4 m. */
export function concretePanels(): TextureSet {
  const n = makeNoise(51);
  const noise = n.noise;
  const cloudField = coarseField(64, (u, v) => n.fbm(u, v, 4, 3));
  return build(
    'concretePanels',
    1024,
    (u, v) => {
      const pu = (u * 2) % 1;
      const pv = (v * 4) % 1;
      const panel = Math.floor(u * 2) * 7 + Math.floor(v * 4) * 3;
      const seam = Math.min(pu, 1 - pu) < 0.003 || Math.min(pv, 1 - pv) < 0.006 ? 1 : 0;
      const holeD = Math.min(Math.hypot(pu - 0.2, (pv - 0.25) / 2), Math.hypot(pu - 0.8, (pv - 0.25) / 2), Math.hypot(pu - 0.2, (pv - 0.75) / 2), Math.hypot(pu - 0.8, (pv - 0.75) / 2));
      const hole = holeD < 0.011 ? 1 : 0;
      const imprint = noise(u * 6, v * 220) * 0.5 + noise(u * 3, v * 90) * 0.5;
      const cl = cloudField(u, v);
      const tone = 0.5 + ((panel * 0.137) % 1) * 0.05 + (cl - 0.5) * 0.12 + (imprint - 0.5) * 0.04 - seam * 0.16 - hole * 0.25;
      return {
        r: tone * 0.98,
        g: tone * 0.975,
        b: tone * 0.96,
        rough: 0.82 + cl * 0.1,
        height: imprint * 0.35 + cl * 0.2 - seam * 1.2 - hole * 1.5,
      };
    },
    1.4,
  );
}

/** Perforated black steel tool wall for the workshop. */
export function pegboard(): Texture {
  const key = 'pegboard';
  const hit = cache.get(key);
  if (hit) return hit.map;
  const c = canvas(256);
  const g = c.getContext('2d')!;
  g.fillStyle = '#26272a';
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#0b0b0c';
  for (let y = 16; y < 256; y += 32) for (let x = 16; x < 256; x += 32) g.beginPath(), g.arc(x, y, 4, 0, Math.PI * 2), g.fill();
  const t = finish(c, true);
  cache.set(key, { map: t, roughnessMap: t, normalMap: t });
  return t;
}
