// NearestDealer screen (Ionic NearestDealerPage): contract, states, search, call / map actions. See card.md.
import React from 'react';
import { Linking } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { client } from '../../config/client';
import { openNavigation } from '../../native';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import NearestDealerScreen from './index';
import route from './route';

jest.mock('../../native', () => ({
  ...jest.requireActual('../../native'),
  openNavigation: jest.fn(() => Promise.resolve({ ok: true, value: true })),
}));

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

function installSpy(failing = false) {
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    return failing ? Promise.reject(new HttpError(500, {})) : previous(req);
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

async function mount(params: object | undefined = { type: 'Dealer', pincode: '201010' }, wait = true) {
  await act(async () => {
    tree = ReactTestRenderer.create(<NearestDealerScreen route={{ params }} />);
  });
  if (wait) {
    await settle();
  }
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] =>
  tree.root
    .findAll(n => (n.type as any) === 'Text')
    .map(n => flat(n.props.children))
    .filter(s => ![...s].every(ch => ch.charCodeAt(0) >= 0xe000 && ch.charCodeAt(0) <= 0xf8ff)); // drops icon glyphs (the back arrow)
const textOf = (id: string) => flat(find(id)[0].props.children);
const press = async (id: string) => {
  const n = find(id).find(x => typeof x.props.onPress === 'function')!;
  await act(async () => n.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } }));
};
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const openToasts = () => overlayStore.getEntries().filter(e => e.kind === 'toast' && !e.leaving);
const searchbar = () => tree.root.findAll(n => typeof n.props.onSubmit === 'function' && typeof n.props.onChangeText === 'function')[0];
const listCalls = () => calls.filter(c => c.fn === 'app_karigar/nearestDealer');

beforeEach(() => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  calls = [];
  (openNavigation as jest.Mock).mockClear();
  db.userStorageData = { id: '900001', type: 'Plumber' };
  jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('route', () => {
  test('carries the feature flag of the inventory and has no nav target', () => {
    expect(route.feature).toBe('nearestDealer');
    expect(route.links).toEqual([]);
  });
});

describe('contracts (card Endpoints)', () => {
  test('app_karigar/nearestDealer on entry: {pincode, type} from the nav params, loader shown first', async () => {
    installSpy();
    await expectContract('app_karigar/nearestDealer', () => mount());
    expect(JSON.parse(listCalls()[0].body!)).toEqual({ pincode: '201010', type: 'Dealer' });
  });

  test('app_karigar/nearestDealer from the searchbar (keyup.enter): the typed pincode, no loader', async () => {
    installSpy();
    await mount();
    await act(async () => searchbar().props.onChangeText('250001'));
    await expectContract('app_karigar/nearestDealer', async () => {
      await act(async () => searchbar().props.onSubmit());
      await settle();
    });
    expect(JSON.parse(listCalls()[1].body!)).toEqual({ pincode: '250001', type: 'Dealer' });
    expect(openLoaders()).toHaveLength(0);
  });

  test('an emptied searchbar falls back to the nav param pincode', async () => {
    installSpy();
    await mount();
    await act(async () => searchbar().props.onChangeText(''));
    await act(async () => searchbar().props.onSubmit());
    await settle();
    expect(JSON.parse(listCalls()[1].body!).pincode).toBe('201010');
  });
});

describe('states (card States)', () => {
  test('NearestDealer.dealer: title, one box per dealer (name, mobile, address), the map button only with lat and lng', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining(['Nearest Dealer', 'S', 'Sharma Sanitary Store', '9000000101', '12 Main Market ,Ghaziabad ,201010, Uttar Pradesh', 'G', 'V']),
    );
    expect(exists('nd-dealer-2')).toBe(true);
    expect(exists('nd-locate-0')).toBe(true);
    expect(exists('nd-locate-1')).toBe(false); // lat: '' / lng: ''
    expect(exists('nd-nothing')).toBe(false);
    expect(exists('nd-plumbers')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('NearestDealer.plumber: a card per plumber (circle letter, name, mobile, Address label and text)', async () => {
    installSpy();
    await mount({ type: 'Plumber', pincode: '201010' });
    expect(allText()).toEqual(expect.arrayContaining(['Nearest Plumber', 'R', 'Ramesh', '9000000101', 'Address', '12 Main Market ,Ghaziabad ,201010, Uttar Pradesh']));
    expect(exists('nd-plumber-2')).toBe(true);
    expect(exists('nd-dealers')).toBe(false);
  });

  test('NearestDealer.empty: the "No Dealer Found In Your Area ..." block with the Customer Care link', async () => {
    setFixtureVariant('app_karigar/nearestDealer', 'empty');
    installSpy();
    await mount();
    expect(textOf('nd-nothing-text')).toBe('No Dealer Found In Your Area Kindly Contact Our Executive');
    expect(textOf('nd-customer-care')).toBe('Customer Care');
    expect(exists('nd-dealer-0')).toBe(false);
  });

  test('empty list of a type that is neither Dealer nor Plumber: only the nothing-here block', async () => {
    setFixtureVariant('app_karigar/nearestDealer', 'empty');
    installSpy();
    await mount({ type: 'Retailer', pincode: '201010' });
    expect(textOf('nd-nothing-text')).toBe('No Retailer Found In Your Area Kindly Contact Our Executive');
  });

  test('malformed (dealerData: null): loader gone, the last completed render stays (no nothing-here, no rows)', async () => {
    setFixtureVariant('app_karigar/nearestDealer', 'malformed');
    installSpy();
    await mount();
    expect(openLoaders()).toHaveLength(0);
    expect(exists('nd-nothing')).toBe(false);
    expect(exists('nd-dealer-0')).toBe(false);
    expect(allText()).toEqual(expect.arrayContaining(['Nearest Dealer']));
  });

  test('HTTP error: the loader is dismissed, nothing else shows', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(0);
    expect(exists('nd-nothing')).toBe(false);
  });

  test('loader: "Please wait..." while the first answer is pending', async () => {
    installSpy();
    await mount(undefined, false);
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('Please wait...');
  });
});

describe('actions', () => {
  test('mobile link dials tel:<mobile>', async () => {
    installSpy();
    await mount();
    await press('nd-mobile-0');
    expect(Linking.openURL).toHaveBeenCalledWith('tel:9000000101');
  });

  test('Customer Care dials the client nearestDealerPhone', async () => {
    setFixtureVariant('app_karigar/nearestDealer', 'empty');
    installSpy();
    await mount();
    await press('nd-customer-care');
    expect(Linking.openURL).toHaveBeenCalledWith(`tel:${client.contact.nearestDealerPhone}`);
  });

  test('plumber phone icon dials tel:<mobile_no>', async () => {
    installSpy();
    await mount({ type: 'Plumber', pincode: '201010' });
    await press('nd-plumber-dial-1');
    expect(Linking.openURL).toHaveBeenCalledWith('tel:9000000102');
  });

  test('the map button and the address line open navigation to lat,lng', async () => {
    installSpy();
    await mount();
    await press('nd-locate-0');
    expect(openNavigation).toHaveBeenLastCalledWith(28.6692, 77.4538);
    await press('nd-address-2');
    expect(openNavigation).toHaveBeenLastCalledWith(28.9845, 77.7064);
  });

  test('the address line of a dealer without lat/lng shows the toast "No Location Found"', async () => {
    installSpy();
    await mount();
    await press('nd-address-1');
    expect(openNavigation).not.toHaveBeenCalled();
    expect(openToasts()).toHaveLength(1);
    expect((openToasts()[0].options as any).message).toBe('No Location Found');
  });
});
