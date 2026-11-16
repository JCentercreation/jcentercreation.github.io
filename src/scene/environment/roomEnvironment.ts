import {
  AdditiveBlending,
  CircleGeometry,
  Color,
  CubeCamera,
  DoubleSide,
  HalfFloatType,
  type Material,
  Mesh,
  MeshBasicMaterial,
  type MeshStandardMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
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
 * 1. seedEnvironment(): before the scene is shown, a small virtual scene of three emissive cards (a
 *    cool window strip, a warm lamp glow and a soft ceiling panel — the previous light-card setup) is
 *    pre-filtered into scene.environment. It lights the first capture and keeps the shader variants
 *    identical to the final environment (same cube size), so swapping maps never recompiles shaders.
 * 2. captureRoomEnvironment(): the garage is rendered ONCE into an HDR cube map from an open point in
 *    the room, pre-filtered (PMREM) and swapped into scene.environment. Metal, paint, glass, screens
 *    and the polished floor then reflect the real room. It is never re-rendered continuously (no second
 *    scene per frame) and cannot feed back into itself (one capture, lit by the seed).
 *
 * The explicit lights (window rect-area light, lamp spot, fills) are not added to the capture: they
 * already light and highlight every material directly, so the environment carries only what they
 * cannot — lit timber, the lamp bulb, screens, the storm sky through the glass. An optional window card
 * (ENV_WINDOW_GLOW, ?envglow=) exists for comparisons only.
 *
 * Lightning modulates scene.environmentIntensity (Lighting.tsx) instead of re-capturing.
 *
 * Note (three r163+): material.envMapIntensity only applies to materials with their own envMap; the
 * rest use scene.environmentIntensity. Materials that need a specific reflection strength set
 * `userData.envMapIntensity`, and receive the captured map explicitly.
 */
const CAPTURE_POINT = new Vector3(0.3, 1.45, 0.6);
const WINDOW_LIGHT = { color: '#6f8fc4', intensity: 2.4 };
/** Seed environment strength (the previous light-card environment's intensity). */
const SEED_INTENSITY = 0.34;

function prefilter(gl: WebGLRenderer, render: (camera: CubeCamera) => void, resolution: number): Texture {
  const target = new WebGLCubeRenderTarget(resolution, { type: HalfFloatType });
  const camera = new CubeCamera(0.05, 400, target);
  render(camera);
  const pmrem = new PMREMGenerator(gl);
  const env = pmrem.fromCubemap(target.texture).texture;
  pmrem.dispose();
  target.dispose();
  return env;
}

function card(color: string, intensity: number, geometry: PlaneGeometry | CircleGeometry, position: [number, number, number], scale: [number, number, number]) {
  const m = new Mesh(geometry, new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), side: DoubleSide, toneMapped: false }));
  m.position.set(...position);
  m.scale.set(...scale);
  m.lookAt(0, 0, 0);
  return m;
}

/** The previous three-card lighting, as a seed environment (see 1. above). */
export function seedEnvironment(gl: WebGLRenderer, scene: Scene, resolution: number) {
  const virtual = new Scene();
  virtual.background = new Color('#000000');
  const plane = new PlaneGeometry(1, 1);
  const circle = new CircleGeometry(0.5, 48);
  virtual.add(card('#7f9cc9', 2.2, plane, [0, 2, -6], [6, 2, 1]));
  virtual.add(card('#ffb067', 2.4, circle, [0.5, 1.6, -3], [0.8, 0.8, 0.8]));
  virtual.add(card('#e9d8c2', 0.5, plane, [0, 5, 0], [4, 2, 1]));
  const env = prefilter(gl, (camera) => camera.update(gl, virtual), resolution);
  virtual.traverse((o) => {
    if ((o as Mesh).isMesh) ((o as Mesh).material as Material).dispose();
  });
  plane.dispose();
  circle.dispose();
  scene.environment = env;
  scene.environmentIntensity = SEED_INTENSITY;
}

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
  if (ENV_WINDOW_GLOW > 0) scene.add(glow);

  const seed = scene.environment;
  const env = prefilter(
    gl,
    (camera) => {
      camera.position.copy(CAPTURE_POINT);
      gl.shadowMap.needsUpdate = true;
      camera.update(gl, scene);
    },
    resolution,
  );

  scene.remove(glow);
  glow.geometry.dispose();
  (glow.material as MeshBasicMaterial).dispose();

  scene.environment = env;
  scene.environmentIntensity = ENV_INTENSITY;
  // Materials that ask for their own reflection strength get the map explicitly (see note above).
  scene.traverse((o) => {
    const mats = (o as Mesh).material;
    if (!mats) return;
    for (const m of Array.isArray(mats) ? mats : [mats]) {
      const k = (m as MeshStandardMaterial).userData?.envMapIntensity;
      if (typeof k === 'number' && 'envMap' in m) {
        (m as MeshStandardMaterial).envMap = env;
        (m as MeshStandardMaterial).envMapIntensity = k;
      }
    }
  });
  seed?.dispose();
  if (new URLSearchParams(window.location.search).has('capture')) (window as unknown as { __roomEnvTex: Texture }).__roomEnvTex = env;
  return { texture: env, ms: performance.now() - t0 };
}
