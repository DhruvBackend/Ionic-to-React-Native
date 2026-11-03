// TaskClose screen (Ionic TaskClosePage): contracts, states, photo, submit, navigation. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { MOCK_PHOTO, MOCK_POSITION, resetMockNative, setMockNativeFailure } from '../../native';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import TaskCloseScreen from './index';

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { reset: jest.fn() };
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

function installSpy() {
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    return previous(req);
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

const PARAMS = { id: 71, mobile: '9000000051', name: 'Sunita Deshmukh', lable: 'Closed' };
async function mount(params: any = PARAMS) {
  await act(async () => {
    tree = ReactTestRenderer.create(<TaskCloseScreen navigation={navigation as any} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const toasts = () => overlayStore.getEntries().filter(e => e.kind === 'toast');
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options as any);
const sheets = () => overlayStore.getEntries().filter(e => e.kind === 'actionSheet').map(e => e.options as any);
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const press = async (id: string) => {
  const node = find(id).filter(n => typeof n.props.onPress === 'function').pop()!;
  await act(async () => {
    node.props.onPress();
  });
  await settle();
};
const type = async (id: string, text: string) => {
  const node = find(id).filter(n => typeof n.props.onChangeText === 'function').pop()!;
  await act(async () => {
    node.props.onChangeText(text);
  });
};
const body = (c: ApiRequest) => JSON.parse(c.body!);
const callsTo = (fn: string) => calls.filter(c => c.fn === fn);

async function fill() {
  await type('remark-input', 'Work done');
  await type('otp-input', '123456');
}

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  resetMockNative();
  _resetOverlaysForTests();
  navigation.reset.mockClear();
  calls = [];
  db.userStorageData = { id: '900011', type: 'Plumber' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contract (card Endpoints)', () => {
  test('Submit: complaintTaskCloseByPlumber {status}, then plumberCheckOut with the fix', async () => {
    installSpy();
    await mount();
    await fill();
    await expectContract('app_karigar/complaintTaskCloseByPlumber', () => press('submit'));
    expect(body(callsTo('app_karigar/complaintTaskCloseByPlumber')[0])).toEqual({
      status: { complaints_id: 71, name: 'Sunita Deshmukh', image: '', remark: 'Work done', otp: '123456', closed_by: '900011', status: 'Closed' },
    });
    expect(body(callsTo('app_karigar/plumberCheckOut')[0])).toEqual({
      plumber_id: '900011',
      status: 'Closed',
      remark: 'Work done',
      complaint_id: 71,
      cust_lat: MOCK_POSITION.lat,
      cust_long: MOCK_POSITION.lng,
    });
  });

  test('plumberCheckOut matches its contract', async () => {
    await mount();
    await fill();
    await expectContract('app_karigar/plumberCheckOut', () => press('submit'));
  });
});

describe('render', () => {
  test('Closed: title, Remark, Upload Image, the OTP label with the mobile, Submit', async () => {
    await mount();
    expect(allText()).toContain('Complaint Status');
    expect(allText()).toContain('Remark');
    expect(allText()).toContain('Upload Image');
    expect(allText()).toContain('add_circle');
    expect(allText()).toContain('Enter OTP Sent to 9000000051');
    expect(allText()).toContain('Submit');
    expect(find('otp-input').length).toBeGreaterThan(0);
  });

  test('Pending (In process): no OTP field', async () => {
    await mount({ ...PARAMS, lable: 'Pending' });
    expect(find('otp-input')).toHaveLength(0);
    expect(allText()).not.toContain('Enter OTP Sent to 9000000051');
  });

  test('the OTP field keeps only [0-9+- ] characters (the keypress filter)', async () => {
    await mount();
    await type('otp-input', '12a3+4-5 ');
    expect(find('otp-input').pop()!.props.value).toBe('123+4-5 ');
  });
});

describe('photo', () => {
  test('Upload Image opens the " Upload File" sheet; Camera fills the picture and hides the prompt', async () => {
    await mount();
    await press('upload-document');
    const sheet = sheets()[0];
    expect(sheet.title).toBe(' Upload File');
    expect(sheet.buttons.map((b: any) => b.text)).toEqual(['Camera', 'Gallery', 'Cancel']);
    await act(async () => {
      sheet.buttons[0].handler();
    });
    await settle();
    expect(exists('upload-image')).toBe(true);
    expect(find('upload-image')[0].props.source.uri).toBe(MOCK_PHOTO);
    expect(allText()).not.toContain('Upload Image');
  });

  test('a camera failure keeps the prompt (empty error callback)', async () => {
    setMockNativeFailure('camera', 'denied', 'no camera');
    await mount();
    await press('upload-document');
    await act(async () => {
      sheets()[0].buttons[1].handler();
    });
    await settle();
    expect(exists('upload-image')).toBe(false);
    expect(allText()).toContain('Upload Image');
  });
});

describe('submit', () => {
  test('an invalid form (no remark / short OTP) posts nothing', async () => {
    installSpy();
    await mount();
    await press('submit');
    await type('remark-input', 'x');
    await type('otp-input', '123');
    await press('submit');
    expect(callsTo('app_karigar/complaintTaskCloseByPlumber')).toHaveLength(0);
  });

  test('Pending needs only the remark', async () => {
    installSpy();
    await mount({ ...PARAMS, lable: 'Pending' });
    await type('remark-input', 'Come back');
    await press('submit');
    expect(body(callsTo('app_karigar/complaintTaskCloseByPlumber')[0]).status).toEqual({
      complaints_id: 71, name: 'Sunita Deshmukh', image: '', remark: 'Come back', closed_by: '900011', status: 'Pending',
    });
  });

  test('success (Closed): ThankYou! alert, setRoot Tabs {index: 0}, loader closed', async () => {
    await mount();
    await fill();
    await press('submit');
    expect(alerts().some(a => a.title === 'ThankYou!' && a.subTitle === 'Complaint Closed Successfully ')).toBe(true);
    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Tabs', params: { index: '0' } }] });
    expect(openLoaders()).toHaveLength(0);
  });

  test('success (Pending): Remark Added Successfully', async () => {
    await mount({ ...PARAMS, lable: 'Pending' });
    await type('remark-input', 'Come back');
    await press('submit');
    expect(alerts().some(a => a.title === 'ThankYou!' && a.subTitle === 'Remark Added Successfully ')).toBe(true);
  });

  test('Otp not matched.: Wrong Otp alert, no navigation, no check-out', async () => {
    installSpy();
    setFixtureVariant('app_karigar/complaintTaskCloseByPlumber', 'otpWrong');
    await mount();
    await fill();
    await press('submit');
    expect(alerts().some(a => a.title === 'Alert!' && a.cssClass === 'action-close' && a.subTitle === 'Wrong Otp')).toBe(true);
    expect(navigation.reset).not.toHaveBeenCalled();
    expect(callsTo('app_karigar/plumberCheckOut')).toHaveLength(0);
    expect(openLoaders()).toHaveLength(0);
  });

  test('any other status: the loader closes and nothing else happens', async () => {
    setFixtureVariant('app_karigar/complaintTaskCloseByPlumber', 'malformed');
    await mount();
    await fill();
    await press('submit');
    expect(alerts()).toHaveLength(0);
    expect(navigation.reset).not.toHaveBeenCalled();
    expect(openLoaders()).toHaveLength(0);
  });

  test('accuracy request rejected: toast, and the check-out goes out without coordinates', async () => {
    installSpy();
    setMockNativeFailure('location', 'denied', 'accuracy: user disagreed');
    await mount();
    expect(toasts().map(e => (e.options as any).message)).toEqual(['Allow Location Permissions']);
    await fill();
    await press('submit');
    expect(body(callsTo('app_karigar/plumberCheckOut')[0])).toEqual({ plumber_id: '900011', status: 'Closed', remark: 'Work done', complaint_id: 71 });
  });

  test('offline: no coordinates are kept', async () => {
    installSpy();
    const spy = jest.spyOn(require('../../native/network'), 'getNetworkState').mockResolvedValue({ ok: true, value: { online: false, type: 'none' } });
    await mount();
    await fill();
    await press('submit');
    expect(body(callsTo('app_karigar/plumberCheckOut')[0])).toEqual({ plumber_id: '900011', status: 'Closed', remark: 'Work done', complaint_id: 71 });
    spy.mockRestore();
  });
});
