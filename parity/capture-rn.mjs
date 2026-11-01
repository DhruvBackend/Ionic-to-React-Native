// Captures the RN app on a device/emulator with adb (plan deviation: adb instead of Maestro, see parity/README.md).
//   node parity/capture-rn.mjs [--only <id>] [-s <serial>]      (or ANDROID_SERIAL=<serial>)
// Per state: open topbathrn://open?... via `am start`, wait, `adb exec-out screencap -p`, crop the system bars,
// scale to the reference size (1080x2400), write parity/out/rn/<id>.png.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';
import { OUT, loadStates, parseArgs, selectStates, shotName } from './lib/common.mjs';
import { crop, resize } from './lib/image.mjs';
import { readyIdFor, waitForReady } from './lib/ready.mjs';

export const REF_W = 1080;
export const REF_H = 2400;
export const DEBUG_PACKAGE = 'com.topsan.app.rn';
export const ANDROID_15_API = 35; // src/app/frame.ts

/** topbathrn://open?screen=&role=&lang=&variant=<endpoint:variant,...>&params=<json> (src/navigation/debugLinks.ts) */
export function buildLink(state) {
  const q = [`screen=${encodeURIComponent(state.screen)}`];
  if (state.role) {
    q.push(`role=${encodeURIComponent(state.role)}`);
  }
  if (state.lang) {
    q.push(`lang=${encodeURIComponent(state.lang)}`);
  }
  const v = Object.entries(state.variants || {}).map(([e, n]) => `${e}:${n}`);
  if (v.length) {
    q.push(`variant=${encodeURIComponent(v.join(','))}`);
  }
  if (state.params && Object.keys(state.params).length) {
    q.push(`params=${encodeURIComponent(JSON.stringify(state.params))}`);
  }
  return `topbathrn://open?${q.join('&')}`;
}

/**
 * Pixels to cut so the RN shot covers the same area as the reference (the Ionic WebView content only, 360x800 dp).
 * - API < 35: src/app/frame.ts draws a status band (top inset) and a nav band (bottom inset) around the page,
 *   and the Ionic WebView sits between the system bars, so both bands are cropped.
 * - API >= 35: Ionic draws a 30px black body border over the status area and fills the screen; the reference
 *   state runs with deviceVersion "15" (same border), so nothing is cropped.
 * Insets are read from `dumpsys window`; fallbacks are 24 dp status bar and no nav bar (gesture navigation).
 */
export function cropFor({ api, density, insets }) {
  if (api >= ANDROID_15_API) {
    return { top: 0, bottom: 0 };
  }
  return {
    top: insets.top ?? Math.round((24 * density) / 160),
    bottom: insets.bottom ?? 0,
  };
}

/** `rnAction` of a state: only `tap:<testID>` exists. Returns { type: 'tap', testID } or null. */
export function parseRnAction(action) {
  if (!action) {
    return null;
  }
  const m = /^tap:(.+)$/.exec(action);
  if (!m) {
    throw new Error(`unknown rnAction "${action}" (supported: tap:<testID>)`);
  }
  return { type: 'tap', testID: m[1] };
}

/**
 * Centre of the node whose resource-id is `testID` in a `uiautomator dump` (RN puts testID into the Android resource-id).
 * The id may be package-prefixed ("com.x:id/lang-hin-cover"). Returns { x, y } in device pixels or null.
 */
export function findNodeCenter(xml, testID) {
  for (const m of xml.matchAll(/<node\b[^>]*>/g)) {
    const tag = m[0];
    const id = /resource-id="([^"]*)"/.exec(tag)?.[1] ?? '';
    if (id === testID || id.endsWith(`/${testID}`)) {
      const b = /bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/.exec(tag);
      if (b) {
        const [l, t, r, bt] = b.slice(1).map(Number);
        return { x: Math.round((l + r) / 2), y: Math.round((t + bt) / 2) };
      }
    }
  }
  return null;
}

function adb(serial, args, opts = {}) {
  const full = serial ? ['-s', serial, ...args] : args;
  const r = spawnSync('adb', full, { encoding: opts.binary ? 'buffer' : 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error) {
    throw r.error;
  }
  return r;
}

function pickDevice(serial) {
  const r = spawnSync('adb', ['devices'], { encoding: 'utf8' });
  if (r.error) {
    return { skip: 'adb not found on PATH' };
  }
  const devs = r.stdout.split('\n').slice(1).map(l => l.trim().split(/\s+/)).filter(p => p[1] === 'device').map(p => p[0]);
  if (serial) {
    return devs.includes(serial) ? { serial } : { skip: `device ${serial} not connected (adb devices: ${devs.join(', ') || 'none'})` };
  }
  if (devs.length === 0) {
    return { skip: 'no Android device/emulator connected (adb devices is empty)' };
  }
  if (devs.length > 1) {
    return { skip: `several devices (${devs.join(', ')}): pass -s <serial> or set ANDROID_SERIAL` };
  }
  return { serial: devs[0] };
}

function deviceInfo(serial) {
  const api = parseInt(adb(serial, ['shell', 'getprop', 'ro.build.version.sdk']).stdout.trim(), 10) || 0;
  const dens = /(\d+)\s*$/.exec(adb(serial, ['shell', 'wm', 'density']).stdout.trim());
  const density = dens ? parseInt(dens[1], 10) : 420;
  const win = adb(serial, ['shell', 'dumpsys', 'window']).stdout;
  const insets = {};
  // e.g. "InsetsSource type=statusBars frame=[0,0][1080,63]" / "type=navigationBars frame=[0,2274][1080,2400]"
  const sb = /type=(?:ITYPE_)?statusBars?[^\n]*?frame=\[(\d+),(\d+)\]\[(\d+),(\d+)\]/i.exec(win);
  if (sb) {
    insets.top = parseInt(sb[4], 10) - parseInt(sb[2], 10);
  }
  const nb = /type=(?:ITYPE_)?navigationBars?[^\n]*?frame=\[(\d+),(\d+)\]\[(\d+),(\d+)\]/i.exec(win);
  if (nb && parseInt(nb[4], 10) - parseInt(nb[2], 10) < 200) {
    insets.bottom = parseInt(nb[4], 10) - parseInt(nb[2], 10);
  }
  return { api, density, insets };
}


async function main() {
  const args = parseArgs(process.argv.slice(2));
  const states = selectStates(loadStates(), args.only);
  const dev = pickDevice(args.serial || process.env.ANDROID_SERIAL);
  if (dev.skip) {
    console.log(`SKIPPED RN capture: ${dev.skip}`);
    return;
  }
  const info = deviceInfo(dev.serial);
  const cut = cropFor(info);
  console.log(`device ${dev.serial}: API ${info.api}, ${info.density} dpi, crop top ${cut.top}px bottom ${cut.bottom}px`);
  let failed = 0;
  for (const s of states) {
    process.stdout.write(`rn   ${s.id} ... `);
    try {
      const link = buildLink(s);
      adb(dev.serial, ['shell', 'am', 'force-stop', DEBUG_PACKAGE]);
      const r = adb(dev.serial, ['shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', `'${link}'`, DEBUG_PACKAGE]);
      if (/Error|does not exist/i.test(r.stdout + r.stderr)) {
        throw new Error((r.stdout + r.stderr).trim().split('\n')[0]);
      }
      // poll uiautomator until the screen root (state.readyId, default ion-card-<screen>) exists, then 2.5 s more for the
      // Android-15 band (applied 2 s after JS start) and the page transition; `rnWaitMs` overrides that settle time
      const ready = await waitForReady({
        dump: () => adb(dev.serial, ['exec-out', 'uiautomator', 'dump', '/dev/tty']).stdout,
        pkg: DEBUG_PACKAGE,
        readyId: readyIdFor(s),
        settleMs: s.rnWaitMs ?? 2500,
      });
      if (!ready.ready) {
        process.stdout.write(`(WARNING ${readyIdFor(s)} not found after ${ready.waitedMs} ms, shooting anyway) `);
      }
      const action = parseRnAction(s.rnAction);
      if (action) {
        adb(dev.serial, ['shell', 'uiautomator', 'dump', '/sdcard/parity-ui.xml']);
        const xml = adb(dev.serial, ['shell', 'cat', '/sdcard/parity-ui.xml']).stdout;
        const at = findNodeCenter(xml, action.testID);
        if (!at) {
          throw new Error(`rnAction: no element with resource-id "${action.testID}" on screen`);
        }
        adb(dev.serial, ['shell', 'input', 'tap', String(at.x), String(at.y)]);
        await sleep(s.rnActionWaitMs ?? 1000);
      }
      const shot = adb(dev.serial, ['exec-out', 'screencap', '-p'], { binary: true });
      if (shot.status !== 0 || !shot.stdout.length) {
        throw new Error('screencap failed');
      }
      let png = PNG.sync.read(shot.stdout);
      png = resize(crop(png, cut.top, cut.bottom), REF_W, REF_H);
      const out = path.join(OUT, 'rn', shotName(s.id));
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, PNG.sync.write(png));
      console.log('ok');
    } catch (e) {
      failed++;
      console.log(`FAILED ${e.message}`);
    }
  }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
