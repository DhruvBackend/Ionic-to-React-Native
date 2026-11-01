// node --test parity/report.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PNG } from 'pngjs';
import { loadStates, shotName } from './lib/common.mjs';
import { buildReport } from './report.mjs';
import { setSignoff, readSignoff } from './signoff.mjs';
import { buildLink, cropFor } from './capture-rn.mjs';

const png = (w, h, rgba) => {
  const p = new PNG({ width: w, height: h });
  for (let i = 0; i < w * h; i++) {
    p.data.set(rgba, i * 4);
  }
  return PNG.sync.write(p);
};

test('report lists every state and marks missing images', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-'));
  const states = loadStates();
  assert.ok(states.length >= 2);
  const html = buildReport({ states, out, signoff: {} });
  for (const s of states) {
    assert.ok(html.includes(`id="${s.id}"`), `lists ${s.id}`);
  }
  assert.equal((html.match(/class="missing"/g) || []).length, states.length * 4);
});

test('report diffs images that exist on both sides', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-'));
  const states = [{ id: 'X.default', screen: 'X', role: null, lang: 'en' }];
  fs.mkdirSync(path.join(out, 'ref'));
  fs.mkdirSync(path.join(out, 'rn'));
  fs.writeFileSync(path.join(out, 'ref', shotName('X.default')), png(10, 10, [255, 255, 255, 255]));
  fs.writeFileSync(path.join(out, 'rn', shotName('X.default')), png(10, 10, [0, 0, 0, 255]));
  const html = buildReport({ states, out, signoff: { 'X.default': { status: 'ok', note: 'fine', date: '2026-11-01' } } });
  assert.match(html, /diff: 100\.00%/);
  assert.match(html, /\[x\] ok fine/);
  assert.ok(fs.existsSync(path.join(out, 'diff', 'X.default.png')));
});

test('signoff.mjs writes sorted json', () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'parity-')), 'signoff.json');
  setSignoff('B.default', 'fail', 'gap', f);
  setSignoff('A.default', 'ok', '', f);
  assert.deepEqual(Object.keys(readSignoff(f)), ['A.default', 'B.default']);
  assert.throws(() => setSignoff('A', 'maybe', '', f));
});

test('capture-rn builds the debug deep link and crop', () => {
  const link = buildLink({ screen: 'Otp', role: 'Karigar', lang: 'hin', variants: { 'a/b': 'empty' }, params: { m: '9' } });
  assert.equal(link, 'topbathrn://open?screen=Otp&role=Karigar&lang=hin&variant=a%2Fb%3Aempty&params=%7B%22m%22%3A%229%22%7D');
  assert.deepEqual(cropFor({ api: 36, density: 420, insets: { top: 63 } }), { top: 0, bottom: 0 });
  assert.deepEqual(cropFor({ api: 33, density: 420, insets: { top: 63, bottom: 0 } }), { top: 63, bottom: 0 });
});
