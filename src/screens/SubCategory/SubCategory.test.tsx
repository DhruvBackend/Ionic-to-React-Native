// SubCategory screen (Ionic SubCategoryPage): contract, states, search, infinite scroll, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import SubCategoryScreen from './index';

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn() };
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};
const EP = 'app_master/childCategoryList';

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

async function mount() {
  await act(async () => {
    tree = ReactTestRenderer.create(<SubCategoryScreen navigation={navigation} route={{ params: { id: 7 } }} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const textOf = (id: string) => flat(find(id)[0].props.children);
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const infinite = () => tree.root.findAll(n => typeof n.props.onInfinite === 'function');
const epCalls = () => calls.filter(c => c.fn === EP);
const body = (c: ApiRequest) => JSON.parse(c.body!);
const searchInput = () => find('ion-searchbar-input')[0];

beforeEach(() => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  calls = [];
  db.userStorageData = { id: '900001', type: 'Plumber' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contract (card Endpoints)', () => {
  test('app_master/childCategoryList on entry: {filter: {limit: 0, search: ""}, category_id: <navParams id>}', async () => {
    installSpy();
    await expectContract(EP, () => mount());
    expect(body(epCalls()[0])).toEqual({ filter: { limit: 0, search: '' }, category_id: 7 });
  });

  test('the infinite scroll posts the same body with limit = the list length, through post_rqst (token header only)', async () => {
    installSpy();
    await mount();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete: jest.fn() });
    });
    await settle();
    const second = epCalls()[1];
    expect(body(second)).toEqual({ filter: { limit: 3, search: '' }, category_id: 7 });
    expect(Object.keys(second.headers).sort()).toEqual(['Content-Type', 'Token']);
    expect(second.method).toBe('POST');
  });
});

describe('states', () => {
  test('default: 3 rows with centred titles, image or perm_media icon, loader gone, no empty image', async () => {
    await mount();
    expect(exists('subcategory-row-2')).toBe(true);
    expect(exists('subcategory-row-3')).toBe(false);
    expect(textOf('subcategory-title-0')).toBe('PVC Pipes');
    expect(exists('subcategory-image-0')).toBe(true);
    expect(exists('subcategory-image-1')).toBe(false);
    expect(exists('subcategory-empty')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
    expect(infinite()).toHaveLength(1);
  });

  test('the loader has empty content and does not dismiss on page change', async () => {
    await act(async () => {
      tree = ReactTestRenderer.create(<SubCategoryScreen navigation={navigation} route={{ params: { id: 7 } }} />);
    });
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('');
    expect((loaders[0].options as any).dismissOnPageChange).toBe(false);
  });

  test('empty: the no-found image shows, no rows', async () => {
    setFixtureVariant(EP, 'empty');
    await mount();
    expect(exists('subcategory-empty')).toBe(true);
    expect(exists('subcategory-row-0')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('malformed (category: null): renders without throwing, no rows, no image, the loader stays up (Ionic throws before dismissing)', async () => {
    setFixtureVariant(EP, 'malformed');
    await mount();
    expect(exists('subcategory-row-0')).toBe(false);
    expect(exists('subcategory-empty')).toBe(false);
    expect(openLoaders()).toHaveLength(1);
  });

  test('HTTP error: no error callback, the loader stays up', async () => {
    setFixtureVariant(EP, 'error');
    await mount();
    expect(openLoaders()).toHaveLength(1);
  });

  test('an empty search answer keeps the old list and the image never shows', async () => {
    await mount();
    setFixtureVariant(EP, 'empty');
    await act(async () => {
      searchInput().props.onChangeText('zzz');
    });
    await act(async () => {
      searchInput().props.onSubmitEditing();
    });
    await settle();
    expect(exists('subcategory-row-0')).toBe(true);
    expect(exists('subcategory-empty')).toBe(false);
  });
});

describe('search (sub-category.html:10)', () => {
  test('Enter reloads with search = the text (and category_name in the shared filter); emptying the box reloads with ""', async () => {
    installSpy();
    await mount();
    await act(async () => {
      searchInput().props.onChangeText('Pvc');
    });
    expect(epCalls()).toHaveLength(1);
    await act(async () => {
      searchInput().props.onSubmitEditing();
    });
    await settle();
    expect(body(epCalls()[1])).toEqual({ filter: { limit: 0, search: 'Pvc', category_name: 'Pvc' }, category_id: 7 });
    await act(async () => {
      searchInput().props.onChangeText('');
    });
    await settle();
    expect(body(epCalls()[2]).filter.search).toBe('');
  });
});

describe('navigation (sub-category.ts:124-128)', () => {
  test('a row pushes ProductDetail {id}', async () => {
    await mount();
    await act(async () => {
      find('subcategory-row-1')[0].props.onPress();
    });
    expect(navigation.push).toHaveBeenCalledWith('ProductDetail', { id: 12 });
  });
});

describe('infinite scroll (sub-category.ts:90-123)', () => {
  test('the page replaces and doubles the list after 500 ms, complete() runs, short lists are padded with numbers up to 7 rows', async () => {
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete });
    });
    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    expect(complete).not.toHaveBeenCalled();
    await settle(300);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(exists('subcategory-row-5')).toBe(true); // 3 rows twice
    expect(textOf('subcategory-title-5')).toBe('Column Pipes And Casing Pipes For Borewell');
    expect(exists('subcategory-row-6')).toBe(true); // padded with the number 6
    expect(textOf('subcategory-title-6')).toBe('');
    expect(exists('subcategory-row-7')).toBe(false);
    await act(async () => {
      find('subcategory-row-6')[0].props.onPress();
    });
    expect(navigation.push).toHaveBeenCalledWith('ProductDetail', { id: undefined });
  });

  test('an empty answer (`category == ""`) ends the paging for good, complete() is not called', async () => {
    installSpy();
    await mount();
    setFixtureVariant(EP, 'endOfList');
    const complete = jest.fn();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete });
    });
    await settle();
    expect(infinite()).toHaveLength(0);
    expect(complete).not.toHaveBeenCalled();
    setFixtureVariant(EP, 'empty');
  });

  test('a null `category` empties the list and complete() never runs', async () => {
    installSpy();
    await mount();
    setFixtureVariant(EP, 'malformed');
    const complete = jest.fn();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete });
    });
    await settle(600);
    expect(complete).not.toHaveBeenCalled();
    expect(exists('subcategory-row-0')).toBe(false);
  });

  test('an HTTP error leaves the scroll loading (the dismiss hits no loader)', async () => {
    installSpy();
    await mount();
    setFixtureVariant(EP, 'error');
    const complete = jest.fn();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete });
    });
    await settle(600);
    expect(complete).not.toHaveBeenCalled();
    expect(infinite()).toHaveLength(1);
  });

  test('refresh reloads from 0', async () => {
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      tree.root.findAll(n => typeof n.props.onRefresh === 'function')[0].props.onRefresh({ complete });
    });
    await settle();
    expect(complete).toHaveBeenCalledTimes(1);
    expect(epCalls()).toHaveLength(2);
    expect(body(epCalls()[1]).filter.limit).toBe(0);
  });
});
