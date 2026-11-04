// Enquiry screen (Ionic EnquiryPage): contract, states, response branches, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import EnquiryScreen from './index';

jest.setTimeout(20000); // the first render of a cold run is slow on a busy machine
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { reset: jest.fn() };
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

async function settle(ms = 350, rounds = 3) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
  }
}

async function mount(params: Record<string, unknown> = { id: '77' }) {
  await act(async () => {
    tree = ReactTestRenderer.create(<EnquiryScreen navigation={navigation as any} route={{ params } as any} />);
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
async function press(id: string) {
  const n = find(id).find(x => typeof x.props.onPress === 'function')!;
  await act(async () => {
    n.props.onPress({ nativeEvent: { locationX: 10, locationY: 10 } });
  });
  await settle();
}
const sentBody = (fn: string) => JSON.parse(calls.find(c => c.fn === fn)!.body ?? 'null');
const callsTo = (fn: string) => calls.filter(c => c.fn === fn);
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options);

async function fillAndSubmit() {
  await mount();
  await type('customerEmail', 'ramesh@example.com');
  await type('customerInformation', 'Need a quotation');
  await press('enquiry-submit');
  await settle();
}

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetMock();
  _resetOverlaysForTests();
  navigation.reset.mockClear();
  calls = [];
  db.userStorageData = { id: '900002', first_name: 'Ramesh Kumar', mobile_no: '9000000001' };
  installSpy();
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contract (card Endpoints)', () => {
  test('app_karigar/enquiryForProduct: {contactDetails} from the form', async () => {
    await expectContract('app_karigar/enquiryForProduct', fillAndSubmit, { loggedIn: true });
    expect(sentBody('app_karigar/enquiryForProduct').contactDetails).toEqual({
      customerName: 'Ramesh Kumar',
      customerMobileNo: '9000000001',
      customerEmail: 'ramesh@example.com',
      customerInformation: 'Need a quotation',
      product_id: '77',
    });
  });
});

describe('states (card States)', () => {
  test('default: header, intro text, four labelled fields, SUBMIT; name and mobile prefilled', async () => {
    await mount();
    ['enquiry', 'Please fill In this form below, we will get back to you soon as poosible', 'Name', 'Email ID', 'Mobile No.', 'Enquiry Message', 'SUBMIT'].forEach(s =>
      expect(hasText(s)).toBe(true),
    );
    expect(host('customerName-input').props.value).toBe('Ramesh Kumar');
    expect(host('customerMobileNo-input').props.value).toBe('9000000001');
    expect(host('customerEmail-input').props.value).toBe('');
  });
  test('no stored user: the prefill is skipped (Ionic throws in ionViewDidLoad)', async () => {
    db.userStorageData = undefined;
    await mount();
    expect(host('customerName-input').props.value).toBe('');
  });
  test('malformed answer (null body) renders and submits without throwing', async () => {
    setFixtureVariant('app_karigar/enquiryForProduct', 'malformed');
    await fillAndSubmit();
    expect(alerts()).toHaveLength(0);
    expect(navigation.reset).not.toHaveBeenCalled();
  });
});

describe('quirks', () => {
  test('Name accepts letters, + - and space only; Mobile accepts digits, + - and space', async () => {
    await mount();
    await type('customerName', 'Ra1m+e-sh K.umar');
    expect(host('customerName-input').props.value).toBe('Ram+e-sh Kumar');
    await type('customerMobileNo', '90a0+-0 1');
    expect(host('customerMobileNo-input').props.value).toBe('900+-0 1');
  });
  test('an invalid form sends nothing', async () => {
    await mount();
    await press('enquiry-submit');
    expect(callsTo('app_karigar/enquiryForProduct')).toHaveLength(0);
  });
  test('a malformed e-mail address blocks the submit', async () => {
    await mount();
    await type('customerEmail', 'ramesh@example');
    await type('customerInformation', 'x');
    await press('enquiry-submit');
    expect(callsTo('app_karigar/enquiryForProduct')).toHaveLength(0);
  });
  test('a 9-character mobile number blocks the submit', async () => {
    await mount();
    await type('customerMobileNo', '900000000');
    await type('customerEmail', 'ramesh@example.com');
    await type('customerInformation', 'x');
    await press('enquiry-submit');
    expect(callsTo('app_karigar/enquiryForProduct')).toHaveLength(0);
  });
});

describe('response branches and navigation', () => {
  test('"Product Enquiry successfully.": ThankYou! alert and setRoot(Tabs {index:"0"})', async () => {
    await fillAndSubmit();
    expect(alerts()[0]).toMatchObject({ title: 'ThankYou!', subTitle: 'Your Enquiry mail has been successfully sent', buttons: ['OK'] });
    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Tabs', params: { index: '0' } }] });
  });
  test('any other status: nothing happens', async () => {
    setFixtureVariant('app_karigar/enquiryForProduct', 'other');
    await fillAndSubmit();
    expect(alerts()).toHaveLength(0);
    expect(navigation.reset).not.toHaveBeenCalled();
  });
  test('HTTP error: nothing happens (no error callback in Ionic)', async () => {
    setFixtureVariant('app_karigar/enquiryForProduct', 'error');
    await fillAndSubmit();
    expect(alerts()).toHaveLength(0);
    expect(navigation.reset).not.toHaveBeenCalled();
  });
});
