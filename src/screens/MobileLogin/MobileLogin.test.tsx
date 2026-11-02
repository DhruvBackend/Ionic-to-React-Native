// MobileLogin screen (Ionic MobileLoginPage): contracts, states, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expectContract } from '../../../__tests__/helpers/contract';
import { getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { BYPASS_NUMBERS } from '../../auth/otp';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import MobileLoginScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { navigate: jest.fn() };
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

async function settle() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
  }
}

const PARAMS = { registerType: 'Plumber', lang: 'en' };
async function mount(params: any = PARAMS) {
  await act(async () => {
    tree = ReactTestRenderer.create(<MobileLoginScreen navigation={navigation as any} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' ? c : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const input = () => find('mobile-input').find(n => typeof n.props.onChangeText === 'function')!;
const button = () => find('login-continue').find(n => typeof n.props.onPress === 'function')!;
const isDisabled = () => !!button().props.disabled;
async function type(text: string) {
  await act(async () => {
    input().props.onChangeText(text);
  });
}
async function typeDigits(digits: string) {
  for (let i = 1; i <= digits.length; i++) {
    await type(digits.slice(0, i));
  }
}
async function submit(number = '9000000011') {
  await typeDigits(number);
  await act(async () => {
    button().props.onPress();
  });
  await settle();
}
const overlays = () => overlayStore.getEntries();
const body = (fn: string) => JSON.parse(calls.find(c => c.fn === fn)!.body!);

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetMock();
  _resetOverlaysForTests();
  navigation.navigate.mockClear();
  calls = [];
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
  test('app_karigar/checkType: {mobile_no, type}', async () => {
    await mount();
    await expectContract('app_karigar/checkType', () => submit());
  });
  test('app_karigar/karigarLoginOtp: {login_data:{mobile_no, otp}}', async () => {
    await mount();
    await expectContract('app_karigar/karigarLoginOtp', () => submit());
  });
});

describe('states (card States)', () => {
  test('MobileLogin.default: texts, empty field, Continue disabled', async () => {
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Enter your mobile number to get started !', '+91', 'Continue', 'local_phone']));
    expect(input().props.placeholder).toBe('Mobile number');
    expect(input().props.value).toBe('');
    expect(isDisabled()).toBe(true);
    expect(find('header-logo').length).toBeGreaterThan(0);
    expect(find('ion-navbar').length).toBeGreaterThan(0);
  });

  test('MobileLogin.hin: translated texts', async () => {
    await mount({ registerType: 'Plumber', lang: 'hin' });
    expect(i18n.language).toBe('hin');
    expect(allText()).toContain('आरंभ करने के लिए अपना मोबाइल नंबर दर्ज करें !');
    expect(allText()).toContain('आगे बढ़ें'); // double space collapses
    expect(input().props.placeholder).toBe('मोबाइल नंबर');
  });

  test('partial number keeps Continue disabled, 10 digits enables it, max 10 chars', async () => {
    await mount();
    await typeDigits('900000001');
    expect(isDisabled()).toBe(true);
    await type('9000000011');
    expect(isDisabled()).toBe(false);
    expect(input().props.maxLength).toBe(10);
    expect(input().props.keyboardType).toBe('phone-pad');
  });

  test('TYPE_NOT_FOUND shows the toast with the number and does not continue', async () => {
    setFixtureVariant('app_karigar/checkType', 'TYPE_NOT_FOUND');
    await mount();
    await submit('9000000012');
    const toast = overlays().find(o => o.kind === 'toast')!;
    expect(toast.options.message).toBe('9000000012 This mobile number has already been registered please use another number.');
    expect(toast.options.duration).toBe(3000);
    expect(calls.some(c => c.fn === 'app_karigar/karigarLoginOtp')).toBe(false);
    expect(overlays().some(o => o.kind === 'loading')).toBe(false);
  });

  test('sending: loader "Please wait..." between the two answers', async () => {
    await mount();
    await typeDigits('9000000011');
    await act(async () => {
      button().props.onPress();
    });
    await act(async () => {
      jest.advanceTimersByTime(310); // checkType answered, karigarLoginOtp pending
    });
    const loading = overlays().find(o => o.kind === 'loading')!;
    expect(loading.options.content).toBe('Please wait...');
    expect(loading.options.dismissOnPageChange).toBe(true);
    await settle();
    expect(overlays().filter(o => o.kind === 'loading').every(o => o.leaving)).toBe(true);
  });

  test('REQUIRED MOBILE NO: "Message!" alert', async () => {
    setFixtureVariant('app_karigar/karigarLoginOtp', 'REQUIRED MOBILE NO');
    await mount();
    await submit();
    const a = overlays().find(o => o.kind === 'alert')!;
    expect(a.options).toMatchObject({ title: 'Message!', cssClass: 'action-close', subTitle: 'Please enter Mobile No to continue.', buttons: ['OK'] });
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  test('WRONG COUNTRY: garbled title, empty message, OK pushes Language without params', async () => {
    setFixtureVariant('app_karigar/karigarLoginOtp', 'WRONG COUNTRY');
    await mount();
    await submit();
    const a = overlays().find(o => o.kind === 'alert')!;
    expect(a.options.title).toBe('This mobile number is not vaild in undefined');
    expect(a.options.message).toBe('');
    expect(a.options.buttons).toHaveLength(1);
    expect(a.options.buttons[0].text).toBe('Ok');
    a.options.buttons[0].handler();
    expect(navigation.navigate).toHaveBeenCalledWith('Language');
  });

  test('unknown status, empty and malformed answers: loader closes, nothing else happens', async () => {
    for (const v of ['unknown', 'empty', 'malformed']) {
      setFixtureVariant('app_karigar/karigarLoginOtp', v);
      await mount();
      await expect(submit()).resolves.toBeUndefined();
      expect(navigation.navigate).not.toHaveBeenCalled();
      expect(overlays().filter(o => o.kind !== 'loading' || !o.leaving)).toHaveLength(0);
      act(() => tree.unmount());
      _resetOverlaysForTests();
    }
  });

  test('malformed checkType answer carries on to karigarLoginOtp', async () => {
    setFixtureVariant('app_karigar/checkType', 'malformed');
    await mount();
    await submit();
    expect(navigation.navigate).toHaveBeenCalledWith('Otp', expect.anything());
  });
});

describe('navigation', () => {
  test('SUCCESS pushes Otp with {lang, otp (the SERVER one), mobile_no, loginType}', async () => {
    await mount({ registerType: 'Dealer', lang: 'hin' });
    await submit('9000000011');
    expect(navigation.navigate).toHaveBeenCalledWith('Otp', { lang: 'hin', otp: 123456, mobile_no: '9000000011', loginType: 'Dealer' });
  });
});

describe('quirks', () => {
  test('1: opened without params: no `type` key in checkType, Otp gets undefined lang/loginType, language unchanged', async () => {
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount({});
    expect(i18n.language).toBe('hin');
    await submit();
    expect(body('app_karigar/checkType')).toEqual({ mobile_no: '9000000011' });
    expect(navigation.navigate).toHaveBeenCalledWith('Otp', { lang: undefined, otp: 123456, mobile_no: '9000000011', loginType: undefined });
  });

  test('3: typed non-digits are rejected, a pasted run is not filtered, Continue needs exactly 10', async () => {
    await mount();
    await type('9');
    await type('9a');
    expect(input().props.value).toBe('9');
    await type('9 ');
    expect(input().props.value).toBe('9');
    await type('98a7654321'); // paste
    expect(input().props.value).toBe('98a7654321');
    expect(isDisabled()).toBe(false);
  });

  test('3b: disabled button does nothing when pressed', async () => {
    await mount();
    await typeDigits('123');
    await act(async () => {
      button().props.onPress();
    });
    await settle();
    expect(calls).toHaveLength(0);
  });

  test('7: login_data is {mobile_no, otp}; otp is a number for ordinary numbers', async () => {
    await mount();
    await submit('9000000011');
    const d = body('app_karigar/karigarLoginOtp');
    expect(Object.keys(d.login_data)).toEqual(['mobile_no', 'otp']);
    expect(typeof d.login_data.otp).toBe('number');
    expect(d.login_data.otp).toBeGreaterThanOrEqual(100000);
    expect(d.login_data.otp).toBeLessThan(1000000);
  });

  test('7b: the five bypass numbers send the STRING 123456', async () => {
    for (const n of BYPASS_NUMBERS) {
      calls = [];
      await mount();
      await submit(n);
      expect(body('app_karigar/karigarLoginOtp').login_data.otp).toBe('123456');
      act(() => tree.unmount());
      _resetOverlaysForTests();
    }
  });

  test('11: checkType HTTP error does nothing at all', async () => {
    setFixtureVariant('app_karigar/checkType', 'error');
    await mount();
    await submit();
    expect(overlays()).toHaveLength(0);
    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(calls.some(c => c.fn === 'app_karigar/karigarLoginOtp')).toBe(false);
  });

  test('11b: karigarLoginOtp HTTP error closes the loader (Ionic never did) and does not navigate', async () => {
    setFixtureVariant('app_karigar/karigarLoginOtp', 'error');
    await mount();
    await submit();
    expect(overlays().filter(o => o.kind === 'loading' && !o.leaving)).toHaveLength(0);
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  test('12: dead onBackButtonClickHanlder is not wired: nothing navigates to SelectRegistrationType', async () => {
    await mount();
    expect(navigation.navigate).not.toHaveBeenCalledWith('SelectRegistrationType');
  });
});
