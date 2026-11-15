import { useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { PHOTO } from '../layout';
import { makeNoise } from '../materials/noise';

/**
 * PROVISIONAL framed black-and-white "photograph": a runner seen from behind on a mountain
 * trail. Drawn procedurally (layered ridges, trail, silhouette, film grain) as a stand-in until
 * the owner supplies a real photograph they have the rights to use.
 */
function photoTexture() {
  const W = 600;
  const H = 800;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const { fbm } = makeNoise(7);

  // Misty sky.
  const sky = g.createLinearGradient(0, 0, 0, H * 0.55);
  sky.addColorStop(0, '#9a9a9a');
  sky.addColorStop(1, '#d6d6d6');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);

  // Layered ridges, darker towards the viewer (aerial perspective).
  const ridge = (base: number, amp: number, tone: string, seed: number) => {
    g.fillStyle = tone;
    g.beginPath();
    g.moveTo(0, H);
    for (let x = 0; x <= W; x += 6) g.lineTo(x, base - fbm(x / W + seed, seed, 3, 4) * amp);
    g.lineTo(W, H);
    g.closePath();
    g.fill();
  };
  ridge(H * 0.36, 160, '#b5b5b5', 0.1);
  ridge(H * 0.46, 150, '#8c8c8c', 0.4);
  ridge(H * 0.6, 170, '#5d5d5d', 0.7);
  ridge(H * 0.78, 120, '#2f2f2f', 0.9);

  // Trail winding up the slope.
  g.strokeStyle = '#c9c9c9';
  g.lineCap = 'round';
  g.lineWidth = 46;
  g.beginPath();
  g.moveTo(W * 0.55, H + 20);
  g.bezierCurveTo(W * 0.35, H * 0.86, W * 0.62, H * 0.74, W * 0.48, H * 0.62);
  g.stroke();
  g.lineWidth = 14;
  g.beginPath();
  g.moveTo(W * 0.48, H * 0.62);
  g.bezierCurveTo(W * 0.42, H * 0.56, W * 0.55, H * 0.52, W * 0.5, H * 0.47);
  g.stroke();

  // Runner from behind, mid-stride.
  g.fillStyle = '#0d0d0d';
  g.strokeStyle = '#0d0d0d';
  const cx = W * 0.5;
  const cy = H * 0.66;
  g.beginPath();
  g.arc(cx, cy - 74, 11, 0, Math.PI * 2); // head
  g.fill();
  g.lineWidth = 20;
  g.beginPath();
  g.moveTo(cx, cy - 60);
  g.lineTo(cx + 2, cy - 18); // torso
  g.stroke();
  g.lineWidth = 8;
  g.beginPath();
  g.moveTo(cx - 6, cy - 54);
  g.lineTo(cx - 22, cy - 34);
  g.lineTo(cx - 16, cy - 16); // left arm
  g.moveTo(cx + 7, cy - 54);
  g.lineTo(cx + 20, cy - 38);
  g.lineTo(cx + 26, cy - 22); // right arm
  g.stroke();
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(cx - 3, cy - 18);
  g.lineTo(cx - 12, cy + 10);
  g.lineTo(cx - 8, cy + 36); // planted leg
  g.moveTo(cx + 5, cy - 18);
  g.lineTo(cx + 18, cy + 2);
  g.lineTo(cx + 30, cy + 10); // trailing leg
  g.stroke();

  // Film grain.
  const img = g.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, Math.min(255, img.data[i]! + n));
  }
  g.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function FramedPhoto() {
  const tex = useMemo(photoTexture, []);
  const { width: w, height: h, position } = PHOTO;
  const mat = 0.07;
  return (
    <group position={position}>
      {/* Black frame. */}
      <mesh position-z={0.014} castShadow>
        <boxGeometry args={[w + mat * 2 + 0.05, h + mat * 2 + 0.05, 0.028]} />
        <meshStandardMaterial color="#0e0e0e" roughness={0.45} metalness={0.2} />
      </mesh>
      {/* White mat. */}
      <mesh position-z={0.0285}>
        <planeGeometry args={[w + mat * 2, h + mat * 2]} />
        <meshStandardMaterial color="#e9e6df" roughness={0.9} />
      </mesh>
      <mesh position-z={0.029}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.7} />
      </mesh>
      <mesh position-z={0.03}>
        <planeGeometry args={[w + mat * 2, h + mat * 2]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.035} roughness={0.05} />
      </mesh>
    </group>
  );
}
