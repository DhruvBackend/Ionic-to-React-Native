// GiftList screen (Ionic GiftListPage): contract, states, search, paging, refresh, navigation, ionViewDidLeave. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContext } from '@react-navigation/native';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { navigationRef } from '../../navigation/navigationRef';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import GiftListScreen from './index';
import route from './route';

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn() };
let listeners: Record<string, (() => void)[]> = {};
const fakeNav = {
  getState: () => ({ index: 1 }),
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

async function mount(params?: object, enter = true) {
  await act(async () => {
    tree = ReactTestRenderer.create(
      <NavigationContext.Provider value={fakeNav as any}>
        <GiftListScreen navigation={navigation as any} route={{ params }} />
      </NavigationContext.Provider>,
    );
  });
  if (enter) {
    await act(async () => emit('focus')); // first entry: ionViewWillEnter
  }
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const textOf = (id: string) => flat(find(id)[0].props.children);
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const refresher = () => tree.root.findAll(n => typeof n.props.onRefresh === 'function')[0];
const infinite = () => tree.root.findAll(n => typeof n.props.onInfinite === 'function');
const searchbar = () => tree.root.findAll(n => typeof n.props.onChangeText === 'function' && n.props.type === 'text')[0];
const press = (id: string) => find(id).find(n => typeof n.props.onPress === 'function')!.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
const listCalls = () => calls.filter(c => c.fn === 'app_karigar/giftList');
const bodyOf = (c: ApiRequest) => JSON.parse(c.body!);

beforeEach(() => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  listeners = {};
  calls = [];
  db.userStorageData = { id: '900001', type: 'Plumber' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('route', () => {
  test('carries the feature flag of the inventory and its nav target', () => {
    expect(route.feature).toBe('giftList');
    expect(route.links).toEqual(['GiftDetail']);
  });
});

describe('contracts (card Endpoints)', () => {
  test('app_karigar/giftList on entry: {filter: {limit: 0, search: "", redeemable: ""}, karigar_id}, loader shown first', async () => {
    installSpy();
    await expectContract('app_karigar/giftList', () => mount());
    expect(bodyOf(listCalls()[0])).toEqual({ filter: { limit: 0, search: '', redeemable: '' }, karigar_id: '900001' });
  });

  test('app_karigar/giftList from the infinite scroll: filter.limit is the current list length', async () => {
    installSpy();
    await mount();
    await expectContract('app_karigar/giftList', async () => {
      await act(async () => {
        infinite()[0].props.onInfinite({ complete: jest.fn() });
      });
      await settle();
    });
    expect(bodyOf(listCalls()[1])).toEqual({ filter: { limit: 5, search: '', redeemable: '' }, karigar_id: '900001' });
  });

  test('navParams mode is sent as filter.redeemable', async () => {
    installSpy();
    await mount({ mode: 'redeem' });
    expect(bodyOf(listCalls()[0]).filter.redeemable).toBe('redeem');
  });
});

describe('states (card States)', () => {
  test('GiftList.default: header, balance, search box and five rows with their texts', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining(['Gift Gallery', 'Balance Points', '1200', 'Points', 'Steel Water Bottle', 'Offer Points:1200', 'Diwali Dhamaka Offer | 31 December 2026']),
    );
    expect(textOf('giftlist-points-0')).toBe('500');
    expect(textOf('giftlist-offer-1')).toBe('Offer Points:0'); // offer_balance 0 || 0
    expect(find('giftlist-item-4')).not.toHaveLength(0);
    expect(find('giftlist-image-0').find(n => n.props.source)!.props.source).toEqual({ uri: `${db.upload_url3}gift_21.jpg` });
    expect(openLoaders()).toHaveLength(0);
  });

  test('GiftList.empty: balance only, no rows', async () => {
    setFixtureVariant('app_karigar/giftList', 'empty');
    installSpy();
    await mount();
    expect(textOf('giftlist-balance')).toBe('1200');
    expect(exists('giftlist-item-0')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('malformed (gift: null, karigar: null): loader gone, nothing breaks, balance stays 0', async () => {
    setFixtureVariant('app_karigar/giftList', 'malformed');
    installSpy();
    await mount();
    expect(textOf('giftlist-balance')).toBe('0');
    expect(exists('giftlist-item-0')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('karigar: null: the list shows (assigned before the throw), the balance keeps 0', async () => {
    setFixtureVariant('app_karigar/giftList', 'noKarigar');
    installSpy();
    await mount();
    expect(exists('giftlist-item-0')).toBe(true);
    expect(textOf('giftlist-balance')).toBe('0');
  });

  test('HTTP error: the loader stays up, the page keeps its empty template', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
    expect(exists('giftlist-item-0')).toBe(false);
  });

  test('loader: "Please wait..." while the first answer is pending', async () => {
    installSpy();
    await mount(undefined, false);
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('Please wait...');
  });
});

describe('search, refresh, paging', () => {
  test('every keystroke posts the search text with limit 0', async () => {
    installSpy();
    await mount();
    await act(async () => searchbar().props.onChangeText('bag'));
    await settle();
    expect(bodyOf(listCalls()[1]).filter).toEqual({ limit: 0, search: 'bag', redeemable: '' });
  });

  test('refresh posts again right away (complete() is not awaited) and clears the search', async () => {
    installSpy();
    await mount();
    await act(async () => searchbar().props.onChangeText('bag'));
    await settle();
    const complete = jest.fn();
    await act(async () => refresher().props.onRefresh({ complete }));
    expect(complete).toHaveBeenCalledTimes(1);
    await settle();
    expect(bodyOf(listCalls()[2]).filter.search).toBe('');
  });

  test('paging: the next page is appended after 1000 ms and complete() runs', async () => {
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete });
    });
    await act(async () => {
      jest.advanceTimersByTime(350); // the answer arrives; the append waits 1000 ms more
    });
    expect(complete).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(exists('giftlist-item-9')).toBe(true);
    // appended rows are not run through parseInt: the server's raw types stay
    expect(textOf('giftlist-points-5')).toBe('500');
  });

  test('paging with an empty page: nothing is appended and complete() still runs (r == "" only matches an empty answer)', async () => {
    installSpy();
    await mount();
    setFixtureVariant('app_karigar/giftList', 'empty');
    const complete = jest.fn();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete });
    });
    await settle(1100);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(exists('giftlist-item-5')).toBe(false);
    expect(infinite()).toHaveLength(1);
  });

  test('infinite scroll with gift_list null (malformed first answer): no request', async () => {
    setFixtureVariant('app_karigar/giftList', 'malformed');
    installSpy();
    await mount();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete: jest.fn() });
    });
    await settle();
    expect(listCalls()).toHaveLength(1);
  });

  test('ionViewWillEnter: every focus fetches again (return from GiftDetail)', async () => {
    installSpy();
    await mount();
    await act(async () => emit('focus'));
    await settle();
    expect(listCalls()).toHaveLength(2);
  });
});

describe('navigation', () => {
  test('tapping a row pushes GiftDetail with {id}', async () => {
    installSpy();
    await mount();
    await act(async () => press('giftlist-item-2'));
    expect(navigation.push).toHaveBeenLastCalledWith('GiftDetail', { id: 23 });
  });
});

describe('ionViewDidLeave (gift-list.ts:118-142)', () => {
  const stackState = (names: string[]) => ({ type: 'stack', index: names.length - 1, routes: names.map(name => ({ name })) });
  async function leave(stackRoutes: number, root: any) {
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(true);
    jest.spyOn(navigationRef, 'getRootState').mockReturnValue(root);
    installSpy();
    const nav = {
      push: jest.fn(),
      popToTop: jest.fn(),
      getState: () => ({ routes: new Array(stackRoutes).fill({}) }),
      addListener: (type: string, cb: () => void) => {
        (listeners[type] ||= []).push(cb);
        return () => {};
      },
    };
    await act(async () => {
      tree = ReactTestRenderer.create(<GiftListScreen navigation={nav as any} />);
    });
    await settle();
    await act(async () => emit('blur'));
    return nav;
  }
  afterEach(() => jest.restoreAllMocks());

  test('active page is a root page (Home), previous is not, stack has >1 page: popToTop', async () => {
    const nav = await leave(2, stackState(['Home']));
    expect(nav.popToTop).toHaveBeenCalledTimes(1);
  });
  test('MainHome counts as a root page here', async () => {
    const nav = await leave(2, stackState(['MainHome']));
    expect(nav.popToTop).toHaveBeenCalledTimes(1);
  });
  test('previous page is a root page: nothing', async () => {
    const nav = await leave(2, stackState(['Home', 'Profile']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
  test('single-route stack: nothing to pop', async () => {
    const nav = await leave(1, stackState(['Home']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
  test('active page GiftDetail (not a root page): nothing', async () => {
    const nav = await leave(2, stackState(['Home', 'GiftList', 'GiftDetail']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
});
