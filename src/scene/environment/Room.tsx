import { useMemo } from 'react';
import { ExtrudeGeometry, Path, Shape } from 'three';
import { GARAGE_DOOR, ROOM, TIMBER, WINDOW } from '../layout';
import { ceilingPlanks, concreteFloor, concretePanels, glulam, woodCladding } from '../materials/proceduralTextures';
import { tiledPlane } from './geometry';
import { GarageDoors } from './GarageDoors';

/**
 * PROVISIONAL architecture — a modern American detached garage converted into a studio:
 * natural-oak cladding, an oak plank ceiling on exposed glulam beams and joists, black steel
 * brackets, carriage doors, polished concrete floor with a slim concrete plinth.
 * Final version: modelled in Blender with baked lighting; module boundaries stay the same.
 */

const W = ROOM.maxX - ROOM.minX;
const D = ROOM.maxZ - ROOM.minZ;
const H = ROOM.height;
const T = ROOM.wallThickness;
const PLINTH = 0.22;
const STEEL = { color: '#141516', metalness: 0.75, roughness: 0.42 } as const;

function rectHole(x0: number, y0: number, x1: number, y1: number) {
  const p = new Path();
  p.moveTo(x0, y0);
  p.lineTo(x0, y1);
  p.lineTo(x1, y1);
  p.lineTo(x1, y0);
  p.closePath();
  return p;
}

/** Window wall with the window and garage-door openings; reveals show the wall thickness. */
function useBackWallGeometry() {
  return useMemo(() => {
    // Outline with a notch for the garage doors, so the opening reaches the floor.
    const d0 = GARAGE_DOOR.centerX - GARAGE_DOOR.width / 2;
    const d1 = GARAGE_DOOR.centerX + GARAGE_DOOR.width / 2;
    const s = new Shape();
    s.moveTo(ROOM.minX - T, 0);
    s.lineTo(d0, 0);
    s.lineTo(d0, GARAGE_DOOR.height);
    s.lineTo(d1, GARAGE_DOOR.height);
    s.lineTo(d1, 0);
    s.lineTo(ROOM.maxX + T, 0);
    s.lineTo(ROOM.maxX + T, H);
    s.lineTo(ROOM.minX - T, H);
    s.closePath();
    s.holes.push(rectHole(WINDOW.centerX - WINDOW.width / 2, WINDOW.sill, WINDOW.centerX + WINDOW.width / 2, WINDOW.sill + WINDOW.height));
    const g = new ExtrudeGeometry(s, { depth: T, bevelEnabled: false });
    // Shape coordinates are metres; one cladding tile = 2.4 m.
    const uv = g.attributes.uv!;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.4, uv.getY(i) / 2.4);
    return g;
  }, []);
}

function WindowFrame() {
  const x0 = WINDOW.centerX - WINDOW.width / 2;
  const y0 = WINDOW.sill;
  const z = ROOM.minZ - T * 0.45;
  const bar = 0.05;
  const bars: [number, number, number, number, number][] = [];
  bars.push([WINDOW.centerX, y0 + bar / 2, WINDOW.width, bar, 0.09]);
  bars.push([WINDOW.centerX, y0 + WINDOW.height - bar / 2, WINDOW.width, bar, 0.09]);
  bars.push([x0 + bar / 2, y0 + WINDOW.height / 2, bar, WINDOW.height, 0.09]);
  bars.push([x0 + WINDOW.width - bar / 2, y0 + WINDOW.height / 2, bar, WINDOW.height, 0.09]);
  for (let c = 1; c < WINDOW.cols; c++) bars.push([x0 + (WINDOW.width * c) / WINDOW.cols, y0 + WINDOW.height / 2, 0.028, WINDOW.height, 0.06]);
  for (let r = 1; r < WINDOW.rows; r++) bars.push([WINDOW.centerX, y0 + (WINDOW.height * r) / WINDOW.rows, WINDOW.width, 0.028, 0.06]);
  return (
    <group>
      {bars.map(([x, y, w, h, d], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial {...STEEL} />
        </mesh>
      ))}
      {/* Oak sill. */}
      {/* Flush with the cladding (the Studio Display stands just in front of it). */}
      <mesh position={[WINDOW.centerX, y0 - 0.02, ROOM.minZ - T / 2 + 0.015]} receiveShadow castShadow>
        <boxGeometry args={[WINDOW.width + 0.14, 0.04, T + 0.03]} />
        <meshStandardMaterial color="#8a6a49" roughness={0.55} />
      </mesh>
    </group>
  );
}

/**
 * Heavy timber beams running front-to-back under the plank ceiling, each landing on a black
 * steel hanger at the window wall (as in the reference), plus timber corner posts.
 */
function TimberStructure() {
  const lam = glulam();
  const beamY = H - TIMBER.beamH / 2;
  return (
    <group>
      {TIMBER.beamX.map((x) => (
        <group key={x}>
          <mesh position={[x, beamY, (ROOM.minZ + ROOM.maxZ) / 2]} castShadow receiveShadow>
            <boxGeometry args={[TIMBER.beamW, TIMBER.beamH, D]} />
            <meshStandardMaterial {...lam} normalScale={[0.5, 0.5]} />
          </mesh>
          {/* Black steel hanger: side plates + bottom strap where the beam meets the wall. */}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[x + side * (TIMBER.beamW / 2 + 0.004), beamY - 0.02, ROOM.minZ + 0.13]} castShadow>
              <boxGeometry args={[0.008, TIMBER.beamH + 0.08, 0.26]} />
              <meshStandardMaterial {...STEEL} />
            </mesh>
          ))}
          <mesh position={[x, beamY - TIMBER.beamH / 2 - 0.02, ROOM.minZ + 0.13]} castShadow>
            <boxGeometry args={[TIMBER.beamW + 0.02, 0.008, 0.26]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          <mesh position={[x, beamY - TIMBER.beamH / 2 - 0.12, ROOM.minZ + 0.012]}>
            <boxGeometry args={[TIMBER.beamW + 0.08, 0.2, 0.012]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={`b${side}`} position={[x + side * (TIMBER.beamW / 2 + 0.01), beamY, ROOM.minZ + 0.2]} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.014, 0.014, 0.01, 12]} />
              <meshStandardMaterial {...STEEL} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Timber corner posts. */}
      {[
        [ROOM.minX + 0.09, ROOM.minZ + 0.09],
        [ROOM.maxX - 0.09, ROOM.minZ + 0.09],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x!, H / 2, z!]} castShadow>
          <boxGeometry args={[0.18, H, 0.18]} />
          <meshStandardMaterial {...lam} normalScale={[0.3, 0.3]} />
        </mesh>
      ))}
    </group>
  );
}

/** Timber casing and header around the window: the window and desk read as one framed focal point. */
function WindowCasing() {
  const lam = glulam();
  const x0 = WINDOW.centerX - WINDOW.width / 2;
  const x1 = WINDOW.centerX + WINDOW.width / 2;
  const y0 = WINDOW.sill;
  const y1 = WINDOW.sill + WINDOW.height;
  const z = ROOM.minZ + 0.03;
  const t = 0.11;
  return (
    <group>
      {/* Header beam. */}
      <mesh position={[WINDOW.centerX, y1 + 0.09, z + 0.01]} castShadow>
        <boxGeometry args={[WINDOW.width + 0.5, 0.18, 0.08]} />
        <meshStandardMaterial {...lam} normalScale={[0.4, 0.4]} />
      </mesh>
      {[x0 - t / 2, x1 + t / 2].map((x) => (
        <mesh key={x} position={[x, (y0 + y1) / 2, z]} castShadow>
          <boxGeometry args={[t, WINDOW.height + 0.02, 0.05]} />
          <meshStandardMaterial {...lam} normalScale={[0.4, 0.4]} />
        </mesh>
      ))}
    </group>
  );
}

/** Slim board-formed concrete plinth around the walls: the modern base the timber sits on. */
function Plinth() {
  const conc = concretePanels();
  const d0 = GARAGE_DOOR.centerX - GARAGE_DOOR.width / 2 - 0.12;
  const d1 = GARAGE_DOOR.centerX + GARAGE_DOOR.width / 2 + 0.12;
  const runs: [number, number, number, number][] = [
    // x, z, length, rotationY — the window-wall run is split around the garage doors.
    [(ROOM.minX + d0) / 2, ROOM.minZ + 0.02, d0 - ROOM.minX, 0],
    [(d1 + ROOM.maxX) / 2, ROOM.minZ + 0.02, ROOM.maxX - d1, 0],
    [ROOM.minX + 0.02, (ROOM.minZ + ROOM.maxZ) / 2, D, Math.PI / 2],
    [ROOM.maxX - 0.02, (ROOM.minZ + ROOM.maxZ) / 2, D, -Math.PI / 2],
  ];
  return (
    <group>
      {runs.map(([x, z, len, ry], i) => (
        <mesh key={i} position={[x, PLINTH / 2, z]} rotation-y={ry} receiveShadow>
          <boxGeometry args={[len, PLINTH, 0.04]} />
          <meshStandardMaterial {...conc} color="#b9b6b0" />
        </mesh>
      ))}
    </group>
  );
}

export function Room() {
  const floor = concreteFloor();
  const cladding = woodCladding();
  const planks = ceilingPlanks();
  const backWall = useBackWallGeometry();
  const floorGeo = useMemo(() => tiledPlane(W, D, 3), []);
  const sideGeo = useMemo(() => tiledPlane(D, H - PLINTH, 2.4), []);
  const frontGeo = useMemo(() => tiledPlane(W, H, 2.4), []);
  const ceilGeo = useMemo(() => tiledPlane(W, D, 2.4), []);

  return (
    <group>
      <mesh geometry={floorGeo} rotation-x={-Math.PI / 2} receiveShadow>
        <meshStandardMaterial {...floor} normalScale={[0.35, 0.35]} metalness={0.05} envMapIntensity={1.1} />
      </mesh>

      <mesh geometry={backWall} position={[0, 0, ROOM.minZ - T]} receiveShadow>
        <meshStandardMaterial {...cladding} normalScale={[0.8, 0.8]} />
      </mesh>
      <mesh geometry={sideGeo} position={[ROOM.minX, PLINTH + (H - PLINTH) / 2, (ROOM.minZ + ROOM.maxZ) / 2]} rotation-y={Math.PI / 2} receiveShadow>
        <meshStandardMaterial {...cladding} normalScale={[0.8, 0.8]} />
      </mesh>
      <mesh geometry={sideGeo} position={[ROOM.maxX, PLINTH + (H - PLINTH) / 2, (ROOM.minZ + ROOM.maxZ) / 2]} rotation-y={-Math.PI / 2} receiveShadow>
        <meshStandardMaterial {...cladding} normalScale={[0.8, 0.8]} color="#e8dccb" />
      </mesh>
      <mesh geometry={frontGeo} position={[(ROOM.minX + ROOM.maxX) / 2, H / 2, ROOM.maxZ]} rotation-y={Math.PI} receiveShadow>
        <meshStandardMaterial {...cladding} normalScale={[0.8, 0.8]} />
      </mesh>
      <mesh geometry={ceilGeo} position={[(ROOM.minX + ROOM.maxX) / 2, H, (ROOM.minZ + ROOM.maxZ) / 2]} rotation-x={Math.PI / 2}>
        <meshStandardMaterial {...planks} normalScale={[0.5, 0.5]} />
      </mesh>

      <Plinth />
      <TimberStructure />
      <WindowCasing />
      <WindowFrame />
      <GarageDoors />
    </group>
  );
}

