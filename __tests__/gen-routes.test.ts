/// <reference types="node" />
// scripts/gen-routes.mjs turns src/screens/<Name>/{route.ts,index.tsx} into a static route list,
// so parallel screen agents never edit the same navigation file (plan Task 7).
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const SCRIPT = path.resolve(__dirname, '..', 'scripts', 'gen-routes.mjs');

function screensDir(screens: Record<string, { route?: string; index?: boolean }>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tb-routes-'));
  for (const [name, s] of Object.entries(screens)) {
    fs.mkdirSync(path.join(dir, name));
    if (s.route !== undefined) fs.writeFileSync(path.join(dir, name, 'route.ts'), s.route);
    if (s.index) fs.writeFileSync(path.join(dir, name, 'index.tsx'), 'export default () => null;');
  }
  return dir;
}
const route = (name: string) => `export default { name: '${name}', presentation: 'card', links: [] };`;

function gen(dir: string, inventory: object[] = []) {
  const out = path.join(dir, 'routes.generated.ts');
  const inv = path.join(dir, 'inventory.json');
  fs.writeFileSync(inv, JSON.stringify(inventory));
  execFileSync('node', [SCRIPT, '--dir', dir, '--out', out, '--inventory', inv], { encoding: 'utf8', stdio: 'pipe' });
  return fs.readFileSync(out, 'utf8');
}
function genStatus(dir: string): number {
  try {
    gen(dir);
    return 0;
  } catch (e: any) {
    return e.status ?? 1;
  }
}

test('lists every screen folder and skips folders starting with "_"', () => {
  const out = gen(screensDir({ Otp: { route: route('Otp'), index: true }, _Placeholder: { index: true } }));
  expect(out).toMatch(/Otp\/route/);
  expect(out).toMatch(/Otp'/);
  expect(out).not.toContain('_Placeholder');
});

test('a screen folder without route.ts or index.tsx is rejected', () => {
  expect(genStatus(screensDir({ Otp: { index: true } }))).not.toBe(0);
  expect(genStatus(screensDir({ Otp: { route: route('Otp') } }))).not.toBe(0);
});

test('a card-only folder (no route.ts, no index.tsx) is not a screen yet and is skipped', () => {
  const dir = screensDir({ Language: {}, Otp: { route: route('Otp'), index: true } });
  fs.writeFileSync(path.join(dir, 'Language', 'card.md'), '# Language');
  const out = gen(dir);
  expect(out).toMatch(/Otp\/route/);
  expect(out).not.toContain('Language');
});

test('route name must equal the folder name (the Ionic page class without "Page")', () => {
  expect(genStatus(screensDir({ Otp: { route: route('OtpPage'), index: true } }))).not.toBe(0);
});

test('no screens yet still produces a valid, empty list', () => {
  expect(gen(screensDir({}))).toMatch(/export const routes: RouteDef\[\] = \[\];/);
});

// Phase 2 kit (2026-11-03): every reachable Ionic page that is not ported yet gets a placeholder route, so a ported
// screen can push its real targets (OfferList -> Offers) and the phone tap check sees a page, not an unhandled action.
function placeholders(out: string): { name: string; presentation: string }[] {
  const m = out.match(/export const placeholderRoutes[^=]*= (\[[\s\S]*?\]);/);
  return m ? JSON.parse(m[1]) : [];
}

test('LIVE and PUSH-ONLY inventory pages without a screen become placeholders; DEAD, ported and Tabs do not', () => {
  const dir = screensDir({ Otp: { route: route('Otp'), index: true } });
  const out = gen(dir, [
    { name: 'Otp', status: 'LIVE' },
    { name: 'Offers', status: 'LIVE' },
    { name: 'Transaction', status: 'PUSH-ONLY' },
    { name: 'Attendence', status: 'DEAD' },
    { name: 'Tabs', status: 'LIVE' },
  ]);
  expect(placeholders(out)).toEqual([
    { name: 'Offers', presentation: 'card' },
    { name: 'Transaction', presentation: 'card' },
  ]);
});

test('pages Ionic opened with modalCtrl.create get a modal placeholder', () => {
  const out = gen(screensDir({}), [
    { name: 'ViewProfile', status: 'LIVE' },
    { name: 'CancelpolicyModal', status: 'LIVE' },
  ]);
  expect(placeholders(out)).toEqual([
    { name: 'CancelpolicyModal', presentation: 'modal' },
    { name: 'ViewProfile', presentation: 'modal' },
  ]);
});

test('no inventory entries still produces an empty placeholder list', () => {
  expect(placeholders(gen(screensDir({})))).toEqual([]);
  expect(gen(screensDir({}))).toMatch(/export const placeholderRoutes/);
});

test("a modal page's route.ts may write presentation: 'modal' with normal spacing; a card route for it is rejected", () => {
  const modalRoute = `export default { name: 'ViewProfile', presentation: 'modal', links: [] };`;
  expect(genStatus(screensDir({ ViewProfile: { route: modalRoute, index: true } }))).toBe(0);
  expect(genStatus(screensDir({ ViewProfile: { route: route('ViewProfile'), index: true } }))).not.toBe(0);
});
