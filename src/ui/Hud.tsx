import { useEffect, useRef, useState } from 'react';
import { LOCALES, type ShotId } from '@/content';
import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import { Tooltip } from './Tooltip';
import styles from './Hud.module.css';

const PLACES: ShotId[] = ['overview', 'desk', 'macbook', 'ipad', 'bookshelf', 'tesla', 'teslaInterior', 'teslaLaptop'];

const visuallyHidden: React.CSSProperties = { position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 };

/** Persistent, discreet chrome: language selector, return-to-garage, skip intro, keyboard places. */
export function Hud() {
  const { ui } = useContent();
  const locale = useExperience((s) => s.locale);
  const setLocale = useExperience((s) => s.setLocale);
  const phase = useExperience((s) => s.phase);
  // While loading, the progress is drawn on the 3D MacBook; the HUD appears once that is visible.
  const bootVisible = useExperience((s) => s.boot.step >= 1);
  const bootStep = useExperience((s) => s.boot.current);
  const skipRequested = useExperience((s) => s.skipIntroRequested);
  const loading = phase === 'loading';
  const showSkip = !skipRequested && (phase === 'intro' || (loading && bootVisible));
  const [slow, setSlow] = useState(false);
  // If loading on the MacBook takes unusually long, offer the simple version (as the DOM loader did).
  useEffect(() => {
    if (!loading || !bootVisible) {
      setSlow(false);
      return;
    }
    const t = window.setTimeout(() => setSlow(true), 20000);
    return () => window.clearTimeout(t);
  }, [loading, bootVisible]);
  const shot = useExperience((s) => s.shot);
  const backToOverview = useExperience((s) => s.backToOverview);
  const [hintVisible, setHintVisible] = useState(false);
  const skipRef = useRef<HTMLButtonElement>(null);
  const placesRef = useRef<HTMLElement>(null);
  const skipHadFocus = useRef(false);

  // When the intro ends, the Skip button disappears; if it had keyboard focus, hand focus to the
  // first garage place instead of dropping it on <body>.
  useEffect(() => {
    if (phase !== 'exploring' || !skipHadFocus.current) return;
    skipHadFocus.current = false;
    placesRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, [phase]);

  const canGoBack = phase === 'exploring' && shot !== 'overview';

  // Escape always returns to the overview — the visitor should never feel lost.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useExperience.getState();
      if (e.key !== 'Escape') return;
      // During loading (once the MacBook shows it) and the welcome sequence, Escape skips.
      if (s.phase === 'intro' || (s.phase === 'loading' && s.boot.step >= 1)) {
        s.requestSkipIntro();
        return;
      }
      if (s.phase !== 'exploring') return;
      // Car: portfolio section → portfolio overview → car interior → garage (door closes).
      if (s.shot === 'teslaLaptop') {
        if (s.auto.section !== 'overview') s.openAutoSection('overview');
        else s.goTo('teslaInterior');
        return;
      }
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
    // Inside the car is only reachable through the open door.
    if (id === 'teslaInterior') s.openTeslaDoor();
    else if (id === 'teslaLaptop') {
      useExperience.setState({ teslaDoorOpen: true });
      s.goTo('teslaLaptop');
    } else s.goTo(id);
  };

  return (
    <div className={`${styles.hud} ${loading && !bootVisible ? styles.hidden : ''}`}>
      {/* The loading progress is drawn on the 3D MacBook; screen readers get the same milestones here. */}
      <p style={visuallyHidden} role="status" aria-live="polite">
        {loading && bootVisible ? (bootStep ? `${ui.boot.preparing} ${ui.boot.steps[bootStep]}` : ui.boot.ready) : ''}
      </p>
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
        {slow && (
          // Loading continues (the real progress stays on the MacBook); this only explains the option below.
          <p className={styles.slowNote} role="status">
            {ui.boot.slow}
          </p>
        )}
        <div className={styles.actions}>
          <button
            ref={skipRef}
            type="button"
            className={styles.back}
            hidden={!showSkip}
            onFocus={() => (skipHadFocus.current = true)}
            // Only a deliberate move elsewhere clears it (hiding the button also blurs it, with no relatedTarget).
            onBlur={(e) => {
              if (e.relatedTarget) skipHadFocus.current = false;
            }}
            onClick={() => useExperience.getState().requestSkipIntro()}
          >
            {ui.skipIntro}
          </button>
          {slow && (
            <button type="button" className={styles.back} onClick={() => useExperience.getState().setForceFallback('chosen')}>
              {ui.loadError.continue2d}
            </button>
          )}
        </div>
      </div>

      <p className={styles.hint} data-visible={hintVisible && shot === 'overview'} aria-live="polite">
        {ui.exploreHint}
      </p>

      {/* Keyboard / screen-reader navigation: invisible until focused. */}
      <nav ref={placesRef} className={styles.places} aria-label={ui.placesLabel}>
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
