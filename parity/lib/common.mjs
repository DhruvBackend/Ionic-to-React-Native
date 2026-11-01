// Shared helpers for the parity scripts (plain ESM, no dependencies).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PARITY_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO = path.resolve(PARITY_DIR, '..');
export const OUT = path.join(PARITY_DIR, 'out');
export const FIXTURES = path.join(REPO, 'src', 'api', 'fixtures');

/** states.json (array) plus every parity/states.d/*.json (array). Ids must be unique. */
export function loadStates(dir = PARITY_DIR) {
  const files = [path.join(dir, 'states.json')];
  const d = path.join(dir, 'states.d');
  if (fs.existsSync(d)) {
    for (const f of fs.readdirSync(d).sort()) {
      if (f.endsWith('.json')) {
        files.push(path.join(d, f));
      }
    }
  }
  const states = [];
  for (const f of files) {
    if (!fs.existsSync(f)) {
      continue;
    }
    const arr = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (!Array.isArray(arr)) {
      throw new Error(`${f}: expected a JSON array of states`);
    }
    states.push(...arr);
  }
  const seen = new Set();
  for (const s of states) {
    if (!s.id) {
      throw new Error('state without id');
    }
    if (seen.has(s.id)) {
      throw new Error(`duplicate state id ${s.id}`);
    }
    seen.add(s.id);
  }
  return states;
}

/** --only <id>: exact id, or a prefix when it ends with "." or "*" (e.g. "_components."). */
export function selectStates(states, only) {
  if (!only) {
    return states;
  }
  const prefix = only.replace(/\*$/, '');
  const isPrefix = only.endsWith('.') || only.endsWith('*');
  return states.filter(s => s.id === only || (isPrefix && s.id.startsWith(prefix)));
}

export function parseArgs(argv) {
  const a = { only: null, serial: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--only') {
      a.only = argv[++i];
    } else if (argv[i] === '-s') {
      a.serial = argv[++i];
    }
  }
  return a;
}

export const shotName = id => id.replace(/[^A-Za-z0-9._-]/g, '_') + '.png';
