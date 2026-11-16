import { CanvasTexture, MeshStandardMaterial, Vector2, NoColorSpace, RepeatWrapping, type MeshStandardMaterialParameters, type Texture } from 'three';
import { concreteFloor, concretePanels, glulam, oakDesk, oakWood, ceilingPlanks, woodCladding } from './proceduralTextures';
import { makeNoise } from './noise';

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

function shared(key: string, make: () => MeshStandardMaterial): MeshStandardMaterial {
  let m = cache.get(key);
  if (!m) {
    m = make();
    m.name = key;
    cache.set(key, m);
  }
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
   * desk pedestals. A dark, partly dielectric finish so it reads as black metal yet still catches
   * reflections and edge highlights instead of rendering as a void.
   */
  steel: () =>
    shared('steel', () => new MeshStandardMaterial({ color: '#202124', metalness: 0.45, roughness: 0.5, roughnessMap: metalRoughnessVariation() })),
  /** Satin black hardware: lamp arms and shade, chair column. */
  blackHardware: () =>
    shared('blackHardware', () => new MeshStandardMaterial({ color: '#17181a', metalness: 0.6, roughness: 0.38, roughnessMap: metalRoughnessVariation() })),
  /** Polished dark hardware: pulls and handles. */
  darkChrome: () => shared('darkChrome', () => new MeshStandardMaterial({ color: '#3a3b3e', metalness: 0.9, roughness: 0.28 })),
  /** Bead-blasted aluminium (Apple devices, display stand). */
  aluminium: () => shared('aluminium', () => new MeshStandardMaterial({ color: '#c9cbce', metalness: 0.85, roughness: 0.3 })),

  // --------------------------------------------------------------- upholstery
  /** Tan leather of the office chair. */
  leatherTan: () => shared('leatherTan', () => new MeshStandardMaterial({ color: '#6e4024', roughness: 0.55 })),

  // --------------------------------------------------------------- wood (world-scale UVs only)
  /** Horizontal white-oak cladding, 2.4 m tiles. */
  cladding: () => shared('cladding', () => new MeshStandardMaterial({ ...woodCladding(), normalScale: new Vector2(0.8, 0.8) })),
  /** The same cladding with a lighter tint (the bookshelf wall). */
  claddingLight: () =>
    shared('claddingLight', () => new MeshStandardMaterial({ ...woodCladding(), color: '#e8dccb', normalScale: new Vector2(0.8, 0.8) })),
  /** Tongue-and-groove ceiling planks. */
  ceiling: () => shared('ceiling', () => new MeshStandardMaterial({ ...ceilingPlanks(), normalScale: new Vector2(0.5, 0.5) })),
  /** Glulam: beams, posts and the window casing (tile 1 m along the grain × 0.4 m across). */
  glulam: () => shared('glulam', () => new MeshStandardMaterial({ ...glulam(), normalScale: new Vector2(0.45, 0.45) })),
  /** Oak boards: shelves and the window sill (tile 1 m × 0.5 m). */
  oak: () => shared('oak', () => new MeshStandardMaterial({ ...oakWood(), normalScale: new Vector2(0.25, 0.25) })),
  /** The desk top: one texture spanning the whole slab. */
  oakDesk: () => shared('oakDesk', () => new MeshStandardMaterial({ ...oakDesk(), normalScale: new Vector2(0.3, 0.3) })),

  // --------------------------------------------------------------- concrete
  /** Polished concrete floor, 3 m tiles. */
  concreteFloor: () =>
    shared('concreteFloor', () => new MeshStandardMaterial({ ...concreteFloor(), normalScale: new Vector2(0.35, 0.35), metalness: 0.05, envMapIntensity: 1.1 })),
  /** Board-formed concrete plinth, 2.4 m tiles. */
  concretePlinth: () => shared('concretePlinth', () => new MeshStandardMaterial({ ...concretePanels(), color: '#b9b6b0' })),
};

/** Physical tile sizes (metres, along the grain × across) of the shared textures. */
export const TILE = {
  glulam: [1, 0.4] as [number, number],
  oak: [1, 0.5] as [number, number],
  concretePlinth: [2.4, 2.4] as [number, number],
};
