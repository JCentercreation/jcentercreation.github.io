import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, Color, type Group, type InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, SRGBColorSpace, Euler, Vector3 } from 'three';
import { useExperience } from '@/app/store';
import type { BookRecord } from '@/content';
import { BOOKSHELF, ROOM } from '../layout';
import { oakWood } from '../materials/proceduralTextures';
import { Interactive } from '../Interactive';
import { arrangeShelf, type PlacedBook } from './arrangement';
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
          {/* Warm LED strip under the front lip of each shelf above floor level. */}
          {y > 0.3 && (
            <mesh position={[FRONT_X + 0.03, y - 0.002, CENTER_Z]}>
              <boxGeometry args={[0.012, 0.004, LENGTH - 0.04]} />
              <meshStandardMaterial color="#000" emissive="#ffb35c" emissiveIntensity={3} toneMapped={false} />
            </mesh>
          )}
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

/** All anonymous books in one instanced draw call. */
function FillerBooks({ items }: { items: PlacedBook[] }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new Matrix4();
    const c = new Color();
    items.forEach((b, i) => {
      m.compose(new Vector3(b.x, b.y, b.z), new Quaternion().setFromEuler(new Euler(b.tilt, 0, 0)), new Vector3(b.w, b.h, b.t));
      mesh.setMatrixAt(i, m);
      c.set(b.color).offsetHSL(0, 0, ((i * 37) % 11) / 110 - 0.05);
      mesh.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} castShadow receiveShadow>
      <boxGeometry />
      <meshStandardMaterial roughness={0.78} />
    </instancedMesh>
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
  g.font = `700 ${c.height * 0.36}px ${SYSTEM_FONT}`;
  g.fillText(record.title.toUpperCase(), 60, c.height / 2);
  g.font = `500 ${c.height * 0.26}px ${SYSTEM_FONT}`;
  g.textAlign = 'right';
  g.fillText(record.author, c.width - 50, c.height / 2);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** A catalogue book: titled spine, hover pulls it out slightly (only once at the bookshelf). */
function CatalogueBook({ book }: { book: PlacedBook & { record: BookRecord } }) {
  const ref = useRef<Group>(null);
  const atShelf = useExperience((s) => s.shot === 'bookshelf' && s.phase === 'exploring');
  const materials = useMemo(() => {
    const cover = new MeshStandardMaterial({ color: book.color, roughness: 0.6 });
    const pages = new MeshStandardMaterial({ color: '#efe8d8', roughness: 0.9 });
    // The spine faces the room (-x). Its text runs bottom→top, rotated to read like a real spine.
    const spineMap = spineTexture(book.record);
    spineMap.center.set(0.5, 0.5);
    spineMap.rotation = Math.PI / 2;
    const spine = new MeshStandardMaterial({ map: spineMap, roughness: 0.55 });
    return [pages, spine, pages, pages, cover, cover];
  }, [book]);

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
  const placed = useMemo(() => arrangeShelf(), []);
  const fillers = useMemo(() => placed.filter((b) => !b.record), [placed]);
  const catalogue = useMemo(() => placed.filter((b): b is PlacedBook & { record: BookRecord } => !!b.record), [placed]);
  const shot = useExperience((s) => s.shot);

  return (
    <Interactive id="bookshelf" enabled={shot !== 'bookshelf'} onSelect={() => useExperience.getState().goTo('bookshelf')}>
      <Frame />
      <FillerBooks items={fillers} />
      {catalogue.map((b) => (
        <CatalogueBook key={b.record.id} book={b} />
      ))}
    </Interactive>
  );
}
