import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import styles from '../bookshelf/BookPanel.module.css';

/** Inside the car: an understated hint plus a keyboard-reachable way to open the laptop. */
export function InteriorHint() {
  const c = useContent();
  const here = useExperience((s) => s.shot === 'teslaInterior' && s.arrivedShot === 'teslaInterior' && s.phase === 'exploring');
  if (!here) return null;
  return (
    <>
      <p className={styles.hint} data-visible="true">
        {c.automotive.portfolio.selectLaptop}
      </p>
      <nav className={styles.list} aria-label={c.ui.shots.teslaInterior}>
        <button type="button" onClick={() => useExperience.getState().goTo('teslaLaptop')}>
          {c.ui.objects.carLaptop}
        </button>
      </nav>
    </>
  );
}
