// PlumberCheckin screen (Ionic PlumberCheckinPage): contracts, states, select -> check-in, navigation. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { MOCK_POSITION, resetMockNative, setMockNativeFailure } from '../../native';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import { webAlert } from '../../ui/webAlert';
import PlumberCheckinScreen from './index';

jest.mock('../../ui/webAlert', () => ({ webAlert: jest.fn() }));
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

async function mount() {
  await act(async () => {
    tree = ReactTestRenderer.create(<PlumberCheckinScreen navigation={navigation as any} route={{ params: {} } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const toasts = () => overlayStore.getEntries().filter(e => e.kind === 'toast');
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert');
const press = async (id: string) => {
  const node = find(id).filter(n => typeof n.props.onPress === 'function').pop()!;
  await act(async () => {
    node.props.onPress();
  });
  await settle();
};
// opens the select alert and presses OK with the given radio value
const choose = async (value: string) => {
  await press('complaint-select-cover');
  const entry: any = alerts().filter(e => (e.options as any).inputs)[0];
  await act(async () => {
    entry.options.buttons[1].handler(value);
  });
  await settle();
};
const body = (c: ApiRequest) => JSON.parse(c.body!);
const callsTo = (fn: string) => calls.filter(c => c.fn === fn);

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  resetMockNative();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  (webAlert as jest.Mock).mockClear();
  await i18n.changeLanguage('en');
  calls = [];
  db.userStorageData = { id: '900011', type: 'Plumber' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contract (card Endpoints)', () => {
  test('checkinComplaintList and checkinComplaintDetail on entry', async () => {
    installSpy();
    await expectContract('app_karigar/checkinComplaintList', () => mount());
    expect(body(callsTo('app_karigar/checkinComplaintList')[0])).toEqual({ filter: { limit: 0 }, plumber_id: '900011', type: '' });
    act(() => tree.unmount());
    calls = [];
    await expectContract('app_karigar/checkinComplaintDetail', () => mount());
    expect(body(callsTo('app_karigar/checkinComplaintDetail')[0])).toEqual({ filter: { limit: 0 }, plumber_id: '900011', complaint_id: '' });
  });

  test('picking a complaint: list again with type = the id, then plumberCheckIn with the fix', async () => {
    installSpy();
    await mount();
    calls = [];
    await expectContract('app_karigar/plumberCheckIn', () => choose('71'));
    expect(body(callsTo('app_karigar/checkinComplaintList')[0])).toEqual({ filter: { limit: 0 }, plumber_id: '900011', type: '71' });
    expect(body(callsTo('app_karigar/plumberCheckIn')[0])).toEqual({
      plumber_id: '900011',
      complaint_id: 71,
      cust_lat: MOCK_POSITION.lat,
      cust_long: MOCK_POSITION.lng,
    });
  });
});

describe('render', () => {
  test('default: title, the Complaint select with its options', async () => {
    await mount();
    expect(allText()).toContain('Checkin');
    expect(allText()).toContain('Complaint');
    expect(exists('checkin-empty')).toBe(false);
    await press('complaint-select-cover');
    const entry: any = alerts().filter(e => (e.options as any).inputs)[0];
    expect(entry.options.inputs.map((i: any) => i.label)).toEqual(['Sunita Deshmukh COM# 71 (service)', 'Anil Kulkarni COM# 72 (installation)']);
    expect(entry.options.inputs.map((i: any) => i.value)).toEqual(['71', '72']);
  });

  test('empty: the no_found block with "No complaints exists", no select', async () => {
    setFixtureVariant('app_karigar/checkinComplaintList', 'empty');
    await mount();
    expect(exists('checkin-empty')).toBe(true);
    expect(allText()).toContain('No complaints exists');
    expect(exists('complaint-select-cover')).toBe(false);
  });

  test('malformed (complaintList null): renders without throwing, blank content', async () => {
    setFixtureVariant('app_karigar/checkinComplaintList', 'malformed');
    await mount();
    expect(allText()).toContain('Checkin');
    expect(exists('checkin-empty')).toBe(false);
    expect(exists('complaint-select-cover')).toBe(false);
  });

  test('hin: translated title and label', async () => {
    await i18n.changeLanguage('hin');
    await mount();
    expect(allText()).toContain(i18n.t('Checkin'));
    expect(allText()).toContain(i18n.t('Complaint'));
  });
});

describe('check-in', () => {
  test('success: the Success! alert', async () => {
    await mount();
    await choose('71');
    const a: any = alerts().filter(e => !(e.options as any).inputs).pop();
    expect(a.options.title).toBe('Success!');
    expect(a.options.subTitle).toBe('Geo Location updated Successfully!');
    expect(webAlert).not.toHaveBeenCalled();
  });

  test('a response other than CheckinSuccess shows the native alert', async () => {
    setFixtureVariant('app_karigar/plumberCheckIn', 'failed');
    await mount();
    await choose('71');
    expect(webAlert).toHaveBeenCalledWith('Geo Location not found! Try Again');
  });

  test('accuracy request rejected: Allow Location Permissions toast, the check-in goes out without coordinates', async () => {
    installSpy();
    setMockNativeFailure('location', 'denied', 'accuracy: user disagreed');
    await mount();
    expect(toasts().map(e => (e.options as any).message)).toEqual(['Allow Location Permissions']);
    await choose('71');
    expect(body(callsTo('app_karigar/plumberCheckIn')[0])).toEqual({ plumber_id: '900011', complaint_id: 71 });
  });

  test('position failure: swallowed (no toast)', async () => {
    setMockNativeFailure('location', 'unavailable', 'no fix');
    await mount();
    expect(toasts()).toHaveLength(0);
  });

  test('offline: no coordinates are kept', async () => {
    installSpy();
    const spy = jest.spyOn(require('../../native/network'), 'getNetworkState').mockResolvedValue({ ok: true, value: { online: false, type: 'none' } });
    await mount();
    await choose('71');
    expect(body(callsTo('app_karigar/plumberCheckIn')[0])).toEqual({ plumber_id: '900011', complaint_id: 71 });
    spy.mockRestore();
  });
});

describe('navigation (Ionic params)', () => {
  test('a service complaint pushes PulmberCustomerDetail {type: service, id, close_com: true}', async () => {
    await mount();
    await choose('71');
    expect(navigation.push).toHaveBeenCalledWith('PulmberCustomerDetail', { type: 'service', id: 71, close_com: true });
  });

  test('any other type is pushed as installation', async () => {
    await mount();
    await choose('72');
    expect(navigation.push).toHaveBeenCalledWith('PulmberCustomerDetail', { type: 'installation', id: 72, close_com: true });
  });
});
