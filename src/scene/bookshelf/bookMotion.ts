import { MathUtils, Quaternion, Vector3, type Camera } from 'three';

/**
 * Pose of a catalogue book while it is taken off the shelf.
 * t: 0 = in its slot · 0→0.3 slides straight out of the shelf · 0.3→1 arcs to the reading pose
 * in front of the camera while turning its front cover (+z face) towards the viewer.
 * The same function runs backwards when the book is put back, so it always returns exactly home.
 */

const smooth = (x: number) => x * x * (3 - 2 * x);
const PULL_END = 0.3;

export interface ReadingPose {
  position: Vector3;
  quaternion: Quaternion;
}

/**
 * Phones and portrait screens hold the book higher and centred, with the info card below it. Short
 * landscape screens (phones held sideways) have no room below the book, so they use the side-by-side
 * layout instead: book left of centre, card beside it. Must match the CSS in BookPanel.module.css.
 */
export function holdBookCentred(width: number, height: number) {
  const shortLandscape = width > height && height <= 500;
  return !shortLandscape && (width < 900 || height > width);
}

/** Comfortable reading pose relative to the live camera; narrow screens hold the book higher, centred. */
export function readingPose(camera: Camera, narrow: boolean, out: ReadingPose): ReadingPose {
  const fwd = new Vector3();
  camera.getWorldDirection(fwd);
  const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const up = new Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  out.position
    .copy(camera.position)
    .addScaledVector(fwd, narrow ? 0.62 : 0.58)
    .addScaledVector(right, narrow ? 0 : -0.075)
    .addScaledVector(up, narrow ? 0.07 : 0.005);
  // Cover parallel to the screen, turned a few degrees so it reads as held, not pasted.
  // Turned ~13° and tipped back slightly, so the page edges and thickness read.
  const turn = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), narrow ? 0.12 : 0.23);
  const tip = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -0.07);
  out.quaternion.copy(camera.quaternion).multiply(turn).multiply(tip);
  return out;
}

export function bookPose(
  t: number,
  home: Vector3,
  depth: number,
  reading: ReadingPose,
  outPos: Vector3,
  outQuat: Quaternion,
) {
  // Slot is along the shelf; the room is towards -x.
  const pulled = new Vector3(home.x - (depth * 0.62 + 0.025), home.y + 0.008, home.z);
  if (t <= PULL_END) {
    outPos.lerpVectors(home, pulled, smooth(t / PULL_END));
    outQuat.identity();
    return;
  }
  const k = smooth((t - PULL_END) / (1 - PULL_END));
  outPos.lerpVectors(pulled, reading.position, k);
  // A gentle lift mid-flight so the book never skims the shelf edge.
  outPos.y += Math.sin(Math.PI * k) * 0.06;
  outQuat.identity().slerp(reading.quaternion, k);
}

export const clamp01 = (x: number) => MathUtils.clamp(x, 0, 1);
