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
  /** Short form used where space is tight (timeline labels, logo placeholder). */
  shortName: string;
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
  /** Original published title (never translated). */
  title: string;
  /** Subtitle of the selected edition (Open Library record). */
  subtitle?: string;
  author: string;
  /** Year of first publication (Open Library work record). */
  firstPublished?: number;
  /** Spine appearance in the 3D scene (stable between visits). */
  spine: { color: string; textColor: string; heightCm: number; thicknessCm: number };
  /** Path under /public. `null` until a cover image is supplied. */
  cover: string | null;
  /**
   * Fixed place on the shelf, stable between visits: shelf (0 = bottom), bay (0 = nearest the
   * window) and position along the bay (0–1). Everything else on the shelf flows around it.
   */
  place: { shelf: number; bay: number; at: number };
}

export interface ProjectRecord {
  id: string;
  name: string;
  url: string;
  /** Extra links (e.g. the two Swift courses). */
  links?: { name: string; url: string }[];
  /** Link/course names not yet verified by the owner (kept, but tracked as provisional). */
  provisionalNames?: boolean;
}

// ---------- localized ----------

export interface UiStrings {
  siteTitle: string;
  loading: string;
  loadingHint: string;
  /** Real loading stages (no invented percentages). */
  loadingStages: { engine: string; scene: string; ready: string };
  /** Shown if the 3D scene cannot start (WebGL or download failure). */
  loadError: { title: string; body: string; retry: string; continue2d: string };
  /** Accessible label for the welcome caption region during the intro. */
  welcomeLabel: string;
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
    /** Why the simple version is shown — never claim incompatibility when the visitor chose it. */
    reasons: {
      /** Device/browser lacks what the 3D garage needs. */
      unsupported: string;
      /** The visitor chose the simple version. */
      chosen: string;
      /** The 3D garage failed to load. */
      failed: string;
    };
    viewAnyway: string;
    /** Return to the 3D garage after choosing the simple version. */
    open3D: string;
    /** Try loading the 3D garage again after a failure. */
    retry3D: string;
  };
  /** Accessible labels for interactive 3D objects. */
  objects: Record<InteractiveObjectId, string>;
  /** Names of the cinematic camera shots. */
  shots: Record<ShotId, string>;
}

export type InteractiveObjectId = 'macbook' | 'ipad' | 'desk' | 'bookshelf' | 'tesla' | 'teslaDoor' | 'carLaptop';
export type ShotId =
  | 'macbookIntro'
  | 'overview'
  | 'desk'
  | 'macbook'
  | 'ipad'
  | 'bookshelf'
  | 'tesla'
  | 'teslaInterior'
  | 'teslaLaptop';

export interface WelcomeNote {
  title: string;
  /** Paragraphs of the Notes-style welcome. */
  body: string[];
  /** Short bullet list: what visitors can discover in the room. */
  discover: { heading: string; items: string[] };
}

/** Sections of the MacBook portfolio — each is one "note" in the Notes-style app. */
export type PortfolioSection = 'welcome' | 'about' | 'experience' | 'skills' | 'projects';
export const PORTFOLIO_SECTIONS: readonly PortfolioSection[] = ['welcome', 'about', 'experience', 'skills', 'projects'] as const;

interface LabelledList {
  label: string;
  items: string[];
}

/** The MacBook runs a single Notes-style app; each note is one portfolio section. */
export interface MacBookContent {
  appName: string;
  folder: string;
  notes: Record<PortfolioSection, string>;
  /** Accessible / UI labels for the portfolio chrome. */
  labels: {
    sections: string;
    explore: string;
    close: string;
    backToWelcome: string;
    backToProjects: string;
    openLink: string;
    opensInNewTab: string;
    status: string;
    links: string;
  };
  about: {
    heading: string;
    combinesLabel: string;
    combines: string[];
    /** Owner's own words (previous site, /legacy/). */
    paragraphs: string[];
  };
  experience: {
    heading: string;
    intro: string;
    timeline: string;
    role: string;
    rolePending: string;
    period: string;
    description: string;
    showDetails: string;
    hideDetails: string;
  };
  skills: {
    heading: string;
    groups: { languages: LabelledList; architecture: LabelledList; quality: LabelledList; practices: LabelledList };
  };
  projectsHeading: string;
  projectsIntro: string;
  projects: Record<string, { description: string; status: string | null }>;
}

/** Sections of the iPad career experience ("home" is the overview screen). */
export type IPadSection = 'home' | 'timeline' | 'ios' | 'architecture' | 'practices' | 'leadership';
export const IPAD_SECTIONS: readonly Exclude<IPadSection, 'home'>[] = ['timeline', 'ios', 'architecture', 'practices', 'leadership'] as const;
export type ArchitecturePattern = 'mvc' | 'mvvm' | 'mvp' | 'viper' | 'mv' | 'tca';
export type LeadershipItem = 'techReference' | 'interviews' | 'mentoring' | 'guidance' | 'decisions';

/** The iPad: a visual, technical exploration of the iOS career (complements the MacBook). */
export interface IPadContent {
  appName: string;
  home: { eyebrow: string; title: string; subtitle: string };
  sections: Record<Exclude<IPadSection, 'home'>, { title: string; intro: string }>;
  labels: {
    sections: string;
    overview: string;
    close: string;
    role: string;
    period: string;
    selectHint: string;
    closeDetail: string;
    generalOverview: string;
    generalNote: string;
    context: string;
  };
  ios: { languages: string; uiFrameworks: string };
  /** General, textbook explanations — explicitly not claims about specific projects. */
  architecture: { patterns: Record<ArchitecturePattern, { expansion: string; summary: string }> };
  practices: { testing: LabelledList; delivery: LabelledList; technical: LabelledList };
  leadership: { items: Record<LeadershipItem, string> };
}

export interface WindowsChrome {
  start: string;
  /** Clock shown in the taskbar — static, decorative. */
  clock: string;
}

export interface CompanyText {
  /** Job title as supplied by the owner (source of truth). `null`/absent = not supplied yet. */
  role?: string | null;
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
  /** Interactive laptop portfolio (Windows-inspired). */
  portfolio: {
    sections: Record<AutoSection, string>;
    overviewIntro: string;
    timeline: string;
    openCompany: string;
    locations: string;
    events: string;
    positions: string;
    technologiesIntro: string;
    techAt: string;
    closePortfolio: string;
    start: string;
    navLabel: string;
    selectLaptop: string;
    /** RFEDA venues, listed separately (approved). */
    venues: string[];
  };
}

export type AutoSection = 'overview' | 'nissan' | 'seat' | 'rfea' | 'technologies';
export const AUTO_SECTIONS: readonly AutoSection[] = ['overview', 'nissan', 'seat', 'rfea', 'technologies'] as const;

export interface BooksContent {
  heading: string;
  byAuthor: string;
  close: string;
  coverPending: string;
  /** Understated hint shown at the bookshelf. */
  selectHint: string;
  /** Accessible label for the keyboard list of books. */
  listLabel: string;
  firstPublished: string;
  /**
   * Short factual description per book id (general summary of the book's subject — no opinions,
   * nothing attributed to the owner). `null` = show title and author only.
   */
  descriptions: Record<string, string | null>;
}

export interface LocaleContent {
  ui: UiStrings;
  welcome: WelcomeNote;
  macbook: MacBookContent;
  ipad: IPadContent;
  windows: WindowsChrome;
  apple: AppleContent;
  automotive: AutomotiveContent;
  books: BooksContent;
}
