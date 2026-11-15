import { Component, type ReactNode } from 'react';
import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import styles from './Loader.module.css';

interface Props {
  children: ReactNode;
  /** Lets the app hide the loader while the error panel is shown. */
  onFailed?: () => void;
}

interface State {
  error: boolean;
}

/**
 * Catches failures while starting the 3D scene (engine chunk download, WebGL context, shader
 * compile…) and offers a retry or the content-first simple version — never a blank page.
 */
export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { error: false };

  static getDerivedStateFromError(): Partial<State> {
    return { error: true };
  }

  componentDidCatch(error: unknown) {
    // Local diagnostics only — nothing is sent anywhere.
    console.error('Garage scene failed to start:', error);
    this.props.onFailed?.();
  }

  render() {
    if (!this.state.error) return this.props.children;
    return <ErrorPanel />;
  }
}

/** Follows the language selector like the rest of the UI. */
function ErrorPanel() {
  const { ui } = useContent();
  return (
    <div className={styles.loader} role="alert">
      <div className={styles.inner}>
        <p className={styles.title}>{ui.loadError.title}</p>
        <p className={styles.hint}>{ui.loadError.body}</p>
        <div className={styles.actions}>
          {/* Browsers cache a failed module import for the page's lifetime, so a real retry is a reload. */}
          <button type="button" onClick={() => window.location.reload()}>
            {ui.loadError.retry}
          </button>
          <button type="button" onClick={() => useExperience.getState().setForceFallback(true)}>
            {ui.loadError.continue2d}
          </button>
        </div>
      </div>
    </div>
  );
}
