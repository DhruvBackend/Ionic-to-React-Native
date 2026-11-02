// Otp screen (Ionic OtpPage): contracts, states, response branches, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import sessions from '../../api/fixtures/_sessions.json';
import loginFixture from '../../api/fixtures/auth__login.json';
import i18n from '../../i18n';
import { session } from '../../auth/session';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import OtpScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn() };
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

// let the mock's 300 ms latency and every pending promise run
async function settle(ms = 350, rounds = 4) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
  }
}

const BASE = { lang: 'en', otp: '123456', mobile_no: '9000000001', loginType: 'Plumber' };

async function mount(params: Record<string, unknown> = BASE) {
  await act(async () => {
    tree = ReactTestRenderer.create(<OtpScreen navigation={navigation as any} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const host = (id: string) => find(id).find(n => typeof n.type === 'string')!;
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const submitDisabled = () => !!find('otp-submit')[0].props.disabled;

async function type(text: string) {
  await act(async () => {
    host('otp-input').props.onChangeText(text);
  });
}
async function blur() {
  await act(async () => {
    host('otp-input').props.onBlur();
  });
}
async function press(id: string) {
  const n = find(id).find(x => typeof x.props.onPress === 'function')!;
  await act(async () => {
    n.props.onPress({ nativeEvent: { locationX: 10, locationY: 10 } });
  });
}
async function submitWith(variant?: string, params: Record<string, unknown> = BASE) {
  if (variant) {
    setFixtureVariant('auth/login', variant);
  }
  await mount(params);
  await type('123456');
  await press('otp-submit');
  await settle();
}

const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options);
const stored = async () => JSON.parse((await AsyncStorage.getItem('userStorageData')) ?? 'null');

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  calls = [];
  db.userStorageData = null;
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
  test('auth/login: onPostRequestDataFromApi {mobile_no, mode: "App"} when Submit is pressed', async () => {
    // variant 'other' so the login does not store a session (expectContract reads the token after the call)
    setFixtureVariant('auth/login', 'other');
    await expectContract('auth/login', async () => {
      await mount();
      await type('123456');
      await press('otp-submit');
      await settle();
    }, { loggedIn: false });
  });
  test('app_karigar/karigarLoginOtp: {login_data: {otp, mobile_no}} when Resend is pressed', async () => {
    await expectContract('app_karigar/karigarLoginOtp', async () => {
      await mount();
      await type('123456'); // data.otp is whatever was typed
      await press('otp-resend');
      await settle();
    });
  });
  test('login body carries the mobile number from navParams', async () => {
    await submitWith();
    expect(JSON.parse(calls.find(c => c.fn === 'auth/login')!.body!)).toEqual({ mobile_no: '9000000001', mode: 'App' });
  });
});

describe('states (card States)', () => {
  test('Otp.default: prompt, +91 number, placeholder, Resend, disabled Submit, no error', async () => {
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Enter your 6 digit number that sent to', '+91 9000000001', 'Resend', 'Submit']));
    expect(host('otp-input').props.placeholder).toBe('Enter OTP');
    expect(submitDisabled()).toBe(true);
    expect(exists('otp-error')).toBe(false);
    expect(exists('otp-resend')).toBe(true);
    expect(exists('otp-resend-wait')).toBe(false);
  });

  test('Otp.hin: lang hin switches the translated texts', async () => {
    await mount({ ...BASE, lang: 'hin' });
    expect(i18n.language).toBe('hin');
    expect(allText()).toEqual(expect.arrayContaining(['अपना 6 अंकों का नंबर दर्ज करें जो भेजा गया', 'पुन: भेजें', 'निवेदन']));
    expect(host('otp-input').props.placeholder).toBe('ओटीपी दर्ज करें');
  });

  test('Otp.wrongOtp: blur with a wrong or empty value shows "Wrong OTP value"; Submit stays disabled', async () => {
    await mount();
    await blur();
    expect(allText()).toContain('Wrong OTP value'); // touched + isOtpValid undefined
    await type('111111');
    expect(allText()).toContain('Wrong OTP value');
    expect(submitDisabled()).toBe(true);
  });

  test('no error before the field was touched', async () => {
    await mount();
    await type('111111');
    expect(exists('otp-error')).toBe(false);
  });

  test('Otp.validOtp: the matching code enables Submit and hides the error', async () => {
    await mount();
    await blur();
    await type('123456');
    expect(submitDisabled()).toBe(false);
    expect(exists('otp-error')).toBe(false);
  });

  test('Otp.resendSent: after Resend the link becomes the greyed countdown and the alert is shown', async () => {
    await mount();
    await press('otp-resend');
    await settle();
    expect(exists('otp-resend')).toBe(false);
    expect(allText().some(x => /^New OTP resent to be available in seconds [0-9]+$/.test(x))).toBe(true);
    expect(alerts()[0]).toMatchObject({ title: 'Message!', subTitle: 'OTP has been sent.', buttons: ['OK'] });
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('quirks', () => {
  test('digits only, at most 6 (keypress filter + maxlength)', async () => {
    await mount();
    await type('12a3-45678');
    expect(host('otp-input').props.value).toBe('123456');
  });

  test('client-side compare is loose: a numeric server OTP matches the typed string', async () => {
    await mount({ ...BASE, otp: 654321 });
    await type('654321');
    expect(submitDisabled()).toBe(false);
  });

  test('Resend: the countdown ticks down each second and the link returns after 30 s', async () => {
    await mount();
    await press('otp-resend');
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(allText()).toContain('New OTP resent to be available in seconds 27');
    await act(async () => {
      jest.advanceTimersByTime(28000);
    });
    expect(exists('otp-resend')).toBe(true);
  });

  test('Resend: the server otp replaces the one to compare with', async () => {
    setFixtureVariant('app_karigar/karigarLoginOtp', 'newOtp');
    await mount();
    await type('123456');
    expect(submitDisabled()).toBe(false);
    await press('otp-resend');
    await settle();
    await type('123456'); // the old code no longer matches
    expect(submitDisabled()).toBe(true);
    await type('654321');
    expect(submitDisabled()).toBe(false);
  });

  test('Resend: SUCCESS without otp leaves nothing to match', async () => {
    setFixtureVariant('app_karigar/karigarLoginOtp', 'malformed');
    await mount();
    await press('otp-resend');
    await settle();
    await type('123456');
    expect(submitDisabled()).toBe(true);
  });

  test('Resend body has no otp key when nothing was typed (JSON drops undefined)', async () => {
    await mount();
    await press('otp-resend');
    await settle();
    expect(JSON.parse(calls.find(c => c.fn === 'app_karigar/karigarLoginOtp')!.body!)).toEqual({ login_data: { mobile_no: '9000000001' } });
  });

  test('Resend HTTP error: loader closes, alert "Error..!!!"', async () => {
    setFixtureVariant('app_karigar/karigarLoginOtp', 'error');
    await mount();
    await press('otp-resend');
    await settle();
    expect(alerts().map(a => a.subTitle)).toEqual(['Error..!!!']);
    expect(openLoaders()).toHaveLength(0);
  });

  test('Resend with a non-SUCCESS status: no alert, loader closes', async () => {
    setFixtureVariant('app_karigar/karigarLoginOtp', 'empty');
    await mount();
    await press('otp-resend');
    await settle();
    expect(alerts()).toHaveLength(0);
    expect(openLoaders()).toHaveLength(0);
  });

  test('loader "Please wait..." is open while auth/login is pending', async () => {
    await mount();
    await type('123456');
    await press('otp-submit');
    expect(openLoaders()).toHaveLength(1);
    expect(openLoaders()[0].options.content).toBe('Please wait...');
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });

  test('HTTP error on auth/login: loader closes (Ionic left it open), nothing else happens', async () => {
    await submitWith('error');
    expect(openLoaders()).toHaveLength(0);
    expect(navigation.push).not.toHaveBeenCalled();
    expect(alerts()).toHaveLength(0);
  });

  test('unmounting clears the timers', async () => {
    await mount();
    act(() => tree.unmount());
    const baseline = jest.getTimerCount();
    await mount();
    await press('otp-resend');
    await settle();
    act(() => tree.unmount());
    expect(jest.getTimerCount()).toBeLessThanOrEqual(baseline);
  });
});

describe('auth/login branches and navigation', () => {
  test('SUCCESS + Verified: stores {...user, token, loginType: "CMS"} and pushes Tabs {lang}', async () => {
    await submitWith();
    const fx: any = (loginFixture as any).variants.default;
    expect(await stored()).toEqual({ ...fx.user, token: fx.token, loginType: 'CMS' });
    expect((db.userStorageData as any).token).toBe(fx.token);
    expect((await session.load())?.loginType).toBe('CMS');
    expect(navigation.push).toHaveBeenCalledWith('Tabs', { lang: 'en' });
    expect(navigation.push).toHaveBeenCalledTimes(1);
  });

  test.each(['Sales_Boy', 'Dealer', 'Sales_Executive', 'Customer', 'Retailer'])('SUCCESS as %s stores that user and pushes Tabs', async role => {
    await submitWith(role);
    expect((await stored()).type).toBe(role);
    expect(navigation.push).toHaveBeenCalledWith('Tabs', { lang: 'en' });
  });

  test('SUCCESS but status != Verified: stored, then AboutusModal {country: undefined}', async () => {
    await submitWith('unverified');
    expect((await stored()).status).toBe('Pending');
    expect(navigation.push).toHaveBeenCalledWith('AboutusModal', { country: undefined });
    expect(navigation.push).toHaveBeenCalledTimes(1);
  });

  test('NOT FOUND: Registration {mobile_no, loginType}, no alert, nothing stored', async () => {
    await submitWith('NOT FOUND');
    expect(navigation.push).toHaveBeenCalledWith('Registration', { mobile_no: '9000000001', loginType: 'Plumber' });
    expect(alerts()).toHaveLength(0);
    expect(await stored()).toBeNull();
  });

  test('NOT FOUND for Sales_Executive: alert, then MobileLogin with no params', async () => {
    await submitWith('NOT FOUND', { ...BASE, loginType: 'Sales_Executive' });
    expect(alerts()[0]).toMatchObject({
      title: 'Message!',
      cssClass: 'action-close',
      subTitle: 'Sales Executive account not found. Please contact admin to get registered.',
      buttons: ['OK'],
    });
    expect(navigation.push).toHaveBeenCalledWith('MobileLogin');
  });

  test('ACCOUNT SUSPENDED: alert, then MobileLogin with no params', async () => {
    await submitWith('suspended');
    expect(alerts()[0]).toMatchObject({ subTitle: 'Your account has been suspended' });
    expect(navigation.push).toHaveBeenCalledWith('MobileLogin');
    expect(await stored()).toBeNull();
  });

  test('any other status does nothing', async () => {
    await submitWith('other');
    expect(navigation.push).not.toHaveBeenCalled();
    expect(alerts()).toHaveLength(0);
    expect(openLoaders()).toHaveLength(0);
  });

  test('Otp.malformed: SUCCESS without a user (Ionic TypeError) stores nothing, navigates nowhere, does not throw', async () => {
    await expect(submitWith('malformed')).resolves.toBeUndefined();
    expect(await stored()).toBeNull();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(openLoaders()).toHaveLength(0);
  });

  test('empty response ({}): does nothing', async () => {
    await submitWith('empty');
    expect(navigation.push).not.toHaveBeenCalled();
  });

  test('sessions fixture and login fixture agree on the Plumber user (flow-test sanity)', () => {
    expect((loginFixture as any).variants.default.token).toBe((sessions as any).Plumber.token);
  });
});

describe('malformed route params', () => {
  test('no params at all renders without throwing (Ionic shows an empty number)', async () => {
    await expect(mount({})).resolves.toBeUndefined();
    expect(allText()).toContain('+91 ');
    expect(submitDisabled()).toBe(true);
  });
});
