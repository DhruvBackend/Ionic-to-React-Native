// Category screen (Ionic CategoryPage): contracts, list rendering, search, infinite scroll, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import CategoryScreen from './index';

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn() };
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};
const LIST = 'app_master/parentCategory_List';
const LEN = 'app_master/checkCategoryLength';

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
    tree = ReactTestRenderer.create(<CategoryScreen navigation={navigation} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const textOf = (id: string) => flat(find(id)[0].props.children);
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const infinite = () => tree.root.findAll(n => typeof n.props.onInfinite === 'function');
const epCalls = (fn: string) => calls.filter(c => c.fn === fn);
const body = (c: ApiRequest) => JSON.parse(c.body!);
const searchInput = () => find('ion-searchbar-input')[0];

async function press(id: string) {
  await act(async () => {
    find(id)[0].props.onPress();
  });
  await settle();
}

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

describe('contracts (card Endpoints)', () => {
  test('app_master/parentCategory_List on entry: {filter: {limit: 0, search: ""}}', async () => {
    installSpy();
    await expectContract(LIST, () => mount());
    expect(body(epCalls(LIST)[0])).toEqual({ filter: { limit: 0, search: '' } });
  });

  test('app_master/checkCategoryLength through a row press: {filter: {limit, search, name}}', async () => {
    installSpy();
    await mount();
    await expectContract(LEN, () => press('category-row-0'));
    expect(body(epCalls(LEN)[0])).toEqual({ filter: { limit: 0, search: '', name: 'Pipes' } });
  });

  test('the infinite scroll posts the same endpoint with limit = the list length, through post_rqst (token header only)', async () => {
    installSpy();
    await mount();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete: jest.fn() });
    });
    await settle();
    const second = epCalls(LIST)[1];
    expect(body(second)).toEqual({ filter: { limit: 5, search: '' } });
    expect(Object.keys(second.headers).sort()).toEqual(['Content-Type', 'Token']);
    expect(second.method).toBe('POST');
  });
});

describe('states', () => {
  test('default: 5 rows with the category name, image or perm_media icon, loader gone, infinite scroll present', async () => {
    await mount();
    expect(exists('category-row-4')).toBe(true);
    expect(exists('category-row-5')).toBe(false);
    expect(textOf('category-title-0')).toBe('Pipes');
    expect(exists('category-image-0')).toBe(true);
    expect(exists('category-image-2')).toBe(false); // actual_image_name '' shows the perm_media icon
    expect(openLoaders()).toHaveLength(0);
    expect(infinite()).toHaveLength(1);
  });

  test('the entry loader has empty content and does not dismiss on page change', async () => {
    await act(async () => {
      tree = ReactTestRenderer.create(<CategoryScreen navigation={navigation} />);
    });
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('');
    expect((loaders[0].options as any).dismissOnPageChange).toBe(false);
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });

  test('empty: no rows, and no no-found image (the template test is `(!length) == 57`, always false)', async () => {
    setFixtureVariant(LIST, 'empty');
    await mount();
    expect(exists('category-row-0')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
    expect(infinite()).toHaveLength(1);
  });

  test('malformed (category: null): renders without throwing, no rows, loader gone', async () => {
    setFixtureVariant(LIST, 'malformed');
    await mount();
    expect(exists('category-row-0')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('HTTP error: the error callback does nothing, the loader stays up', async () => {
    setFixtureVariant(LIST, 'error');
    await mount();
    expect(openLoaders()).toHaveLength(1);
    expect(exists('category-row-0')).toBe(false);
  });
});

describe('search (category.html:10)', () => {
  test('typing alone does not call; Enter calls with search = the typed text', async () => {
    installSpy();
    await mount();
    await act(async () => {
      searchInput().props.onChangeText('Val');
    });
    expect(epCalls(LIST)).toHaveLength(1);
    await act(async () => {
      searchInput().props.onSubmitEditing();
    });
    await settle();
    expect(body(epCalls(LIST)[1])).toEqual({ filter: { limit: 0, search: 'Val', category_name: 'Val' } });
  });

  test('emptying the box reloads with search ""', async () => {
    installSpy();
    await mount();
    await act(async () => {
      searchInput().props.onChangeText('Val');
    });
    await act(async () => {
      searchInput().props.onChangeText('');
    });
    await settle();
    expect(epCalls(LIST)).toHaveLength(2);
    expect(body(epCalls(LIST)[1]).filter.search).toBe('');
  });
});

describe('navigation (category.ts:56-83)', () => {
  test('a category answering with one entry pushes SubCategory {id}, loader gone', async () => {
    await mount();
    await press('category-row-1');
    expect(navigation.push).toHaveBeenCalledWith('SubCategory', { id: 7 });
    expect(openLoaders()).toHaveLength(0);
  });

  test('more than one entry (or none) pushes Products {name}', async () => {
    await mount();
    setFixtureVariant(LEN, 'many');
    await press('category-row-1');
    expect(navigation.push).toHaveBeenCalledWith('Products', { name: 'Fittings' });
    setFixtureVariant(LEN, 'empty');
    await press('category-row-2');
    expect(navigation.push).toHaveBeenLastCalledWith('Products', { name: 'Valves' });
  });

  test('malformed answer: the loader is dismissed, nothing is pushed', async () => {
    await mount();
    setFixtureVariant(LEN, 'malformed');
    await press('category-row-0');
    expect(navigation.push).not.toHaveBeenCalled();
    expect(openLoaders()).toHaveLength(0);
  });

  test('HTTP error: the loader is dismissed, nothing is pushed', async () => {
    await mount();
    setFixtureVariant(LEN, 'error');
    await press('category-row-0');
    expect(navigation.push).not.toHaveBeenCalled();
    expect(openLoaders()).toHaveLength(0);
  });

  test('filter.name stays in the shared filter for later list calls', async () => {
    installSpy();
    await mount();
    await press('category-row-0');
    await act(async () => {
      searchInput().props.onSubmitEditing();
    });
    await settle();
    expect(body(epCalls(LIST)[1]).filter).toEqual({ limit: 0, search: undefined, name: 'Pipes' });
  });
});

describe('infinite scroll (category.ts:85-124)', () => {
  test('a page is appended after 500 ms and complete() runs then', async () => {
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
    expect(exists('category-row-9')).toBe(true);
  });

  test('`categories: ""` ends the paging for good (flag = 1), complete() is not called', async () => {
    installSpy();
    await mount();
    setFixtureVariant(LIST, 'endOfList');
    const complete = jest.fn();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete });
    });
    await settle();
    expect(infinite()).toHaveLength(0);
    expect(complete).not.toHaveBeenCalled();
  });

  test('an empty `category` list is not the end (the key read is `categories`): complete() runs, the scroll stays', async () => {
    installSpy();
    await mount();
    setFixtureVariant(LIST, 'empty');
    const complete = jest.fn();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete });
    });
    await settle(600);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(infinite()).toHaveLength(1);
    expect(exists('category-row-4')).toBe(true);
  });

  test('refresh reloads from 0 and brings the infinite scroll back', async () => {
    installSpy();
    await mount();
    setFixtureVariant(LIST, 'endOfList');
    await act(async () => {
      infinite()[0].props.onInfinite({ complete: jest.fn() });
    });
    await settle();
    expect(infinite()).toHaveLength(0);
    setFixtureVariant(LIST, 'default');
    const complete = jest.fn();
    await act(async () => {
      tree.root.findAll(n => typeof n.props.onRefresh === 'function')[0].props.onRefresh({ complete });
    });
    await settle();
    expect(complete).toHaveBeenCalledTimes(1);
    expect(infinite()).toHaveLength(1);
    expect(body(epCalls(LIST)[epCalls(LIST).length - 1]).filter.limit).toBe(0);
  });
});
