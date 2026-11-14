import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { type DirectionalLight, Object3D, type RectAreaLight } from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { useExperience } from '@/app/store';
import { BOOKSHELF, CAR, ROOM, WINDOW } from './layout';
import { storm } from './environment/storm';

RectAreaLightUniformsLib.init();

function useLookAt<T extends Object3D>(target: [number, number, number]) {
  const ref = useRef<T>(null);
  useEffect(() => ref.current?.lookAt(...target), [target]);
  return ref;
}

/**
 * Lighting plan (spec §2.3): cold storm light through the window, warm lamp + shelf light inside.
 * Only two lights cast shadows: the desk lamp (in DeskArea) and the storm light through the
 * window, which draws the window grid on the floor when lightning strikes.
 */
export function Lighting() {
  const full = useExperience((s) => s.capabilities.tier === 'full');
  const winY = WINDOW.sill + WINDOW.height / 2;
  const windowLight = useLookAt<RectAreaLight>([WINDOW.centerX, winY - 0.6, 0]);
  const shelfLight = useLookAt<RectAreaLight>([ROOM.maxX, 1.6, -2.3]);
  const stormLight = useRef<DirectionalLight>(null);
  const driverSideLight = useLookAt<RectAreaLight>([CAR.position.x, 0.6, CAR.position.z + 0.4]);
  const stormTarget = useMemo(() => {
    const o = new Object3D();
    o.position.set(WINDOW.centerX - 0.4, 0, -1.2);
    return o;
  }, []);

  useFrame(() => {
    const f = storm.flash;
    if (windowLight.current) windowLight.current.intensity = 2.2 + f * 30;
    if (stormLight.current) stormLight.current.intensity = 0.1 + f * 9;
  });

  const shelfZ = BOOKSHELF.zStart + (BOOKSHELF.bays * BOOKSHELF.bayWidth) / 2;

  return (
    <>
      <hemisphereLight args={['#3a4a66', '#2a2016', 0.6]} />

      {/* Indirect light: LED cove on top of the beams washing the concrete soffit — a soft, warm
          bounce that keeps the room readable without any visible fixture. */}
      <rectAreaLight position={[-0.3, ROOM.height - 0.25, 0]} rotation-x={-Math.PI / 2} width={9} height={7} intensity={0.7} color="#ffdcb4" />

      {/* Cold glow of the stormy sky filling the room from the window. */}
      <rectAreaLight
        ref={windowLight}
        position={[WINDOW.centerX, winY, ROOM.minZ + 0.02]}
        width={WINDOW.width}
        height={WINDOW.height}
        color="#7f9cc9"
      />
      {/* Moon/lightning key from outside: casts the window-grid shadow into the room. */}
      <primitive object={stormTarget} />
      <directionalLight
        ref={stormLight}
        position={[WINDOW.centerX + 1.5, 6.5, -14]}
        target={stormTarget}
        color="#a9bcff"
        castShadow={full}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-camera-near={4}
        shadow-camera-far={30}
      />

      {/* Warm integrated bookshelf lighting. */}
      <rectAreaLight
        ref={shelfLight}
        position={[ROOM.maxX - 1.1, 1.7, shelfZ]}
        width={BOOKSHELF.bays * BOOKSHELF.bayWidth}
        height={3.0}
        intensity={1.3}
        color="#ffc887"
      />


      {/* Wall-mounted work light on the room side of the car: picks out the driver door. */}
      <group position={[-1.3, 2.2, 0.3]}>
        <rectAreaLight ref={driverSideLight} width={1.6} height={0.5} intensity={3} color="#e8ecf2" />
      </group>

      {/* Reflections only (not visible): soft studio-like strips so car paint, glass and metal read. */}
      <Environment resolution={256} frames={1} environmentIntensity={0.7}>
        <Lightformer form="rect" intensity={2.2} color="#e4ebf7" position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[1, 6, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#7f9cc9" position={[0, 2, -6]} scale={[6, 2.5, 1]} />
        <Lightformer form="circle" intensity={3} color="#ffb067" position={[1.5, 2, 2]} scale={1.2} />
        <Lightformer form="rect" intensity={0.6} color="#ffc887" position={[6, 2, 0]} rotation-y={-Math.PI / 2} scale={[4, 3, 1]} />
      </Environment>
    </>
  );
}
