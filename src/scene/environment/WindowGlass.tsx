import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { ShaderMaterial } from 'three';
import { ROOM, WINDOW } from '../layout';
import { noiseGLSL } from './glsl';
import { storm } from './storm';

/**
 * Rain on the glass: static beads plus drops that slide down and leave trails.
 * Purely procedural, one quad. The glass itself is almost invisible; drops catch
 * the cold outside light and flare when lightning strikes.
 */
export function WindowGlass() {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uFlash: { value: 0 }, uAspect: { value: WINDOW.width / WINDOW.height } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uTime, uFlash, uAspect;
          varying vec2 vUv;
          ${noiseGLSL}
          // Static beads on a jittered grid.
          float beads(vec2 uv, float scale) {
            vec2 g = uv * scale;
            vec2 id = floor(g);
            vec2 f = fract(g) - 0.5;
            float h = hash12(id);
            vec2 o = vec2(hash12(id + 3.1), hash12(id + 7.7)) - 0.5;
            float r = 0.06 + 0.12 * h;
            float d = length(f - o * 0.6);
            return smoothstep(r, r * 0.4, d) * step(0.45, h);
          }
          // Sliding drops in columns, each with a fading trail above it.
          float sliders(vec2 uv, float cols) {
            float x = uv.x * cols;
            float id = floor(x);
            float fx = fract(x) - 0.5;
            float h = hash12(vec2(id, 4.2));
            float speed = 0.05 + 0.12 * h;
            float y = fract(uv.y + uTime * speed + h * 10.0);
            float wob = sin(uv.y * 30.0 + h * 6.0) * 0.08;
            float head = smoothstep(0.1, 0.0, length(vec2((fx - wob) * 1.0, (y - 0.95) * cols / uAspect * 0.9)));
            float trail = smoothstep(0.05, 0.0, abs(fx - wob)) * smoothstep(0.95, 0.4, y) * smoothstep(0.0, 0.95, y) * 0.35;
            return (head + trail) * step(0.35, h);
          }
          void main() {
            vec2 uv = vec2(vUv.x * uAspect, vUv.y);
            float d = beads(uv, 30.0) * 0.7 + beads(uv + 0.37, 58.0) * 0.45 + sliders(vec2(uv.x, -uv.y), 18.0 * uAspect);
            float streaks = smoothstep(0.62, 0.75, vnoise(vec2(uv.x * 140.0, uv.y * 6.0 + uTime * 0.6))) * 0.12;
            float a = 0.008 + d * (0.14 + uFlash * 0.5) + streaks * 0.12;
            vec3 col = mix(vec3(0.45, 0.55, 0.7), vec3(1.0), uFlash) * (0.55 + d * 0.6);
            gl_FragColor = vec4(col, a);
          }`,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );
  useFrame(() => {
    mat.uniforms.uTime!.value = storm.time;
    mat.uniforms.uFlash!.value = storm.flash;
  });
  return (
    <mesh position={[WINDOW.centerX, WINDOW.sill + WINDOW.height / 2, ROOM.minZ - ROOM.wallThickness * 0.45]} material={mat}>
      <planeGeometry args={[WINDOW.width, WINDOW.height]} />
    </mesh>
  );
}
