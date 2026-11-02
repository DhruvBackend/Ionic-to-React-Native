// Proves the RN API client sends exactly what Ionic's dbservice.ts sent:
// same URL, same headers, same JSON body. A networked mode (DEV, the app default) is simulated with a fake fetch.
jest.mock('../src/config/env', () => {
  const actual = jest.requireActual('../src/config/env');
  return { ...actual, MODE: 'DEV' };
});

import { db, HttpError } from '../src/api/client';
import { urlsFor } from '../src/config/env';

const ROOT = 'https://devcrm.abacusdesk.com/topbathfixtures/dd_api/';
const SFA = 'https://devcrm.abacusdesk.com/topbathfixtures/crm/api/app/';

test('app default points at the dev server, never production', () => {
  const { MODE, URLS } = jest.requireActual('../src/config/env');
  expect(MODE).toBe('DEV');
  expect(URLS.rootUrl).toBe(ROOT);
  expect(JSON.stringify(urlsFor('MOCK'))).not.toContain('apps.abacusdesk.com');
});

test('LIVE block still matches the Ionic production URLs exactly', () => {
  const live = urlsFor('LIVE');
  expect(live.rootUrl).toBe('https://apps.abacusdesk.com/topbathfixtures/dd_api/');
  expect(live.rootUrlSfa).toBe('https://apps.abacusdesk.com/topbathfixtures/crm/api/app/');
  expect(live.upload_url3).toBe('https://apps.abacusdesk.com/topbathfixtures/dd_api/app/uploads/');
});

function fakeFetch(status = 200, body: any = { status: 'success' }) {
  const fn = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
  (globalThis as any).fetch = fn;
  return fn;
}

beforeEach(() => {
  db.userStorageData = undefined;
});

test('client URLs match the Ionic dev ("Testing URL") block', () => {
  expect(db.rootUrl).toBe(ROOT);
  expect(db.rootUrlSfa).toBe(SFA);
  expect(db.server_url).toBe(ROOT + 'index.php/app/');
});

test('onPostRequestDataFromApi: URL, JSON body and both auth headers', async () => {
  const f = fakeFetch();
  db.userStorageData = { token: 'abc' };
  await db.onPostRequestDataFromApi({ mobile: '9999999999' }, 'app_karigar/karigarLoginOtp', db.rootUrl);
  expect(f).toHaveBeenCalledWith(ROOT + 'app_karigar/karigarLoginOtp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer abc', Token: 'Bearer abc' },
    body: JSON.stringify({ mobile: '9999999999' }),
  });
});

test('no auth headers when logged out (same as Ionic)', async () => {
  const f = fakeFetch();
  await db.onGetRequestDataFromApi('app_master/newsList', db.rootUrl);
  expect(f.mock.calls[0][1].headers).toEqual({ 'Content-Type': 'application/json' });
});

test('SFA calls go to rootUrlSfa', async () => {
  const f = fakeFetch();
  await db.onPostRequestDataFromApi({}, 'Checkin/checkin_detail', db.rootUrlSfa);
  expect(f.mock.calls[0][0]).toBe(SFA + 'Checkin/checkin_detail');
});

test('post_rqst keeps the Ionic "Bearer undefined" behaviour', async () => {
  const f = fakeFetch();
  await db.post_rqst({ a: 1 }, 'app_karigar/x');
  expect(f.mock.calls[0][1].headers).toEqual({ 'Content-Type': 'application/json', Token: 'Bearer undefined' });
});

test('non-2xx rejects like Angular HttpClient', async () => {
  fakeFetch(500, { message: 'boom' });
  await expect(db.onGetRequestDataFromApi('x', db.rootUrl)).rejects.toBeInstanceOf(HttpError);
});

describe('shapeOf (debug [api-shape] log: structure only, never values)', () => {
  const { shapeOf } = require('../src/api/client');
  test('replaces every value by its type, keeps keys, first array item only', () => {
    expect(shapeOf({ status: 'SUCCESS', user: { mobile_no: '9999999999', id: 7, ok: true, x: null }, list: [{ a: 1 }, { a: 2 }] })).toEqual({
      status: 'string',
      user: { mobile_no: 'string', id: 'number', ok: 'boolean', x: 'null' },
      list: [{ a: 'number' }],
    });
  });
});
