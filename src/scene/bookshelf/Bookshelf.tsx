import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, Color, TextureLoader, type Group, type InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, SRGBColorSpace, Euler, Vector3 } from 'three';
import { useExperience } from '@/app/store';
import type { BookRecord } from '@/content';
import { BOOKSHELF, ROOM } from '../layout';
import { oakWood } from '../materials/proceduralTextures';
import { Interactive } from '../Interactive';
import { PLAIN_SPINE, SPINE_DESIGNS, arrangeShelf, type Bookend, type PlacedBook } from './arrangement';
import { SYSTEM_FONT } from '../screens/draw';

const LENGTH = BOOKSHELF.bays * BOOKSHELF.bayWidth;
const CENTER_Z = BOOKSHELF.zStart + LENGTH / 2;
const FRONT_X = BOOKSHELF.x - BOOKSHELF.depth;

function Frame() {
  const oak = oakWood();
  const uprights: number[] = [];
  for (let b = 0; b <= BOOKSHELF.bays; b++) uprights.push(BOOKSHELF.zStart + b * BOOKSHELF.bayWidth);
  return (
    <group>
      {BOOKSHELF.shelfHeights.map((y) => (
        <group key={y}>
          <mesh position={[BOOKSHELF.x - BOOKSHELF.depth / 2, y + 0.015, CENTER_Z]} castShadow receiveShadow>
            <boxGeometry args={[BOOKSHELF.depth, 0.03, LENGTH]} />
            <meshStandardMaterial {...oak} normalScale={[0.2, 0.2]} />
          </mesh>
        </group>
      ))}
      {/* Black steel frame, floor to ceiling. */}
      {uprights.map((z) =>
        [FRONT_X + 0.015, BOOKSHELF.x - 0.015].map((x) => (
          <mesh key={`${z}-${x}`} position={[x, ROOM.height / 2, z]} castShadow>
            <boxGeometry args={[0.03, ROOM.height, 0.03]} />
            <meshStandardMaterial color="#111213" metalness={0.75} roughness={0.42} />
          </mesh>
        )),
      )}
    </group>
  );
}

/**
 * Spine typography for anonymous books: title-like bands and blocks that read as spines from a
 * distance but are intentionally not legible — no invented titles. Drawn portrait (thickness ×
 * height); alpha marks where the text colour replaces the book colour.
 */
function spineDesign(index: number) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 512;
  const g = c.getContext('2d')!;
  const lightText = index < SPINE_DESIGNS;
  const ink = lightText ? ['#e9dcb8', '#f4f1ea', '#d6b25e', '#f2e6cf'][index % 4]! : ['#1b1b1b', '#7a1f1a', '#1f2a44', '#2d2d2d'][index % 4]!;
  g.fillStyle = ink;
  const v = index % SPINE_DESIGNS;
  // Fine, low-contrast marks: thin rules and narrow "title" lines, like small spine type.
  g.globalAlpha = 0.78;
  const band = (y: number, h: number) => g.fillRect(0, y, 64, h);
  const line = (y: number, h: number, w = 8) => g.fillRect(32 - w / 2, y, w, h);
  if (v === 0) {
    band(30, 3), band(38, 1.5), band(474, 1.5), band(480, 3);
    line(110, 190, 9), line(330, 60, 6);
  } else if (v === 1) {
    band(0, 46);
    line(130, 160, 8), line(330, 46, 6), line(456, 16, 14);
  } else if (v === 2) {
    line(70, 230, 10), line(330, 80, 6);
  } else {
    band(160, 1.5), band(320, 1.5);
    line(180, 120, 9), line(50, 50, 6), line(420, 40, 6);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Keep page edges cream while the cover/spine take the per-instance colour. */
function untinted(m: MeshStandardMaterial) {
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '');
  };
  m.customProgramCacheKey = () => 'untinted';
  return m;
}

/** Spine: instance colour first, then the typography mask on top in its own ink colour. */
function inkOverTint(m: MeshStandardMaterial) {
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <map_fragment>', '')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        #ifdef USE_MAP
          vec4 ink = texture2D( map, vMapUv );
          diffuseColor.rgb = mix( diffuseColor.rgb, ink.rgb, ink.a );
        #endif`,
      );
  };
  m.customProgramCacheKey = () => 'inkOverTint';
  return m;
}

/** Anonymous books: one instanced mesh per spine design (8 draw calls for ~800 books). */
function FillerBooks({ items }: { items: PlacedBook[] }) {
  const groups = useMemo(() => {
    const pages = untinted(new MeshStandardMaterial({ color: '#ece4d2', roughness: 0.9 }));
    const cover = new MeshStandardMaterial({ roughness: 0.72 });
    return Array.from({ length: PLAIN_SPINE + 1 }, (_, d) => {
      const spine = d === PLAIN_SPINE ? cover : inkOverTint(new MeshStandardMaterial({ map: spineDesign(d), roughness: 0.62 }));
      return { items: items.filter((b) => b.design === d), materials: [pages, spine, pages, pages, cover, cover] };
    }).filter((g) => g.items.length);
  }, [items]);
  return (
    <>
      {groups.map((g, i) => (
        <FillerGroup key={i} items={g.items} materials={g.materials} />
      ))}
    </>
  );
}

function FillerGroup({ items, materials }: { items: PlacedBook[]; materials: MeshStandardMaterial[] }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new Matrix4();
    const c = new Color();
    items.forEach((b, i) => {
      m.compose(new Vector3(b.x, b.y, b.z), new Quaternion().setFromEuler(new Euler(b.lean, 0, 0)), new Vector3(b.w, b.h, b.t));
      mesh.setMatrixAt(i, m);
      c.set(b.color).offsetHSL(0, 0, ((i * 37) % 11) / 140 - 0.04);
      mesh.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} material={materials} castShadow receiveShadow>
      <boxGeometry />
    </instancedMesh>
  );
}

function Bookends({ items }: { items: Bookend[] }) {
  return (
    <>
      {items.map((e, i) => (
        <group key={i} position={[e.x, e.y, e.z]}>
          <mesh position={[0, 0.07, 0.002]} castShadow>
            <boxGeometry args={[0.12, 0.14, 0.004]} />
            <meshStandardMaterial color="#141414" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.002, 0.04]}>
            <boxGeometry args={[0.12, 0.004, 0.08]} />
            <meshStandardMaterial color="#141414" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function spineTexture(record: BookRecord) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = Math.round((1024 * record.spine.thicknessCm) / record.spine.heightCm);
  const g = c.getContext('2d')!;
  g.fillStyle = record.spine.color;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = record.spine.textColor;
  g.textBaseline = 'middle';
  // Title fitted to the spine; author at the top end, like a real spine read bottom-to-top.
  let size = c.height * 0.46;
  g.font = `800 ${size}px ${SYSTEM_FONT}`;
  while (g.measureText(record.title.toUpperCase()).width > c.width * 0.62 && size > 8) {
    size -= 1;
    g.font = `800 ${size}px ${SYSTEM_FONT}`;
  }
  g.fillText(record.title.toUpperCase(), 50, c.height / 2);
  g.font = `600 ${c.height * 0.27}px ${SYSTEM_FONT}`;
  g.textAlign = 'right';
  g.fillText(record.author.toUpperCase(), c.width - 40, c.height / 2);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** A catalogue book: titled spine, hover pulls it out slightly (only once at the bookshelf). */
/** Front cover image (Open Library), or the spine colour if none is supplied. */
function useCover(record: BookRecord) {
  return useMemo(() => {
    if (!record.cover) return null;
    const t = new TextureLoader().load(`${import.meta.env.BASE_URL}${record.cover}`);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [record]);
}

function CatalogueBook({ book }: { book: PlacedBook & { record: BookRecord } }) {
  const coverMap = useCover(book.record);
  const ref = useRef<Group>(null);
  const atShelf = useExperience((s) => s.shot === 'bookshelf' && s.phase === 'exploring');
  const materials = useMemo(() => {
    const cover = new MeshStandardMaterial({ color: book.color, roughness: 0.6 });
    // Front cover is the +z face (spine on the reader's left). Shown when the book is extracted.
    const front = coverMap ? new MeshStandardMaterial({ map: coverMap, roughness: 0.55 }) : cover;
    const pages = new MeshStandardMaterial({ color: '#efe8d8', roughness: 0.9 });
    // The spine faces the room (-x). Its text runs bottom→top, rotated to read like a real spine.
    const spineMap = spineTexture(book.record);
    spineMap.center.set(0.5, 0.5);
    spineMap.rotation = Math.PI / 2;
    const spine = new MeshStandardMaterial({ map: spineMap, roughness: 0.55 });
    return [pages, spine, pages, pages, front, cover];
  }, [book, coverMap]);

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const hovered = useExperience.getState().hoveredBook === book.record.id;
    const target = hovered ? -0.06 : 0;
    g.position.x += (target - g.position.x) * Math.min(1, dt * 10);
  });

  const onOver = (e: { stopPropagation: () => void }) => {
    if (!atShelf) return;
    e.stopPropagation();
    useExperience.getState().setHoveredBook(book.record.id);
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    if (useExperience.getState().hoveredBook === book.record.id) useExperience.getState().setHoveredBook(null);
    document.body.style.cursor = '';
  };

  return (
    <group ref={ref}>
      <mesh
        position={[book.x, book.y, book.z]}
        scale={[book.w, book.h, book.t]}
        material={materials}
        castShadow
        onPointerOver={onOver}
        onPointerOut={onOut}
      >
        <boxGeometry />
      </mesh>
    </group>
  );
}

export function Bookshelf() {
  const { books: placed, bookends } = useMemo(() => arrangeShelf(), []);
  const fillers = useMemo(() => placed.filter((b) => !b.record), [placed]);
  const catalogue = useMemo(() => placed.filter((b): b is PlacedBook & { record: BookRecord } => !!b.record), [placed]);
  const shot = useExperience((s) => s.shot);

  return (
    <Interactive id="bookshelf" enabled={shot !== 'bookshelf'} onSelect={() => useExperience.getState().goTo('bookshelf')}>
      <Frame />
      <FillerBooks items={fillers} />
      <Bookends items={bookends} />
      {catalogue.map((b) => (
        <CatalogueBook key={b.record.id} book={b} />
      ))}
    </Interactive>
  );
}
