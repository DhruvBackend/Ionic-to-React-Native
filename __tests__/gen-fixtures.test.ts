/// <reference types="node" />
// scripts/gen-fixtures.mjs turns src/api/fixtures/*.json into a static import list (Metro can't
// load files dynamically) and rejects malformed fixture files (plan Task 5).
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const SCRIPT = path.resolve(__dirname, '..', 'scripts', 'gen-fixtures.mjs');

function tmpDir(files: Record<string, unknown>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tb-fx-'));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), JSON.stringify(content));
  }
  return dir;
}
function gen(dir: string) {
  const out = path.join(dir, 'out.generated.ts');
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

const ok = { endpoint: 'app_karigar/profile', server: 'root', variants: { default: { status: 'SUCCESS' } } };

test('lists every fixture file and skips files starting with "_"', () => {
  const dir = tmpDir({ 'app_karigar__profile.json': ok, '_sessions.json': { anything: true } });
  const out = gen(dir);
  expect(out).toContain('app_karigar__profile.json');
  expect(out).not.toContain('_sessions.json');
});

test('file name must match the endpoint ("/" → "__")', () => {
  expect(genStatus(tmpDir({ 'wrong_name.json': ok }))).not.toBe(0);
});

test('a fixture without a default variant is rejected', () => {
  const bad = { ...ok, variants: { other: {} } };
  expect(genStatus(tmpDir({ 'app_karigar__profile.json': bad }))).not.toBe(0);
});

test('server must be root, sfa or server_url', () => {
  const bad = { ...ok, server: 'prod' };
  expect(genStatus(tmpDir({ 'app_karigar__profile.json': bad }))).not.toBe(0);
});
