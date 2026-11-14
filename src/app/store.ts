import { create } from 'zustand';
import { LOCALES, type InteractiveObjectId, type Locale, type ShotId } from '@/content';
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

const SHOT_IDS: ShotId[] = ['macbookIntro', 'overview', 'desk', 'macbook', 'ipad', 'bookshelf', 'tesla', 'teslaLaptop'];

/** Review helpers: `?shot=bookshelf` opens a shot directly, `?intro=1` forces the welcome sequence. */
const params = new URLSearchParams(window.location.search);
const shotParam = params.get('shot') as ShotId | null;
export const initialShotOverride: ShotId | null = shotParam && SHOT_IDS.includes(shotParam) ? shotParam : null;
export const forceIntro = params.get('intro') === '1';

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

  /** Object under the pointer (or keyboard focus), for highlight + tooltip. */
  hovered: InteractiveObjectId | null;
  /** Book under the pointer while at the bookshelf. */
  hoveredBook: string | null;
  setHovered: (id: InteractiveObjectId | null) => void;
  setHoveredBook: (id: string | null) => void;

  teslaDoorOpen: boolean;
  /** Door click → door opens → camera flies to the laptop, as one sequence (spec §7.3). */
  openTeslaDoor: () => void;
  closeTeslaDoor: () => void;

  /** Set by the Skip button; the camera controller consumes it. */
  skipIntroRequested: boolean;
  requestSkipIntro: () => void;

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

  hovered: null,
  hoveredBook: null,
  setHovered: (hovered) => set({ hovered }),
  setHoveredBook: (hoveredBook) => set({ hoveredBook }),

  teslaDoorOpen: false,
  openTeslaDoor: () => {
    set({ teslaDoorOpen: true });
    // Start the camera while the door is still swinging so it reads as one continuous move.
    window.setTimeout(() => set({ shot: 'teslaLaptop' }), 550);
  },
  closeTeslaDoor: () => set({ teslaDoorOpen: false }),

  skipIntroRequested: false,
  requestSkipIntro: () => set({ skipIntroRequested: true }),

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
