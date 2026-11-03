// ShippingDetail screen (Ionic ShippingDetailPage): contracts, status branches, receive confirmation, error paths and quirks. See card.md.
import React from 'react';
import { Image } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { navigationRef } from '../../navigation/navigationRef';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import ShippingDetailScreen from './index';

jest.setTimeout(30000);
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

async function settle(ms = 350, rounds = 4) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
  }
}

async function mount(params: any = { id: 501 }) {
  await act(async () => {
    tree = ReactTestRenderer.create(<ShippingDetailScreen navigation={navigation as any} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const textOf = (id: string) => flat(find(id).find(n => (n.type as any) === 'Text')!.props.children);
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options as any);
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const press = (id: string) => find(id).find(n => typeof n.props.onPress === 'function')!.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
const bodyOf = (fn: string) => JSON.parse(calls.find(c => c.fn === fn)!.body!);

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  calls = [];
  db.userStorageData = { id: '900001', type: 'Plumber' };
});
afterEach(() => {
  restoreTransport();
  restoreTransport = () => {};
  act(() => tree?.unmount());
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('contracts (card Endpoints)', () => {
  test('app_karigar/shippedDetail: {karigar_gift_id} on entry', async () => {
    installSpy();
    await expectContract('app_karigar/shippedDetail', () => mount());
    expect(bodyOf('app_karigar/shippedDetail')).toEqual({ karigar_gift_id: 501 });
  });

  test('app_karigar/giftDetail: {gift_id, karigar_id} (gift_id is navParams offer_gift_id)', async () => {
    installSpy();
    await expectContract('app_karigar/giftDetail', () => mount({ id: 501, offer_gift_id: 21 }));
    expect(bodyOf('app_karigar/giftDetail')).toEqual({ gift_id: 21, karigar_id: '900001' });
  });

  test('Transaction pushes only {id}: giftDetail goes out without gift_id (JSON drops undefined)', async () => {
    installSpy();
    await mount({ id: 501 });
    expect(bodyOf('app_karigar/giftDetail')).toEqual({ karigar_id: '900001' });
  });

  test('app_karigar/redeemReceiveStatus: {id, karigar_id} when the alert says Yes (id = karigar_gift.id)', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'redeemShipped');
    installSpy();
    await mount();
    await expectContract('app_karigar/redeemReceiveStatus', async () => {
      await act(async () => press('shipping-receive'));
      await act(async () => {
        alerts()[0].buttons[1].handler();
      });
      await settle();
    });
    expect(bodyOf('app_karigar/redeemReceiveStatus')).toEqual({ id: 501, karigar_id: '900001' });
  });
});

describe('states (card States)', () => {
  test('redeemShipped + shipped detail: every text, both cards, the Receive button', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'redeemShipped');
    installSpy();
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining([
        'Redeem Detail', // two spaces in the template collapse
        'Points',
        'Gift Status',
        'Specification',
        'Bank Detail',
        'Bank Name',
        'Account Holder',
        'Account NO.',
        'IFSC Code',
        'Shipping Detail',
        'Shipped Type',
        'Estimate Delivery Date',
        'Shipping Information',
        'Click Here if you Recieve',
      ]),
    );
    expect(textOf('shipping-title')).toBe('diwali dhamaka offer');
    expect(textOf('shipping-gift-title')).toBe('steel water bottle');
    expect(flat(find('shipping-points')[0].props.children)).toBe('Points 500'); // parseInt("500")
    expect(flat(find('shipping-status')[0].props.children)).toBe('Gift Status Shipped');
    expect(flat(find('shipping-spec')[0].props.children)).toBe('Specification steel water bottle');
    expect(textOf('shipping-bank-name')).toBe('State Bank Of India');
    expect(textOf('shipping-holder')).toBe('Test Plumber');
    expect(textOf('shipping-account')).toBe('123456789012');
    expect(textOf('shipping-ifsc')).toBe('SBIN0001234');
    expect(textOf('shipping-ship-type')).toBe('Courier');
    expect(textOf('shipping-ship-date')).toBe('2026-11-10'); // no date pipe
    expect(textOf('shipping-ship-info')).toBe('Delivered by Blue Dart, tracking no. BD123456789');
    expect(exists('shipping-receive')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
  });

  test('redeemReceived: no Receive button', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'redeemReceived');
    installSpy();
    await mount();
    expect(flat(find('shipping-status')[0].props.children)).toBe('Gift Status Received');
    expect(exists('shipping-receive')).toBe(false);
  });

  test('redeemApproved (receive_status ""): button shown, empty status', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'redeemApproved');
    installSpy();
    await mount();
    expect(exists('shipping-receive')).toBe(true);
    expect(exists('shipping-ship-card')).toBe(true);
  });

  test('shipped: {} -> no Shipping Detail card', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'redeemApproved');
    setFixtureVariant('app_karigar/shippedDetail', 'empty');
    installSpy();
    await mount();
    expect(exists('shipping-ship-card')).toBe(false);
    expect(allText()).not.toContain('Shipping Detail');
  });

  test('shipped: null keeps the empty object (no card)', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'redeemApproved');
    setFixtureVariant('app_karigar/shippedDetail', 'malformed');
    installSpy();
    await mount();
    expect(exists('shipping-ship-card')).toBe(false);
  });

  test('giftDetail default (no karigar_gift key): change detection throws at the button *ngIf; the first-run template stays (Receive button, empty texts)', async () => {
    installSpy();
    await mount();
    expect(textOf('shipping-title')).toBe('');
    expect(textOf('shipping-bank-name')).toBe('');
    expect(exists('shipping-receive')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
    // the Shipping Detail card's *ngIf comes before the one that throws, so the card exists, with empty cells
    expect(exists('shipping-ship-card')).toBe(true);
    expect(textOf('shipping-ship-type')).toBe('');
    // clicking Receive reads karigar_gift.id of undefined: nothing happens
    await act(async () => press('shipping-receive'));
    expect(alerts()).toHaveLength(0);
  });

  test('karigar_gift null: same, texts stay empty', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'noKarigarGift');
    installSpy();
    await mount();
    expect(textOf('shipping-title')).toBe('');
    expect(exists('shipping-receive')).toBe(true);
  });

  test('empty gift {} and karigar_gift missing: coupon_points is NaN but nothing is drawn (throws before)', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'empty');
    installSpy();
    await mount();
    expect(openLoaders()).toHaveLength(0);
    expect(textOf('shipping-title')).toBe('');
  });

  test('malformed giftDetail (gift: null): loader closed, template untouched', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'malformed');
    installSpy();
    await mount();
    expect(openLoaders()).toHaveLength(0);
    expect(textOf('shipping-title')).toBe('');
  });

  test('image: the src is used as it is, a bare file name fails to load -> broken-image box', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'redeemShipped');
    const getSize = jest.spyOn(Image, 'getSize').mockImplementation(((_u: string, _ok: any, fail: any) => fail(new Error('x'))) as any);
    installSpy();
    await mount();
    expect(getSize.mock.calls.map(c => c[0])).toEqual(expect.arrayContaining(['undefined', 'gift_21.jpg']));
    expect(exists('shipping-image-broken')).toBe(true);
  });

  test('image: a loadable picture is drawn at its natural size, capped at the box width', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'redeemShipped');
    jest.spyOn(Image, 'getSize').mockImplementation(((_u: string, ok: any) => ok(600, 300)) as any);
    installSpy();
    await mount();
    await act(async () => {
      find('shipping-img-box')[0].props.onLayout({ nativeEvent: { layout: { width: 300 } } });
    });
    const style = [find('shipping-image')[0].props.style].flat(5).reduce((a: any, s: any) => ({ ...a, ...s }), {});
    expect(style.width).toBe(288);
    expect(style.height).toBe(144);
  });
});

describe('receive confirmation (shipping-detail.ts:75-116)', () => {
  test('alert texts, No does nothing', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'redeemShipped');
    installSpy();
    await mount();
    await act(async () => press('shipping-receive'));
    const [a] = alerts();
    expect(a.title).toBe('Confirmation!');
    expect(a.subTitle).toBe('Did you receive this gift?');
    expect(a.cssClass).toBe('action-close');
    expect(a.buttons.map((b: any) => b.text)).toEqual(['No', 'Yes']);
    expect(a.buttons[0].role).toBe('cancel');
    expect(a.buttons[1].cssClass).toBe('close-action-sheet');
    await act(async () => a.buttons[0].handler());
    expect(calls.filter(c => c.fn === 'app_karigar/redeemReceiveStatus')).toHaveLength(0);
  });

  test('Yes: Success! alert, then setRoot(Tabs, {index: "3"})', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'redeemShipped');
    installSpy();
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(true);
    const reset = jest.spyOn(navigationRef, 'resetRoot').mockImplementation(() => {});
    await mount();
    await act(async () => press('shipping-receive'));
    await act(async () => alerts()[0].buttons[1].handler());
    await settle();
    const success = alerts().find(a => a.title === 'Success!');
    expect(success.subTitle).toBe('You have receive gift successfully');
    expect(success.cssClass).toBe('action-close');
    expect(success.buttons).toEqual(['OK']);
    expect(reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Tabs', params: { index: '3' } }] });
  });

  test('Yes with a null response still shows Success! (the response is not looked at)', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'redeemShipped');
    setFixtureVariant('app_karigar/redeemReceiveStatus', 'malformed');
    installSpy();
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(false);
    await mount();
    await act(async () => press('shipping-receive'));
    await act(async () => alerts()[0].buttons[1].handler());
    await settle();
    expect(alerts().some(a => a.title === 'Success!')).toBe(true);
  });

  test('HTTP error on the receive call: nothing happens (no alert)', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'redeemShipped');
    installSpy();
    await mount();
    await act(async () => press('shipping-receive'));
    restoreTransport();
    installSpy(true);
    await act(async () => alerts()[0].buttons[1].handler());
    await settle();
    expect(alerts().some(a => a.title === 'Success!')).toBe(false);
  });
});

describe('loader (shipping-detail.ts:47-54, :61)', () => {
  test('"Please wait..." is up from the first render and dismissed by the giftDetail response', async () => {
    installSpy();
    await act(async () => {
      tree = ReactTestRenderer.create(<ShippingDetailScreen navigation={navigation as any} route={{ params: { id: 501 } } as any} />);
    });
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('Please wait...');
    expect((loaders[0].options as any).dismissOnPageChange).toBe(true);
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });

  test('HTTP error: the loader stays up, the empty template shows', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
    expect(textOf('shipping-title')).toBe('');
    expect(exists('shipping-receive')).toBe(true);
    expect(exists('shipping-ship-card')).toBe(false);
  });
});

describe('quirks', () => {
  test('no i18n: the page has no `| translate`', async () => {
    setFixtureVariant('app_karigar/giftDetail', 'redeemShipped');
    installSpy();
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Bank Detail', 'Shipping Detail']));
  });
});
