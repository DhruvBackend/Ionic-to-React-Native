// ComplaintHistory screen (Ionic ComplaintHistoryPage): contract, segment / search, paging, states and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Linking } from 'react-native';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import ComplaintHistoryScreen from './index';

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn() };
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

async function settle(ms = 350, rounds = 4) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
  }
}

async function mount(params: any = { type: 'Service' }) {
  await act(async () => {
    tree = ReactTestRenderer.create(<ComplaintHistoryScreen navigation={navigation as any} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const textOf = (id: string) => flat(find(id)[0].props.children);
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const callsTo = () => calls.filter(c => c.fn === 'app_karigar/getComplaintList');
const body = (c: ApiRequest) => JSON.parse(c.body!);
const press = async (id: string) => {
  const node = find(id).filter(n => typeof n.props.onPress === 'function').pop()!;
  await act(async () => {
    node.props.onPress();
  });
  await settle();
};
const infinite = () => tree.root.findAll(n => typeof n.props.onInfinite === 'function');
const scrollMore = async (complete = jest.fn()) => {
  await act(async () => {
    infinite()[0].props.onInfinite({ complete });
  });
  await settle(400, 5);
  return complete;
};
const search = async (v: string) => {
  const node = tree.root.findAll(n => typeof n.props.onChangeText === 'function' && n.props.placeholder === 'Search')[0];
  await act(async () => {
    node.props.onChangeText(v);
  });
  await settle();
};

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  await i18n.changeLanguage('en');
  calls = [];
  db.userStorageData = { id: '900001', type: 'Customer' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contract (card Endpoints)', () => {
  test('getComplaintList on entry, then from the infinite scroll (no retailer_id, status reset by ionViewDidLoad)', async () => {
    installSpy();
    await expectContract('app_karigar/getComplaintList', () => mount());
    expect(body(callsTo()[0])).toEqual({ filter: { limit: 0, status: 'Pending' }, type: { type: 'Service' }, retailer_id: '900001' });
    setFixtureVariant('app_karigar/getComplaintList', 'more');
    await scrollMore();
    // NOTE (parity): filter.status was set to '' by ionViewDidLoad after the first request
    expect(body(callsTo()[1])).toEqual({ filter: { limit: 3, status: '' }, type: { type: 'Service' } });
  });

  test('segment and search send the status / search in the filter', async () => {
    installSpy();
    await mount({ type: 'Installation' });
    setFixtureVariant('app_karigar/getComplaintList', 'closed');
    await press('segment-Closed');
    expect(body(callsTo()[1])).toEqual({ filter: { limit: 0, status: 'Closed' }, type: { type: 'Installation' }, retailer_id: '900001' });
    await search('sun');
    expect(body(callsTo()[2])).toEqual({ filter: { limit: 0, status: 'Closed', search: 'sun' }, type: { type: 'Installation' }, retailer_id: '900001' });
    await press('segment-Cancel');
    expect(body(callsTo()[3]).filter).toEqual({ limit: 0, status: 'Cancel', search: 'sun' });
  });
});

describe('render', () => {
  test('Service: title, COM# badge, rows, plumber and waiting blocks, loader closed', async () => {
    await mount();
    expect(allText()).toContain('Request History');
    expect(textOf('complaint-0-name')).toContain('Sunita Deshmukh');
    expect(allText()).toContain('COM#71');
    expect(allText()).not.toContain('IR#71');
    expect(textOf('complaint-0-date')).toBe('Date:28 October 2026');
    expect(textOf('complaint-0-otp')).toBe('OTP: 4821');
    expect(textOf('complaint-0-status')).toBe('Satus: Pending ');
    expect(textOf('complaint-0-problem')).toBe('Nature Problem: Tap leakage');
    expect(textOf('complaint-0-plumber')).toBe('Plumber Name: Ramesh Patil');
    expect(textOf('complaint-0-p-mobile')).toBe('9000000011');
    // row 1: plumberName null + Pending -> waiting text, no plumber line
    expect(textOf('complaint-1-waiting')).toBe('Waiting For Plumber Assign . . .');
    expect(exists('complaint-1-plumber')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
    expect(exists('complaint-empty')).toBe(false);
  });

  test('Installation: IR# badge', async () => {
    await mount({ type: 'Installation' });
    expect(allText()).toContain('IR#71');
    expect(allText()).not.toContain('COM#71');
  });

  test('Closed and Cancel lists: no waiting text for a Closed row without plumber', async () => {
    setFixtureVariant('app_karigar/getComplaintList', 'closed');
    await mount();
    expect(textOf('complaint-1-status')).toBe('Satus: Closed ');
    expect(exists('complaint-1-waiting')).toBe(false);
    expect(exists('complaint-1-plumber')).toBe(false);
  });

  test('hin: title and labels come from the language file', async () => {
    await i18n.changeLanguage('hin');
    await mount();
    expect(allText()).toContain(i18n.t('Request History'));
    expect(textOf('complaint-0-otp')).toBe(`${i18n.t('OTP')}: 4821`);
  });

  test('empty: the no-data picture, loader dismissed', async () => {
    setFixtureVariant('app_karigar/getComplaintList', 'empty');
    await mount();
    expect(exists('complaint-empty')).toBe(true);
    expect(exists('complaint-list')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('malformed (complaintList: null): no crash, no-data picture, loader dismissed, paging stops', async () => {
    installSpy();
    setFixtureVariant('app_karigar/getComplaintList', 'malformed');
    await mount();
    expect(exists('complaint-empty')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
    expect(callsTo()).toHaveLength(1);
  });
});

describe('paging', () => {
  test('infinite scroll appends the next page after 1 s and completes', async () => {
    await mount();
    setFixtureVariant('app_karigar/getComplaintList', 'more');
    const complete = await scrollMore();
    expect(complete).toHaveBeenCalledTimes(1);
    expect(exists('complaint-3')).toBe(true);
    expect(textOf('complaint-3-name')).toContain('Kiran Jadhav');
  });

  test('an empty page removes the infinite scroll (flag = 1) without complete()', async () => {
    await mount();
    setFixtureVariant('app_karigar/getComplaintList', 'empty');
    const complete = await scrollMore();
    expect(complete).not.toHaveBeenCalled();
    expect(infinite()).toHaveLength(0);
  });
});

describe('navigation', () => {
  test('tapping a card pushes ComplaintDetail with {id}', async () => {
    await mount();
    await press('complaint-2');
    expect(navigation.push).toHaveBeenCalledWith('ComplaintDetail', { id: 73 });
  });

  test('the call icon dials (tel:) and the click also reaches the card (push)', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    await mount();
    await press('complaint-0-dial');
    expect(open).toHaveBeenCalledWith('tel:9000000051');
    expect(navigation.push).toHaveBeenCalledWith('ComplaintDetail', { id: 71 });
    open.mockRestore();
  });
});
