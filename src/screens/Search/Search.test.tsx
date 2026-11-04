// Search screen (Ionic SearchPage): states and the typing path. See card.md.
// NOTE: Ionic never sends search/search_alldata (the helper returns an Observable and the page calls .then on it), so there is no
// expectContract here: the contract file documents the call site and the test below asserts that nothing is sent.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock } from '../../api/mock';
import SearchScreen from './index';
import route from './route';

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

async function mount() {
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    return previous(req);
  });
  restoreTransport = () => setTransport(previous);
  await act(async () => {
    tree = ReactTestRenderer.create(<SearchScreen />);
  });
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] =>
  tree.root
    .findAll(n => (n.type as any) === 'Text')
    .map(n => flat(n.props.children))
    .filter(s => ![...s].every(ch => ch.charCodeAt(0) >= 0xe000 && ch.charCodeAt(0) <= 0xf8ff)); // drops icon glyphs (the back arrow)
const input = () => tree.root.findAll(n => typeof n.props.onChangeText === 'function' && n.props.placeholder === 'Search')[0];
const type = async (text: string) => {
  await act(async () => input().props.onChangeText(text));
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  resetMock();
  calls = [];
  db.userStorageData = { id: '900001', type: 'Plumber' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('route', () => {
  test('carries the feature flag of the inventory and has no nav target', () => {
    expect(route.feature).toBe('search');
    expect(route.links).toEqual([]);
  });
});

describe('states (card States)', () => {
  test('Search.default: the Search heading and the Search By Category button, no rows', async () => {
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Search', 'Search By Category']));
    expect(exists('search-bg')).toBe(true);
    expect(exists('search-nothing')).toBe(false);
    expect(input().props.placeholder).toBe('Search');
  });

  test('Search.typed: the heading block goes away; the page is blank (request stays true, so no Data Not Available)', async () => {
    await mount();
    await type('mixer');
    expect(exists('search-bg')).toBe(false);
    expect(exists('search-nothing')).toBe(false);
    expect(allText()).not.toContain('Data Not Available');
  });

  test('clearing the box shows the heading block again', async () => {
    await mount();
    await type('mixer');
    await type('');
    expect(exists('search-bg')).toBe(true);
    expect(exists('search-nothing')).toBe(false);
  });
});

describe('request (never sent)', () => {
  test('typing posts nothing, not even after the 500 ms timer (Observable has no .then in Ionic)', async () => {
    await mount();
    await type('mixer');
    await type('mixers');
    expect(calls).toHaveLength(0);
  });
});

describe('buttons', () => {
  test('Search By Category does nothing (the push is commented out in Ionic)', async () => {
    await mount();
    const btn = find('search-category').find(n => typeof n.props.onPress === 'function')!;
    await act(async () => btn.props.onPress());
    expect(calls).toHaveLength(0);
    expect(exists('search-bg')).toBe(true);
  });
});
