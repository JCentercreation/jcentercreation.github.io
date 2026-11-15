import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { type DirectionalLight, Object3D, type RectAreaLight } from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { useExperience } from '@/app/store';
import { CAR, ROOM, WINDOW } from './layout';
import { storm } from './environment/storm';

RectAreaLightUniformsLib.init();

/**
 * Dark, cinematic lighting (reference render):
 * - Key: the desk lamp (warm, shadow-casting) — lives in DeskArea.
 * - Cool fill: storm light through the large window, plus lightning.
 * - Very low ambient so the car, bookshelf and timber stay readable but mostly in shadow.
 * - Reflections from a dim environment: a cool window strip and a faint warm lamp glow,
 *   enough for the car paint and polished concrete to pick up highlights.
 * No ceiling lights, no shelf LEDs, no bounce cards.
 */
export function Lighting() {
  const full = useExperience((s) => s.capabilities.tier === 'full');
  const winY = WINDOW.sill + WINDOW.height / 2;
  const windowLight = useRef<RectAreaLight>(null);
  const stormLight = useRef<DirectionalLight>(null);
  const stormTarget = useMemo(() => {
    const o = new Object3D();
    o.position.set(WINDOW.centerX, 0, 0.5);
    return o;
  }, []);

  const carRimTarget = useMemo(() => {
    const o = new Object3D();
    o.position.set(CAR.position.x, 0.6, CAR.position.z + 0.6);
    return o;
  }, []);

  useEffect(() => windowLight.current?.lookAt(WINDOW.centerX, winY - 0.5, 2), [winY]);

  useFrame(() => {
    const f = storm.flash;
    if (windowLight.current) windowLight.current.intensity = 2.4 + f * 34;
    if (stormLight.current) stormLight.current.intensity = 0.12 + f * 8;
  });

  return (
    <>
      {/* Barely-there ambient: cool from above, warm bounce from the floor. */}
      <hemisphereLight args={['#2a3650', '#2a1c10', 0.32]} />

      {/* Cold glow of the stormy sky through the window. */}
      <rectAreaLight
        ref={windowLight}
        position={[WINDOW.centerX, winY, ROOM.minZ + 0.03]}
        width={WINDOW.width}
        height={WINDOW.height}
        color="#6f8fc4"
      />
      {/* Moon/lightning key from outside: casts the window-grid shadow into the room. */}
      <primitive object={stormTarget} />
      <directionalLight
        ref={stormLight}
        position={[WINDOW.centerX + 1.2, 6, -12]}
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
        shadow-camera-far={26}
      />

      {/* Faint cool rim on the car from the window side so its silhouette reads in the dark. */}
      <primitive object={carRimTarget} />
      <spotLight
        position={[CAR.position.x + 1.6, 2.6, ROOM.minZ + 0.4]}
        target={carRimTarget}
        angle={0.7}
        penumbra={1}
        intensity={3}
        decay={2}
        color="#7f9ccc"
      />

      {/* Reflections only: dim strips so paint, glass and concrete catch highlights. */}
      <Environment resolution={256} frames={1} environmentIntensity={0.34}>
        <Lightformer form="rect" intensity={2.2} color="#7f9cc9" position={[0, 2, -6]} scale={[6, 2, 1]} />
        <Lightformer form="circle" intensity={2.4} color="#ffb067" position={[0.5, 1.6, -3]} scale={0.8} />
        <Lightformer form="rect" intensity={0.5} color="#e9d8c2" position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[4, 2, 1]} />
      </Environment>
    </>
  );
}
