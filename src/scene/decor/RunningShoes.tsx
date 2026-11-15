import { useMemo } from 'react';
import { ExtrudeGeometry, Shape } from 'three';

/**
 * PROVISIONAL orange max-cushion road-running shoes (Vomero Plus–inspired: thick foam midsole
 * with heel-to-toe rocker, orange knit upper). No logos or trademarks. Real size (~30 cm).
 * Final asset: licensed or custom model, pending approval.
 */
const L = 0.3;
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Half-width of the footprint along the shoe (0 = heel, 1 = toe). */
function halfWidth(t: number) {
  const w = 0.036 + 0.017 * smooth(0.35, 0.72, t) - 0.006 * smooth(0.25, 0.42, t) * (1 - smooth(0.42, 0.6, t));
  return w * Math.sqrt(Math.min(1, t / 0.07)) * Math.sqrt(Math.min(1, (1 - t) / 0.16));
}

function footprint(scale: number) {
  const s = new Shape();
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = [t * L, halfWidth(t) * scale] as const;
    if (i === 0) s.moveTo(p[0], p[1]);
    else s.lineTo(p[0], p[1]);
  }
  for (let i = n; i >= 0; i--) {
    const t = i / n;
    s.lineTo(t * L, -halfWidth(t) * scale * 1.06);
  }
  return s;
}

/** Toe spring / rocker: the forefoot lifts. */
const rocker = (x: number) => 0.028 * Math.pow(smooth(0.6 * L, L, x), 1.6) + 0.006 * Math.pow(smooth(0.18 * L, 0, x), 2);

function shoeGeometry() {
  const opts = (d: number, b: number) => ({ depth: d, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 3, curveSegments: 4 });

  const outsole = new ExtrudeGeometry(footprint(1.02), opts(0.006, 0.002));
  const midsole = new ExtrudeGeometry(footprint(1.0), opts(0.04, 0.008));
  const upper = new ExtrudeGeometry(footprint(0.9), opts(0.075, 0.018));

  for (const g of [outsole, midsole, upper]) g.rotateX(-Math.PI / 2);

  const deform = (g: ExtrudeGeometry, y0: number, thick: (x: number) => number, dome: number) => {
    const p = g.attributes.position!;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < p.count; i++) {
      minY = Math.min(minY, p.getY(i));
      maxY = Math.max(maxY, p.getY(i));
    }
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const f = (p.getY(i) - minY) / (maxY - minY); // 0 bottom → 1 top
      const y = y0 + f * thick(x);
      p.setY(i, y + rocker(x));
      // Round the top: narrower towards the top surface.
      p.setZ(i, p.getZ(i) * (1 - dome * f * f));
    }
    g.computeVertexNormals();
  };
  deform(outsole, 0, () => 0.008, 0);
  // Stack height: ~45 mm heel → ~35 mm forefoot (max-cushion).
  deform(midsole, 0.007, (x) => 0.045 - 0.012 * smooth(0.2 * L, 0.75 * L, x), 0.05);
  // Upper: tall at the collar, low at the toe box.
  deform(upper, 0.045, (x) => 0.085 * (1 - 0.55 * smooth(0.45 * L, 0.98 * L, x)) + 0.02 * smooth(0.12 * L, 0, x), 0.42);
  return { outsole, midsole, upper };
}

function Shoe({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  const g = useMemo(shoeGeometry, []);
  const laces = [0.42, 0.49, 0.56, 0.63, 0.7];
  return (
    <group position={position} rotation-y={rotation}>
      <mesh geometry={g.outsole} castShadow receiveShadow>
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      <mesh geometry={g.midsole} castShadow receiveShadow>
        <meshStandardMaterial color="#f3efe7" roughness={0.7} />
      </mesh>
      <mesh geometry={g.upper} castShadow>
        <meshStandardMaterial color="#ff7414" roughness={0.75} />
      </mesh>
      {/* Collar opening. */}
      <mesh position={[0.075, 0.133, 0]} rotation-x={-Math.PI / 2} scale={[1.7, 1, 1]}>
        <circleGeometry args={[0.024, 24]} />
        <meshStandardMaterial color="#1b1410" roughness={1} />
      </mesh>
      {/* Laces across the instep. */}
      {laces.map((t) => {
        const x = t * L;
        const y = 0.045 + 0.085 * (1 - 0.55 * smooth(0.45 * L, 0.98 * L, x)) + rocker(x) + 0.002;
        return (
          <mesh key={t} position={[x, y, 0]} rotation-z={-0.25 * smooth(0.45, 0.75, t)}>
            <boxGeometry args={[0.006, 0.004, 0.045]} />
            <meshStandardMaterial color="#f5f2ec" roughness={0.8} />
          </mesh>
        );
      })}
      {/* Heel pull tab. */}
      <mesh position={[0.004, 0.125, 0]}>
        <boxGeometry args={[0.008, 0.035, 0.022]} />
        <meshStandardMaterial color="#1b1b1b" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Kicked off by the wall below the photograph, out of the way of the bookshelf. */
export function RunningShoes() {
  return (
    <group position={[2.35, 0, -2.75]}>
      <Shoe position={[0, 0, 0]} rotation={0.55} />
      <Shoe position={[0.06, 0, 0.16]} rotation={0.2} />
    </group>
  );
}
