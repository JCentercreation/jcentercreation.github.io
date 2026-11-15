import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, CatmullRomCurve3, type Texture, DoubleSide, type Group, LatheGeometry, MeshPhysicalMaterial, Vector2, Vector3 } from 'three';
import gsap from 'gsap';
import { holdDoorOpen, useExperience } from '@/app/store';
import { CAR } from '../layout';
import { Interactive, useIsHovered } from '../Interactive';
import { LaptopModel } from '../desk/LaptopModel';
import { useScreenTexture } from '../screens/screenTextures';
import { CAR_LAPTOP, CarLaptopScreen } from './CarLaptopScreen';
import { Rod } from '../primitives';
import { AXLE_X, BODY_HALF, TRACK_HALF, WHEEL_RADIUS, WHEEL_Y, buildCarGeometry } from './carGeometry';

/** Midnight-silver style dark metallic grey, clear-coated. */
function usePaint() {
  return useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: '#53575d',
        metalness: 0.6,
        roughness: 0.36,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
      }),
    [],
  );
}

function Wheel({ position, mirrored }: { position: [number, number, number]; mirrored: boolean }) {
  const tyre = useMemo(() => {
    // Half cross-section of a 235/45 R18 tyre, lathed around Y then turned onto the axle.
    const w = 0.118;
    const pts = [
      new Vector2(0.23, -w),
      new Vector2(0.3, -w - 0.004),
      new Vector2(0.325, -w + 0.02),
      new Vector2(WHEEL_RADIUS, -w + 0.05),
      new Vector2(WHEEL_RADIUS, w - 0.05),
      new Vector2(0.325, w - 0.02),
      new Vector2(0.3, w + 0.004),
      new Vector2(0.23, w),
    ];
    const g = new LatheGeometry(pts, 48);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  const side = mirrored ? -1 : 1;
  return (
    <group position={position}>
      <mesh geometry={tyre} castShadow>
        <meshStandardMaterial color="#111112" roughness={0.88} side={DoubleSide} />
      </mesh>
      {/* Aero cover on a dark rim. */}
      <mesh position-z={side * 0.1} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.232, 0.232, 0.02, 40]} />
        <meshStandardMaterial color="#7a7e84" metalness={0.8} roughness={0.32} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position-z={side * 0.112} rotation-z={(i / 5) * Math.PI * 2}>
          <boxGeometry args={[0.03, 0.34, 0.006]} />
          <meshStandardMaterial color="#17181a" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <mesh position-z={side * 0.116} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.045, 0.045, 0.012, 24]} />
        <meshStandardMaterial color="#bfc1c4" metalness={0.9} roughness={0.25} />
      </mesh>
    </group>
  );
}

// Review tooling only (`?capture=1`): the laptop's on-screen position, stamped with the frame it was
// computed in (tools wait for a frame after the camera arrives — see the bookshelf equivalent).
const capture = new URLSearchParams(window.location.search).has('capture');
const debugLaptop = { x: 0, y: 0, frame: -1 };
if (capture) (window as unknown as { __carLaptop: typeof debugLaptop }).__carLaptop = debugLaptop;

function CarLaptop({ screen }: { screen: Texture }) {
  const shot = useExperience((s) => s.shot);
  const hovered = useIsHovered('carLaptop');
  const ref = useRef<Group>(null);
  const world = useMemo(() => new Vector3(), []);
  useFrame((state) => {
    if (!capture || !ref.current) return;
    state.camera.updateMatrixWorld();
    ref.current.getWorldPosition(world).project(state.camera);
    debugLaptop.x = ((world.x + 1) / 2) * state.size.width;
    debugLaptop.y = ((1 - world.y) / 2) * state.size.height;
    debugLaptop.frame = state.clock.elapsedTime;
  });
  return (
    <Interactive id="carLaptop" enabled={shot === 'teslaInterior'} onSelect={() => useExperience.getState().goTo('teslaLaptop')}>
      <group ref={ref} position={CAR.laptop} rotation-y={Math.PI}>
        <LaptopModel
          width={CAR_LAPTOP.width}
          depth={CAR_LAPTOP.depth}
          thickness={0.02}
          lidAngle={0.35}
          bodyColor="#202124"
          screen={screen}
          // Restrained brightness for the dark cabin; a touch brighter on hover.
          glow={hovered ? 0.95 : 0.78}
          display={[...CAR_LAPTOP.display]}
        >
          <CarLaptopScreen />
        </LaptopModel>
      </group>
    </Interactive>
  );
}

function Interior() {
  const laptopScreen = useScreenTexture('windows');
  // Diagnostic cable: laptop side port → over the seat edge → OBD port under the steering column.
  const cable = useMemo(() => {
    const L = CAR.laptop;
    return new CatmullRomCurve3([
      new Vector3(L.x + 0.17, L.y + 0.008, L.z + 0.05),
      new Vector3(L.x + 0.26, L.y - 0.01, L.z - 0.02),
      new Vector3(0.48, 0.4, -0.52),
      new Vector3(0.66, 0.36, -0.46),
      new Vector3(0.74, 0.47, -0.38),
    ]);
  }, []);
  const seat = (z: number, x = 0.12) => (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[0.5, 0.11, 0.5]} />
        <meshStandardMaterial color="#141414" roughness={0.75} />
      </mesh>
      <mesh position={[-0.27, 0.78, 0]} rotation-z={-0.22}>
        <boxGeometry args={[0.11, 0.62, 0.5]} />
        <meshStandardMaterial color="#141414" roughness={0.75} />
      </mesh>
      <mesh position={[-0.36, 1.13, 0]} rotation-z={-0.22}>
        <boxGeometry args={[0.09, 0.16, 0.26]} />
        <meshStandardMaterial color="#141414" roughness={0.75} />
      </mesh>
    </group>
  );
  return (
    <group>
      {/* Floor, dashboard, centre console, rear bench. */}
      <mesh position={[0.05, 0.31, 0]}>
        <boxGeometry args={[2.3, 0.04, 1.6]} />
        <meshStandardMaterial color="#0c0c0c" roughness={0.95} />
      </mesh>
      <mesh position={[0.88, 0.78, 0]}>
        <boxGeometry args={[0.32, 0.22, 1.56]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
      </mesh>
      <mesh position={[0.73, 0.86, 0]}>
        <boxGeometry args={[0.03, 0.035, 1.5]} />
        <meshStandardMaterial color="#d9d4c7" roughness={0.5} />
      </mesh>
      <mesh position={[0.25, 0.45, 0]}>
        <boxGeometry args={[0.8, 0.24, 0.2]} />
        <meshStandardMaterial color="#111" roughness={0.5} />
      </mesh>
      {seat(-0.36)}
      {seat(0.36)}
      <mesh position={[-0.95, 0.47, 0]}>
        <boxGeometry args={[0.5, 0.12, 1.4]} />
        <meshStandardMaterial color="#141414" roughness={0.75} />
      </mesh>
      {/* 15" centre touchscreen, landscape. */}
      <mesh position={[0.78, 1.0, 0]} rotation={[0, -Math.PI / 2, 0.15]}>
        <planeGeometry args={[0.37, 0.23]} />
        <meshStandardMaterial color="#000" emissive="#1d2633" emissiveIntensity={0.8} />
      </mesh>
      {/* Steering wheel (left-hand drive). */}
      <group position={[0.6, 0.86, -0.36]} rotation={[0, Math.PI / 2, 0]}>
        <group rotation-x={-0.35}>
          <mesh>
            <torusGeometry args={[0.18, 0.017, 10, 40]} />
            <meshStandardMaterial color="#121212" roughness={0.6} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 0.04, 20]} />
            <meshStandardMaterial color="#121212" roughness={0.6} />
          </mesh>
        </group>
      </group>
      <Rod from={[0.66, 0.82, -0.36]} to={[0.82, 0.7, -0.36]} radius={0.03} color="#151515" metalness={0.2} roughness={0.7} />
      {/* OBD-II port + connector under the steering column — exact position to confirm per model year. */}
      <mesh position={[0.75, 0.48, -0.38]}>
        <boxGeometry args={[0.04, 0.03, 0.05]} />
        <meshStandardMaterial color="#222" roughness={0.5} />
      </mesh>
      <mesh>
        <tubeGeometry args={[cable, 48, 0.004, 6, false]} />
        <meshStandardMaterial color="#1d4fa3" roughness={0.5} />
      </mesh>
      {/* Diagnostic laptop, open on the driver seat, screen facing out of the door. */}
      {/* Laptop on the driver seat: selectable from the car-interior view; hosts the portfolio. */}
      <CarLaptop screen={laptopScreen} />
    </group>
  );
}

export function Tesla() {
  const geo = useMemo(() => buildCarGeometry(), []);
  const paint = usePaint();
  const doorPaint = useMemo(() => paint.clone(), [paint]);
  const doorRef = useRef<Group>(null);
  const doorHovered = useIsHovered('teslaDoor');
  const doorOpen = useExperience((s) => s.teslaDoorOpen);
  const shot = useExperience((s) => s.shot);
  const reduced = useExperience((s) => s.reducedMotion);

  // Subtle highlight on hover.
  useEffect(() => {
    doorPaint.emissive.set(doorHovered ? '#3b5d8f' : '#000000');
    doorPaint.emissiveIntensity = doorHovered ? 0.35 : 0;
  }, [doorHovered, doorPaint]);

  // Hinge animation.
  useEffect(() => {
    const d = doorRef.current;
    if (!d) return;
    const tween = gsap.to(d.rotation, { y: doorOpen ? -1.08 : 0, duration: reduced ? 0.2 : 1.25, ease: doorOpen ? 'power2.out' : 'power2.inOut' });
    return () => {
      tween.kill();
    };
  }, [doorOpen, reduced]);

  // Close the door once the visitor has left the car.
  useEffect(() => {
    // The door stays open while inside (interior or laptop) and closes once the visitor leaves the car.
    if (doorOpen && shot !== 'teslaInterior' && shot !== 'teslaLaptop' && !holdDoorOpen) {
      const t = window.setTimeout(() => useExperience.getState().closeTeslaDoor(), 700);
      return () => window.clearTimeout(t);
    }
  }, [doorOpen, shot]);

  const glass = useMemo(
    () => new MeshPhysicalMaterial({ color: '#07090c', metalness: 0.2, roughness: 0.04, transparent: true, opacity: 0.82, clearcoat: 1 }),
    [],
  );

  return (
    <group position={CAR.position} rotation-y={CAR.rotationY}>
      <Interactive id="tesla" enabled={shot === 'overview'} onSelect={() => useExperience.getState().goTo('tesla')}>
        {geo.bodyParts.map((g, i) => (
          <mesh key={i} geometry={g} material={paint} castShadow receiveShadow />
        ))}
        <mesh geometry={geo.greenhouse} material={glass} />
        {/* Light signatures (parked: lights off, tail lamps barely lit). */}
        {[-1, 1].map((s) => (
          <group key={s}>
            {/* 2024+ ("Highland") style: very slim headlamps set low in the nose. */}
            <mesh position={[2.25, 0.6, s * 0.6]} rotation={[0, s * 0.45, -0.12]}>
              <boxGeometry args={[0.02, 0.018, 0.34]} />
              <meshStandardMaterial color="#0a0a0a" emissive="#e3ecff" emissiveIntensity={3.2} toneMapped={false} metalness={0.4} roughness={0.1} />
            </mesh>
            <mesh position={[-2.31, 0.88, s * 0.5]} rotation={[0, -s * 0.5, 0]}>
              <boxGeometry args={[0.03, 0.03, 0.4]} />
              <meshStandardMaterial color="#3a0606" emissive="#ff1a1a" emissiveIntensity={0.6} roughness={0.15} />
            </mesh>
            <mesh position={[0.98, 0.99, s * 0.97]}>
              <boxGeometry args={[0.13, 0.07, 0.12]} />
              <meshStandardMaterial color="#121212" roughness={0.3} />
            </mesh>
          </group>
        ))}
        {[-AXLE_X, AXLE_X].map((x) =>
          [-1, 1].map((s) => <Wheel key={`${x}${s}`} position={[x, WHEEL_Y, s * TRACK_HALF]} mirrored={s < 0} />),
        )}
        <Interior />
      </Interactive>

      <Interactive id="teslaDoor" enabled={!doorOpen} onSelect={() => useExperience.getState().openTeslaDoor()}>
        <group ref={doorRef} position={geo.doorPivot}>
          <mesh geometry={geo.door} material={doorPaint} castShadow />
          {/* Flush door handle. */}
          <mesh position={[-0.95, 0.88, -0.015]}>
            <boxGeometry args={[0.2, 0.025, 0.01]} />
            <meshStandardMaterial color="#141414" roughness={0.3} />
          </mesh>
          {/* Inner door panel. */}
          <mesh position={[-(CAR.doorFront - CAR.doorRear) / 2, 0.66, BODY_HALF * 0.06]}>
            <boxGeometry args={[CAR.doorFront - CAR.doorRear - 0.06, 0.55, 0.02]} />
            <meshStandardMaterial color="#151515" roughness={0.7} />
          </mesh>
        </group>
      </Interactive>

      {/* Soft contact shadow under the car. */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.004}>
        <planeGeometry args={[5.4, 2.5]} />
        <meshBasicMaterial color="#000" transparent opacity={0.55} alphaMap={contactShadowTexture()} depthWrite={false} />
      </mesh>
    </group>
  );
}

let shadowTex: CanvasTexture | null = null;
function contactShadowTexture() {
  if (shadowTex) return shadowTex;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, 256, 128);
  g.filter = 'blur(14px)';
  g.fillStyle = '#fff';
  g.beginPath();
  g.roundRect(34, 30, 188, 68, 30);
  g.fill();
  shadowTex = new CanvasTexture(c);
  return shadowTex;
}
