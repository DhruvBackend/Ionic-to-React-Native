// PlumberAdd screen (Ionic PlumberAddPage): contracts, states, response branches, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expectContract, loadContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import { takePhoto } from '../../native';
import PlumberAddScreen from './index';

jest.mock('../../native', () => ({
  ...jest.requireActual('../../native'),
  takePhoto: jest.fn(async () => ({ ok: true, value: 'data:image/jpeg;base64,AAAA' })),
}));

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { popTo: jest.fn() };
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

const NEW = { mobile_no: '9000000001' };
const EDIT = {
  data: {
    id: '900001', first_name: 'Test Plumber', mobile_no: '9000000001', type: 'Plumber', status: 'Verified', dob: '1990-05-14',
    address: '12 Rajnagar Extension', state: 'UTTAR PRADESH', district: 'GHAZIABAD', city: 'Sahibabad', pincode: '201010',
    document_type: 'PanCard', document_no: 'ABCDE1234F', document_image: 'doc/1.jpg',
  },
};
const editParams = () => ({ data: { ...EDIT.data } });

async function mount(params: Record<string, unknown> = NEW) {
  await act(async () => {
    tree = ReactTestRenderer.create(<PlumberAddScreen navigation={navigation as any} route={{ params } as any} />);
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

async function fillRequired() {
  await type('first_name', 'Ramesh Kumar');
  await change('state', 'UTTAR PRADESH');
  await change('district', 'GHAZIABAD');
  await type('city', 'Sahibabad');
}
async function submitNew(params: Record<string, unknown> = NEW) {
  await mount(params);
  await fillRequired();
  await press('plumber-add-submit');
  await settle();
}

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetMock();
  _resetOverlaysForTests();
  navigation.popTo.mockClear();
  (takePhoto as jest.Mock).mockClear();
  calls = [];
  db.userStorageData = { id: '900002' };
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
  test('app_karigar/addKarigar: {karigar: data} (full Plumber form)', async () => {
    await expectContract(
      loadContract('app_karigar/addKarigar.PlumberAdd'),
      async () => {
        await mount();
        await type('first_name', 'Ramesh Kumar');
        await change('dob', '1990-05-14');
        await type('dealer_contact_person', 'Mohan Lal');
        await type('dealer_mobile', '9810000013');
        await type('address', 'rajnagar extension');
        await change('state', 'UTTAR PRADESH');
        await change('district', 'GHAZIABAD');
        await type('city', 'Sahibabad');
        await type('pincode', '201010');
        await type('permanent_address', 'Old Street');
        await change('permanent_state', 'DELHI');
        await change('parmanent_district', 'AGRA');
        await type('permanent_city', 'Agra');
        await type('permanent_pincode', '282001');
        await change('document_type', 'AadhaarCard');
        await type('document_no', '123456789012');
        await type('bank_name', 'Test Bank');
        await type('account_number', '12345678');
        await type('ifsc_code', 'ABCD0123456');
        await type('account_holder_name', 'Ramesh Kumar');
        await type('referral_by_code', 'REF1');
        await press('plumber-add-submit');
        await settle();
      },
      { loggedIn: true },
    );
    expect(sentBody('app_karigar/addKarigar').karigar).toMatchObject({
      mobile_no: '9000000001', type: 'Plumber', sales_boy_id: '900002', profile: '', document_image: '', certificate_image: '', status: 'Pending',
      karigar_edit_id: '', flag: 1, address: 'Rajnagar Extension', document_no: '123456789012',
    });
  });
  test('addKarigar: untouched fields have no key', async () => {
    await submitNew();
    expect(Object.keys(sentBody('app_karigar/addKarigar').karigar).sort()).toEqual(
      ['certificate_image', 'city', 'district', 'document_image', 'first_name', 'flag', 'karigar_edit_id', 'mobile_no', 'profile', 'sales_boy_id', 'state', 'status', 'type'],
    );
  });
});

describe('states (card States)', () => {
  test('default (Plumber): every section, stars, Submit', async () => {
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Add New Plumber', 'Submit']));
    [
      'Basic information', 'Name', 'Mobile No.', 'Date of Birth', 'Dealer Name', 'Dealer Mobile No.', 'Address information', 'Address', 'State', 'District',
      'City', 'Pincode', 'Same as Working Address', 'Permanent Address', 'Document Information', 'Select Document', 'Upload Document', 'Bank Detail',
      'Bank Name', 'Account Number', 'IFSC Code', 'Account Holder Name', 'Referral Code',
    ].forEach(s => expect(hasText(s)).toBe(true));
    expect(host('mobile_no-input').props.value).toBe('9000000001');
    expect(hasText('Update')).toBe(false);
  });
  test('edit (data param): Update, no Referral Code, saved values, saved picture', async () => {
    await mount(editParams());
    expect(hasText('Update')).toBe(true);
    expect(hasText('Referral Code')).toBe(false);
    expect(host('first_name-input').props.value).toBe('Test Plumber');
    expect(hasText('Pan Card Number')).toBe(true);
    expect(exists('upload-document-prompt')).toBe(false);
    expect(sentBody('app_master/getDistrict')).toEqual({ state_name: 'UTTAR PRADESH' });
  });
  test('Sales_Boy: no Permanent Address section', async () => {
    await mount({ data: { ...EDIT.data, type: 'Sales_Boy' } });
    expect(hasText('Permanent Address')).toBe(false);
    expect(hasText('Same as Working Address')).toBe(false);
    expect(hasText('Document Information')).toBe(true);
  });
  test('Dealer: only the basic and address sections', async () => {
    await mount({ data: { ...EDIT.data, type: 'Dealer' } });
    expect(hasText('Date of Birth')).toBe(false);
    expect(hasText('Document Information')).toBe(false);
    expect(hasText('Bank Detail')).toBe(false);
  });
  test('document number field follows the document type', async () => {
    await mount();
    expect(hasText('Aadhaar Number')).toBe(false);
    await change('document_type', 'AadhaarCard');
    expect(hasText('Aadhaar Number')).toBe(true);
    await change('document_type', 'VoterCard');
    expect(hasText('Voter Card Number')).toBe(true);
    await change('document_type', 'DrivingLicense');
    expect(hasText('Driving License Number')).toBe(true);
  });
  test('malformed states / districts render without throwing', async () => {
    setFixtureVariant('app_master/getStates', 'malformed');
    setFixtureVariant('app_master/getDistrict', 'malformed');
    await mount(editParams());
    expect(hasText('Add New Plumber')).toBe(true);
  });
  test('hin: labels come from the global language', async () => {
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(hasText('Add New Plumber')).toBe(true);
  });
});

describe('quirks', () => {
  test('Name accepts letters, + - and space only; mobile and pincode digits only', async () => {
    await mount();
    await type('first_name', 'Ra1m+e-sh K.umar');
    expect(host('first_name-input').props.value).toBe('Ram+e-sh Kumar');
    await type('mobile_no', '90a00');
    expect(host('mobile_no-input').props.value).toBe('9000');
    await type('pincode', '20a1');
    expect(host('pincode-input').props.value).toBe('201');
  });
  test('Address upper-cases the first letter of every word', async () => {
    await mount();
    await type('address', 'plot 5, main road');
    expect(host('address-input').props.value).toBe('Plot 5, Main Road');
  });
  test('submit with a required field empty: no request, no loader', async () => {
    await mount();
    await press('plumber-add-submit');
    expect(callsTo('app_karigar/addKarigar')).toHaveLength(0);
    expect(openLoaders()).toHaveLength(0);
  });
  test('7-digit dealer mobile is invalid and shows Enter 10 Digits only after submit', async () => {
    await mount();
    await type('dealer_mobile', '98100');
    expect(hasText('Enter 10 Digits')).toBe(false);
    await press('plumber-add-submit');
    expect(hasText('Enter 10 Digits')).toBe(true);
    expect(callsTo('app_karigar/addKarigar')).toHaveLength(0);
  });
  test('a wrong IFSC code blocks the submit', async () => {
    await mount();
    await fillRequired();
    await type('ifsc_code', 'abcd');
    await press('plumber-add-submit');
    expect(callsTo('app_karigar/addKarigar')).toHaveLength(0);
  });
  test('Same as Working Address copies the working address and reloads the districts', async () => {
    await mount();
    await type('address', 'rajnagar');
    await change('state', 'UTTAR PRADESH');
    await change('district', 'GHAZIABAD');
    await type('city', 'Sahibabad');
    await type('pincode', '201010');
    calls = [];
    await change('same-address', { checked: true });
    expect(host('permanent_address-input').props.value).toBe('Rajnagar');
    expect(host('permanent_city-input').props.value).toBe('Sahibabad');
    expect(host('permanent_pincode-input').props.value).toBe('201010');
    expect(sentBody('app_master/getDistrict')).toEqual({ state_name: 'UTTAR PRADESH' });
    await change('same-address', { checked: false });
    expect(host('permanent_city-input').props.value).toBe('');
  });
  test('the permanent state select does not load districts (getDistrictList1 does not exist in Ionic)', async () => {
    await mount();
    calls = [];
    await change('permanent_state', 'DELHI');
    expect(callsTo('app_master/getDistrict')).toHaveLength(0);
  });
  test('Upload Document: sheet " Upload File" with Camera / Gallery / Cancel', async () => {
    await mount();
    await press('upload-document');
    const sheet = sheets()[0] as any;
    expect(sheet.title).toBe(' Upload File');
    expect(sheet.cssClass).toBe('cs-actionsheet');
    expect(sheet.buttons.map((b: any) => b.text)).toEqual(['Camera', 'Gallery', 'Cancel']);
  });
  test('Camera: quality 70, 500 x 400; the picture replaces the prompt', async () => {
    await mount();
    await press('upload-document');
    await act(async () => {
      (sheets()[0] as any).buttons[0].handler();
    });
    await settle();
    expect(takePhoto).toHaveBeenCalledWith('camera', { quality: 70, maxWidth: 500, maxHeight: 400 });
    expect(exists('upload-document-prompt')).toBe(false);
  });
  test('Gallery: quality 70, no resize', async () => {
    await mount();
    await press('upload-document');
    await act(async () => {
      (sheets()[0] as any).buttons[1].handler();
    });
    expect(takePhoto).toHaveBeenCalledWith('gallery', { quality: 70 });
  });
});

describe('addKarigar branches and navigation', () => {
  test('SUCCESS: loader closes and popTo(PlumberList)', async () => {
    await submitNew();
    expect(openLoaders()).toHaveLength(0);
    expect(navigation.popTo).toHaveBeenCalledWith('PlumberList');
  });
  test('EXIST: "Already Registered!" alert, no navigation', async () => {
    setFixtureVariant('app_karigar/addKarigar', 'EXIST');
    await submitNew();
    expect(alerts()[0]).toMatchObject({ title: 'Alert!', subTitle: 'Already Registered!', buttons: ['OK'] });
    expect(navigation.popTo).not.toHaveBeenCalled();
  });
  test('other status: loader closes, nothing else', async () => {
    setFixtureVariant('app_karigar/addKarigar', 'other');
    await submitNew();
    expect(openLoaders()).toHaveLength(0);
    expect(alerts()).toHaveLength(0);
    expect(navigation.popTo).not.toHaveBeenCalled();
  });
  test('malformed (null body): loader closes, nothing else', async () => {
    setFixtureVariant('app_karigar/addKarigar', 'malformed');
    await submitNew();
    expect(openLoaders()).toHaveLength(0);
    expect(navigation.popTo).not.toHaveBeenCalled();
  });
  test('HTTP error: the loader stays up (no error callback in Ionic)', async () => {
    setFixtureVariant('app_karigar/addKarigar', 'error');
    await submitNew();
    expect(openLoaders()).toHaveLength(1);
  });
  test('edit: karigar_edit_id is the record id', async () => {
    await mount(editParams());
    await press('plumber-add-submit');
    expect(sentBody('app_karigar/addKarigar').karigar.karigar_edit_id).toBe('900001');
  });
});
