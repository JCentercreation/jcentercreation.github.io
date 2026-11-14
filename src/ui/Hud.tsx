import { useEffect } from 'react';
import { LOCALES } from '@/content';
import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import styles from './Hud.module.css';

/** Persistent, discreet chrome: language selector + return-to-garage. */
export function Hud() {
  const { ui } = useContent();
  const locale = useExperience((s) => s.locale);
  const setLocale = useExperience((s) => s.setLocale);
  const phase = useExperience((s) => s.phase);
  const shot = useExperience((s) => s.shot);
  const backToOverview = useExperience((s) => s.backToOverview);

  const canGoBack = phase === 'exploring' && shot !== 'overview';

  // Escape always returns to the overview — the visitor should never feel lost.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && useExperience.getState().shot !== 'overview') backToOverview();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [backToOverview]);

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
    </div>
  );
}
