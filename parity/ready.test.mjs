// node --test parity/ready.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { hasReadyNode, readyIdFor, waitForReady } from './lib/ready.mjs';

const PKG = 'com.topsan.app.rn';
const xml = (id, pkg = PKG) =>
  `<?xml version='1.0'?><hierarchy><node index="0" package="${pkg}" class="android.view.View" resource-id="${id}" bounds="[0,0][1,1]" /></hierarchy>`;

test('readyIdFor: state.readyId wins, default ion-card-<screen>', () => {
  assert.equal(readyIdFor({ screen: 'Language' }), 'ion-card-Language');
  assert.equal(readyIdFor({ screen: 'Language', readyId: 'x' }), 'x');
});

test('hasReadyNode matches package and resource id (also with a package prefix), not other packages', () => {
  assert.ok(hasReadyNode(xml('ion-card-Language'), PKG, 'ion-card-Language'));
  assert.ok(hasReadyNode(xml(`${PKG}:id/ion-card-Language`), PKG, 'ion-card-Language'));
  assert.ok(!hasReadyNode(xml('ion-card-Language', 'com.other'), PKG, 'ion-card-Language'));
  assert.ok(!hasReadyNode(xml('ion-card-Other'), PKG, 'ion-card-Language'));
  assert.ok(!hasReadyNode('', PKG, 'ion-card-Language'));
});

function clock() {
  let t = 0;
  const sleeps = [];
  return { now: () => t, sleep: async ms => { sleeps.push(ms); t += ms; }, sleeps };
}

test('waitForReady polls (tolerating failed dumps) until the node appears, then settles 2500 ms', async () => {
  const c = clock();
  const outs = [() => { throw new Error('adb: device offline'); }, () => 'garbage', () => xml('splash'), () => xml('ion-card-Language')];
  let i = 0;
  const r = await waitForReady({ dump: () => outs[i++](), pkg: PKG, readyId: 'ion-card-Language', now: c.now, sleep: c.sleep });
  assert.equal(r.ready, true);
  assert.equal(r.polls, 4);
  assert.deepEqual(c.sleeps, [500, 500, 500, 2500]);
});

test('waitForReady times out without the node and does not settle', async () => {
  const c = clock();
  const r = await waitForReady({ dump: () => xml('x'), pkg: PKG, readyId: 'y', timeoutMs: 2000, pollMs: 500, now: c.now, sleep: c.sleep });
  assert.equal(r.ready, false);
  assert.ok(r.waitedMs >= 2000);
  assert.ok(!c.sleeps.includes(2500));
});
