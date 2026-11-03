// Customeradd screen (Ionic CustomeraddPage): contracts, two-step OTP flow, states, response branches, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expectContract, loadContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import CustomeraddScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { popTo: jest.fn() };
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

const NEW = { mobile_no: '9000000011' };

async function mount(params: Record<string, unknown> = NEW) {
  await act(async () => {
    tree = ReactTestRenderer.create(<CustomeraddScreen navigation={navigation as any} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const host = (id: string) => find(id).find(n => typeof n.type === 'string')!;
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const hasText = (s: string) => allText().some(x => x.includes(s));

async function type(name: string, text: string) {
  await act(async () => {
    host(`${name}-input`).props.onChangeText(text);
  });
  await settle();
}
async function blur(name: string) {
  await act(async () => {
    host(`${name}-input`).props.onBlur?.();
  });
  await settle();
}
async function change(id: string, value: unknown) {
  const el = find(id).find(n => typeof n.props.onChange === 'function')!;
  await act(async () => {
    el.props.onChange(value, { value });
  });
  await settle();
}
async function press(id: string) {
  const n = find(id).find(x => typeof x.props.onPress === 'function')!;
  await act(async () => {
    n.props.onPress({ nativeEvent: { locationX: 10, locationY: 10 } });
  });
  await settle();
}
const sentBody = (fn: string) => JSON.parse(calls.find(c => c.fn === fn)!.body ?? 'null');
const callsTo = (fn: string) => calls.filter(c => c.fn === fn);
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options);

async function fillStep1() {
  await type('first_name', 'Ramesh Kumar');
  await type('mobile_no', '9000000011');
  await change('dob', '2026-10-01');
  await type('address', 'rajnagar extension');
  await change('state', 'UTTAR PRADESH');
  await change('district', 'GHAZIABAD');
  await type('city', 'Sahibabad');
  await type('pincode', '201010');
}
async function toStep2() {
  await mount();
  await fillStep1();
  await press('next');
}
async function submitWith(code: string) {
  await toStep2();
  await type('otp', code);
  await press('customeradd-submit');
  await settle();
}

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetMock();
  _resetOverlaysForTests();
  navigation.popTo.mockClear();
  calls = [];
  db.userStorageData = { id: '900002' };
  await act(async () => {
    await i18n.changeLanguage('en');
  });
  installSpy();
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contracts (card Endpoints)', () => {
  test('app_master/getStates: GET on mount', async () => {
    await expectContract('app_master/getStates', () => mount());
  });
  test('app_master/getDistrict: {state_name} when the state changes', async () => {
    await expectContract('app_master/getDistrict', async () => {
      await mount();
      await change('state', 'DELHI');
    });
    expect(sentBody('app_master/getDistrict')).toEqual({ state_name: 'DELHI' });
  });
  test('app_karigar/karigarLoginOtp (post_rqst): {login_data: data} when Next is pressed', async () => {
    await expectContract(loadContract('app_karigar/karigarLoginOtp.Customeradd'), toStep2, { loggedIn: true });
    expect(sentBody('app_karigar/karigarLoginOtp').login_data).toMatchObject({
      mobileNo: '9000000011', type: 'Customer', sales_boy_id: '900002', status: 'Verified', mobile_no: '9000000011', address: 'Rajnagar Extension',
    });
  });
  test('app_karigar/addKarigar: {karigar: data} with the typed otp', async () => {
    await expectContract(loadContract('app_karigar/addKarigar.Customeradd'), () => submitWith('123456'), { loggedIn: true });
    expect(sentBody('app_karigar/addKarigar').karigar).toMatchObject({ otp: '123456', karigar_edit_id: '', type: 'Customer', status: 'Verified' });
  });
  test('checkNumber is never called (checkNumber() has no caller in Ionic)', async () => {
    await submitWith('123456');
    expect(callsTo('app_karigar/checkNumber')).toHaveLength(0);
  });
});

describe('states (card States)', () => {
  test('step 1: every field, stars, Next disabled until all required fields are filled', async () => {
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Add New Customer', 'Next']));
    ['Basic information', 'Name', 'Mobile No.', 'Date of Purchase', 'Address information', 'Address', 'State', 'District', 'Area', 'Pincode'].forEach(s =>
      expect(hasText(s)).toBe(true),
    );
    // NOTE (parity): `data.mobileNo` is set, not `mobile_no`: the field starts empty
    expect(host('mobile_no-input').props.value).toBe('');
    expect(find('next').find(n => n.props.disabled !== undefined)!.props.disabled).toBe(true);
    await fillStep1();
    expect(find('next').find(n => n.props.disabled !== undefined)!.props.disabled).toBe(false);
  });
  test('step 2: prompt, OTP field, Resend, Submit, Back', async () => {
    await toStep2();
    expect(hasText('Enter your 6 digit number that sent to 9000000011')).toBe(true);
    expect(hasText('Enter OTP *')).toBe(true);
    expect(hasText('Resend')).toBe(true);
    expect(hasText('Submit')).toBe(true);
    expect(hasText('Back')).toBe(true);
    expect(exists('first_name')).toBe(false);
  });
  test('Back returns to step 1 with the typed values', async () => {
    await toStep2();
    await press('back');
    expect(host('first_name-input').props.value).toBe('Ramesh Kumar');
    expect(host('pincode-input').props.value).toBe('201010');
  });
  test('malformed states render without throwing', async () => {
    setFixtureVariant('app_master/getStates', 'malformed');
    await mount();
    expect(hasText('Add New Customer')).toBe(true);
  });
  test('hin: labels come from the global language', async () => {
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(hasText('Add New Customer')).toBe(false); // translated (key 'Add New Customer' exists in the hin bundle)
  });
});

describe('OTP flow', () => {
  test('Next: "OTP has been sent." message alert; no loader', async () => {
    await toStep2();
    expect(alerts()[0]).toMatchObject({ title: 'Message!', subTitle: 'OTP has been sent.' });
    expect(openLoaders()).toHaveLength(0);
  });
  test('karigarLoginOtp error: "Error..!!!" message alert', async () => {
    setFixtureVariant('app_karigar/karigarLoginOtp', 'error');
    await toStep2();
    expect(alerts()[0]).toMatchObject({ title: 'Message!', subTitle: 'Error..!!!' });
  });
  test('non-SUCCESS status: no alert', async () => {
    setFixtureVariant('app_karigar/karigarLoginOtp', 'unknown');
    await toStep2();
    expect(alerts()).toHaveLength(0);
  });
  test('Wrong OTP value shows only after the OTP field was touched and does not match', async () => {
    await toStep2();
    expect(hasText('Wrong OTP value')).toBe(false);
    await type('otp', '111111');
    expect(hasText('Wrong OTP value')).toBe(false);
    await blur('otp');
    expect(hasText('Wrong OTP value')).toBe(true);
    await type('otp', '123456');
    expect(hasText('Wrong OTP value')).toBe(false);
  });
  test('the OTP compare is loose: a typed string equals the numeric otp', async () => {
    await toStep2();
    await type('otp', '123456');
    await blur('otp');
    expect(hasText('Wrong OTP value')).toBe(false);
  });
  test('Resend: calls the endpoint again, then the dimmed "New OTP resent ... 30" box for good (no timer)', async () => {
    await toStep2();
    setFixtureVariant('app_karigar/karigarLoginOtp', 'newOtp');
    calls = [];
    await press('resend');
    expect(callsTo('app_karigar/karigarLoginOtp')).toHaveLength(1);
    expect(exists('resend-wait')).toBe(true);
    expect(hasText('New OTP resent to be available in seconds 30')).toBe(true);
    await settle(31000, 2);
    expect(exists('resend-wait')).toBe(true);
    await type('otp', '654321');
    await blur('otp');
    expect(hasText('Wrong OTP value')).toBe(false);
  });
  test('Submit with an empty OTP: "required" text, no request', async () => {
    await toStep2();
    calls = [];
    await press('customeradd-submit');
    expect(hasText('required')).toBe(true);
    expect(callsTo('app_karigar/addKarigar')).toHaveLength(0);
  });
  test('Submit with a wrong code: nothing happens (no alert, no request, no loader)', async () => {
    await submitWith('999999');
    expect(callsTo('app_karigar/addKarigar')).toHaveLength(0);
    expect(openLoaders()).toHaveLength(0);
    expect(alerts()).toHaveLength(1); // only "OTP has been sent."
  });
});

describe('quirks', () => {
  test('Name accepts letters, + - and space only', async () => {
    await mount();
    await type('first_name', 'Ra1m+e-sh K.umar');
    expect(host('first_name-input').props.value).toBe('Ram+e-sh Kumar');
  });
  test('Mobile No. has NO digit filter (maxlength 10 only); Pincode takes digits only', async () => {
    await mount();
    await type('mobile_no', '90a00');
    expect(host('mobile_no-input').props.value).toBe('90a00');
    await type('pincode', '20a1');
    expect(host('pincode-input').props.value).toBe('201');
  });
  test('Address upper-cases the first letter of every word', async () => {
    await mount();
    await type('address', 'plot 5, main road');
    expect(host('address-input').props.value).toBe('Plot 5, Main Road');
  });
});

describe('addKarigar branches and navigation', () => {
  test('SUCCESS: loader closes and popTo(Customerlist)', async () => {
    await submitWith('123456');
    expect(openLoaders()).toHaveLength(0);
    expect(navigation.popTo).toHaveBeenCalledWith('Customerlist');
  });
  test('EXIST: "Already Registered!" alert, no navigation', async () => {
    setFixtureVariant('app_karigar/addKarigar', 'EXIST');
    await submitWith('123456');
    expect(alerts().pop()).toMatchObject({ title: 'Alert!', subTitle: 'Already Registered!', buttons: ['OK'] });
    expect(navigation.popTo).not.toHaveBeenCalled();
  });
  test('other status: loader closes, nothing else', async () => {
    setFixtureVariant('app_karigar/addKarigar', 'other');
    await submitWith('123456');
    expect(openLoaders()).toHaveLength(0);
    expect(navigation.popTo).not.toHaveBeenCalled();
  });
  test('malformed (null body): loader closes, nothing else', async () => {
    setFixtureVariant('app_karigar/addKarigar', 'malformed');
    await submitWith('123456');
    expect(openLoaders()).toHaveLength(0);
    expect(navigation.popTo).not.toHaveBeenCalled();
  });
  test('HTTP error: the loader stays up (no error callback in Ionic)', async () => {
    setFixtureVariant('app_karigar/addKarigar', 'error');
    await submitWith('123456');
    expect(openLoaders()).toHaveLength(1);
  });
});
