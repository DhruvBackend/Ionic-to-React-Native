// Video screen (Ionic VideoPage): contract, states, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { navigationRef } from '../../navigation/navigationRef';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import VideoScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
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

async function mount(params: any = { cat: 'installation' }, nav: any = {}) {
  await act(async () => {
    tree = ReactTestRenderer.create(<VideoScreen navigation={nav} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const infinite = () => tree.root.findAll(n => typeof n.props.onInfinite === 'function')[0];
const bodies = () => calls.filter(c => c.fn === 'app_master/videoList').map(c => JSON.parse(c.body!));

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
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
  jest.restoreAllMocks();
});

describe('contracts (card Endpoints)', () => {
  test('app_master/videoList: {filter: {limit: 0, category}, karigar_id} on mount', async () => {
    installSpy();
    await expectContract('app_master/videoList', () => mount());
    expect(bodies()[0]).toEqual({ filter: { limit: 0, category: 'installation' }, karigar_id: '900001' });
  });

  test('app_master/videoList load more: {filter: {limit: list length, category}} without karigar_id', async () => {
    installSpy();
    await mount();
    await act(async () => {
      infinite().props.onInfinite({ complete: jest.fn() });
    });
    await settle();
    expect(bodies()[1]).toEqual({ filter: { limit: 2, category: 'installation' } });
  });
});

describe('states (card States)', () => {
  test('Video.default: titlecased category title, one embed + description per video', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Installation', 'How to install a basin mixer', 'Care and cleaning of chrome fittings']));
    expect(exists('video-item-1')).toBe(true);
    expect(find('video-embed-0')[0].props.uri).toBe(require('../../api/fixtures/app_master__videoList.json').variants.default.video[0].url);
    expect(find('video-embed-0')[0].props.height).toBe(180);
    expect(exists('video-empty')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('Video.nocategory: the translated "Videos" title', async () => {
    installSpy();
    await mount({});
    expect(allText()).toContain('Videos');
    expect(bodies()[0]).toEqual({ filter: { limit: 0 }, karigar_id: '900001' });
  });

  test('Video.hin: the empty-state text is translated', async () => {
    setFixtureVariant('app_master/videoList', 'empty');
    installSpy();
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(allText()).toContain(i18n.t('Data not Available').replace(/\s+/g, ' '));
  });

  test('Video.empty: "Data not Available", no embeds', async () => {
    setFixtureVariant('app_master/videoList', 'empty');
    installSpy();
    await mount();
    expect(exists('video-empty')).toBe(true);
    expect(allText()).toContain('Data not Available');
    expect(exists('video-item-0')).toBe(false);
  });

  test('Video.malformed (video: null): no crash, nothing drawn, loader gone', async () => {
    setFixtureVariant('app_master/videoList', 'malformed');
    installSpy();
    await mount();
    expect(exists('video-item-0')).toBe(false);
    expect(exists('video-empty')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('loader (video.ts:63-70)', () => {
  test('"Please wait..." is up while loading and dismissed by the response', async () => {
    installSpy();
    await act(async () => {
      tree = ReactTestRenderer.create(<VideoScreen navigation={{}} route={{ params: { cat: 'x' } } as any} />);
    });
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('Please wait...');
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

describe('infinite scroll (video.ts:73-96)', () => {
  test('the next page is appended after 1s and complete() runs', async () => {
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      infinite().props.onInfinite({ complete });
    });
    await settle();
    expect(complete).toHaveBeenCalledTimes(1);
    expect(exists('video-item-3')).toBe(true);
  });

  test('an empty page ends paging for good: the infinite scroll is removed', async () => {
    installSpy();
    await mount();
    setFixtureVariant('app_master/videoList', 'empty');
    const complete = jest.fn();
    await act(async () => {
      infinite().props.onInfinite({ complete });
    });
    await settle();
    expect(complete).not.toHaveBeenCalled();
    expect(tree.root.findAll(n => typeof n.props.onInfinite === 'function')).toHaveLength(0);
  });
});

describe('ionViewDidLeave (video.ts:98-120)', () => {
  const stackState = (names: string[]) => ({ type: 'stack', index: names.length - 1, routes: names.map(name => ({ name })) });
  async function leave(stackRoutes: number, rootState: any) {
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(true);
    jest.spyOn(navigationRef, 'getRootState').mockReturnValue(rootState);
    installSpy();
    const listeners: Record<string, () => void> = {};
    const nav = {
      popToTop: jest.fn(),
      getState: () => ({ routes: new Array(stackRoutes).fill({}) }),
      addListener: (type: string, cb: () => void) => {
        listeners[type] = cb;
        return () => {};
      },
    };
    await mount({ cat: 'installation' }, nav);
    await act(async () => {
      listeners.blur();
    });
    return nav;
  }

  test('active nav shows Home with no root page before it and this stack has >1 page: popToTop', async () => {
    const nav = await leave(2, stackState(['Home']));
    expect(nav.popToTop).toHaveBeenCalledTimes(1);
  });
  test('active page is not a root page: nothing', async () => {
    const nav = await leave(2, stackState(['Home', 'VideoCategory', 'Video']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
});
