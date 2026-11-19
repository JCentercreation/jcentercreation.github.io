import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDelayedMove } from './delayedMove';

describe('delayed move (Tesla door → car interior)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('runs once after the delay', () => {
    const m = createDelayedMove();
    const run = vi.fn();
    expect(m.start(run, 550)).toBe(true);
    expect(m.pending).toBe(true);
    vi.advanceTimersByTime(549);
    expect(run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(run).toHaveBeenCalledTimes(1);
    expect(m.pending).toBe(false);
  });

  it('never runs once cancelled (a newer navigation command wins)', () => {
    const m = createDelayedMove();
    const run = vi.fn();
    m.start(run, 550);
    vi.advanceTimersByTime(150);
    m.cancel();
    vi.advanceTimersByTime(2000);
    expect(run).not.toHaveBeenCalled();
    expect(m.pending).toBe(false);
  });

  it('ignores repeated starts while pending (rapid clicks schedule one move)', () => {
    const m = createDelayedMove();
    const run = vi.fn();
    expect(m.start(run, 550)).toBe(true);
    for (let i = 0; i < 4; i++) {
      vi.advanceTimersByTime(60);
      expect(m.start(run, 550)).toBe(false);
    }
    vi.advanceTimersByTime(2000);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('can be started again after it ran or was cancelled', () => {
    const m = createDelayedMove();
    const run = vi.fn();
    m.start(run, 550);
    m.cancel();
    expect(m.start(run, 550)).toBe(true);
    vi.advanceTimersByTime(550);
    expect(run).toHaveBeenCalledTimes(1);
    expect(m.start(run, 550)).toBe(true);
    vi.advanceTimersByTime(550);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('cancel with nothing pending is harmless', () => {
    const m = createDelayedMove();
    expect(() => m.cancel()).not.toThrow();
  });
});
