import { useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { KEYBOARD, TRACKPAD } from '../layout';
import { roundRect } from '../screens/draw';
import { mat } from '../materials/library';
import { budgetMaterialCanvas } from '../materials/textureBudget';

/** Magic Keyboard top: white keys on silver. Generated, provisional. */
function keyboardTexture() {
  const c = document.createElement('canvas');
  c.width = 1116; // 278.9 mm
  c.height = 460; // 114.9 mm
  const g = c.getContext('2d')!;
  g.fillStyle = '#d6d8db';
  g.fillRect(0, 0, c.width, c.height);
  const rows = [14, 14, 14, 13, 12, 10];
  const pad = 22;
  const rowH = (c.height - pad * 2) / 6;
  rows.forEach((n, r) => {
    const h = r === 0 ? rowH * 0.6 : rowH;
    const y = pad + (r === 0 ? 0 : rowH * 0.6 + (r - 1) * rowH + rowH * 0.08);
    const keyW = (c.width - pad * 2) / n;
    for (let i = 0; i < n; i++) {
      let x = pad + i * keyW;
      let w = keyW;
      if (r === 5 && i === 4) w = keyW * 3;
      if (r === 5 && i > 4 && i < 7) continue;
      if (r === 5 && i >= 7) x = pad + (i - 2) * keyW + keyW * 2;
      roundRect(g, x + 4, y + 3, w - 8, h - 8, 8);
      g.fillStyle = '#f7f7f5';
      g.fill();
      g.strokeStyle = '#c4c6c9';
      g.lineWidth = 1.5;
      g.stroke();
    }
  });
  const t = new CanvasTexture(budgetMaterialCanvas(c));
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Wedge profile: thin at the front, taller at the back (as the real devices). */
function Wedge({ w, d, front, back, color, map }: { w: number; d: number; front: number; back: number; color?: string; map?: CanvasTexture }) {
  const angle = Math.atan((back - front) / d);
  const h = (front + back) / 2;
  return (
    <group>
      <mesh position-y={h / 2} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
<primitive object={mat.aluminium()} attach="material" />
      </mesh>
      <mesh position={[0, h + 0.0004, 0]} rotation-x={-Math.PI / 2 + angle}>
        <planeGeometry args={[w - 0.002, d / Math.cos(angle) - 0.002]} />
        <meshStandardMaterial map={map} color={color ?? '#ffffff'} roughness={map ? 0.45 : 0.22} metalness={map ? 0.1 : 0.05} />
      </mesh>
    </group>
  );
}

export function MagicKeyboard() {
  const tex = useMemo(keyboardTexture, []);
  return (
    <group position={KEYBOARD.position} rotation-y={KEYBOARD.rotationY}>
      <Wedge w={0.2789} d={0.1149} front={0.004} back={0.0109} map={tex} />
    </group>
  );
}

export function MagicTrackpad() {
  return (
    <group position={TRACKPAD.position} rotation-y={TRACKPAD.rotationY}>
      <Wedge w={0.16} d={0.1149} front={0.0049} back={0.0109} color="#eceef0" />
    </group>
  );
}
