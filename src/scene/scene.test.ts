import { describe, expect, it } from 'vitest';
import { books } from '@/content';
import { arrangeShelf } from './bookshelf/arrangement';
import { responsiveFov } from './camera/fov';
import { BOOKSHELF, ROOM, SHOTS } from './layout';

describe('bookshelf arrangement', () => {
  it('is deterministic, so positions are stable between visits', () => {
    expect(arrangeShelf()).toEqual(arrangeShelf());
  });

  it('places every catalogue book exactly once, on the shelf', () => {
    const placed = arrangeShelf().filter((b) => b.record);
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
