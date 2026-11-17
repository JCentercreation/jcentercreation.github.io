/**
 * One pending, cancellable delayed action (e.g. the camera move that follows the Tesla door opening).
 * Only one can be pending at a time: starting again while one is pending is ignored, so repeated clicks
 * schedule a single move; cancel() drops it, so a newer navigation command always wins.
 */
export function createDelayedMove(schedule: typeof setTimeout = setTimeout, unschedule: typeof clearTimeout = clearTimeout) {
  let id: ReturnType<typeof setTimeout> | null = null;
  return {
    /** Schedules `run` after `ms`. Returns false (and does nothing) if a move is already pending. */
    start(run: () => void, ms: number): boolean {
      if (id !== null) return false;
      id = schedule(() => {
        id = null;
        run();
      }, ms);
      return true;
    },
    cancel() {
      if (id === null) return;
      unschedule(id);
      id = null;
    },
    get pending() {
      return id !== null;
    },
  };
}
