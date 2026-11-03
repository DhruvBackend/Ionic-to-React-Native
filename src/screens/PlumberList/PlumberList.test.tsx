// PlumberList screen (Ionic PlumberListPage): contracts, states, search, segments, infinite scroll offset, navigation. See card.md.
import React from 'react';
import { Linking } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import PlumberListScreen from './index';

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
    tree = ReactTestRenderer.create(<PlumberListScreen navigation={navigation as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const refresher = () => tree.root.findAll(n => typeof n.props.onRefresh === 'function')[0];
const infinite = () => tree.root.findAll(n => typeof n.props.onInfinite === 'function')[0];
const searchbar = () => tree.root.findAll(n => typeof n.props.onChangeText === 'function' && n.props.type === 'search')[0];
const listCalls = () => calls.filter(c => c.fn === 'app_karigar/sales_boy_plumber_list');
const moreCalls = () => calls.filter(c => c.fn === 'app_karigar/getComplaintList');
const bodyOf = (c: ApiRequest) => JSON.parse(c.body!);

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  calls = [];
  db.userStorageData = { id: '900002', type: 'Sales_Boy' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contracts (card Endpoints)', () => {
  test('app_karigar/sales_boy_plumber_list: {filter} on mount behind a loader that closes with the answer', async () => {
    installSpy();
    await expectContract('app_karigar/sales_boy_plumber_list', () => mount());
    expect(listCalls()).toHaveLength(1);
    expect(bodyOf(listCalls()[0])).toEqual({ filter: { sales_boy_id: '900002', limit: 0, status: 'Pending', search: '' } });
    expect(openLoaders()).toHaveLength(0);
  });

  test('app_karigar/getComplaintList: the infinite scroll sends {filter} with the next offset and the segment status', async () => {
    setFixtureVariant('app_karigar/getComplaintList', 'plumber_page');
    installSpy();
    await mount();
    await expectContract('app_karigar/getComplaintList.PlumberList', async () => {
      await act(async () => {
        infinite().props.onInfinite({ complete: jest.fn() });
      });
      await settle();
    });
    expect(moreCalls()).toHaveLength(1);
    expect(bodyOf(moreCalls()[0])).toEqual({ filter: { sales_boy_id: '900002', limit: 3, status: 'Pending', search: '' } });
  });
});

describe('states (card States)', () => {
  test('PlumberList.default: title, segment counts, one card per plumber', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining([
        'Plumber',
        'Date Created:14 September 2026',
        'ramesh kumar',
        '9000000401',
        'Last Active: 30 Oct 2026, 6:05 PM',
        'Last Scan: 29 Oct 2026, 9:15 AM',
        'SUNITA PAWAR',
        'Last Active: —',
        'Satus: Pending',
      ]),
    );
    expect(allText()).toEqual(expect.arrayContaining(['Pending (3)', 'Verified (5)', 'Reject (1)']));
    expect(flat(find('plumber-points-0')[0].props.children)).toBe('Points: 1250');
    expect(flat(find('plumber-points-1')[0].props.children)).toBe('Points: 0');
    expect(flat(find('plumber-points-2')[0].props.children)).toBe('Points: 0');
    expect(exists('plumber-item-2')).toBe(true);
    expect(exists('plumber-empty')).toBe(false);
    expect(find('ion-fab-button').length).toBeGreaterThan(0);
    expect(searchbar().props.placeholder).toBe('Search');
  });

  test('PlumberList.verified: a Verified card', async () => {
    setFixtureVariant('app_karigar/sales_boy_plumber_list', 'verified');
    installSpy();
    await mount();
    expect(flat(find('plumber-status-0')[0].props.children)).toBe('Verified');
    expect(exists('plumber-item-1')).toBe(false);
  });

  test('PlumberList.reject: a Reject card', async () => {
    setFixtureVariant('app_karigar/sales_boy_plumber_list', 'reject');
    installSpy();
    await mount();
    expect(flat(find('plumber-status-0')[0].props.children)).toBe('Reject');
  });

  test('PlumberList.empty: the no_found image shows', async () => {
    setFixtureVariant('app_karigar/sales_boy_plumber_list', 'empty');
    installSpy();
    await mount();
    expect(exists('plumber-item-0')).toBe(false);
    expect(exists('plumber-empty')).toBe(true);
    expect(allText()).toEqual(expect.arrayContaining(['Pending (0)']));
    expect(openLoaders()).toHaveLength(0);
  });

  test('PlumberList.malformed (karigars: null): no crash, empty image, counts blank, loader gone', async () => {
    setFixtureVariant('app_karigar/sales_boy_plumber_list', 'malformed');
    installSpy();
    await mount();
    expect(exists('plumber-item-0')).toBe(false);
    expect(exists('plumber-empty')).toBe(true);
    expect(allText()).toEqual(expect.arrayContaining(['Pending ()']));
    expect(openLoaders()).toHaveLength(0);
  });

  test('an HTTP error leaves the "Please wait..." loader up (no error callback in Ionic)', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
  });
});

describe('search, segments and refresh', () => {
  test('every keystroke searches from offset 0 without a loader, keeping the segment status', async () => {
    installSpy();
    await mount();
    await act(async () => {
      searchbar().props.onChangeText('ram');
    });
    await settle();
    expect(listCalls()).toHaveLength(2);
    expect(bodyOf(listCalls()[1])).toEqual({ filter: { sales_boy_id: '900002', limit: 0, status: 'Pending', search: 'ram' } });
    expect(openLoaders()).toHaveLength(0);
  });

  test('a segment tap reloads with the NEW status, no search (the search box clears)', async () => {
    installSpy();
    await mount();
    await act(async () => {
      searchbar().props.onChangeText('ram');
    });
    await settle();
    await act(async () => {
      // the segment sets its model first (ngModelChange), then runs the button's (click)
      tree.root.findAll(n => typeof n.props.onValueChange === 'function')[0].props.onValueChange('Verified');
      find('segment-Verified')[0].props.onPress?.('Verified');
    });
    await settle();
    const last = bodyOf(listCalls()[listCalls().length - 1]);
    expect(last.filter.status).toBe('Verified');
    expect(last.filter.search).toBeUndefined();
    expect(searchbar().props.value).toBe('');
  });

  test('refresh reloads from offset 0 and completes at once', async () => {
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      refresher().props.onRefresh({ complete });
    });
    expect(complete).toHaveBeenCalledTimes(1);
    await settle();
    expect(listCalls()).toHaveLength(2);
    expect(bodyOf(listCalls()[1]).filter).toMatchObject({ limit: 0, search: '' });
  });
});

describe('infinite scroll (plumber-list.ts:92-115)', () => {
  test('asks getComplaintList for the next offset, appends after 1000 ms and completes', async () => {
    setFixtureVariant('app_karigar/getComplaintList', 'plumber_page');
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      infinite().props.onInfinite({ complete });
    });
    expect(bodyOf(moreCalls()[0]).filter.limit).toBe(3);
    expect(complete).not.toHaveBeenCalled();
    await settle();
    expect(complete).toHaveBeenCalledTimes(1);
    expect(exists('plumber-item-4')).toBe(true);
    expect(allText()).toContain('deepak rane');
  });

  test('an empty page ([] == "") removes the infinite scroll; a refresh brings it back', async () => {
    setFixtureVariant('app_karigar/getComplaintList', 'plumber_end');
    installSpy();
    await mount();
    await act(async () => {
      infinite().props.onInfinite({ complete: jest.fn() });
    });
    await settle();
    expect(tree.root.findAll(n => typeof n.props.onInfinite === 'function')).toHaveLength(0);
    await act(async () => {
      refresher().props.onRefresh({ complete: jest.fn() });
    });
    await settle();
    expect(infinite()).toBeTruthy();
  });
});

describe('navigation (card Nav targets)', () => {
  test('tapping a card pushes PlumberDetail with {id}', async () => {
    installSpy();
    await mount();
    await act(async () => {
      find('plumber-item-1')[0].props.onPress();
    });
    expect(navigation.push).toHaveBeenCalledWith('PlumberDetail', { id: 402 });
  });

  test('the fab pushes PlumberAdd without params', async () => {
    installSpy();
    await mount();
    await act(async () => {
      find('ion-fab-button')[0].props.onPress();
    });
    expect(navigation.push).toHaveBeenCalledWith('PlumberAdd');
  });

  test('the phone icon opens tel: and the click also bubbles to the card (PlumberDetail)', async () => {
    installSpy();
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    await mount();
    await act(async () => {
      find('plumber-dialer-0')[0].props.onPress();
    });
    expect(open).toHaveBeenCalledWith('tel:9000000401');
    expect(navigation.push).toHaveBeenCalledWith('PlumberDetail', { id: 401 });
    open.mockRestore();
  });
});
