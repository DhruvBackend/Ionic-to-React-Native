// PointHistory screen (Ionic PointHistoryPage): contracts, the four modes (scan, service, referal, redeem), roles, paging and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import PointHistoryScreen from './index';

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

async function mount(params: any) {
  await act(async () => {
    tree = ReactTestRenderer.create(<PointHistoryScreen navigation={navigation as any} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const textOf = (id: string) => flat(find(id)[0].props.children);
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const refresher = () => tree.root.findAll(n => typeof n.props.onRefresh === 'function')[0];
const infinite = () => tree.root.findAll(n => typeof n.props.onInfinite === 'function');
const callsTo = (fn: string) => calls.filter(c => c.fn === fn);
const body = (c: ApiRequest) => JSON.parse(c.body!);
const scrollMore = async (complete = jest.fn()) => {
  await act(async () => {
    infinite()[0].props.onInfinite({ complete });
  });
  await settle(400, 5);
  return complete;
};

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  await i18n.changeLanguage('en');
  calls = [];
  db.userStorageData = { id: '900001', type: 'Plumber' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contracts (card Endpoints)', () => {
  test('couponHistory on entry and from the infinite scroll', async () => {
    installSpy();
    setFixtureVariant('app_karigar/couponHistory', 'history');
    await expectContract('app_karigar/couponHistory', () => mount({ scan: 'scan' }));
    expect(body(callsTo('app_karigar/couponHistory')[0])).toEqual({ filter: { limit: 0 }, karigar_id: '900001' });
    await expectContract('app_karigar/couponHistory', async () => {
      await scrollMore();
    });
    expect(body(callsTo('app_karigar/couponHistory')[1])).toEqual({ filter: { limit: 3 }, karigar_id: '900001' });
  });

  test('getPlumberComplaintList on entry and from the infinite scroll', async () => {
    installSpy();
    setFixtureVariant('app_karigar/getPlumberComplaintList', 'history');
    await expectContract('app_karigar/getPlumberComplaintList', () => mount({ service: 'service' }));
    expect(body(callsTo('app_karigar/getPlumberComplaintList')[0])).toEqual({ plumber_id: '900001', filter: { limit: 0 } });
    await expectContract('app_karigar/getPlumberComplaintList', async () => {
      await scrollMore();
    });
    expect(body(callsTo('app_karigar/getPlumberComplaintList')[1])).toEqual({ filter: { limit: 3 }, plumber_id: '900001' });
  });

  test('referal_logs on entry and from the infinite scroll', async () => {
    installSpy();
    setFixtureVariant('app_karigar/referal_logs', 'history');
    await expectContract('app_karigar/referal_logs', () => mount({ referal: 'referal' }));
    expect(body(callsTo('app_karigar/referal_logs')[0])).toEqual({ karigar_id: '900001', filter: { limit: 0 } });
    await expectContract('app_karigar/referal_logs', async () => {
      await scrollMore();
    });
    expect(body(callsTo('app_karigar/referal_logs')[1])).toEqual({ filter: { limit: 2 }, karigar_id: '900001' });
  });

  test('transaction on entry and from the infinite scroll', async () => {
    installSpy();
    setFixtureVariant('app_karigar/transaction', 'redeem');
    await expectContract('app_karigar/transaction', () => mount({ redeem: 'redeem' }));
    expect(body(callsTo('app_karigar/transaction')[0])).toEqual({ karigar_id: '900001', filter: { limit: 0 } });
    await expectContract('app_karigar/transaction', async () => {
      await scrollMore();
    });
    expect(body(callsTo('app_karigar/transaction')[1])).toEqual({ filter: { limit: 6 }, karigar_id: '900001' });
  });
});

describe('scan', () => {
  beforeEach(() => setFixtureVariant('app_karigar/couponHistory', 'history'));

  test('Plumber: title, rows with seller line and coupon_value, loader closed', async () => {
    installSpy();
    await mount({ scan: 'scan' });
    expect(allText()).toContain('Earn By Scan History');
    expect(textOf('scan-code-0')).toBe('Coupon Code: TB-A1B2C3');
    expect(textOf('scan-group-0')).toBe('Product Point Group: Taps');
    expect(textOf('scan-seller-0')).toBe('Seller : Rakesh Shinde (9000000041)');
    expect(textOf('scan-date-0')).toBe('28-Oct-2026, 11:42 AM');
    expect(textOf('scan-points-0')).toBe('50Points');
    // row 1 has sales_boy_name '' -> no seller line; the Plumber never sees the Plumber Detail line
    expect(exists('scan-seller-1')).toBe(false);
    expect(exists('scan-plumber-0')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
    expect(exists('scan-empty')).toBe(false);
  });

  test('Dealer: Plumber Detail line and sales_boy_coupon_value', async () => {
    db.userStorageData = { id: '900003', type: 'Dealer' };
    installSpy();
    await mount({ scan: 'scan' });
    expect(textOf('scan-plumber-0')).toBe('Plumber Detail: Ramesh Patil (9000000011)');
    expect(exists('scan-plumber-1')).toBe(false);
    expect(exists('scan-seller-0')).toBe(false);
    expect(textOf('scan-points-0')).toBe('20Points');
  });

  test('Sales_Executive: neither branch, no points and no detail line', async () => {
    db.userStorageData = { id: '900004', type: 'Sales_Executive' };
    installSpy();
    await mount({ scan: 'scan' });
    expect(exists('scan-row-0')).toBe(true);
    expect(exists('scan-points-0')).toBe(false);
    expect(exists('scan-seller-0')).toBe(false);
    expect(exists('scan-plumber-0')).toBe(false);
  });

  test('empty answer: no-data picture, loader stays up (quirk)', async () => {
    setFixtureVariant('app_karigar/couponHistory', 'empty');
    installSpy();
    await mount({ scan: 'scan' });
    expect(exists('scan-empty')).toBe(true);
    expect(openLoaders()).toHaveLength(1);
  });

  test('malformed (coupon: null): nothing shown, loader stays up, no crash', async () => {
    setFixtureVariant('app_karigar/couponHistory', 'malformed');
    installSpy();
    await mount({ scan: 'scan' });
    expect(exists('scan-empty')).toBe(false);
    expect(exists('scan-row-0')).toBe(false);
    expect(openLoaders()).toHaveLength(1);
  });

  test('infinite scroll appends after 1 s; an empty page removes the scroll for good', async () => {
    installSpy();
    await mount({ scan: 'scan' });
    const complete = await scrollMore();
    expect(complete).toHaveBeenCalledTimes(1);
    expect(find('scan-row-5').length).toBeGreaterThan(0);
    expect(infinite()).toHaveLength(1);
    setFixtureVariant('app_karigar/couponHistory', 'empty');
    const complete2 = await scrollMore();
    expect(complete2).not.toHaveBeenCalled();
    expect(infinite()).toHaveLength(0);
  });

  test('refresh calls the endpoint again with limit 0 and completes at once', async () => {
    installSpy();
    await mount({ scan: 'scan' });
    const complete = jest.fn();
    await act(async () => refresher().props.onRefresh({ complete }));
    expect(complete).toHaveBeenCalledTimes(1);
    await settle();
    expect(callsTo('app_karigar/couponHistory')).toHaveLength(2);
    expect(body(callsTo('app_karigar/couponHistory')[1]).filter).toEqual({ limit: 0 });
  });

  test('HTTP error: the loader stays up (no error callback in Ionic)', async () => {
    installSpy(true);
    await mount({ scan: 'scan' });
    expect(openLoaders()).toHaveLength(1);
  });

  test('hin: title and labels come from hin.json', async () => {
    await i18n.changeLanguage('hin');
    installSpy();
    await mount({ scan: 'scan' });
    expect(allText()).toContain(i18n.t('Earn By Scan History').replace(/\s+/g, ' '));
    expect(textOf('scan-code-0')).toBe(`${i18n.t('Coupon Code').replace(/\s+/g, ' ')}: TB-A1B2C3`);
  });
});

describe('service', () => {
  beforeEach(() => setFixtureVariant('app_karigar/getPlumberComplaintList', 'history'));

  test('title, rows, empty div for a zero payment, no date for 0000-00-00', async () => {
    installSpy();
    await mount({ service: 'service' });
    expect(allText()).toContain('Earn By Service History');
    expect(textOf('service-type-0')).toBe('Complaint Type:  installation');
    expect(textOf('service-customer-0')).toBe('Sunita Deshmukh-9000000051');
    expect(textOf('service-date-0')).toBe('Date 12-Oct-2026');
    expect(textOf('service-points-0')).toBe('100Points');
    // row 1: plumber_payment 0 -> falsy -> empty div
    expect(exists('service-row-1')).toBe(true);
    expect(exists('service-type-1')).toBe(false);
    // row 2: date '0000-00-00 00:00:00' -> empty date
    expect(textOf('service-date-2')).toBe('Date ');
    expect(exists('service-empty')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('the no-data picture shows for an empty list', async () => {
    setFixtureVariant('app_karigar/getPlumberComplaintList', 'empty');
    installSpy();
    await mount({ service: 'service' });
    expect(exists('service-empty')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
  });

  test('malformed (list: null): the view keeps the no-data picture, loader dismissed, paging stops', async () => {
    setFixtureVariant('app_karigar/getPlumberComplaintList', 'malformed');
    installSpy();
    await mount({ service: 'service' });
    expect(exists('service-empty')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
    await act(async () => {
      infinite()[0].props.onInfinite({ complete: jest.fn() });
    });
    await settle();
    expect(callsTo('app_karigar/getPlumberComplaintList')).toHaveLength(1);
  });

  test('infinite scroll never sets the flag (the check reads r.coupon)', async () => {
    setFixtureVariant('app_karigar/getPlumberComplaintList', 'empty');
    installSpy();
    await mount({ service: 'service' });
    const complete = await scrollMore();
    expect(complete).toHaveBeenCalledTimes(1);
    expect(infinite()).toHaveLength(1);
  });
});

describe('referal', () => {
  beforeEach(() => setFixtureVariant('app_karigar/referal_logs', 'history'));

  test('title, rows, points', async () => {
    installSpy();
    await mount({ referal: 'referal' });
    expect(allText()).toContain('Earn By Referal History');
    expect(textOf('referal-desc-0')).toBe('Referral bonus for Vikas More');
    expect(textOf('referal-date-0')).toBe('30-Sep-2026');
    expect(textOf('referal-points-0')).toBe('50Points');
    expect(openLoaders()).toHaveLength(0);
  });

  test('empty shows the no-data picture', async () => {
    setFixtureVariant('app_karigar/referal_logs', 'empty');
    installSpy();
    await mount({ referal: 'referal' });
    expect(exists('referal-empty')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
  });

  test('malformed keeps the no-data picture without a crash', async () => {
    setFixtureVariant('app_karigar/referal_logs', 'malformed');
    installSpy();
    await mount({ referal: 'referal' });
    expect(exists('referal-empty')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('redeem', () => {
  beforeEach(() => setFixtureVariant('app_karigar/transaction', 'redeem'));

  test('title and the six status blocks', async () => {
    installSpy();
    await mount({ redeem: 'redeem' });
    expect(allText()).toContain('Redeem History');
    expect(textOf('redeem-type-0')).toBe('Type  :Gift');
    expect(textOf('redeem-title-0')).toBe('Steel Water Bottle');
    expect(textOf('redeem-reqid-0')).toBe('Req Id : REQ# 505');
    expect(exists('redeem-status-pending-0')).toBe(true);
    expect(exists('redeem-status-approved-1')).toBe(true);
    expect(exists('redeem-status-reject-2')).toBe(true);
    expect(exists('redeem-status-shipped-3')).toBe(true);
    expect(exists('redeem-status-received-4')).toBe(true);
    expect(exists('redeem-status-transfered-5')).toBe(true);
    const texts = allText();
    expect(texts).toContain('28 Oct 2026');
    expect(texts).toContain('Shipped on:3 Oct 2026');
    expect(texts).toContain('Receive on : 22 Sep 2026');
    expect(texts).toContain('Transfer on : 5 Sep 2026');
    expect(texts).toContain('Transfer');
    expect(openLoaders()).toHaveLength(0);
  });

  test('every Reject row shows the reason and Refunded (receive_status is undefined on the page)', async () => {
    installSpy();
    await mount({ redeem: 'redeem' });
    expect(textOf('redeem-reason-2')).toBe('Out Of Stock');
    expect(exists('redeem-refund-2')).toBe(true);
    expect(exists('redeem-refund-0')).toBe(false);
  });

  test('empty: no-data picture, loader dismissed', async () => {
    setFixtureVariant('app_karigar/transaction', 'empty');
    installSpy();
    await mount({ redeem: 'redeem' });
    expect(exists('redeem-empty')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
  });

  test('malformed (transaction: null): no-data picture, loader dismissed, paging stops', async () => {
    setFixtureVariant('app_karigar/transaction', 'malformed');
    installSpy();
    await mount({ redeem: 'redeem' });
    expect(exists('redeem-empty')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
    await act(async () => {
      infinite()[0].props.onInfinite({ complete: jest.fn() });
    });
    await settle();
    expect(callsTo('app_karigar/transaction')).toHaveLength(1);
  });

  test('an empty page is still appended and complete() runs (the flag check is commented out)', async () => {
    installSpy();
    await mount({ redeem: 'redeem' });
    setFixtureVariant('app_karigar/transaction', 'empty');
    const complete = await scrollMore();
    expect(complete).toHaveBeenCalledTimes(1);
    expect(infinite()).toHaveLength(1);
  });
});

describe('no params', () => {
  test('nothing is loaded and nothing is shown', async () => {
    installSpy();
    await mount({});
    expect(calls).toHaveLength(0);
    expect(openLoaders()).toHaveLength(0);
  });
});
