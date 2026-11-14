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
const SKY_Z = -190;

/** Storm clouds over a dark horizon; lightning lights them up locally around the strike. */
function Sky() {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uFlash: { value: 0 }, uBoltX: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec3 vPos;
          void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime, uFlash, uBoltX;
          varying vec3 vPos;
          ${noiseGLSL}
          void main() {
            vec2 p = vPos.xy * 0.012 + vec2(uTime * 0.004, 0.0);
            float clouds = fbm(p * vec2(1.0, 2.2));
            float h = clamp((vPos.y - ${SEA_Y.toFixed(1)}) / 140.0, 0.0, 1.0);
            vec3 horizon = vec3(0.045, 0.06, 0.085);
            vec3 zenith = vec3(0.012, 0.016, 0.026);
            vec3 col = mix(horizon, zenith, pow(h, 0.6));
            col += vec3(0.03, 0.038, 0.05) * smoothstep(0.35, 0.85, clouds) * (1.0 - h * 0.5);
            float near = exp(-pow((vPos.x - uBoltX) / 110.0, 2.0));
            col += vec3(0.55, 0.62, 0.85) * uFlash * (0.25 + 0.75 * near) * (0.3 + clouds);
            gl_FragColor = vec4(col, 1.0);
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
    <mesh position={[0, 60, SKY_Z]} material={mat}>
      <planeGeometry args={[900, 160]} />
    </mesh>
  );
}

/** Rolling dark sea: summed waves in the vertex shader, sky/lightning reflection by fresnel. */
function Sea() {
  const geo = useMemo(() => {
    const g = new PlaneGeometry(700, 190, 160, 80);
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
          vec3 wave(vec2 p, vec2 dir, float len, float amp, float speed, inout vec3 n) {
            float k = 6.2831 / len;
            float f = k * dot(dir, p) - uTime * speed;
            n.xz -= dir * k * amp * cos(f);
            return vec3(0.0, amp * sin(f), 0.0);
          }
          void main() {
            vec3 p = position;
            vec3 n = vec3(0.0, 1.0, 0.0);
            p += wave(p.xz, normalize(vec2(0.3, 1.0)), 22.0, 0.55, 1.1, n);
            p += wave(p.xz, normalize(vec2(-0.6, 1.0)), 13.0, 0.3, 1.5, n);
            p += wave(p.xz, normalize(vec2(1.0, 0.4)), 7.0, 0.14, 2.1, n);
            vNormal2 = normalize(n);
            vec4 w = modelMatrix * vec4(p, 1.0);
            vWorld = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime, uFlash, uBoltX;
          varying vec3 vWorld;
          varying vec3 vNormal2;
          ${noiseGLSL}
          void main() {
            vec3 v = normalize(cameraPosition - vWorld);
            vec2 ripple = vec2(vnoise(vWorld.xz * 0.7 + uTime * 0.6), vnoise(vWorld.zx * 0.7 - uTime * 0.5)) - 0.5;
            vec3 n = normalize(vNormal2 + vec3(ripple.x, 0.0, ripple.y) * 0.25);
            float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
            vec3 deep = vec3(0.006, 0.012, 0.018);
            vec3 sky = vec3(0.05, 0.065, 0.09);
            vec3 col = mix(deep, sky, fres);
            float near = exp(-pow((vWorld.x - uBoltX) / 120.0, 2.0));
            col += vec3(0.5, 0.58, 0.8) * uFlash * fres * (0.4 + near);
            float crest = smoothstep(0.55, 0.8, vWorld.y - ${SEA_Y.toFixed(1)}) * vnoise(vWorld.xz * 2.0);
            col += vec3(0.05, 0.06, 0.07) * crest * (1.0 + uFlash * 4.0);
            float dist = length(vWorld.xz - cameraPosition.xz);
            col = mix(col, vec3(0.04, 0.052, 0.072), smoothstep(40.0, 180.0, dist));
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [],
  );
  useFrame(() => {
    mat.uniforms.uTime!.value = storm.time;
    mat.uniforms.uFlash!.value = storm.flash;
    mat.uniforms.uBoltX!.value = storm.boltX;
  });
  return <mesh geometry={geo} material={mat} position={[0, SEA_Y, -100]} />;
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
        void main() { gl_FragColor = vec4(vec3(0.55, 0.62, 0.75) * (0.35 + uFlash * 1.5), 0.22 * (1.0 - vEnd * 0.6)); }`,
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
  return <mesh ref={ref} material={mat} position={[0, 0, SKY_Z + 2]} frustumCulled={false} />;
}

export function Outside() {
  const tier = useExperience((s) => s.capabilities.tier);
  return (
    <group>
      <Sky />
      <Sea />
      <Bolt />
      <Rain count={tier === 'full' ? 2600 : 1100} />
    </group>
  );
}
