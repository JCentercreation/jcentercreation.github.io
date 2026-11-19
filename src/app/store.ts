import { create } from 'zustand';
import { LOCALES, type AutoSection, type IPadSection, type InteractiveObjectId, type Locale, type PortfolioSection, type ShotId } from '@/content';
import { safeStorage } from '@/lib/storage';
import { detectCapabilities, type Capabilities } from '@/lib/capabilities';
import type { BootStep } from '@/scene/boot';
import { createDelayedMove } from './delayedMove';

export type FallbackRequest = 'chosen' | 'failed';

/**
 * The camera move into the car that follows the driver's door opening. Cancelled by any newer
 * navigation command (another place, Back to the garage, Escape, closing the door), so it can never
 * pull the camera into the car after the visitor has chosen something else.
 */
const teslaEntry = createDelayedMove();

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

export const SHOT_IDS: ShotId[] = ['macbookIntro', 'overview', 'desk', 'macbook', 'ipad', 'bookshelf', 'tesla', 'teslaInterior', 'teslaLaptop'];

/** Review helpers: `?shot=bookshelf` opens a shot directly, `?intro=1` forces the welcome sequence. */
const params = new URLSearchParams(window.location.search);
const shotParam = params.get('shot') as ShotId | null;
export const initialShotOverride: ShotId | null = shotParam && SHOT_IDS.includes(shotParam) ? shotParam : null;
export const forceIntro = params.get('intro') === '1';
/** Review helper: `?door=open` opens the Tesla driver door and keeps it open. */
export const holdDoorOpen = params.get('door') === 'open';
/** Review helper: `?cam=x,y,z,tx,ty,tz[,fov]` frames an arbitrary still (no parallax). */
const camParam = params.get('cam')?.split(',').map(Number);
export const cameraOverride =
  camParam && camParam.length >= 6 && camParam.every((n) => Number.isFinite(n))
    ? { position: camParam.slice(0, 3) as [number, number, number], target: camParam.slice(3, 6) as [number, number, number], fov: camParam[6] ?? 50 }
    : null;

interface ExperienceState {
  locale: Locale;
  setLocale: (locale: Locale) => void;

  capabilities: Capabilities;
  /** User chose to try 3D despite the fallback recommendation. */
  forceScene: boolean;
  setForceScene: (v: boolean) => void;
  /**
   * Why the simple version was requested at runtime: the visitor chose it ('chosen') or the 3D
   * scene failed to start ('failed'). null = not requested (device capability decides).
   */
  forceFallback: FallbackRequest | null;
  setForceFallback: (v: FallbackRequest | null) => void;
  /**
   * WebGL context state: 'lost' while the browser has taken the GPU context away (a restore is awaited),
   * 'failed' if it did not come back in time (the visitor is offered a reload or the simple version).
   */
  renderState: 'ok' | 'lost' | 'failed';
  /** True once the intro's pull-back has started (the welcome caption fades out). */
  introRevealing: boolean;

  reducedMotion: boolean;

  phase: Phase;
  setPhase: (phase: Phase) => void;

  /** Current cinematic shot. Changing locale never touches this. */
  shot: ShotId;
  /** The shot the camera has finished flying to (null while moving). Screens mount on arrival. */
  arrivedShot: ShotId | null;
  setArrivedShot: (shot: ShotId | null) => void;

  /** MacBook portfolio navigation — independent of locale, so switching language keeps it. */
  portfolio: { section: PortfolioSection; project: string | null; company: string | null };
  openSection: (section: PortfolioSection) => void;
  openProject: (id: string | null) => void;
  toggleCompany: (id: string) => void;

  /** iPad career navigation — also independent of locale. */
  ipad: { section: IPadSection; company: string | null };
  openIPadSection: (section: IPadSection) => void;
  selectIPadCompany: (id: string | null) => void;
  goTo: (shot: ShotId) => void;
  backToOverview: () => void;

  /** Object under the pointer (or keyboard focus), for highlight + tooltip. */
  hovered: InteractiveObjectId | null;
  /** Book under the pointer while at the bookshelf. */
  hoveredBook: string | null;
  setHovered: (id: InteractiveObjectId | null) => void;
  setHoveredBook: (id: string | null) => void;

  /** Book taken off the shelf (null = all books in place). Independent of locale. */
  selectedBook: string | null;
  /** True once the selected book has finished turning towards the camera (info panel shows). */
  bookHeld: boolean;
  selectBook: (id: string) => void;
  closeBook: () => void;
  setBookHeld: (held: boolean) => void;

  teslaDoorOpen: boolean;
  /** Door click → door opens → camera moves into the doorway (car interior), as one sequence. */
  openTeslaDoor: () => void;
  closeTeslaDoor: () => void;
  /** Drops a pending move into the car (the door then closes on its own, see Tesla.tsx). */
  cancelTeslaEntry: () => void;

  /** Automotive portfolio navigation (laptop on the driver seat) — independent of locale. */
  auto: { section: AutoSection };
  openAutoSection: (section: AutoSection) => void;

  /** Set by the Skip button; the camera controller consumes it. */
  /** Boot milestones completed (scene/boot.ts) and the one in progress. */
  boot: { step: number; current: BootStep | null };
  setBoot: (step: number, current: BootStep | null) => void;
  /** How the visitor entered the garage once loading finished (drives the camera's first move). */
  entry: 'intro' | 'return' | 'skip' | 'override' | null;
  skipIntroRequested: boolean;
  requestSkipIntro: () => void;

  /** Returning visitors may skip the welcome sequence (spec §4). */
  hasVisited: boolean;
  markVisited: () => void;
}

/** Per-device entry rules when the camera goes to a shot (unchanged MacBook / iPad behaviour). */
function goToState(s: ExperienceState, shot: ShotId): Partial<ExperienceState> {
  // Entering the MacBook from elsewhere always starts on the welcome note.
  if (shot === 'macbook' && s.shot !== 'macbook') return { shot, portfolio: { section: 'welcome', project: null, company: null } };
  // Entering the iPad from elsewhere starts on its overview.
  if (shot === 'ipad' && s.shot !== 'ipad') return { shot, ipad: { section: 'home', company: null } };
  // Opening the automotive portfolio from the car interior starts on its overview.
  if (shot === 'teslaLaptop' && s.shot !== 'teslaLaptop') return { shot, auto: { section: 'overview' } };
  return { shot };
}

export const useExperience = create<ExperienceState>((set) => ({
  locale: initialLocale(),
  setLocale: (locale) => {
    safeStorage.set(LANG_KEY, locale);
    set({ locale });
  },

  capabilities: detectCapabilities(),
  forceScene: false,
  setForceScene: (forceScene) => set({ forceScene, forceFallback: null }),
  forceFallback: null,
  setForceFallback: (forceFallback) => set({ forceFallback }),
  renderState: 'ok',
  introRevealing: false,

  reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,

  phase: 'loading',
  setPhase: (phase) => set({ phase }),

  shot: 'macbookIntro',
  arrivedShot: null,
  setArrivedShot: (arrivedShot) => set({ arrivedShot }),
  goTo: (shot) => {
    teslaEntry.cancel();
    set((s) =>
      // Leaving the bookshelf always puts a taken book back.
      shot !== 'bookshelf' && s.selectedBook ? { ...goToState(s, shot), selectedBook: null, bookHeld: false } : goToState(s, shot),
    );
  },

  portfolio: { section: 'welcome', project: null, company: null },
  openSection: (section) => set({ portfolio: { section, project: null, company: null } }),
  openProject: (project) => set((s) => ({ portfolio: { ...s.portfolio, section: 'projects', project } })),
  ipad: { section: 'home', company: null },
  openIPadSection: (section) => set({ ipad: { section, company: null } }),
  selectIPadCompany: (company) => set((s) => ({ ipad: { ...s.ipad, company } })),
  toggleCompany: (id) =>
    set((s) => ({ portfolio: { ...s.portfolio, company: s.portfolio.company === id ? null : id } })),
  backToOverview: () => {
    teslaEntry.cancel();
    set({ shot: 'overview', selectedBook: null, bookHeld: false });
  },

  hovered: null,
  hoveredBook: null,
  setHovered: (hovered) => set({ hovered }),
  setHoveredBook: (hoveredBook) => set({ hoveredBook }),

  selectedBook: null,
  bookHeld: false,
  // Only from the bookshelf view, one book at a time.
  selectBook: (id) =>
    set((s) => (s.shot === 'bookshelf' && s.arrivedShot === 'bookshelf' && !s.selectedBook ? { selectedBook: id, hoveredBook: null } : {})),
  closeBook: () => set({ selectedBook: null, bookHeld: false }),
  setBookHeld: (bookHeld) => set({ bookHeld }),

  teslaDoorOpen: holdDoorOpen,
  openTeslaDoor: () => {
    set({ teslaDoorOpen: true });
    // Start the camera while the door is still swinging so it reads as one continuous move. Repeated
    // clicks while it is pending schedule nothing more; a newer navigation command cancels it.
    teslaEntry.start(() => {
      const s = useExperience.getState();
      if (s.teslaDoorOpen && s.phase === 'exploring') set({ shot: 'teslaInterior' });
    }, 550);
  },
  closeTeslaDoor: () => {
    teslaEntry.cancel();
    set({ teslaDoorOpen: false });
  },
  cancelTeslaEntry: () => teslaEntry.cancel(),

  auto: { section: 'overview' },
  openAutoSection: (section) => set({ auto: { section } }),

  boot: { step: 0, current: 'engine' },
  setBoot: (step, current) => set({ boot: { step, current } }),
  entry: null,
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

// Review tooling only (`?capture=1`): lets browser checks read state such as the door position.
if (new URLSearchParams(window.location.search).has('capture')) {
  (window as unknown as { __store: typeof useExperience }).__store = useExperience;
}
