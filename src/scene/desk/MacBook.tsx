import { useExperience } from '@/app/store';
import { MACBOOK } from '../layout';
import { Interactive, useIsHovered } from '../Interactive';
import { useScreenTexture } from '../screens/screenTextures';
import { LaptopModel } from './LaptopModel';
import { macbookDeckTexture } from './deckTextures';
import { MacBookScreen } from './MacBookScreen';

/** MacBook Pro 14" (silver). Click → camera to the screen. */
export function MacBook() {
  const screen = useScreenTexture('notes');
  const hovered = useIsHovered('macbook');
  const shot = useExperience((s) => s.shot);
  return (
    <Interactive id="macbook" enabled={shot !== 'macbook'} onSelect={() => useExperience.getState().goTo('macbook')}>
      <group position={MACBOOK.position} rotation-y={MACBOOK.rotationY}>
        <LaptopModel
          width={MACBOOK.width}
          depth={MACBOOK.depth}
          thickness={MACBOOK.baseThickness}
          lidAngle={MACBOOK.lidAngle}
          bodyColor="#c2c4c7"
          screen={screen}
          glow={hovered ? 1.3 : 1.12}
          display={[0.955, 0.9]}
          deck={macbookDeckTexture()}
          notch
        >
          {/* Interactive portfolio, mapped onto the display (children render inside the lid). */}
          <MacBookScreen lidHeight={MACBOOK.depth * 0.985} displayWidth={0.955} />
        </LaptopModel>
        {/* Screen glow spilling onto the keyboard and desk — keeps the MacBook the focal point. */}
        <group position={[0, 0.12, -0.06]}>
          {/* Rect lights emit along -z: turn to face the user, tilted down onto the keyboard. */}
          <rectAreaLight rotation={[0.45, Math.PI, 0]} width={0.28} height={0.17} intensity={2.2} color="#eef2ff" />
        </group>
      </group>
    </Interactive>
  );
}
