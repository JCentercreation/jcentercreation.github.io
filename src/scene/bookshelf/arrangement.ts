import { books, type BookRecord } from '@/content';
import { BOOKSHELF } from '../layout';
import { mulberry32 } from '../materials/noise';

/**
 * Deterministic shelf arrangement. A fixed seed means every visitor sees the same shelf,
 * and adding a book to `books.ts` only fills its `slot` — the rest of the shelf is unchanged.
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
  /** Lying flat in a small stack. */
  flat: boolean;
  tilt: number;
}

const PALETTE = [
  '#2b3a4a', '#7a2e2a', '#c9b98f', '#1f1f1f', '#3d5a40', '#e6dfcf', '#8a6d3b', '#4b3b5c',
  '#b04a2f', '#d8cfbf', '#264653', '#5c4033', '#a3a39a', '#0f3057', '#6b705c', '#e9c46a',
  '#2a2a2e', '#9c2f2f', '#f1ece2', '#40556b',
];

export function arrangeShelf(): PlacedBook[] {
  const rand = mulberry32(2024);
  const bySlot = new Map(books.map((b) => [b.slot, b]));
  const out: PlacedBook[] = [];
  const front = BOOKSHELF.x - BOOKSHELF.depth;
  let slot = 0;

  const heights = BOOKSHELF.shelfHeights;
  for (let s = 0; s < heights.length; s++) {
    const shelfTop = heights[s]! + 0.03;
    const clearance = (heights[s + 1] ?? 3.55) - shelfTop - 0.02;
    for (let b = 0; b < BOOKSHELF.bays; b++) {
      const z0 = BOOKSHELF.zStart + b * BOOKSHELF.bayWidth + 0.03;
      const z1 = z0 + BOOKSHELF.bayWidth - 0.06;
      // Some shelves are only partly filled; a lived-in library is never perfectly packed.
      const fill = s === heights.length - 1 ? 0.55 : 0.78 + rand() * 0.2;
      const end = z0 + (z1 - z0) * fill;
      let z = z0 + (rand() < 0.3 ? rand() * 0.12 : 0);

      while (z < end) {
        const record = bySlot.get(slot) ?? null;
        slot++;
        // Occasional small horizontal stack (never for catalogue books, which must be pullable).
        if (!record && rand() < 0.06 && end - z > 0.3) {
          const n = 2 + Math.floor(rand() * 3);
          let y = shelfTop;
          const w = 0.2 + rand() * 0.06;
          for (let i = 0; i < n; i++) {
            const t = 0.02 + rand() * 0.03;
            const h = 0.15 + rand() * 0.05;
            out.push({ record: null, x: front + 0.02 + h / 2, y: y + t / 2, z: z + w / 2, w: h, h: t, t: w, color: PALETTE[Math.floor(rand() * PALETTE.length)]!, flat: true, tilt: (rand() - 0.5) * 0.2 });
            y += t;
          }
          z += w + 0.02;
          continue;
        }
        if (!record && rand() < 0.07) {
          z += 0.04 + rand() * 0.12; // a gap
          continue;
        }
        const h = record ? record.spine.heightCm / 100 : Math.min(clearance, 0.17 + rand() * 0.13);
        const t = record ? record.spine.thicknessCm / 100 : 0.016 + rand() * 0.04;
        const w = Math.min(0.3, h * (0.62 + rand() * 0.1));
        const recess = record ? 0.006 : rand() * 0.02;
        out.push({
          record,
          x: front + 0.012 + recess + w / 2,
          y: shelfTop + h / 2,
          z: z + t / 2,
          w,
          h,
          t,
          color: record ? record.spine.color : PALETTE[Math.floor(rand() * PALETTE.length)]!,
          flat: false,
          tilt: 0,
        });
        z += t + (rand() < 0.15 ? 0.004 : 0.0008);
      }
    }
  }
  return out;
}
