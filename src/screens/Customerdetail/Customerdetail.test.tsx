// Customerdetail screen (Ionic CustomerdetailPage): contracts, role-free states, tabs, status filter, navigation. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { profileMd as P } from '../../theme/ionicMdProfile';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import CustomerdetailScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn() };
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

async function settle() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
  }
}

async function mount() {
  await act(async () => {
    tree = ReactTestRenderer.create(<CustomerdetailScreen navigation={navigation as any} route={{ params: { id: 301 } }} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const refresher = () => tree.root.findAll(n => typeof n.props.onRefresh === 'function')[0];
const callsTo = (fn: string) => calls.filter(c => c.fn === fn);
const bodyOf = (c: ApiRequest) => JSON.parse(c.body!);

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  calls = [];
  db.userStorageData = { id: '900002', type: 'Sales_Boy' };
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

// Taps a segment button the way the kit does: model change (ngModelChange), then the page's (click).
async function tap(testID: string) {
  const btn = tree.root.findAll(n => n.props.testID === testID && n.props.value !== undefined)[0];
  const seg = tree.root
    .findAll(n => typeof n.props.onValueChange === 'function')
    .find(n => btn.parent && flatContains(n, btn));
  await act(async () => {
    seg?.props.onValueChange(btn.props.value);
    btn.props.onPress?.(btn.props.value);
  });
  await settle();
}
function flatContains(root: ReactTestRenderer.ReactTestInstance, target: ReactTestRenderer.ReactTestInstance): boolean {
  return root.findAll(n => n === target).length > 0;
}

describe('contracts (card Endpoints)', () => {
  test('app_karigar/customerDetail: {karigar_id, filter:{status:""}} on mount behind a loader that closes with the answer', async () => {
    installSpy();
    await expectContract('app_karigar/customerDetail', () => mount());
    expect(bodyOf(callsTo('app_karigar/customerDetail')[0])).toEqual({ karigar_id: 301, filter: { status: '' } });
    expect(openLoaders()).toHaveLength(0);
  });

  test('app_karigar/complaintDetail: {filter:{limit,status}, karigar_id} when the Complaint tab is tapped', async () => {
    installSpy();
    await expectContract('app_karigar/complaintDetail', async () => {
      await mount();
      await tap('segment-complaint');
    });
    expect(bodyOf(callsTo('app_karigar/complaintDetail')[0])).toEqual({ filter: { status: 'Pending', limit: 0 }, karigar_id: 301 });
  });

  test('app_karigar/sales_boy_customer_list is never called: loadData throws on complain_detail.length', async () => {
    installSpy();
    await mount();
    await tap('segment-complaint');
    const inf = tree.root.findAll(n => typeof n.props.onInfinite === 'function')[0];
    await act(async () => {
      inf?.props.onInfinite({ complete: jest.fn() });
    });
    await settle();
    expect(callsTo('app_karigar/sales_boy_customer_list')).toHaveLength(0);
  });
});

describe('states (card States)', () => {
  test('Customerdetail.default: title is the tab name, name / +91 mobile / titlecased address', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining(['Basic Details', 'Complaint', 'Name', 'rakesh verma', 'Mobile No.', '+919000000301', 'Address', '12 Gandhi Road Uttar Pradesh Ghaziabad Sahibabad 201010']),
    );
    expect(exists('customerdetail-basic')).toBe(true);
    expect(exists('customerdetail-complaint')).toBe(false);
  });

  test('Customerdetail.hin: labels translated; "Basic Details" has no hin entry and stays English', async () => {
    installSpy();
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    const texts = allText();
    expect(texts).toContain(i18n.t('Name').replace(/\s+/g, ' '));
    expect(texts).toContain(i18n.t('Mobile No.').replace(/\s+/g, ' '));
    expect(texts).toContain(i18n.t('Address').replace(/\s+/g, ' '));
    expect(texts).toContain(i18n.t('Complaint').replace(/\s+/g, ' '));
  });

  test('Customerdetail.empty ({}): labels with blank values, "+91" alone, no crash', async () => {
    setFixtureVariant('app_karigar/customerDetail', 'empty');
    installSpy();
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['+91']));
    expect(openLoaders()).toHaveLength(0);
  });

  test('Customerdetail.malformed (customer: null): no crash, the first-load blank values stay, loader gone', async () => {
    setFixtureVariant('app_karigar/customerDetail', 'malformed');
    installSpy();
    await mount();
    expect(exists('customerdetail-basic')).toBe(true);
    expect(allText()).toEqual(expect.arrayContaining(['+91']));
    expect(openLoaders()).toHaveLength(0);
  });

  test('an HTTP error leaves the "Please wait..." loader up (no error callback in Ionic)', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
  });
});

describe('Complaint tab', () => {
  test('tapping Complaint switches the title and lists cards with status colours', async () => {
    installSpy();
    await mount();
    await tap('segment-complaint');
    expect(exists('customerdetail-basic')).toBe(false);
    const texts = allText();
    expect(texts).toEqual(expect.arrayContaining(['Complaint', 'Pending', 'Closed', 'Cancel', 'Date:5 October 2026', 'Nature Problem: tap leakage', 'Satus: ']));
    expect(exists('complaint-item-2')).toBe(true);
    const st = (i: number) => find(`complaint-status-${i}`)[0].props.style;
    expect(st(0)).toEqual({ color: P.statusPending });
    expect(st(1)).toEqual({ color: P.statusVerified });
    expect(st(2)).toEqual({ color: P.statusReject });
  });

  test('tapping Basic Details again reloads customerDetail with filter.status "" and no loader', async () => {
    installSpy();
    await mount();
    await tap('segment-complaint');
    await tap('segment-basic');
    const detail = callsTo('app_karigar/customerDetail');
    expect(detail).toHaveLength(2);
    expect(bodyOf(detail[1]).filter.status).toBe('');
    expect(openLoaders()).toHaveLength(0);
  });

  test('a status tab sets filter.status and offset 0 for complaintDetail', async () => {
    installSpy();
    await mount();
    await tap('segment-complaint');
    await tap('status-closed');
    const comp = callsTo('app_karigar/complaintDetail');
    expect(comp).toHaveLength(2);
    expect(bodyOf(comp[1])).toEqual({ filter: { status: 'Closed', limit: 0 }, karigar_id: 301 });
  });

  test('refresh in the Complaint tab calls customerDetail twice (two ion-refreshers) with the status filter', async () => {
    installSpy();
    await mount();
    await tap('segment-complaint');
    const before = callsTo('app_karigar/customerDetail').length;
    const complete = jest.fn();
    await act(async () => {
      refresher().props.onRefresh({ complete });
    });
    await settle();
    const detail = callsTo('app_karigar/customerDetail');
    expect(detail.length - before).toBe(2);
    expect(bodyOf(detail[detail.length - 1]).filter.status).toBe('Pending');
  });

  test('refresh in Basic Details calls customerDetail once', async () => {
    installSpy();
    await mount();
    await act(async () => {
      refresher().props.onRefresh({ complete: jest.fn() });
    });
    await settle();
    expect(callsTo('app_karigar/customerDetail')).toHaveLength(2);
  });

  test('empty and malformed complaint lists show no cards', async () => {
    for (const v of ['empty', 'malformed']) {
      setFixtureVariant('app_karigar/complaintDetail', v);
      installSpy();
      await mount();
      await tap('segment-complaint');
      expect(exists('complaint-item-0')).toBe(false);
      act(() => tree.unmount());
      restoreTransport();
    }
  });
});

describe('navigation (card Nav targets)', () => {
  test('tapping a complaint card pushes ComplaintDetail with {id}', async () => {
    installSpy();
    await mount();
    await tap('segment-complaint');
    await act(async () => {
      find('complaint-item-1')[0].props.onPress();
    });
    expect(navigation.push).toHaveBeenCalledWith('ComplaintDetail', { id: 502 });
  });
});
