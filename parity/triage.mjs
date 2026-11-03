// Token-saving triage of Ionic-vs-RN capture pairs (docs/TOKEN-POLICY.md, point 1).
//
// For every parity/out/rn/<id>.png that has a parity/out/ref/<id>.png:
//   - diff % above --threshold  -> one CROPPED side-by-side image (ref | rn) of the
//     region that differs, at reduced scale: parity/out/triage/<id>.png
//   - diff % at/below threshold -> a small thumbnail on a contact sheet
//     (parity/out/triage/_ok-<n>.png, 4 x 3 pairs per sheet) so a reviewer can still
//     confirm both sides show the SAME STATE (S6: diff % alone is not proof)
//   - size mismatch / missing ref -> listed only
// Prints one short line per pair and writes parity/out/triage/triage.json.
//
// Usage: node parity/triage.mjs [--only Home.,Offers.] [--threshold 1] [--max-width 900]
//        [--mask-top 96] [--mask-bottom 84]   (device px ignored: status bar / gesture bar)
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const only = (opt('only', '') || '').split(',').filter(Boolean);
const threshold = parseFloat(opt('threshold', '1'));
const maxWidth = parseInt(opt('max-width', '900'), 10);
// Phone status bar (top) and gesture bar (bottom) always differ from the Chrome reference.
const maskTop = parseInt(opt('mask-top', '96'), 10);
const maskBottom = parseInt(opt('mask-bottom', '84'), 10);
const root = path.resolve('parity/out');
const outDir = path.join(root, 'triage');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const read = p => PNG.sync.read(fs.readFileSync(p));
const ids = fs
  .readdirSync(path.join(root, 'rn'))
  .filter(f => f.endsWith('.png'))
  .map(f => f.slice(0, -4))
  .filter(id => !only.length || only.some(o => id.startsWith(o)))
  .sort();

// Copy a (sx,sy,w,h) region of src into dst at (dx,dy), downscaled by integer step s.
function blit(src, sx, sy, w, h, dst, dx, dy, s) {
  for (let y = 0; y < Math.floor(h / s); y++) {
    for (let x = 0; x < Math.floor(w / s); x++) {
      const si = ((sy + y * s) * src.width + (sx + x * s)) * 4;
      const di = ((dy + y) * dst.width + (dx + x)) * 4;
      if (dx + x >= dst.width || dy + y >= dst.height) continue;
      src.data.copy(dst.data, di, si, si + 4);
    }
  }
}
function vline(dst, x, color = [255, 0, 0]) {
  for (let y = 0; y < dst.height; y++) {
    const i = (y * dst.width + x) * 4;
    dst.data[i] = color[0]; dst.data[i + 1] = color[1]; dst.data[i + 2] = color[2]; dst.data[i + 3] = 255;
  }
}

const rows = [];
const okPairs = [];
for (const id of ids) {
  const refP = path.join(root, 'ref', `${id}.png`);
  if (!fs.existsSync(refP)) { rows.push({ id, status: 'NOREF' }); continue; }
  const a = read(refP);
  const b = read(path.join(root, 'rn', `${id}.png`));
  if (a.width !== b.width || a.height !== b.height) {
    rows.push({ id, status: 'SIZE', note: `${a.width}x${a.height} vs ${b.width}x${b.height}` });
    continue;
  }
  const { width: W, height: H } = a;
  const diff = new PNG({ width: W, height: H });
  pixelmatch(a.data, b.data, diff.data, W, H, { threshold: 0.1 });
  const isDiff = i => diff.data[i] === 255 && diff.data[i + 1] === 0 && diff.data[i + 2] === 0;
  let n = 0;
  for (let y = maskTop; y < H - maskBottom; y++) for (let x = 0; x < W; x++) if (isDiff((y * W + x) * 4)) n++;
  const pct = (n / (W * (H - maskTop - maskBottom))) * 100;
  if (pct <= threshold) { rows.push({ id, status: 'OK', pct }); okPairs.push({ id, refP, rnP: path.join(root, 'rn', `${id}.png`), w: W, h: H }); continue; }

  // Rows that really differ (pixelmatch paints diff pixels red: 255,0,0). A row counts
  // when >= MIN_ROW pixels differ, so stray anti-aliasing pixels do not stretch the crop.
  const MIN_ROW = 4, GAP_MERGE = 90, pad = 48;
  const hot = [];
  for (let y = maskTop; y < H - maskBottom; y++) {
    let c = 0;
    for (let x = 0; x < W; x++) if (isDiff((y * W + x) * 4)) c++;
    if (c >= MIN_ROW) hot.push(y);
  }
  // Group hot rows into bands, merging gaps < GAP_MERGE, then pad.
  let bands = [];
  for (const y of hot) {
    const last = bands[bands.length - 1];
    if (last && y - last[1] < GAP_MERGE) last[1] = y; else bands.push([y, y]);
  }
  bands = bands.map(([s0, s1]) => [Math.max(0, s0 - pad), Math.min(H, s1 + pad)]);
  for (let i = bands.length - 1; i > 0; i--) if (bands[i][0] <= bands[i - 1][1]) { bands[i - 1][1] = bands[i][1]; bands.splice(i, 1); }
  if (!bands.length) bands = [[0, H]];
  // Keep full width (layout context); stack the differing bands with a blue gap line.
  const s = Math.max(1, Math.ceil((W * 2 + 8) / maxWidth));
  const pw = Math.floor(W / s);
  const bh = bands.map(([s0, s1]) => Math.floor((s1 - s0) / s));
  const out = new PNG({ width: pw * 2 + 8, height: bh.reduce((t, h) => t + h + 4, 0) });
  out.data.fill(255);
  let oy = 0;
  bands.forEach(([s0, s1], k) => {
    blit(a, 0, s0, W, s1 - s0, out, 0, oy, s);
    blit(b, 0, s0, W, s1 - s0, out, pw + 8, oy, s);
    oy += bh[k];
    for (let x = 0; x < out.width; x++) { const i = ((oy + 1) * out.width + x) * 4; out.data[i] = 0; out.data[i + 1] = 0; out.data[i + 2] = 255; out.data[i + 3] = 255; }
    oy += 4;
  });
  vline(out, pw + 4);
  const file = path.join(outDir, `${id}.png`);
  fs.writeFileSync(file, PNG.sync.write(out));
  const crop = bands.map(([s0, s1]) => `${s0}-${s1}`).join(',');
  const kept = bands.reduce((t, [s0, s1]) => t + s1 - s0, 0);
  rows.push({ id, status: 'DIFF', pct, crop: `y ${crop} (${Math.round((kept / H) * 100)}% of height)`, file: path.relative(process.cwd(), file) });
}

// Contact sheets for the low-diff pairs: 4 columns x 3 rows, each pair = ref|rn at 1/6.
const sheets = [];
const S = 6, COLS = 4, ROWS = 3, GAP = 6;
for (let k = 0; k < okPairs.length; k += COLS * ROWS) {
  const chunk = okPairs.slice(k, k + COLS * ROWS);
  const tw = Math.floor(chunk[0].w / S), th = Math.floor(chunk[0].h / S);
  const cellW = tw * 2 + GAP * 2, cellH = th + GAP;
  const sheet = new PNG({ width: cellW * COLS, height: cellH * Math.ceil(chunk.length / COLS) });
  sheet.data.fill(255);
  chunk.forEach((p, j) => {
    const a = read(p.refP), b = read(p.rnP); // re-read: keeping 1080x2400 bitmaps for every pair costs ~10 MB each
    const cx = (j % COLS) * cellW, cy = Math.floor(j / COLS) * cellH;
    blit(a, 0, 0, a.width, a.height, sheet, cx, cy, S);
    blit(b, 0, 0, b.width, b.height, sheet, cx + tw + 2, cy, S);
    vline(sheet, cx + cellW - 2, [0, 0, 255]);
  });
  const file = path.join(outDir, `_ok-${k / (COLS * ROWS) + 1}.png`);
  fs.writeFileSync(file, PNG.sync.write(sheet));
  chunk.forEach(p => { rows.find(r => r.id === p.id).file = path.relative(process.cwd(), file); });
  sheets.push(`${path.basename(file)}: ${chunk.map(p => p.id).join(', ')}`);
}

rows.sort((x, y) => (y.pct ?? 999) - (x.pct ?? 999));
for (const r of rows) {
  const v = r.pct != null ? `${r.pct.toFixed(2)}%` : r.status;
  console.log(`${r.status.padEnd(5)} ${v.padStart(7)}  ${r.id}${r.note ? '  ' + r.note : ''}${r.crop ? '  [' + r.crop + ']' : ''}`);
}
const c = s => rows.filter(r => r.status === s).length;
console.log(`\n${rows.length} pairs: ${c('DIFF')} DIFF (cropped, review each), ${c('OK')} OK (on ${Math.ceil(okPairs.length / 12)} contact sheet(s), confirm same state), ${c('SIZE')} SIZE, ${c('NOREF')} NOREF. Out: parity/out/triage/`);
fs.writeFileSync(path.join(outDir, 'triage.json'), JSON.stringify(rows, null, 1));
