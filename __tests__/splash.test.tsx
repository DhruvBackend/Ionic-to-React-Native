/// <reference types="node" />
// Splash screen parity (docs/splash-parity.md, plan Task 8b).
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import { splashScreen } from '../src/native/splashScreen';

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'use-client.mjs');
const RES = path.join(ROOT, 'android/app/src/main/res');
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function run(args: string[]) {
  return execFileSync('node', [SCRIPT, ...args], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
}
function runFail(args: string[]): string {
  try {
    run(args);
  } catch (e: any) {
    return String(e.stderr);
  }
  return '';
}

test('App calls splashScreen.hide() once at start-up (app.component.ts:118, platform.ready)', async () => {
  const hide = jest.spyOn(splashScreen, 'hide');
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  expect(hide).toHaveBeenCalledTimes(1);
  await ReactTestRenderer.act(async () => tree!.unmount());
  hide.mockRestore();
});

test('splashScreen.hide() is a no-op, as under the shipped cordova-android 12 (autoHide=true)', () => {
  expect(splashScreen.hide()).toBeUndefined();
});

test('use-client copies splash.png byte-identically and writes the Ionic default background', () => {
  run(['topbath']);
  const copied = fs.readFileSync(path.join(RES, 'drawable-nodpi/ic_splash.png'));
  expect(copied.equals(fs.readFileSync(path.join(ROOT, 'clients/topbath/assets/splash.png')))).toBe(true);
  expect(read('android/app/src/main/res/values/splash_colors.xml')).toContain(
    '<color name="splash_background">#FFFFFFFF</color>',
  );
});

test('splashBackground is converted from CSS hex to Android #AARRGGBB', () => {
  const dir = path.join(ROOT, 'clients', 'tmp-splash-bg');
  fs.mkdirSync(dir, { recursive: true });
  try {
    const cfg = JSON.parse(read('clients/topbath/client.json'));
    fs.writeFileSync(
      path.join(dir, 'client.json'),
      JSON.stringify({ ...cfg, id: 'tmp-splash-bg', assetsFrom: 'topbath', splashBackground: '#002d2580' }),
    );
    run(['tmp-splash-bg', '--skip-assets']);
    expect(read('android/app/src/main/res/values/splash_colors.xml')).toContain('#80002D25');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    run(['topbath']);
  }
});

test('use-client fails clearly when a client has no splash.png', () => {
  const dir = path.join(ROOT, 'clients', 'tmp-no-splash');
  fs.cpSync(path.join(ROOT, 'clients/topbath'), dir, { recursive: true });
  try {
    const cfg = JSON.parse(read('clients/topbath/client.json'));
    fs.writeFileSync(path.join(dir, 'client.json'), JSON.stringify({ ...cfg, id: 'tmp-no-splash' }));
    fs.rmSync(path.join(dir, 'assets/splash.png'));
    const err = runFail(['tmp-no-splash']);
    expect(err).toMatch(/missing asset clients.tmp-no-splash.assets.splash\.png/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    run(['topbath']);
  }
});

test('schema rejects a malformed splashBackground', () => {
  const file = path.join(require('os').tmpdir(), 'tb-bad-splash.json');
  fs.writeFileSync(file, JSON.stringify({ ...JSON.parse(read('clients/topbath/client.json')), splashBackground: 'white' }));
  expect(runFail(['--validate', file])).toMatch(/splashBackground/);
});

test('native wiring mirrors the shipped config: 3000 ms delay, 3000 ms accelerate fade, core-splashscreen 1.0.0', () => {
  const kt = read('android/app/src/main/java/com/topsan/app/MainActivity.kt');
  expect(kt).toMatch(/SPLASH_DELAY_MS = 3000L/);
  expect(kt).toMatch(/SPLASH_FADE_MS = 3000L/);
  expect(kt).toContain('AccelerateInterpolator()');
  expect(kt).toMatch(/installSplashScreen\(\)/);
  expect(read('android/app/build.gradle')).toContain('androidx.core:core-splashscreen:1.0.0');
  expect(read('android/app/src/main/AndroidManifest.xml')).toContain('android:theme="@style/Theme.App.SplashScreen"');
  const styles = read('android/app/src/main/res/values/styles.xml');
  expect(styles).toContain('parent="Theme.SplashScreen.IconBackground"');
  expect(styles).toContain('windowSplashScreenAnimationDuration">200');
});
