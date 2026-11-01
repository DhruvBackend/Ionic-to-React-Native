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

function gen(dir: string) {
  const out = path.join(dir, 'routes.generated.ts');
  execFileSync('node', [SCRIPT, '--dir', dir, '--out', out], { encoding: 'utf8', stdio: 'pipe' });
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
