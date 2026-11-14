import { useMemo } from 'react';
import { ExtrudeGeometry, Shape } from 'three';

/**
 * PROVISIONAL orange max-cushion running shoes (Vomero Plus–inspired silhouette, no logos).
 * Side profile extruded, then narrowed at heel and toe. Final asset to be modelled/licensed.
 */
function shoeGeometries() {
  const smooth = (e0: number, e1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };
  const taper = (g: ExtrudeGeometry) => {
    const p = g.attributes.position!;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const k = (1 - 0.45 * smooth(0.18, 0.3, x)) * (1 - 0.25 * smooth(0.06, 0.0, x));
      p.setZ(i, p.getZ(i) * k);
    }
    g.computeVertexNormals();
    return g;
  };
  // Thick foam midsole with toe spring.
  const sole = new Shape();
  sole.moveTo(0.0, 0.012);
  sole.quadraticCurveTo(0.0, 0.0, 0.03, 0.0);
  sole.lineTo(0.24, 0.002);
  sole.quadraticCurveTo(0.3, 0.008, 0.305, 0.03);
  sole.lineTo(0.27, 0.04);
  sole.lineTo(0.02, 0.048);
  sole.closePath();
  // Upper.
  const up = new Shape();
  up.moveTo(0.012, 0.045);
  up.lineTo(0.27, 0.038);
  up.quadraticCurveTo(0.3, 0.045, 0.27, 0.07);
  up.quadraticCurveTo(0.19, 0.1, 0.13, 0.115);
  up.lineTo(0.06, 0.125);
  up.quadraticCurveTo(0.03, 0.14, 0.012, 0.12);
  up.closePath();
  const opts = (d: number, b: number) => ({ depth: d, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 3 });
  const soleG = new ExtrudeGeometry(sole, opts(0.08, 0.012));
  soleG.translate(0, 0, -0.04);
  const upG = new ExtrudeGeometry(up, opts(0.07, 0.02));
  upG.translate(0, 0, -0.035);
  return { sole: taper(soleG), upper: taper(upG) };
}

function Shoe({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  const g = useMemo(shoeGeometries, []);
  return (
    <group position={position} rotation-y={rotation}>
      <mesh geometry={g.sole} castShadow receiveShadow>
        <meshStandardMaterial color="#efe9df" roughness={0.75} />
      </mesh>
      <mesh geometry={g.upper} castShadow>
        <meshStandardMaterial color="#ff6a14" roughness={0.65} />
      </mesh>
      {/* Heel pull tab. */}
      <mesh position={[0.012, 0.12, 0]}>
        <boxGeometry args={[0.012, 0.03, 0.02]} />
        <meshStandardMaterial color="#1b1b1b" roughness={0.6} />
      </mesh>
    </group>
  );
}

export function RunningShoes() {
  return (
    <group position={[2.05, 0, -2.75]}>
      <Shoe position={[0, 0, 0]} rotation={2.3} />
      <Shoe position={[0.1, 0, -0.17]} rotation={2.05} />
    </group>
  );
}
