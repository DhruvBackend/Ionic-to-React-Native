// node parity/report.mjs  -> parity/out/report.html (ref | rn | diff, diff %, sign-off state)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { OUT, loadStates, shotName } from './lib/common.mjs';
import { readSignoff, SIGNOFF } from './signoff.mjs';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Compares two PNG files. Returns { diffPct, diffPng } or null if either file is missing. */
export function compare(refFile, rnFile, diffFile) {
  if (!fs.existsSync(refFile) || !fs.existsSync(rnFile)) {
    return null;
  }
  const a = PNG.sync.read(fs.readFileSync(refFile));
  const b = PNG.sync.read(fs.readFileSync(rnFile));
  if (a.width !== b.width || a.height !== b.height) {
    return { error: `size mismatch ${a.width}x${a.height} vs ${b.width}x${b.height}` };
  }
  const diff = new PNG({ width: a.width, height: a.height });
  const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
  fs.mkdirSync(path.dirname(diffFile), { recursive: true });
  fs.writeFileSync(diffFile, PNG.sync.write(diff));
  return { diffPct: (n / (a.width * a.height)) * 100 };
}

export function buildReport({ states, out = OUT, signoff = readSignoff() }) {
  const rows = states.map(s => {
    const name = shotName(s.id);
    const refFile = path.join(out, 'ref', name);
    const rnFile = path.join(out, 'rn', name);
    const diffFile = path.join(out, 'diff', name);
    const cmp = compare(refFile, rnFile, diffFile);
    const img = (f, rel) => (fs.existsSync(f) ? `<img loading="lazy" src="${rel}/${esc(name)}">` : '<div class="missing">missing</div>');
    const so = signoff[s.id];
    let pct = '<span class="missing">missing</span>';
    if (cmp && cmp.error) {
      pct = `<span class="fail">${esc(cmp.error)}</span>`;
    } else if (cmp) {
      pct = `${cmp.diffPct.toFixed(2)}%`;
    }
    const diffCell = cmp && !cmp.error ? img(diffFile, 'diff') : '<div class="missing">missing</div>';
    return `<section id="${esc(s.id)}">
<h2>${esc(s.id)} <small>${esc(s.screen)} / role ${esc(s.role)} / lang ${esc(s.lang)}</small></h2>
<p>diff: ${pct}
 | sign-off: <b class="${so ? esc(so.status) : ''}">${so ? `${so.status === 'ok' ? '[x] ok' : '[ ] FAIL'} ${esc(so.note)} (${esc(so.date)})` : '[ ] not signed off'}</b>
 | <code>node parity/signoff.mjs ${esc(s.id)} ok|fail "&lt;note&gt;"</code></p>
<div class="row"><figure>${img(refFile, 'ref')}<figcaption>ref (Ionic)</figcaption></figure>
<figure>${img(rnFile, 'rn')}<figcaption>rn</figcaption></figure>
<figure>${diffCell}<figcaption>diff</figcaption></figure></div></section>`;
  });
  const done = states.filter(s => signoff[s.id] && signoff[s.id].status === 'ok').length;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Parity report</title>
<style>body{font:14px sans-serif;margin:16px}.row{display:flex;gap:12px}figure{margin:0}img{width:320px;border:1px solid #ccc}
.missing{width:320px;height:80px;border:1px dashed #999;color:#999;display:flex;align-items:center;justify-content:center}
.ok{color:#080}.fail{color:#b00}small{color:#666;font-weight:normal}</style></head><body>
<h1>Parity report</h1><p>${states.length} states, ${done} signed off (state kept in <code>${esc(path.relative(process.cwd(), SIGNOFF))}</code>)</p>
${rows.join('\n')}</body></html>`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const html = buildReport({ states: loadStates() });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'report.html'), html);
  console.log(`wrote ${path.join(OUT, 'report.html')}`);
}
