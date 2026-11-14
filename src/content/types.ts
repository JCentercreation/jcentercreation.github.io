/**
 * Content schema for The Engineer's Garage.
 *
 * Rules:
 * - Facts that do not depend on language (dates, logo paths, ids, spine colours) live in
 *   `content/shared/*`. Translatable text lives in `content/{en,es}/*`.
 * - `null` means "not provided by the owner yet". UI must render a neutral pending state —
 *   never invent text to fill the gap.
 * - Adding a company or book = add a shared record + its text in each locale. No scene code changes.
 */

export type Locale = 'en' | 'es';
export const LOCALES: readonly Locale[] = ['en', 'es'] as const;

/** Year-month string, e.g. "2016-09". Year only ("2020") when the month is unknown. */
export type YearMonth = string;

export interface Period {
  start: YearMonth;
  /** `null` = present / ongoing. */
  end: YearMonth | null;
}

// ---------- shared (language-neutral) ----------

export interface CompanyRecord {
  id: string;
  name: string;
  /** Path under /public. `null` until the owner supplies the official logo file. */
  logo: string | null;
  period: Period;
  /** Technologies confirmed by the owner. Proper nouns, not translated. */
  technologies: string[];
}

export interface PositionRecord {
  id: string;
  companyId: string;
  period: Period;
}

export interface BookRecord {
  id: string;
  title: string;
  author: string;
  /** Spine appearance in the 3D scene (stable between visits). */
  spine: { color: string; textColor: string; heightCm: number; thicknessCm: number };
  /** Path under /public. `null` until a cover image is supplied. */
  cover: string | null;
  /** Fixed shelf slot so positions stay stable. Index into the bookshelf slot list. */
  slot: number;
}

export interface ProjectRecord {
  id: string;
  name: string;
  url: string;
  /** Extra links (e.g. the two Swift courses). */
  links?: { name: string; url: string }[];
}

// ---------- localized ----------

export interface UiStrings {
  siteTitle: string;
  loading: string;
  loadingHint: string;
  enter: string;
  backToGarage: string;
  skipIntro: string;
  language: string;
  languageNames: Record<Locale, string>;
  present: string;
  pendingContent: string;
  reducedMotionNotice: string;
  /** One-line hint shown once the overview is reached. */
  exploreHint: string;
  /** Keyboard / screen-reader list of places to visit. */
  placesLabel: string;
  fallback: {
    title: string;
    reason: string;
    viewAnyway: string;
  };
  /** Accessible labels for interactive 3D objects. */
  objects: Record<InteractiveObjectId, string>;
  /** Names of the cinematic camera shots. */
  shots: Record<ShotId, string>;
}

export type InteractiveObjectId = 'macbook' | 'ipad' | 'desk' | 'bookshelf' | 'tesla' | 'teslaDoor';
export type ShotId =
  | 'macbookIntro'
  | 'overview'
  | 'desk'
  | 'macbook'
  | 'ipad'
  | 'bookshelf'
  | 'tesla'
  | 'teslaLaptop';

export interface WelcomeNote {
  title: string;
  /** Paragraphs of the Notes-style welcome. */
  body: string[];
  /** Short bullet list: what visitors can discover in the room. */
  discover: { heading: string; items: string[] };
}

/** The MacBook runs a single Notes-style app; each note is one portfolio section. */
export interface MacBookContent {
  appName: string;
  folder: string;
  notes: {
    welcome: string;
    experience: string;
    technologies: string;
    leadership: string;
    startups: string;
    projects: string;
  };
  projects: Record<string, { description: string; status: string | null }>;
}

export interface WindowsChrome {
  start: string;
  /** Clock shown in the taskbar — static, decorative. */
  clock: string;
}

export interface CompanyText {
  /** `null` = description pending from the owner. */
  description: string | null;
}

export interface PositionText {
  title: string;
  location: string;
}

export interface AppleContent {
  heading: string;
  sections: {
    experience: string;
    technologies: string;
    architecture: string;
    leadership: string;
    startups: string;
  };
  companies: Record<string, CompanyText>;
  startups: { heading: string; intro: string };
  profile: {
    languages: { label: string; items: string[] };
    uiFrameworks: { label: string; items: string[] };
    architecture: { label: string; items: string[] };
    testing: { label: string; items: string[] };
    distribution: { label: string; items: string[] };
    leadership: { label: string; items: string[] };
  };
}

export interface AutomotiveContent {
  windowTitle: string;
  heading: string;
  subtitle: string;
  companies: Record<string, CompanyText>;
  positions: Record<string, PositionText>;
  /** Extra per-company lists (e.g. RFEA events). Keyed by company id. */
  highlights: Record<string, { label: string; items: string[] }>;
  labels: { period: string; role: string; technologies: string; location: string };
}

export interface BooksContent {
  heading: string;
  byAuthor: string;
  close: string;
  coverPending: string;
}

export interface LocaleContent {
  ui: UiStrings;
  welcome: WelcomeNote;
  macbook: MacBookContent;
  windows: WindowsChrome;
  apple: AppleContent;
  automotive: AutomotiveContent;
  books: BooksContent;
}
