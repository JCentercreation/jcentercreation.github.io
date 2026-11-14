import { useExperience } from '@/app/store';
import { MACBOOK } from '../layout';
import { Interactive, useIsHovered } from '../Interactive';
import { useScreenTexture } from '../screens/screenTextures';
import { LaptopModel } from './LaptopModel';

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
          bodyColor="#b4b6b9"
          screen={screen}
          glow={hovered ? 1.25 : 1.05}
          display={[0.955, 0.9]}
        />
      </group>
    </Interactive>
  );
}
