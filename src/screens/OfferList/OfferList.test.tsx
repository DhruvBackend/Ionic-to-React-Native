// OfferList screen (Ionic OfferListPage): contract, states, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { navigationRef } from '../../navigation/navigationRef';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import OfferListScreen from './index';

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

async function mount(params: any = {}) {
  await act(async () => {
    tree = ReactTestRenderer.create(<OfferListScreen navigation={navigation as any} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const refresher = () => tree.root.findAll(n => typeof n.props.onRefresh === 'function')[0];

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
  test('app_karigar/offerList: {karigar_id} on mount', async () => {
    installSpy();
    await expectContract('app_karigar/offerList', () => mount());
    expect(JSON.parse(calls.find(c => c.fn === 'app_karigar/offerList')!.body!)).toEqual({ karigar_id: '900001' });
  });
  test('app_karigar/get_user_lang is dead code in Ionic: never called', async () => {
    installSpy();
    await mount();
    expect(calls.filter(c => c.fn === 'app_karigar/get_user_lang')).toHaveLength(0);
  });
});

describe('states (card States)', () => {
  test('OfferList.default: title, one card per offer with titlecased title and "d MMMM y" date', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining([
        'My Offer',
        'Diwali Dhamaka Offer',
        'Valid Upto : 31 December 2026',
        'Monsoon Bonanza',
        'Valid Upto : 15 January 2027',
        'New Year Scheme',
        'Valid Upto : 28 February 2027',
        'trending_flat',
      ]),
    );
    expect(find('offer-item-0').length).toBeGreaterThan(0);
    expect(exists('offer-item-2')).toBe(true);
    expect(exists('offer-empty')).toBe(false);
    expect(find('offer-banner-0')[0].props.source).toEqual({ uri: db.upload_url3 + 'offer_banner_11.jpg' });
    expect(find('ion-navbar').length).toBeGreaterThan(0);
  });

  test('OfferList.hin: translated title and label, dates stay English (en-US pipe)', async () => {
    installSpy();
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    const texts = allText();
    expect(texts).toContain(i18n.t('My Offer').replace(/\s+/g, ' '));
    expect(texts.some(x => x.startsWith(i18n.t('Valid Upto').replace(/\s+/g, ' ') + ' : 31 December 2026'))).toBe(true);
  });

  test('OfferList.empty: the no_found image, no cards', async () => {
    setFixtureVariant('app_karigar/offerList', 'empty');
    installSpy();
    await mount();
    expect(exists('offer-empty')).toBe(true);
    expect(exists('offer-list-main')).toBe(false);
  });

  test('OfferList.malformed (offer: null): no crash, the first-load empty state stays, loader gone', async () => {
    setFixtureVariant('app_karigar/offerList', 'malformed');
    installSpy();
    await mount();
    expect(exists('offer-empty')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
  });

  test('malformed refresh after a list keeps the old list (Ionic change detection throws, DOM stays)', async () => {
    installSpy();
    await mount();
    setFixtureVariant('app_karigar/offerList', 'malformed');
    await act(async () => {
      refresher().props.onRefresh({ complete: jest.fn() });
    });
    await settle();
    expect(exists('offer-item-0')).toBe(true);
    expect(exists('offer-empty')).toBe(false);
  });

  test('refresh calls the endpoint again and completes at once', async () => {
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      refresher().props.onRefresh({ complete });
    });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(calls.filter(c => c.fn === 'app_karigar/offerList')).toHaveLength(2);
    await settle();
  });
});

describe('loader (offer-list.ts:82-89)', () => {
  test('"Please wait..." is up while loading and dismissed by the response', async () => {
    installSpy();
    await act(async () => {
      tree = ReactTestRenderer.create(<OfferListScreen navigation={navigation as any} route={{ params: {} } as any} />);
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
    expect(exists('offer-empty')).toBe(true);
  });
});

describe('navigation (card Nav targets)', () => {
  test('tapping a card pushes Offers with {id, lang} (lang undefined without a param)', async () => {
    installSpy();
    await mount();
    const press = find('offer-item-1').find(n => typeof n.props.onPress === 'function')!;
    await act(async () => {
      press.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
    });
    expect(navigation.push).toHaveBeenCalledWith('Offers', { id: 12, lang: undefined });
  });

  test('a lang param is switched to and passed on', async () => {
    installSpy();
    await mount({ lang: 'hin' });
    expect(i18n.language).toBe('hin');
    const press = find('offer-item-0').find(n => typeof n.props.onPress === 'function')!;
    await act(async () => {
      press.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
    });
    expect(navigation.push).toHaveBeenCalledWith('Offers', { id: 11, lang: 'hin' });
  });

  test('no lang param leaves the app language alone', async () => {
    installSpy();
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(i18n.language).toBe('hin');
  });
});

describe('pipes', () => {
  test('titlecase splits on word boundaries (it-s becomes It-S style), date pipe formats d MMMM y', async () => {
    installSpy();
    setFixtureVariant('app_karigar/offerList', 'default');
    const fx = require('../../api/fixtures/app_karigar__offerList.json');
    const saved = fx.variants.default.offer[0];
    fx.variants.default.offer[0] = { ...saved, title: "it's a DEAL", end_date: '2026-03-05' };
    try {
      await mount();
      expect(allText()).toEqual(expect.arrayContaining(["It'S A Deal", 'Valid Upto : 5 March 2026']));
    } finally {
      fx.variants.default.offer[0] = saved;
    }
  });
});

describe('ionViewDidLeave (offer-list.ts:118-143)', () => {
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
      tree = ReactTestRenderer.create(<OfferListScreen navigation={nav as any} route={{ params: {} } as any} />);
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
  test('active page is Offers (not a root page): nothing', async () => {
    const nav = await leave(2, stackState(['Home', 'OfferList', 'Offers']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
  test('previous page is a root page: nothing', async () => {
    const nav = await leave(2, stackState(['Home', 'Profile']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
});
