// node parity/signoff.mjs <id> ok|fail "<note>"   updates parity/signoff.json (committed)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PARITY_DIR } from './lib/common.mjs';

export const SIGNOFF = path.join(PARITY_DIR, 'signoff.json');

export function readSignoff(file = SIGNOFF) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
}

export function setSignoff(id, status, note = '', file = SIGNOFF) {
  if (status !== 'ok' && status !== 'fail') {
    throw new Error('status must be ok or fail');
  }
  const all = readSignoff(file);
  all[id] = { status, note, date: new Date().toISOString().slice(0, 10) };
  const sorted = Object.fromEntries(Object.entries(all).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [id, status, note] = process.argv.slice(2);
  if (!id || !status) {
    console.error('usage: node parity/signoff.mjs <id> ok|fail "<note>"');
    process.exit(1);
  }
  setSignoff(id, status, note || '');
  console.log(`${id}: ${status}`);
}
