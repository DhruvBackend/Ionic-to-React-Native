// PointLocation screen (Ionic PointLocationPage): contract, location flow, add_loc branches, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { MOCK_POSITION, resetMockNative, setMockNativeFailure } from '../../native';
import { webAlert } from '../../ui/webAlert';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import PointLocationScreen from './index';

jest.mock('../../ui/webAlert', () => ({ webAlert: jest.fn() }));
jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { reset: jest.fn() };
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

function installSpy(failing = false) {
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    if (failing) {
      return Promise.reject(new HttpError(500, {}));
    }
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

async function mount(params: object = { lat: '28.6', log: '77.4', old_loc: '' }) {
  await act(async () => {
    tree = ReactTestRenderer.create(<PointLocationScreen navigation={navigation as any} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options as any);
const toasts = () => overlayStore.getEntries().filter(e => e.kind === 'toast').map(e => e.options as any);
const loaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const press = (id: string) => find(id).find(n => typeof n.props.onPress === 'function')!.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
const mapUri = () => find('pl-map-webview').find(n => n.props.source)!.props.source.uri;
const geoCalls = () => calls.filter(c => c.fn === 'app_karigar/addGeoLocation');
// eslint-disable-next-line no-restricted-syntax
const embed = (lat: any, lng: any) => `https://maps.google.com/maps?q=${lat},${lng}&output=embed`;

beforeEach(() => {
  jest.useFakeTimers();
  resetMock();
  resetMockNative();
  _resetOverlaysForTests();
  navigation.reset.mockClear();
  (webAlert as jest.Mock).mockClear();
  calls = [];
  db.userStorageData = { id: '900001', type: 'Customer' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contracts (card Endpoints)', () => {
  test('app_karigar/addGeoLocation: {customer_id, cust_lat, cust_long, cust_geo_address}', async () => {
    installSpy();
    await mount();
    await expectContract('app_karigar/addGeoLocation', async () => {
      await act(async () => press('pl-add-location'));
      await settle();
    });
    expect(JSON.parse(geoCalls()[0].body!)).toEqual({
      customer_id: '900001',
      cust_lat: MOCK_POSITION.lat,
      cust_long: MOCK_POSITION.lng,
      cust_geo_address: '',
    });
  });
});

describe('states (card States)', () => {
  test('PointLocation.customer: map embed on the fix, Add location button, no request on load, no loader', async () => {
    installSpy();
    await mount();
    expect(mapUri()).toBe(embed(MOCK_POSITION.lat, MOCK_POSITION.lng));
    expect(exists('pl-add-location')).toBe(true);
    expect(exists('pl-dealer-add-location')).toBe(false);
    expect(exists('pl-my-location')).toBe(true);
    expect(calls).toHaveLength(0);
    expect(loaders()).toHaveLength(0);
    expect(toasts()).toHaveLength(0);
  });

  test('before any fix the embed url is the constructor one (q=undefined,undefined)', async () => {
    installSpy();
    setMockNativeFailure('location', 'unavailable', 'no fix');
    await mount();
    expect(mapUri()).toBe(embed(undefined, undefined));
  });

  test("mode 'Dealer': the Dealer button shows (and not the Customer one for a Dealer user); it only reloads the location", async () => {
    db.userStorageData = { id: '900002', type: 'Dealer' };
    installSpy();
    await mount({ lat: '1', log: '2', mode: 'Dealer' });
    expect(exists('pl-add-location')).toBe(false);
    expect(exists('pl-dealer-add-location')).toBe(true);
    await act(async () => press('pl-dealer-add-location'));
    await settle();
    expect(calls).toHaveLength(0); // addDealerLocation (dealerData/add_location) is dead code
    expect(navigation.reset).not.toHaveBeenCalled();
  });

  test('a user of another type without mode: no footer button', async () => {
    db.userStorageData = { id: '900001', type: 'Plumber' };
    installSpy();
    await mount({});
    expect(exists('pl-add-location')).toBe(false);
    expect(exists('pl-dealer-add-location')).toBe(false);
  });
});

describe('location flow', () => {
  test("a rejected accuracy request: toast 'Allow Location Permissions'", async () => {
    setMockNativeFailure('location', 'denied', 'accuracy: user disagreed');
    await mount();
    expect(toasts().some(t => t.message === 'Allow Location Permissions' && t.duration === 3000 && t.position === 'bottom')).toBe(true);
  });

  test("a rejected fix: toast 'Error getting location'", async () => {
    setMockNativeFailure('location', 'denied', 'location permission denied');
    await mount();
    expect(toasts().some(t => t.message === 'Error getting location' && t.duration === 3000)).toBe(true);
    expect(toasts().some(t => t.message === 'Allow Location Permissions')).toBe(false);
  });

  test('loadMap runs twice on entry (constructor + ionViewDidLoad), the my_location box once more', async () => {
    setMockNativeFailure('location', 'error', 'x');
    await mount();
    const n = toasts().length;
    expect(n).toBe(2);
    await act(async () => press('pl-my-location'));
    await settle();
    expect(toasts().length).toBe(3);
  });
});

describe('add location (Customer)', () => {
  test('success: Success! alert, then reset to Profile; no loader', async () => {
    installSpy();
    await mount();
    await act(async () => press('pl-add-location'));
    expect(loaders()).toHaveLength(0);
    await settle();
    expect(alerts()).toHaveLength(1);
    expect(alerts()[0].title).toBe('Success!');
    expect(alerts()[0].subTitle).toBe('Geo Location updated Successfully!');
    expect(alerts()[0].buttons).toEqual(['OK']);
    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Profile' }] });
  });

  test("status 'failed': the native window.alert dialog, no navigation", async () => {
    setFixtureVariant('app_karigar/addGeoLocation', 'failed');
    installSpy();
    await mount();
    await act(async () => press('pl-add-location'));
    await settle();
    expect(alerts()).toHaveLength(0);
    expect(webAlert).toHaveBeenCalledWith('Geo Location not found! Try Again');
    expect(navigation.reset).not.toHaveBeenCalled();
  });

  test.each(['empty'])('answer variant %s: still success', async variant => {
    setFixtureVariant('app_karigar/addGeoLocation', variant);
    installSpy();
    await mount();
    await act(async () => press('pl-add-location'));
    await settle();
    expect(alerts()[0].title).toBe('Success!');
    expect(navigation.reset).toHaveBeenCalledTimes(1);
  });

  test('null body: TypeError in Ionic, nothing happens', async () => {
    setFixtureVariant('app_karigar/addGeoLocation', 'malformed');
    installSpy();
    await mount();
    await act(async () => press('pl-add-location'));
    await settle();
    expect(alerts()).toHaveLength(0);
    expect(navigation.reset).not.toHaveBeenCalled();
  });

  test('HTTP error: nothing happens (no alert, no navigation)', async () => {
    installSpy(true);
    await mount();
    await act(async () => press('pl-add-location'));
    await settle();
    expect(geoCalls()).toHaveLength(1);
    expect(alerts()).toHaveLength(0);
    expect(navigation.reset).not.toHaveBeenCalled();
  });

  test('no fix yet: cust_lat / cust_long are dropped from the body (undefined)', async () => {
    setMockNativeFailure('location', 'unavailable', 'no fix');
    installSpy();
    await mount();
    await act(async () => press('pl-add-location'));
    await settle();
    expect(JSON.parse(geoCalls()[0].body!)).toEqual({ customer_id: '900001', cust_geo_address: '' });
    expect(alerts()[0].title).toBe('Success!');
  });
});
