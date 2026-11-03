// Profile screen (Ionic ProfilePage): contract, role branches, response branches, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContext } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import sessions from '../../api/fixtures/_sessions.json';
import i18n from '../../i18n';
import { resetMockNative, setMockNativeFailure } from '../../native';
import { shareText } from '../../native';
import { resetTo } from '../../navigation/navigationRef';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import ProfileScreen from './index';

jest.mock('../../navigation/navigationRef', () => ({
  ...jest.requireActual('../../navigation/navigationRef'),
  resetTo: jest.fn(),
  navigationRef: { isReady: () => true, getRootState: () => ({ routes: [{ name: mockTopRoute }] }) },
}));
jest.mock('../../native', () => ({
  ...jest.requireActual('../../native'),
  shareText: jest.fn(() => Promise.resolve({ ok: true, value: true })),
}));

jest.setTimeout(30000);
let mockTopRoute = 'Profile'; // read by the mocked navigationRef (jest.mock factories may use `mock`-prefixed names only)
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn() };
// fake React Navigation listeners (useIonViewWillEnter reads them from NavigationContext)
let listeners: Record<string, (() => void)[]> = {};
const fakeNav = {
  getState: () => ({ index: 0 }),
  addListener: (ev: string, fn: () => void) => {
    (listeners[ev] ||= []).push(fn);
    return () => {
      listeners[ev] = (listeners[ev] || []).filter(f => f !== fn);
    };
  },
};
const emit = (ev: string) => (listeners[ev] || []).forEach(f => f());
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

async function mount(role: string | null = 'Plumber', variant?: string) {
  db.userStorageData = role ? { ...(sessions as any)[role] } : undefined;
  if (variant) {
    setFixtureVariant('app_karigar/profile', variant);
  }
  await act(async () => {
    tree = ReactTestRenderer.create(
      <NavigationContext.Provider value={fakeNav as any}>
        <ProfileScreen navigation={navigation as any} />
      </NavigationContext.Provider>,
    );
  });
  await act(async () => emit('focus')); // first entry: ionViewWillEnter
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string =>
  Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '';
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const hasText = (s: string) => allText().some(x => x.includes(s));
const textEq = (s: string) => allText().some(x => x === s);
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
const sheets = () => overlayStore.getEntries().filter(e => e.kind === 'actionSheet').map(e => e.options);

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetMock();
  resetMockNative();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  (resetTo as jest.Mock).mockClear();
  (shareText as jest.Mock).mockClear();
  calls = [];
  listeners = {};
  mockTopRoute = 'Profile';
  installSpy();
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contracts (card Endpoints)', () => {
  test('app_karigar/profile: {karigar_id} on mount', async () => {
    await expectContract('app_karigar/profile', () => mount());
    expect(sentBody('app_karigar/profile')).toEqual({ karigar_id: '900001' });
  });
  test('app_karigar/updateProfilePic: {karigar_id, profile} after a camera photo, then the profile is read again', async () => {
    await expectContract('app_karigar/updateProfilePic', async () => {
      await mount();
      await press('profile-photo-edit');
      await act(async () => {
        sheets()[0].buttons[0].handler();
      });
      await settle();
    });
    const body = sentBody('app_karigar/updateProfilePic');
    expect(Object.keys(body)).toEqual(['karigar_id', 'profile']);
    expect(body.profile).toMatch(/^data:image\/jpeg;base64,/);
    expect(callsTo('app_karigar/profile')).toHaveLength(2);
    expect(alerts().some(a => a.title === 'Success!' && a.subTitle === 'Profile Photo Updated')).toBe(true);
  });
});

describe('states (card States)', () => {
  test('Plumber: header, mobile, dob, addresses, seller, dealer, executive, document, share', async () => {
    await mount();
    expect(textEq('Profile')).toBe(true);
    expect(textEq('Ramesh Kumar')).toBe(true);
    expect(textEq('Verified  (Plumber)')).toBe(true);
    expect(textEq('+919812345670')).toBe(true);
    expect(textEq('14 May,1990')).toBe(true);
    expect(textEq('12 Rajnagar Extension Near City Mall Uttar Pradesh Ghaziabad Sahibabad 201010')).toBe(true);
    expect(hasText('Permanent Address')).toBe(true);
    expect(textEq('45 Gandhi Nagar Ward 3 Uttar Pradesh Meerut Meerut 250001')).toBe(true);
    expect(textEq('Anil Sharma (9810000012)')).toBe(true);
    expect(textEq('Mohan Lal (9810000013)')).toBe(true);
    expect(textEq('Rakesh Verma (9810000014)')).toBe(true);
    ['Seller Information', 'Dealer Information', 'Sales Executive Information', 'Document Information'].forEach(x => expect(hasText(x)).toBe(true));
    expect(textEq('Aadhar Card')).toBe(true);
    expect(exists('profile-share-code')).toBe(true);
    expect(textEq('TB7RK')).toBe(true);
    expect(exists('profile-location')).toBe(false);
  });
  test.each([
    ['Pending', 'pending', 'Pending Documents under review (Plumber)', 'hourglass_full'],
    ['Suspect', 'suspect', 'Suspect Mismatch (Plumber)', 'info'],
    ['Reject', 'reject', 'Reject Invalid document (Plumber)', 'cancel'],
  ])('Plumber status %s shows its icon and reason', async (_n, variant, label, icon) => {
    await mount('Plumber', variant);
    expect(textEq(label)).toBe(true);
    expect(textEq(icon)).toBe(true);
  });
  test('Plumber without photo shows the default picture and no tap target', async () => {
    await mount('Plumber', 'noPhoto');
    expect(exists('profile-image')).toBe(false);
  });
  test('Sales_Boy: Seller label, Dealer Information, share, no document', async () => {
    await mount('Sales_Boy', 'seller');
    expect(textEq('Seller')).toBe(true);
    expect(hasText('Dealer Information')).toBe(true);
    expect(textEq(' Mohan Lal (9810000013)'.trim())).toBe(true);
    expect(hasText('Seller Information')).toBe(false);
    expect(exists('profile-document')).toBe(false);
    expect(exists('profile-share-code')).toBe(true);
  });
  test('Dealer: type label and Dealer Information', async () => {
    await mount('Dealer', 'dealer');
    expect(textEq('Dealer')).toBe(true);
    expect(hasText('Dealer Information')).toBe(true);
  });
  test('Sales_Executive: label, no share block', async () => {
    await mount('Sales_Executive', 'executive');
    expect(textEq('Sales Executive')).toBe(true);
    expect(exists('profile-share-code')).toBe(false);
  });
  test('Customer: rows, geo location, Update location', async () => {
    await mount('Customer', 'customer');
    ['Mobile No.', 'Address', 'Area', 'District', 'State', 'Pincode', 'Geo Location'].forEach(x => expect(hasText(x)).toBe(true));
    expect(textEq('+919810000015')).toBe(true);
    expect(textEq('7 Vasant Vihar')).toBe(true);
    expect(textEq('Update location')).toBe(true);
    expect(exists('profile-geo')).toBe(true);
    expect(exists('profile-share-code')).toBe(false);
  });
  test('Customer without a saved location: Add location, no Geo Location block', async () => {
    await mount('Customer', 'customerNoLocation');
    expect(textEq('Add location')).toBe(true);
    expect(exists('profile-geo')).toBe(false);
  });
  test('Retailer: the header only', async () => {
    await mount('Retailer');
    expect(textEq('Profile')).toBe(true);
    expect(hasText('Mobile No.')).toBe(false);
    expect(exists('profile-edit')).toBe(false);
  });
  test('hin: translated labels, fallback to the English key for a missing translation', async () => {
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(textEq('Profile')).toBe(false);
    expect(hasText('Mobile No.')).toBe(false);
  });
  test('empty karigar {}: renders the blank fields without throwing', async () => {
    await mount('Plumber', 'empty');
    expect(textEq('----')).toBe(false); // dob undefined != '' -> the date pipe prints nothing
    expect(textEq('N/A')).toBe(true);
    expect(textEq('+91')).toBe(true);
  });
  test('dob "" prints ----', async () => {
    await mount('Plumber', 'noDob');
    expect(textEq('----')).toBe(true);
  });
  test('malformed (karigar null): header only, loader closed, no crash', async () => {
    await mount('Plumber', 'malformed');
    expect(textEq('Profile')).toBe(true);
    expect(hasText('Mobile No.')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });
  test('notSuccess (no karigar key): body stays empty', async () => {
    await mount('Plumber', 'notSuccess');
    expect(hasText('Mobile No.')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('loader and errors', () => {
  test('"Please wait..." loader is shown on mount and closed by the response', async () => {
    db.userStorageData = { ...(sessions as any).Plumber };
    await act(async () => {
      tree = ReactTestRenderer.create(
        <NavigationContext.Provider value={fakeNav as any}>
          <ProfileScreen navigation={navigation as any} />
        </NavigationContext.Provider>,
      );
    });
    await act(async () => emit('focus'));
    expect(openLoaders()).toHaveLength(1);
    expect(openLoaders()[0].options.content).toBe('Please wait...');
    expect(openLoaders()[0].options.dismissOnPageChange).toBe(true);
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });
  test('an HTTP error leaves the loader up (no error callback in Ionic) until the page is left', async () => {
    setFixtureVariant('app_karigar/profile', 'error');
    await mount();
    expect(openLoaders()).toHaveLength(1);
    act(() => tree.unmount());
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('navigation (card Nav targets)', () => {
  test('pencil -> Registration {data, sales_boy_id}; data is the karigar_detail marked edit_profile', async () => {
    await mount();
    await press('profile-edit');
    expect(navigation.push).toHaveBeenCalledTimes(1);
    const [name, params] = navigation.push.mock.calls[0];
    expect(name).toBe('Registration');
    expect(params.sales_boy_id).toBe(12);
    expect(params.data.edit_profile).toBe('edit_profile');
    expect(params.data.first_name).toBe('Ramesh Kumar');
    expect(Number.isNaN(params.data.totalpoints)).toBe(false);
    expect(params.data.totalpoints).toBe(1250);
  });
  test('profile picture -> ViewProfile {Image, mode: "profile"}', async () => {
    await mount();
    await press('profile-image');
    expect(navigation.push).toHaveBeenCalledWith('ViewProfile', { Image: 'profile/ramesh.jpg', mode: 'profile' });
  });
  test('Customer location button -> PointLocation {lat, log, old_loc}', async () => {
    await mount('Customer', 'customer');
    await press('profile-location');
    expect(navigation.push).toHaveBeenCalledWith('PointLocation', {
      lat: '28.5201',
      log: '77.1590',
      old_loc: 'Vasant Vihar, New Delhi, Delhi 110057, India',
    });
  });
  test('logout: confirm alert, Yes clears the session, success alert, setRoot(Language)', async () => {
    await mount();
    await press('profile-logout');
    const confirm = alerts()[0];
    expect(confirm.title).toBe('Logout!');
    expect(confirm.message).toBe('Are you sure you want Logout?');
    expect(confirm.buttons.map((b: any) => b.text)).toEqual(['No', 'Yes']);
    await act(async () => {
      confirm.buttons[1].handler();
    });
    expect(db.userStorageData).toEqual({});
    expect(JSON.parse((await AsyncStorage.getItem('userStorageData')) ?? 'null')).toEqual({});
    expect(alerts().some(a => a.title === 'Success!' && a.subTitle === 'Logout Successfully')).toBe(true);
    expect(resetTo).toHaveBeenCalledWith('Language');
  });
  test('logout: No does nothing', async () => {
    await mount();
    await press('profile-logout');
    await act(async () => {
      alerts()[0].buttons[0].handler();
    });
    expect(resetTo).not.toHaveBeenCalled();
    expect(db.userStorageData.id).toBeDefined();
  });
});

describe('ionViewWillEnter', () => {
  test('returning from a pushed card page (Registration) reads the profile again', async () => {
    await mount();
    expect(callsTo('app_karigar/profile')).toHaveLength(1);
    mockTopRoute = 'Registration';
    await act(async () => emit('blur'));
    mockTopRoute = 'Profile';
    await act(async () => emit('focus'));
    await settle();
    expect(callsTo('app_karigar/profile')).toHaveLength(2);
  });
  test('dismissing the ViewProfile modal does NOT read the profile again', async () => {
    await mount();
    mockTopRoute = 'ViewProfile';
    await act(async () => emit('blur'));
    mockTopRoute = 'Profile';
    await act(async () => emit('focus'));
    await settle();
    expect(callsTo('app_karigar/profile')).toHaveLength(1);
  });
});

describe('natives', () => {
  test('a failing share is swallowed (Ionic catch only logs)', async () => {
    (shareText as jest.Mock).mockResolvedValueOnce({ ok: false, reason: 'error' });
    await mount();
    await press('profile-share');
    expect(shareText).toHaveBeenCalledTimes(1);
    expect(alerts()).toHaveLength(0);
  });
  test('camera icon opens the "Profile photo" action sheet with Camera / Gallery / Cancel', async () => {
    await mount();
    await press('profile-photo-edit');
    const sheet = sheets()[0];
    expect(sheet.title).toBe('Profile photo');
    expect(sheet.cssClass).toBe('cs-actionsheet');
    expect(sheet.buttons.map((b: any) => [b.text, b.icon, b.role])).toEqual([
      ['Camera', 'camera', undefined],
      ['Gallery', 'image', undefined],
      ['Cancel', undefined, 'cancel'],
    ]);
  });
  test('a failed camera (permission denied) does nothing and posts nothing', async () => {
    setMockNativeFailure('camera', 'denied');
    await mount();
    await press('profile-photo-edit');
    await act(async () => {
      sheets()[0].buttons[1].handler();
    });
    await settle();
    expect(callsTo('app_karigar/updateProfilePic')).toHaveLength(0);
    expect(alerts().some(a => a.subTitle === 'Profile Photo Updated')).toBe(false);
  });
  test('Share sends the Ionic text with the referral code', async () => {
    await mount();
    await press('profile-share');
    expect(shareText).toHaveBeenCalledTimes(1);
    const text = (shareText as jest.Mock).mock.calls[0][0];
    expect(text).toMatch(/^Hey There ! here is an awesome app from .+  \.\.Give it a try https:\/\/play\.google\.com\/store\/apps\/details\?id=.+ and use my Code \*TB7RK\* to get points back in your wallet$/);
  });
});
