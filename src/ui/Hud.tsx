import { useEffect, useState } from 'react';
import { LOCALES, type ShotId } from '@/content';
import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import { Tooltip } from './Tooltip';
import styles from './Hud.module.css';

const PLACES: ShotId[] = ['overview', 'desk', 'macbook', 'ipad', 'bookshelf', 'tesla', 'teslaLaptop'];

/** Persistent, discreet chrome: language selector, return-to-garage, skip intro, keyboard places. */
export function Hud() {
  const { ui } = useContent();
  const locale = useExperience((s) => s.locale);
  const setLocale = useExperience((s) => s.setLocale);
  const phase = useExperience((s) => s.phase);
  const shot = useExperience((s) => s.shot);
  const backToOverview = useExperience((s) => s.backToOverview);
  const [hintVisible, setHintVisible] = useState(false);

  const canGoBack = phase === 'exploring' && shot !== 'overview';

  // Escape always returns to the overview — the visitor should never feel lost.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useExperience.getState();
      if (e.key !== 'Escape' || s.phase !== 'exploring') return;
      // Bookshelf: a taken book goes back first; the camera stays on the shelf.
      if (s.shot === 'bookshelf' && s.selectedBook) {
        s.closeBook();
        return;
      }
      // Layered: inside a MacBook project, Escape first returns to the project list.
      if (s.shot === 'macbook' && s.portfolio.project) {
        s.openProject(null);
        return;
      }
      // iPad: company detail → section → overview → garage.
      if (s.shot === 'ipad' && s.ipad.company) {
        s.selectIPadCompany(null);
        return;
      }
      if (s.shot === 'ipad' && s.ipad.section !== 'home') {
        s.openIPadSection('home');
        return;
      }
      if (s.shot !== 'overview') backToOverview();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [backToOverview]);

  // Show the "what to click" hint the first time the overview is reached.
  useEffect(() => {
    if (phase !== 'exploring') return;
    setHintVisible(true);
    const t = window.setTimeout(() => setHintVisible(false), 6500);
    return () => window.clearTimeout(t);
  }, [phase]);
  useEffect(() => {
    if (shot !== 'overview') setHintVisible(false);
  }, [shot]);

  const visit = (id: ShotId) => {
    const s = useExperience.getState();
    if (id === 'teslaLaptop') s.openTeslaDoor();
    else s.goTo(id);
  };

  return (
    <div className={`${styles.hud} ${phase === 'loading' ? styles.hidden : ''}`}>
      <div className={styles.topRight}>
        <div className={styles.pill} role="group" aria-label={ui.language}>
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              className={styles.langBtn}
              aria-pressed={locale === l}
              aria-label={ui.languageNames[l]}
              lang={l}
              onClick={() => setLocale(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.bottomLeft}>
        <button type="button" className={styles.back} hidden={!canGoBack} onClick={backToOverview}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {ui.backToGarage}
        </button>
      </div>

      <div className={styles.bottomRight}>
        <button
          type="button"
          className={styles.back}
          hidden={phase !== 'intro'}
          onClick={() => useExperience.getState().requestSkipIntro()}
        >
          {ui.skipIntro}
        </button>
      </div>

      <p className={styles.hint} data-visible={hintVisible && shot === 'overview'} aria-live="polite">
        {ui.exploreHint}
      </p>

      {/* Keyboard / screen-reader navigation: invisible until focused. */}
      <nav className={styles.places} aria-label={ui.placesLabel}>
        {PLACES.map((id) => (
          <button key={id} type="button" disabled={phase !== 'exploring'} aria-current={shot === id} onClick={() => visit(id)}>
            {ui.shots[id]}
          </button>
        ))}
      </nav>

      <Tooltip />
    </div>
  );
}
