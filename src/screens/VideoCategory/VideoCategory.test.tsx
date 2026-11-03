// VideoCategory screen (Ionic VideoCategoryPage): contract, states, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import VideoCategoryScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn() };
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

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

async function settle() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
  }
}

async function mount() {
  await act(async () => {
    tree = ReactTestRenderer.create(<VideoCategoryScreen navigation={navigation as any} route={{ params: {} } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);

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
  test('app_master/VideoCatData: {type} on mount', async () => {
    installSpy();
    await expectContract('app_master/VideoCatData', () => mount());
    expect(JSON.parse(calls.find(c => c.fn === 'app_master/VideoCatData')!.body!)).toEqual({ type: 'Plumber' });
  });
});

describe('states (card States)', () => {
  test('VideoCategory.default: title, one row per category (translated) with the arrow icon', async () => {
    installSpy();
    await mount();
    const texts = allText();
    expect(texts).toEqual(expect.arrayContaining(['Video Categories', 'installation', 'product demo', 'Maintenance', 'keyboard_arrow_right']));
    expect(exists('videocat-item-2')).toBe(true);
    expect(exists('videocat-empty')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('VideoCategory.hin: title and category names go through translate', async () => {
    installSpy();
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(allText()).toContain(i18n.t('Video Categories').replace(/\s+/g, ' '));
  });

  test('VideoCategory.empty: the no_found image, no rows', async () => {
    setFixtureVariant('app_master/VideoCatData', 'empty');
    installSpy();
    await mount();
    expect(exists('videocat-empty')).toBe(true);
    expect(exists('videocat-item-0')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('VideoCategory.malformed (categories: null): no crash, empty page, the loader stays up (Ionic throws before dismiss)', async () => {
    setFixtureVariant('app_master/VideoCatData', 'malformed');
    installSpy();
    await mount();
    expect(exists('videocat-item-0')).toBe(false);
    expect(exists('videocat-empty')).toBe(false);
    expect(openLoaders()).toHaveLength(1);
  });
});

describe('loader (video-category.ts:35/45/48)', () => {
  test('"Please wait..." is up while loading and dismissed by the response', async () => {
    installSpy();
    await act(async () => {
      tree = ReactTestRenderer.create(<VideoCategoryScreen navigation={navigation as any} />);
    });
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('Please wait...');
    expect((loaders[0].options as any).dismissOnPageChange).toBe(true);
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });

  test('an HTTP error dismisses the loader (error callback at :47)', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('navigation (card Nav targets)', () => {
  test('tapping a row pushes Video with {cat}', async () => {
    installSpy();
    await mount();
    const press = find('videocat-item-1').find(n => typeof n.props.onPress === 'function')!;
    await act(async () => {
      press.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
    });
    expect(navigation.push).toHaveBeenCalledWith('Video', { cat: 'product demo' });
  });
});
