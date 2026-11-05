// Captures the Ionic reference screenshots: node parity/reference/capture.mjs [--only <id>]
// Serves parity/reference/work/www, runs it in Chrome (360x800 @3x, Android UA, en-IN) with Cordova stubs,
// answers EVERY apps.abacusdesk.com / devcrm.abacusdesk.com call from src/api/fixtures and aborts any other
// foreign host. Output: parity/out/ref/<id>.png
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { FIXTURES, OUT, REPO, loadStates, parseArgs, selectStates, shotName } from '../lib/common.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WWW = path.join(HERE, 'work', 'www');
const STUBS = fs.readFileSync(path.join(HERE, 'stubs.js'), 'utf8');
const FONT_DIR = path.join(REPO, 'android', 'app', 'src', 'main', 'assets', 'fonts');
const REF_FONT_DIR = path.join(HERE, 'fonts'); // Noto Sans Devanagari (Android's Devanagari fallback), see fonts/README.md
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const API_HOSTS = new Set(['apps.abacusdesk.com', 'devcrm.abacusdesk.com']);
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
export const blocked = []; // every non-local request that was not served from a fixture

class NoReference extends Error {}

// Ionic page helpers, installed in the page after boot (the build is in Angular dev mode, so ng.probe works).
// ionicNav expressions can use: nav, root (MyApp instance), app (Ionic App), Page('Otp'), ctrl('alertCtrl'),
// injector, params.
const HELPERS = `(() => {
  const ng = window.ng;
  const navDe = ng.probe(document.querySelector('ion-nav'));
  const nav = navDe.componentInstance;
  const root = ng.probe(document.querySelector('ng-component')).componentInstance;
  const byName = {};
  nav._cfr._factories.forEach((_f, k) => { if (k && k.name) { byName[k.name] = k; } });
  window.__parity = {
    nav, root, app: root.app, injector: navDe.injector,
    Page: n => {
      const k = byName[n] || byName[n + 'Page'];
      if (!k) { throw new Error('no Ionic page ' + n); }
      return k;
    },
    ctrl: n => {
      if (root[n]) { return root[n]; }
      const act = nav.getActive && nav.getActive();
      if (act && act.instance && act.instance[n]) { return act.instance[n]; }
      throw new Error('no controller ' + n + ' on root or active page');
    },
  };
})()`;

export function startServer(www = WWW) {
  const mime = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff': 'font/woff',
    '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  };
  return new Promise(resolve => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]);
      if (p === '/') {
        p = '/index.html';
      }
      if (p === '/cordova.js') {
        r.setHeader('content-type', 'text/javascript');
        r.end('');
        return;
      }
      if (p === '/__seed.html') {
        r.setHeader('content-type', 'text/html');
        r.end('<!doctype html><title>seed</title>');
        return;
      }
      if (p.startsWith('/__fonts/')) {
        const ff = [FONT_DIR, REF_FONT_DIR].map(d => path.join(d, path.basename(p))).find(f => fs.existsSync(f));
        if (ff) {
          r.setHeader('content-type', 'font/ttf');
          r.end(fs.readFileSync(ff));
          return;
        }
      }
      const f = path.join(www, p);
      if (!f.startsWith(www) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
        r.statusCode = 404;
        r.end();
        return;
      }
      r.setHeader('content-type', mime[path.extname(f)] || 'application/octet-stream');
      r.end(fs.readFileSync(f));
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

// ---- fixtures -------------------------------------------------------------------------------------------------
const fixtureCache = new Map();
function readFixture(endpoint) {
  const file = path.join(FIXTURES, endpoint.replace(/\//g, '__') + '.json');
  if (!fixtureCache.has(file)) {
    fixtureCache.set(file, fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null);
  }
  return fixtureCache.get(file);
}

/** Maps an abacusdesk URL to { server, endpoint } using the same prefixes as dbservice.ts, else null. */
export function parseApiUrl(href) {
  const u = new URL(href);
  const p = u.pathname.replace(/^\/topbathfixtures/, '');
  let m = p.match(/^\/dd_api\/index\.php\/app\/(.+)$/);
  if (m) {
    return { server: 'server_url', endpoint: m[1] };
  }
  m = p.match(/^\/dd_api\/(.+)$/);
  if (m) {
    return { server: 'root', endpoint: m[1] };
  }
  m = p.match(/^\/crm\/api\/app\/(.+)$/);
  if (m) {
    return { server: 'sfa', endpoint: m[1] };
  }
  return null;
}

/** Fixture body for an endpoint (state variant, else default); null when there is no fixture file. */
export function fixtureResponse(endpoint, variants = {}) {
  const fx = readFixture(endpoint);
  if (!fx) {
    return null;
  }
  let name = variants[endpoint] || 'default';
  if (!(name in fx.variants)) {
    console.warn(`  fixture ${endpoint}: no variant "${name}", using default`);
    name = 'default';
  }
  return fx.variants[name];
}

// The reference loads Roboto and Material Icons from fonts.googleapis.com; serve the same families from the
// fonts bundled with the RN app instead (nothing is fetched from Google).
const FONT_CSS = `
@font-face{font-family:'Roboto';font-weight:300;font-style:normal;src:url(/__fonts/Roboto-Light.ttf)}
@font-face{font-family:'Roboto';font-weight:400;font-style:normal;src:url(/__fonts/Roboto-Regular.ttf)}
@font-face{font-family:'Roboto';font-weight:400;font-style:italic;src:url(/__fonts/Roboto-Italic.ttf)}
@font-face{font-family:'Roboto';font-weight:500;font-style:normal;src:url(/__fonts/Roboto-Medium.ttf)}
@font-face{font-family:'Roboto';font-weight:500;font-style:italic;src:url(/__fonts/Roboto-MediumItalic.ttf)}
@font-face{font-family:'Roboto';font-weight:700;font-style:normal;src:url(/__fonts/Roboto-Bold.ttf)}
@font-face{font-family:'Roboto Condensed';font-weight:400;font-style:normal;src:url(/__fonts/RobotoCondensed-Regular.ttf)}`;
// The Ionic build declares its own "Roboto" faces (local() + ../assets/fonts/roboto-*.woff, not shipped) AFTER the injected
// @import, and "Open Sans" (the Topbath utility classes) has no face at all, so on desktop Chrome those fell to Arial/Nirmala.
// The real Android WebView resolves "Roboto", the unknown "Open Sans" -> sans-serif -> Roboto, and Devanagari -> Noto Sans
// Devanagari. (Chrome picks ONE weight group per family, so every weight gets its own unicode-range Devanagari face.) This sheet is added to the page after load (so it wins by order) and maps all of that onto the same files.
const DEVANAGARI = 'U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20B9,U+25CC,U+A830-A839,U+A8E0-A8FF';
export const REF_FONT_FAMILIES = ['Roboto', 'Open Sans'];
export const REF_FONT_CSS = REF_FONT_FAMILIES.map(
  f => `
@font-face{font-family:'${f}';font-weight:300;font-style:normal;src:url(/__fonts/Roboto-Light.ttf)}
@font-face{font-family:'${f}';font-weight:400;font-style:normal;src:url(/__fonts/Roboto-Regular.ttf)}
@font-face{font-family:'${f}';font-weight:400;font-style:italic;src:url(/__fonts/Roboto-Italic.ttf)}
@font-face{font-family:'${f}';font-weight:500;font-style:normal;src:url(/__fonts/Roboto-Medium.ttf)}
@font-face{font-family:'${f}';font-weight:500;font-style:italic;src:url(/__fonts/Roboto-MediumItalic.ttf)}
@font-face{font-family:'${f}';font-weight:600;font-style:normal;src:url(/__fonts/Roboto-Bold.ttf)}
@font-face{font-family:'${f}';font-weight:700;font-style:normal;src:url(/__fonts/Roboto-Bold.ttf)}
${[300, 400, 500, 600, 700].map(w => `@font-face{font-family:'${f}';font-weight:${w};font-style:normal;unicode-range:${DEVANAGARI};src:url(/__fonts/NotoSansDevanagari-VF.ttf)}`).join(' ')}`,
).join('\n');
const ICON_CSS = `
@font-face{font-family:'Material Icons';font-style:normal;font-weight:400;src:url(/__fonts/MaterialIcons-Regular.ttf)}
.material-icons{font-family:'Material Icons';font-weight:normal;font-style:normal;font-size:24px;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-feature-settings:'liga';-webkit-font-smoothing:antialiased}`;

// ICON_CSS above is served for fonts.googleapis.com/icon, so its relative url() would resolve against that host (and get the CSS back). The face is
// therefore declared again, in-page, with the local origin (like REF_FONT_CSS); without it every .material-icons glyph drew its ligature name as text.
const REF_ICON_CSS = "@font-face{font-family:'Material Icons';font-style:normal;font-weight:400;src:url(/__fonts/MaterialIcons-Regular.ttf)}";

// `phase.booting`: true until the state's ionicNav runs. A state's `bootVariants` (if any) answer the app's start-up calls
// instead of `variants`: app.component.ts:403 calls app_karigar/profile at boot too, and a malformed variant meant for the
// screen broke the boot itself (PlumberDetail.malformed never got a root page).
function installRoutes(context, port, state, log, phase = { booting: false }) {
  const origin = `http://127.0.0.1:${port}`;
  return context.route('**/*', async route => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin === origin || url.protocol === 'data:' || url.protocol === 'blob:') {
      return route.continue();
    }
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
    if (API_HOSTS.has(url.hostname)) {
      if (req.method() === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: cors });
      }
      // Uploaded media (complaint videos in an <iframe>): the fixtures name files that do not exist on the server. Both
      // sides show an empty page: here a blank HTML document, in RN WebEmbed loads about:blank while answering from
      // the mock transport. Pictures keep the image branch below.
      if (url.pathname.includes('/uploads/') && !/\.(png|jpe?g|gif|webp|svg)$/i.test(url.pathname)) {
        log(`blank media page ${url.pathname}`);
        return route.fulfill({ status: 200, contentType: 'text/html', headers: cors, body: '<!DOCTYPE html><html><body></body></html>' });
      }
      const api = parseApiUrl(req.url());
      if (api) {
        const variants = phase.booting && state.bootVariants ? state.bootVariants : state.variants;
        const body = fixtureResponse(api.endpoint, variants || {});
        if (body !== null) {
          log(`api ${req.method()} ${api.endpoint} -> fixture`);
          // Same latency as the RN MOCK transport (src/api/mock MOCK_DELAY_MS = 300). Answering instantly made Ionic dismiss
          // its loaders before their present() finished, which Ionic 3 leaves stuck on screen (Phase 2 phone pass, 2026-11-03).
          await new Promise(r => setTimeout(r, 1000));
          return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(body) });
        }
        blocked.push(`${req.method()} ${req.url()} (no fixture)`);
        log(`BLOCKED (no fixture) ${req.method()} ${api.endpoint}`);
        return route.fulfill({ status: 404, contentType: 'application/json', headers: cors, body: '{}' });
      }
      if (/\.(png|jpe?g|gif|webp|svg)$/i.test(url.pathname)) {
        log(`image placeholder ${url.pathname}`);
        return route.fulfill({ status: 200, contentType: 'image/png', headers: cors, body: PNG_1X1 });
      }
      blocked.push(`${req.method()} ${req.url()}`);
      log(`BLOCKED ${req.method()} ${req.url()}`);
      return route.fulfill({ status: 404, headers: cors, body: '' });
    }
    if (url.hostname === 'fonts.googleapis.com') {
      const body = url.pathname === '/icon' ? ICON_CSS : FONT_CSS;
      return route.fulfill({ status: 200, contentType: 'text/css', headers: cors, body });
    }
    blocked.push(`${req.method()} ${req.url()}`);
    log(`BLOCKED ${req.method()} ${req.url()}`);
    return route.abort();
  });
}

// ---- sessions -------------------------------------------------------------------------------------------------
// src/api/fixtures/_sessions.json maps a role (Plumber, Sales_Boy, Dealer, Sales_Executive, Customer, Retailer, SFA,
// Employee, DrLogin) to the userStorageData the Ionic app stores after login. A role missing from it is reported as
// "no reference".
export function sessionFor(role) {
  if (!role) {
    return null;
  }
  const f = path.join(FIXTURES, '_sessions.json');
  if (!fs.existsSync(f)) {
    throw new NoReference(`role ${role}: src/api/fixtures/_sessions.json not found`);
  }
  const s = JSON.parse(fs.readFileSync(f, 'utf8'))[role];
  if (!s) {
    throw new NoReference(`role ${role}: not in _sessions.json`);
  }
  return s;
}

async function seedStorage(page, port, entries) {
  await page.goto(`http://127.0.0.1:${port}/__seed.html`);
  await page.evaluate(
    data =>
      new Promise((resolve, reject) => {
        // Ionic storage = localforage: IndexedDB "_ionicstorage", object store "_ionickv", key -> value.
        const open = indexedDB.open('_ionicstorage', 1);
        open.onupgradeneeded = () => open.result.createObjectStore('_ionickv');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction('_ionickv', 'readwrite');
          for (const [k, v] of Object.entries(data)) {
            tx.objectStore('_ionickv').put(v, k);
          }
          tx.oncomplete = () => {
            open.result.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    entries,
  );
}

// ---- capture --------------------------------------------------------------------------------------------------
export async function launchBrowser() {
  try {
    return await chromium.launch({ channel: 'chrome' });
  } catch {
    return chromium.launch({ executablePath: CHROME });
  }
}

/** Loads every Roboto / Open Sans face (Latin + Devanagari sample) and waits until the document's fonts are ready. */
export async function waitForFonts(page) {
  await page.evaluate(async families => {
    const loads = [];
    for (const f of families) {
      for (const w of [300, 400, 500, 600, 700]) {
        loads.push(document.fonts.load(`${w} 14px '${f}'`, 'Aa'), document.fonts.load(`${w} 14px '${f}'`, 'आगे'));
      }
    }
    loads.push(document.fonts.load("24px 'Material Icons'", 'clear'));
    await Promise.all(loads.map(l => l.then(() => 1, () => 1)));
    await document.fonts.ready.then(() => 1);
    return 1;
  }, REF_FONT_FAMILIES);
}

// The Ionic WebView on the capture phone is as tall as the app window: 793 dp (`dumpsys window`: h793dp, 1080x2378).
// Rendering at 800 made `body.android-15{height:94%}` 6.6 dp taller than the phone's frame, so every bottom-anchored
// bar, alert backdrop and vh-sized block sat ~7 dp lower in the reference (phone pass 2026-11-04). Override: REF_VIEWPORT_H.
export const REF_VIEWPORT_H = Number(process.env.REF_VIEWPORT_H || 793);
// Shots stay 1080x2400 (white-padded at the bottom) so they pair 1:1 with the padded RN shots (capture-rn.mjs fitToRef).
function padToRefHeight(file) {
  const png = PNG.sync.read(fs.readFileSync(file));
  if (png.height >= 2400) return;
  const out = new PNG({ width: png.width, height: 2400 });
  out.data.fill(255);
  png.data.copy(out.data, 0, 0, png.height * png.width * 4);
  fs.writeFileSync(file, PNG.sync.write(out));
}

export async function captureState(browser, port, state, outFile, { log = () => {}, beforeShot } = {}) {
  const session = sessionFor(state.role);
  const context = await browser.newContext({
    viewport: { width: 360, height: REF_VIEWPORT_H },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    locale: 'en-IN',
    userAgent: ANDROID_UA,
    serviceWorkers: 'block',
  });
  try {
    const phase = { booting: true };
    await installRoutes(context, port, state, log, phase);
    const page = await context.newPage();
    page.on('pageerror', e => log(`pageerror ${e.message.slice(0, 160)}`));
    await page.addInitScript(
      cfg => {
        window.__PARITY_CFG = cfg;
      },
      { deviceVersion: state.deviceVersion || '14', appVersion: state.appVersion || '0.1.5' },
    );
    await page.addInitScript(STUBS);
    if (session) {
      await seedStorage(page, port, { userStorageData: session });
    }
    await page.goto(`http://127.0.0.1:${port}/`);
    // Wait for the Ionic app (platform ready, a root page rendered).
    await page.waitForFunction(() => window.ng && document.querySelector('ion-nav .ion-page, ion-nav ion-content, ion-nav .content'), null, { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await page.addStyleTag({ content: REF_FONT_CSS + REF_ICON_CSS });
    await waitForFonts(page);
    await page.waitForTimeout(500);
    await page.evaluate(HELPERS);
    if (state.lang && state.lang !== 'en') {
      await page.evaluate(l => {
        const t = window.__parity.root.translate;
        t.setDefaultLang(l);
        return t.use(l).toPromise();
      }, state.lang);
    }
    phase.booting = false;
    if (state.ionicNav) {
      await page.evaluate(
        async ({ expr, params }) => {
          const h = window.__parity;
          const fn = new Function('nav', 'root', 'app', 'Page', 'ctrl', 'injector', 'params', `return (${expr});`);
          await fn(h.nav, h.root, h.app, h.Page, h.ctrl, h.injector, params);
        },
        { expr: state.ionicNav, params: state.params || {} },
      );
    }
    await page.waitForLoadState('networkidle');
    await waitForFonts(page);
    await page.waitForTimeout(state.waitMs ?? 500);
    if (beforeShot) {
      await beforeShot(page);
    }
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    await page.screenshot({ path: outFile });
    padToRefHeight(outFile);
  } finally {
    await context.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(path.join(WWW, 'build', 'main.js'))) {
    console.error('No Ionic reference build: run `bash parity/reference/build-ionic.sh` first.');
    process.exit(1);
  }
  const states = selectStates(loadStates(), args.only);
  if (!states.length) {
    console.error(`no state matches ${args.only}`);
    process.exit(1);
  }
  const { srv, port } = await startServer();
  const browser = await launchBrowser();
  let failed = 0;
  try {
    for (const s of states) {
      const out = path.join(OUT, 'ref', shotName(s.id));
      process.stdout.write(`ref  ${s.id} ... `);
      try {
        await captureState(browser, port, s, out, {
          log: m => process.env.PARITY_VERBOSE && console.log('\n  ' + m),
        });
        console.log('ok');
      } catch (e) {
        if (e instanceof NoReference) {
          console.log(`no reference (${e.message})`);
        } else {
          failed++;
          console.log(`FAILED ${e.message.split('\n')[0]}`);
        }
      }
    }
  } finally {
    await browser.close();
    srv.close();
  }
  if (blocked.length) {
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'blocked-requests.log'), [...new Set(blocked)].join('\n') + '\n');
    console.log(`${blocked.length} request(s) blocked or unfixtured (never sent): parity/out/blocked-requests.log`);
  }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
