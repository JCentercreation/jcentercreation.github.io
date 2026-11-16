import { useExperience } from '@/app/store';
import { CameraController } from './camera/CameraController';
import { ShadowUpdater } from './shadows';
import { GroundContact } from './environment/GroundContact';
import { Effects } from './Effects';
import { Lighting } from './Lighting';
import { Bookshelf } from './bookshelf/Bookshelf';
import { RunningShoes } from './decor/RunningShoes';
import { FramedPhoto } from './decor/FramedPhoto';
import { DeskArea } from './desk/DeskArea';
import { Outside } from './environment/Outside';
import { Room } from './environment/Room';
import { StormController } from './environment/storm';
import { WindowGlass } from './environment/WindowGlass';
import { Tesla } from './tesla/Tesla';
import { Workshop } from './tesla/Workshop';

/**
 * The Engineer's Garage — visual prototype (reference-render pass: compact timber garage, dark cinematic lighting).
 * Each area is an independent module positioned from layout.ts, so any provisional model
 * can be swapped for a final GLB without touching the others.
 */
export function GarageScene() {
  const full = useExperience((s) => s.capabilities.tier === 'full');
  return (
    <>
      <color attach="background" args={['#020305']} />
      <fog attach="fog" args={['#050608', 7, 22]} />
      <StormController />
      <Lighting />
      <ShadowUpdater />

      <Room />
      <Outside />
      <WindowGlass />

      <DeskArea />
      <Bookshelf />
      <Tesla />
      <Workshop />
      <FramedPhoto />
      <RunningShoes />
      <GroundContact />

      <CameraController />
      {full && <Effects />}
    </>
  );
}
