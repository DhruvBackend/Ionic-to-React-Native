// expectContract() proves an RN call sends exactly what the Ionic call sent (plan Task 6):
// same URL (base + endpoint), method, header set, and body key structure.
import { db } from '../src/api/client';
import { registerMock, resetMock } from '../src/api/mock';
import { expectContract, type Contract } from './helpers/contract';

const LOGIN: Contract = {
  endpoint: 'auth/login',
  helper: 'onPostRequestDataFromApi',
  server: 'root',
  method: 'POST',
  headers: 'user',
  body: { mobile_no: '9876543210', mode: '=App' },
  ionicSource: 'src/pages/login-section/otp/otp.ts:78',
};

beforeEach(() => {
  resetMock();
  db.userStorageData = undefined;
  registerMock('auth/login', () => ({ status: 'SUCCESS' }));
  registerMock('app_karigar/app_version', () => ({ app_version: '0.1.5' }));
  registerMock('app_karigar/checkCoupon', () => ({ status: 'INVALID' }));
});

test('passes when the call matches the contract', async () => {
  await expectContract(LOGIN, () => db.onPostRequestDataFromApi({ mobile_no: '9000000000', mode: 'App' }, 'auth/login', db.rootUrl));
});

test('fails on an extra body key', async () => {
  await expect(
    expectContract(LOGIN, () =>
      db.onPostRequestDataFromApi({ mobile_no: '9000000000', mode: 'App', otp: '1' }, 'auth/login', db.rootUrl),
    ),
  ).rejects.toThrow(/"otp"/);
});

test('fails on a missing body key', async () => {
  await expect(
    expectContract(LOGIN, () => db.onPostRequestDataFromApi({ mode: 'App' }, 'auth/login', db.rootUrl)),
  ).rejects.toThrow(/mobile_no/);
});

test('fails when a literal ("=App") differs', async () => {
  await expect(
    expectContract(LOGIN, () => db.onPostRequestDataFromApi({ mobile_no: '9000000000', mode: 'Web' }, 'auth/login', db.rootUrl)),
  ).rejects.toThrow(/Web/);
});

test('fails when sent to the wrong server', async () => {
  await expect(
    expectContract(LOGIN, () => db.onPostRequestDataFromApi({ mobile_no: '9', mode: 'App' }, 'auth/login', db.rootUrlSfa)),
  ).rejects.toThrow(/crm\/api\/app/);
});

test('fails when the endpoint is never called', async () => {
  await expect(expectContract(LOGIN, async () => undefined)).rejects.toThrow(/auth\/login/);
});

test('user headers: logged in sends Authorization and Token', async () => {
  await expectContract(
    LOGIN,
    () => db.onPostRequestDataFromApi({ mobile_no: '9', mode: 'App' }, 'auth/login', db.rootUrl),
    { loggedIn: true },
  );
});

test('fails when a post_rqst-style call (Token only) is checked against a "user" contract', async () => {
  await expect(
    expectContract(
      { ...LOGIN, endpoint: 'app_karigar/checkCoupon', body: { karigar_id: '', qr_code: '' } },
      () => db.post_rqst({ karigar_id: '1', qr_code: 'Q' }, 'app_karigar/checkCoupon'),
      { loggedIn: true },
    ),
  ).rejects.toThrow(/Authorization/);
});

test('tokenOnly contract passes for post_rqst ("Bearer undefined" kept from Ionic)', async () => {
  await expectContract(
    {
      endpoint: 'app_karigar/checkCoupon',
      helper: 'post_rqst',
      server: 'root',
      method: 'POST',
      headers: 'tokenOnly',
      body: { karigar_id: '', qr_code: '' },
      ionicSource: 'src/pages/scan-point/scan-point.ts:186',
    },
    () => db.post_rqst({ karigar_id: '1', qr_code: 'Q' }, 'app_karigar/checkCoupon'),
  );
});

test('"=" body means the literal empty-string body Ionic sends', async () => {
  await expectContract(
    { ...LOGIN, endpoint: 'app_karigar/app_version', body: '=' },
    () => db.onPostRequestDataFromApi('', 'app_karigar/app_version', db.rootUrl),
  );
});

test('arrays are checked by the shape of their first element', async () => {
  await expectContract(
    { ...LOGIN, body: { mobile_no: '', mode: '=App', list: [{ id: '' }] } },
    () => db.onPostRequestDataFromApi({ mobile_no: '9', mode: 'App', list: [{ id: 1 }, { id: 2 }] }, 'auth/login', db.rootUrl),
  );
  await expect(
    expectContract(
      { ...LOGIN, body: { mobile_no: '', mode: '=App', list: [{ id: '' }] } },
      () => db.onPostRequestDataFromApi({ mobile_no: '9', mode: 'App', list: [{ code: 1 }] }, 'auth/login', db.rootUrl),
    ),
  ).rejects.toThrow(/code/);
});

test('the screen still gets the mock response while the call is recorded', async () => {
  let got: any;
  await expectContract(LOGIN, async () => {
    got = await db.onPostRequestDataFromApi({ mobile_no: '9', mode: 'App' }, 'auth/login', db.rootUrl);
  });
  expect(got).toEqual({ status: 'SUCCESS' });
});
