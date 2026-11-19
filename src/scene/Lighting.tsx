import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, type DirectionalLight, Object3D, type RectAreaLight } from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { useExperience } from '@/app/store';
import { CAR, ROOM, WINDOW } from './layout';
import { storm } from './environment/storm';
import { ENV_INTENSITY } from './renderConfig';

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
const WINDOW_COLOR = new Color('#6f8fc4');
const FLASH_COLOR = new Color('#c9d7ff');

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

  const scene = useThree((s) => s.scene);
  useFrame(() => {
    const f = storm.flash;
    // Lightning is light from OUTSIDE: most of it arrives as the shadowed storm light, so it falls
    // through the window (and the door glass) as a brief, window-shaped patch — the back wall blocks the
    // rest. The window's soft glow and the room reflections only lift a little, so the far side of the
    // garage never flashes as a whole. The flash is whiter than the steady storm glow.
    if (scene.userData.roomEnvironment) scene.environmentIntensity = ENV_INTENSITY * (1 + f * 0.1);
    if (windowLight.current) {
      windowLight.current.intensity = 2.4 + f * 3;
      windowLight.current.color.lerpColors(WINDOW_COLOR, FLASH_COLOR, Math.min(1, f * 1.5));
    }
    if (stormLight.current) stormLight.current.intensity = 0.12 + f * 9;
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
        // 2048 px over the 10 m frustum (~5 mm per texel) keeps the window-grid shadow crisp; the map is
        // static, so the higher resolution costs memory, not per-frame rendering.
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
        shadow-radius={1.5}
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

      {/* Reflections: environment/roomEnvironment.ts (seeded by light cards, then a one-off capture of the room). */}
    </>
  );
}
