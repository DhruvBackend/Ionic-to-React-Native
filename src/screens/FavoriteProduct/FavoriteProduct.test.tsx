// FavoriteProduct screen (Ionic FavoriteProductPage): contract, states, search, loader timing, navigation. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { URLS } from '../../config/env';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import FavoriteProductScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
type Listener = () => void;
const listeners: Record<string, Listener[]> = {};
const navigation = {
  push: jest.fn(),
  addListener: jest.fn((ev: string, fn: Listener) => {
    (listeners[ev] ||= []).push(fn);
    return () => {
      listeners[ev] = (listeners[ev] || []).filter(f => f !== fn);
    };
  }),
};
// ionViewWillEnter = React Navigation 'focus'
const emit = async (ev: string) => {
  await act(async () => {
    (listeners[ev] || []).forEach(f => f());
  });
};
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

// the request leaves 1000 ms after entry, the mock answers 300 ms later, the loader goes 1000 ms after that
async function advance(ms: number) {
  for (let i = 0; i < ms / 100; i++) {
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
  }
}
const settle = () => advance(2600);

async function mount() {
  await act(async () => {
    tree = ReactTestRenderer.create(<FavoriteProductScreen navigation={navigation as any} />);
  });
  await emit('focus');
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const searchbar = () => tree.root.findAll(n => typeof n.props.onChangeText === 'function' && n.props.type === 'text')[0];
const favCalls = () => calls.filter(c => c.fn === 'dealerData/favorite_product');
const bodyOf = (c: ApiRequest) => JSON.parse(c.body!);

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  Object.keys(listeners).forEach(k => delete listeners[k]);
  calls = [];
  db.userStorageData = { id: '900001', type: 'Plumber' };
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
  test('dealerData/favorite_product: SFA server, {filter: {user_id, start}, userType}, sent 1000 ms after entry', async () => {
    installSpy();
    await expectContract('dealerData/favorite_product', () => mount());
    expect(favCalls()).toHaveLength(1);
    expect(favCalls()[0].serverURL).toBe(db.rootUrlSfa);
    expect(bodyOf(favCalls()[0])).toEqual({ filter: { user_id: '900001', start: 0 }, userType: 'drLogin' });
  });

  test('userType: CMS login_type -> CMS; loggedInUserType Employee -> Employee; else drLogin', async () => {
    installSpy();
    db.userStorageData = { id: '900001', login_type: 'CMS' };
    await mount();
    expect(bodyOf(favCalls()[0]).userType).toBe('CMS');
    act(() => tree.unmount());
    db.userStorageData = { id: '900002', loggedInUserType: 'Employee' };
    await mount();
    expect(bodyOf(favCalls()[1])).toEqual({ filter: { user_id: '900002', start: 0 }, userType: 'Employee' });
  });

  test('no request is sent before 1000 ms', async () => {
    installSpy();
    await act(async () => {
      tree = ReactTestRenderer.create(<FavoriteProductScreen navigation={navigation as any} />);
    });
    await emit('focus');
    await advance(900);
    expect(favCalls()).toHaveLength(0);
    await advance(200);
    expect(favCalls()).toHaveLength(1);
  });
});

describe('states (card States)', () => {
  test('FavoriteProduct.default: title, one card per favourite, price with the rupee sign', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining(['My Favourites', 'Rain shower with extension arm chrome finish', 'Single lever wall mixer', '₹​', '2499/-', '1250/-', '899/-']),
    );
    expect(exists('favorite-item-2')).toBe(true);
    expect(exists('favorite-item-3')).toBe(false);
    expect(exists('favorite-empty')).toBe(false);
    expect(find('favorite-image-0')[0].props.source).toEqual({ uri: URLS.gravityImageHost + 'dd_api/app/Http/Controllers/Admin/Master/appOfflineUploads/productImage/shower_a.png' });
    expect(find('ion-searchbar-input')[0].props.placeholder).toBe('Search');
  });

  test('the loader shows on entry and goes 1000 ms after the answer', async () => {
    installSpy();
    await act(async () => {
      tree = ReactTestRenderer.create(<FavoriteProductScreen navigation={navigation as any} />);
    });
    await emit('focus');
    expect(openLoaders()).toHaveLength(1);
    await advance(1400);
    expect(favCalls()).toHaveLength(1);
    expect(openLoaders()).toHaveLength(1);
    await advance(1200);
    expect(openLoaders()).toHaveLength(0);
  });

  test('FavoriteProduct.empty: "Data not Available", no cards', async () => {
    setFixtureVariant('dealerData/favorite_product', 'empty');
    installSpy();
    await mount();
    expect(exists('favorite-empty')).toBe(true);
    expect(allText()).toContain('Data not Available');
    expect(exists('favorite-main')).toBe(false);
  });

  test('FavoriteProduct.malformed (product_list: null): no crash, the blank first render stays, loader gone', async () => {
    setFixtureVariant('dealerData/favorite_product', 'malformed');
    installSpy();
    await mount();
    expect(exists('favorite-empty')).toBe(false);
    expect(exists('favorite-main')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('an HTTP error dismisses the loader at once and shows nothing', async () => {
    installSpy(true);
    await act(async () => {
      tree = ReactTestRenderer.create(<FavoriteProductScreen navigation={navigation as any} />);
    });
    await emit('focus');
    await advance(1100);
    expect(openLoaders()).toHaveLength(0);
    expect(exists('favorite-main')).toBe(false);
    expect(exists('favorite-empty')).toBe(false);
  });
});

describe('lifecycle (favorite-product.ts:42-47)', () => {
  test('ionViewWillEnter runs on every entry: coming back requests the list again', async () => {
    installSpy();
    await mount();
    await emit('focus');
    await settle();
    expect(favCalls()).toHaveLength(2);
  });
});

describe('search (html:10)', () => {
  test('every keystroke searches 1000 ms later with filter.search, without a loader', async () => {
    installSpy();
    await mount();
    await act(async () => {
      searchbar().props.onChangeText('mix');
    });
    expect(openLoaders()).toHaveLength(0);
    await settle();
    expect(favCalls()).toHaveLength(2);
    expect(bodyOf(favCalls()[1]).filter).toEqual({ user_id: '900001', start: 0, search: 'mix' });
    expect(openLoaders()).toHaveLength(0);
  });

  test('clearing the search brings the loader back', async () => {
    installSpy();
    await mount();
    await act(async () => {
      searchbar().props.onChangeText('mix');
    });
    await settle();
    await act(async () => {
      searchbar().props.onChangeText('');
    });
    expect(openLoaders()).toHaveLength(1);
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('navigation (card Nav targets)', () => {
  test('tapping a card pushes ProductSubdetail with {id}', async () => {
    installSpy();
    await mount();
    const press = find('favorite-item-1').find(n => typeof n.props.onPress === 'function')!;
    await act(async () => {
      press.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
    });
    expect(navigation.push).toHaveBeenCalledWith('ProductSubdetail', { id: 42 });
  });
});
