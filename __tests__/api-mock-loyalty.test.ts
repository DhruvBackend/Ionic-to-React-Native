// Stateful loyalty MOCK handlers (src/api/mock/handlers/loyalty.ts): byte-identical to the fixture variants while the store is
// empty, updated only after a write in the same session.
import { fixtureFiles } from '../src/api/fixtures.generated';
import { fixture, mockRequest, resetMock, setFixtureVariant, store } from '../src/api/mock';

const ENDPOINTS = [
  'app_karigar/karigarCoupon',
  'app_karigar/karigarHome',
  'app_karigar/couponHistory',
  'app_karigar/redeemRequest',
  'app_karigar/transaction',
];
const variantsOf = (endpoint: string) => Object.keys(fixtureFiles.find(f => f.endpoint === endpoint)!.variants);

async function call(fn: string, body: any = {}) {
  const p = mockRequest('POST', fn, body);
  jest.advanceTimersByTime(300);
  return p;
}
const plain = (v: unknown) => JSON.parse(JSON.stringify(v));

beforeEach(() => {
  jest.useFakeTimers();
  resetMock();
});
afterEach(() => jest.useRealTimers());

describe('empty store: every variant is exactly the fixture', () => {
  describe.each(ENDPOINTS)('%s', endpoint => {
    test.each(variantsOf(endpoint))('variant %s', async variant => {
      resetMock();
      setFixtureVariant(endpoint, variant);
      const expected = fixture(endpoint);
      if (expected && typeof expected === 'object' && typeof (expected as any).$httpError === 'number') {
        await expect(call(endpoint)).rejects.toBeDefined();
      } else {
        expect(await call(endpoint)).toEqual(plain(expected));
        // not just equal: serialised identically (same keys, same order)
        expect(JSON.stringify(await call(endpoint))).toBe(JSON.stringify(expected));
      }
    });
  });
});

describe('after a write', () => {
  test('karigarCoupon SUCCESS adds coupon_value to karigarHome and couponHistory balances only', async () => {
    const home = fixture('app_karigar/karigarHome').karigar;
    const hist = fixture('app_karigar/couponHistory').karigar;
    expect((await call('app_karigar/karigarCoupon')).coupon_value).toBe(50);

    const h = await call('app_karigar/karigarHome');
    expect(h.karigar.balance_point).toBe(home.balance_point + 50);
    expect(h.karigar.total_balance).toBe(home.total_balance + 50);
    expect(h.karigar.referal_point_balance).toBe(home.referal_point_balance);
    expect(h.last_point).toBe(50);

    const c = await call('app_karigar/couponHistory');
    expect(c.karigar.earn_by_scan).toBe(hist.earn_by_scan + 50);
    expect(c.karigar.total_earn).toBe(hist.total_earn + 50);
    expect(c.karigar.total_balance).toBe(hist.total_balance + 50);
    expect(c.karigar.total_redeem).toBe(hist.total_redeem);

    // a second scan stacks, and the fixture object itself is never mutated
    await call('app_karigar/karigarCoupon');
    expect((await call('app_karigar/karigarHome')).karigar.total_balance).toBe(home.total_balance + 100);
    expect(fixture('app_karigar/karigarHome').karigar.total_balance).toBe(home.total_balance);
  });

  test('a non-SUCCESS karigarCoupon (INVALID, USED) writes nothing', async () => {
    for (const v of ['INVALID', 'USED', 'BLANK', 'malformed', 'empty']) {
      setFixtureVariant('app_karigar/karigarCoupon', v);
      await call('app_karigar/karigarCoupon');
    }
    expect(store.get('loyalty.earned')).toBeUndefined();
    expect(await call('app_karigar/karigarHome')).toEqual(plain(fixture('app_karigar/karigarHome')));
  });

  test('balances that are missing (empty / malformed / unverified fields) stay untouched after a write', async () => {
    await call('app_karigar/karigarCoupon');
    for (const v of ['empty', 'malformed']) {
      setFixtureVariant('app_karigar/karigarHome', v);
      expect(await call('app_karigar/karigarHome')).toEqual(plain(fixture('app_karigar/karigarHome')));
    }
  });

  test('redeemRequest SUCCESS prepends a Pending row to transaction; other statuses write nothing', async () => {
    setFixtureVariant('app_karigar/redeemRequest', 'EXIST');
    await call('app_karigar/redeemRequest', { gift_id: 21 });
    expect(await call('app_karigar/transaction')).toEqual(plain(fixture('app_karigar/transaction')));

    setFixtureVariant('app_karigar/redeemRequest', 'default');
    await call('app_karigar/redeemRequest', { gift_id: 21, offer_id: 11 });
    const t = await call('app_karigar/transaction');
    const base = fixture('app_karigar/transaction').transaction;
    expect(t.transaction).toHaveLength(base.length + 1);
    expect(t.transaction[0]).toMatchObject({ gift_title: 'steel water bottle', coupon_points: 500, gift_status: 'Pending', receive_status: '' });
    expect(t.transaction.slice(1)).toEqual(base);
    expect(t.karigar).toEqual(fixture('app_karigar/transaction').karigar);
  });

  test('resetMock() forgets the writes', async () => {
    await call('app_karigar/karigarCoupon');
    await call('app_karigar/redeemRequest', { gift_id: 21 });
    resetMock();
    expect(await call('app_karigar/karigarHome')).toEqual(plain(fixture('app_karigar/karigarHome')));
    expect(await call('app_karigar/transaction')).toEqual(plain(fixture('app_karigar/transaction')));
  });
});
