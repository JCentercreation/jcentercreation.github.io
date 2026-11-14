import { create } from 'zustand';
import { LOCALES, type Locale, type ShotId } from '@/content';
import { safeStorage } from '@/lib/storage';
import { detectCapabilities, type Capabilities } from '@/lib/capabilities';

const LANG_KEY = 'garage.lang';
const VISITED_KEY = 'garage.visited';

function initialLocale(): Locale {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (LOCALES.includes(fromUrl as Locale)) return fromUrl as Locale;
  const stored = safeStorage.get(LANG_KEY);
  if (LOCALES.includes(stored as Locale)) return stored as Locale;
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export type Phase = 'loading' | 'intro' | 'exploring';

interface ExperienceState {
  locale: Locale;
  setLocale: (locale: Locale) => void;

  capabilities: Capabilities;
  /** User chose to try 3D despite the fallback recommendation. */
  forceScene: boolean;
  setForceScene: (v: boolean) => void;

  reducedMotion: boolean;

  phase: Phase;
  setPhase: (phase: Phase) => void;

  /** Current cinematic shot. Changing locale never touches this. */
  shot: ShotId;
  goTo: (shot: ShotId) => void;
  backToOverview: () => void;

  /** Returning visitors may skip the welcome sequence (spec §4). */
  hasVisited: boolean;
  markVisited: () => void;
}

export const useExperience = create<ExperienceState>((set) => ({
  locale: initialLocale(),
  setLocale: (locale) => {
    safeStorage.set(LANG_KEY, locale);
    set({ locale });
  },

  capabilities: detectCapabilities(),
  forceScene: false,
  setForceScene: (forceScene) => set({ forceScene }),

  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,

  phase: 'loading',
  setPhase: (phase) => set({ phase }),

  shot: 'macbookIntro',
  goTo: (shot) => set({ shot }),
  backToOverview: () => set({ shot: 'overview' }),

  hasVisited: safeStorage.get(VISITED_KEY) === '1',
  markVisited: () => {
    safeStorage.set(VISITED_KEY, '1');
    set({ hasVisited: true });
  },
}));

// Keep reducedMotion live if the OS setting changes mid-visit.
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) =>
  useExperience.setState({ reducedMotion: e.matches }),
);
