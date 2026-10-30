/// <reference types="node" />
// Per-client white-label config (plan Task 3): clients/<id>/client.json → generated files.
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'use-client.mjs');

function run(args: string[]) {
  return execFileSync('node', [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
}
function runStatus(args: string[]): number {
  try {
    run(args);
    return 0;
  } catch (e: any) {
    return e.status ?? 1;
  }
}
const load = (id: string) => JSON.parse(fs.readFileSync(path.join(ROOT, 'clients', id, 'client.json'), 'utf8'));
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('topbath client.json validates against the schema', () => {
  expect(runStatus(['--validate', 'clients/topbath/client.json'])).toBe(0);
});

test('schema rejects a config without androidPackage', () => {
  const bad = { ...load('topbath') };
  delete bad.androidPackage;
  const file = path.join(os.tmpdir(), 'tb-bad-client.json');
  fs.writeFileSync(file, JSON.stringify(bad));
  expect(runStatus(['--validate', file])).not.toBe(0);
});

test('_all-features has every feature flag on; topbath only the live ones', () => {
  const all = load('_all-features');
  expect(Object.values(all.features).every(Boolean)).toBe(true);
  const on = Object.entries(load('topbath').features).filter(([, v]) => v).map(([k]) => k).sort();
  expect(on).toEqual(['pointTransfer', 'quotation', 'superPlumber']);
  expect(Object.keys(all.features).sort()).toEqual(Object.keys(load('topbath').features).sort());
});

test('topbath URLs are the Ionic dbservice.ts blocks, and the grafdoer upload host is not copied', () => {
  const c = load('topbath');
  expect(c.urls.LIVE.rootUrl).toBe('https://apps.abacusdesk.com/topbathfixtures/dd_api/');
  expect(c.urls.DEV.rootUrl).toBe('https://devcrm.abacusdesk.com/topbathfixtures/dd_api/');
  expect(JSON.stringify(c.urls.DEV)).not.toContain('apps.abacusdesk.com');
  expect(c.urls.LIVE.videoUpload).toBe('');
});

test('generating topbath writes client.ts and client.properties', () => {
  run(['topbath', '--skip-assets']);
  const ts = read('src/config/client.ts');
  expect(ts).toMatch(/GENERATED/);
  expect(ts).toContain('"androidPackage": "com.topsan.app"');
  const props = read('android/client.properties');
  expect(props).toMatch(/^applicationId=com\.topsan\.app$/m);
  expect(props).toMatch(/^versionName=0\.1\.5$/m);
  expect(props).toMatch(/^versionCode=\d+$/m);
  expect(props).toMatch(/^appName=Topsan$/m);
});

test('topbath has no translation overrides, so every language gets an empty override file', () => {
  run(['topbath', '--skip-assets']);
  for (const lang of ['en', 'hin', 'nep', 'es']) {
    expect(JSON.parse(read(`src/i18n/client/${lang}.json`))).toEqual({});
  }
});

test('unknown client id fails with a non-zero exit', () => {
  expect(runStatus(['no-such-client', '--skip-assets'])).not.toBe(0);
});
