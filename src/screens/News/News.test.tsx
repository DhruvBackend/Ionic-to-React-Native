// News screen (Ionic NewsPage): contract, states, infinite scroll offset, navigation. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import NewsScreen from './index';

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
    tree = ReactTestRenderer.create(<NewsScreen navigation={navigation as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const infinite = () => tree.root.findAll(n => typeof n.props.onInfinite === 'function')[0];
const listCalls = () => calls.filter(c => c.fn === 'app_master/newsList');
const bodyOf = (c: ApiRequest) => JSON.parse(c.body!);

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  calls = [];
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
  test('app_master/newsList: {filter: {limit: 0}} on entry', async () => {
    installSpy();
    await expectContract('app_master/newsList', () => mount());
    expect(bodyOf(listCalls()[0])).toEqual({ filter: { limit: 0 } });
  });

  test('the loader is up until the answer arrives', async () => {
    installSpy();
    await act(async () => {
      tree = ReactTestRenderer.create(<NewsScreen navigation={navigation as any} />);
    });
    expect(openLoaders()).toHaveLength(1);
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('states (card States)', () => {
  test('News.default: header title, one row per article, titles lower-cased then title-cased', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining(['Latest News', 'New Bathroom Collection Launched This Season', 'Dealer Meet Held In Jaipur', 'Water Saving Fittings Now With Five Year Warranty']),
    );
    expect(exists('news-item-2')).toBe(true);
    expect(exists('news-item-3')).toBe(false);
    expect(tree.root.findAll(n => typeof n.props.onInfinite === 'function')).toHaveLength(1);
  });

  test('News.empty: no rows', async () => {
    setFixtureVariant('app_master/newsList', 'empty');
    installSpy();
    await mount();
    expect(exists('news-item-0')).toBe(false);
  });

  test('News.malformed (news: null): no crash, no rows, loader gone (dismissed before the failing read)', async () => {
    setFixtureVariant('app_master/newsList', 'malformed');
    installSpy();
    await mount();
    expect(exists('news-item-0')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('an HTTP error leaves the loader up and the page blank (no error callback in Ionic)', async () => {
    installSpy(true);
    await mount();
    expect(exists('news-item-0')).toBe(false);
    expect(openLoaders()).toHaveLength(1);
  });
});

describe('infinite scroll (news.ts:54-72)', () => {
  test('asks for the next offset, appends after 1000 ms and completes', async () => {
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      infinite().props.onInfinite({ complete });
    });
    expect(bodyOf(listCalls()[1])).toEqual({ filter: { limit: 3 } });
    expect(complete).not.toHaveBeenCalled();
    await settle();
    expect(exists('news-item-5')).toBe(true);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  test('an empty page ([] == "") removes the infinite scroll for good', async () => {
    installSpy();
    await mount();
    setFixtureVariant('app_master/newsList', 'empty');
    await act(async () => {
      infinite().props.onInfinite({ complete: jest.fn() });
    });
    await settle();
    expect(tree.root.findAll(n => typeof n.props.onInfinite === 'function')).toHaveLength(0);
  });
});

describe('navigation (card Nav targets)', () => {
  test('tapping a row pushes NewsDetail with {id}', async () => {
    installSpy();
    await mount();
    const press = find('news-item-1').find(n => typeof n.props.onPress === 'function')!;
    await act(async () => {
      press.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
    });
    expect(navigation.push).toHaveBeenCalledWith('NewsDetail', { id: 12 });
  });
});
