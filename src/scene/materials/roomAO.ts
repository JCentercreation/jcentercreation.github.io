import type { MeshStandardMaterial } from 'three';
import { ROOM } from '../layout';

/**
 * Analytic room ambient occlusion for the architecture (floor, walls, ceiling, plinth).
 *
 * Where two room surfaces meet — wall and floor, wall and ceiling, two walls — less of the room's
 * indirect light can reach the surface, so corners and junctions settle into soft shadow. The room is
 * a box with known planes, so this is evaluated exactly per pixel from the world position: no extra
 * render pass, no screen-space sampling, hence no noise, halos or flicker, and identical on every tier.
 *
 * It only attenuates INDIRECT light (environment + hemisphere), like a baked AO map: the lamp, the
 * window and the storm keep lighting the corners directly.
 */
const STRENGTH = 0.5; // max darkening of indirect light at a corner
const REACH = 0.32; // metres: how far from a junction the occlusion fades out

const glsl = /* glsl */ `
  float roomPlaneAO(float d) { return d > 0.02 ? exp(-d / ${REACH.toFixed(3)}) : 0.0; }
  float roomAO(vec3 p) {
    float o = roomPlaneAO(p.x - (${ROOM.minX.toFixed(3)})) + roomPlaneAO((${ROOM.maxX.toFixed(3)}) - p.x)
            + roomPlaneAO(p.z - (${ROOM.minZ.toFixed(3)})) + roomPlaneAO((${ROOM.maxZ.toFixed(3)}) - p.z)
            + roomPlaneAO(p.y) + roomPlaneAO((${ROOM.height.toFixed(3)}) - p.y);
    return 1.0 - ${STRENGTH.toFixed(2)} * clamp(o, 0.0, 1.0);
  }`;

/** Adds room AO to a shared material (composes with an existing onBeforeCompile). */
export function withRoomAO<T extends MeshStandardMaterial>(m: T): T {
  const previous = m.onBeforeCompile.bind(m);
  const previousKey = m.customProgramCacheKey.bind(m);
  m.onBeforeCompile = (sh, renderer) => {
    previous(sh, renderer);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRoomWorld;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvRoomWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vRoomWorld;\n${glsl}`)
      .replace(
        '#include <aomap_fragment>',
        `#include <aomap_fragment>
        float rAO = roomAO(vRoomWorld);
        reflectedLight.indirectDiffuse *= rAO;
        reflectedLight.indirectSpecular *= mix(1.0, rAO, 0.6);`,
      );
  };
  m.customProgramCacheKey = () => `${previousKey()}|roomAO`;
  return m;
}
