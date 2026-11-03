// Products screen (Ionic ProductsPage): contract, states, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import ProductsScreen from './index';

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};
const EP = 'app_master/categoryList';

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
const emit = async (ev: string) => {
  await act(async () => {
    (listeners[ev] || []).forEach(f => f());
  });
};

function installSpy() {
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    return previous(req);
  });
  restoreTransport = () => setTransport(previous);
}

async function settle(ms = 350, rounds = 3) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
  }
}

// ionViewDidLoad then the first ionViewWillEnter ('focus')
async function mount() {
  await act(async () => {
    tree = ReactTestRenderer.create(<ProductsScreen navigation={navigation} route={{ params: { name: 'Pipes' } }} />);
  });
  await emit('focus');
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const textOf = (id: string) => flat(find(id)[0].props.children);
const epCalls = () => calls.filter(c => c.fn === EP);
const body = (c: ApiRequest) => JSON.parse(c.body!);
const searchInput = () => find('ion-searchbar-input')[0];
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);

beforeEach(() => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  Object.keys(listeners).forEach(k => delete listeners[k]);
  calls = [];
  db.userStorageData = { id: '900001', type: 'Plumber' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contract (card Endpoints)', () => {
  test('app_master/categoryList on entry: {filter: {limit: 0, name: <navParams name>}}', async () => {
    installSpy();
    await expectContract(EP, () => mount());
    expect(body(epCalls()[0])).toEqual({ filter: { limit: 0, name: 'Pipes' } });
  });

  test('a second ionViewWillEnter (back from a pushed page) reloads; typed search text rides along as category_name1', async () => {
    installSpy();
    await mount();
    await act(async () => {
      searchInput().props.onChangeText('elbow');
    });
    await emit('focus');
    await settle();
    expect(epCalls()).toHaveLength(2);
    expect(body(epCalls()[1])).toEqual({ filter: { limit: 0, name: 'Pipes', category_name1: 'elbow' } });
  });
});

describe('states', () => {
  test('before the answer: ten skeleton cells, no loader', async () => {
    await act(async () => {
      tree = ReactTestRenderer.create(<ProductsScreen navigation={navigation} route={{ params: { name: 'Pipes' } }} />);
    });
    expect(exists('products-skeleton')).toBe(true);
    expect(find('products-skeleton')[0].props.children).toHaveLength(10);
    expect(openLoaders()).toHaveLength(0);
  });

  test('default: 3 rows with the name, the picture only where `image` is set, no skeleton, no empty block', async () => {
    await mount();
    expect(exists('products-row-2')).toBe(true);
    expect(exists('products-row-3')).toBe(false);
    expect(textOf('products-name-0')).toBe('Pressure Pipe 1 Inch');
    expect(exists('products-image-0')).toBe(false); // image '' -> src="imageUrl+..." never loads
    expect(exists('products-image-1')).toBe(true);
    expect(exists('products-skeleton')).toBe(false);
    expect(exists('products-empty')).toBe(false);
  });

  test('empty: the "Data not Available" block replaces the skeleton', async () => {
    setFixtureVariant(EP, 'empty');
    await mount();
    expect(exists('products-empty')).toBe(true);
    expect(exists('products-skeleton')).toBe(false);
    expect(flat(find('products-empty')[0].props.children)).toBeDefined();
    const texts = find('products-empty')[0].findAll(n => typeof n.props.children === 'string');
    expect(texts.map(n => n.props.children)).toContain('Data not Available');
  });

  test('malformed (categories: null): renders without throwing, the skeleton stays (no_rec unchanged)', async () => {
    setFixtureVariant(EP, 'malformed');
    await mount();
    expect(exists('products-skeleton')).toBe(true);
    expect(exists('products-row-0')).toBe(false);
  });

  test('HTTP error: empty error callback, the skeleton stays', async () => {
    setFixtureVariant(EP, 'error');
    installSpy();
    await mount();
    expect(exists('products-skeleton')).toBe(true);
  });

  test('a later answer with rows replaces the empty block (no_rec back to false)', async () => {
    setFixtureVariant(EP, 'empty');
    await mount();
    setFixtureVariant(EP, 'default');
    await emit('focus');
    await settle();
    expect(exists('products-empty')).toBe(false);
    expect(exists('products-row-0')).toBe(true);
  });
});

describe('navigation (products.ts:46-48)', () => {
  test('a row pushes ProductDetail {id}', async () => {
    await mount();
    await act(async () => {
      find('products-row-1')[0].props.onPress();
    });
    expect(navigation.push).toHaveBeenCalledWith('ProductDetail', { id: 22 });
  });

  test('Enter in the search box does nothing (goToProductsWithSearch does not exist in products.ts)', async () => {
    installSpy();
    await mount();
    await act(async () => {
      searchInput().props.onSubmitEditing();
    });
    await settle();
    expect(epCalls()).toHaveLength(1);
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
