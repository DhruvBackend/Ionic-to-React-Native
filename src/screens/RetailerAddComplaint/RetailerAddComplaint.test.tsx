// RetailerAddComplaint screen (Ionic RetailerAddComplaintPage): contracts, states, validation, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expectContract, loadContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import RetailerAddComplaintScreen from './index';

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

async function mount(params: Record<string, unknown> = {}) {
  await act(async () => {
    tree = ReactTestRenderer.create(<RetailerAddComplaintScreen navigation={navigation as any} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const host = (id: string) => find(id).find(n => typeof n.type === 'string')!;
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

async function fillForm(withType = true) {
  await type('first_name', 'Ramesh Kumar');
  await type('mobile_no', '9000000001');
  await type('address', '12 Rajnagar Extension');
  await change('state', 'UTTAR PRADESH');
  await change('district', 'GHAZIABAD');
  await type('city', 'Sahibabad');
  await type('pincode', '201010');
  if (withType) {
    await change('type', 'Service');
  }
  await type('nature_problem', 'Tap leaks');
}

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  calls = [];
  db.userStorageData = { id: '900001' };
  await act(async () => {
    await i18n.changeLanguage('en');
  });
  installSpy();
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

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
  test('app_karigar/addComplaint: {complaint: data} (the shared-variant contract)', async () => {
    await expectContract(
      loadContract('app_karigar/addComplaint.RetailerAddComplaint'),
      async () => {
        await mount();
        await fillForm();
        await press('submit');
      },
      { loggedIn: true },
    );
    expect(sentBody('app_karigar/addComplaint').complaint).toEqual({
      first_name: 'Ramesh Kumar', mobile_no: '9000000001', address: '12 Rajnagar Extension', state: 'UTTAR PRADESH', district: 'GHAZIABAD',
      city: 'Sahibabad', pincode: '201010', type: 'Service', nature_problem: 'Tap leaks', customer_id: '900001',
    });
  });
});

describe('states (card States)', () => {
  test('RetailerAddComplaint.default: title, headings, labels, Submit', async () => {
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Add New Complaint', 'Basic information']));
    ['Name', 'Mobile No.', 'Street', 'State', 'District', 'City', 'Pincode', 'Type', 'Nature Problem', 'Submit'].forEach(s => expect(hasText(s)).toBe(true));
  });
  test('RetailerAddComplaint.loginType: data.type comes from the loginType param', async () => {
    await mount({ loginType: 'Service' });
    expect(find('type').some(n => n.props.value === 'Service')).toBe(true);
  });
  test('RetailerAddComplaint.malformed: renders without throwing', async () => {
    setFixtureVariant('app_master/getStates', 'malformed');
    setFixtureVariant('app_master/getDistrict', 'malformed');
    await expect(mount()).resolves.toBeUndefined();
    await change('state', 'DELHI');
    expect(hasText('Basic information')).toBe(true);
  });
  test('empty lists render', async () => {
    setFixtureVariant('app_master/getStates', 'empty');
    await expect(mount()).resolves.toBeUndefined();
  });
});

describe('behaviour', () => {
  test('mobile and pincode drop non-digits', async () => {
    await mount();
    await type('mobile_no', '90a0-1');
    expect(host('mobile_no-input').props.value).toBe('9001');
    await type('pincode', '2x0');
    expect(host('pincode-input').props.value).toBe('20');
  });
  test('an invalid form does not send and shows the errors', async () => {
    await mount();
    await press('submit');
    expect(callsTo('app_karigar/addComplaint')).toHaveLength(0);
    ['first_name', 'mobile_no', 'address', 'state', 'district', 'city', 'pincode', 'type', 'nature_problem'].forEach(k =>
      expect(find(k).some(n => n.props.error === true)).toBe(true),
    );
    expect(openLoaders()).toHaveLength(0);
  });
  test('a 9 digit mobile blocks the submit', async () => {
    await mount();
    await fillForm();
    await type('mobile_no', '900000000');
    await press('submit');
    expect(callsTo('app_karigar/addComplaint')).toHaveLength(0);
  });
  test('quirk: State and Type share one control (name="state"): choosing only the Type satisfies both', async () => {
    await mount();
    await type('first_name', 'Ramesh Kumar');
    await type('mobile_no', '9000000001');
    await type('address', 'x');
    await change('district', 'GHAZIABAD');
    await type('city', 'Sahibabad');
    await type('pincode', '201010');
    await change('type', 'Service');
    await type('nature_problem', 'Tap leaks');
    await press('submit');
    expect(find('state').some(n => n.props.error === true)).toBe(false);
    expect(sentBody('app_karigar/addComplaint').complaint.state).toBeUndefined();
  });
  test('lower case success: pushes ComplaintHistory without params', async () => {
    setFixtureVariant('app_karigar/addComplaint', 'lowercaseSuccess');
    await mount();
    await fillForm();
    await press('submit');
    expect(navigation.push).toHaveBeenCalledWith('ComplaintHistory');
  });
  test('upper case SUCCESS (the default fixture): no navigation, the loader stays', async () => {
    await mount();
    await fillForm();
    await press('submit');
    expect(navigation.push).not.toHaveBeenCalled();
    expect(openLoaders()).toHaveLength(1);
  });
  test('HTTP error: the "Please wait..." loader stays, no navigation', async () => {
    setFixtureVariant('app_karigar/addComplaint', 'error');
    await mount();
    await fillForm();
    await press('submit');
    expect(openLoaders()).toHaveLength(1);
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
