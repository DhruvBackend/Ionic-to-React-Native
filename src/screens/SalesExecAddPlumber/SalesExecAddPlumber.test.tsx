// SalesExecAddPlumber screen (Ionic SalesExecAddPlumberPage): contracts, states, response branches, navigation. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expectContract, loadContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import SalesExecAddPlumberScreen from './index';

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
    tree = ReactTestRenderer.create(<SalesExecAddPlumberScreen navigation={navigation as any} route={{ params: {} } as any} />);
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
  test('app_karigar/sales_exec/seller_dropdown: {} on mount', async () => {
    await expectContract('app_karigar/sales_exec/seller_dropdown', () => mount());
  });
  test('app_karigar/sales_exec/dealer_dropdown: {} on mount', async () => {
    await expectContract(loadContract('app_karigar/sales_exec/dealer_dropdown.SalesExecAddPlumber'), () => mount());
  });
  test('app_karigar/sales_exec/add_plumber: {plumber: form + sales_executive_id}', async () => {
    await expectContract('app_karigar/sales_exec/add_plumber', async () => {
      await mount();
      await change('dob', '1990-05-14');
      await fill();
      await change('sales_boy_id', '900002');
      await change('dealer_id', '900003');
      await press('submit');
      await settle();
    });
    expect(sentBody('app_karigar/sales_exec/add_plumber').plumber).toEqual({
      first_name: 'Ramesh Kumar',
      mobile_no: '9000000009',
      dob: '1990-05-14',
      state: 'UTTAR PRADESH',
      district: 'GHAZIABAD',
      city: 'Sahibabad',
      pincode: '201010',
      sales_boy_id: '900002',
      dealer_id: '900003',
      sales_executive_id: '900005',
    });
  });
});

describe('states (card States)', () => {
  test('default: every label, empty fields, Submit', async () => {
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Add Plumber']));
    ["Basic Information","Name","Mobile No.","Date of Birth","Address","State","District","City","Pincode","Mapping (Optional)","Select Seller","Select Dealer","Submit"].forEach(s => expect(hasText(s)).toBe(true));
    expect(host('mobile_no-input').props.value).toBe('');
    expect(hasText('Saving')).toBe(false);
  });
  test('empty lists render', async () => {
    setFixtureVariant('app_master/getStates', 'empty');
    setFixtureVariant('app_karigar/sales_exec/seller_dropdown', 'empty');
    setFixtureVariant('app_karigar/sales_exec/dealer_dropdown', 'empty');
    await mount();
    expect(hasText('Add Plumber')).toBe(true);
  });
  test('malformed lists render without throwing', async () => {
    setFixtureVariant('app_master/getStates', 'malformed');
    setFixtureVariant('app_master/getDistrict', 'malformed');
    setFixtureVariant('app_karigar/sales_exec/seller_dropdown', 'malformed');
    setFixtureVariant('app_karigar/sales_exec/dealer_dropdown', 'malformed');
    await mount();
    await change('state', 'DELHI');
    expect(hasText('Add Plumber')).toBe(true);
  });
  test('seller / dealer options come from the dropdown endpoints', async () => {
    await mount();
    expect(find('sales_boy_id').find(n => Array.isArray(n.props.options))!.props.options.map((o: any) => o.label)).toEqual([
      '\u2014 Not selected \u2014',
      'Test Seller (9000000002)',
      'Anil Sharma (9810000012)',
    ]);
    expect(find('dealer_id').find(n => Array.isArray(n.props.options))!.props.options[0]).toEqual({ value: null, label: '\u2014 Not selected \u2014' });
  });
  test('submit with no data: required errors, no request', async () => {
    await mount();
    await press('submit');
    expect(exists('mobile_no-error')).toBe(true);
    expect(hasText('Enter 10 Digits')).toBe(true);
    expect(callsTo('app_karigar/sales_exec/add_plumber')).toHaveLength(0);
  });
  test('a 9-digit mobile number is invalid: error text, no request', async () => {
    await mount();
    await fill('900000000');
    await press('submit');
    expect(hasText('Enter 10 Digits')).toBe(true);
    expect(callsTo('app_karigar/sales_exec/add_plumber')).toHaveLength(0);
    expect(alerts()).toHaveLength(0);
  });
  test('short pincode blocks the submit silently (minlength)', async () => {
    await mount();
    await fill();
    await type('pincode', '2010');
    await press('submit');
    expect(callsTo('app_karigar/sales_exec/add_plumber')).toHaveLength(0);
  });
});

describe('responses', () => {
  test('SUCCESS: "Added" alert, OK pops', async () => {
    await submit();
    expect(openLoaders()).toHaveLength(0);
    expect(alerts()[0]).toMatchObject({ title: 'Added', message: 'Plumber has been added and verified.' });
    alerts()[0].buttons[0].handler();
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
  test('EXIST: "Exists" alert', async () => {
    setFixtureVariant('app_karigar/sales_exec/add_plumber', 'EXIST');
    await submit();
    expect(alerts()[0]).toMatchObject({ title: 'Exists', message: 'This mobile number is already registered.', buttons: ['OK'] });
  });
  test('other status: "Error" alert shows the status', async () => {
    setFixtureVariant('app_karigar/sales_exec/add_plumber', 'other');
    await submit();
    expect(alerts()[0]).toMatchObject({ title: 'Error', message: 'FAILED', buttons: ['OK'] });
  });
  test('empty body: "Error" alert with the default text', async () => {
    setFixtureVariant('app_karigar/sales_exec/add_plumber', 'empty');
    await submit();
    expect(alerts()[0]).toMatchObject({ title: 'Error', message: 'Could not add plumber.' });
  });
  test('malformed (null) body: "Error" alert with the default text', async () => {
    setFixtureVariant('app_karigar/sales_exec/add_plumber', 'malformed');
    await submit();
    expect(alerts()[0]).toMatchObject({ title: 'Error', message: 'Could not add plumber.' });
  });
  test('HTTP error: loader dismissed, button back to Submit, no alert', async () => {
    setFixtureVariant('app_karigar/sales_exec/add_plumber', 'error');
    await submit();
    expect(openLoaders()).toHaveLength(0);
    expect(alerts()).toHaveLength(0);
    expect(hasText('Submit')).toBe(true);
    expect(hasText('Saving')).toBe(false);
  });
});
