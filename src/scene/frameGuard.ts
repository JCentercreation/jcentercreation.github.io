/**
 * Keeps animations (camera moves, doors, books) finishing on time when rendering collapses.
 *
 * GSAP's lag smoothing (500 ms, 33 ms) treats any frame longer than 500 ms as a stall and advances
 * animations by only 33 ms, which is right for an occasional hiccup (a shader compile) but makes every
 * transition effectively endless when *every* frame is that slow. The guard watches a rolling window of
 * frame times: if the median exceeds 250 ms (under 4 fps), animations switch to real time (no smoothing),
 * so a 2 s camera move ends after about 2 s whatever the frame rate; once the median is back under 100 ms
 * the normal smoothing returns. A single long frame never trips it.
 */
export const GUARD = { window: 8, collapseMs: 250, recoverMs: 100 } as const;

export function createFrameGuard(apply: (degraded: boolean) => void) {
  const samples: number[] = [];
  let degraded = false;
  return {
    /** Feed one frame interval (ms). */
    sample(dt: number) {
      samples.push(dt);
      if (samples.length > GUARD.window) samples.shift();
      if (samples.length < GUARD.window) return;
      const median = [...samples].sort((a, b) => a - b)[GUARD.window >> 1]!;
      if (!degraded && median > GUARD.collapseMs) {
        degraded = true;
        apply(true);
      } else if (degraded && median < GUARD.recoverMs) {
        degraded = false;
        apply(false);
      }
    },
    get degraded() {
      return degraded;
    },
  };
}
