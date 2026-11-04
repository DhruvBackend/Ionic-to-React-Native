// PointDetail screen (Ionic PointDetailPage): contract, states, malformed answer, ionViewDidLeave. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContext } from '@react-navigation/native';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { navigationRef } from '../../navigation/navigationRef';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import PointDetailScreen from './index';
import route from './route';

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
let listeners: Record<string, (() => void)[]> = {};
const emit = (ev: string) => (listeners[ev] || []).forEach(f => f());
const fakeNav = {
  push: jest.fn(),
  getState: () => ({ routes: [{}, {}] }),
  addListener: (ev: string, fn: () => void) => {
    (listeners[ev] ||= []).push(fn);
    return () => {
      listeners[ev] = (listeners[ev] || []).filter(f => f !== fn);
    };
  },
};
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

async function mount(params: object | undefined = { id: 12 }, nav: any = fakeNav) {
  await act(async () => {
    tree = ReactTestRenderer.create(
      <NavigationContext.Provider value={nav}>
        <PointDetailScreen navigation={nav} route={{ params }} />
      </NavigationContext.Provider>,
    );
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);

beforeEach(() => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  listeners = {};
  calls = [];
  db.userStorageData = { id: '900001', type: 'Plumber' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('route carries the inventory feature flag and no nav targets', () => {
  expect(route.feature).toBe('pointDetail');
  expect(route.links).toEqual([]);
});

describe('contracts (card Endpoints)', () => {
  test('app_karigar/couponDetail on entry: {coupon_id: navParams id, karigar_id}', async () => {
    installSpy();
    await expectContract('app_karigar/couponDetail', () => mount());
    const call = calls.find(c => c.fn === 'app_karigar/couponDetail')!;
    expect(JSON.parse(call.body!)).toEqual({ coupon_id: 12, karigar_id: '900001' });
  });

  test('a push without params drops coupon_id from the body (undefined)', async () => {
    installSpy();
    await mount({});
    expect(JSON.parse(calls.find(c => c.fn === 'app_karigar/couponDetail')!.body!)).toEqual({ karigar_id: '900001' });
  });
});

describe('states (card States)', () => {
  test('PointDetail.default: title, heading, date, image and the points line', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(['Points Detail', 'Get Point', '28 October 2026', '150 Point']);
    expect(exists('pointdetail-image')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
  });

  test('loader: "Please wait..." while the answer is pending', async () => {
    installSpy();
    await act(async () => {
      tree = ReactTestRenderer.create(<PointDetailScreen navigation={fakeNav as any} route={{ params: { id: 12 } }} />);
    });
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('Please wait...');
  });

  test('empty coupon ({}): no date line, the points line is just "Point"', async () => {
    setFixtureVariant('app_karigar/couponDetail', 'empty');
    installSpy();
    await mount();
    expect(allText()).toEqual(['Points Detail', 'Get Point', 'Point']);
    expect(exists('pointdetail-date')).toBe(false);
  });

  test('malformed (coupon: null): the loader is gone and the last good render stays (empty date, "Point")', async () => {
    setFixtureVariant('app_karigar/couponDetail', 'malformed');
    installSpy();
    await mount();
    expect(openLoaders()).toHaveLength(0);
    expect(allText()).toEqual(['Points Detail', 'Get Point', 'Point']);
  });

  test('HTTP error: the loader stays up, the page keeps its empty template', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
    expect(allText()).toEqual(['Points Detail', 'Get Point', 'Point']);
  });
});

describe('ionViewDidLeave (point-detail.ts:47-70)', () => {
  const stackState = (names: string[]) => ({ type: 'stack', index: names.length - 1, routes: names.map(name => ({ name })) });
  async function leave(stackRoutes: number, root: any) {
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(true);
    jest.spyOn(navigationRef, 'getRootState').mockReturnValue(root);
    installSpy();
    const nav = { ...fakeNav, popToTop: jest.fn(), getState: () => ({ routes: new Array(stackRoutes).fill({}) }) };
    await mount({ id: 12 }, nav);
    await act(async () => emit('blur'));
    return nav;
  }

  test('active page is a root page (Home), previous is not, stack has >1 page: popToTop', async () => {
    const nav = await leave(2, stackState(['Home']));
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
});
