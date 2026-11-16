import { ContactShadows } from '@react-three/drei';
import { BOOKSHELF, DESK, DESK_OFFSET, ROOM } from '../layout';

/**
 * Contact shadows: the soft darkening where objects meet the floor, which the shadow maps (full tier
 * only, and lit from the lamp / window directions) do not provide.
 *
 * Each patch renders ONCE (frames=1): only static objects are inside its footprint and height, so no
 * moving object can leave a stale shadow behind —
 * - the bookshelf patch looks only 12 cm up, below every book (the lowest shelf top is at 13 cm);
 * - the car keeps its own baked contact shadow (Tesla.tsx) and is outside every patch;
 * - nothing that moves (books, driver's door) is inside the desk, shoe or tool-chest patches.
 *
 * Patches sit a few millimetres above the floor (and the rug) to avoid z-fighting, and are kept
 * subtle: a grounding cue, not a dark halo. They work on both tiers — on the reduced/mobile tier
 * they are the only ground shadows.
 */
const DESK_CENTRE = { x: DESK.x + DESK_OFFSET.x, z: DESK.z + DESK_OFFSET.z };

export function GroundContact() {
  const shelfDepth = BOOKSHELF.depth + 0.24;
  const shelfLength = BOOKSHELF.bays * BOOKSHELF.bayWidth + 0.2;
  return (
    <group>
      {/* Desk, pedestals, chair base and casters, cables — the rug is below this patch. */}
      <ContactShadows
        position={[DESK_CENTRE.x, 0.006, DESK_CENTRE.z + 0.45]}
        scale={[3.1, 2.1]}
        resolution={512}
        far={0.55}
        blur={2.2}
        opacity={0.55}
        frames={1}
      />
      {/* Bookshelf uprights and the bottom shelf, along the right wall. */}
      <ContactShadows
        position={[BOOKSHELF.x - shelfDepth / 2 + 0.02, 0.002, BOOKSHELF.zStart + shelfLength / 2 - 0.1]}
        scale={[shelfDepth, shelfLength]}
        resolution={512}
        far={0.12}
        blur={1.6}
        opacity={0.55}
        frames={1}
      />
      {/* Running shoes below the photograph. */}
      <ContactShadows position={[2.4, 0.002, -2.68]} scale={[0.7, 0.6]} resolution={256} far={0.14} blur={1.4} opacity={0.6} frames={1} />
      {/* Tool chest on its casters, by the left wall. */}
      <ContactShadows position={[ROOM.minX + 0.3, 0.002, -2.55]} scale={[0.75, 1.05]} resolution={256} far={0.3} blur={1.8} opacity={0.5} frames={1} />
    </group>
  );
}
