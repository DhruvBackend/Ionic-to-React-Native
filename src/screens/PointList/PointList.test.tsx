// PointList screen (Ionic PointListPage): contract, states, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { navigationRef } from '../../navigation/navigationRef';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import PointListScreen from './index';

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
    tree = ReactTestRenderer.create(<PointListScreen navigation={navigation as any} route={{ params: {} } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const textOf = (id: string): string => flat(find(id).find(n => (n.type as any) === 'Text')!.props.children);
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const refresher = () => tree.root.findAll(n => typeof n.props.onRefresh === 'function')[0];
const press = async (id: string) => {
  const node = find(id).find(n => typeof n.props.onPress === 'function')!;
  await act(async () => {
    node.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
  });
};

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
  test('app_karigar/couponHistory: {filter: {limit: 0}, karigar_id} on mount', async () => {
    installSpy();
    await expectContract('app_karigar/couponHistory', () => mount());
    expect(JSON.parse(calls.find(c => c.fn === 'app_karigar/couponHistory')!.body!)).toEqual({ filter: { limit: 0 }, karigar_id: '900001' });
  });
  test('loadData (couponHistory at :114), service() and referal() are dead code in Ionic: never called', async () => {
    installSpy();
    await mount();
    await press('point-service');
    await press('point-referal');
    await press('point-redeem');
    expect(calls.filter(c => c.fn === 'app_karigar/couponHistory')).toHaveLength(1);
    expect(calls.filter(c => c.fn === 'app_karigar/getPlumberComplaintList')).toHaveLength(0);
    expect(calls.filter(c => c.fn === 'app_karigar/referal_logs')).toHaveLength(0);
  });
});

describe('states (card States)', () => {
  test('PointList.default (Plumber): header, three cards, table, balance card, server numbers printed as is', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining([
        'My Points',
        'Earn By Scan Points',
        'Earn By Service Points',
        'Earn By Referal Points',
        'Total Earn Point',
        'Redeem Point',
        'Total Balance',
        'chevron_right',
      ]),
    );
    expect(textOf('point-scan-value')).toBe('1250');
    expect(textOf('point-service-value')).toBe('300');
    expect(textOf('point-referal-value')).toBe('150');
    expect(textOf('point-total-earn')).toBe('1700');
    expect(textOf('point-total-redeem')).toBe('500');
    expect(textOf('point-balance-value')).toBe('1200');
    expect(find('ion-navbar').length).toBeGreaterThan(0);
  });

  test('PointList.dealer: the service card is for Plumber only (userType == "Plumber")', async () => {
    db.userStorageData = { id: '900002', type: 'Dealer' };
    installSpy();
    await mount();
    expect(exists('point-service')).toBe(false);
    expect(allText()).not.toContain('Earn By Service Points');
    expect(exists('point-scan')).toBe(true);
    expect(exists('point-referal')).toBe(true);
  });

  test('PointList.hin: translated labels', async () => {
    installSpy();
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    const texts = allText();
    expect(texts).toContain(i18n.t('My Points').replace(/\s+/g, ' '));
    expect(texts).toContain(i18n.t('Total Balance').replace(/\s+/g, ' '));
    expect(texts).toContain(i18n.t('Redeem Point').replace(/\s+/g, ' '));
  });

  test('PointList.zero: 0 prints as "0" (interpolation), not blank', async () => {
    setFixtureVariant('app_karigar/couponHistory', 'zero');
    installSpy();
    await mount();
    expect(textOf('point-scan-value')).toBe('0');
    expect(textOf('point-total-earn')).toBe('0');
    expect(textOf('point-total-redeem')).toBe('0');
  });

  test('PointList.empty (karigar: {}): the block is still shown with blank values, redeem row keeps only the arrow', async () => {
    setFixtureVariant('app_karigar/couponHistory', 'empty');
    installSpy();
    await mount();
    expect(exists('point-scan')).toBe(true);
    expect(textOf('point-scan-value')).toBe('');
    expect(textOf('point-total-earn')).toBe('');
    expect(exists('point-total-redeem')).toBe(false);
    expect(allText()).toContain('chevron_right');
    expect(openLoaders()).toHaveLength(0);
  });

  test('values are blank (cards already shown) before the response arrives', async () => {
    installSpy();
    await act(async () => {
      tree = ReactTestRenderer.create(<PointListScreen navigation={navigation as any} route={{ params: {} } as any} />);
    });
    expect(exists('point-scan')).toBe(true);
    expect(textOf('point-scan-value')).toBe('');
    await settle();
    expect(textOf('point-scan-value')).toBe('1250');
  });

  test('PointList.malformed (karigar: null): no crash, blank values stay, loader dismissed', async () => {
    setFixtureVariant('app_karigar/couponHistory', 'malformed');
    installSpy();
    await mount();
    expect(textOf('point-scan-value')).toBe('');
    expect(openLoaders()).toHaveLength(0);
  });

  test('malformed refresh after values keeps the old values (Ionic change detection throws, DOM stays)', async () => {
    installSpy();
    await mount();
    setFixtureVariant('app_karigar/couponHistory', 'malformed');
    await act(async () => {
      refresher().props.onRefresh({ complete: jest.fn() });
    });
    await settle();
    expect(textOf('point-scan-value')).toBe('1250');
    expect(openLoaders()).toHaveLength(0);
  });

  test('refresh calls couponHistory again (limit 0) and completes at once', async () => {
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      refresher().props.onRefresh({ complete });
    });
    expect(complete).toHaveBeenCalledTimes(1);
    const sent = calls.filter(c => c.fn === 'app_karigar/couponHistory');
    expect(sent).toHaveLength(2);
    expect(JSON.parse(sent[1].body!).filter).toEqual({ limit: 0 });
    await settle();
  });
});

describe('loader (point-list.ts:99-107)', () => {
  test('"Please wait..." (dismissOnPageChange, enableBackdropDismiss) is up while loading and dismissed by the response', async () => {
    installSpy();
    await act(async () => {
      tree = ReactTestRenderer.create(<PointListScreen navigation={navigation as any} route={{ params: {} } as any} />);
    });
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('Please wait...');
    expect((loaders[0].options as any).dismissOnPageChange).toBe(true);
    expect((loaders[0].options as any).enableBackdropDismiss).toBe(true);
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });

  test('an HTTP error leaves the loader up (no error callback in Ionic) and the values blank', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
    expect(textOf('point-scan-value')).toBe('');
  });
});

describe('navigation (card Nav targets)', () => {
  test('scan card pushes PointHistory {scan: "scan"}', async () => {
    installSpy();
    await mount();
    await press('point-scan');
    expect(navigation.push).toHaveBeenCalledTimes(1);
    expect(navigation.push).toHaveBeenCalledWith('PointHistory', { scan: 'scan' });
  });
  test('service card pushes PointHistory {service: "service"}', async () => {
    installSpy();
    await mount();
    await press('point-service');
    expect(navigation.push).toHaveBeenCalledWith('PointHistory', { service: 'service' });
  });
  test('referal card pushes PointHistory {referal: "referal"}', async () => {
    installSpy();
    await mount();
    await press('point-referal');
    expect(navigation.push).toHaveBeenCalledWith('PointHistory', { referal: 'referal' });
  });
  test('the Redeem row pushes PointHistory {redeem: "redeem"}', async () => {
    installSpy();
    await mount();
    await press('point-redeem');
    expect(navigation.push).toHaveBeenCalledWith('PointHistory', { redeem: 'redeem' });
  });
  test('the Total Balance card has no click handler (the Total Earn row neither)', async () => {
    installSpy();
    await mount();
    expect(find('point-balance').some(n => typeof n.props.onPress === 'function')).toBe(false);
    expect(navigation.push).not.toHaveBeenCalled();
  });
});

describe('ionViewDidLeave (point-list.ts:130-154)', () => {
  const stackState = (names: string[]) => ({ type: 'stack', index: names.length - 1, routes: names.map(name => ({ name })) });
  function mountWithNav(stackRoutes: number) {
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
    return { nav, listeners };
  }
  async function leave(stackRoutes: number, rootState: any) {
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(true);
    jest.spyOn(navigationRef, 'getRootState').mockReturnValue(rootState);
    installSpy();
    const { nav, listeners } = mountWithNav(stackRoutes);
    await act(async () => {
      tree = ReactTestRenderer.create(<PointListScreen navigation={nav as any} route={{ params: {} } as any} />);
    });
    await settle();
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
  test('stack with a single route: nothing to pop', async () => {
    const nav = await leave(1, stackState(['Home']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
  test('active page is PointHistory (not a root page): nothing', async () => {
    const nav = await leave(2, stackState(['Home', 'PointList', 'PointHistory']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
  test('previous page is a root page: nothing', async () => {
    const nav = await leave(2, stackState(['Home', 'Profile']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
});
