import { useEffect, useRef, type KeyboardEvent } from 'react';
import { PORTFOLIO_SECTIONS, appleCompanies, projects, type PortfolioSection } from '@/content';
import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import { AboutNote, ExperienceNote, ProjectsNote, SkillsNote, WelcomeNote } from './notes';
import styles from './Portfolio.module.css';

const NOTES: Record<PortfolioSection, () => React.JSX.Element> = {
  welcome: WelcomeNote,
  about: AboutNote,
  experience: ExperienceNote,
  skills: SkillsNote,
  projects: ProjectsNote,
};

/**
 * The MacBook portfolio: a Notes-style app (folders · notes list · note).
 * `screen`: rendered on the MacBook's display in 3D (fixed 1280 × 841 canvas).
 * `sheet`: full-screen on phones / portrait screens.
 */
export function Portfolio({ mode }: { mode: 'screen' | 'sheet' }) {
  const c = useContent();
  const m = c.macbook;
  const locale = useExperience((s) => s.locale);
  const { section, project } = useExperience((s) => s.portfolio);
  const openSection = useExperience((s) => s.openSection);
  const openProject = useExperience((s) => s.openProject);
  const close = useExperience((s) => s.backToOverview);
  const listRef = useRef<HTMLElement>(null);

  // Focus the notes list when the portfolio opens, so arrow keys work straight away
  // (the list itself takes focus, not a note, so no focus ring appears for mouse users).
  useEffect(() => {
    listRef.current?.focus({ preventScroll: true });
  }, []);

  const previews: Record<PortfolioSection, string> = {
    welcome: c.welcome.body[0] ?? '',
    about: m.about.combines.join(' · '),
    experience: appleCompanies.map((a) => a.name).join(', '),
    skills: m.skills.groups.languages.items.join(', '),
    projects: projects.map((p) => p.name).join(', '),
  };

  // Arrow keys move through the notes list, like Notes.
  const onListKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const i = PORTFOLIO_SECTIONS.indexOf(section);
    const next = PORTFOLIO_SECTIONS[(i + (e.key === 'ArrowDown' ? 1 : -1) + PORTFOLIO_SECTIONS.length) % PORTFOLIO_SECTIONS.length]!;
    openSection(next);
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus());
  };

  // Escape inside a project goes back to the list instead of leaving the MacBook.
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && project) {
      e.stopPropagation();
      openProject(null);
    }
  };

  const Note = NOTES[section];

  return (
    <div className={`${styles.app} ${mode === 'sheet' ? styles.sheet : styles.screen}`} lang={locale} onKeyDown={onKey}>
      <header className={styles.toolbar}>
        <div className={styles.lights}>
          <button type="button" className={styles.red} aria-label={m.labels.close} title={m.labels.close} onClick={close} />
          <span className={styles.yellow} aria-hidden="true" />
          <span className={styles.green} aria-hidden="true" />
        </div>
        <span className={styles.appName}>{m.appName}</span>
        <div className={styles.toolbarActions}>
          {section !== 'welcome' && (
            <button type="button" className={styles.toolbarBtn} onClick={() => openSection('welcome')}>
              ← {m.labels.backToWelcome}
            </button>
          )}
          <button type="button" className={styles.toolbarBtn} onClick={close} aria-label={m.labels.close}>
            ✕
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.folders} aria-hidden="true">
          <span className={styles.account}>iCloud</span>
          <span className={styles.folder}>
            {m.folder}
            <span>{PORTFOLIO_SECTIONS.length}</span>
          </span>
        </aside>

        <nav ref={listRef} className={styles.list} aria-label={m.labels.sections} onKeyDown={onListKey} tabIndex={-1}>
          {PORTFOLIO_SECTIONS.map((id) => (
            <button key={id} type="button" className={styles.noteItem} aria-current={section === id} onClick={() => openSection(id)}>
              <strong>{m.notes[id]}</strong>
              <span>{previews[id]}</span>
            </button>
          ))}
        </nav>

        <main className={styles.note} key={`${section}-${project ?? ''}`}>
          <Note />
        </main>
      </div>
    </div>
  );
}
