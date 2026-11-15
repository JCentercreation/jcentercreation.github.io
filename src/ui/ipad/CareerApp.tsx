import { useEffect, useRef, type KeyboardEvent } from 'react';
import { IPAD_SECTIONS, type IPadSection } from '@/content';
import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import { Architecture, Home, IOSEngineering, Leadership, Practices, Timeline } from './sections';
import styles from './CareerApp.module.css';

const VIEWS: Record<IPadSection, () => React.JSX.Element> = {
  home: Home,
  timeline: Timeline,
  ios: IOSEngineering,
  architecture: Architecture,
  practices: Practices,
  leadership: Leadership,
};
const ORDER: IPadSection[] = ['home', ...IPAD_SECTIONS];

/**
 * The iPad career experience: an iPadOS-style app in landscape — sidebar + editorial content.
 * `screen`: on the iPad's 3D display (1200 × 901 CSS px). `sheet`: full-screen on phones / portrait.
 * Escape is handled globally (Hud): company detail → section → overview → garage.
 */
export function CareerApp({ mode }: { mode: 'screen' | 'sheet' }) {
  const c = useContent();
  const locale = useExperience((s) => s.locale);
  const { section, company } = useExperience((s) => s.ipad);
  const open = useExperience((s) => s.openIPadSection);
  const close = useExperience((s) => s.backToOverview);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    navRef.current?.focus({ preventScroll: true });
  }, []);

  const onNavKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const i = ORDER.indexOf(section);
    open(ORDER[(i + (e.key === 'ArrowDown' ? 1 : -1) + ORDER.length) % ORDER.length]!);
    requestAnimationFrame(() => navRef.current?.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus());
  };

  const View = VIEWS[section];
  const label = (id: IPadSection) => (id === 'home' ? c.ipad.labels.overview : c.ipad.sections[id].title);

  return (
    <div className={`${styles.app} ${mode === 'sheet' ? styles.sheet : styles.screen}`} lang={locale}>
      <div className={styles.status} aria-hidden="true">
        <span>{c.windows.clock}</span>
        <span className={styles.statusIcons}>
          <i />
          <i />
          <i className={styles.battery} />
        </span>
      </div>
      <div className={styles.body}>
        <nav ref={navRef} className={styles.sidebar} aria-label={c.ipad.labels.sections} tabIndex={-1} onKeyDown={onNavKey}>
          <span className={styles.appTitle}>{c.ipad.appName}</span>
          {ORDER.map((id, i) => (
            <button key={id} type="button" className={styles.navItem} aria-current={section === id} onClick={() => open(id)}>
              <span className={styles.navIndex}>{i === 0 ? '◎' : String(i).padStart(2, '0')}</span>
              {label(id)}
            </button>
          ))}
        </nav>
        <main className={styles.content} key={section} data-company={company ?? undefined}>
          <button type="button" className={styles.close} aria-label={c.ipad.labels.close} title={c.ipad.labels.close} onClick={close}>
            ✕
          </button>
          <View />
        </main>
      </div>
    </div>
  );
}
