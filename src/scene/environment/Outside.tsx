import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  type Mesh,
  PlaneGeometry,
  ShaderMaterial,
} from 'three';
import { useExperience } from '@/app/store';
import { noiseGLSL } from './glsl';
import { storm } from './storm';

const SEA_Y = -7;
/** Where lightning bolts are drawn (unchanged). */
const BOLT_Z = -188;
/** The near, wave-displaced sea ends here; the flat far sea continues to the sky. */
const NEAR_SEA_END = -195;
/** Sky backdrop: as far as the camera's far plane (600) allows, so the sea reaches a true horizon. */
const SKY_Z = -580;

/**
 * Shared night palette and helpers for every exterior layer. The moon itself is hidden behind the
 * clouds (high, to the right of the window axis): it only shows as a soft glow, lit cloud edges and a
 * restrained glitter path on the sea. Lightning reuses the storm's existing flash/strike values.
 */
const exteriorGLSL = /* glsl */ `
${noiseGLSL}
const vec3 MOON_DIR = vec3(0.3163, 0.1861, -0.9302); // normalize(0.34, 0.2, -1)
const vec3 HORIZON = vec3(0.05, 0.064, 0.088);   // atmospheric glow just above the sea
const vec3 HAZE = vec3(0.036, 0.047, 0.064);     // distance haze (sea and land fade into it)
/** Lightning illumination: strongest around the strike (angular distance from the bolt). */
float boltNear(vec3 dir, float boltX) {
  float ax = dir.x / max(-dir.z, 1e-3);
  return exp(-pow((ax - boltX / ${(-BOLT_Z + 4).toFixed(1)}) / 0.55, 2.0));
}
`;

/**
 * Night sky: three perspective-correct cloud decks (low scud, main storm layer, high veil) over a
 * horizon glow. Each deck is sampled where the view ray meets it, so clouds shrink and thicken towards
 * the horizon like a real overcast. Cloud edges facing the hidden moon are silvered; lightning lights the
 * clouds near the strike.
 */
function Sky() {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uFlash: { value: 0 }, uBoltX: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */ `
          uniform float uTime, uFlash, uBoltX;
          varying vec3 vWorld;
          ${exteriorGLSL}
          // One cloud deck at height h above the eye: density and a moon-side edge light.
          vec2 deck(vec3 dir, float h, float scale, vec2 drift, float cover) {
            float t = h / max(dir.y, 0.012);
            vec2 p = (dir.xz * t) * scale + drift;
            float d = fbm(p);
            float dens = smoothstep(cover, cover + 0.28, d);
            float lit = smoothstep(cover, cover + 0.28, fbm(p - MOON_DIR.xz * 0.35));
            return vec2(dens, clamp(dens - lit * 0.85, 0.0, 1.0));
          }
          void main() {
            vec3 dir = normalize(vWorld - cameraPosition);
            float up = clamp(dir.y, 0.0, 1.0);
            // Sky behind the clouds: horizon glow fading to a dark zenith, plus a wide moon halo.
            vec3 col = mix(HORIZON, vec3(0.011, 0.015, 0.024), pow(smoothstep(0.0, 0.5, up), 0.55));
            float moon = max(dot(dir, MOON_DIR), 0.0);
            vec3 moonGlow = vec3(0.07, 0.085, 0.11) * (pow(moon, 18.0) * 0.9 + pow(moon, 4.0) * 0.25);
            col += moonGlow;
            // Distance fade of the decks towards the horizon (atmospheric perspective).
            float far = smoothstep(0.03, 0.0, up);
            vec2 hi = deck(dir, 900.0, 0.0011, vec2(uTime * 0.0008, 0.0), 0.5);
            vec2 mid = deck(dir, 420.0, 0.0018, vec2(uTime * 0.0016, 3.7), 0.44);
            vec2 low = deck(dir, 160.0, 0.0042, vec2(uTime * 0.004, 9.1), 0.5);
            // High veil: thin, lighter; storm layer: dark masses with silvered edges; scud: darkest, nearest.
            col = mix(col, vec3(0.032, 0.04, 0.054) + moonGlow * 0.8, hi.x * 0.45);
            vec3 midCol = vec3(0.016, 0.02, 0.028) + moonGlow * 0.35 + vec3(0.05, 0.06, 0.075) * (mid.x - mid.y) * (0.35 + pow(moon, 6.0) * 1.6);
            col = mix(col, midCol, mid.x * 0.85);
            col = mix(col, vec3(0.009, 0.011, 0.016), low.x * 0.7);
            col = mix(col, HORIZON, far * 0.75);
            // Lightning: the cloud mass glows around the strike, and a little everywhere.
            float dens = max(mid.x, max(low.x * 0.8, hi.x * 0.5));
            col += vec3(0.55, 0.62, 0.85) * uFlash * (0.2 + 0.8 * boltNear(dir, uBoltX)) * (0.25 + 0.9 * dens);
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
        depthWrite: false,
      }),
    [],
  );
  useFrame(() => {
    mat.uniforms.uTime!.value = storm.time;
    mat.uniforms.uFlash!.value = storm.flash;
    mat.uniforms.uBoltX!.value = storm.boltX;
  });
  return (
    <mesh position={[0, 200, SKY_Z]} material={mat}>
      <planeGeometry args={[2200, 430]} />
    </mesh>
  );
}

/**
 * Sea shading shared by the near (wave-displaced) and far (flat) sea, so they meet seamlessly:
 * dark water whose reflection of the sky grows towards the horizon (Fresnel), a restrained moon glitter
 * path, faint crests, distance haze, and lightning reflected near the strike.
 */
const seaShadeGLSL = /* glsl */ `
vec3 seaShade(vec3 world, vec3 n0, float crestH, float uTime, float uFlash, float uBoltX) {
  vec3 toCam = cameraPosition - world;
  float dist = length(toCam.xz);
  vec3 v = normalize(toCam);
  // Ripples: stronger close by, averaged out with distance (no shimmering far away).
  float rs = 1.0 - smoothstep(60.0, 400.0, dist);
  vec2 ripple = vec2(vnoise(world.xz * 0.7 + uTime * 0.6), vnoise(world.zx * 0.7 - uTime * 0.5)) - 0.5;
  vec2 swell = vec2(vnoise(world.xz * 0.05 + uTime * 0.05), vnoise(world.zx * 0.05 - uTime * 0.04)) - 0.5;
  vec3 n = normalize(n0 + vec3(ripple.x, 0.0, ripple.y) * 0.25 * rs + vec3(swell.x, 0.0, swell.y) * 0.12);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
  vec3 deep = vec3(0.005, 0.01, 0.016);
  vec3 col = mix(deep, HORIZON * 0.95, fres);
  // Broad tonal variation: patches of slightly lighter and darker water.
  col *= 0.8 + 0.4 * vnoise(world.xz * 0.012 + 3.0);
  // Moon glitter: sharp, sparse highlights along the reflection path (restrained, never a mirror).
  vec3 r = reflect(-v, n);
  float m = max(dot(r, MOON_DIR), 0.0);
  float glint = pow(m, 220.0) * 2.2 + pow(m, 40.0) * 0.12;
  float sparkle = smoothstep(0.55, 0.85, vnoise(world.xz * 0.9 + uTime * 0.8));
  col += vec3(0.32, 0.37, 0.46) * glint * (0.3 + sparkle) * (0.35 + 0.65 * rs);
  // Crests catch a little light.
  float crest = smoothstep(0.55, 0.8, crestH) * vnoise(world.xz * 2.0);
  col += vec3(0.05, 0.06, 0.07) * crest * (1.0 + uFlash * 4.0);
  // Lightning reflected on the water near the strike.
  col += vec3(0.5, 0.58, 0.8) * uFlash * fres * (0.4 + boltNear(-v, uBoltX));
  // Distance haze into the horizon.
  col = mix(col, HAZE, smoothstep(60.0, 560.0, dist) * 0.85);
  return col;
}
`;

/** Rolling dark sea close to the house: summed waves in the vertex shader (tapering out at the far edge). */
function Sea() {
  const geo = useMemo(() => {
    const g = new PlaneGeometry(700, -NEAR_SEA_END - 5, 160, 80);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uFlash: { value: 0 }, uBoltX: { value: 0 } },
        vertexShader: /* glsl */ `
          uniform float uTime;
          varying vec3 vWorld;
          varying vec3 vNormal2;
          varying float vCrest;
          vec3 wave(vec2 p, vec2 dir, float len, float amp, float speed, inout vec3 n) {
            float k = 6.2831 / len;
            float f = k * dot(dir, p) - uTime * speed;
            n.xz -= dir * k * amp * cos(f);
            return vec3(0.0, amp * sin(f), 0.0);
          }
          void main() {
            vec3 p = position;
            vec3 n = vec3(0.0, 1.0, 0.0);
            vec3 dp = vec3(0.0);
            dp += wave(p.xz, normalize(vec2(0.3, 1.0)), 22.0, 0.55, 1.1, n);
            dp += wave(p.xz, normalize(vec2(-0.6, 1.0)), 13.0, 0.3, 1.5, n);
            dp += wave(p.xz, normalize(vec2(1.0, 0.4)), 7.0, 0.14, 2.1, n);
            // Flatten towards the far edge, where the flat far sea takes over.
            vec4 w0 = modelMatrix * vec4(p, 1.0);
            float keep = smoothstep(${NEAR_SEA_END.toFixed(1)}, ${(NEAR_SEA_END + 45).toFixed(1)}, w0.z);
            p += dp * keep;
            n = mix(vec3(0.0, 1.0, 0.0), n, keep);
            vNormal2 = normalize(n);
            vec4 w = modelMatrix * vec4(p, 1.0);
            vWorld = w.xyz;
            vCrest = w.y - ${SEA_Y.toFixed(1)};
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime, uFlash, uBoltX;
          varying vec3 vWorld;
          varying vec3 vNormal2;
          varying float vCrest;
          ${exteriorGLSL}
          ${seaShadeGLSL}
          void main() {
            gl_FragColor = vec4(seaShade(vWorld, vNormal2, vCrest, uTime, uFlash, uBoltX), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  useFrame(() => {
    mat.uniforms.uTime!.value = storm.time;
    mat.uniforms.uFlash!.value = storm.flash;
    mat.uniforms.uBoltX!.value = storm.boltX;
  });
  return <mesh geometry={geo} material={mat} position={[0, SEA_Y, (NEAR_SEA_END - 5) / 2]} />;
}

/** The open sea beyond the waves, out to the horizon: one flat quad, same shading. */
function FarSea() {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uFlash: { value: 0 }, uBoltX: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */ `
          uniform float uTime, uFlash, uBoltX;
          varying vec3 vWorld;
          ${exteriorGLSL}
          ${seaShadeGLSL}
          void main() {
            gl_FragColor = vec4(seaShade(vWorld, vec3(0.0, 1.0, 0.0), 0.0, uTime, uFlash, uBoltX), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  useFrame(() => {
    mat.uniforms.uTime!.value = storm.time;
    mat.uniforms.uFlash!.value = storm.flash;
    mat.uniforms.uBoltX!.value = storm.boltX;
  });
  const depth = NEAR_SEA_END - SKY_Z + 2;
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, SEA_Y, NEAR_SEA_END - depth / 2 + 1]} material={mat}>
      <planeGeometry args={[2200, depth]} />
    </mesh>
  );
}

/**
 * A distant coastline: a silhouette of low hills seen across the water, cut from a vertical quad by a
 * noise ridge (no buildings, no lights). `haze` blends it into the night air; `profile` shapes where the
 * land rises along x. Lightning lights its outline briefly; a faint surf line marks the waterline.
 */
function Coast({ z, height, haze, profile, seed }: { z: number; height: number; haze: number; profile: [number, number, number, number]; seed: number }) {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uFlash: { value: 0 },
          uBoltX: { value: 0 },
          uHeight: { value: height },
          uHaze: { value: haze },
          uProfile: { value: profile },
          uSeed: { value: seed },
        },
        vertexShader: /* glsl */ `
          varying vec3 vWorld;
          void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */ `
          uniform float uFlash, uBoltX, uHeight, uHaze, uSeed;
          uniform vec4 uProfile; // x0 (land starts), x1 (full height), x2 (full height ends), x3 (land ends)
          varying vec3 vWorld;
          ${exteriorGLSL}
          void main() {
            float x = vWorld.x;
            float env = smoothstep(uProfile.x, uProfile.y, x) * (1.0 - smoothstep(uProfile.z, uProfile.w, x));
            float ridge = fbm(vec2(x * 0.012 + uSeed, uSeed)) * 0.75 + vnoise(vec2(x * 0.06 + uSeed * 2.0, 1.0)) * 0.25;
            float h = uHeight * env * (0.35 + 0.9 * ridge);
            float y = vWorld.y - ${SEA_Y.toFixed(1)};
            if (y > h || env <= 0.001) discard;
            vec3 dir = normalize(vWorld - cameraPosition);
            // Dark land with soft texture (vegetation, rock), lifted towards the air colour with distance.
            float tex = vnoise(vWorld.xy * vec2(0.35, 0.5) + uSeed) * 0.5 + vnoise(vWorld.xy * 1.3) * 0.5;
            vec3 land = vec3(0.008, 0.011, 0.014) * (0.75 + 0.5 * tex);
            // The top edge catches a little moonlight; the waterline has a faint, broken surf line.
            float rim = smoothstep(h - 1.2, h, y) * 0.5;
            land += vec3(0.02, 0.025, 0.032) * rim * max(dot(normalize(vec3(-dir.x, 0.4, 1.0)), MOON_DIR), 0.0);
            float surf = smoothstep(0.9, 0.0, y) * smoothstep(0.45, 0.75, vnoise(vec2(x * 0.4, 2.0)));
            land += vec3(0.05, 0.058, 0.07) * surf;
            vec3 col = mix(land, HAZE, uHaze);
            // Lightning: the hills are briefly lit, most strongly near the strike.
            col += vec3(0.35, 0.4, 0.55) * uFlash * (0.15 + 0.85 * boltNear(dir, uBoltX)) * (0.25 + 0.35 * tex) * (1.0 - uHaze * 0.6);
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [height, haze, profile, seed],
  );
  useFrame(() => {
    mat.uniforms.uFlash!.value = storm.flash;
    mat.uniforms.uBoltX!.value = storm.boltX;
  });
  return (
    <mesh position={[0, SEA_Y + height * 0.75, z]} material={mat}>
      <planeGeometry args={[2200, height * 1.5 + 2]} />
    </mesh>
  );
}

/** Falling rain outside the window: one draw call, animated entirely on the GPU. */
function Rain({ count }: { count: number }) {
  const { geo, mat } = useMemo(() => {
    const pos = new Float32Array(count * 2 * 3);
    const end = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const x = -7 + Math.random() * 15;
      const y = Math.random() * 11;
      const z = -5.0 - Math.random() * 12;
      pos.set([x, y, z, x, y, z], i * 6);
      end.set([0, 1], i * 2);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('aEnd', new BufferAttribute(end, 1));
    const m = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uFlash: { value: 0 } },
      vertexShader: /* glsl */ `
        uniform float uTime;
        attribute float aEnd;
        varying float vEnd;
        void main() {
          vec3 p = position;
          float speed = 9.0 + fract(p.x * 13.7) * 3.0;
          p.y = mod(p.y - uTime * speed, 11.0) - 4.0;
          p += aEnd * vec3(-0.06, 0.28, 0.0);
          vEnd = aEnd;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uFlash;
        varying float vEnd;
        void main() { gl_FragColor = vec4(vec3(0.55, 0.62, 0.75) * (0.35 + uFlash * 1.5), 0.11 * (1.0 - vEnd * 0.6)); }`,
      transparent: true,
      depthWrite: false,
    });
    return { geo: g, mat: m };
  }, [count]);
  useFrame(() => {
    mat.uniforms.uTime!.value = storm.time;
    mat.uniforms.uFlash!.value = storm.flash;
  });
  return <lineSegments geometry={geo} material={mat} frustumCulled={false} />;
}

/** A jagged bolt, regenerated on every strike and visible only while it flashes. */
function Bolt() {
  const ref = useRef<Mesh>(null);
  const lastStrike = useRef(-1);
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uFlash: { value: 0 }, uColor: { value: new Color('#dfe8ff') } },
        vertexShader: `void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uFlash; uniform vec3 uColor; void main(){ gl_FragColor = vec4(uColor * 3.0, smoothstep(0.35, 0.9, uFlash)); }`,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
      }),
    [],
  );
  useFrame(() => {
    mat.uniforms.uFlash!.value = storm.flash;
    const mesh = ref.current;
    if (!mesh || storm.strike === lastStrike.current) return;
    lastStrike.current = storm.strike;
    // Random walk from the clouds down to the horizon, built as a thin ribbon.
    const pts: [number, number][] = [];
    let x = storm.boltX;
    for (let y = 70; y > SEA_Y; y -= 4 + Math.random() * 5) {
      pts.push([x, y]);
      x += (Math.random() - 0.5) * 9;
    }
    pts.push([x, SEA_Y]);
    const verts: number[] = [];
    const w = 0.55;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i]!;
      const [bx, by] = pts[i + 1]!;
      verts.push(ax - w, ay, 0, ax + w, ay, 0, bx - w, by, 0, ax + w, ay, 0, bx + w, by, 0, bx - w, by, 0);
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(verts), 3));
    mesh.geometry.dispose();
    mesh.geometry = g;
  });
  return <mesh ref={ref} material={mat} position={[0, 0, BOLT_Z]} frustumCulled={false} />;
}

/** Coastline layers: a darker headland on the left, hazier hills far away to the right. */
const HEADLAND = { z: -300, height: 13, haze: 0.18, profile: [-700, -260, -70, 25] as [number, number, number, number], seed: 3.1 };
const FAR_HILLS = { z: -500, height: 16, haze: 0.5, profile: [70, 240, 700, 900] as [number, number, number, number], seed: 8.4 };

export function Outside() {
  const tier = useExperience((s) => s.capabilities.tier);
  return (
    <group>
      <Sky />
      <FarSea />
      <Coast {...FAR_HILLS} />
      <Coast {...HEADLAND} />
      <Sea />
      <Bolt />
      <Rain count={tier === 'full' ? 2600 : 1100} />
    </group>
  );
}
