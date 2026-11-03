// ScanPoint screen (Ionic ScanPointPage): contracts, states, response branches, scan loop, plumber check, save and navigation. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { resetMockNative, setMockNativeFailure, setMockScan } from '../../native/mock';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import ScanPointScreen from './index';

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn() };
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

function installSpy(override?: (req: ApiRequest) => Promise<any> | undefined) {
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    return override?.(req) ?? previous(req);
  });
  restoreTransport = () => setTransport(previous);
}

async function settle(ms = 350, rounds = 4) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
  }
}

const SCAN = { mode: 'home', type: 'scan' };
const ENTER = { mode: 'home', type: 'enter_coupon' };

async function mount(params: Record<string, unknown> | null = SCAN) {
  await act(async () => {
    tree = ReactTestRenderer.create(<ScanPointScreen navigation={navigation as any} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const host = (id: string) => find(id).find(n => typeof n.type === 'string')!;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const hasText = (s: string) => allText().some(x => x.includes(s));
const textOf = (id: string) => flat(find(id)[0].props.children);
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options as any);
const toasts = () => overlayStore.getEntries().filter(e => e.kind === 'toast').map(e => e.options as any);
const lastAlert = () => alerts()[alerts().length - 1];
const callsTo = (fn: string) => calls.filter(c => c.fn === fn);
const sent = (fn: string, i = 0) => JSON.parse(callsTo(fn)[i].body ?? 'null');
const press = async (id: string) => {
  const n = find(id).find(x => typeof x.props.onPress === 'function')!;
  await act(async () => {
    n.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
  });
  await settle();
};
const type = async (id: string, text: string) => {
  await act(async () => {
    host(`${id}-input`).props.onChangeText(text);
  });
  await settle();
};
async function runAlertButton(index: number) {
  await act(async () => {
    lastAlert().buttons[index].handler?.();
  });
  await settle();
}

beforeEach(() => {
  jest.useFakeTimers();
  resetMock();
  resetMockNative();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  calls = [];
  db.userStorageData = { id: '900002', type: 'Sales_Boy' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contracts (card Endpoints)', () => {
  test('app_karigar/checkCoupon from the scan: {karigar_id, qr_code}', async () => {
    installSpy();
    await mount();
    await expectContract('app_karigar/checkCoupon', () => press('scanpoint-scan'));
    expect(sent('app_karigar/checkCoupon')).toEqual({ karigar_id: '900002', qr_code: 'TB-MOCK-0001' });
  });

  test('app_karigar/checkCoupon from "Add To list": qr_code is data.code', async () => {
    installSpy();
    await mount(ENTER);
    await type('code', 'CODE-77');
    await expectContract('app_karigar/checkCoupon', () => press('scanpoint-add'));
    expect(sent('app_karigar/checkCoupon')).toEqual({ karigar_id: '900002', qr_code: 'CODE-77' });
  });

  test.each([
    ['app_karigar/checkNumber', { mobile_no: '9810000011', karigar_id: '900002' }],
    ['app_karigar/get_plumber', { search: '9810000011' }],
    ['app_karigar/couponScanOtp', { mobile_no: '9810000011' }],
  ])('%s when the 10th digit is typed', async (endpoint, body) => {
    installSpy();
    await mount();
    await press('scanpoint-scan');
    await expectContract(endpoint, () => type('plumber_mobile_no', '9810000011'));
    expect(sent(endpoint)).toEqual(body);
  });

  test('app_karigar/saveCoupon: {data, qr_code} with the scanner fields', async () => {
    installSpy();
    await mount();
    await press('scanpoint-scan');
    await type('plumber_mobile_no', '9810000011');
    await expectContract('app_karigar/saveCoupon', () => press('scanpoint-save'));
    expect(sent('app_karigar/saveCoupon')).toEqual({
      data: {
        plumber_mobile_no: '9810000011',
        plumber_name: 'Test Plumber',
        plumber_id: 900011,
        sales_boy_id: '900002',
        scanner_id: '900002',
        scanner_type: 'Sales_Boy',
      },
      qr_code: [{ qr_code: 'TB-MOCK-0001', coupon_value: 50, product_name: 'Brass Bib Cock' }],
    });
  });

  test('enter_coupon: saveCoupon data also carries `code` and product_name is product_point_group', async () => {
    installSpy();
    await mount(ENTER);
    await type('code', 'CODE-77');
    await press('scanpoint-add');
    await type('plumber_mobile_no', '9810000011');
    await press('scanpoint-save');
    const body = sent('app_karigar/saveCoupon');
    expect(body.data.code).toBe(''); // cleared after a successful add
    expect(body.qr_code).toEqual([{ qr_code: 'CODE-77', coupon_value: 50, product_name: 'Bib Cock' }]);
  });
});

describe('multi-scan flow', () => {
  test('two different coupons scanned, plumber entered, Save: saveCoupon carries both rows', async () => {
    installSpy();
    await mount();
    await press('scanpoint-scan');
    setMockScan('QR-2');
    await runAlertButton(0); // Scan More
    await type('plumber_mobile_no', '9810000011');
    await press('scanpoint-save');
    expect(sent('app_karigar/saveCoupon')).toEqual({
      data: {
        plumber_mobile_no: '9810000011',
        plumber_name: 'Test Plumber',
        plumber_id: 900011,
        sales_boy_id: '900002',
        scanner_id: '900002',
        scanner_type: 'Sales_Boy',
      },
      qr_code: [
        { qr_code: 'TB-MOCK-0001', coupon_value: 50, product_name: 'Brass Bib Cock' },
        { qr_code: 'QR-2', coupon_value: 50, product_name: 'Brass Bib Cock' },
      ],
    });
    expect(navigation.push).toHaveBeenCalledWith('Home');
  });
});

describe('render states', () => {
  test('scan, nothing scanned yet: title, prompt, QR picture and the Scan QR Code button', async () => {
    await mount();
    expect(hasText('Scan Qr Code')).toBe(true);
    expect(hasText('Start Scanning, click a')).toBe(true);
    expect(exists('scanpoint-qr-code-data')).toBe(true);
    expect(exists('scanpoint-scan')).toBe(true);
    expect(exists('scanpoint-form')).toBe(false);
    expect(exists('scanpoint-total')).toBe(false);
  });

  test('enter_coupon: title, Coupon Code input and Add To list', async () => {
    await mount(ENTER);
    expect(hasText('Enter Coupom Number')).toBe(true);
    expect(hasText('Coupon Code')).toBe(true);
    expect(exists('scanpoint-add')).toBe(true);
    expect(exists('scanpoint-scan')).toBe(false);
    expect(exists('scanpoint-form')).toBe(false);
  });

  test('any other type draws only the header (no title, no content)', async () => {
    await mount({ mode: 'home', type: 'other' });
    expect(exists('scanpoint-scan')).toBe(false);
    expect(exists('scanpoint-add')).toBe(false);
    expect(hasText('Scan Qr Code')).toBe(false);
  });

  test('no params at all does not throw', async () => {
    await mount(null);
    expect(exists('scanpoint-scan')).toBe(false);
  });

  test('after a scan: history list, total, form (Basic Information) and the button stays', async () => {
    await mount();
    await press('scanpoint-scan');
    expect(exists('scanpoint-qr-code-data')).toBe(false);
    expect(hasText('Scan History')).toBe(true);
    expect(hasText(' : TB-MOCK-0001')).toBe(true);
    expect(hasText('Brass Bib Cock')).toBe(true);
    expect(textOf('scanpoint-total-value')).toBe('50');
    expect(hasText('Total Scan Point')).toBe(true);
    expect(hasText('Basic Information')).toBe(true);
    expect(hasText('Plumber Mobile No *')).toBe(true);
    expect(hasText('Plumber Name *')).toBe(true);
    expect(exists('scanpoint-scan')).toBe(true);
  });

  test('enter_coupon history uses Coupon Code History / Total Point and no product line', async () => {
    await mount(ENTER);
    await type('code', 'CODE-77');
    await press('scanpoint-add');
    expect(hasText('Coupon Code History')).toBe(true);
    expect(hasText('Total Point')).toBe(true);
    expect(hasText('Bib Cock')).toBe(false);
    expect(hasText(' : CODE-77')).toBe(true);
  });
});

describe('scan loop (scan-point.ts:177-233)', () => {
  test('success alert says "N points has been scanned" with Scan More / Okay; Scan More scans again', async () => {
    await mount();
    await press('scanpoint-scan');
    const a = lastAlert();
    expect(a.title).toBe('Success!');
    expect(a.cssClass).toBe('action-close');
    expect(a.subTitle).toBe('50 points has been scanned');
    expect(a.buttons.map((b: any) => b.text)).toEqual(['Scan More', 'Okay']);
    setMockScan('QR-2');
    await runAlertButton(0);
    expect(callsTo('app_karigar/checkCoupon').length).toBe(0); // (no spy installed here)
    expect(hasText(' : QR-2')).toBe(true);
    expect(textOf('scanpoint-total-value')).toBe('100');
  });

  test('the same code twice: "Coupon Already Scanned" (Scan again / Okay) and nothing is added', async () => {
    await mount();
    await press('scanpoint-scan');
    await press('scanpoint-scan');
    const a = lastAlert();
    expect(a.title).toBe('Alert!');
    expect(a.subTitle).toBe('Coupon Already Scanned');
    expect(a.buttons.map((b: any) => b.text)).toEqual(['Scan again', 'Okay']);
    expect(textOf('scanpoint-total-value')).toBe('50');
    expect(tree.root.findAll(n => typeof n.type === 'string' && /^scanpoint-item-\d+$/.test(String(n.props.testID))).length).toBe(1);
  });

  test.each([
    ['INVALID', 'Invalid Coupon Code'],
    ['POINTS NOT EXIST', 'No Points Exit This Product'],
    ['UNASSIGNED OFFER', 'This Coupon Code is not applicable in your Area'],
    ['USED', 'Coupon Already Used By Ramesh ( 9812345670 ) on 15-10-2026'],
  ])('status %s shows the alert and adds nothing', async (variant, text) => {
    setFixtureVariant('app_karigar/checkCoupon', variant);
    await mount();
    await press('scanpoint-scan');
    expect(lastAlert().subTitle).toBe(text);
    expect(lastAlert().buttons.map((b: any) => b.text)).toEqual(['Scan again', 'Okay']);
    expect(exists('scanpoint-qr-code-data')).toBe(true);
  });

  test('"Scan again" scans again', async () => {
    installSpy();
    setFixtureVariant('app_karigar/checkCoupon', 'INVALID');
    await mount();
    await press('scanpoint-scan');
    await runAlertButton(0);
    expect(callsTo('app_karigar/checkCoupon').length).toBe(2);
  });

  test('a cancelled scan (empty text) sends nothing', async () => {
    installSpy();
    setMockScan('');
    await mount();
    await press('scanpoint-scan');
    expect(callsTo('app_karigar/checkCoupon').length).toBe(0);
    expect(alerts().length).toBe(0);
  });

  test('a denied camera does nothing (no catch in Ionic)', async () => {
    installSpy();
    setMockNativeFailure('scanner', 'denied');
    await mount();
    await press('scanpoint-scan');
    expect(callsTo('app_karigar/checkCoupon').length).toBe(0);
    expect(alerts().length).toBe(0);
  });

  test('an HTTP error does nothing: no alert, no row, no loader', async () => {
    setFixtureVariant('app_karigar/checkCoupon', 'error');
    await mount();
    await press('scanpoint-scan');
    expect(alerts().length).toBe(0);
    expect(overlayStore.getEntries().length).toBe(0);
    expect(exists('scanpoint-qr-code-data')).toBe(true);
  });

  test('a null body throws inside the callback in Ionic: nothing happens', async () => {
    installSpy(() => Promise.resolve(null));
    await mount();
    await press('scanpoint-scan');
    expect(alerts().length).toBe(0);
    expect(exists('scanpoint-qr-code-data')).toBe(true);
  });

  test('malformed / empty bodies render without throwing; the missing value prints as undefined / NaN as in Ionic', async () => {
    setFixtureVariant('app_karigar/checkCoupon', 'empty');
    await mount();
    await press('scanpoint-scan');
    expect(lastAlert().subTitle).toBe('undefined points has been scanned');
    expect(textOf('scanpoint-total-value')).toBe('NaN');
  });

  test('delete removes the row and subtracts its value; the last delete brings the prompt back', async () => {
    await mount();
    await press('scanpoint-scan');
    setMockScan('QR-2');
    await press('scanpoint-scan');
    expect(textOf('scanpoint-total-value')).toBe('100');
    await press('scanpoint-delete-0');
    expect(textOf('scanpoint-total-value')).toBe('50');
    expect(hasText(' : QR-2')).toBe(true);
    await press('scanpoint-delete-0');
    expect(exists('scanpoint-qr-code-data')).toBe(true);
    expect(exists('scanpoint-form')).toBe(false);
  });
});

describe('enter coupon (scan-point.ts:245-294)', () => {
  test('an empty code shows the toast "Please Enter Coupon Code" and sends nothing', async () => {
    installSpy();
    await mount(ENTER);
    await press('scanpoint-add');
    expect(toasts()[0].message).toBe('Please Enter Coupon Code');
    expect(toasts()[0].duration).toBe(3000);
    expect(callsTo('app_karigar/checkCoupon').length).toBe(0);
  });

  test('success: "N points has been added" (Okay only) and the input is cleared', async () => {
    await mount(ENTER);
    await type('code', 'CODE-77');
    await press('scanpoint-add');
    const a = lastAlert();
    expect(a.title).toBe('Success!');
    expect(a.subTitle).toBe('50 points has been added');
    expect(a.buttons.map((b: any) => b.text)).toEqual(['Okay']);
    expect(host('code-input').props.value).toBe('');
    expect(textOf('scanpoint-total-value')).toBe('50');
  });

  test('the same code twice: "Coupon Already Used" (Okay only), the input keeps the text', async () => {
    await mount(ENTER);
    await type('code', 'CODE-77');
    await press('scanpoint-add');
    await type('code', 'CODE-77');
    await press('scanpoint-add');
    expect(lastAlert().subTitle).toBe('Coupon Already Used');
    expect(lastAlert().buttons.map((b: any) => b.text)).toEqual(['Okay']);
    expect(host('code-input').props.value).toBe('CODE-77');
    expect(textOf('scanpoint-total-value')).toBe('50');
  });

  test.each([
    ['INVALID', 'Invalid Coupon Code', ['Scan again', 'Okay']],
    ['USED', 'Coupon Already Used By Ramesh ( 9812345670 ) on 15-10-2026', ['Scan again', 'Okay']],
    ['POINTS NOT EXIST', 'No Points Exit This Product', ['Okay']],
    ['UNASSIGNED OFFER', 'This Coupon Code is not applicable in your Area', ['Okay']],
  ])('status %s', async (variant, text, buttons) => {
    setFixtureVariant('app_karigar/checkCoupon', variant);
    await mount(ENTER);
    await type('code', 'CODE-77');
    await press('scanpoint-add');
    expect(lastAlert().subTitle).toBe(text);
    expect(lastAlert().buttons.map((b: any) => b.text)).toEqual(buttons);
    expect(exists('scanpoint-total')).toBe(false);
  });
});

describe('plumber number (scan-point.ts:311-422)', () => {
  async function withRow() {
    await mount();
    await press('scanpoint-scan');
  }

  test('EXIST + Plumber: get_plumber fills the name, the OTP is sent, nothing is shown', async () => {
    installSpy();
    await withRow();
    await type('plumber_mobile_no', '9810000011');
    expect(host('plumber_name-input').props.value).toBe('Test Plumber');
    expect(callsTo('app_karigar/couponScanOtp').length).toBe(1);
    expect(alerts().length).toBe(1); // only the scan success alert
  });

  test('fewer than 10 digits sends nothing', async () => {
    installSpy();
    await withRow();
    await type('plumber_mobile_no', '981000001');
    expect(callsTo('app_karigar/checkNumber').length).toBe(0);
  });

  test('OWNEXIST: alert names the role (Seller; Dealer for a Dealer) and Save is then refused with the same alert', async () => {
    setFixtureVariant('app_karigar/checkNumber', 'OWNEXIST');
    installSpy();
    await withRow();
    await type('plumber_mobile_no', '9810000011');
    expect(lastAlert().title).toBe('Alert!');
    expect(lastAlert().subTitle).toBe('This number is registered as Seller, please use Plumber number to proceed request');
    // blank first button + Okay (card: the empty button starts a scan)
    expect(lastAlert().buttons.map((b: any) => b.text)).toEqual(['', 'Okay']);
    await type('plumber_name', 'Typed Name');
    await press('scanpoint-save');
    expect(callsTo('app_karigar/saveCoupon').length).toBe(0);
    expect(lastAlert().subTitle).toContain('registered as Seller');
    db.userStorageData = { id: '900002', type: 'Dealer' };
    await type('plumber_mobile_no', '9810000012');
    expect(lastAlert().subTitle).toContain('registered as Dealer');
  });

  test('the blank alert button scans', async () => {
    setFixtureVariant('app_karigar/checkNumber', 'OWNEXIST');
    installSpy();
    await withRow();
    await type('plumber_mobile_no', '9810000011');
    setMockScan('QR-2');
    await runAlertButton(0);
    expect(callsTo('app_karigar/checkCoupon').length).toBe(2);
  });

  test('EXIST but not a Plumber: "does not Exists" and the number is cleared', async () => {
    setFixtureVariant('app_karigar/checkNumber', 'EXIST not plumber');
    await withRow();
    await type('plumber_mobile_no', '9810000011');
    expect(lastAlert().subTitle).toBe('9810000011 this mobile number does not Exists');
    expect(host('plumber_mobile_no-input').props.value).toBe('');
  });

  test('NOTEXIST: "is not Exists" and the number is cleared', async () => {
    setFixtureVariant('app_karigar/checkNumber', 'NOTEXIST');
    await withRow();
    await type('plumber_mobile_no', '9810000011');
    expect(lastAlert().subTitle).toBe('9810000011 this mobile number is not Exists');
    expect(host('plumber_mobile_no-input').props.value).toBe('');
  });

  test('get_plumber with no plumber sets plumber_id 0 and leaves the name for the user', async () => {
    setFixtureVariant('app_karigar/get_plumber', 'no plumber');
    installSpy();
    await withRow();
    await type('plumber_mobile_no', '9810000011');
    expect(host('plumber_name-input').props.value).toBe('');
    await type('plumber_name', 'Typed Name');
    await press('scanpoint-save');
    expect(sent('app_karigar/saveCoupon').data.plumber_id).toBe(0);
    expect(sent('app_karigar/saveCoupon').data.plumber_name).toBe('Typed Name');
  });

  test.each([['empty'], ['malformed'], ['error']])('checkNumber %s does nothing (no alert, no crash)', async variant => {
    setFixtureVariant('app_karigar/checkNumber', variant);
    await withRow();
    const before = alerts().length;
    await type('plumber_mobile_no', '9810000011');
    expect(alerts().length).toBe(before);
  });

  test.each([['empty'], ['malformed']])('get_plumber %s does not throw', async variant => {
    setFixtureVariant('app_karigar/get_plumber', variant);
    await withRow();
    await type('plumber_mobile_no', '9810000011');
    expect(exists('plumber_name')).toBe(true);
  });
});

describe('save (scan-point.ts:425-448)', () => {
  test('an invalid form shows "required" under both fields and sends nothing', async () => {
    installSpy();
    await mount();
    await press('scanpoint-scan');
    await press('scanpoint-save');
    expect(exists('plumber_mobile_no-error')).toBe(true);
    expect(exists('plumber_name-error')).toBe(true);
    expect(textOf('plumber_mobile_no-error')).toBe('required');
    expect(callsTo('app_karigar/saveCoupon').length).toBe(0);
  });

  test('a mobile of the wrong length is "required" too', async () => {
    installSpy();
    await mount();
    await press('scanpoint-scan');
    await type('plumber_mobile_no', '98100');
    await type('plumber_name', 'Typed Name');
    await press('scanpoint-save');
    expect(exists('plumber_mobile_no-error')).toBe(true);
    expect(exists('plumber_name-error')).toBe(false);
    expect(callsTo('app_karigar/saveCoupon').length).toBe(0);
  });

  test('success: alert "Wallet update successfully" (OK) and Home is pushed', async () => {
    await mount();
    await press('scanpoint-scan');
    await type('plumber_mobile_no', '9810000011');
    await press('scanpoint-save');
    expect(lastAlert().title).toBe('Success!');
    expect(lastAlert().subTitle).toBe('Wallet update successfully');
    expect(lastAlert().buttons).toEqual(['OK']);
    expect(navigation.push).toHaveBeenCalledWith('Home');
  });

  test.each([['FAILURE'], ['empty'], ['malformed']])('a %s response is treated as success too', async variant => {
    setFixtureVariant('app_karigar/saveCoupon', variant);
    await mount();
    await press('scanpoint-scan');
    await type('plumber_mobile_no', '9810000011');
    await press('scanpoint-save');
    expect(lastAlert().subTitle).toBe('Wallet update successfully');
    expect(navigation.push).toHaveBeenCalledWith('Home');
  });

  test('an HTTP error does nothing: no alert, no navigation', async () => {
    setFixtureVariant('app_karigar/saveCoupon', 'error');
    await mount();
    await press('scanpoint-scan');
    await type('plumber_mobile_no', '9810000011');
    const before = alerts().length;
    await press('scanpoint-save');
    expect(alerts().length).toBe(before);
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
