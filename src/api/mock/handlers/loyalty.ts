// Stateful MOCK handlers for the loyalty write -> read paths (plan Phase 2 flow tests):
//   karigarCoupon SUCCESS  -> the coupon value is added to the balances karigarHome and couponHistory return;
//   redeemRequest SUCCESS  -> a Pending row is prepended to what `transaction` returns.
//
// HARD RULE: with an empty store every handler returns EXACTLY the active fixture variant (same object contents, same variant
// selection, $httpError markers and null bodies untouched). The parity harness serves the same fixture files to the Ionic
// reference and every screen test depends on the variants as they are, so state only ever shows after a write in the same
// session (resetMock() empties the store). Nothing here is reachable from the Ionic side.
import { fixture } from '../index';
import { store } from '../store';
import type { MockHandler } from '../index';

const EARNED = 'loyalty.earned'; // points added by karigarCoupon SUCCESS writes
const REDEEMED = 'loyalty.redeemed'; // rows added by redeemRequest SUCCESS writes (newest first)

const clone = (v: any) => JSON.parse(JSON.stringify(v));
const isObject = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const earned = () => store.get<number>(EARNED) ?? 0;
const redeemed = () => store.get<any[]>(REDEEMED) ?? [];

// add `earned` to the listed numeric fields of response.karigar (missing, null or non-numeric fields stay as they are)
function withEarned(endpoint: string, fields: string[]) {
  const response = fixture(endpoint);
  const add = earned();
  if (!add || !isObject(response) || !isObject(response.karigar)) {
    return response;
  }
  const out = clone(response);
  for (const f of fields) {
    if (isNum(out.karigar[f])) {
      out.karigar[f] += add;
    }
  }
  return out;
}

export const loyaltyHandlers: Record<string, MockHandler> = {
  'app_karigar/karigarCoupon': () => {
    const response = fixture('app_karigar/karigarCoupon');
    if (isObject(response) && response.status === 'SUCCESS' && isNum(response.coupon_value)) {
      store.set(EARNED, earned() + response.coupon_value);
    }
    return response;
  },

  'app_karigar/karigarHome': () => withEarned('app_karigar/karigarHome', ['balance_point', 'total_balance']),

  'app_karigar/couponHistory': () => withEarned('app_karigar/couponHistory', ['earn_by_scan', 'total_earn', 'total_balance']),

  'app_karigar/redeemRequest': (body: any) => {
    const response = fixture('app_karigar/redeemRequest');
    if (isObject(response) && response.status === 'SUCCESS') {
      // the gift as the app showed it: giftDetail's gift when the ids match, else sendOtp's
      const candidates = [fixture('app_karigar/giftDetail', 'default')?.gift, fixture('app_karigar/sendOtp', 'default')?.gift];
      const gift = candidates.find(g => isObject(g) && String(g.id) === String(body?.gift_id)) ?? {};
      const rows = redeemed();
      store.set(REDEEMED, [
        {
          id: 600 + rows.length + 1,
          gift_title: gift.gift_title ?? '',
          coupon_points: Number(gift.coupon_points) || 0,
          gift_status: 'Pending',
          receive_status: '',
          reject_reason: '',
          date_created: new Date().toISOString().slice(0, 10),
          received_date: '',
        },
        ...rows,
      ]);
    }
    return response;
  },

  'app_karigar/transaction': () => {
    const response = fixture('app_karigar/transaction');
    const rows = redeemed();
    if (!rows.length || !isObject(response) || !Array.isArray(response.transaction)) {
      return response;
    }
    return { ...clone(response), transaction: [...clone(rows), ...clone(response.transaction)] };
  },
};
