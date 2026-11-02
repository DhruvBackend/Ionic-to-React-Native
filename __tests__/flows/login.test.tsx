// Login flow (plan Phase 1): Language -> SelectRegistrationType -> MobileLogin -> Otp, then the three auth/login outcomes.
//
// Approach: the REAL app navigator (RootNavigator = NavigationContainer + IonStack + RoleTabs) is rendered in MOCK mode and the
// real controls are pressed. Nothing is stubbed except the Jest-wide MOCK transport; fixture variants pick the server answers
// (setFixtureVariant, as the screen tests do). The focused screen is read from navigationRef, tabs from the tab bar labels.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../src/api/client';
import { resetMock, setFixtureVariant } from '../../src/api/mock';
import i18n from '../../src/i18n';
import { RootNavigator } from '../../src/navigation/RootNavigator';
import { navigationRef } from '../../src/navigation/navigationRef';
import { tabsFor } from '../../src/navigation/tabs';
import { _resetOverlaysForTests, overlayStore } from '../../src/ui/overlays';

const act = ReactTestRenderer.act;
let tree: ReactTestRenderer.ReactTestRenderer | undefined;

const MOBILE = '9000000001';

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
// the route focused in the ROOT stack (inside Tabs getCurrentRoute() would name the selected tab's root page, e.g. Home)
const focused = () => {
  const s = navigationRef.getRootState();
  return s?.routes[s.index]?.name;
};
const rootRoutes = () => (navigationRef.getRootState()?.routes ?? []).map(r => r.name);

async function press(id: string) {
  const n = find(id).find(x => typeof x.props.onPress === 'function');
  if (!n) {
    throw new Error(`no pressable "${id}" on screen (focused: ${focused()})`);
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
const tabLabels = () =>
  tree!.root
    .findAll(n => typeof n.props.testID === 'string' && n.props.testID.startsWith('ion-tab-label-'))
    .filter(n => typeof n.type === 'string')
    .map(n => String(([] as any[]).concat(n.props.children).join('')));
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options);

// Language -> SelectRegistrationType -> MobileLogin -> Otp; stops on Otp with the fixture's OTP typed (Submit is pressed by the test).
async function walkToOtp(registerType: string) {
  await act(async () => {
    tree = ReactTestRenderer.create(<RootNavigator />);
  });
  await settle();
  expect(focused()).toBe('Language');

  await press('lang-continue');
  expect(focused()).toBe('SelectRegistrationType');

  await press(`reg-${REG_ID[registerType]}-cover`);
  await press('reg-go');
  expect(focused()).toBe('MobileLogin');

  await type('mobile-input', MOBILE);
  await press('login-continue');
  expect(focused()).toBe('Otp');
  expect(navigationRef.getCurrentRoute()?.params).toMatchObject({ loginType: registerType, mobile_no: MOBILE, otp: 123456 });

  // the screen copies the OTP from the karigarLoginOtp fixture (a number, compared loosely by Ionic's code)
  await type('otp-input', '123456');
}
const REG_ID: Record<string, string> = { Plumber: 'plumber', Sales_Boy: 'seller', Sales_Executive: 'sales-executive', Dealer: 'dealer' };

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetMock();
  _resetOverlaysForTests();
  db.userStorageData = null;
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});
afterEach(async () => {
  await act(async () => {
    tree?.unmount();
  });
  tree = undefined;
  jest.useRealTimers();
});

// SelectRegistrationType offers four radios; the value each one sets is the loginType carried to MobileLogin and Otp.
const ROLES = ['Plumber', 'Sales_Boy', 'Dealer', 'Sales_Executive'];
// auth__login.json has one SUCCESS variant per role; Plumber is 'default'.
const successVariant = (role: string) => (role === 'Plumber' ? 'default' : role);

describe.each(ROLES)('role %s', role => {
  test('SUCCESS (Verified): Tabs with the role tab set', async () => {
    setFixtureVariant('auth/login', successVariant(role));
    await walkToOtp(role);
    await press('otp-submit');

    expect(focused()).toBe('Tabs');
    expect(db.userStorageData).toMatchObject({ type: role, loginType: 'CMS' });
    expect(tabLabels()).toHaveLength(5);
    expect(tabLabels()).toEqual(tabsFor(role).map(t => t.title));
  });

  test('unverified: AboutusModal (session saved, no Tabs)', async () => {
    setFixtureVariant('auth/login', 'unverified');
    await walkToOtp(role);
    await press('otp-submit');

    expect(focused()).toBe('AboutusModal');
    expect(rootRoutes()).not.toContain('Tabs');
    expect(exists('main-modal')).toBe(true);
    expect(db.userStorageData?.status).toBe('Pending');
  });

  if (role === 'Sales_Executive') {
    // NOTE (parity): otp.ts sends Sales_Executive to a fresh MobileLogin with an alert instead of Registration.
    test('NOT FOUND: alert and a new MobileLogin (no Registration for Sales Executives)', async () => {
      setFixtureVariant('auth/login', 'NOT FOUND');
      await walkToOtp(role);
      await press('otp-submit');

      expect(focused()).toBe('MobileLogin');
      expect(alerts()[0]).toMatchObject({ subTitle: 'Sales Executive account not found. Please contact admin to get registered.' });
    });
  } else {
    test('NOT FOUND: Registration, submit, then Tabs with the role tab set', async () => {
      setFixtureVariant('auth/login', 'NOT FOUND');
      await walkToOtp(role);
      await press('otp-submit');
      expect(focused()).toBe('Registration');

      // addKarigar answers SUCCESS (default) and Registration then logs in again: that call finds the new user
      setFixtureVariant('auth/login', successVariant(role));
      await type('first_name-input', 'Ramesh Kumar');
      await press('registration-submit');

      expect(focused()).toBe('Tabs');
      expect(db.userStorageData).toMatchObject({ type: role, loginType: 'CMS' });
      expect(tabLabels()).toHaveLength(5);
      expect(tabLabels()).toEqual(tabsFor(role).map(t => t.title));
    });
  }
});

