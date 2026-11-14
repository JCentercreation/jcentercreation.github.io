import { useMemo } from 'react';
import { Object3D } from 'three';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { POSTER } from '../layout';

/**
 * PLACEHOLDER for the Apple "Think different." Einstein poster.
 * The real poster uses a copyrighted photograph and Apple trademarks, so it is NOT reproduced
 * here: this is a neutral black-and-white stand-in with the same composition (portrait area,
 * slogan bottom-right) until the owner supplies an image they are entitled to use.
 */
function placeholderTexture() {
  const c = document.createElement('canvas');
  c.width = 610;
  c.height = 910;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0b0b0b';
  g.fillRect(0, 0, c.width, c.height);
  // Soft monochrome "portrait light" shape — abstract, not a likeness.
  const grad = g.createRadialGradient(300, 360, 20, 300, 380, 300);
  grad.addColorStop(0, '#9a9a9a');
  grad.addColorStop(0.45, '#4a4a4a');
  grad.addColorStop(1, '#0b0b0b');
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(300, 380, 210, 280, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#f2f2f2';
  g.font = '500 34px Georgia, "Times New Roman", serif';
  g.textAlign = 'right';
  g.fillText('Think different.', c.width - 46, c.height - 56);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function Poster() {
  const tex = useMemo(placeholderTexture, []);
  const { width: w, height: h, position } = POSTER;
  const target = useMemo(() => {
    const o = new Object3D();
    o.position.set(0, -0.15, 0);
    return o;
  }, []);
  return (
    <group position={position}>
      <mesh position-z={0.012} castShadow>
        <boxGeometry args={[w + 0.04, h + 0.04, 0.022]} />
        <meshStandardMaterial color="#0c0c0c" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position-z={0.0235}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.6} />
      </mesh>
      {/* Small picture light so the poster reads at night. */}
      <mesh position={[0, h / 2 + 0.07, 0.09]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.012, 0.012, 0.32, 12]} />
        <meshStandardMaterial color="#111" metalness={0.7} roughness={0.35} />
      </mesh>
      <primitive object={target} />
      <spotLight position={[0, h / 2 + 0.1, 0.3]} target={target} angle={0.7} penumbra={0.8} intensity={2.2} decay={2} color="#ffd1a0" />
      {/* Glazing reflection. */}
      <mesh position-z={0.025}>
        <planeGeometry args={[w, h]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.04} roughness={0.05} metalness={0} />
      </mesh>
    </group>
  );
}
