#!/usr/bin/env node
// Builds docs/inventory.json: one row per Ionic page class (117), with reachability traced from the
// app's root pages. Re-run it when the Ionic source changes. The Ionic repo is read-only.
//
//   node scripts/build-inventory.mjs [--out docs/inventory.json] [--report]
//
// IONIC_SRC (env) defaults to C:/Migrations/Topbath_App_loyalty/src.
//
// How a page becomes LIVE: startup roots (app.component.ts) -> Language / Tabs; the per-role tab roots
// (tabs.html); then every push / setRoot / modalCtrl.create / popoverCtrl.create / navPush target written
// in code that can actually run (lifecycle hooks, methods bound in the template, whatever those call).
// PUSH-ONLY: reached only from a push-notification handler. DEAD: neither.
// Hand-written parts are INFEASIBLE_EDGES (branches whose condition can never be true) and the
// phase / feature tables (spec §6.1, §6.3).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IONIC_SRC, read, maskTs, stripHtmlComments, findApiCalls, lineOf, pageRefs } from './lib/ionic-scan.mjs';
import { ROLES, traceAll, tracePage, rolesForCondition } from './lib/trace.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outArg = process.argv.indexOf('--out');
const OUT = outArg > -1 ? path.resolve(process.argv[outArg + 1]) : path.join(ROOT, 'docs/inventory.json');
const REPORT = process.argv.includes('--report');

// ---- spec §6.1 / §6.3 tables ------------------------------------------------------------------
const PHASES = {
  1: 'Language SelectRegistrationType MobileLogin Otp Registration AboutusModal Tabs',
  2: 'Home MainHome Profile ViewProfile PointList PointHistory OfferList Offers Terms GiftDetail CancelpolicyModal CancelationPolicy Transaction ShippingDetail Notification Feedback Pointtranfer CoupanCode ScanPoint SalesPointTransfer Super30 PointLocation',
  3: 'Category SubCategory Products ProductDetail ProductSubdetail Newarrivals VideoCategory Video About Contact QuotationGenrateByPdf',
  4: 'AddNewComplaint ComplaintHistory ComplaintDetail CancelComplaint ComplaintRemarks MyCamplaints PulmberCustomerDetail PlumberCheckin TaskClose Customerlist Customeradd Customerdetail PlumberList PlumberAdd PlumberDetail',
  5: 'SalesExecHome SalesExecAddPlumber SalesExecAddSeller SalesExecAddDealer SalesExecPlumberList SalesExecPlumberDetail',
  6: 'GiftList PointDetail Scan LoginScreen Digitalcatalog EditProfile Enquiry FavoriteProduct News NewsDetail SurveyList SurveyDetail NearestDealer RetailerAddComplaint RetailerListComplaint Search',
  7: 'Login Otpverify Dashboard DealerHome DealerProfile AddCheckin AddDealer AddDistribution AddLeads CheckinDetail CheckinList CustomerCheckin CustomerOrder DistributorDetail DistributorList EditNetwork EndCheckin MainDistributorList Attendence WorkTypeModal AddLeave LeaveList TravelAdd TravelList DealerCheckIn DealerDealerList DealerDiscount DealerExecutiveApp DealerExecutiveList ExecutivDetail ExecutiveEdit ExecutivePopover LeadsDetail AddOrder DealerAddorder DealerOrder CartDetail OrderList OrderDetail ExecutiveOrderDetail',
};
const phaseOf = {};
for (const [p, names] of Object.entries(PHASES)) for (const n of names.split(' ')) phaseOf[n] = Number(p);

// FeatureKey per flagged page. Phase 7 is all `sfa`. The three live flags (client.json: true for Topbath) are
// attached to the live pages they switch.
const FEATURE = {
  GiftList: 'giftList',
  PointDetail: 'pointDetail',
  Scan: 'scanPage',
  LoginScreen: 'loginScreen',
  Digitalcatalog: 'digitalCatalog',
  EditProfile: 'editProfile',
  Enquiry: 'enquiry',
  FavoriteProduct: 'favorites',
  News: 'news',
  NewsDetail: 'news',
  SurveyList: 'survey',
  SurveyDetail: 'survey',
  NearestDealer: 'nearestDealer',
  RetailerAddComplaint: 'retailerComplaints',
  RetailerListComplaint: 'retailerComplaints',
  Search: 'search',
  Super30: 'superPlumber',
  QuotationGenrateByPdf: 'quotation',
  Pointtranfer: 'pointTransfer',
  SalesPointTransfer: 'pointTransfer',
};
for (const n of PHASES[7].split(' ')) FEATURE[n] = 'sfa';

// Edges the tracer sees but that can never fire. Each one is evidence-backed.
const INFEASIBLE_EDGES = [
  {
    from: 'SelectRegistrationTypePage',
    to: 'LoginPage',
    because:
      "select-registration-type.ts:52 pushes LoginPage only when registerType is 'Employee' or 'DrLogin', but the radio list offers only Plumber, Sales_Boy, Dealer, Sales_Executive (select-registration-type.html:19-34; the Customer option is commented out at :37-40)",
  },
];

// ---- tabs -------------------------------------------------------------------------------------
function tabRoots() {
  const tsText = maskTs(read(`${IONIC_SRC}/pages/tabs/tabs.ts`)).clean;
  const field = {};
  for (const m of tsText.matchAll(/(\w+Root)\s*(?::\s*\w+)?\s*=\s*['"]?(\w+Page)['"]?/g)) field[m[1]] = m[2];
  const html = stripHtmlComments(read(`${IONIC_SRC}/pages/tabs/tabs.html`));
  const byRole = Object.fromEntries(ROLES.map(r => [r, []]));
  const re = /<div\s+\*ngIf="([^"]*)"[^>]*>([\s\S]*?)<\/ion-tabs>/g;
  let m;
  while ((m = re.exec(html))) {
    const roles = rolesForCondition(m[1]);
    const roots = [...m[2].matchAll(/\[root\]="(\w+)"/g)].map(x => field[x[1]]);
    for (const r of roles) byRole[r].push(...roots);
  }
  return byRole;
}

// ---- main -------------------------------------------------------------------------------------
const { pages, traces } = traceAll();
if (pages.length !== 117) console.warn(`build-inventory: expected 117 page classes, found ${pages.length}`);
const byClass = new Map(pages.map(p => [p.ionicClass, p]));
const tabs = tabRoots();

// app.component.ts: startup roots, push handlers; menu code is not reachable for CMS users (see below)
const appPage = { ionicClass: 'MyApp', name: 'MyApp', dir: 'app', tsFile: 'app/app.component.ts' };
const app = tracePage(appPage, IONIC_SRC, { ignoreTemplate: true });
const appClean = maskTs(read(`${IONIC_SRC}/app/app.component.ts`)).clean;
const startupRoots = [...appClean.matchAll(/rootPage\s*=\s*([A-Z]\w*Page)/g)].map(m => ({ page: m[1], line: lineOf(appClean, m.index) }));
const pushRoots = [];
for (const e of app.edges) if (e.pushHandler) pushRoots.push({ page: e.target, line: e.line, file: 'app/app.component.ts' });
for (const t of traces.values()) for (const e of t.edges) if (e.pushHandler && byClass.has(e.target)) pushRoots.push({ page: e.target, line: e.line, file: e.file, from: t.page.ionicClass });

const infeasible = (from, to) => INFEASIBLE_EDGES.some(i => i.from === from && i.to === to);

function edgesOf(cls, { dead = false, push = true } = {}) {
  const t = traces.get(cls);
  if (!t || cls === 'TabsPage') return [];
  let es = t.edges;
  if (dead) es = es.concat(t.deadEdges.map(e => ({ ...e, roles: new Set(ROLES) })));
  return es.filter(e => byClass.has(e.target) && !infeasible(cls, e.target) && (push || !e.pushHandler));
}

/** BFS for one role. Returns Set of classes. opts.dead adds never-called code; opts.push adds push-handler edges. */
function bfs(starts, role, opts) {
  const seen = new Set();
  const q = [...starts];
  while (q.length) {
    const c = q.shift();
    if (seen.has(c) || !byClass.has(c)) continue;
    seen.add(c);
    for (const e of edgesOf(c, opts)) if (!role || e.roles.has(role)) q.push(e.target);
  }
  return seen;
}

const live = new Map(); // class -> Set<role>   (reached without push)
const pushOnly = new Map();
const mark = (m, c, r) => m.set(c, (m.get(c) || new Set()).add(r));
// pre-login flow: every role
for (const c of bfs(startupRoots.map(r => r.page), null, { push: false })) for (const r of ROLES) mark(live, c, r);
for (const r of ROLES) {
  for (const c of bfs(tabs[r], r, { push: false })) mark(live, c, r);
  for (const c of bfs(pushRoots.map(p => p.page), r, { push: true })) if (!live.get(c)?.has(r)) mark(pushOnly, c, r);
}
// a role's push-only set can also include pages only linked from a push target; drop pages that are live for any role
const status = c => (live.has(c) ? 'LIVE' : pushOnly.has(c) ? 'PUSH-ONLY' : 'DEAD');

// SFA-family roles for the dead module
const sfaRoles = new Map();
const addSfa = (starts, roles) => {
  for (const c of bfs(starts, null, { dead: true })) for (const r of roles) sfaRoles.set(c, (sfaRoles.get(c) || new Set()).add(r));
};
const menuRefs = m => [...new Set(pageRefs(app.classInfo.methods.get(m)?.text || '').map(r => r.ref))].filter(c => byClass.has(c));
addSfa(['DashboardPage', ...menuRefs('onSetSalesUserSideBarPage')], ['Employee', 'SFA']);
addSfa(menuRefs('onSetDrSideBarPage'), ['DrLogin']);
addSfa(['DealerHomePage', 'DealerProfilePage'], ['DrLogin']);
// loyalty pages that are not live: roles from the live role flow plus never-called code
const potentialRoles = new Map();
for (const r of ROLES) for (const c of bfs([...tabs[r], 'LanguagePage'], r, { dead: true })) potentialRoles.set(c, (potentialRoles.get(c) || new Set()).add(r));

// ---- evidence for DEAD rows ---------------------------------------------------------------------
function commentedRefs(cls) {
  const out = [];
  for (const p of pages) {
    if (p.ionicClass === cls) continue;
    const raw = read(`${IONIC_SRC}/${p.tsFile}`);
    const { clean } = maskTs(raw);
    const re = new RegExp(`\\b${cls}\\b`, 'g');
    let m;
    while ((m = re.exec(raw))) {
      if (clean.slice(m.index, m.index + cls.length).trim() === '' && !/^\s*import\b/.test(raw.slice(raw.lastIndexOf('\n', m.index) + 1).replace(/^\s*\/\/\s*/, ''))) {
        out.push({ file: p.tsFile, line: lineOf(raw, m.index), page: p.ionicClass });
      }
    }
  }
  const raw = read(`${IONIC_SRC}/app/app.component.ts`);
  const { clean } = maskTs(raw);
  const re = new RegExp(`\\b${cls}\\b`, 'g');
  let m;
  while ((m = re.exec(raw))) {
    if (clean.slice(m.index, m.index + cls.length).trim() === '' && !/import/.test(raw.slice(raw.lastIndexOf('\n', m.index) + 1, m.index))) out.push({ file: 'app/app.component.ts', line: lineOf(raw, m.index), page: 'MyApp' });
  }
  return out;
}

function htmlCommentLine(page, method) {
  const htmlPath = `${IONIC_SRC}/${page.tsFile}`.replace(/\.ts$/, '.html');
  if (!fs.existsSync(htmlPath)) return null;
  const raw = read(htmlPath);
  const stripped = stripHtmlComments(raw);
  const re = new RegExp(`\\b${method}\\s*\\(`);
  if (re.test(stripped)) return null;
  const m = re.exec(raw);
  return m ? lineOf(raw, m.index) : null;
}

function evidence(cls) {
  const ref = (f, l) => `${f}:${l}`;
  const primary = []; // from a live page (or the app shell): the actual reason
  const deadFrom = new Map(); // dead page -> first referrer
  for (const [from, t] of [...traces, ['MyApp', app]]) {
    for (const [list, reachable] of [[t.edges, true], [t.deadEdges, false]]) {
      for (const e of list) {
        if (e.target !== cls) continue;
        const fromLabel = from === 'MyApp' ? 'app.component' : from.replace(/Page$/, '');
        if (infeasible(from, cls)) {
          primary.push(INFEASIBLE_EDGES.find(i => i.from === from && i.to === cls).because);
        } else if (from !== 'MyApp' && status(from) === 'DEAD') {
          if (!deadFrom.has(fromLabel)) deadFrom.set(fromLabel, `${fromLabel} (${ref(e.file, e.line)} ${e.via}())`);
        } else if (!reachable) {
          const p = byClass.get(from) || appPage;
          const hl = htmlCommentLine(p, e.via);
          primary.push(
            from === 'MyApp'
              ? `${ref(e.file, e.line)} ${e.via}() navigates here, but it only runs from the side menu, which never opens for CMS users (app.component.ts open_nav_menu is only triggered by events published by dead pages Dashboard/DealerHome; app.html:1 swipe disabled for CMS)`
              : hl
                ? `${ref(e.file.replace(/\.ts$/, '.html'), hl)} button calling ${e.via}() is commented out; ${ref(e.file, e.line)} ${e.via}() is the only code navigating here`
                : `${ref(e.file, e.line)} ${e.via}() navigates here but nothing calls or binds ${e.via}()`,
          );
        }
      }
    }
  }
  const ev = [...new Set(primary)];
  if (deadFrom.size) {
    const list = [...deadFrom.values()];
    ev.push(`only linked from dead page${list.length > 1 ? 's' : ''}: ${list.slice(0, 3).join(', ')}${list.length > 3 ? `, +${list.length - 3} more` : ''}`);
  }
  const cr = [...new Set(commentedRefs(cls).map(c => ref(c.file, c.line)))].slice(0, 2);
  for (const c of cr) ev.push(`${c} commented-out reference`);
  return ev;
}

// ---- rows ---------------------------------------------------------------------------------------
function backendOf(page) {
  const { clean, masked } = maskTs(read(`${IONIC_SRC}/${page.tsFile}`));
  const servers = new Set(findApiCalls(clean, masked, page.tsFile).map(c => c.server));
  const sfa = servers.has('sfa');
  const root = servers.has('root') || servers.has('server_url') || [...servers].some(s => s.startsWith('<'));
  return sfa && root ? 'both' : sfa ? 'sfa' : 'root';
}

const PRELOGIN = new Set(['LanguagePage', 'SelectRegistrationTypePage', 'MobileLoginPage', 'OtpPage', 'RegistrationPage', 'AboutusModalPage', 'TabsPage']);

const rows = pages.map(p => {
  const st = status(p.ionicClass);
  let roles;
  if (st === 'LIVE') roles = PRELOGIN.has(p.ionicClass) ? [...ROLES] : ROLES.filter(r => live.get(p.ionicClass).has(r));
  else if (st === 'PUSH-ONLY') roles = ROLES.filter(r => pushOnly.get(p.ionicClass).has(r));
  else if (sfaRoles.has(p.ionicClass) && FEATURE[p.name] === 'sfa') roles = [...sfaRoles.get(p.ionicClass)];
  else if (FEATURE[p.name] === 'sfa') roles = ['Employee', 'SFA', 'DrLogin'];
  else roles = potentialRoles.has(p.ionicClass) ? ROLES.filter(r => potentialRoles.get(p.ionicClass).has(r)) : [...ROLES];
  const dead = st === 'DEAD';
  const ev = dead ? evidence(p.ionicClass) : [];
  return {
    ionicClass: p.ionicClass,
    name: p.name,
    ionicPath: `src/${p.dir}`,
    status: st,
    roles,
    backend: backendOf(p),
    feature: FEATURE[p.name] || null,
    phase: phaseOf[p.name] ?? null,
    unreachableBecause: dead ? (ev.length ? ev.slice(0, 4).join('; ') : `no navigation to ${p.name} found in src/pages or src/app`) : null,
  };
});
rows.sort((a, b) => a.phase - b.phase || a.name.localeCompare(b.name));

const counts = { LIVE: 0, 'PUSH-ONLY': 0, DEAD: 0 };
for (const r of rows) counts[r.status]++;

if (REPORT) {
  const specLive = new Set(Object.entries(PHASES).filter(([p]) => Number(p) <= 5).flatMap(([, n]) => n.split(' ')));
  console.log('counts', counts, 'rows', rows.length);
  for (const r of rows) {
    const specSays = specLive.has(r.name) ? 'live' : 'dead';
    const mine = r.status === 'DEAD' ? 'dead' : 'live';
    if (specSays !== mine) console.log('DISAGREE', r.name, 'spec=' + specSays, 'trace=' + r.status, r.unreachableBecause || '');
  }
  console.log('startup roots', startupRoots, 'push roots', pushRoots.map(p => `${p.page}@${p.file}:${p.line}`).join(' '));
  console.log('tabs', JSON.stringify(tabs));
  console.log('phase-less', rows.filter(r => r.phase == null).map(r => r.name));
  console.log('PUSH-ONLY', rows.filter(r => r.status === 'PUSH-ONLY').map(r => r.name));
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(rows, null, 2) + '\n');
console.log(`build-inventory: ${rows.length} rows (LIVE ${counts.LIVE}, PUSH-ONLY ${counts['PUSH-ONLY']}, DEAD ${counts.DEAD}) -> ${path.relative(ROOT, OUT)}`);
