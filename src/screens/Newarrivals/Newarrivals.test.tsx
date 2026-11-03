// Newarrivals screen (Ionic NewarrivalsPage): contract, states, search, infinite scroll offset, navigation. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import NewarrivalsScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn() };
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

async function settle() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
  }
}

async function mount() {
  await act(async () => {
    tree = ReactTestRenderer.create(<NewarrivalsScreen navigation={navigation as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const refresher = () => tree.root.findAll(n => typeof n.props.onRefresh === 'function')[0];
const infinite = () => tree.root.findAll(n => typeof n.props.onInfinite === 'function')[0];
const searchbar = () => tree.root.findAll(n => typeof n.props.onChangeText === 'function' && n.props.type === 'text')[0];
const listCalls = () => calls.filter(c => c.fn === 'app_master/newArrivals');
const bodyOf = (c: ApiRequest) => JSON.parse(c.body!);

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  calls = [];
  db.userStorageData = { id: '900001', type: 'Customer' };
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
  test('app_master/newArrivals: {filter} on mount, twice (constructor and ionViewDidLoad), no loader', async () => {
    installSpy();
    await expectContract('app_master/newArrivals', () => mount());
    expect(listCalls()).toHaveLength(2);
    expect(bodyOf(listCalls()[0])).toEqual({ filter: { search: '', limit: 0, id: '', karigar_id: '900001' } });
    expect(bodyOf(listCalls()[1])).toEqual(bodyOf(listCalls()[0]));
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('states (card States)', () => {
  test('Newarrivals.default: title, banner heading with the count, one card per product', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining([
        'New Arrivals',
        'Rain shower with extension arm chrome finish',
        'tb-1001',
        '₹ 2499',
        'perm_media',
        '₹ 640',
      ]),
    );
    expect(flat(find('newarrivals-heading')[0].props.children)).toBe('New Arrivals\n"4" Products Found');
    expect(exists('newarrivals-banner')).toBe(true);
    expect(exists('newarrivals-item-3')).toBe(true);
    expect(exists('newarrivals-item-4')).toBe(false);
    expect(exists('newarrivals-empty')).toBe(false);
    expect(find('newarrivals-image-0')[0].props.source).toEqual({ uri: db.product_image_url + 'shower_a.png' });
    expect(exists('newarrivals-image-2')).toBe(false);
    expect(find('ion-searchbar-input')[0].props.placeholder).toBe('Search');
  });

  test('Newarrivals.hin: title and search placeholder translated', async () => {
    installSpy();
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(allText()).toContain(i18n.t('New Arrivals').replace(/\s+/g, ' '));
    expect(find('ion-searchbar-input')[0].props.placeholder).toBe(i18n.t('Search').replace(/\s+/g, ' '));
  });

  test('Newarrivals.oddCount: the last row keeps an empty second column', async () => {
    setFixtureVariant('app_master/newArrivals', 'oddCount');
    installSpy();
    await mount();
    expect(exists('newarrivals-item-2')).toBe(true);
    expect(exists('newarrivals-item-3')).toBe(false);
    expect(flat(find('newarrivals-count')[0].props.children)).toBe('"3" Products Found');
  });

  test('Newarrivals.empty: the no_found image, no banner, no cards', async () => {
    setFixtureVariant('app_master/newArrivals', 'empty');
    installSpy();
    await mount();
    expect(exists('newarrivals-empty')).toBe(true);
    expect(exists('newarrivals-main')).toBe(false);
  });

  test('Newarrivals.malformed (products: null): no crash, the blank first-load view stays', async () => {
    setFixtureVariant('app_master/newArrivals', 'malformed');
    installSpy();
    await mount();
    expect(exists('newarrivals-main')).toBe(false);
    expect(exists('newarrivals-empty')).toBe(false);
  });

  test('an HTTP error shows nothing and no loader', async () => {
    installSpy(true);
    await mount();
    expect(exists('newarrivals-main')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('header: back button hidden for a Customer, shown (remove) for a Plumber', async () => {
    installSpy();
    await mount();
    const customer = tree.root.findAll(n => n.props.remove !== undefined && n.props.mainHeader !== undefined)[0];
    expect(customer.props.remove).toBe(false);
    act(() => tree.unmount());
    db.userStorageData = { id: '900001', type: 'Plumber' };
    await mount();
    const plumber = tree.root.findAll(n => n.props.remove !== undefined && n.props.mainHeader !== undefined)[0];
    expect(plumber.props.remove).toBe(true);
  });
});

describe('search and refresh', () => {
  test('every keystroke searches (no debounce, no enter), keeping offset 0', async () => {
    installSpy();
    await mount();
    const input = searchbar();
    await act(async () => {
      input.props.onChangeText('mix');
    });
    await settle();
    expect(listCalls()).toHaveLength(3);
    expect(bodyOf(listCalls()[2]).filter).toEqual({ search: 'mix', limit: 0, id: '', karigar_id: '900001' });
  });

  test('refresh reloads from offset 0 and completes at once', async () => {
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      refresher().props.onRefresh({ complete });
    });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(listCalls()).toHaveLength(3);
    await settle();
  });
});

describe('infinite scroll (newarrivals.ts:69-92)', () => {
  test('asks for the next offset with type "New Arivals", appends after 1000 ms and completes', async () => {
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      infinite().props.onInfinite({ complete });
    });
    const more = bodyOf(listCalls()[2]);
    expect(more).toEqual({ filter: { search: '', limit: 4, id: '', karigar_id: '900001' }, type: 'New Arivals' });
    expect(complete).not.toHaveBeenCalled();
    await settle();
    expect(exists('newarrivals-item-7')).toBe(true);
    expect(complete).toHaveBeenCalledTimes(1);
    await act(async () => {
      infinite().props.onInfinite({ complete });
    });
    expect(bodyOf(listCalls()[3]).filter.limit).toBe(8);
    await settle();
  });

  test('an empty page ([] == "") removes the infinite scroll; a refresh brings it back', async () => {
    installSpy();
    await mount();
    setFixtureVariant('app_master/newArrivals', 'empty');
    await act(async () => {
      infinite().props.onInfinite({ complete: jest.fn() });
    });
    await settle();
    expect(tree.root.findAll(n => typeof n.props.onInfinite === 'function')).toHaveLength(0);
    setFixtureVariant('app_master/newArrivals', 'default');
    await act(async () => {
      refresher().props.onRefresh({ complete: jest.fn() });
    });
    await settle();
    expect(tree.root.findAll(n => typeof n.props.onInfinite === 'function').length).toBeGreaterThan(0);
  });
});

describe('navigation (card Nav targets)', () => {
  test('tapping a card pushes ProductSubdetail with {id}', async () => {
    installSpy();
    await mount();
    const press = find('newarrivals-item-1').find(n => typeof n.props.onPress === 'function')!;
    await act(async () => {
      press.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
    });
    expect(navigation.push).toHaveBeenCalledWith('ProductSubdetail', { id: 42 });
  });
});
