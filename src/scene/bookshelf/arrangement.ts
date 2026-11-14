import { books, type BookRecord } from '@/content';
import { BOOKSHELF } from '../layout';
import { mulberry32 } from '../materials/noise';

/**
 * Deterministic shelf arrangement: a fixed seed means every visitor sees the same shelf, and
 * catalogue books sit at the fixed `place` from books.ts — the rest of the shelf flows around them.
 * Books are deliberately not grouped by colour, size or subject (spec §9).
 */

export interface PlacedBook {
  /** Real catalogue entry, or null for anonymous filler. */
  record: BookRecord | null;
  /** Centre position (world). */
  x: number;
  y: number;
  z: number;
  /** Book dimensions: depth (into shelf), height, thickness. */
  w: number;
  h: number;
  t: number;
  color: string;
  /** Rotation about the shelf's depth axis (leaning books), radians. */
  lean: number;
  /** Spine typography variant for anonymous books. */
  design: number;
}

export interface Bookend {
  x: number;
  y: number;
  z: number;
}

// Muted, real-library tones: cloth, paper and dust jackets rather than saturated blocks.
const PALETTE = [
  '#2f3b47', '#6e3430', '#c2b48f', '#232323', '#43553f', '#dcd5c4', '#7d6440', '#4a3f55',
  '#9a4b35', '#cfc6b4', '#2c4a52', '#5a4434', '#9c9b92', '#1d3149', '#666a58', '#c9ab62',
  '#2c2c30', '#843432', '#e8e2d4', '#45576a', '#a8683c', '#1e3348', '#e4dccb', '#56603b',
];

/** Number of spine typography designs per contrast family (see Bookshelf.tsx). */
export const SPINE_DESIGNS = 4;
/** Design index for books lying flat: plain spine (typography would stretch). */
export const PLAIN_SPINE = SPINE_DESIGNS * 2;

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

export function arrangeShelf(): { books: PlacedBook[]; bookends: Bookend[] } {
  const rand = mulberry32(2024);
  const out: PlacedBook[] = [];
  const ends: Bookend[] = [];
  const front = BOOKSHELF.x - BOOKSHELF.depth;
  const heights = BOOKSHELF.shelfHeights;

  const filler = (shelfTop: number, clearance: number) => {
    // Mostly ordinary paperbacks/hardbacks, a few tall art books and slim volumes.
    const r = rand();
    const h = Math.min(clearance - 0.01, r < 0.1 ? 0.29 + rand() * 0.06 : r < 0.25 ? 0.15 + rand() * 0.03 : 0.19 + rand() * 0.07);
    const t = 0.011 + Math.pow(rand(), 1.8) * 0.065;
    const w = Math.min(0.31, h * (0.62 + rand() * 0.14));
    const color = PALETTE[Math.floor(rand() * PALETTE.length)]!;
    const family = luminance(color) > 0.5 ? 1 : 0; // 0: light text on dark, 1: dark text on light
    const design = family * SPINE_DESIGNS + Math.floor(rand() * SPINE_DESIGNS);
    return { h, t, w, color, design, shelfTop };
  };

  for (let s = 0; s < heights.length; s++) {
    const shelfTop = heights[s]! + 0.03;
    const clearance = (heights[s + 1] ?? 3.55) - shelfTop - 0.02;
    for (let b = 0; b < BOOKSHELF.bays; b++) {
      const z0 = BOOKSHELF.zStart + b * BOOKSHELF.bayWidth + 0.03;
      const z1 = z0 + BOOKSHELF.bayWidth - 0.06;
      const reserved = books
        .filter((bk) => bk.place.shelf === s && bk.place.bay === b)
        .sort((a, c) => a.place.at - c.place.at)
        .map((bk) => ({ record: bk, z: z0 + bk.place.at * (z1 - z0) }));

      const fill = s === heights.length - 1 ? 0.5 + rand() * 0.2 : 0.7 + rand() * 0.25;
      const end = Math.max(z0 + (z1 - z0) * fill, (reserved.at(-1)?.z ?? 0) + 0.06);
      let z = z0 + (rand() < 0.25 ? 0.03 + rand() * 0.1 : 0);
      let lastH = 0.2;

      while (z < end) {
        const next = reserved[0];
        if (next && z >= next.z - 0.02) {
          reserved.shift();
          const r = next.record;
          const h = r.spine.heightCm / 100;
          const t = r.spine.thicknessCm / 100;
          const w = Math.min(0.3, h * 0.66);
          out.push({ record: r, x: front + 0.008 + w / 2, y: shelfTop + h / 2, z: z + t / 2, w, h, t, color: r.spine.color, lean: 0, design: 0 });
          z += t + 0.002;
          lastH = h;
          continue;
        }

        // Occasional small horizontal stack (sized before placing so it never overlaps neighbours).
        if (rand() < 0.05 && end - z > 0.32 && !next) {
          const n = 2 + Math.floor(rand() * 3);
          const depth = 0.19 + rand() * 0.05;
          const layers = Array.from({ length: n }, () => ({ f: filler(shelfTop, clearance), t: 0.02 + rand() * 0.03 }));
          const len = Math.min(0.28, Math.max(...layers.map((l) => l.f.h)));
          let y = shelfTop;
          for (const { f, t } of layers) {
            const l = Math.min(len, f.h);
            out.push({ record: null, x: front + 0.015 + depth / 2, y: y + t / 2 + 0.0005, z: z + len / 2, w: depth, h: t - 0.001, t: l, color: f.color, lean: 0, design: PLAIN_SPINE });
            y += t;
          }
          z += len + 0.012;
          continue;
        }
        if (rand() < 0.04 && !next) {
          z += 0.03 + rand() * 0.06;
          continue;
        }

        const f = filler(shelfTop, clearance);
        const recess = rand() * 0.018;
        out.push({ record: null, x: front + 0.012 + recess + f.w / 2, y: shelfTop + f.h / 2, z: z + f.t / 2, w: f.w, h: f.h, t: f.t, color: f.color, lean: 0, design: f.design });
        z += f.t + (rand() < 0.2 ? 0.003 : 0.0006);
        lastH = f.h;
      }

      const space = z1 - z;
      if (space > 0.1 && rand() < 0.55) {
        // A book leaning on the end of the row.
        const f = filler(shelfTop, clearance);
        const phi = Math.min(0.5, 0.12 + rand() * 0.25, Math.asin(Math.min(1, (space - f.t) / f.h)));
        const lean = -phi;
        const cz = z + (f.h / 2) * Math.sin(phi) + (f.t / 2) * Math.cos(phi) - Math.max(0, f.h - lastH) * Math.sin(phi) * 0.5;
        const cy = shelfTop + (f.h / 2) * Math.cos(phi) + (f.t / 2) * Math.sin(phi);
        out.push({ record: null, x: front + 0.015 + f.w / 2, y: cy, z: cz, w: f.w, h: f.h, t: f.t, color: f.color, lean, design: f.design });
      } else if (space > 0.06) {
        ends.push({ x: front + 0.1, y: shelfTop, z: z + 0.004 });
      }
    }
  }
  return { books: out, bookends: ends };
}
