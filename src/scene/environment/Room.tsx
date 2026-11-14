import { useMemo } from 'react';
import { ExtrudeGeometry, Path, Shape } from 'three';
import { ROOM, WINDOW } from '../layout';
import { brickWall, cementWall, concreteFloor } from '../materials/proceduralTextures';
import { tiledPlane } from './geometry';

const W = ROOM.maxX - ROOM.minX;
const D = ROOM.maxZ - ROOM.minZ;
const H = ROOM.height;
const T = ROOM.wallThickness;

/** Back wall (brick) with the window opening; its reveal shows the wall's real thickness. */
function useBackWallGeometry() {
  return useMemo(() => {
    const s = new Shape();
    s.moveTo(ROOM.minX - T, 0);
    s.lineTo(ROOM.maxX + T, 0);
    s.lineTo(ROOM.maxX + T, H);
    s.lineTo(ROOM.minX - T, H);
    s.closePath();
    const hole = new Path();
    const x0 = WINDOW.centerX - WINDOW.width / 2;
    const x1 = WINDOW.centerX + WINDOW.width / 2;
    hole.moveTo(x0, WINDOW.sill);
    hole.lineTo(x0, WINDOW.sill + WINDOW.height);
    hole.lineTo(x1, WINDOW.sill + WINDOW.height);
    hole.lineTo(x1, WINDOW.sill);
    hole.closePath();
    s.holes.push(hole);
    // Shape coordinates are metres, so the brick texture (1 tile = 1 m) maps at true scale.
    return new ExtrudeGeometry(s, { depth: T, bevelEnabled: false });
  }, []);
}

function WindowFrame() {
  const x0 = WINDOW.centerX - WINDOW.width / 2;
  const y0 = WINDOW.sill;
  const z = ROOM.minZ - T * 0.45;
  const bar = 0.05;
  const bars: [number, number, number, number, number][] = []; // x, y, w, h, depth
  // Outer frame.
  bars.push([WINDOW.centerX, y0 + bar / 2, WINDOW.width, bar, 0.09]);
  bars.push([WINDOW.centerX, y0 + WINDOW.height - bar / 2, WINDOW.width, bar, 0.09]);
  bars.push([x0 + bar / 2, y0 + WINDOW.height / 2, bar, WINDOW.height, 0.09]);
  bars.push([x0 + WINDOW.width - bar / 2, y0 + WINDOW.height / 2, bar, WINDOW.height, 0.09]);
  // Mullions and transoms: a traditional divided-light steel window.
  for (let c = 1; c < WINDOW.cols; c++)
    bars.push([x0 + (WINDOW.width * c) / WINDOW.cols, y0 + WINDOW.height / 2, 0.028, WINDOW.height, 0.06]);
  for (let r = 1; r < WINDOW.rows; r++)
    bars.push([WINDOW.centerX, y0 + (WINDOW.height * r) / WINDOW.rows, WINDOW.width, 0.028, 0.06]);
  return (
    <group>
      {bars.map(([x, y, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#0d0e10" metalness={0.7} roughness={0.42} />
        </mesh>
      ))}
      {/* Interior sill. */}
      <mesh position={[WINDOW.centerX, y0 - 0.025, ROOM.minZ + 0.05]} receiveShadow castShadow>
        <boxGeometry args={[WINDOW.width + 0.14, 0.05, T + 0.12]} />
        <meshStandardMaterial color="#4d4a45" roughness={0.75} />
      </mesh>
    </group>
  );
}

function CeilingBeams() {
  return (
    <group>
      {[-2.6, 0.4, 3.2].map((z) => (
        <group key={z} position={[0, H - 0.14, z]}>
          {/* Steel I-beam: web + two flanges. */}
          <mesh>
            <boxGeometry args={[W, 0.24, 0.012]} />
            <meshStandardMaterial color="#1a1b1d" metalness={0.8} roughness={0.5} />
          </mesh>
          {[-0.12, 0.12].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <boxGeometry args={[W, 0.014, 0.14]} />
              <meshStandardMaterial color="#1a1b1d" metalness={0.8} roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function Room() {
  const floor = concreteFloor();
  const brick = brickWall();
  const cement = cementWall();
  const backWall = useBackWallGeometry();
  const floorGeo = useMemo(() => tiledPlane(W, D, 3), []);
  const sideGeo = useMemo(() => tiledPlane(D, H, 1), []);
  const cementSide = useMemo(() => tiledPlane(D, H, 2), []);
  const frontGeo = useMemo(() => tiledPlane(W, H, 2), []);
  const ceilGeo = useMemo(() => tiledPlane(W, D, 2), []);

  return (
    <group>
      <mesh geometry={floorGeo} rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial {...floor} normalScale={[0.4, 0.4]} metalness={0.05} envMapIntensity={0.6} />
      </mesh>

      <mesh geometry={backWall} position={[0, 0, ROOM.minZ - T]} receiveShadow>
        <meshStandardMaterial {...brick} normalScale={[1.1, 1.1]} />
      </mesh>

      {/* Left: brick (workshop side). */}
      <mesh geometry={sideGeo} position={[ROOM.minX, H / 2, 0]} rotation-y={Math.PI / 2} receiveShadow>
        <meshStandardMaterial {...brick} normalScale={[1.1, 1.1]} />
      </mesh>
      {/* Right: cement plaster behind the bookshelf. */}
      <mesh geometry={cementSide} position={[ROOM.maxX, H / 2, 0]} rotation-y={-Math.PI / 2} receiveShadow>
        <meshStandardMaterial {...cement} normalScale={[0.3, 0.3]} />
      </mesh>
      <mesh geometry={frontGeo} position={[0, H / 2, ROOM.maxZ]} rotation-y={Math.PI} receiveShadow>
        <meshStandardMaterial {...cement} normalScale={[0.3, 0.3]} />
      </mesh>
      <mesh geometry={ceilGeo} position={[0, H, 0]} rotation-x={Math.PI / 2}>
        <meshStandardMaterial {...cement} color="#6d6b67" />
      </mesh>

      <CeilingBeams />
      <WindowFrame />
    </group>
  );
}
