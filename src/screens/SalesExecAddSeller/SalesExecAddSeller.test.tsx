// SalesExecAddSeller screen (Ionic SalesExecAddSellerPage): contracts, states, response branches, navigation. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import SalesExecAddSellerScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { goBack: jest.fn() };
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
    tree = ReactTestRenderer.create(<SalesExecAddSellerScreen navigation={navigation as any} route={{ params: {} } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const host = (id: string) => find(id).find(n => typeof n.type === 'string')!;
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const hasText = (s: string) => allText().some(x => x.includes(s));

async function type(name: string, text: string) {
  await act(async () => {
    host(`${name}-input`).props.onChangeText(text);
  });
  await settle();
}
async function change(id: string, value: unknown) {
  const el = find(id).find(n => typeof n.props.onChange === 'function')!;
  await act(async () => {
    el.props.onChange(value, { value });
  });
  await settle();
}
async function press(id: string) {
  const n = find(id).find(x => typeof x.props.onPress === 'function')!;
  await act(async () => {
    n.props.onPress({ nativeEvent: { locationX: 10, locationY: 10 } });
  });
  await settle();
}
const sentBody = (fn: string) => JSON.parse(calls.find(c => c.fn === fn)!.body ?? 'null');
const callsTo = (fn: string) => calls.filter(c => c.fn === fn);
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options as any);

async function fill(mobile = '9000000009') {
  await type('first_name', 'Ramesh Kumar');
  await type('mobile_no', mobile);
  await change('state', 'UTTAR PRADESH');
  await change('district', 'GHAZIABAD');
  await type('city', 'Sahibabad');
  await type('pincode', '201010');
}
async function submit(mobile?: string) {
  await mount();
  await fill(mobile);
  await press('submit');
  await settle();
}

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetMock();
  _resetOverlaysForTests();
  navigation.goBack.mockClear();
  calls = [];
  db.userStorageData = { id: '900005' };
  installSpy();
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

jest.setTimeout(30000);

describe('contracts (card Endpoints)', () => {
  test('app_master/getStates: GET on mount', async () => {
    await expectContract('app_master/getStates', () => mount());
  });
  test('app_master/getDistrict: {state_name} when the state changes', async () => {
    await expectContract('app_master/getDistrict', async () => {
      await mount();
      await change('state', 'DELHI');
    });
    expect(sentBody('app_master/getDistrict')).toEqual({ state_name: 'DELHI' });
  });
  test('app_karigar/sales_exec/add_seller: {seller: form + sales_executive_id}', async () => {
    await expectContract('app_karigar/sales_exec/add_seller', async () => {
      await mount();
      await fill();
      await press('submit');
      await settle();
    });
    expect(sentBody('app_karigar/sales_exec/add_seller').seller).toEqual({
      first_name: 'Ramesh Kumar',
      mobile_no: '9000000009',
      state: 'UTTAR PRADESH',
      district: 'GHAZIABAD',
      city: 'Sahibabad',
      pincode: '201010',
      sales_executive_id: '900005',
    });
  });
});

describe('states (card States)', () => {
  test('default: every label, empty fields, Submit', async () => {
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Add Seller']));
    ["Basic Information","Name","Mobile No.","Address","State","District","City","Pincode","Submit"].forEach(s => expect(hasText(s)).toBe(true));
    expect(host('mobile_no-input').props.value).toBe('');
    expect(hasText('Saving')).toBe(false);
  });
  test('empty lists render', async () => {
    setFixtureVariant('app_master/getStates', 'empty');
    await mount();
    expect(hasText('Add Seller')).toBe(true);
  });
  test('malformed lists render without throwing', async () => {
    setFixtureVariant('app_master/getStates', 'malformed');
    setFixtureVariant('app_master/getDistrict', 'malformed');
    await mount();
    await change('state', 'DELHI');
    expect(hasText('Add Seller')).toBe(true);
  });
  test('submit with no data: required errors, no request', async () => {
    await mount();
    await press('submit');
    expect(exists('mobile_no-error')).toBe(true);
    expect(hasText('Enter 10 Digits')).toBe(true);
    expect(callsTo('app_karigar/sales_exec/add_seller')).toHaveLength(0);
  });
  test('a 9-digit mobile number is invalid: error text, no request', async () => {
    await mount();
    await fill('900000000');
    await press('submit');
    expect(hasText('Enter 10 Digits')).toBe(true);
    expect(callsTo('app_karigar/sales_exec/add_seller')).toHaveLength(0);
    expect(alerts()).toHaveLength(0);
  });
  test('short pincode blocks the submit silently (minlength)', async () => {
    await mount();
    await fill();
    await type('pincode', '2010');
    await press('submit');
    expect(callsTo('app_karigar/sales_exec/add_seller')).toHaveLength(0);
  });
});

describe('responses', () => {
  test('SUCCESS: "Added" alert, OK pops', async () => {
    await submit();
    expect(openLoaders()).toHaveLength(0);
    expect(alerts()[0]).toMatchObject({ title: 'Added', message: 'Seller has been added successfully.' });
    alerts()[0].buttons[0].handler();
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
  test('EXIST: "Exists" alert', async () => {
    setFixtureVariant('app_karigar/sales_exec/add_seller', 'EXIST');
    await submit();
    expect(alerts()[0]).toMatchObject({ title: 'Exists', message: 'This mobile number is already registered.', buttons: ['OK'] });
  });
  test('other status: "Error" alert shows the status', async () => {
    setFixtureVariant('app_karigar/sales_exec/add_seller', 'other');
    await submit();
    expect(alerts()[0]).toMatchObject({ title: 'Error', message: 'FAILED', buttons: ['OK'] });
  });
  test('empty body: "Error" alert with the default text', async () => {
    setFixtureVariant('app_karigar/sales_exec/add_seller', 'empty');
    await submit();
    expect(alerts()[0]).toMatchObject({ title: 'Error', message: 'Could not add seller.' });
  });
  test('malformed (null) body: "Error" alert with the default text', async () => {
    setFixtureVariant('app_karigar/sales_exec/add_seller', 'malformed');
    await submit();
    expect(alerts()[0]).toMatchObject({ title: 'Error', message: 'Could not add seller.' });
  });
  test('HTTP error: loader dismissed, button back to Submit, no alert', async () => {
    setFixtureVariant('app_karigar/sales_exec/add_seller', 'error');
    await submit();
    expect(openLoaders()).toHaveLength(0);
    expect(alerts()).toHaveLength(0);
    expect(hasText('Submit')).toBe(true);
    expect(hasText('Saving')).toBe(false);
  });
});
