import { describe, expect, it } from 'vitest';
import { books } from '@/content';
import { arrangeShelf } from './bookshelf/arrangement';
import { responsiveFov } from './camera/fov';
import { BOOKSHELF, DESK, ROOM, SHOTS } from './layout';
import { bevelledBox, tiledBox } from './environment/geometry';

describe('bookshelf arrangement', () => {
  it('is deterministic, so positions are stable between visits', () => {
    expect(arrangeShelf()).toEqual(arrangeShelf());
  });

  it('places every catalogue book exactly once, on the shelf', () => {
    const placed = arrangeShelf().books.filter((b) => b.record);
    expect(placed.map((b) => b.record!.id).sort()).toEqual(books.map((b) => b.id).sort());
    const zEnd = BOOKSHELF.zStart + BOOKSHELF.bays * BOOKSHELF.bayWidth;
    for (const b of placed) {
      expect(b.z).toBeGreaterThan(BOOKSHELF.zStart);
      expect(b.z).toBeLessThan(zEnd);
    }
  });
});

describe('camera', () => {
  it('keeps the reference FOV on wide screens and widens (capped) on narrow ones', () => {
    expect(responsiveFov(50, 16 / 9)).toBe(50);
    expect(responsiveFov(50, 21 / 9)).toBe(50);
    expect(responsiveFov(50, 4 / 3)).toBeGreaterThan(50);
    expect(responsiveFov(50, 9 / 19.5)).toBeLessThanOrEqual(78);
  });

  it('every shot stays inside the room', () => {
    for (const [id, s] of Object.entries(SHOTS)) {
      expect(s.position.x, id).toBeGreaterThan(ROOM.minX);
      expect(s.position.x, id).toBeLessThan(ROOM.maxX);
      expect(s.position.z, id).toBeGreaterThan(ROOM.minZ);
      expect(s.position.z, id).toBeLessThan(ROOM.maxZ);
      expect(s.position.y, id).toBeGreaterThan(0);
      expect(s.position.y, id).toBeLessThan(ROOM.height);
    }
  });
});

describe('book take-off motion', () => {
  it('is exactly home at t = 0 and exactly the reading pose at t = 1', async () => {
    const { bookPose } = await import('./bookshelf/bookMotion');
    const { Quaternion, Vector3 } = await import('three');
    const home = new Vector3(4.6, 1.4, -1.8);
    const reading = { position: new Vector3(2.2, 1.6, -0.9), quaternion: new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 1.2) };
    const p = new Vector3();
    const q = new Quaternion();
    bookPose(0, home, 0.16, reading, p, q);
    expect(p.distanceTo(home)).toBeLessThan(1e-9);
    expect(q.angleTo(new Quaternion())).toBeLessThan(1e-9);
    bookPose(1, home, 0.16, reading, p, q);
    expect(p.distanceTo(reading.position)).toBeLessThan(1e-9);
    expect(q.angleTo(reading.quaternion)).toBeLessThan(1e-6);
  });

  it('first slides straight out towards the room (never sideways into neighbours)', async () => {
    const { bookPose } = await import('./bookshelf/bookMotion');
    const { Quaternion, Vector3 } = await import('three');
    const home = new Vector3(4.6, 1.4, -1.8);
    const reading = { position: new Vector3(2.2, 1.6, -0.9), quaternion: new Quaternion() };
    const p = new Vector3();
    const q = new Quaternion();
    for (const t of [0.05, 0.15, 0.3]) {
      bookPose(t, home, 0.16, reading, p, q);
      expect(p.z).toBeCloseTo(home.z, 9);
      expect(p.x).toBeLessThanOrEqual(home.x);
    }
  });
});

/** UV extent (max - min) per face of a 1-segment box: 6 faces × 4 vertices. */
function faceExtents(g: ReturnType<typeof tiledBox>) {
  const uv = g.attributes.uv!;
  return Array.from({ length: 6 }, (_, f) => {
    const us = [0, 1, 2, 3].map((k) => uv.getX(f * 4 + k));
    const vs = [0, 1, 2, 3].map((k) => uv.getY(f * 4 + k));
    return [Math.max(...us) - Math.min(...us), Math.max(...vs) - Math.min(...vs)] as const;
  });
}

describe('world-scale box UVs', () => {
  it('keeps the texture at its physical size along a 7.8 m beam (no stretching)', () => {
    // Beam 0.2 × 0.32 × 7.8 m, glulam tile 1 m along the grain × 0.4 m across.
    const e = faceExtents(tiledBox(0.2, 0.32, 7.8, [1, 0.4], 'z'));
    // Sides (x faces): 7.8 tiles along the grain, 0.32/0.4 across.
    expect(e[0]![0]).toBeCloseTo(7.8);
    expect(e[0]![1]).toBeCloseTo(0.8);
    // Top/bottom (y faces): grain still along the beam, 0.2/0.4 across.
    expect(e[2]![0]).toBeCloseTo(7.8);
    expect(e[2]![1]).toBeCloseTo(0.5);
    // End grain (z faces): the 0.32 m side along u.
    expect(e[4]![0]).toBeCloseTo(0.8 * 0.4);
  });

  it('maps the single-span desk top exactly once', () => {
    const g = tiledBox(DESK.width, 0.06, DESK.depth, [DESK.width, DESK.depth], 'x', false);
    const uv = g.attributes.uv!;
    const top = [8, 9, 10, 11].map((i) => [uv.getX(i), uv.getY(i)]);
    expect(Math.min(...top.map((t) => t[0]!))).toBeCloseTo(0);
    expect(Math.max(...top.map((t) => t[0]!))).toBeCloseTo(1);
    expect(Math.min(...top.map((t) => t[1]!))).toBeCloseTo(0);
    expect(Math.max(...top.map((t) => t[1]!))).toBeCloseTo(1);
  });
});

describe('bevelled boxes', () => {
  it('keep the exact outer dimensions of the box they replace (nothing moves or grows)', () => {
    for (const [w, h, d, b] of [
      [2.6, 0.06, 0.78, 0.004], // desk top
      [0.36, 0.03, 2.88, 0.002], // shelf
      [0.2, 0.32, 7.8, 0.008], // beam
    ] as const) {
      const g = bevelledBox(w, h, d, b, 1);
      const bb = g.boundingBox!;
      expect(bb.max.x - bb.min.x).toBeCloseTo(w, 5);
      expect(bb.max.y - bb.min.y).toBeCloseTo(h, 5);
      expect(bb.max.z - bb.min.z).toBeCloseTo(d, 5);
      expect(bb.min.y).toBeCloseTo(-h / 2, 5); // still centred
    }
  });

  it('maps the desk top exactly once, as before', () => {
    const g = bevelledBox(DESK.width, 0.06, DESK.depth, 0.004, [DESK.width, DESK.depth], 'x', false);
    const uv = g.attributes.uv!;
    const nrm = g.attributes.normal!;
    let minU = 9, maxU = -9, minV = 9, maxV = -9;
    for (let i = 0; i < uv.count; i++) {
      if (nrm.getY(i) < 0.99) continue; // flat top face only
      minU = Math.min(minU, uv.getX(i)); maxU = Math.max(maxU, uv.getX(i));
      minV = Math.min(minV, uv.getY(i)); maxV = Math.max(maxV, uv.getY(i));
    }
    expect(minU).toBeGreaterThanOrEqual(-1e-6);
    expect(maxU).toBeLessThanOrEqual(1 + 1e-6);
    expect(minV).toBeGreaterThanOrEqual(-1e-6);
    expect(maxV).toBeLessThanOrEqual(1 + 1e-6);
  });

  it('stays cheap (modest triangle count)', () => {
    const g = bevelledBox(2.6, 0.06, 0.78, 0.004, 1);
    expect(g.attributes.position!.count / 3).toBeLessThan(120);
  });
});
