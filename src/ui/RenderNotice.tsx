import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import styles from './Loader.module.css';

/** sessionStorage key: the place to return to after a visitor-requested reload (consumed once at startup). */
export const RESUME_KEY = 'garage.resume';

/**
 * Shown when the browser takes the GPU context away. While a restore is awaited, a quiet status line;
 * if it does not come back, the visitor chooses: reload the garage where they were (only on their click),
 * or continue to the simple version. Language is kept (stored); the current place is kept for the reload.
 */
export function RenderNotice() {
  const { ui } = useContent();
  const state = useExperience((s) => s.renderState);
  if (state === 'ok') return null;
  if (state === 'lost')
    return (
      <div className={styles.loader} role="status" aria-live="polite">
        <div className={styles.inner}>
          <p className={styles.hint}>{ui.renderLost.restoring}</p>
        </div>
      </div>
    );
  const reload = () => {
    try {
      sessionStorage.setItem(RESUME_KEY, useExperience.getState().shot);
    } catch {
      // storage unavailable: the reload still works, from the overview
    }
    window.location.reload();
  };
  return (
    <div className={styles.loader} role="alert">
      <div className={styles.inner}>
        <p className={styles.title}>{ui.renderLost.title}</p>
        <p className={styles.hint}>{ui.renderLost.body}</p>
        <div className={styles.actions}>
          <button type="button" onClick={reload}>
            {ui.renderLost.reload}
          </button>
          <button type="button" onClick={() => useExperience.getState().setForceFallback('failed')}>
            {ui.renderLost.continue2d}
          </button>
        </div>
      </div>
    </div>
  );
}
