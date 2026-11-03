// ProductDetail screen (Ionic ProductDetailPage): contract, states, search, infinite scroll offset, navigation, loaders. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { navigationRef } from '../../navigation/navigationRef';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import ProductDetailScreen from './index';

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

async function mount(params: any = { id: 4 }, nav: any = navigation) {
  await act(async () => {
    tree = ReactTestRenderer.create(<ProductDetailScreen navigation={nav} route={{ params } as any} />);
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
const searchbar = () => tree.root.findAll(n => typeof n.props.onChangeText === 'function' && typeof n.props.onSubmit === 'function')[0];
const listCalls = () => calls.filter(c => c.fn === 'app_master/productList');
const bodyOf = (c: ApiRequest) => JSON.parse(c.body!);

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
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
  test('app_master/productList: {filter: {search, limit, id, karigar_id}} on mount', async () => {
    installSpy();
    await expectContract('app_master/productList', () => mount());
    expect(bodyOf(listCalls()[0])).toEqual({ filter: { search: '', limit: 0, id: 4, karigar_id: '900001' } });
  });
});

describe('states (card States)', () => {
  test('ProductDetail.default: titlecased category title, one card per product, name, code and price', async () => {
    installSpy();
    await mount();
    const texts = allText();
    expect(texts).toEqual(
      expect.arrayContaining([
        'Bath Fittings',
        'Rain shower with extension arm chrome finish',
        'tb-1001',
        '₹ 2499',
        'single lever wall mixer with diverter',
        'tb-2002',
        '₹ 1250',
        'perm_media',
        '₹ 640',
      ]),
    );
    expect(exists('product-detail-item-3')).toBe(true);
    expect(exists('product-detail-item-4')).toBe(false);
    expect(exists('product-detail-empty')).toBe(false);
    expect(find('product-detail-image-0')[0].props.source).toEqual({ uri: db.product_image_url + 'shower_a.png' });
    expect(exists('product-detail-image-2')).toBe(false); // actual_image_name '' shows the perm_media icon
    expect(find('ion-searchbar-input')[0].props.placeholder).toBe('Search');
  });

  test('ProductDetail.hin: the search placeholder is translated', async () => {
    installSpy();
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(find('ion-searchbar-input')[0].props.placeholder).toBe(i18n.t('Search').replace(/\s+/g, ' '));
  });

  test('ProductDetail.oddCount: the last row keeps an empty second column', async () => {
    setFixtureVariant('app_master/productList', 'oddCount');
    installSpy();
    await mount();
    expect(exists('product-detail-item-2')).toBe(true);
    expect(exists('product-detail-item-3')).toBe(false);
  });

  test('ProductDetail.empty: the no_found image, no cards', async () => {
    setFixtureVariant('app_master/productList', 'empty');
    installSpy();
    await mount();
    expect(exists('product-detail-empty')).toBe(true);
    expect(exists('product-detail-item-0')).toBe(false);
  });

  test('ProductDetail.malformed (products: null): no crash, no cards, no empty image, loader gone', async () => {
    setFixtureVariant('app_master/productList', 'malformed');
    installSpy();
    await mount();
    expect(exists('product-detail-item-0')).toBe(false);
    expect(exists('product-detail-empty')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('loader (product-detail.ts:139-144)', () => {
  test('a loader without content is up while loading and dismissed by the response', async () => {
    installSpy();
    await act(async () => {
      tree = ReactTestRenderer.create(<ProductDetailScreen navigation={navigation as any} route={{ params: { id: 4 } } as any} />);
    });
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('');
    expect((loaders[0].options as any).dismissOnPageChange).toBe(true);
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });

  test('an HTTP error leaves the loader up (no error callback in Ionic)', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
  });
});

describe('search and refresh', () => {
  test('typing does not search; keyup.enter searches with the typed text', async () => {
    installSpy();
    await mount();
    await act(async () => {
      searchbar().props.onChangeText('mixer');
    });
    expect(listCalls()).toHaveLength(1);
    await act(async () => {
      searchbar().props.onSubmit();
    });
    await settle();
    expect(listCalls()).toHaveLength(2);
    expect(bodyOf(listCalls()[1]).filter).toEqual({ search: 'mixer', limit: 0, id: 4, karigar_id: '900001' });
  });

  test('emptying the box searches again with an empty text', async () => {
    installSpy();
    await mount();
    await act(async () => {
      searchbar().props.onChangeText('mixer');
    });
    await act(async () => {
      searchbar().props.onChangeText('');
    });
    await settle();
    expect(listCalls()).toHaveLength(2);
    expect(bodyOf(listCalls()[1]).filter.search).toBe('');
  });

  test('refresh reloads from offset 0 with an empty search, clears the box and completes at once', async () => {
    installSpy();
    await mount();
    await act(async () => {
      searchbar().props.onChangeText('mixer');
    });
    const complete = jest.fn();
    await act(async () => {
      refresher().props.onRefresh({ complete });
    });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(listCalls()).toHaveLength(2);
    expect(bodyOf(listCalls()[1]).filter).toEqual({ search: '', limit: 0, id: 4, karigar_id: '900001' });
    expect(find('ion-searchbar-input')[0].props.value).toBe('');
    await settle();
  });
});

describe('infinite scroll (product-detail.ts:57-82)', () => {
  test('asks for the next offset (limit = rows shown), appends after 1000 ms and completes', async () => {
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      infinite().props.onInfinite({ complete });
    });
    expect(bodyOf(listCalls()[1]).filter).toEqual({ search: '', limit: 4, id: 4, karigar_id: '900001' });
    expect(exists('product-detail-item-4')).toBe(false);
    expect(complete).not.toHaveBeenCalled();
    await settle();
    expect(exists('product-detail-item-7')).toBe(true);
    expect(complete).toHaveBeenCalledTimes(1);
    await act(async () => {
      infinite().props.onInfinite({ complete });
    });
    expect(bodyOf(listCalls()[2]).filter.limit).toBe(8);
    await settle();
  });

  test('an empty page ([] == "") removes the infinite scroll for good', async () => {
    installSpy();
    await mount();
    setFixtureVariant('app_master/productList', 'empty');
    await act(async () => {
      infinite().props.onInfinite({ complete: jest.fn() });
    });
    await settle();
    expect(tree.root.findAll(n => typeof n.props.onInfinite === 'function')).toHaveLength(0);
    expect(exists('product-detail-item-3')).toBe(true);
  });
});

describe('navigation (card Nav targets)', () => {
  test('tapping a card pushes ProductSubdetail with {id}', async () => {
    installSpy();
    await mount();
    const press = find('product-detail-item-1').find(n => typeof n.props.onPress === 'function')!;
    await act(async () => {
      press.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
    });
    expect(navigation.push).toHaveBeenCalledWith('ProductSubdetail', { id: 32 });
  });
});

describe('ionViewDidLeave (product-detail.ts:145-168)', () => {
  const stackState = (names: string[]) => ({ type: 'stack', index: names.length - 1, routes: names.map(name => ({ name })) });
  async function leave(stackRoutes: number, rootState: any) {
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(true);
    jest.spyOn(navigationRef, 'getRootState').mockReturnValue(rootState);
    installSpy();
    const listeners: Record<string, () => void> = {};
    const nav = {
      push: jest.fn(),
      popToTop: jest.fn(),
      getState: () => ({ routes: new Array(stackRoutes).fill({}) }),
      addListener: (type: string, cb: () => void) => {
        listeners[type] = cb;
        return () => {};
      },
    };
    await mount({ id: 4 }, nav);
    await act(async () => {
      listeners.blur();
    });
    return nav;
  }
  afterEach(() => jest.restoreAllMocks());

  test('active nav shows Home with no root page before it and this stack has >1 page: popToTop', async () => {
    const nav = await leave(2, stackState(['Home']));
    expect(nav.popToTop).toHaveBeenCalledTimes(1);
  });
  test('active page is ProductSubdetail (not a root page): nothing', async () => {
    const nav = await leave(2, stackState(['Home', 'ProductDetail', 'ProductSubdetail']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
  test('previous page is a root page: nothing', async () => {
    const nav = await leave(2, stackState(['Home', 'Profile']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
});
