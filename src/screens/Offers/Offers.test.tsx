// Offers screen (Ionic OffersPage): contract, states, navigation and quirks. See card.md.
import React from 'react';
import { Image } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { navigationRef } from '../../navigation/navigationRef';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import OffersScreen from './index';
import { stripeColor } from './styles';

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

async function mount(params: any = { id: 11 }, nav: any = navigation) {
  await act(async () => {
    tree = ReactTestRenderer.create(<OffersScreen navigation={nav} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const refresher = () => tree.root.findAll(n => typeof n.props.onRefresh === 'function')[0];
const text = (id: string) => flat(find(id).find(n => (n.type as any) === 'Text')!.props.children);

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
  restoreTransport = () => {};
  jest.restoreAllMocks();
});

describe('contract (card Endpoints)', () => {
  test('app_karigar/offerDetail: {offer_id, karigar_id} on mount', async () => {
    installSpy();
    await expectContract('app_karigar/offerDetail', () => mount());
    expect(JSON.parse(calls.find(c => c.fn === 'app_karigar/offerDetail')!.body!)).toEqual({ offer_id: 11, karigar_id: '900001' });
  });
});

describe('states (card States)', () => {
  test('parity: Redeem Points line is drawn (absolute overflow, 70px padding box) and the type span sits in an 19px strut line', async () => {
    installSpy();
    await mount();
    const { StyleSheet } = require('react-native');
    const box = StyleSheet.flatten(find('gift-redeem-0-box').find(n => (n.type as any) === 'View')!.props.style);
    expect(box.height).toBe(14);
    expect(box.width).toBeGreaterThan(70);
    expect(StyleSheet.flatten(find('gift-redeem-0').find(n => (n.type as any) === 'Text')!.props.style)).toMatchObject({ position: 'absolute', left: 0, width: 260 });
    expect(text('gift-redeem-0')).toBe('Redeem Points');
    const span = find('gift-type-0').find(n => (n.type as any) === 'Text')!;
    expect(StyleSheet.flatten(span.props.style)).toMatchObject({ marginTop: 4, lineHeight: 14 });
    expect(StyleSheet.flatten(find('gift-type-line-0').find(n => (n.type as any) === 'View')!.props.style)).toMatchObject({ height: 19 });
  });

  test('Offers.default: titlecased title in the navbar, banner, one card per gift', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining(['Diwali Dhamaka Offer', '500', '2500', '1000', 'Redeem Points', 'Steel Water Bottle', 'Bluetooth Speaker', 'Cash Voucher', 'Gift']),
    );
    expect(find('offer-banner')[0].props.source).toEqual({ uri: db.upload_url3 + 'offer_banner_11.jpg' });
    expect(exists('gift-item-2')).toBe(true);
    expect(exists('gift-item-3')).toBe(false);
    // coupon_points is parsed to a number by the callback; the empty type shows no span
    expect(text('gift-points-0')).toBe('500');
    expect(exists('gift-type-2')).toBe(false);
    expect(exists('gift-type-0')).toBe(true);
    // the empty image string hides the <img>, the other two show url + image
    expect(exists('gift-image-2')).toBe(false);
    expect(find('gift-image-1')[0].props.source).toEqual({ uri: db.upload_url3 + 'gift_22.jpg' });
    expect(openLoaders()).toHaveLength(0);
  });

  test('verified_user icon only where toInt(coupon_points) <= karigar.total_balance (1200)', async () => {
    installSpy();
    await mount();
    expect(exists('gift-verified-0')).toBe(true); // 500
    expect(exists('gift-verified-1')).toBe(false); // 2500
    expect(exists('gift-verified-2')).toBe(true); // 1000
    expect(allText()).toContain('verified_user');
  });

  test('Offers.hin: the translated label (the date block never shows)', async () => {
    installSpy();
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(allText()).toContain(i18n.t('Redeem Points').replace(/\s+/g, ' '));
  });

  test('stripe colours follow the :nth-child cascade (4n+4 > 3n+3 > 2n+2 > 1n+1)', () => {
    const c = [1, 2, 3, 4, 5, 6, 7, 8, 9, 12].map(stripeColor);
    expect(c[0]).toBe(c[4]); // 1, 5, 7 yellow
    expect(c[0]).toBe(c[6]);
    expect(c[1]).not.toBe(c[0]); // 2 red
    expect(c[2]).toBe(c[5]); // 3, 6, 9 pink
    expect(c[2]).toBe(c[8]);
    expect(c[3]).toBe(c[7]); // 4, 8, 12 indigo
    expect(c[3]).toBe(c[9]);
    expect(new Set([c[0], c[1], c[2], c[3]]).size).toBe(4);
  });

  test('the content box (title, Valid Upto, Description, Terms & Condition) never shows: notdata can not become true', async () => {
    installSpy();
    await mount();
    expect(exists('offer-content-box')).toBe(false);
    expect(exists('offer-terms-link')).toBe(false);
    expect(allText().some(x => x.startsWith('Valid Upto'))).toBe(false);
  });

  test('Offers.noGifts (gift: []): offer_detail is assigned, then gift[0] throws: title + banner, no list, loader stays up, notdata stays false', async () => {
    setFixtureVariant('app_karigar/offerDetail', 'empty');
    installSpy();
    await mount();
    expect(allText()).toContain('Diwali Dhamaka Offer');
    expect(find('offer-banner')[0].props.source).toEqual({ uri: db.upload_url3 + 'offer_banner_11.jpg' });
    expect(exists('offer-gifts')).toBe(false);
    expect(exists('offer-content-box')).toBe(false);
    expect(openLoaders()).toHaveLength(1);
  });

  test('malformed (offer: null): throws at the first line: nothing changes, loader stays up', async () => {
    setFixtureVariant('app_karigar/offerDetail', 'malformed');
    installSpy();
    await mount();
    expect(find('offer-banner')[0].props.source).toEqual({ uri: db.upload_url3 + 'undefined' });
    expect(exists('offer-gifts')).toBe(false);
    expect(openLoaders()).toHaveLength(1);
  });

  test('NOT FOUND status has no offer key: same as malformed (the page never reads status)', async () => {
    setFixtureVariant('app_karigar/offerDetail', 'NOT FOUND');
    installSpy();
    await mount();
    expect(exists('offer-gifts')).toBe(false);
    expect(openLoaders()).toHaveLength(1);
  });

  test('karigar: null throws after offer_detail is assigned: the offer shows, the gifts do not, loader stays up', async () => {
    setFixtureVariant('app_karigar/offerDetail', 'noKarigar');
    installSpy();
    await mount();
    expect(allText()).toContain('Diwali Dhamaka Offer');
    expect(exists('offer-gifts')).toBe(false);
    expect(openLoaders()).toHaveLength(1);
  });

  test('a long banner uses its natural ratio, capped at the box width (max-width: 100%)', async () => {
    const getSize = jest.spyOn(Image, 'getSize').mockImplementation(((uri: string, ok: (w: number, h: number) => void) => {
      if (uri.endsWith('offer_banner_11.jpg')) {
        ok(1000, 500);
      }
    }) as any);
    installSpy();
    await mount();
    expect(getSize).toHaveBeenCalled();
    await act(async () => {
      find('offer-banner-box')[0].props.onLayout({ nativeEvent: { layout: { width: 332, height: 0 } } });
    });
    const style = find('offer-banner')[0].props.style;
    expect(style.width).toBe(320);
    expect(style.height).toBe(160);
  });
});

describe('loader (offers.ts:101-108)', () => {
  test('"Please wait..." (dismissOnPageChange false) is up while loading and dismissed by the response', async () => {
    installSpy();
    await act(async () => {
      tree = ReactTestRenderer.create(<OffersScreen navigation={navigation} route={{ params: { id: 11 } } as any} />);
    });
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('Please wait...');
    expect((loaders[0].options as any).dismissOnPageChange).toBe(false);
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });

  test('an HTTP error leaves the loader up (no error callback in Ionic)', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
    expect(exists('offer-gifts')).toBe(false);
  });
});

describe('refresh and re-entry', () => {
  test('refresh calls the endpoint again, completes at once and shows no loader', async () => {
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      refresher().props.onRefresh({ complete });
    });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(openLoaders()).toHaveLength(0);
    expect(calls.filter(c => c.fn === 'app_karigar/offerDetail')).toHaveLength(2);
    await settle();
  });

  test('ionViewDidEnter again (focus after blur) reloads and shows a new loader (the first focus is the first entry)', async () => {
    installSpy();
    const listeners: Record<string, () => void> = {};
    const all: Record<string, (() => void)[]> = {};
    const nav = {
      push: jest.fn(),
      addListener: (type: string, cb: () => void) => {
        (all[type] ||= []).push(cb);
        listeners[type] = () => (all[type] || []).forEach(f => f());
        return () => {
          all[type] = (all[type] || []).filter(f => f !== cb);
        };
      },
    };
    await mount({ id: 11 }, nav);
    await act(async () => {
      listeners.focus();
    });
    expect(calls.filter(c => c.fn === 'app_karigar/offerDetail')).toHaveLength(1);
    await act(async () => {
      listeners.blur();
    });
    await act(async () => {
      listeners.focus();
    });
    expect(calls.filter(c => c.fn === 'app_karigar/offerDetail')).toHaveLength(2);
    expect(openLoaders()).toHaveLength(1);
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('navigation (card Nav targets)', () => {
  test('tapping a gift pushes GiftDetail with {id}', async () => {
    installSpy();
    await mount();
    const press = find('gift-item-1').find(n => typeof n.props.onPress === 'function')!;
    await act(async () => {
      press.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
    });
    expect(navigation.push).toHaveBeenCalledWith('GiftDetail', { id: 22 });
  });
});

describe('ionViewDidLeave (offers.ts:111-132)', () => {
  const stackState = (names: string[]) => ({ type: 'stack', index: names.length - 1, routes: names.map(name => ({ name })) });
  async function leave(stackRoutes: number, rootState: any) {
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(true);
    jest.spyOn(navigationRef, 'getRootState').mockReturnValue(rootState);
    installSpy();
    const listeners: Record<string, () => void> = {};
    const all: Record<string, (() => void)[]> = {};
    const nav = {
      push: jest.fn(),
      popToTop: jest.fn(),
      getState: () => ({ routes: new Array(stackRoutes).fill({}) }),
      addListener: (type: string, cb: () => void) => {
        (all[type] ||= []).push(cb);
        listeners[type] = () => (all[type] || []).forEach(f => f());
        return () => {
          all[type] = (all[type] || []).filter(f => f !== cb);
        };
      },
    };
    await mount({ id: 11 }, nav);
    await act(async () => {
      listeners.blur();
    });
    return nav;
  }

  test('active nav shows Home with no root page before it and this stack has >1 page: popToTop', async () => {
    const nav = await leave(2, stackState(['Home']));
    expect(nav.popToTop).toHaveBeenCalledTimes(1);
  });
  test('stack with a single route: nothing to pop', async () => {
    const nav = await leave(1, stackState(['Home']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
  test('active page is Terms (not a root page): nothing', async () => {
    const nav = await leave(2, stackState(['Home', 'Offers', 'Terms']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
});
