import { useEffect, useState } from 'react';

export type InputModality = 'mouse' | 'touch' | 'keyboard';

/** Navigation keys that mean the visitor is using the keyboard (not typing a shortcut like Escape). */
const NAV_KEYS = new Set(['Tab', 'Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

function initial(): InputModality {
  return typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches ? 'touch' : 'mouse';
}

/**
 * The visitor's most recent way of interacting, for wording instructions ("Click", "Tap", "Press Tab").
 * Touch screens start as 'touch'; every pointer or navigation key press updates it.
 */
export function useInputModality(): InputModality {
  const [modality, setModality] = useState<InputModality>(initial);
  useEffect(() => {
    const onPointer = (e: PointerEvent) => setModality(e.pointerType === 'mouse' ? 'mouse' : 'touch');
    const onKey = (e: KeyboardEvent) => {
      if (NAV_KEYS.has(e.key)) setModality('keyboard');
    };
    window.addEventListener('pointerdown', onPointer, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('pointerdown', onPointer, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, []);
  return modality;
}
