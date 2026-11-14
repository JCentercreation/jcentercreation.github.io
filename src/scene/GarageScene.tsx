import { useExperience } from '@/app/store';
import { CameraController } from './camera/CameraController';
import { Effects } from './Effects';
import { Lighting } from './Lighting';
import { Bookshelf } from './bookshelf/Bookshelf';
import { RunningShoes } from './decor/RunningShoes';
import { Poster } from './decor/Poster';
import { DeskArea } from './desk/DeskArea';
import { Outside } from './environment/Outside';
import { Room } from './environment/Room';
import { StormController } from './environment/storm';
import { WindowGlass } from './environment/WindowGlass';
import { Tesla } from './tesla/Tesla';
import { Workshop } from './tesla/Workshop';

/**
 * The Engineer's Garage — Phase 2 visual prototype.
 * Each area is an independent module positioned from layout.ts, so any provisional model
 * can be swapped for a final GLB without touching the others.
 */
export function GarageScene() {
  const full = useExperience((s) => s.capabilities.tier === 'full');
  return (
    <>
      <color attach="background" args={['#020305']} />
      <StormController />
      <Lighting />

      <Room />
      <Outside />
      <WindowGlass />

      <DeskArea />
      <Bookshelf />
      <Tesla />
      <Workshop />
      <Poster />
      <RunningShoes />

      <CameraController />
      {full && <Effects />}
    </>
  );
}
