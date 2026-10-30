// Proves the RN API client sends exactly what Ionic's dbservice.ts sent:
// same URL, same headers, same JSON body. LIVE mode is simulated with a fake fetch.
jest.mock('../src/config/env', () => {
  const actual = jest.requireActual('../src/config/env');
  return { ...actual, MODE: 'LIVE' };
});

import { db, HttpError } from '../src/api/client';

const ROOT = 'https://apps.abacusdesk.com/topbathfixtures/dd_api/';
const SFA = 'https://apps.abacusdesk.com/topbathfixtures/crm/api/app/';

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

test('URLs match the Ionic LIVE block', () => {
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
