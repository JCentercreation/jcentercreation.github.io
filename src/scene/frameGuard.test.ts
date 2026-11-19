import { describe, expect, it, vi } from 'vitest';
import { createFrameGuard } from './frameGuard';

describe('frame guard (animations under collapsing frame rates)', () => {
  it('stays normal at ordinary frame rates', () => {
    const apply = vi.fn();
    const g = createFrameGuard(apply);
    for (let i = 0; i < 100; i++) g.sample(16.7);
    expect(apply).not.toHaveBeenCalled();
    expect(g.degraded).toBe(false);
  });

  it('ignores a single long frame (shader compile, tab switch)', () => {
    const apply = vi.fn();
    const g = createFrameGuard(apply);
    for (let i = 0; i < 20; i++) g.sample(16.7);
    g.sample(1800);
    for (let i = 0; i < 20; i++) g.sample(16.7);
    expect(apply).not.toHaveBeenCalled();
  });

  it('switches animations to real time when most frames are very slow', () => {
    const apply = vi.fn();
    const g = createFrameGuard(apply);
    for (let i = 0; i < 8; i++) g.sample(2000);
    expect(apply).toHaveBeenCalledWith(true);
    expect(g.degraded).toBe(true);
  });

  it('restores normal smoothing once the frame rate recovers', () => {
    const apply = vi.fn();
    const g = createFrameGuard(apply);
    for (let i = 0; i < 8; i++) g.sample(2000);
    for (let i = 0; i < 8; i++) g.sample(20);
    expect(apply).toHaveBeenLastCalledWith(false);
    expect(apply).toHaveBeenCalledTimes(2);
    expect(g.degraded).toBe(false);
  });

  it('does not flap between the thresholds', () => {
    const apply = vi.fn();
    const g = createFrameGuard(apply);
    for (let i = 0; i < 8; i++) g.sample(2000);
    for (let i = 0; i < 40; i++) g.sample(180); // between 100 and 250 ms: stays degraded
    expect(apply).toHaveBeenCalledTimes(1);
  });
});
