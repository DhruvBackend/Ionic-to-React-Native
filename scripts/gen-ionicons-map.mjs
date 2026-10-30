#!/usr/bin/env node
// Builds src/components/ionic/ionicons3.json (icon name → codepoint) from the stylesheet of
// ionicons@3.0.0, the exact version shipped in the Ionic app (its ionicons.woff/woff2 are
// byte-identical to the npm 3.0.0 files). Run once; the JSON is committed.
//
//   npm pack ionicons@3.0.0 && tar -xzf ionicons-3.0.0.tgz
//   node scripts/gen-ionicons-map.mjs package/dist/css/ionicons.css
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cssFile = process.argv[2];
if (!cssFile) {
  console.error('usage: gen-ionicons-map.mjs <ionicons.css>');
  process.exit(1);
}

const css = fs.readFileSync(cssFile, 'utf8');
const map = {};
// Each rule: "<selectors> { ... content: "\fXXX" ... }"; selectors may be a comma-separated group.
for (const rule of css.split('}')) {
  const [selectors, body] = rule.split('{');
  const content = body && body.match(/content:\s*"\\([0-9a-fA-F]+)"/);
  if (!content) continue;
  for (const sel of selectors.split(',')) {
    const name = sel.trim().match(/^\.ion-([a-z0-9-]+):before$/);
    if (name) map[name[1]] = parseInt(content[1], 16);
  }
}

const out = path.join(ROOT, 'src/components/ionic/ionicons3.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(map, Object.keys(map).sort(), 0) + '\n');
console.log(`gen-ionicons-map: ${Object.keys(map).length} icons → ${path.relative(ROOT, out)}`);
