/**
 * Boot milestones shown on the MacBook while the garage loads. Each one completes on a real event:
 * - engine     — the 3D engine chunk arrived and the MacBook's first frame rendered;
 * - room … storm — that part of the scene was mounted (its procedural textures generated) and rendered;
 * - materials  — every shader variant compiled (gl.compileAsync, on- and off-screen);
 * - reflections — the one-off room reflection capture finished.
 * Progress = completed milestones / total. 100 % only after the last one: no simulated increments.
 */
export const BOOT_STEPS = ['engine', 'room', 'workspace', 'library', 'car', 'storm', 'materials', 'reflections'] as const;
export type BootStep = (typeof BOOT_STEPS)[number];
/** Number of scene-mounting stages (engine … storm). */
export const SCENE_STAGES = 6;
