// SalesExecPlumberList screen (Ionic SalesExecPlumberListPage): contract, list_type (Plumber / Sales_Boy / Dealer), segments, states, navigation. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import SalesExecPlumberListScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
let listeners: Record<string, () => void> = {};
const navigation = {
  push: jest.fn(),
  addListener: jest.fn((ev: string, cb: () => void) => {
    listeners[ev] = cb;
    return () => {};
  }),
};
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

function installSpy(mode: 'ok' | 'fail' | 'hang' = 'ok') {
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    if (mode === 'fail') {
      return Promise.reject(new HttpError(500, {}));
    }
    if (mode === 'hang') {
      return new Promise<never>(() => {});
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

async function enter() {
  await act(async () => {
    listeners.focus?.(); // ionViewWillEnter
  });
  await settle();
}

async function mount(params?: { list_type?: string }) {
  await act(async () => {
    tree = ReactTestRenderer.create(<SalesExecPlumberListScreen navigation={navigation as any} route={params ? { params } : undefined} />);
  });
  await enter();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const pressable = (id: string) => tree.root.findAll(n => n.props.testID === id && typeof n.props.onPress === 'function')[0];
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const textOf = (id: string) => flat(find(id)[0]?.props.children);
const listCalls = () => calls.filter(c => c.fn === 'app_karigar/sales_exec/plumber_list');
const bodyOf = (c: ApiRequest) => JSON.parse(c.body!);
const fmt = (s: string) => {
  const d = new Date(s);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

beforeEach(() => {
  jest.useFakeTimers();
  resetMock();
  listeners = {};
  navigation.push.mockClear();
  navigation.addListener.mockClear();
  calls = [];
  db.userStorageData = { id: '900004', type: 'Sales_Executive' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contracts (card Endpoints)', () => {
  test('app_karigar/sales_exec/plumber_list: {sales_executive_id, status, list_type} on ionViewWillEnter', async () => {
    installSpy();
    await expectContract('app_karigar/sales_exec/plumber_list', () => mount());
    expect(listCalls()).toHaveLength(1);
    expect(bodyOf(listCalls()[0])).toEqual({ sales_executive_id: '900004', status: 'Verified', list_type: 'Plumber' });
  });

  test.each(['Sales_Boy', 'Dealer'])('list_type %s is sent from the nav param', async listType => {
    installSpy();
    await mount({ list_type: listType });
    expect(bodyOf(listCalls()[0])).toEqual({ sales_executive_id: '900004', status: 'Verified', list_type: listType });
  });

  test('no user id: no request, nothing loads', async () => {
    db.userStorageData = {};
    installSpy();
    await mount();
    expect(listCalls()).toHaveLength(0);
    expect(exists('saeplist-loading')).toBe(false);
  });

  test('every ionViewWillEnter reloads (back from the detail page)', async () => {
    installSpy();
    await mount();
    await enter();
    expect(listCalls()).toHaveLength(2);
  });
});

describe('states (card States)', () => {
  test('SalesExecPlumberList.default (Plumber): title, cards, status icons, dots, no linked count', async () => {
    setFixtureVariant('app_karigar/sales_exec/plumber_list', 'default');
    installSpy();
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Plumbers', 'Verified', 'Pending', 'Suspect', 'Reject']));
    expect(textOf('saeplist-name-0')).toBe('Ramesh Kumar');
    expect(textOf('saeplist-name-1')).toBe('Sunita Pawar');
    expect(textOf('saeplist-status-0')).toBe('Verified');
    expect(textOf('saeplist-dot-0')).toBe('· Active');
    expect(textOf('saeplist-dot-1')).toBe('· Inactive');
    expect(allText()).toEqual(expect.arrayContaining(['check_circle', 'hourglass_full', 'info', 'cancel']));
    expect(textOf('saeplist-mobile-0')).toBe('+919000000401');
    expect(textOf('saeplist-points-0')).toBe('1250');
    expect(textOf('saeplist-points-1')).toBe('0');
    expect(textOf('saeplist-active-0')).toBe(fmt('2026-10-30 18:05:00'));
    expect(textOf('saeplist-active-1')).toBe('—');
    expect(textOf('saeplist-scan-1')).toBe('—');
    expect(textOf('saeplist-active-3')).toBe('not a date');
    expect(allText()).toContain('Sahibabad Ghaziabad Uttar Pradesh');
    expect(allText()).toContain('Maharashtra');
    expect(allText()).toContain('Pune');
    expect(exists('saeplist-address-1')).toBe(false);
    expect(exists('saeplist-linked-0')).toBe(false);
    expect(exists('saeplist-empty')).toBe(false);
    expect(exists('saeplist-loading')).toBe(false);
  });

  test('SalesExecPlumberList.sales_boy (list_type Sales_Boy): title Sellers, linked count only when non-zero', async () => {
    setFixtureVariant('app_karigar/sales_exec/plumber_list', 'sales_boy');
    installSpy();
    await mount({ list_type: 'Sales_Boy' });
    expect(allText()).toContain('Sellers');
    expect(exists('saeplist-linked-0')).toBe(true);
    expect(allText()).toEqual(expect.arrayContaining(['Linked Plumbers', '4']));
    expect(exists('saeplist-linked-1')).toBe(false);
  });

  test('SalesExecPlumberList.dealer (list_type Dealer): title Dealers, linked count', async () => {
    setFixtureVariant('app_karigar/sales_exec/plumber_list', 'dealer');
    installSpy();
    await mount({ list_type: 'Dealer' });
    expect(allText()).toContain('Dealers');
    expect(allText()).toEqual(expect.arrayContaining(['Linked Plumbers', '12', 'Anil Traders']));
  });

  test('a Plumber list never shows the linked count, even when the server sends it', async () => {
    setFixtureVariant('app_karigar/sales_exec/plumber_list', 'sales_boy');
    installSpy();
    await mount();
    expect(exists('saeplist-linked-0')).toBe(false);
  });

  test.each([
    ['Plumber', 'Plumbers', 'plumbers'],
    ['Sales_Boy', 'Sellers', 'sellers'],
    ['Dealer', 'Dealers', 'dealers'],
  ])('SalesExecPlumberList.empty (%s): "No %s in Verified list" text', async (listType, title, lower) => {
    setFixtureVariant('app_karigar/sales_exec/plumber_list', 'empty');
    installSpy();
    await mount({ list_type: listType });
    expect(exists('saeplist-empty')).toBe(true);
    expect(exists('saeplist-item-0')).toBe(false);
    expect(allText()).toEqual(expect.arrayContaining([title, `No ${lower} in Verified list`]));
  });

  test('SalesExecPlumberList.malformed (null body): no crash, empty state', async () => {
    setFixtureVariant('app_karigar/sales_exec/plumber_list', 'malformed');
    installSpy();
    await mount();
    expect(exists('saeplist-item-0')).toBe(false);
    expect(exists('saeplist-empty')).toBe(true);
    expect(exists('saeplist-loading')).toBe(false);
  });

  test('loading: "Loading…" shows while the request is open and the empty state is hidden', async () => {
    installSpy('hang');
    await mount();
    expect(exists('saeplist-loading')).toBe(true);
    expect(allText()).toContain('Loading…');
    expect(exists('saeplist-empty')).toBe(false);
  });

  test('an HTTP error ends the loading state and shows the empty state', async () => {
    installSpy('fail');
    await mount();
    expect(exists('saeplist-loading')).toBe(false);
    expect(exists('saeplist-empty')).toBe(true);
  });
});

describe('segments', () => {
  test('a segment tap reloads with the NEW status (and the empty text names it)', async () => {
    installSpy();
    await mount();
    setFixtureVariant('app_karigar/sales_exec/plumber_list', 'empty');
    await act(async () => {
      pressable('segment-Pending').props.onPress();
    });
    await settle();
    expect(listCalls()).toHaveLength(2);
    expect(bodyOf(listCalls()[1])).toEqual({ sales_executive_id: '900004', status: 'Pending', list_type: 'Plumber' });
    expect(allText()).toContain('No plumbers in Pending list');
    for (const status of ['Suspect', 'Reject']) {
      await act(async () => {
        pressable(`segment-${status}`).props.onPress();
      });
      await settle();
      expect(bodyOf(listCalls()[listCalls().length - 1]).status).toBe(status);
    }
  });
});

describe('navigation (card Nav targets)', () => {
  test('tapping a card pushes SalesExecPlumberDetail with {plumber_id}', async () => {
    installSpy();
    await mount();
    await act(async () => {
      pressable('saeplist-item-1').props.onPress();
    });
    expect(navigation.push).toHaveBeenCalledWith('SalesExecPlumberDetail', { plumber_id: 402 });
  });
});
