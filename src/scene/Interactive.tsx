import type { ReactNode } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type { InteractiveObjectId } from '@/content';
import { useExperience } from '@/app/store';

interface Props {
  id: InteractiveObjectId;
  onSelect: () => void;
  /** Disable while its own shot is active, for example. */
  enabled?: boolean;
  children: ReactNode;
}

/**
 * Pointer handling for a clickable object: hover state (read by the object for its own
 * highlight and by the DOM tooltip), pointer cursor, click → onSelect.
 * Inert during loading and the welcome sequence.
 */
export function Interactive({ id, onSelect, enabled = true, children }: Props) {
  const isActive = () => enabled && useExperience.getState().phase === 'exploring';

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (!isActive()) return;
    e.stopPropagation();
    useExperience.getState().setHovered(id);
    document.body.style.cursor = 'pointer';
  };
  const out = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (useExperience.getState().hovered === id) useExperience.getState().setHovered(null);
    document.body.style.cursor = '';
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (!isActive()) return;
    e.stopPropagation();
    useExperience.getState().setHovered(null);
    document.body.style.cursor = '';
    onSelect();
  };

  return (
    <group onPointerOver={over} onPointerOut={out} onClick={click}>
      {children}
    </group>
  );
}

export function useIsHovered(id: InteractiveObjectId) {
  return useExperience((s) => s.hovered === id);
}
