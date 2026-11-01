// node --test parity/reference/capture.test.mjs
// Runs the real capture for Language.default and checks the PNG is 1080x2400 with non-blank pixels.
// Needs the Ionic build: bash parity/reference/build-ionic.sh
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PNG } from 'pngjs';
import { OUT } from '../lib/common.mjs';
import { parseApiUrl, fixtureResponse } from './capture.mjs';

test('parseApiUrl maps the three server prefixes', () => {
  const b = 'https://apps.abacusdesk.com/topbathfixtures';
  assert.deepEqual(parseApiUrl(`${b}/dd_api/app_karigar/karigarHome`), { server: 'root', endpoint: 'app_karigar/karigarHome' });
  assert.deepEqual(parseApiUrl(`${b}/dd_api/index.php/app/x/y`), { server: 'server_url', endpoint: 'x/y' });
  assert.deepEqual(parseApiUrl(`${b}/crm/api/app/a/b`), { server: 'sfa', endpoint: 'a/b' });
  assert.equal(parseApiUrl(`${b}/uploads/a.png`), null);
});

test('fixtureResponse applies variants', () => {
  assert.equal(fixtureResponse('app_karigar/app_version', {}).app_version, '0.1.5');
  assert.equal(fixtureResponse('app_karigar/app_version', { 'app_karigar/app_version': 'forced' }).play_console_flag, 1);
  assert.equal(fixtureResponse('no/such_endpoint'), null);
});

test('Language.default capture produces a non-blank PNG', () => {
  const file = path.join(OUT, 'ref', 'Language.default.png');
  fs.rmSync(file, { force: true });
  const r = spawnSync(process.execPath, [path.join(import.meta.dirname, 'capture.mjs'), '--only', 'Language.default'], {
    encoding: 'utf8',
    timeout: 120000,
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(fs.existsSync(file), 'png exists');
  const png = PNG.sync.read(fs.readFileSync(file));
  assert.equal(png.width, 1080);
  assert.equal(png.height, 2400);
  const first = png.data.readUInt32LE(0);
  let differing = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    if (png.data.readUInt32LE(i) !== first) {
      differing++;
    }
  }
  assert.ok(differing > 1000, `non-blank pixels: ${differing}`);
});
