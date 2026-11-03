// Home screen (Ionic HomePage): contracts, role branches, handlers, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import sessions from '../../api/fixtures/_sessions.json';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { resetMockNative, setMockScan, setMockNativeFailure } from '../../native';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import HomeScreen from './index';

jest.mock('../../native', () => ({ ...jest.requireActual('../../native'), shareText: jest.fn() }));

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
let navHandlers: Record<string, () => void> = {};
const navigation = {
  push: jest.fn(),
  addListener: (e: string, cb: () => void) => {
    navHandlers[e] = cb;
    return () => {};
  },
};
// the navigator's first 'focus' event (useIonViewWillEnter runs ionViewWillEnter on it)
async function fireFocus() {
  await act(async () => {
    navHandlers.focus?.();
  });
}
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

function installSpy() {
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
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
async function mount(role: string | null = 'Plumber', overrides: object = {}) {
  db.userStorageData = role ? { ...(sessions as any)[role], ...overrides } : { type: 'Other' };
  await act(async () => {
    tree = ReactTestRenderer.create(<HomeScreen navigation={navigation as any} />);
  });
  await fireFocus();
  await settle();
}
const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' ? c : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const textOf = (id: string) => {
  const el = find(id)[0];
  const own = el.findAll(n => (n.type as any) === 'Text');
  return own.length ? flat(own[0].props.children) : flat(el.props.children);
};
async function press(id: string) {
  const target = find(id).find(n => typeof n.props.onPress === 'function')!;
  expect(target).toBeDefined();
  await act(async () => {
    target.props.onPress();
  });
  await settle();
}
const overlays = () => overlayStore.getEntries();
const alertOf = () => overlays().find(o => o.kind === 'alert' && !o.leaving)!;
const fnsCalled = () => calls.map(c => c.fn);

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  resetMockNative();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  navHandlers = {};
  calls = [];
  await act(async () => {
    await i18n.changeLanguage('en');
  });
  installSpy();
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contracts (card Endpoints)', () => {
  test.each([
    ['app_karigar/loginBannersApp'],
    ['app_master/product_catalogue_count'],
    ['app_karigar/karigarHome'],
    ['app_karigar/offerList'],
  ])('%s is requested on load, as Ionic does', async endpoint => {
    await expectContract(endpoint, () => mount('Plumber'));
  });

  test('app_karigar/karigarCoupon: {karigar_id, qr_code} after the scan radio OK', async () => {
    setMockScan('QR-1');
    await mount('Plumber');
    await expectContract('app_karigar/karigarCoupon', async () => {
      await press('home-scan');
      await act(async () => {
        alertOf().options.buttons[1].handler('scan');
      });
      await settle();
    });
  });

  test('constructor calls come before ionViewWillEnter calls (home.ts:98-104, :152-163)', async () => {
    await mount('Plumber');
    expect(fnsCalled()).toEqual([
      'app_karigar/loginBannersApp',
      'app_master/product_catalogue_count',
      'app_karigar/karigarHome',
      'app_karigar/offerList',
    ]);
  });
});

describe('states: Plumber (html:131-327)', () => {
  test('default: points, counts, offers, labels', async () => {
    await mount('Plumber');
    const t = allText();
    expect(t).toEqual(expect.arrayContaining(['Today', 'LAST 7 DAYS', 'Wallet Balance', 'POINTS', 'Our Products', 'Service Request', 'Installation Request', 'Installation Videos']));
    expect(t).toEqual(expect.arrayContaining(['New Arrivals', 'Point Transfer', 'Scan or enter QR Code for coupon', 'Start Checkin', 'Customer Care']));
    expect(textOf('home-today')).toContain('10');
    expect(textOf('home-last')).toContain('50');
    expect(textOf('home-wallet')).toContain('1250');
    expect(textOf('home-badge')).toBe('3');
    expect(textOf('home-products-count')).toBe('24');
    expect(textOf('home-service-count')).toBe('3');
    expect(textOf('home-installation-count')).toBe('1');
    expect(find('home-offer-slides').length).toBeGreaterThan(0);
    expect(find('home-banner-slides')).toHaveLength(0);
  });

  test('parity: the POINTS unit is a direct child of the card (variables.scss:3195-3228 .pints span anchors to li)', async () => {
    await mount('Plumber');
    const { StyleSheet } = require('react-native');
    for (const id of ['home-today', 'home-last', 'home-wallet']) {
      const card = find(id).find(n => (n.type as any) === 'View' || typeof n.props.onPress === 'function')!;
      const unit = card.findAll(n => n.props.testID === `${id}-unit` && (n.type as any) === 'View')[0];
      expect(unit).toBeDefined();
      const valueText = card.findAll(n => (n.type as any) === 'Text')[0];
      let pints: any = valueText.parent;
      while (pints && (pints.type as any) !== 'View') pints = pints.parent;
      expect(pints.findAll((n: any) => n === unit)).toHaveLength(0);
      const st = StyleSheet.flatten(unit.props.style);
      expect(st).toMatchObject({ position: 'absolute', right: -16, bottom: 35 });
    }
  });

  test('no offers: the login banners in a pager+autoplay slider', async () => {
    setFixtureVariant('app_karigar/offerList', 'empty');
    await mount('Plumber');
    expect(find('home-offer-slides')).toHaveLength(0);
    expect(find('home-banner-slides').length).toBeGreaterThan(0);
  });

  test('no offers and no banners: still a slider, holding the bundled banner', async () => {
    setFixtureVariant('app_karigar/offerList', 'empty');
    setFixtureVariant('app_karigar/loginBannersApp', 'empty');
    await mount('Plumber');
    expect(find('home-banner-slides').length).toBeGreaterThan(0);
  });

  test('empty answers: a zero product count shows 0, the other counts stay blank', async () => {
    setFixtureVariant('app_master/product_catalogue_count', 'empty');
    setFixtureVariant('app_karigar/karigarHome', 'empty');
    await mount('Plumber');
    expect(textOf('home-products-count')).toBe('0');
    expect(textOf('home-service-count')).toBe('0');
  });

  test('hin: translated labels', async () => {
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount('Plumber');
    expect(allText()).toContain('आज');
    expect(allText()).toContain('प्वाइंट ट्रांसफर');
  });
});

describe('states: Sales_Boy / Dealer (html:330-514)', () => {
  test.each([['Sales_Boy'], ['Dealer']])('%s: three boxes and eight buttons', async role => {
    await mount(role);
    const t = allText();
    expect(t).toEqual(expect.arrayContaining(['Our Products', 'Service Request', 'Add Quotation', 'Add Plumber', 'Add Customer', 'Add Service Request', 'Point Transfer', 'Customer Care']));
    expect(t.filter(x => x === 'Add Quotation')).toHaveLength(2); // box + button
    expect(t).not.toContain('Installation Request');
    expect(textOf('home-service-count')).toBe('2'); // `complaint`, not `plumber`
    expect(find('home-scan-icon')).not.toHaveLength(0);
  });
});

describe('states: Customer (html:3-129)', () => {
  test('default: share only, login banners, counts, five buttons', async () => {
    await mount('Customer');
    expect(find('home-notifications')).toHaveLength(0);
    expect(find('home-scan-icon')).toHaveLength(0);
    expect(find('home-banner-slides').length).toBeGreaterThan(0);
    expect(textOf('home-products-count')).toBe('24');
    expect(textOf('home-service-count')).toBe('2');
    expect(textOf('home-installation-count')).toBe('1');
    expect(allText()).toEqual(expect.arrayContaining(['Product Catalogue', 'Add Service Request', 'Add Installation Request', 'New Arrivals', 'Videos', 'Customer Care']));
  });
  test('no login banners: the bundled banner image, no slider', async () => {
    setFixtureVariant('app_karigar/loginBannersApp', 'empty');
    await mount('Customer');
    expect(find('home-banner-slides')).toHaveLength(0);
    expect(find('home-banner-static').length).toBeGreaterThan(0);
  });
});

describe('states: Retailer and other types (no template block)', () => {
  test('Retailer: an empty page, but all four requests still run and the loader closes', async () => {
    await mount('Retailer');
    expect(find('home-empty').length).toBeGreaterThan(0);
    expect(allText()).toEqual([]);
    expect(fnsCalled()).toEqual([
      'app_karigar/loginBannersApp',
      'app_master/product_catalogue_count',
      'app_karigar/karigarHome',
      'app_karigar/offerList',
    ]);
    expect(overlays().filter(o => o.kind === 'loading' && !o.leaving)).toHaveLength(0);
  });
});

describe('malformed answers (Review Focus 2)', () => {
  test('every endpoint malformed: renders, no throw, loader closes', async () => {
    for (const e of ['app_karigar/karigarHome', 'app_master/product_catalogue_count', 'app_karigar/offerList', 'app_karigar/loginBannersApp']) {
      setFixtureVariant(e, 'malformed');
    }
    for (const role of ['Plumber', 'Sales_Boy', 'Customer', 'Retailer']) {
      await mount(role);
      expect(overlays().filter(o => o.kind === 'loading' && !o.leaving)).toHaveLength(0);
      act(() => tree.unmount());
    }
  });

  test('karigarHome malformed: handlers that read karigar_detail do nothing instead of crashing (Ionic: console TypeError)', async () => {
    setFixtureVariant('app_karigar/karigarHome', 'malformed');
    await mount('Plumber');
    await press('home-scan');
    await press('home-share');
    expect(overlays().filter(o => o.kind === 'alert')).toHaveLength(0);
    expect(navigation.push).not.toHaveBeenCalled();
  });

  test('HTTP error on karigarHome closes the loader', async () => {
    setFixtureVariant('app_karigar/karigarHome', 'error');
    await mount('Plumber');
    expect(overlays().filter(o => o.kind === 'loading' && !o.leaving)).toHaveLength(0);
  });
});

describe('loader', () => {
  test('karigarHome shows "Please wait..." (dismissOnPageChange) while pending', async () => {
    db.userStorageData = { ...(sessions as any).Plumber };
    await act(async () => {
      tree = ReactTestRenderer.create(<HomeScreen navigation={navigation as any} />);
    });
    await fireFocus();
    const l = overlays().find(o => o.kind === 'loading')!;
    expect(l.options).toMatchObject({ content: 'Please wait...', dismissOnPageChange: true });
  });
});

describe('navigation (card Nav targets)', () => {
  test('Plumber: every control', async () => {
    await mount('Plumber');
    const go = async (id: string, ...expected: any[]) => {
      navigation.push.mockClear();
      await press(id);
      expect(navigation.push).toHaveBeenCalledWith(...expected);
    };
    await go('home-today', 'PointList');
    await go('home-last', 'PointList');
    await go('home-wallet', 'PointList');
    await go('home-box-products', 'Category', { mode: 'home' });
    await go('home-box-service', 'MyCamplaints', { type: 'Service' });
    await go('home-box-installation', 'MyCamplaints', { type: 'Installation' });
    await go('home-videos-card', 'Video', { cat: 'Product Installation' });
    await go('home-new-arrivals', 'Newarrivals');
    await go('home-point-transfer', 'Pointtranfer', { totalPoint: 1250 });
    await go('home-checkin', 'PlumberCheckin');
    await go('home-notifications', 'Notification');
  });

  test('Sales_Boy: every control', async () => {
    await mount('Sales_Boy');
    const go = async (id: string, ...expected: any[]) => {
      navigation.push.mockClear();
      await press(id);
      expect(navigation.push).toHaveBeenCalledWith(...expected);
    };
    await go('home-box-service', 'ComplaintHistory', { mode: 'home', type: 'Service' });
    await go('home-box-quotation', 'QuotationGenrateByPdf', { mode: 'home' });
    await go('home-add-quotation', 'QuotationGenrateByPdf', { mode: 'home' });
    await go('home-add-plumber', 'PlumberList', { mode: 'home' });
    await go('home-point-transfer', 'SalesPointTransfer', { totalPoint: 1250 });
    await go('home-add-customer', 'Customerlist', { mode: 'home' });
    await go('home-add-service', 'AddNewComplaint', { mode: 'home', type: 'Service' });
    await go('home-new-arrivals', 'Newarrivals');
  });

  test('Customer: every control', async () => {
    await mount('Customer');
    const go = async (id: string, ...expected: any[]) => {
      navigation.push.mockClear();
      await press(id);
      expect(navigation.push).toHaveBeenCalledWith(...expected);
    };
    await go('home-box-products', 'Category', { mode: 'home' });
    await go('home-box-service', 'ComplaintHistory', { mode: 'home', type: 'Service' });
    await go('home-box-installation', 'ComplaintHistory', { mode: 'home', type: 'Installation' });
    await go('home-add-service', 'AddNewComplaint', { mode: 'home', type: 'Service' });
    await go('home-add-installation', 'AddNewComplaint', { mode: 'home', type: 'Installation' });
    await go('home-videos', 'VideoCategory');
  });

  test('offer slide tap pushes Offers with the offer id (html:175)', async () => {
    await mount('Plumber');
    await act(async () => {
      find('home-offer-slides').find(n => typeof n.props.onLayout === 'function')!.props.onLayout({ nativeEvent: { layout: { width: 360 } } });
    });
    const slideTaps = find('home-offer-slides-scroll')[0].findAll(n => typeof n.props.onPress === 'function' && (n.type as any) !== 'View');
    expect(slideTaps.length).toBeGreaterThan(0);
    await act(async () => {
      slideTaps[0].props.onPress();
    });
    expect(navigation.push).toHaveBeenCalledWith('Offers', { id: 11 });
  });

  test('header QR icon: Plumber opens the scan/code alert, Sales_Boy the ScanPoint alert', async () => {
    await mount('Plumber');
    await press('home-scan-icon');
    expect(alertOf().options.inputs).toHaveLength(2);
    act(() => tree.unmount());
    _resetOverlaysForTests();
    await mount('Sales_Boy');
    await press('home-scan-icon');
    alertOf().options.buttons[1].handler('scan');
    expect(navigation.push).toHaveBeenCalledWith('ScanPoint', { mode: 'home', type: 'scan' });
    alertOf().options.buttons[1].handler('code');
    expect(navigation.push).toHaveBeenCalledWith('ScanPoint', { mode: 'home', type: 'enter_coupon' });
  });
});

describe('handlers and alerts', () => {
  test('unverified: scan, Add Plumber, service request and the QR alert all say "You are account  not verified"', async () => {
    setFixtureVariant('app_karigar/karigarHome', 'unverified');
    await mount('Plumber');
    await press('home-scan');
    expect(alertOf().options).toMatchObject({ title: 'Alert!', cssClass: 'action-close', subTitle: 'You are account  not verified', buttons: ['OK'] });
    _resetOverlaysForTests();
    await mount('Sales_Boy');
    await press('home-add-plumber');
    expect(alertOf().options.subTitle).toBe('You are account  not verified');
    _resetOverlaysForTests();
    await press('home-add-service');
    expect(alertOf().options.subTitle).toBe('You are account  not verified');
    expect(navigation.push).not.toHaveBeenCalled();
  });

  test('Start Checkin only blocks a Pending karigar; a missing status passes', async () => {
    setFixtureVariant('app_karigar/karigarHome', 'unverified');
    await mount('Plumber');
    await press('home-checkin');
    expect(alertOf().options.subTitle).toBe('You are account  not verified');
    expect(navigation.push).not.toHaveBeenCalled();
    _resetOverlaysForTests();
    setFixtureVariant('app_karigar/karigarHome', 'empty');
    await mount('Plumber');
    await press('home-checkin');
    expect(navigation.push).toHaveBeenCalledWith('PlumberCheckin');
  });

  test('request already added: both alerts, no navigation', async () => {
    setFixtureVariant('app_master/product_catalogue_count', 'requestsExist');
    await mount('Customer');
    await press('home-add-service');
    expect(alertOf().options.subTitle).toBe('You have already add service request');
    _resetOverlaysForTests();
    await press('home-add-installation');
    expect(alertOf().options.subTitle).toBe('You have already add installation request');
    expect(navigation.push).not.toHaveBeenCalled();
  });

  test('scan/code alert: radios, Cancel and OK texts; "code" pushes CoupanCode with {mode:"home"}', async () => {
    await mount('Plumber');
    await press('home-scan');
    const a = alertOf();
    expect(a.options.title).toBeUndefined();
    expect(a.options.inputs).toEqual([
      { type: 'radio', label: 'Coupon Scan', value: 'scan', checked: true },
      { type: 'radio', label: 'Enter Coupon Code', value: 'code' },
    ]);
    expect(a.options.buttons[0]).toBe('Cancel');
    expect(a.options.buttons[1].text).toBe('OK');
    a.options.buttons[1].handler('code');
    expect(navigation.push).toHaveBeenCalledWith('CoupanCode', { mode: 'home' });
  });

  test('manual_permission 1: "scan" opens CoupanCode (no params) instead of the scanner', async () => {
    setFixtureVariant('app_karigar/karigarHome', 'manual');
    await mount('Plumber');
    await press('home-scan');
    alertOf().options.buttons[1].handler('scan');
    expect(navigation.push).toHaveBeenCalledWith('CoupanCode');
    expect(fnsCalled()).not.toContain('app_karigar/karigarCoupon');
  });

  describe('karigarCoupon answers', () => {
    async function scanWith(variant: string | null) {
      if (variant) {
        setFixtureVariant('app_karigar/karigarCoupon', variant);
      }
      setMockScan('QR-1');
      await mount('Plumber');
      await press('home-scan');
      await act(async () => {
        alertOf().options.buttons[1].handler('scan');
      });
      await settle();
    }
    const lastAlert = () => overlays().filter(o => o.kind === 'alert').pop()!;

    test('INVALID', async () => {
      await scanWith('INVALID');
      expect(lastAlert().options).toMatchObject({ title: 'Alert!', subTitle: 'Invalid Coupon Code' });
    });
    test('USED: name, mobile and D-M-Y date', async () => {
      await scanWith('USED');
      expect(lastAlert().options.subTitle).toBe('Coupon Already Used By Ramesh ( 9812345670 ) on 15-10-2026');
    });
    test('POINTS NOT EXIST / UNASSIGNED OFFER', async () => {
      await scanWith('POINTS NOT EXIST');
      expect(lastAlert().options.subTitle).toBe('No Points Exit This Product');
      act(() => tree.unmount());
      _resetOverlaysForTests();
      await scanWith('UNASSIGNED OFFER');
      expect(lastAlert().options.subTitle).toBe('This Coupon Code is not applicable in your Area');
    });
    test('success: "Success!" alert and karigarHome is read again (loader)', async () => {
      await scanWith(null);
      expect(lastAlert().options).toMatchObject({ title: 'Success!', cssClass: 'action-close', subTitle: '50 points has been added into your wallet' });
      expect(fnsCalled().filter(f => f === 'app_karigar/karigarHome')).toHaveLength(2);
    });
    test('malformed coupon answer (SUCCESS without coupon_value): success alert with "undefined"', async () => {
      await scanWith('malformed');
      expect(lastAlert().options.title).toBe('Success!');
      expect(lastAlert().options.subTitle).toBe('undefined points has been added into your wallet');
    });
    test('USED without karigar_data: no alert (Ionic throws inside the subscribe callback)', async () => {
      const prev = getTransport();
      setTransport(req => (req.fn === 'app_karigar/karigarCoupon' ? Promise.resolve({ status: 'USED', scan_date: '2026-10-15 11:20:00' }) : prev(req)));
      setMockScan('QR-1');
      await mount('Plumber');
      await press('home-scan');
      await act(async () => {
        alertOf().options.buttons[1].handler('scan');
      });
      await settle();
      expect(overlays().filter(o => o.kind === 'alert' && !o.leaving)).toHaveLength(1); // only the radio alert
    });
    test('scanner cancelled / denied: no request', async () => {
      setMockScan('');
      await mount('Plumber');
      await press('home-scan');
      await act(async () => {
        alertOf().options.buttons[1].handler('scan');
      });
      await settle();
      setMockNativeFailure('scanner', 'denied');
      await act(async () => {
        alertOf().options.buttons[1].handler('scan');
      });
      await settle();
      expect(fnsCalled()).not.toContain('app_karigar/karigarCoupon');
    });
  });
});

describe('quirks', () => {
  test('doRefresh requests product_catalogue_count twice, then karigarHome and offerList (home.ts:906-920)', async () => {
    await mount('Plumber');
    calls = [];
    // the refresher registered with IonContent: invoke its onRefresh prop
    const refresher = tree.root.findAll(n => typeof n.props.onRefresh === 'function')[0];
    const complete = jest.fn();
    await act(async () => {
      refresher.props.onRefresh({ complete });
    });
    await settle();
    expect(fnsCalled().sort()).toEqual(
      ['app_karigar/karigarHome', 'app_karigar/offerList', 'app_master/product_catalogue_count', 'app_master/product_catalogue_count'].sort(),
    );
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(complete).toHaveBeenCalled();
  });

  test('ionViewWillEnter again on a later focus (navigation focus event after a blur)', async () => {
    await mount('Plumber');
    expect(fnsCalled().filter(f => f === 'app_karigar/karigarHome')).toHaveLength(1);
    await act(async () => {
      navHandlers.blur();
    });
    await fireFocus();
    await settle();
    expect(fnsCalled().filter(f => f === 'app_karigar/karigarHome')).toHaveLength(2);
    expect(fnsCalled().filter(f => f === 'app_karigar/offerList')).toHaveLength(2);
    expect(fnsCalled().filter(f => f === 'app_karigar/loginBannersApp')).toHaveLength(1); // constructor only
  });

  test('null karigarHome body keeps karigar_detail {}: handlers say "not verified" (home.ts:210 throws before assigning)', async () => {
    const prev = getTransport();
    setTransport(req => (req.fn === 'app_karigar/karigarHome' ? Promise.resolve(null) : prev(req)));
    await mount('Plumber');
    await press('home-scan');
    expect(alertOf().options.subTitle).toBe('You are account  not verified');
  });

  test('ShareApp: text with the app name, store id and referral code', async () => {
    const share = require('../../native').shareText as jest.Mock;
    share.mockClear();
    const { client } = require('../../config/client');
    await mount('Plumber');
    await press('home-share');
    expect(share).toHaveBeenCalledWith(
      'Hey There ! here is an awesome app from ' + client.appName + '  ..Give it a try https://play.google.com/store/apps/details?id=' + client.playStoreId +
        ' and use my Code *TST001* to get points back in your wallet',
    );
  });

  test('Customer: New Arrivals, Customer Care tel: link', async () => {
    const open = jest.spyOn(require('react-native').Linking, 'openURL').mockResolvedValue(true);
    const { client } = require('../../config/client');
    await mount('Customer');
    await press('home-new-arrivals');
    expect(navigation.push).toHaveBeenCalledWith('Newarrivals');
    await press('home-customer-care');
    expect(open).toHaveBeenCalledWith('tel:' + client.contact.phone);
    open.mockRestore();
  });

  test('Sales_Boy: Our Products box opens Category', async () => {
    await mount('Sales_Boy');
    await press('home-box-products');
    expect(navigation.push).toHaveBeenCalledWith('Category', { mode: 'home' });
  });
});
