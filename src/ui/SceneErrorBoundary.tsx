import { Component, type ReactNode } from 'react';
import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import styles from './Loader.module.css';

interface State {
  error: boolean;
  attempt: number;
}

/**
 * Catches failures while starting the 3D scene (engine chunk download, WebGL context, shader
 * compile…) and offers a retry or the content-first simple version — never a blank page.
 */
export class SceneErrorBoundary extends Component<{ children: (attempt: number) => ReactNode }, State> {
  state: State = { error: false, attempt: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { error: true };
  }

  componentDidCatch(error: unknown) {
    // Local diagnostics only — nothing is sent anywhere.
    console.error('Garage scene failed to start:', error);
  }

  render() {
    if (!this.state.error) return this.props.children(this.state.attempt);
    return <ErrorPanel onRetry={() => this.setState((s) => ({ error: false, attempt: s.attempt + 1 }))} />;
  }
}

/** Follows the language selector like the rest of the UI. */
function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  const { ui } = useContent();
  return (
      <div className={styles.loader} role="alert">
        <div className={styles.inner}>
          <p className={styles.title}>{ui.loadError.title}</p>
          <p className={styles.hint}>{ui.loadError.body}</p>
          <div className={styles.actions}>
            <button type="button" onClick={onRetry}>
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
