// Scan and redeem flows (plan Phase 2): a Plumber scans a coupon, sees the balance grow, redeems a gift and finds the request in
// Transaction; a Seller (Sales_Boy) scans two coupons for a plumber and saves them.
//
// Approach (as in login.test.tsx): the REAL RootNavigator in MOCK mode starting on Tabs with a seeded session, real controls pressed
// by testID, fixture variants for the server answers. The "state" the flow needs (balance after a scan, the new Transaction row) comes
// from the stateful handlers in src/api/mock/handlers/loyalty.ts, which return the plain fixture until a write happened.
// The native scanner is the MOCK one (setMockScan). Alerts are not drawn by RootNavigator (the host sits in App), so their buttons are
// pressed through the overlay store, which is the same handler the dialog would run.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackActions } from '@react-navigation/native';
import { db, getTransport, setTransport, type ApiRequest } from '../../src/api/client';
import sessions from '../../src/api/fixtures/_sessions.json';
import { resetMock } from '../../src/api/mock';
import i18n from '../../src/i18n';
import { RootNavigator } from '../../src/navigation/RootNavigator';
import { navigationRef } from '../../src/navigation/navigationRef';
import { resetMockNative, setMockScan } from '../../src/native';
import { _resetOverlaysForTests, overlayStore } from '../../src/ui/overlays';

const act = ReactTestRenderer.act;
let tree: ReactTestRenderer.ReactTestRenderer | undefined;
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

// let the mock's 300 ms latency, screen transitions and pending promises run
async function settle(ms = 350, rounds = 6) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
  }
}
const find = (id: string) => tree!.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const host = (id: string) => find(id).find(n => typeof n.type === 'string')!;
const flat = (c: any): string =>
  Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '';
const textOf = (id: string) => flat(host(id).props.children).trim();
// the deepest focused route (a page pushed inside a tab, or a modal), and the route focused in the ROOT stack
const current = () => navigationRef.getCurrentRoute()?.name;
const rootFocused = () => {
  const s = navigationRef.getRootState();
  return s?.routes[s.index]?.name;
};

async function press(id: string) {
  const n = find(id).find(x => typeof x.props.onPress === 'function');
  if (!n) {
    throw new Error(`no pressable "${id}" on screen (current: ${current()})`);
  }
  await act(async () => {
    n.props.onPress({ nativeEvent: { locationX: 10, locationY: 10 } });
  });
  await settle();
}
async function type(id: string, text: string) {
  await act(async () => {
    host(id).props.onChangeText(text);
  });
}
// a checkbox is tapped through its item cover
const tapBox = (id: string) => press(`${id}-item-cover`);
const goBack = async () => {
  await act(async () => {
    navigationRef.goBack();
  });
  await settle();
};

const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options as any);
const lastAlert = () => alerts().pop();
// the button the user taps in the newest alert (the handler gets the radio value for the Home scan dialog)
async function tapAlert(index: number, value?: unknown) {
  await act(async () => {
    lastAlert().buttons[index].handler(value);
  });
  await settle();
}
const sent = (fn: string) => calls.filter(c => c.fn === fn).map(c => (typeof c.body === 'string' ? JSON.parse(c.body) : c.body));

async function start(role: 'Plumber' | 'Sales_Boy') {
  db.userStorageData = { ...(sessions as any)[role] };
  await act(async () => {
    tree = ReactTestRenderer.create(<RootNavigator initialRouteName="Tabs" />);
  });
  await settle();
  expect(current()).toBe('Home');
}

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetMock();
  resetMockNative();
  _resetOverlaysForTests();
  db.userStorageData = null;
  calls = [];
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    return previous(req);
  });
  restoreTransport = () => setTransport(previous);
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});
afterEach(async () => {
  restoreTransport();
  await act(async () => {
    tree?.unmount();
  });
  tree = undefined;
  jest.useRealTimers();
});

test('Plumber: scan -> balance up on PointList -> GiftDetail -> redeem with OTP -> Tabs 3 + Success -> Transaction lists the gift', async () => {
  await start('Plumber');
  expect(textOf('home-wallet')).toContain('1250');

  // PointList before the scan: couponHistory total balance
  await press('home-wallet');
  expect(current()).toBe('PointList');
  expect(textOf('point-balance-value')).toBe('1200');
  await goBack();
  expect(current()).toBe('Home');

  // Home scan icon -> "Coupon Scan / Enter Coupon Code" radio dialog -> OK with 'scan' -> native scanner (MOCK) -> karigarCoupon
  setMockScan('TB-FLOW-0001');
  await press('home-scan');
  expect(lastAlert().inputs.map((i: any) => i.value)).toEqual(['scan', 'code']);
  await tapAlert(1, 'scan');
  expect(sent('app_karigar/karigarCoupon')).toEqual([{ karigar_id: (sessions as any).Plumber.id, qr_code: 'TB-FLOW-0001' }]);
  expect(lastAlert()).toMatchObject({ title: 'Success!', subTitle: '50 points has been added into your wallet' });
  // home.ts scan() re-reads karigarHome: the wallet card now shows the 50 extra points
  expect(textOf('home-wallet')).toContain('1300');

  // the balance on PointList increased by the coupon value
  await press('home-wallet');
  expect(current()).toBe('PointList');
  expect(textOf('point-balance-value')).toBe('1250');
  expect(textOf('point-scan-value')).toBe('1300'); // earn by scan 1250 + 50
  await goBack();

  // Home banner (offer slide) -> Offers -> first gift -> GiftDetail
  // (the slider lays its slides out once it has a width, as on a device)
  await act(async () => {
    find('home-offer-slides').find(n => typeof n.props.onLayout === 'function')!.props.onLayout({ nativeEvent: { layout: { width: 360 } } });
  });
  const slide = find('home-offer-slides-scroll')[0].findAll(n => typeof n.props.onPress === 'function' && (n.type as any) !== 'View')[0];
  await act(async () => {
    slide.props.onPress();
  });
  await settle();
  expect(current()).toBe('Offers');
  await press('gift-item-0');
  expect(current()).toBe('GiftDetail');
  expect(textOf('gift-title').toLowerCase()).toBe('steel water bottle');

  // Redeem -> CancelpolicyModal: sendOtp on load, the OTP is matched on the phone
  await press('gift-redeem');
  expect(current()).toBe('CancelpolicyModal');
  expect(sent('app_karigar/sendOtp')).toHaveLength(1);
  expect(sent('app_karigar/sendOtp')[0]).toMatchObject({ karigar_id: (sessions as any).Plumber.id, gift_id: 21 });
  expect(textOf('modal-question')).toContain('500 points');
  const yesDisabled = () => !!find('yes').find(n => 'disabled' in n.props)?.props.disabled;
  await type('otp-input', '000000'); // wrong OTP
  await tapBox('check1'); // "Same as Permanent Address": first tap checks it and fills the shipping address
  await tapBox('check'); // "I have read the Cancellation Policy": starts UNCHECKED, one tap
  expect(yesDisabled()).toBe(true);
  await type('otp-input', '123456'); // the fixture's sendOtp otp
  expect(yesDisabled()).toBe(false);
  await press('yes');

  expect(sent('app_karigar/redeemRequest')).toHaveLength(1);
  expect(sent('app_karigar/redeemRequest')[0]).toMatchObject({ karigar_id: (sessions as any).Plumber.id, gift_id: 21, offer_id: 11 });
  // setRoot(TabsPage, {index:'3'}): everything below is replaced; tab 3 of the loyalty tab set (Home, Offers, My Wallet, Profile, Menu)
  // is Profile, as in Ionic. The Success alert stays up over it.
  expect(rootFocused()).toBe('Tabs');
  expect(navigationRef.getRootState()!.routes).toHaveLength(1);
  expect(navigationRef.getRootState()!.routes[0].params).toEqual({ index: '3' });
  expect(current()).toBe('Profile');
  expect(lastAlert()).toMatchObject({ title: 'Success!', subTitle: 'Redeemed Request Sent Successfully' });

  // Transaction is PUSH-ONLY in Topbath: no screen has a button to it (the Ionic call sites are push notifications, a handler doing
  // nav.push(TransactionPage)). Reach it the way the app can: the navigationRef a push handler uses.
  await act(async () => {
    navigationRef.dispatch(StackActions.push('Transaction'));
  });
  await settle();
  expect(current()).toBe('Transaction');
  // the redeemed gift is the newest row, Pending, above the five fixture rows
  expect(textOf('transaction-title-0').toLowerCase()).toBe('steel water bottle');
  expect(exists('transaction-status-pending-0')).toBe(true);
  expect(textOf('transaction-title-1').toLowerCase()).toBe('steel water bottle'); // the fixture's own Pending row 505
  expect(exists('transaction-row-5')).toBe(true);
  expect(exists('transaction-row-6')).toBe(false);
});

test('Seller (Sales_Boy): ScanPoint multi-scan of two coupons, plumber number, saveCoupon carries both rows, then Home', async () => {
  await start('Sales_Boy');
  const seller = (sessions as any).Sales_Boy;

  // Home scan icon -> radio dialog -> 'scan' -> ScanPoint {mode:'home', type:'scan'}
  await press('home-scan');
  await tapAlert(1, 'scan');
  expect(current()).toBe('ScanPoint');
  expect(navigationRef.getCurrentRoute()?.params).toEqual({ mode: 'home', type: 'scan' });

  // two scans: each one is checked (checkCoupon) and added to the list
  setMockScan('TB-FLOW-0001');
  await press('scanpoint-scan');
  expect(lastAlert()).toMatchObject({ title: 'Success!', subTitle: '50 points has been scanned' });
  setMockScan('TB-FLOW-0002');
  await press('scanpoint-scan');
  expect(sent('app_karigar/checkCoupon').map(b => b.qr_code)).toEqual(['TB-FLOW-0001', 'TB-FLOW-0002']);
  expect(exists('scanpoint-item-0')).toBe(true);
  expect(exists('scanpoint-item-1')).toBe(true);
  expect(textOf('scanpoint-total-value')).toBe('100');

  // plumber number: checkNumber (EXIST, Plumber) -> get_plumber fills the name -> couponScanOtp
  await type('plumber_mobile_no-input', '9810000011');
  await settle();
  expect(sent('app_karigar/checkNumber')).toEqual([{ mobile_no: '9810000011', karigar_id: seller.id }]);
  expect(host('plumber_name-input').props.value).toBe('Test Plumber');
  expect(sent('app_karigar/couponScanOtp')).toEqual([{ mobile_no: '9810000011' }]);

  await press('scanpoint-save');
  const [body] = sent('app_karigar/saveCoupon');
  expect(body.qr_code).toEqual([
    { qr_code: 'TB-FLOW-0001', coupon_value: 50, product_name: 'Brass Bib Cock' },
    { qr_code: 'TB-FLOW-0002', coupon_value: 50, product_name: 'Brass Bib Cock' },
  ]);
  expect(body.data).toMatchObject({
    plumber_mobile_no: '9810000011',
    plumber_name: 'Test Plumber',
    plumber_id: 900011,
    sales_boy_id: seller.id,
    scanner_id: seller.id,
    scanner_type: 'Sales_Boy',
  });
  expect(lastAlert()).toMatchObject({ title: 'Success!', subTitle: 'Wallet update successfully' });
  // scan-point.ts: navCtrl.push(HomePage) after saving
  expect(current()).toBe('Home');
});
