import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import gsap from 'gsap';
import { bookPose, readingPose } from './bookMotion';
import { CanvasTexture, Color, TextureLoader, type Group, type InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, SRGBColorSpace, Euler, Vector3 } from 'three';
import { useExperience } from '@/app/store';
import type { BookRecord } from '@/content';
import { BOOKSHELF, ROOM } from '../layout';
import { mat, TILE } from '../materials/library';
import { bevelledBox } from '../environment/geometry';
import { markShadowsDirty } from '../shadows';
import { Interactive } from '../Interactive';
import { PLAIN_SPINE, SPINE_DESIGNS, arrangeShelf, type Bookend, type PlacedBook } from './arrangement';
import { SYSTEM_FONT } from '../screens/draw';

const LENGTH = BOOKSHELF.bays * BOOKSHELF.bayWidth;
const CENTER_Z = BOOKSHELF.zStart + LENGTH / 2;
const FRONT_X = BOOKSHELF.x - BOOKSHELF.depth;

function Frame() {
  // World-scale UVs: oak boards keep a 1 m tile along the 2.88 m shelves instead of stretching.
  const shelf = useMemo(() => bevelledBox(BOOKSHELF.depth, 0.03, LENGTH, 0.002, TILE.oak, 'z'), []);
  // Square steel tube uprights with the slightly rounded edges of a real section.
  const upright = useMemo(() => bevelledBox(0.03, ROOM.height, 0.03, 0.0015, 0.5, 'y'), []);
  const uprights: number[] = [];
  for (let b = 0; b <= BOOKSHELF.bays; b++) uprights.push(BOOKSHELF.zStart + b * BOOKSHELF.bayWidth);
  return (
    <group>
      {BOOKSHELF.shelfHeights.map((y) => (
        <group key={y}>
          <mesh position={[BOOKSHELF.x - BOOKSHELF.depth / 2, y + 0.015, CENTER_Z]} geometry={shelf} material={mat.oak()} castShadow receiveShadow />
        </group>
      ))}
      {/* Black steel frame, floor to ceiling. */}
      {uprights.map((z) =>
        [FRONT_X + 0.015, BOOKSHELF.x - 0.015].map((x) => (
          <mesh key={`${z}-${x}`} position={[x, ROOM.height / 2, z]} geometry={upright} material={mat.steel()} castShadow />
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
    const pages = untinted(new MeshStandardMaterial({ map: mat.pageEdges(), roughness: 0.9 }));
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
            <primitive object={mat.steel()} attach="material" />
          </mesh>
          <mesh position={[0, 0.002, 0.04]}>
            <boxGeometry args={[0.12, 0.004, 0.08]} />
            <primitive object={mat.steel()} attach="material" />
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

// Review tooling only (`?capture=1`): screen positions + displacement of each catalogue book.
const capture = new URLSearchParams(window.location.search).has('capture');
// `frame` stamps when each position was computed: in slow (software-rendered) review runs a camera move
// can finish between frames, so tools must wait for a frame computed after the camera arrived.
const debugBooks: Record<string, { x: number; y: number; displaced: boolean; t: number; frame: number }> = {};
if (capture) (window as unknown as { __books: typeof debugBooks }).__books = debugBooks;

/**
 * A catalogue book: titled spine; hover slides it out a couple of centimetres; selecting it takes it
 * off the shelf and turns the cover towards the camera (bookMotion.ts). Interactive only once the
 * camera has arrived at the bookshelf.
 */
function CatalogueBook({ book }: { book: PlacedBook & { record: BookRecord } }) {
  const id = book.record.id;
  const coverMap = useCover(book.record);
  const ref = useRef<Group>(null);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const atShelf = useExperience((s) => s.shot === 'bookshelf' && s.arrivedShot === 'bookshelf' && s.phase === 'exploring');
  const selected = useExperience((s) => s.selectedBook === id);
  const reduced = useExperience((s) => s.reducedMotion);
  const anim = useRef({ t: 0, hover: 0 });
  const lastPose = useRef({ x: 0, y: 0, z: 0, qw: 1, qx: 0, qy: 0 });
  const home = useMemo(() => new Vector3(book.x, book.y, book.z), [book]);
  const pose = useMemo(() => ({ position: new Vector3(), quaternion: new Quaternion() }), []);

  const materials = useMemo(() => {
    const cover = new MeshStandardMaterial({ color: book.color, roughness: 0.6 });
    // Front cover is the +z face (spine on the reader's left). While held, a faint emissive copy of
    // the cover keeps it legible in the dark room — no lights are added or changed.
    const front = coverMap
      ? new MeshStandardMaterial({ map: coverMap, emissiveMap: coverMap, emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.55 })
      : cover;
    const pages = new MeshStandardMaterial({ map: mat.pageEdges(), roughness: 0.9 });
    // The spine faces the room (-x). Its text runs bottom→top, rotated to read like a real spine.
    const spineMap = spineTexture(book.record);
    spineMap.center.set(0.5, 0.5);
    spineMap.rotation = Math.PI / 2;
    const spine = new MeshStandardMaterial({ map: spineMap, emissive: '#ffd9a8', emissiveIntensity: 0, roughness: 0.55 });
    return { list: [pages, spine, pages, pages, front, cover], front, spine };
  }, [book, coverMap]);

  // Take off / put back.
  useEffect(() => {
    const a = anim.current;
    const set = useExperience.getState().setBookHeld;
    if (!selected) set(false);
    const tween = gsap.to(a, {
      t: selected ? 1 : 0,
      duration: reduced ? 0.35 : selected ? 1.5 : 1.15,
      ease: 'power2.inOut',
      onComplete: () => {
        if (selected) set(true);
      },
    });
    return () => {
      tween.kill();
    };
  }, [selected, reduced]);

  useFrame((state, dt) => {
    const g = ref.current;
    if (!g) return;
    const a = anim.current;
    const s = useExperience.getState();
    const hovering = s.hoveredBook === id && !s.selectedBook;
    a.hover += ((hovering ? 1 : 0) - a.hover) * Math.min(1, dt * 9);
    if (a.t > 0) {
      readingPose(camera, size.width < 900 || size.height > size.width, pose);
      bookPose(a.t, home, book.w, pose, g.position, g.quaternion);
    } else {
      // In its slot; a subtle 2 cm slide towards the room on hover.
      g.position.set(home.x - a.hover * 0.02, home.y, home.z);
      g.quaternion.identity();
    }
    // Static shadow maps: re-render them while this book moves (hover slide, extraction, return).
    const last = lastPose.current;
    if (Math.abs(last.x - g.position.x) + Math.abs(last.y - g.position.y) + Math.abs(last.z - g.position.z) > 1e-5 || Math.abs(last.qw - g.quaternion.w) + Math.abs(last.qx - g.quaternion.x) + Math.abs(last.qy - g.quaternion.y) > 1e-6) {
      markShadowsDirty(2);
      last.x = g.position.x;
      last.y = g.position.y;
      last.z = g.position.z;
      last.qw = g.quaternion.w;
      last.qx = g.quaternion.x;
      last.qy = g.quaternion.y;
    }
    materials.spine.emissiveIntensity = a.hover * 0.07;
    if (materials.front !== materials.list[5]) materials.front.emissiveIntensity = Math.max(0, (a.t - 0.5) * 2) * 0.2;
    if (capture) {
      camera.updateMatrixWorld();
      const p = g.position.clone().project(camera);
      debugBooks[id] = { x: ((p.x + 1) / 2) * size.width, y: ((1 - p.y) / 2) * size.height, displaced: a.t > 0.001 || g.position.distanceTo(home) > 0.001, t: a.t, frame: state.clock.elapsedTime };
    }
  });

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (!atShelf || useExperience.getState().selectedBook) return;
    e.stopPropagation();
    useExperience.getState().setHoveredBook(id);
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    if (useExperience.getState().hoveredBook === id) useExperience.getState().setHoveredBook(null);
    document.body.style.cursor = '';
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!atShelf) return;
    e.stopPropagation();
    document.body.style.cursor = '';
    useExperience.getState().selectBook(id);
  };

  return (
    <group ref={ref} position={home}>
      <mesh scale={[book.w, book.h, book.t]} material={materials.list} castShadow onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
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
