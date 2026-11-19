// Remove byte-identical, unreferenced design exports; keep runtime URLs stable.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function files(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) return [];
    return entry.isDirectory() ? files(full) : [full];
  });
}
const relative = file => path.relative(root, file).split(path.sep).join('/');
const source = files(path.join(root, 'src'))
  .filter(file => /\.(tsx?|jsx?|css|json|md)$/.test(file))
  .map(file => fs.readFileSync(file, 'utf8')).join('\n');
const groups = new Map();
for (const file of [...files(path.join(root, 'public/images')), ...files(path.join(root, 'assets'))]) {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  groups.set(hash, [...(groups.get(hash) || []), file]);
}
const removed = [];
for (const [hash, group] of groups) {
  if (group.length < 2) continue;
  // Public files come first; otherwise keep the shallowest export path.
  group.sort((a, b) => Number(!relative(a).startsWith('public/')) - Number(!relative(b).startsWith('public/')) || relative(a).split('/').length - relative(b).split('/').length || a.localeCompare(b));
  const canonical = group[0];
  for (const duplicate of group.slice(1)) {
    const name = relative(duplicate);
    if (!name.startsWith('assets/') || source.includes(name) || source.includes(name.slice(7))) continue;
    removed.push({ removed: name, retained: relative(canonical), sha256: hash, bytes: fs.statSync(duplicate).size });
  }
}
if (process.argv.includes('--apply') && removed.length) {
  const manifest = path.join(root, 'docs/asset-deduplication.json');
  const previous = fs.existsSync(manifest) ? JSON.parse(fs.readFileSync(manifest, 'utf8')) : [];
  const assetsRoot = fs.realpathSync(path.join(root, 'assets')) + path.sep;
  // Validate the entire plan before deleting any individual file.
  for (const item of removed) {
    const duplicate = fs.realpathSync(path.join(root, item.removed));
    if (!duplicate.startsWith(assetsRoot)) throw new Error('Asset outside workspace: ' + duplicate);
    for (const file of [item.removed, item.retained]) {
      const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
      if (hash !== item.sha256) throw new Error('Asset changed during audit: ' + file);
    }
  }
  fs.mkdirSync(path.dirname(manifest), { recursive: true });
  fs.writeFileSync(manifest, JSON.stringify([...previous, ...removed], null, 2) + '\n');
  for (const item of removed) fs.unlinkSync(path.join(root, item.removed));
}
console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'preview', duplicates: removed.length, bytes: removed.reduce((sum, item) => sum + item.bytes, 0), ...(process.argv.includes('--verbose') ? { files: removed } : {}) }, null, 2));
