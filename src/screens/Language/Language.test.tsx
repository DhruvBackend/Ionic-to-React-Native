// Language screen (Ionic LanguagePage): contracts, states, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { expectContract } from '../../../__tests__/helpers/contract';
import { getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import sessions from '../../api/fixtures/_sessions.json';
import i18n from '../../i18n';
import { storage } from '../../storage';
import { isOverlayOpen } from '../../ui/overlays';
import LanguageScreen from './index';

const TOKEN: string = (sessions as any).Plumber.token;
const PAYLOAD = jwtDecode(TOKEN);

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { navigate: jest.fn(), push: jest.fn() };
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
async function settle() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
  }
}

async function mount(opts: { token?: string | null } = {}) {
  if (opts.token) {
    await storage.set('token', opts.token); // the bare key language.ts reads (the shipped app never writes it)
  }
  await act(async () => {
    tree = ReactTestRenderer.create(<LanguageScreen navigation={navigation as any} route={{ params: {} } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const host = (id: string) => find(id).find(n => typeof n.type === 'string')!;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' ? c : c?.props ? flat(c.props.children) : '');
const allText = (): string[] =>
  tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const checked = (lang: 'en' | 'hin') => !!host(`lang-${lang}-cover`).props.accessibilityState.checked;
async function press(id: string) {
  const n = find(id).find(x => typeof x.props.onPress === 'function')!;
  await act(async () => {
    n.props.onPress({ nativeEvent: { locationX: 10, locationY: 10 } });
  });
}

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetMock();
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
  test('app_karigar/get_languages: GET via get_rqst on load', async () => {
    await expectContract('app_karigar/get_languages', () => mount());
  });
  test('app_karigar/get_user_lang: post_rqst {login_id} when a token is stored', async () => {
    await expectContract('app_karigar/get_user_lang', () => mount({ token: TOKEN }));
  });
  test('app_karigar/update_language: post_rqst {data:{language,id}} when Continue is tapped', async () => {
    await expectContract('app_karigar/update_language', async () => {
      await mount();
      await press('lang-continue');
      await settle();
    });
  });
});

describe('states (card States)', () => {
  test('Language.default: no token, English checked, Continue in English, get_user_lang not called', async () => {
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining(['भाषा चुनिए / Choose Your Language', 'अंग्रेज़ी (English)', 'हिंदी (Hindi)']),
    );
    expect(allText().some(s => /^continue$/i.test(s))).toBe(true);
    expect(checked('en')).toBe(true);
    expect(checked('hin')).toBe(false);
    expect(calls.map(c => c.fn)).toEqual(['app_karigar/get_languages']);
  });

  test('Language.hin: tapping Hindi checks it, switches the app language and the Continue label', async () => {
    await mount();
    await press('lang-hin-cover');
    await settle();
    expect(checked('hin')).toBe(true);
    expect(checked('en')).toBe(false);
    expect(i18n.language).toBe('hin');
    expect(allText()).toContain('आगे बढ़ें'); // hin.json has two spaces; HTML collapses them
  });

  test('Language.loggedInHin: get_user_lang -> hin pre-selects Hindi and switches the language', async () => {
    setFixtureVariant('app_karigar/get_user_lang', 'hin');
    await mount({ token: TOKEN });
    expect(checked('hin')).toBe(true);
    expect(i18n.language).toBe('hin');
  });

  test('Language.loggedInEmpty: language "" becomes en', async () => {
    setFixtureVariant('app_karigar/get_user_lang', 'empty');
    await mount({ token: TOKEN });
    expect(checked('en')).toBe(true);
    expect(i18n.language).toBe('en');
  });

  test('Language.malformed: no language -> no radio checked, Continue still shown, nothing throws', async () => {
    setFixtureVariant('app_karigar/get_user_lang', 'malformed');
    await expect(mount({ token: TOKEN })).resolves.toBeUndefined();
    expect(checked('en')).toBe(false);
    expect(checked('hin')).toBe(false);
    expect(find('lang-continue').length).toBeGreaterThan(0);
  });

  test('malformed get_languages / update_language do not throw either', async () => {
    setFixtureVariant('app_karigar/get_languages', 'malformed');
    setFixtureVariant('app_karigar/update_language', 'malformed');
    await mount();
    await press('lang-continue');
    await settle();
    expect(navigation.navigate).toHaveBeenCalledWith('SelectRegistrationType', { lang: 'en' });
  });
});

describe('navigation', () => {
  test('Continue posts update_language then navigates to SelectRegistrationType with {lang}', async () => {
    await mount();
    await press('lang-continue');
    expect(navigation.navigate).not.toHaveBeenCalled(); // only in the success callback
    await settle();
    expect(navigation.navigate).toHaveBeenCalledWith('SelectRegistrationType', { lang: 'en' });
  });

  test('with Hindi chosen the param is hin', async () => {
    await mount();
    await press('lang-hin-cover');
    await press('lang-continue');
    await settle();
    expect(navigation.navigate).toHaveBeenCalledWith('SelectRegistrationType', { lang: 'hin' });
  });
});

describe('quirks', () => {
  test('1: no token -> JwtDecode(null) throws, get_user_lang is never called, nothing crashes', async () => {
    await mount({ token: null });
    expect(calls.some(c => c.fn === 'app_karigar/get_user_lang')).toBe(false);
  });

  test('2: with a token login_id is the WHOLE decoded payload, not sub', async () => {
    await mount({ token: TOKEN });
    const req = calls.find(c => c.fn === 'app_karigar/get_user_lang')!;
    expect(JSON.parse(req.body!)).toEqual({ login_id: PAYLOAD });
  });

  test('2b: update_language posts {data:{language, id:<whole payload>}} with a token', async () => {
    await mount({ token: TOKEN });
    await press('lang-continue');
    await settle();
    const req = calls.find(c => c.fn === 'app_karigar/update_language')!;
    expect(JSON.parse(req.body!)).toEqual({ data: { language: 'en', id: PAYLOAD } });
  });

  test('2c: fresh install posts id ""', async () => {
    await mount();
    await press('lang-continue');
    await settle();
    const req = calls.find(c => c.fn === 'app_karigar/update_language')!;
    expect(JSON.parse(req.body!)).toEqual({ data: { language: 'en', id: '' } });
  });

  test('3: get_languages result is unused and its callback failure does not crash', async () => {
    await mount();
    expect(calls.some(c => c.fn === 'app_karigar/get_languages' && c.method === 'GET')).toBe(true);
    expect(allText().some(s => /English/.test(s))).toBe(true);
  });

  test('5: an HTTP error on update_language does nothing (no navigation, no overlay)', async () => {
    setFixtureVariant('app_karigar/update_language', 'error');
    await mount();
    await press('lang-continue');
    await settle();
    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(isOverlayOpen()).toBe(false);
  });

  test('7: opening the page resets the app language to English', async () => {
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(i18n.language).toBe('en');
  });

  test('8: dead code is not wired: no add_country call is ever made', async () => {
    await mount();
    await press('lang-hin-cover');
    await press('lang-continue');
    await settle();
    expect(calls.some(c => c.fn === 'app_karigar/add_country')).toBe(false);
  });

  test('10: header is a toolbar with only the logo (no title, no back button)', async () => {
    await mount();
    expect(find('ion-toolbar').length).toBeGreaterThan(0);
    expect(find('ion-navbar').length).toBe(0);
    expect(find('header-logo').length).toBeGreaterThan(0);
  });
});
