import {
  AdditiveBlending,
  Color,
  CubeCamera,
  DoubleSide,
  HalfFloatType,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  type Scene,
  type Texture,
  Vector3,
  WebGLCubeRenderTarget,
  type WebGLRenderer,
} from 'three';
import { ROOM, WINDOW } from '../layout';
import { ENV_INTENSITY, ENV_WINDOW_GLOW } from '../renderConfig';

/**
 * Reflections of the actual garage.
 *
 * The garage is rendered ONCE into an HDR cube map from an open point in the middle of the room,
 * then pre-filtered (PMREM) into scene.environment. Metals, car paint, glass, screens and the
 * polished floor then reflect the real room — timber, window, desk lamp, screens — instead of three
 * abstract light cards. It is never re-rendered continuously (no second scene per frame) and it
 * cannot feed back into itself: the capture is lit by the previous (light-card) environment once.
 *
 * During the capture a cool, additive card fills the window: the window's rect-area light has no
 * visible surface, so without it reflections would show a near-black night sky where the room's
 * main cool light comes from. The card has the same radiance as that light (colour × intensity).
 *
 * Lightning is handled by modulating environmentIntensity (Lighting.tsx), not by re-capturing.
 */
const CAPTURE_POINT = new Vector3(0.3, 1.45, 0.6);
const WINDOW_LIGHT = { color: '#6f8fc4', intensity: 2.4 };

export interface RoomEnvironmentResult {
  texture: Texture;
  ms: number;
}

export function captureRoomEnvironment(gl: WebGLRenderer, scene: Scene, resolution: number): RoomEnvironmentResult {
  const t0 = performance.now();
  const glow = new Mesh(
    new PlaneGeometry(WINDOW.width, WINDOW.height),
    new MeshBasicMaterial({
      color: new Color(WINDOW_LIGHT.color).multiplyScalar(WINDOW_LIGHT.intensity * ENV_WINDOW_GLOW),
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      toneMapped: false,
    }),
  );
  glow.position.set(WINDOW.centerX, WINDOW.sill + WINDOW.height / 2, ROOM.minZ - ROOM.wallThickness * 0.45 + 0.01);
  scene.add(glow);

  const target = new WebGLCubeRenderTarget(resolution, { type: HalfFloatType });
  // Far enough to include the storm sky and sea seen through the window.
  const camera = new CubeCamera(0.05, 400, target);
  camera.position.copy(CAPTURE_POINT);
  gl.shadowMap.needsUpdate = true;
  camera.update(gl, scene);

  scene.remove(glow);
  glow.geometry.dispose();
  (glow.material as MeshBasicMaterial).dispose();

  const pmrem = new PMREMGenerator(gl);
  const env = pmrem.fromCubemap(target.texture);
  pmrem.dispose();
  target.dispose();

  scene.environment = env.texture;
  scene.environmentIntensity = ENV_INTENSITY;
  return { texture: env.texture, ms: performance.now() - t0 };
}
