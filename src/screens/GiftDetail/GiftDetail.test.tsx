// GiftDetail screen (Ionic GiftDetailPage): contract, states, navigation and quirks. See card.md.
import React from 'react';
import { Image, StyleSheet } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { navigationRef } from '../../navigation/navigationRef';
import { giftDetailMd } from '../../theme/ionicMdGiftDetail';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import GiftDetailScreen from './index';

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

async function mount(params: any = { id: 21 }, nav: any = navigation) {
  await act(async () => {
    tree = ReactTestRenderer.create(<GiftDetailScreen navigation={nav} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const text = (id: string) => flat(find(id).find(n => (n.type as any) === 'Text')!.props.children);
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options as any);
const button = () => find('gift-redeem')[0];

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
  test('app_karigar/giftDetail: {gift_id, karigar_id} on mount', async () => {
    installSpy();
    await expectContract('app_karigar/giftDetail', () => mount());
    expect(JSON.parse(calls.find(c => c.fn === 'app_karigar/giftDetail')!.body!)).toEqual({ gift_id: 21, karigar_id: '900001' });
  });

  test('no id param (push notification of type gift): gift_id is undefined and JSON drops the key', async () => {
    installSpy();
    await mount({});
    expect(JSON.parse(calls.find(c => c.fn === 'app_karigar/giftDetail')!.body!)).toEqual({ karigar_id: '900001' });
  });

  test('get_user_lang() and rating() are dead code: neither endpoint is ever called', async () => {
    installSpy();
    await mount();
    expect(calls.map(c => c.fn)).toEqual(['app_karigar/giftDetail']);
  });
});

describe('states (card States)', () => {
  test('GiftDetail.default: balance, gift, offer, specification, enabled redeem button, no address box', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Gift Gallery', 'Balance Points']));
    expect(text('gift-balance')).toBe('1200');
    expect(text('gift-title')).toBe('Steel Water Bottle');
    expect(text('gift-points')).toBe('500 Points'); // coupon_points was parsed to a number
    expect(text('gift-offer-title')).toBe('Diwali Dhamaka Offer');
    expect(text('gift-valid')).toBe('Valid Upto : 31 December 2026');
    expect(text('gift-spec')).toBe('Specification : Insulated steel bottle, 1 litre, keeps drinks hot or cold for 12 hours.');
    expect(find('gift-image')[0].props.source).toEqual({ uri: db.upload_url3 + 'gift_21.jpg' });
    expect(find('gift-offer-banner')[0].props.source).toEqual({ uri: db.upload_url3 + 'offer_banner_11.jpg' });
    expect(exists('gift-address-box')).toBe(false);
    expect(button().props.disabled).toBe(false);
    expect(flat(button().props.children)).toBe('Send Redeem Request');
    expect(button().props.textTransform).toBe('capitalize');
    expect(openLoaders()).toHaveLength(0);
    expect(alerts()).toHaveLength(0);
  });

  test('GiftDetail.hin: labels translated, server text stays', async () => {
    installSpy();
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(allText()).toEqual(expect.arrayContaining([i18n.t('Gift Gallery'), i18n.t('Balance Points')]));
    expect(text('gift-points')).toBe(`500 ${i18n.t('Points')}`);
    expect(text('gift-valid').startsWith(i18n.t('Valid Upto'))).toBe(true);
    expect(flat(button().props.children)).toBe(i18n.t('Send Redeem Request'));
  });

  test('GiftDetail.noAddress: type Gift and an empty address: red box with the link, redeem button disabled', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'noAddress');
    installSpy();
    await mount();
    const box = StyleSheet.flatten(find('gift-address-box')[0].props.style);
    expect(box.backgroundColor).toBe(giftDetailMd.rejectBackground);
    expect(box.borderColor).toBe(giftDetailMd.rejectBorder);
    expect(text('gift-address-text')).toContain('Your Address Is Not Updated. Please Update Address');
    expect(text('gift-update-now')).toBe('Update Now');
    expect(button().props.disabled).toBe(true);
  });

  test('state or pincode empty with address, city and district filled: influencer_point throws in the [ngClass]: empty box, nothing else updates', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'noStateOnly');
    installSpy();
    await mount();
    expect(exists('gift-address-box')).toBe(true);
    const box = StyleSheet.flatten(find('gift-address-box')[0].props.style);
    expect(box.backgroundColor).toBeUndefined(); // no 'kyc-reject' class
    expect(exists('gift-address-text')).toBe(false);
    expect(exists('gift-update-now')).toBe(false);
    // the error aborted the root view's text update: the initial empty template stays; the embedded views that were checked first show
    expect(text('gift-balance')).toBe('0');
    expect(text('gift-title')).toBe('');
    expect(find('gift-image')[0].props.source).toEqual({ uri: db.upload_url3 + 'gift_21.jpg' });
    // the button view was created but never checked: no label, not disabled, still opens the modal
    expect(exists('gift-redeem')).toBe(true);
    expect(flat(button().props.children)).toBe('');
    expect(button().props.disabled).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('GiftDetail.lowBalance: total_balance < coupon_points: no redeem button', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'lowBalance');
    installSpy();
    await mount();
    expect(text('gift-points')).toBe('2500 Points');
    expect(exists('gift-redeem')).toBe(false);
  });

  test('type other than Gift: no address box and the button stays enabled even with no address', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'notGift');
    installSpy();
    await mount();
    expect(exists('gift-address-box')).toBe(false);
    expect(exists('gift-image')).toBe(false); // image ''
    expect(button().props.disabled).toBe(false);
  });

  test('GiftDetail.flag1: alert "Alert!" with the (translated) msg, button disabled, coupon_points left as the server sent it', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'flag1');
    installSpy();
    await mount();
    expect(alerts()).toHaveLength(1);
    expect(alerts()[0]).toMatchObject({ title: 'Alert!', subTitle: 'This gift is not available right now', buttons: ['OK'] });
    expect(alerts()[0].cssClass).toBeUndefined();
    expect(button().props.disabled).toBe(true);
    expect(text('gift-points')).toBe('500 Points');
    expect(openLoaders()).toHaveLength(0);
  });

  test('flag 1 without msg: translate.get throws, no alert', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'flag1');
    const previous = getTransport();
    setTransport(async req => {
      const r: any = await previous(req);
      return { ...r, msg: '' };
    });
    restoreTransport = () => setTransport(previous);
    await mount();
    expect(alerts()).toHaveLength(0);
    expect(openLoaders()).toHaveLength(0);
  });

  test('empty (gift: {}, karigar: {}): blank values, NaN points (parseInt of undefined), no button', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'empty');
    installSpy();
    await mount();
    expect(text('gift-balance')).toBe('0');
    expect(text('gift-points')).toBe('NaN Points');
    expect(exists('gift-redeem')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('malformed (gift: null, karigar: null): throws after the loader is dismissed: the initial template stays', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'malformed');
    installSpy();
    await mount();
    expect(text('gift-balance')).toBe('0');
    expect(text('gift-title')).toBe('');
    expect(find('gift-offer-banner')[0].props.source).toEqual({ uri: db.upload_url3 + 'undefined' });
    expect(exists('gift-redeem')).toBe(false);
    expect(exists('gift-address-box')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('NOT FOUND status has no gift key: same as malformed (the page never reads status)', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'NOT FOUND');
    installSpy();
    await mount();
    expect(text('gift-balance')).toBe('0');
    expect(exists('gift-redeem')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('loader (gift-detail.ts:126-131)', () => {
  test('"Please wait..." (dismissOnPageChange false) is up while loading and dismissed by the response', async () => {
    installSpy();
    await act(async () => {
      tree = ReactTestRenderer.create(<GiftDetailScreen navigation={navigation} route={{ params: { id: 21 } } as any} />);
    });
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('Please wait...');
    expect((loaders[0].options as any).dismissOnPageChange).toBe(false);
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });

  test('an HTTP error leaves the loader up (no error callback in Ionic) and the empty template', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
    expect(text('gift-balance')).toBe('0');
  });
});

describe('navigation (card Nav targets)', () => {
  test('Send Redeem Request opens the CancelpolicyModal modal with {karigar_id, gift_id}', async () => {
    installSpy();
    await mount();
    await act(async () => {
      button().props.onPress();
    });
    expect(navigation.push).toHaveBeenCalledWith('CancelpolicyModal', { karigar_id: '900001', gift_id: 21 });
  });

  test('Update Now pushes Registration in edit mode with the karigar_detail object (edit_profile set) and lang ""', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'noAddress');
    installSpy();
    await mount();
    await act(async () => {
      find('gift-update-now')[0].props.onPress();
    });
    expect(navigation.push).toHaveBeenCalledTimes(1);
    const [name, params] = navigation.push.mock.calls[0];
    expect(name).toBe('Registration');
    expect(params.mode).toBe('edit_page');
    expect(params.lang).toBe('');
    expect(params.data).toMatchObject({ address: '', city: 'Sahibabad', edit_profile: 'edit_profile' });
  });

  test('the karigar_detail Registration edits in place is drawn again on return: the box and the disabled state go away', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'noAddress');
    installSpy();
    const all: Record<string, (() => void)[]> = {};
    const nav = {
      push: jest.fn(),
      addListener: (type: string, cb: () => void) => {
        (all[type] ||= []).push(cb);
        return () => {
          all[type] = (all[type] || []).filter(f => f !== cb);
        };
      },
    };
    await mount({ id: 21 }, nav);
    expect(exists('gift-address-box')).toBe(true);
    await act(async () => {
      find('gift-update-now')[0].props.onPress();
    });
    const data = nav.push.mock.calls[0][1].data;
    data.address = '5 New Road';
    data.pincode = '110001';
    await act(async () => {
      (all.blur || []).forEach(f => f());
    });
    await act(async () => {
      (all.focus || []).forEach(f => f());
    });
    expect(exists('gift-address-box')).toBe(false);
    expect(button().props.disabled).toBe(false);
    expect(calls.filter(c => c.fn === 'app_karigar/giftDetail')).toHaveLength(1); // no refetch (ionViewDidLoad only)
  });
});

describe('picture layout', () => {
  test('the phone picture keeps its ratio at 228 high, capped at the box width (img max-width: 100%)', async () => {
    jest.spyOn(Image, 'getSize').mockImplementation(((uri: string, ok: (w: number, h: number) => void) => {
      if (uri.endsWith('gift_21.jpg')) {
        ok(1000, 500);
      }
    }) as any);
    installSpy();
    await mount();
    await act(async () => {
      find('gift-phone-img')[0].props.onLayout({ nativeEvent: { layout: { width: 296, height: 230 } } });
    });
    const style = find('gift-image')[0].props.style;
    expect(style.height).toBe(228);
    expect(style.width).toBe(294); // 456 wanted, box 296 - 2 border
  });
});

describe('ionViewDidLeave (gift-detail.ts:147-173)', () => {
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
    await mount({ id: 21 }, nav);
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
  test('previous page is itself a root page: nothing to pop', async () => {
    const nav = await leave(2, stackState(['Profile', 'Home']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
  test('a pushed page on top (Registration): nothing to pop', async () => {
    const nav = await leave(2, stackState(['Home', 'Registration']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
});
