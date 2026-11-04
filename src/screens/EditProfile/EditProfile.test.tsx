// EditProfile screen (Ionic EditProfilePage): contracts, states, response branches, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expectContract, loadContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import { takePhoto } from '../../native';
import EditProfileScreen from './index';

jest.setTimeout(20000); // the first render of a cold run is slow on a busy machine

jest.mock('../../native', () => ({
  ...jest.requireActual('../../native'),
  takePhoto: jest.fn(async () => ({ ok: true, value: 'data:image/jpeg;base64,AAAA' })),
}));

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { reset: jest.fn(), goBack: jest.fn() };
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

const detail = (extra: Record<string, unknown> = {}) => ({
  id: '900001', first_name: 'Test Plumber', mobile_no: '9000000001', type: 'Plumber', country: 'India', dob: '1990-05-14',
  sales_boy_name: 'Sunil', sales_boy_mobile_no: '9810000012', dealer_contact_person: 'Mohan Lal', dealer_mobile: '9810000013',
  address: '12 Rajnagar Extension', state: 'DELHI', district: 'AGRA', city: 'Sahibabad', pincode: '201010',
  permanent_address: 'Old Street', permanent_state: 'HARYANA', parmanent_district: 'AGRA', permanent_city: 'Agra', permanent_pincode: '282001',
  document_type: 'PanCard', document_no: 'ABCDE1234F', document_image: 'doc/1.jpg',
  ...extra,
});

async function mount(params: Record<string, unknown> = { detail: detail() }) {
  await act(async () => {
    tree = ReactTestRenderer.create(<EditProfileScreen navigation={navigation as any} route={{ params } as any} />);
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
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options);
const sheets = () => overlayStore.getEntries().filter(e => e.kind === 'actionSheet').map(e => e.options);

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetMock();
  _resetOverlaysForTests();
  navigation.reset.mockClear();
  navigation.goBack.mockClear();
  (takePhoto as jest.Mock).mockClear();
  calls = [];
  db.userStorageData = { id: '900001', type: 'Plumber' };
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
  test('app_master/getDistrict: {state_name} on mount (working address)', async () => {
    await expectContract('app_master/getDistrict', () => mount());
    expect(callsTo('app_master/getDistrict').map(c => JSON.parse(c.body!))).toEqual([{ state_name: 'DELHI' }, { state_name: 'HARYANA' }]);
  });
  test('app_master/getDistrict: {state_name} when the state changes', async () => {
    await mount();
    calls = [];
    await change('state', 'RAJASTHAN');
    expect(callsTo('app_master/getDistrict').map(c => JSON.parse(c.body!))).toEqual([{ state_name: 'RAJASTHAN' }]);
    calls = [];
    await change('permanent_state', 'DELHI');
    expect(callsTo('app_master/getDistrict').map(c => JSON.parse(c.body!))).toEqual([{ state_name: 'DELHI' }]);
  });
  test('app_karigar/addKarigar: {karigar: detail + karigar_edit_id}', async () => {
    await expectContract(
      loadContract('app_karigar/addKarigar.EditProfile'),
      async () => {
        await mount();
        await press('edit-profile-submit');
        await settle();
      },
      { loggedIn: true },
    );
    const k = sentBody('app_karigar/addKarigar').karigar;
    expect(k).toMatchObject({ karigar_edit_id: '900001', first_name: 'Test Plumber', pincode: '201010' });
    // NOTE (parity): the SafeResourceUrl wrapper is serialised
    expect(k.document_image).toEqual({ changingThisBreaksApplicationSecurity: 'doc/1.jpg' });
  });
});

describe('states (card States)', () => {
  test('Plumber: every section; the Plumber mobile number is disabled', async () => {
    await mount();
    [
      'Edit Profile', 'Basic information', 'Name', 'Mobile No.', 'Date of Birth', 'Seller Name', 'Seller Mobile No', 'Dealer Name', 'Dealer Mobile No',
      'Document Information', 'Select Document*', 'Pan Card Number', 'Working Address', 'Street', 'State', 'District', 'City', 'Pincode',
      'Same as Working Address', 'Permanent Address', 'Update',
    ].forEach(s => expect(hasText(s)).toBe(true));
    expect(hasText('Address information')).toBe(false);
    expect(host('first_name-input').props.value).toBe('Test Plumber');
    expect(host('mobile_no-input').props.editable).toBe(false);
    expect(host('sales_boy_name-input').props.editable).toBe(false);
  });
  test('Customer: Address information, no Plumber-only sections, editable mobile', async () => {
    await mount({ detail: detail({ type: 'Customer' }) });
    expect(hasText('Address information')).toBe(true);
    ['Working Address', 'Document Information', 'Date of Birth', 'Permanent Address', 'Same as Working Address'].forEach(s => expect(hasText(s)).toBe(false));
    expect(host('mobile_no-input').props.editable).toBe(true);
  });
  test('Dealer: no address heading at all', async () => {
    await mount({ detail: detail({ type: 'Dealer' }) });
    expect(hasText('Address information')).toBe(false);
    expect(hasText('Working Address')).toBe(false);
    expect(hasText('Street')).toBe(true);
  });
  test('document number field follows the document type (India)', async () => {
    await mount({ detail: detail({ document_type: 'Adharcard' }) });
    expect(hasText('Aadhaar Number*')).toBe(true);
    await change('document_type', 'VoterCard');
    expect(hasText('Voter Card Number')).toBe(true);
    await change('document_type', 'DrivingLicense');
    expect(hasText('Driving License Number')).toBe(true);
  });
  test('Nepal: Citizenship Card number field', async () => {
    await mount({ detail: detail({ country: 'Nepal', document_type: 'CitizenshipCard' }) });
    expect(hasText('Citizenship Card Number')).toBe(true);
  });
  test('the document picture shows in the box; the "Upload Document" prompt never shows (Safe URL object)', async () => {
    await mount({ detail: detail({ document_image: '' }) });
    expect(exists('upload-document-prompt')).toBe(false);
  });
  test('Sales_Executive: "Profile Locked" alert (OK pops), no request', async () => {
    db.userStorageData = { id: '1', type: 'Sales_Executive' };
    await mount();
    expect(alerts()[0]).toMatchObject({ title: 'Profile Locked', message: 'Your profile can only be updated from the admin panel.' });
    await act(async () => {
      (alerts()[0] as any).buttons[0].handler();
    });
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(calls.filter(c => c.fn.startsWith('app_'))).toHaveLength(0);
  });
  test('no detail param: nothing renders (Ionic throws in the constructor)', async () => {
    await mount({});
    expect(hasText('Edit Profile')).toBe(false);
  });
  test('malformed states / districts render without throwing', async () => {
    setFixtureVariant('app_master/getStates', 'malformed');
    setFixtureVariant('app_master/getDistrict', 'malformed');
    await mount();
    expect(hasText('Edit Profile')).toBe(true);
  });
  test('hin: labels come from the global language', async () => {
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(hasText('Update')).toBe(false);
  });
});

describe('quirks', () => {
  test('Name accepts letters, + - and space only; pincode digits only', async () => {
    await mount();
    await type('first_name', 'Ra1m+e-sh K.umar');
    expect(host('first_name-input').props.value).toBe('Ram+e-sh Kumar');
    await type('pincode', '20a1');
    expect(host('pincode-input').props.value).toBe('201');
  });
  test('Street upper-cases the first letter of every word', async () => {
    await mount();
    await type('address', 'plot 5, main road');
    expect(host('address-input').props.value).toBe('Plot 5, Main Road');
  });
  test('invalid form: no request (and no scroll, no loader)', async () => {
    await mount();
    await type('first_name', '');
    await press('edit-profile-submit');
    expect(callsTo('app_karigar/addKarigar')).toHaveLength(0);
  });
  test('a 5-digit pincode blocks the submit', async () => {
    await mount();
    await type('pincode', '20101');
    await press('edit-profile-submit');
    expect(callsTo('app_karigar/addKarigar')).toHaveLength(0);
  });
  test('Same as Working Address copies the address and reloads the PERMANENT districts', async () => {
    await mount();
    calls = [];
    await change('same-address', { checked: true });
    expect(host('permanent_address-input').props.value).toBe('12 Rajnagar Extension');
    expect(host('permanent_city-input').props.value).toBe('Sahibabad');
    expect(host('permanent_pincode-input').props.value).toBe('201010');
    expect(callsTo('app_master/getDistrict').map(c => JSON.parse(c.body!))).toEqual([{ state_name: 'DELHI' }]);
    await change('same-address', { checked: false });
    expect(host('permanent_city-input').props.value).toBe('');
  });
  test('Upload Document: sheet " Upload File" with Camera / Gallery / Cancel', async () => {
    await mount();
    await press('upload-document');
    const sheet = sheets()[0] as any;
    expect(sheet.title).toBe(' Upload File');
    expect(sheet.cssClass).toBe('cs-actionsheet');
    expect(sheet.buttons.map((b: any) => b.text)).toEqual(['Camera', 'Gallery', 'Cancel']);
  });
  test('Camera: quality 70, 500 x 400; Gallery: quality 70; the picture is sent as a data: string', async () => {
    await mount();
    await press('upload-document');
    await act(async () => {
      (sheets()[0] as any).buttons[0].handler();
    });
    await settle();
    expect(takePhoto).toHaveBeenCalledWith('camera', { quality: 70, maxWidth: 500, maxHeight: 400 });
    await act(async () => {
      (sheets()[0] as any).buttons[1].handler();
    });
    await settle();
    expect(takePhoto).toHaveBeenCalledWith('gallery', { quality: 70 });
    await press('edit-profile-submit');
    expect(sentBody('app_karigar/addKarigar').karigar.document_image).toBe('data:image/jpeg;base64,AAAA');
  });
});

describe('addKarigar branches and navigation', () => {
  test('any answer: "Success!" alert and setRoot(Tabs {index:"0"}), no loader', async () => {
    await mount();
    await press('edit-profile-submit');
    expect(alerts()[0]).toMatchObject({ title: 'Success!', cssClass: 'action-close', subTitle: 'Profile Updated Successfully!', buttons: ['OK'] });
    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Tabs', params: { index: '0' } }] });
    expect(overlayStore.getEntries().filter(e => e.kind === 'loading')).toHaveLength(0);
  });
  test('status EXIST is ignored too', async () => {
    setFixtureVariant('app_karigar/addKarigar', 'EXIST');
    await mount();
    await press('edit-profile-submit');
    expect(alerts()[0]).toMatchObject({ title: 'Success!' });
    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Tabs', params: { index: '0' } }] });
  });
  test('malformed (null body): same Success! and Tabs 0', async () => {
    setFixtureVariant('app_karigar/addKarigar', 'malformed');
    await mount();
    await press('edit-profile-submit');
    expect(alerts()[0]).toMatchObject({ title: 'Success!' });
    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Tabs', params: { index: '0' } }] });
  });
  test('HTTP error: the same "Success!" alert, Tabs on index "4"', async () => {
    setFixtureVariant('app_karigar/addKarigar', 'error');
    await mount();
    await press('edit-profile-submit');
    expect(alerts()[0]).toMatchObject({ title: 'Success!', subTitle: 'Profile Updated Successfully!' });
    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Tabs', params: { index: '4' } }] });
  });
});
