// MyCamplaints screen (Ionic MyCamplaintsPage): contract, search / status filter, paging, states and navigation. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Linking } from 'react-native';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import MyCamplaintsScreen from './index';

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn() };
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};
const EP = 'app_karigar/getPlumberComplaintList';

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
    tree = ReactTestRenderer.create(<MyCamplaintsScreen navigation={navigation as any} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const textOf = (id: string) => flat(find(id)[0].props.children);
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const callsTo = () => calls.filter(c => c.fn === EP);
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
// the select opens through the item cover; OK on the alert with the chosen value
const pickStatus = async (v: string) => {
  const cover = tree.root.findAll(n => n.props.cover && typeof n.props.cover.onPress === 'function')[0];
  await act(async () => {
    cover.props.cover.onPress();
  });
  const alert = overlayStore.getEntries().filter(e => e.kind === 'alert').pop()!;
  const ok = (alert.options as any).buttons.find((b: any) => b.text === 'OK');
  await act(async () => {
    ok.handler(v);
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
  db.userStorageData = { id: '900011', type: 'Plumber' };
  setFixtureVariant(EP, 'complaints');
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contract (card Endpoints)', () => {
  test('getPlumberComplaintList on entry (no status yet), then from the infinite scroll (status reset to "")', async () => {
    installSpy();
    await expectContract('app_karigar/getPlumberComplaintList.MyCamplaints', () => mount());
    expect(body(callsTo()[0])).toEqual({ plumber_id: '900011', filter: { limit: 0 }, type: 'Service' });
    setFixtureVariant(EP, 'complaintsMore');
    await scrollMore();
    // NOTE (parity): filter.status was set to '' by ionViewDidLoad after the first request
    expect(body(callsTo()[1])).toEqual({ plumber_id: '900011', filter: { limit: 3, status: '' }, type: 'Service' });
  });

  // NOTE (parity): the search input cannot be focused on a device (item-cover over the item); the handler is still called directly here.
  test('status select sends the status with the nav type; a search keystroke sends no type', async () => {
    installSpy();
    await mount();
    setFixtureVariant(EP, 'complaintsClosed');
    await pickStatus('Closed');
    expect(body(callsTo()[1])).toEqual({ plumber_id: '900011', filter: { limit: 0, status: 'Closed' }, type: 'Service' });
    await search('ani');
    expect(body(callsTo()[2])).toEqual({ plumber_id: '900011', filter: { limit: 0, status: 'Closed', search: 'ani' } });
    expect(exists('complaint-0')).toBe(true);
  });
});

describe('render', () => {
  test('default: title, rows with letter, name, mobile, address, problem, coloured status; loader closed', async () => {
    await mount();
    expect(allText()).toContain('My Complaints');
    expect(textOf('complaint-0-letter')).toBe('S');
    expect(textOf('complaint-0-name')).toBe('Sunita Deshmukh');
    expect(textOf('complaint-0-mobile')).toBe('9000000051');
    expect(textOf('complaint-0-com')).toBe('COM#71');
    expect(textOf('complaint-0-address')).toBe('12 Lake Road Pune Pune Maharashtra 411001');
    expect(textOf('complaint-0-problem')).toBe('Tap Leakage');
    expect(textOf('complaint-0-status')).toBe('Pending');
    expect(textOf('complaint-1-status')).toBe('Closed');
    expect(textOf('complaint-2-status')).toBe('Cancel');
    expect(exists('complaint-empty')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('empty list ([] is truthy): no image, no rows', async () => {
    setFixtureVariant(EP, 'empty');
    await mount();
    expect(exists('complaint-empty')).toBe(false);
    expect(exists('complaint-0')).toBe(false);
  });

  test('malformed (null list): the no-found image, no throw', async () => {
    setFixtureVariant(EP, 'malformed');
    await mount();
    expect(exists('complaint-empty')).toBe(true);
  });

  test('hin: title comes from the language file', async () => {
    await i18n.changeLanguage('hin');
    await mount();
    expect(allText()).toContain(i18n.t('My Complaints'));
  });
});

describe('paging', () => {
  test('a second page is appended after 1 s and completes the scroll; an empty page ends paging', async () => {
    await mount();
    setFixtureVariant(EP, 'complaintsMore');
    const complete = await scrollMore();
    expect(complete).toHaveBeenCalledTimes(1);
    expect(textOf('complaint-3-name')).toBe('Rohit Patil');
    setFixtureVariant(EP, 'empty');
    const complete2 = await scrollMore();
    expect(complete2).not.toHaveBeenCalled();
    expect(infinite()).toHaveLength(0);
  });
});

describe('navigation (Ionic params)', () => {
  test('name, mobile, address and problem / status rows push PulmberCustomerDetail {id, close_com: false}', async () => {
    await mount();
    for (const id of ['complaint-1-name-press', 'complaint-1-mobile-press', 'complaint-1-add', 'complaint-1-problem-press', 'complaint-1-status-press']) {
      navigation.push.mockClear();
      await press(id);
      expect(navigation.push).toHaveBeenCalledWith('PulmberCustomerDetail', { id: 72, close_com: false });
    }
  });

  test('the call button opens the tel: link and does not navigate', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    await mount();
    await press('complaint-0-dial');
    expect(open).toHaveBeenCalledWith('tel:9000000051');
    expect(navigation.push).not.toHaveBeenCalled();
    open.mockRestore();
  });
});
