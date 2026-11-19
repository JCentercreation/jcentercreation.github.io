#!/usr/bin/env node
/**
 * Inspect a candidate car model before integration.
 *   node scripts/inspect-model.mjs path/to/model.glb
 * Reports: node tree, door / interior candidates, triangle + material + texture budget, size in metres.
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { statSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/inspect-model.mjs <model.glb|model.gltf>');
  process.exit(1);
}
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(file);
const root = doc.getRoot();

const tris = (mesh) =>
  mesh.listPrimitives().reduce((n, p) => {
    const idx = p.getIndices();
    const pos = p.getAttribute('POSITION');
    return n + (idx ? idx.getCount() : pos ? pos.getCount() : 0) / 3;
  }, 0);

const DOOR = /door|porta|puerta|tür|portiere|dr_?(f|r)?_?(l|lf|fl)/i;
const INTERIOR = /int(erior)?[_ ]|seat|steer|wheel_?steer|dash|cockpit|console|pedal|carpet|screen/i;

let total = 0;
const doors = [];
const interior = [];
function walk(node, depth, parentPath) {
  const path = `${parentPath}/${node.getName() || '(unnamed)'}`;
  const mesh = node.getMesh();
  const t = mesh ? tris(mesh) : 0;
  total += t;
  if (depth < 6) console.log(`${'  '.repeat(depth)}${node.getName() || '(unnamed)'}${mesh ? `  [mesh ${Math.round(t)} tris]` : ''}`);
  if (DOOR.test(path)) doors.push({ path, tris: Math.round(t), translation: node.getTranslation().map((v) => +v.toFixed(3)) });
  if (INTERIOR.test(path) && mesh) interior.push({ path, tris: Math.round(t) });
  for (const c of node.listChildren()) walk(c, depth + 1, path);
}
console.log('=== Node tree (depth ≤ 6)');
for (const scene of root.listScenes()) for (const n of scene.listChildren()) walk(n, 0, '');

// Bounding box (rough, from accessor min/max with node translations ignored for nested transforms).
let min = [Infinity, Infinity, Infinity];
let max = [-Infinity, -Infinity, -Infinity];
for (const m of root.listMeshes())
  for (const p of m.listPrimitives()) {
    const a = p.getAttribute('POSITION');
    if (!a) continue;
    const lo = a.getMin([]);
    const hi = a.getMax([]);
    min = min.map((v, i) => Math.min(v, lo[i]));
    max = max.map((v, i) => Math.max(v, hi[i]));
  }

console.log('\n=== Budget');
console.log('file size      ', (statSync(file).size / 1e6).toFixed(1), 'MB');
console.log('triangles      ', Math.round(total));
console.log('meshes         ', root.listMeshes().length);
console.log('materials      ', root.listMaterials().length);
console.log('textures       ', root.listTextures().length);
for (const t of root.listTextures()) {
  const s = t.getSize();
  console.log(`   ${t.getName() || t.getURI() || '(texture)'}  ${s ? s.join('×') : '?'}  ${t.getMimeType()}  ${((t.getImage()?.byteLength ?? 0) / 1e6).toFixed(2)} MB`);
}
console.log('animations     ', root.listAnimations().length, root.listAnimations().map((a) => a.getName()));
console.log('skins (rig)    ', root.listSkins().length);
console.log('extent (local) ', max.map((v, i) => (v - min[i]).toFixed(2)).join(' × '), '(compare: Model 3 ≈ 4.72 L × 1.85 W × 1.44 H m)');

console.log('\n=== Door candidates (separate nodes matching door names)');
console.log(doors.length ? doors : '  none found by name — door may be merged into the body (would need splitting)');
console.log('\n=== Interior candidates');
console.log(interior.length ? interior.slice(0, 40) : '  none found by name — check visually');
