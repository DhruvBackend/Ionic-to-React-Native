// CoupanCode screen (Ionic CoupanCodePage): contract, typed-code submit, scan, status alerts, setRoot(Tabs). See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import sessions from '../../api/fixtures/_sessions.json';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { resetMockNative, setMockNativeFailure, setMockScan } from '../../native';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import route from './route';
import CoupanCodeScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn(), reset: jest.fn() };
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

async function settle() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
  }
}
async function mount(params: object | undefined = { mode: 'home' }) {
  db.userStorageData = { ...(sessions as any).Plumber };
  await act(async () => {
    tree = ReactTestRenderer.create(<CoupanCodeScreen navigation={navigation as any} route={params ? ({ params } as any) : undefined} />);
  });
  await settle();
}
const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' ? c : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const input = () => find('coupon-input').find(n => typeof n.props.onChangeText === 'function')!;
async function type(text: string) {
  await act(async () => {
    input().props.onChangeText(text);
  });
}
async function press(id: string) {
  const target = find(id).find(n => typeof n.props.onPress === 'function')!;
  expect(target).toBeDefined();
  await act(async () => {
    target.props.onPress();
  });
  await settle();
}
const lastAlert = () => overlayStore.getEntries().filter(o => o.kind === 'alert').pop()!;
const couponCalls = () =>
  calls
    .filter(c => c.fn === 'app_karigar/karigarCoupon')
    .map(c => ({ ...c, body: typeof c.body === 'string' ? JSON.parse(c.body) : c.body }));

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  resetMockNative();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  navigation.reset.mockClear();
  calls = [];
  await act(async () => {
    await i18n.changeLanguage('en');
  });
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    return previous(req);
  });
  restoreTransport = () => setTransport(previous);
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

test('route: a pushed card page that leads to Tabs', () => {
  expect(route.name).toBe('CoupanCode');
  expect(route.presentation).toBe('card');
  expect(route.links).toEqual(['Tabs']);
});

describe('contract (card Endpoints)', () => {
  test('app_karigar/karigarCoupon from Submit: {karigar_id, qr_code}', async () => {
    await mount();
    await expectContract('app_karigar/karigarCoupon', async () => {
      await type('ABC123');
      await press('coupon-submit');
    });
  });
  test('app_karigar/karigarCoupon from the scan icon: {karigar_id, qr_code}', async () => {
    setMockScan('QR-1');
    await mount();
    await expectContract('app_karigar/karigarCoupon', () => press('coupon-scan'));
  });
});

describe('render', () => {
  test('default: header, paragraph, input, button and scan hint; no Required message, no request on load', async () => {
    await mount();
    const t = allText();
    expect(t).toContain('Enter Coupon Code');
    expect(t).toContain('Please enter coupon code here, to get your points');
    expect(t).toContain('Submit');
    expect(t).toContain('qr_code_2');
    expect(t).toContain('Tap on scan icon to scan your coupon');
    expect(t).not.toContain('Required');
    expect(input().props.placeholder).toBe('Coupon Code');
    expect(calls).toHaveLength(0);
  });
  test('called with no params (Home scan() with manual_permission 1) renders the same', async () => {
    await mount(undefined);
    expect(allText()).toContain('Please enter coupon code here, to get your points');
  });
  test('Hindi selected: nothing is translated (the module has no TranslateModule)', async () => {
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(allText()).toContain('Enter Coupon Code');
    expect(allText()).toContain('Submit');
  });
});

describe('Submit', () => {
  test('empty box: "Required" shows and the request is still sent (qr_code undefined), REQUIRED alert', async () => {
    setFixtureVariant('app_karigar/karigarCoupon', 'REQUIRED');
    await mount();
    await press('coupon-submit');
    expect(allText()).toContain('Required');
    expect(couponCalls()).toHaveLength(1);
    expect(couponCalls()[0].body.qr_code).toBeUndefined();
    expect(lastAlert().options).toMatchObject({ title: 'Alert!', cssClass: 'action-close', subTitle: 'Please Enter Coupon Code', buttons: ['OK'] });
    expect(navigation.reset).not.toHaveBeenCalled();
  });
  test('typing after Required hides the message; emptying again shows it', async () => {
    await mount();
    await press('coupon-submit');
    expect(allText()).toContain('Required');
    await type('A');
    expect(allText()).not.toContain('Required');
    await type('');
    expect(allText()).toContain('Required');
  });
  test('typed code: body, success alert and setRoot(Tabs, {index:"0"})', async () => {
    await mount();
    await type('ABC123');
    await press('coupon-submit');
    expect(couponCalls()[0].body).toEqual({ karigar_id: '900001', qr_code: 'ABC123' });
    expect(lastAlert().options).toMatchObject({ title: 'Success!', cssClass: 'action-close', subTitle: '50 points has been added into your wallet', buttons: ['OK'] });
    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Tabs', params: { index: '0' } }] });
    expect(navigation.push).not.toHaveBeenCalled();
  });
  test.each([
    ['BLANK', "This Coupon Code doesn't contain any Value"],
    ['INVALID', 'Invalid Coupon Code'],
    ['REQUIRED', 'Please Enter Coupon Code'],
    ['POINTS NOT EXIST', 'No Points Exit This Product'],
    ['USED', 'Coupon Already Used'],
    ['UNASSIGNED OFFER', 'This Coupon Code is not applicable in your Area'],
  ])('%s: Alert! "%s", stays on the page', async (variant, text) => {
    setFixtureVariant('app_karigar/karigarCoupon', variant);
    await mount();
    await type('X1');
    await press('coupon-submit');
    expect(lastAlert().options).toMatchObject({ title: 'Alert!', cssClass: 'action-close', subTitle: text, buttons: ['OK'] });
    expect(navigation.reset).not.toHaveBeenCalled();
  });
  test.each(['malformed', 'empty'])('%s answer: success alert with "undefined points" and setRoot (Ionic does the same)', async variant => {
    setFixtureVariant('app_karigar/karigarCoupon', variant);
    await mount();
    await type('X1');
    await press('coupon-submit');
    expect(lastAlert().options.subTitle).toBe('undefined points has been added into your wallet');
    expect(navigation.reset).toHaveBeenCalledTimes(1);
  });
  test('null body: Ionic throws inside the subscribe callback, nothing visible, no crash', async () => {
    const prev = getTransport();
    setTransport(req => (req.fn === 'app_karigar/karigarCoupon' ? Promise.resolve(null as any) : prev(req)));
    await mount();
    await type('X1');
    await press('coupon-submit');
    expect(overlayStore.getEntries().filter(o => o.kind === 'alert')).toHaveLength(0);
    expect(navigation.reset).not.toHaveBeenCalled();
  });
  test('network error: no error callback in Ionic, nothing happens', async () => {
    const prev = getTransport();
    setTransport(req => (req.fn === 'app_karigar/karigarCoupon' ? Promise.reject(new Error('offline')) : prev(req)));
    await mount();
    await type('X1');
    await press('coupon-submit');
    expect(overlayStore.getEntries().filter(o => o.kind === 'alert')).toHaveLength(0);
    expect(navigation.reset).not.toHaveBeenCalled();
  });
});

describe('scan icon', () => {
  async function scanWith(variant: string | null) {
    if (variant) {
      setFixtureVariant('app_karigar/karigarCoupon', variant);
    }
    setMockScan('QR-1');
    await mount();
    await press('coupon-scan');
  }
  test('success: posts the scanned text, success alert, setRoot(Tabs)', async () => {
    await scanWith(null);
    expect(couponCalls()[0].body).toEqual({ karigar_id: '900001', qr_code: 'QR-1' });
    expect(lastAlert().options).toMatchObject({ title: 'Success!', subTitle: '50 points has been added into your wallet' });
    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Tabs', params: { index: '0' } }] });
  });
  test.each([
    ['INVALID', 'Invalid Coupon Code'],
    ['USED', 'Coupon Already Used'],
    ['UNASSIGNED OFFER', 'Invalid Coupon Code'],
    ['REQUIRED', 'Please Enter the coupon code '],
  ])('%s: "%s"', async (variant, text) => {
    await scanWith(variant);
    expect(lastAlert().options).toMatchObject({ title: 'Alert!', cssClass: 'action-close', subTitle: text, buttons: ['OK'] });
    expect(navigation.reset).not.toHaveBeenCalled();
  });
  test.each(['BLANK', 'POINTS NOT EXIST', 'malformed'])('%s is not handled by scan(): success alert with "undefined points" and setRoot', async variant => {
    await scanWith(variant);
    expect(lastAlert().options).toMatchObject({ title: 'Success!', subTitle: 'undefined points has been added into your wallet' });
    expect(navigation.reset).toHaveBeenCalledTimes(1);
  });
  test('scanner cancelled (text ""), denied: no request, no alert', async () => {
    setMockScan('');
    await mount();
    await press('coupon-scan');
    setMockNativeFailure('scanner', 'denied');
    await press('coupon-scan');
    expect(couponCalls()).toHaveLength(0);
    expect(overlayStore.getEntries().filter(o => o.kind === 'alert')).toHaveLength(0);
  });
  test('the typed code is not used by the scan request', async () => {
    setMockScan('QR-9');
    await mount();
    await type('TYPED');
    await press('coupon-scan');
    expect(couponCalls()[0].body.qr_code).toBe('QR-9');
  });
});
