import { useFrame } from '@react-three/fiber';
import { useExperience } from '@/app/store';

/**
 * Shared storm state, read every frame by lights and shaders (no React re-renders).
 * `flash` is 0..1. `boltX` is where the current strike sits on the horizon.
 */
export const storm = {
  flash: 0,
  boltX: 0,
  /** Increments on every new strike so the bolt mesh can regenerate. */
  strike: 0,
  time: 0,
};

// Review tooling only: `?calm=1` suppresses lightning so before/after captures are comparable.
const calm = new URLSearchParams(window.location.search).has('calm');
let nextStrike = calm ? Infinity : 4;
let pulses: { at: number; strength: number }[] = [];

/**
 * Drives lightning: a strike every ~7–16 s, made of 2–3 quick pulses.
 * With prefers-reduced-motion the flashes are single, dim and slow (photosensitivity).
 */
export function StormController() {
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    storm.time += dt;
    const t = storm.time;
    const gentle = useExperience.getState().reducedMotion;

    if (t >= nextStrike) {
      storm.strike++;
      storm.boltX = (Math.random() - 0.5) * 120;
      pulses = gentle
        ? [{ at: t, strength: 0.35 }]
        : [
            { at: t, strength: 0.7 + Math.random() * 0.3 },
            { at: t + 0.09 + Math.random() * 0.05, strength: 0.4 },
            ...(Math.random() > 0.4 ? [{ at: t + 0.24 + Math.random() * 0.1, strength: 0.85 }] : []),
          ];
      nextStrike = t + 7 + Math.random() * 9;
    }

    let f = 0;
    for (const p of pulses) {
      const age = t - p.at;
      if (age < 0) continue;
      const decay = gentle ? 1.2 : 0.16;
      f = Math.max(f, p.strength * Math.exp(-age / decay) * (age < 0.02 ? age / 0.02 : 1));
    }
    storm.flash = f;
  });
  return null;
}
