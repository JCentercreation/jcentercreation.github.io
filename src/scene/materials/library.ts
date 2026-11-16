import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector2,
  NoColorSpace,
  RepeatWrapping,
  type MeshStandardMaterialParameters,
  type Texture,
} from 'three';
import { concreteFloor, concretePanels, glulam, oakDesk, oakWood, ceilingPlanks, woodCladding } from './proceduralTextures';
import { brushed, concreteDetail, felt, leather, pageEdges, weave } from './surfaces';
import { rugTexture } from '../decor/rug';
import { makeNoise } from './noise';
import { withRoomAO } from './roomAO';

/**
 * Shared material library.
 *
 * One instance per material, reused by every mesh that wants it: consistent properties across the
 * garage, fewer GPU state changes, and a single place to refine a material later.
 *
 * Rules:
 * - Shared instances are never mutated per object. A variant (different tint, emissive, map
 *   transform…) gets its own key.
 * - Textured materials can only be shared by meshes whose UVs are in world scale (tiledPlane /
 *   tiledBox), so one texture keeps the same physical size everywhere.
 * - Interactive screens, books and anything animated per object keep their own materials.
 */

const cache = new Map<string, MeshStandardMaterial>();

/** `userData.envMapIntensity` = this material's own reflection strength (see roomEnvironment.ts). */
function shared<T extends MeshStandardMaterial>(key: string, make: () => T, userData?: { envMapIntensity?: number }): T {
  let m = cache.get(key) as T | undefined;
  if (!m) {
    m = make();
    m.name = key;
    if (userData) Object.assign(m.userData, userData);
    cache.set(key, m);
  }
  return m;
}

/** A texture copy with its own repeat (the image is shared, only the transform differs). */
function repeated(t: Texture, x: number, y: number): Texture {
  const c = t.clone();
  c.repeat.set(x, y);
  c.needsUpdate = true;
  return c;
}

/**
 * Two-scale concrete: the 3 m base tile (albedo/roughness/normal) + a 0.6 m micro-detail tile and a
 * macro tonal noise, both in world space, so polish, tone and roughness vary at three scales and the
 * 3 m repeat disappears. (Small onBeforeCompile extension of the standard material.)
 */
function withConcreteDetail(m: MeshStandardMaterial): MeshStandardMaterial {
  const detail = concreteDetail();
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uDetail = { value: detail };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDetailWorld;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvDetailWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vDetailWorld;
        uniform sampler2D uDetail;
        float dHash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        float dNoise(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(dHash(i), dHash(i + vec2(1, 0)), u.x), mix(dHash(i + vec2(0, 1)), dHash(i + vec2(1, 1)), u.x), u.y); }`,
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        vec4 cDetail = texture2D(uDetail, vDetailWorld.xz / 0.6);
        float cMacro = dNoise(vDetailWorld.xz * 0.35) * 0.6 + dNoise(vDetailWorld.xz * 1.1 + 7.0) * 0.4;
        diffuseColor.rgb *= (0.95 + 0.1 * cMacro) * (0.92 + 0.16 * cDetail.g);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor * (0.78 + 0.44 * cDetail.r) + (cMacro - 0.5) * 0.08, 0.06, 1.0);`,
      );
  };
  m.customProgramCacheKey = () => 'concreteDetail';
  return m;
}

/** Flat (untextured) materials: one instance per unique colour/metalness/roughness combination. */
export function flat(p: Pick<MeshStandardMaterialParameters, 'color' | 'metalness' | 'roughness'>): MeshStandardMaterial {
  const key = `flat:${String(p.color ?? '#ffffff')}:${p.metalness ?? 0}:${p.roughness ?? 1}`;
  return shared(key, () => new MeshStandardMaterial(p));
}

/** Low-frequency roughness variation for metal: hand-finished steel is never uniformly glossy. */
let metalVariation: Texture | null = null;
function metalRoughnessVariation(): Texture {
  if (metalVariation) return metalVariation;
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const img = g.createImageData(size, size);
  const { fbm } = makeNoise(131);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      // Roughness multiplier around 1.0 (0.82–1.18): patchy wear plus faint linear finishing marks.
      const n = fbm(x / size, y / size, 4, 4) * 0.7 + fbm(x / size, (y / size) * 0.08, 32, 2) * 0.3;
      const v = Math.round((0.82 + n * 0.36) * 255 * 0.85);
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = NoColorSpace;
  metalVariation = t;
  return t;
}

export const mat = {
  // --------------------------------------------------------------- metal
  /**
   * Blackened (powder-coated) structural steel: window bars, hangers, door straps, shelf frame,
   * bookends, desk pedestals. A dark, partly dielectric finish so it reads as black metal yet still
   * catches reflections and edge highlights instead of rendering as a void.
   */
  steel: () =>
    shared('steel', () => new MeshStandardMaterial({ color: '#232427', metalness: 0.5, roughness: 0.48, roughnessMap: metalRoughnessVariation() })),
  /** Satin black hardware: lamp, chair star base. */
  blackHardware: () =>
    shared('blackHardware', () => new MeshStandardMaterial({ color: '#17181a', metalness: 0.6, roughness: 0.38, roughnessMap: metalRoughnessVariation() })),
  /** Polished dark hardware: drawer pulls and handles. */
  darkChrome: () => shared('darkChrome', () => new MeshStandardMaterial({ color: '#3a3b3e', metalness: 0.9, roughness: 0.24 })),
  /** Polished chrome: small mechanical details only (chair gas-lift column). */
  chrome: () => shared('chrome', () => new MeshStandardMaterial({ color: '#d9dbde', metalness: 1, roughness: 0.12 })),
  /**
   * Brushed aluminium (Apple devices, display stand): fine directional brushing in the roughness
   * and a mild anisotropic highlight along the brush. `uvPerMetre` = the mesh's UV units per metre
   * (0 = box UVs spanning each face), so the brush keeps a fine, real-world scale.
   */
  aluminium: (color = '#c9cbce', uvPerMetre = 0) =>
    shared(`aluminium:${color}:${uvPerMetre}`, () => {
      const rough = uvPerMetre ? repeated(brushed(), uvPerMetre / 0.06, uvPerMetre / 0.06) : brushed();
      return new MeshPhysicalMaterial({ color, metalness: 0.9, roughness: 0.34, roughnessMap: rough, anisotropy: 0.45, anisotropyRotation: 0 });
    }),

  // --------------------------------------------------------------- upholstery & textiles
  /**
   * Cognac leather of the office chair: pebble grain (normal), roughness variation, soft natural
   * sheen (a faint clear coat). The seat is a touch darker and smoother (worn by use) than the back.
   * UVs of drei's RoundedBox are in metres; the grain tile is ~12 cm.
   */
  leatherSeat: () => shared('leatherSeat', () => leatherMaterial('#6a3d22', 0.5)),
  leatherBack: () => shared('leatherBack', () => leatherMaterial('#704126', 0.58)),
  /** Kept for compatibility: the backrest leather. */
  leatherTan: () => mat.leatherBack(),
  /** Woven jute rug: colour texture + weave normal and roughness + a soft fibre sheen. */
  rug: () =>
    shared('rug', () => {
      const w = weave();
      // Plane UVs span the whole 2.5 × 1.7 m rug; the weave tile is ~4 cm.
      return new MeshPhysicalMaterial({
        map: rugTexture('jute', [150, 116, 78], [118, 88, 58]),
        normalMap: repeated(w.normalMap, 2.5 / 0.04, 1.7 / 0.04),
        normalScale: new Vector2(0.6, 0.6),
        roughnessMap: repeated(w.roughnessMap, 2.5 / 0.04, 1.7 / 0.04),
        roughness: 1,
        sheen: 0.5,
        sheenRoughness: 0.85,
        sheenColor: new Color('#a07a52'),
      });
    }),
  /** Felt desk pad (box UVs span each face: 1.08 × 0.4 m top; tile ~5 cm). */
  felt: () =>
    shared('felt', () =>
      new MeshStandardMaterial({
        color: '#2e2c2a',
        roughness: 0.95,
        normalMap: repeated(felt().normalMap, 1.08 / 0.05, 0.4 / 0.05),
        normalScale: new Vector2(0.5, 0.5),
      }),
    ),

  // --------------------------------------------------------------- wood (world-scale UVs only)
  /** Horizontal white-oak cladding, 2.4 m tiles, matte oiled. */
  cladding: () => shared('cladding', () => withRoomAO(new MeshStandardMaterial({ ...woodCladding(), normalScale: new Vector2(0.9, 0.9) }))),
  /** The same cladding with a lighter tint (the bookshelf wall). */
  claddingLight: () =>
    shared('claddingLight', () => withRoomAO(new MeshStandardMaterial({ ...woodCladding(), color: '#e8dccb', normalScale: new Vector2(0.9, 0.9) }))),
  /** Tongue-and-groove ceiling planks. */
  ceiling: () => shared('ceiling', () => withRoomAO(new MeshStandardMaterial({ ...ceilingPlanks(), normalScale: new Vector2(0.7, 0.7) }))),
  /** Glulam: beams, posts and the window casing (tile 1 m along the grain × 0.4 m across), sealed. */
  glulam: () => shared('glulam', () => new MeshStandardMaterial({ ...glulam(), normalScale: new Vector2(0.55, 0.55) })),
  /** Oiled furniture oak: shelves and the window sill (tile 1 m × 0.5 m). */
  oak: () => shared('oak', () => new MeshStandardMaterial({ ...oakWood(), normalScale: new Vector2(0.35, 0.35) })),
  /**
   * The desk top: one texture spanning the whole slab, under a satin lacquer (a thin, slightly rough
   * clear coat over the oiled oak) — furniture grade, not a glossy tabletop.
   */
  oakDesk: () =>
    shared('oakDesk', () =>
      new MeshPhysicalMaterial({ ...oakDesk(), normalScale: new Vector2(0.35, 0.35), clearcoat: 0.45, clearcoatRoughness: 0.32 }),
    ),

  // --------------------------------------------------------------- concrete
  /** Polished concrete floor: 3 m base tile + world-space micro detail and macro tone (two-scale). */
  concreteFloor: () =>
    shared(
      'concreteFloor',
      () => withRoomAO(withConcreteDetail(new MeshStandardMaterial({ ...concreteFloor(), normalScale: new Vector2(0.35, 0.35), metalness: 0.04 }))),
      { envMapIntensity: 0.8 },
    ),
  /** Board-formed concrete plinth, 2.4 m tiles. */
  concretePlinth: () => shared('concretePlinth', () => withRoomAO(new MeshStandardMaterial({ ...concretePanels(), color: '#b9b6b0' }))),

  // --------------------------------------------------------------- glass
  /**
   * Reflection-only glass: an additive, black, near-mirror dielectric layer. It adds Fresnel
   * reflections of the room (and the lamp's highlight) on top of whatever is behind it, without
   * darkening it — so the storm stays visible through the window and screens stay readable.
   * (Real transmission would need an extra full-scene render every frame.)
   */
  windowGlass: () => shared('windowGlass', () => glassLayer(), { envMapIntensity: 1 }),
  /** The same over device screens, weaker so text stays crisp. Interactive DOM screens sit above the canvas and are unaffected. */
  screenGlass: () => shared('screenGlass', () => glassLayer(), { envMapIntensity: 0.4 }),

  // --------------------------------------------------------------- small objects
  /** Glazed stoneware mug. */
  glazedCeramic: () => shared('glazedCeramic', () => new MeshPhysicalMaterial({ color: '#2b2b2b', roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.15 })),
  /** Unglazed (matte) ceramic plant pot. */
  matteCeramic: () => shared('matteCeramic', () => new MeshStandardMaterial({ color: '#d8d3c8', roughness: 0.82 })),
  /** Book page edges (instance colour is ignored for pages, see Bookshelf.tsx). */
  pageEdges: () => pageEdges(),
};

function leatherMaterial(color: string, roughness: number) {
  const l = leather();
  const per = 1 / 0.12; // RoundedBox UVs are in metres; grain tile ~12 cm
  return new MeshPhysicalMaterial({
    color,
    map: repeated(l.map, per, per),
    roughness,
    roughnessMap: repeated(l.roughnessMap, per, per),
    normalMap: repeated(l.normalMap, per, per),
    normalScale: new Vector2(0.45, 0.45),
    clearcoat: 0.18,
    clearcoatRoughness: 0.45,
  });
}

function glassLayer() {
  return new MeshStandardMaterial({ color: '#000000', roughness: 0.04, metalness: 0, transparent: true, depthWrite: false, blending: AdditiveBlending });
}

/** Physical tile sizes (metres, along the grain × across) of the shared textures. */
export const TILE = {
  glulam: [1, 0.4] as [number, number],
  oak: [1, 0.5] as [number, number],
  concretePlinth: [2.4, 2.4] as [number, number],
};
