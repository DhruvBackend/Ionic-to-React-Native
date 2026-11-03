// Customerlist screen (Ionic CustomerlistPage): contract, states, search, infinite scroll offset, navigation. See card.md.
import React from 'react';
import { Linking } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import CustomerlistScreen from './index';

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
    tree = ReactTestRenderer.create(<CustomerlistScreen navigation={navigation as any} />);
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
const listCalls = () => calls.filter(c => c.fn === 'app_karigar/sales_boy_customer_list');
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

describe('contracts (card Endpoints)', () => {
  test('app_karigar/sales_boy_customer_list: {filter} on mount behind a loader that closes with the answer', async () => {
    installSpy();
    await expectContract('app_karigar/sales_boy_customer_list', () => mount());
    expect(listCalls()).toHaveLength(1);
    expect(bodyOf(listCalls()[0])).toEqual({ filter: { sales_boy_id: '900002', limit: 0, search: '' } });
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('states (card States)', () => {
  test('Customerlist.default: title, one card per customer (titlecase, "d MMMM y", address line)', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining([
        'Customer',
        'Date Created:14 September 2026',
        'Rakesh Verma',
        '9000000301',
        '12 Gandhi Road Uttar Pradesh Ghaziabad Sahibabad 201010',
        'Sunita Pawar',
      ]),
    );
    expect(exists('customer-item-2')).toBe(true);
    expect(find('ion-fab-button').length).toBeGreaterThan(0);
  });

  test('Customerlist.hin: title and "Date Created" translated, Search stays literal', async () => {
    installSpy();
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    const texts = allText();
    expect(texts).toContain(i18n.t('Customer').replace(/\s+/g, ' '));
    expect(texts.some(x => x.startsWith(i18n.t('Date Created').replace(/\s+/g, ' ') + ':14 September 2026'))).toBe(true);
    expect(searchbar().props.placeholder).toBe('Search');
  });

  test('Customerlist.empty: blank page (the no_found image is inside the row loop in Ionic)', async () => {
    setFixtureVariant('app_karigar/sales_boy_customer_list', 'empty');
    installSpy();
    await mount();
    expect(exists('customer-item-0')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('Customerlist.malformed (karigars: null): no crash, no rows, loader gone', async () => {
    setFixtureVariant('app_karigar/sales_boy_customer_list', 'malformed');
    installSpy();
    await mount();
    expect(exists('customer-item-0')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('an HTTP error leaves the "Please wait..." loader up (no error callback in Ionic)', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
  });
});

describe('search and refresh', () => {
  test('every keystroke searches from offset 0 without a loader', async () => {
    installSpy();
    await mount();
    await act(async () => {
      searchbar().props.onChangeText('rak');
    });
    await settle();
    expect(listCalls()).toHaveLength(2);
    expect(bodyOf(listCalls()[1])).toEqual({ filter: { sales_boy_id: '900002', limit: 0, search: 'rak' } });
    expect(openLoaders()).toHaveLength(0);
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
    expect(bodyOf(listCalls()[1]).filter.limit).toBe(0);
  });
});

describe('infinite scroll (customerlist.ts:76-97)', () => {
  test('asks for the next offset, appends after 1000 ms and completes', async () => {
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      infinite().props.onInfinite({ complete });
    });
    expect(bodyOf(listCalls()[1]).filter.limit).toBe(3);
    expect(complete).not.toHaveBeenCalled();
    await settle();
    expect(complete).toHaveBeenCalledTimes(1);
    expect(exists('customer-item-5')).toBe(true);
  });

  test('an empty page ([] == "") removes the infinite scroll; a refresh brings it back', async () => {
    installSpy();
    await mount();
    setFixtureVariant('app_karigar/sales_boy_customer_list', 'empty');
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
  test('tapping a card pushes Customerdetail with {id}', async () => {
    installSpy();
    await mount();
    await act(async () => {
      find('customer-item-1')[0].props.onPress();
    });
    expect(navigation.push).toHaveBeenCalledWith('Customerdetail', { id: 302 });
  });

  test('the fab pushes Customeradd without params', async () => {
    installSpy();
    await mount();
    await act(async () => {
      find('ion-fab-button')[0].props.onPress();
    });
    expect(navigation.push).toHaveBeenCalledWith('Customeradd');
  });

  test('the phone icon opens tel: and the click also bubbles to the card (Customerdetail)', async () => {
    installSpy();
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as any);
    await mount();
    await act(async () => {
      find('customer-dialer-0')[0].props.onPress();
    });
    expect(open).toHaveBeenCalledWith('tel:9000000301');
    expect(navigation.push).toHaveBeenCalledWith('Customerdetail', { id: 301 });
    open.mockRestore();
  });
});
