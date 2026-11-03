// AddNewComplaint screen (Ionic AddNewComplaintPage): contracts, states, response branches, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import { takePhoto } from '../../native';
import AddNewComplaintScreen from './index';

jest.mock('../../native', () => ({
  ...jest.requireActual('../../native'),
  takePhoto: jest.fn(async () => ({ ok: true, value: 'data:image/jpeg;base64,AAAA' })),
}));

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn(), reset: jest.fn() };
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

async function mount(params: Record<string, unknown> = { type: 'Service' }) {
  await act(async () => {
    tree = ReactTestRenderer.create(<AddNewComplaintScreen navigation={navigation as any} route={{ params } as any} />);
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
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options);
const sheets = () => overlayStore.getEntries().filter(e => e.kind === 'actionSheet').map(e => e.options);

async function fillForm(typeName = 'Service') {
  await type('mobile_no', '9000000001');
  await type('first_name', 'Ramesh Kumar');
  await type('address', '12 Rajnagar Extension');
  await change('state', 'UTTAR PRADESH');
  await change('district', 'GHAZIABAD');
  await type('city', 'Sahibabad');
  await type('pincode', '201010');
  await type('nature_problem', 'Tap leaks');
  return typeName;
}

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  navigation.reset.mockClear();
  (takePhoto as jest.Mock).mockClear();
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
  test('app_karigar/getCategory: {} on mount', async () => {
    await expectContract('app_karigar/getCategory', () => mount());
  });
  test('app_master/getDistrict: {state_name} when the state changes', async () => {
    await expectContract('app_master/getDistrict', async () => {
      await mount();
      await change('state', 'DELHI');
    });
    expect(sentBody('app_master/getDistrict')).toEqual({ state_name: 'DELHI' });
  });
  test('app_karigar/get_customer: {mobile_no} once the 10th digit is typed', async () => {
    await expectContract('app_karigar/get_customer', async () => {
      await mount();
      await type('mobile_no', '900000000');
      expect(callsTo('app_karigar/get_customer')).toHaveLength(0);
      await type('mobile_no', '9000000001');
    });
    expect(sentBody('app_karigar/get_customer')).toEqual({ mobile_no: '9000000001' });
  });
  test('app_karigar/addComplaint: {complaint} (full Service form with one picture)', async () => {
    await expectContract(
      'app_karigar/addComplaint',
      async () => {
        await mount();
        await fillForm();
        await press('capture-media');
        const camera = sheets()[0].buttons[0] as any;
        await act(async () => {
          camera.handler();
        });
        await press('submit');
      },
      { loggedIn: true },
    );
    expect(sentBody('app_karigar/addComplaint').complaint).toEqual({
      mobile_no: '9000000001', first_name: 'Ramesh Kumar', address: '12 Rajnagar Extension', state: 'UTTAR PRADESH', district: 'GHAZIABAD',
      city: 'Sahibabad', pincode: '201010', nature_problem: 'Tap leaks', type: 'Service', image: ['data:image/jpeg;base64,AAAA'],
      customer_id: '900001', created_by: '0',
    });
  });
});

describe('states (card States)', () => {
  test('AddNewComplaint.service: Service title, labels, upload block, Submit', async () => {
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['New Service Request', 'Customer Details', 'Upload Image']));
    ['Mobile', 'Customer Name', 'Address', 'State', 'District', 'City', 'Pincode', 'Nature Problem'].forEach(s => expect(hasText(s)).toBe(true));
    expect(hasText('Submit')).toBe(true);
    expect(exists('capture-media')).toBe(true);
  });
  test('AddNewComplaint.installation: New Request, Remark, no upload block', async () => {
    await mount({ type: 'Installation' });
    expect(hasText('New Request')).toBe(true);
    expect(hasText('New Service Request')).toBe(false);
    expect(hasText('Remark')).toBe(true);
    expect(hasText('Nature Problem')).toBe(false);
    expect(hasText('Upload Image')).toBe(false);
    expect(exists('capture-media')).toBe(false);
  });
  test('AddNewComplaint.malformed: renders without throwing', async () => {
    setFixtureVariant('app_master/getStates', 'malformed');
    setFixtureVariant('app_master/getDistrict', 'malformed');
    setFixtureVariant('app_karigar/getCategory', 'malformed');
    setFixtureVariant('app_karigar/get_customer', 'malformed');
    await expect(mount()).resolves.toBeUndefined();
    await type('mobile_no', '9000000001');
    await change('state', 'DELHI');
    expect(hasText('Customer Details')).toBe(true);
  });
  test('empty lists render', async () => {
    setFixtureVariant('app_master/getStates', 'empty');
    await expect(mount()).resolves.toBeUndefined();
  });
});

describe('behaviour', () => {
  test('an existing customer fills the form and loads the districts', async () => {
    await mount();
    await type('mobile_no', '9000000001');
    expect(host('first_name-input').props.value).toBe('Ramesh Kumar');
    expect(host('city-input').props.value).toBe('Sahibabad');
    expect(host('pincode-input').props.value).toBe('201010');
    expect(sentBody('app_master/getDistrict')).toEqual({ state_name: 'UTTAR PRADESH' });
  });
  test('deleting a digit clears the customer fields', async () => {
    await mount();
    await type('mobile_no', '9000000001');
    await type('mobile_no', '900000000');
    expect(host('first_name-input').props.value).toBe('');
    expect(host('pincode-input').props.value).toBe('');
  });
  test('NOTEXIST + Sales_Boy: alert and the number is replaced by r.customer', async () => {
    setFixtureVariant('app_karigar/get_customer', 'seller');
    await mount();
    await type('mobile_no', '9000000001');
    expect(alerts()[0]).toMatchObject({
      title: 'Alert!',
      cssClass: 'action-close',
      subTitle: '9000000001 This number is registered as Seller, please use another number to add new complaint',
      buttons: ['OK'],
    });
    expect(host('mobile_no-input').props.value).toBe('');
  });
  test('NOTEXIST + Plumber: alert and the number is cleared', async () => {
    setFixtureVariant('app_karigar/get_customer', 'plumber');
    await mount();
    await type('mobile_no', '9000000001');
    expect(alerts()[0].subTitle).toBe('9000000001 This number is registered as Plumber, please use another number to add new complaint');
    expect(host('mobile_no-input').props.value).toBe('');
  });
  test('NOTEXIST + another type: nothing happens', async () => {
    setFixtureVariant('app_karigar/get_customer', 'NOTEXIST');
    await mount();
    await type('mobile_no', '9000000001');
    expect(alerts()).toHaveLength(0);
    expect(host('mobile_no-input').props.value).toBe('9000000001');
  });
  test('an invalid form does not send and shows the errors', async () => {
    await mount();
    await press('submit');
    expect(callsTo('app_karigar/addComplaint')).toHaveLength(0);
    expect(find('first_name').some(n => n.props.error === true)).toBe(true);
    expect(find('address').some(n => n.props.error === true)).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });
  test('a 5 digit pincode blocks the submit', async () => {
    await mount();
    await fillForm();
    await type('pincode', '20101');
    await press('submit');
    expect(callsTo('app_karigar/addComplaint')).toHaveLength(0);
  });
  test('Service: Success! alert and setRoot(Tabs, {index:"0"})', async () => {
    await mount();
    await fillForm();
    await press('submit');
    expect(alerts().map(a => [a.title, a.subTitle])).toEqual([['Success!', 'New Service request submitted successfully!']]);
    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Tabs', params: { index: '0' } }] });
    expect(openLoaders()).toHaveLength(0);
  });
  test('Installation: Success! alert, image is []', async () => {
    await mount({ type: 'Installation' });
    await fillForm();
    await press('submit');
    expect(alerts().map(a => a.subTitle)).toEqual(['New Installation request submitted successfully!']);
    expect(sentBody('app_karigar/addComplaint').complaint.image).toEqual([]);
    expect(navigation.reset).toHaveBeenCalled();
  });
  test('HTTP error: the "Please wait..." loader stays, no navigation', async () => {
    setFixtureVariant('app_karigar/addComplaint', 'error');
    await mount();
    await fillForm();
    await press('submit');
    expect(openLoaders()).toHaveLength(1);
    expect(navigation.reset).not.toHaveBeenCalled();
  });
  test('camera tile: Complaint Media sheet; Camera 100% 1000x1000, Gallery 70; a picture can be removed', async () => {
    await mount();
    await press('capture-media');
    expect(sheets()[0]).toMatchObject({ title: 'Complaint Media', cssClass: 'cs-actionsheet' });
    expect((sheets()[0].buttons as any[]).map(b => b.text)).toEqual(['Camera', 'Gallery', 'Cancel']);
    await act(async () => {
      (sheets()[0].buttons[0] as any).handler();
    });
    expect(takePhoto).toHaveBeenLastCalledWith('camera', { quality: 100, maxWidth: 1000, maxHeight: 1000 });
    await act(async () => {
      (sheets()[0].buttons[1] as any).handler();
    });
    expect(takePhoto).toHaveBeenLastCalledWith('gallery', { quality: 70 });
    expect(exists('image-1')).toBe(true);
    await press('remove-image-0');
    expect(exists('image-1')).toBe(false);
    expect(exists('image-0')).toBe(true);
  });
});
