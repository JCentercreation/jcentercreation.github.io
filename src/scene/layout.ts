import { Euler, Matrix4, Vector3 } from 'three';
import type { ShotId } from '@/content';

/**
 * World layout of the garage, in metres. y is up; the window wall is at -z and the
 * overview camera looks towards it. Every scene module positions itself from here and
 * every camera shot is derived from here, so moving an object moves its shot with it.
 */

export const ROOM = {
  minX: -5.6,
  maxX: 5.0,
  minZ: -4.5,
  maxZ: 4.8,
  height: 3.6,
  wallThickness: 0.35,
};

export const WINDOW = { centerX: 0.45, sill: 1.0, width: 3.7, height: 1.95, cols: 4, rows: 3 };

export const DESK = { x: 0.45, z: -3.78, width: 1.9, depth: 0.82, height: 0.76 };
const top = DESK.height;

/** MacBook Pro 14": base 312.6 × 221.2 mm, lid opened ~110°. */
export const MACBOOK = {
  position: new Vector3(0.38, top + 0.006, -3.74),
  rotationY: 0.04,
  width: 0.3126,
  depth: 0.2212,
  baseThickness: 0.0155,
  lidAngle: 0.36, // radians the lid leans back from vertical
};

/** iPad Pro 13" lying flat, landscape. */
/**
 * Apple Studio Display 27" on the tilt-adjustable stand: enclosure 623 × 362 × 30 mm,
 * overall height 478 mm, foot 168 mm deep. Sits behind the MacBook, never in front of it.
 */
export const STUDIO_DISPLAY = {
  position: new Vector3(0.42, top, -4.06), // centre of the screen's front face (x, desk top, z)
  width: 0.6227,
  height: 0.3623,
  depth: 0.03,
  /** Bottom edge of the enclosure above the desk. */
  lift: 0.116,
  tilt: 0.06, // radians, leaning back slightly
};

/** Magic Keyboard + Magic Trackpad, to the right of the MacBook, in front of the display. */
export const KEYBOARD = { position: new Vector3(0.8, top, -3.6), rotationY: -0.05 };
export const TRACKPAD = { position: new Vector3(1.04, top, -3.6), rotationY: -0.05 };

export const IPAD = {
  position: new Vector3(1.16, top + 0.006, -3.9),
  rotationY: -0.12,
  width: 0.2816,
  depth: 0.2155,
  thickness: 0.0051,
};

export const BOOKSHELF = {
  /** Back of the shelf touches the right wall. */
  x: ROOM.maxX - 0.02,
  depth: 0.36,
  zStart: -4.25,
  bays: 4,
  bayWidth: 0.96,
  shelfHeights: [0.1, 0.52, 0.94, 1.36, 1.78, 2.2, 2.62, 3.04],
};

/** Car local frame: +X forward, +Y up, driver (left-hand drive) on -Z. */
export const CAR = {
  position: new Vector3(-3.1, 0, -1.45),
  /** Nose turned slightly towards the front-left corner so the driver side faces the room. */
  rotationY: -Math.PI / 2 - 0.25,
  /** Driver door opening in car-local x. */
  doorFront: 1.0,
  doorRear: -0.2,
  /** Laptop on the driver seat, car-local. */
  laptop: new Vector3(0.12, 0.525, -0.34),
};

export const POSTER = { position: new Vector3(-2.05, 1.72, ROOM.minZ + 0.012), width: 0.61, height: 0.91 };

// ---------------------------------------------------------------- shots

export interface Shot {
  position: Vector3;
  target: Vector3;
  /** Vertical FOV at a 16:9 reference aspect; narrower screens widen it to keep the same horizontal framing. */
  fov: number;
  /** Small pointer-driven parallax is allowed on wide shots, never on screen close-ups. */
  parallax: boolean;
}

function macbookScreen() {
  const m = MACBOOK;
  const hinge = new Vector3(0, m.baseThickness, -m.depth / 2);
  const up = new Vector3(0, Math.cos(m.lidAngle), -Math.sin(m.lidAngle));
  const normal = new Vector3(0, Math.sin(m.lidAngle), Math.cos(m.lidAngle));
  const centre = hinge.clone().addScaledVector(up, 0.103);
  const rot = new Matrix4().makeRotationY(m.rotationY);
  return {
    centre: centre.applyMatrix4(rot).add(m.position),
    normal: normal.applyMatrix4(rot),
  };
}

export function carLocalToWorld(local: Vector3): Vector3 {
  const m = new Matrix4().makeRotationFromEuler(new Euler(0, CAR.rotationY, 0)).setPosition(CAR.position);
  return local.clone().applyMatrix4(m);
}

function carDirToWorld(dir: Vector3): Vector3 {
  return dir.clone().applyEuler(new Euler(0, CAR.rotationY, 0));
}

const screen = macbookScreen();
// The laptop sits rotated 180° on the seat so its screen faces out of the door opening.
const laptopScreen = carLocalToWorld(CAR.laptop.clone().add(new Vector3(0, 0.112, 0.15)));
const laptopOut = carDirToWorld(new Vector3(-0.05, 0.34, -0.94).normalize());
const ipadCentre = IPAD.position.clone().add(new Vector3(0, IPAD.thickness, 0));
const carCentre = CAR.position.clone().add(new Vector3(0, 0.7, 0));

export const SHOTS: Record<ShotId, Shot> = {
  macbookIntro: {
    position: screen.centre.clone().addScaledVector(screen.normal, 0.3),
    target: screen.centre,
    fov: 38,
    parallax: false,
  },
  overview: {
    position: new Vector3(0.3, 1.68, 4.35),
    target: new Vector3(-0.15, 1.02, -1.6),
    fov: 58,
    parallax: true,
  },
  desk: {
    position: new Vector3(0.55, 1.42, -2.15),
    target: new Vector3(0.5, 0.86, -3.85),
    fov: 46,
    parallax: true,
  },
  macbook: {
    position: screen.centre.clone().addScaledVector(screen.normal, 0.36),
    target: screen.centre,
    fov: 40,
    parallax: false,
  },
  ipad: {
    // Almost perpendicular to the screen, a touch towards the viewer so "up" stays stable.
    // Offset follows the iPad's own yaw so the screen sits square in frame.
    position: ipadCentre.clone().add(new Vector3(0, 0.37, 0.045).applyAxisAngle(new Vector3(0, 1, 0), IPAD.rotationY)),
    target: ipadCentre,
    fov: 40,
    parallax: false,
  },
  bookshelf: {
    // Close enough that the catalogue spines (eye level, middle bays) are legible.
    position: new Vector3(BOOKSHELF.x - 2.35, 1.6, -1.35),
    target: new Vector3(BOOKSHELF.x, 1.5, -2.45),
    fov: 50,
    parallax: true,
  },
  tesla: {
    position: new Vector3(-0.2, 1.6, 2.1),
    target: carCentre,
    fov: 46,
    parallax: true,
  },
  teslaLaptop: {
    position: laptopScreen.clone().addScaledVector(laptopOut, 0.36),
    target: laptopScreen,
    fov: 40,
    parallax: false,
  },
};
