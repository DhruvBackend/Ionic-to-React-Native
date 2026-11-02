// Registration screen (Ionic RegistrationPage): contracts, states, response branches, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import loginFixture from '../../api/fixtures/auth__login.json';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import RegistrationScreen from './index';

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

const NEW = { mobile_no: '9000000001', loginType: 'Plumber' };
const EDIT = {
  data: {
    id: '900001', first_name: 'Test Plumber', mobile_no: '9000000001', type: 'Plumber', status: 'Verified', dob: '1990-05-14',
    address: '12 Rajnagar Extension', state: 'UTTAR PRADESH', district: 'GHAZIABAD', city: 'Sahibabad', pincode: '201010',
    sales_boy_name: 'Anil Sharma', sales_boy_mobile_no: '9810000012', dealer_contact_person: 'Mohan Lal', dealer_mobile: '9810000013',
    sales_executive_id: '900014', sales_boy_id: '900012', dealer_id: '900013',
  },
};
const editParams = () => ({ data: { ...EDIT.data } });

async function mount(params: Record<string, unknown> = NEW) {
  await act(async () => {
    tree = ReactTestRenderer.create(<RegistrationScreen navigation={navigation as any} route={{ params } as any} />);
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
}
// the composite (IonSelect / IonDatetime / IonicSelectable) carries the ngModelChange handler
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
}
const sentBody = (fn: string) => JSON.parse(calls.find(c => c.fn === fn)!.body ?? 'null');
const callsTo = (fn: string) => calls.filter(c => c.fn === fn);
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options);
const stored = async () => JSON.parse((await AsyncStorage.getItem('userStorageData')) ?? 'null');

async function fillPlumber() {
  await type('first_name', 'Ramesh Kumar');
  await change('dob', '1990-05-14');
  await type('address', 'rajnagar extension');
  await change('state', 'UTTAR PRADESH');
  await change('district', 'GHAZIABAD');
  await type('city', 'Sahibabad');
  await type('pincode', '201010');
  await type('sales_boy_name', 'Anil Sharma');
  await type('sales_boy_mobile_no', '9810000012');
  await type('dealer_contact_person', 'Mohan Lal');
  await type('dealer_mobile', '9810000013');
  await change('sales_executive_id', { id: '900014', first_name: 'Rakesh Verma', mobile_no: '9810000014' });
}
async function submitNew(params: Record<string, unknown> = NEW, name = 'Ramesh Kumar') {
  await mount(params);
  await type('first_name', name);
  await press('registration-submit');
  await settle();
}

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  calls = [];
  db.userStorageData = null;
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
  test('app_karigar/sales_exec/sales_executive_dropdown: {} on mount for a Plumber', async () => {
    await expectContract('app_karigar/sales_exec/sales_executive_dropdown', () => mount());
  });
  test('app_master/getDistrict: {state_name} when the state changes', async () => {
    await expectContract('app_master/getDistrict', async () => {
      await mount();
      await change('state', 'DELHI');
    });
    expect(sentBody('app_master/getDistrict')).toEqual({ state_name: 'DELHI' });
  });
  test('app_karigar/seller_list (post_rqst): {filter:{state, search}} when the state changes', async () => {
    await expectContract('app_karigar/seller_list', async () => {
      await mount();
      await change('state', 'DELHI');
    });
    expect(sentBody('app_karigar/seller_list')).toEqual({ filter: { state: 'DELHI', search: '' } });
  });
  test('app_karigar/sales_exec/dealer_dropdown: {state} when a Plumber changes the state', async () => {
    await expectContract('app_karigar/sales_exec/dealer_dropdown', async () => {
      await mount();
      await change('state', 'DELHI');
    });
  });
  test('dealer_dropdown is not called for a Sales_Boy', async () => {
    await mount({ ...NEW, loginType: 'Sales_Boy' });
    await change('state', 'DELHI');
    expect(callsTo('app_karigar/sales_exec/dealer_dropdown')).toHaveLength(0);
    expect(callsTo('app_karigar/sales_exec/sales_executive_dropdown')).toHaveLength(0);
  });
  test('app_karigar/addKarigar: {karigar: data} (full Plumber form)', async () => {
    setFixtureVariant('auth/login', 'other');
    await expectContract('app_karigar/addKarigar', async () => {
      await mount();
      await fillPlumber();
      await press('registration-submit');
      await settle();
    });
    expect(sentBody('app_karigar/addKarigar')).toEqual({
      karigar: {
        mobile_no: '9000000001', type: 'Plumber', sales_boy_id: '', profile: '', document_image: '', certificate_image: '', status: 'Pending',
        karigar_edit_id: '', first_name: 'Ramesh Kumar', dob: '1990-05-14', address: 'Rajnagar Extension', state: 'UTTAR PRADESH',
        district: 'GHAZIABAD', city: 'Sahibabad', pincode: '201010', sales_boy_name: 'Anil Sharma', sales_boy_mobile_no: '9810000012',
        dealer_contact_person: 'Mohan Lal', dealer_mobile: '9810000013', sales_executive_id: '900014',
      },
    });
  });
  test('app_karigar/addKarigar: untouched fields have no key (Sales_Boy)', async () => {
    setFixtureVariant('auth/login', 'other');
    await submitNew({ ...NEW, loginType: 'Sales_Boy' });
    expect(Object.keys(sentBody('app_karigar/addKarigar').karigar).sort()).toEqual(
      ['certificate_image', 'document_image', 'first_name', 'karigar_edit_id', 'mobile_no', 'profile', 'sales_boy_id', 'status', 'type'],
    );
  });
  test('auth/login: {mobile_no, mode: "App"} after addKarigar SUCCESS', async () => {
    setFixtureVariant('auth/login', 'other');
    await expectContract('auth/login', () => submitNew(), { loggedIn: false });
    expect(sentBody('auth/login')).toEqual({ mobile_no: '9000000001', mode: 'App' });
  });
  test('edit mode: app_karigar/seller_dropdown {} and seller_list with the saved state', async () => {
    await expectContract('app_karigar/sales_exec/seller_dropdown', () => mount(editParams()), { loggedIn: true });
    expect(sentBody('app_karigar/seller_list')).toEqual({ filter: { state: 'UTTAR PRADESH', search: '' } });
    expect(sentBody('app_master/getDistrict')).toEqual({ state_name: 'UTTAR PRADESH' });
    expect(sentBody('app_karigar/sales_exec/dealer_dropdown')).toEqual({ state: 'UTTAR PRADESH' });
  });
});

describe('states (card States)', () => {
  test('Registration.plumber: every Plumber field, stars, Submit', async () => {
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Registration', 'Submit']));
    ['Basic information', 'Name', 'Mobile No.', 'Date of Birth', 'Address information', 'Address', 'State', 'District', 'Area', 'Pincode', 'Assign Mapping'].forEach(s =>
      expect(hasText(s)).toBe(true),
    );
    expect(hasText('Seller Name (Optional)')).toBe(true);
    expect(hasText('Select Sales Executive (optional)')).toBe(true);
    expect(exists('first_name')).toBe(true);
    expect(host('mobile_no-input').props.value).toBe('9000000001');
    expect(host('mobile_no-input').props.editable).toBe(false);
  });
  test('Registration.seller: Dealer Name / Dealer Mobile No. instead of Assign Mapping', async () => {
    await mount({ ...NEW, loginType: 'Sales_Boy' });
    expect(hasText('Date of Birth')).toBe(true);
    expect(hasText('Dealer Name')).toBe(true);
    expect(hasText('Dealer Mobile No.')).toBe(true);
    expect(hasText('Assign Mapping')).toBe(false);
  });
  test('Registration.dealer: Date of Birth only', async () => {
    await mount({ ...NEW, loginType: 'Dealer' });
    expect(hasText('Date of Birth')).toBe(true);
    expect(hasText('Dealer Name')).toBe(false);
    expect(hasText('Assign Mapping')).toBe(false);
  });
  test.each(['Customer', 'Retailer', 'Sales_Executive'])('%s: no Date of Birth and no mapping (unit-tested only)', async role => {
    await mount({ ...NEW, loginType: role });
    expect(hasText('Date of Birth')).toBe(false);
    expect(hasText('Assign Mapping')).toBe(false);
  });
  test('Registration.hin: translated labels', async () => {
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['पंजीकरण', 'निवेदन']));
    expect(hasText('जन्म')).toBe(true);
  });
  test('Registration.edit: Edit Profile, Update, prefilled, mapping disabled', async () => {
    await mount(editParams());
    expect(allText()).toEqual(expect.arrayContaining(['Edit Profile', 'Update']));
    expect(host('first_name-input').props.value).toBe('Test Plumber');
    expect(host('pincode-input').props.value).toBe('201010');
    // measured in the Ionic ref: `[disabled]` only adds `item-input-disabled`; the native <input> stays enabled and undimmed
    expect(host('sales_boy_name-input').props.editable).toBe(true);
    expect(host('dealer_mobile-input').props.editable).toBe(true);
    expect(hasText('Rakesh Verma')).toBe(true); // sales_executive_id 900014 preselected from the list
  });
  test('Registration.submitted: empty Name keeps the form from sending and shows the error', async () => {
    await mount();
    await press('registration-submit');
    await settle();
    expect(callsTo('app_karigar/addKarigar')).toHaveLength(0);
    expect(find('first_name').some(n => n.props.error === true)).toBe(true);
    expect(openLoaders()).toHaveLength(0);
  });
  test('Registration.editExist: Already Registered! alert', async () => {
    setFixtureVariant('app_karigar/addKarigar', 'EXIST');
    await mount(editParams());
    await press('registration-submit');
    await settle();
    expect(alerts()[0]).toMatchObject({ title: 'Alert!', cssClass: 'action-close', subTitle: 'Already Registered!', buttons: ['OK'] });
    expect(openLoaders()).toHaveLength(0);
  });
  test('Registration.editSuspended: ACCOUNT SUSPENDED alert, nothing stored', async () => {
    setFixtureVariant('auth/login', 'suspended');
    await mount(editParams());
    await press('registration-submit');
    await settle();
    expect(alerts().map(a => a.subTitle)).toEqual(['Your account has been suspended']);
    expect(await stored()).toBeNull();
    expect(navigation.push).not.toHaveBeenCalled();
  });
  test('malformed lists render without throwing', async () => {
    setFixtureVariant('app_master/getStates', 'malformed');
    setFixtureVariant('app_master/getDistrict', 'malformed');
    setFixtureVariant('app_karigar/sales_exec/sales_executive_dropdown', 'malformed');
    setFixtureVariant('app_karigar/seller_list', 'malformed');
    await expect(mount(editParams())).resolves.toBeUndefined();
    expect(hasText('Registration') || hasText('Edit Profile')).toBe(true);
  });
  test('seller_list send_state shows the alert', async () => {
    setFixtureVariant('app_karigar/seller_list', 'send_state');
    await mount();
    await change('state', 'DELHI');
    expect(alerts().map(a => a.subTitle)).toEqual(['Please select state its mandatory']);
  });
});

describe('quirks', () => {
  test('Name accepts letters, + - and space only', async () => {
    await mount();
    await type('first_name', 'Ra1m+e-sh K.umar');
    expect(host('first_name-input').props.value).toBe('Ram+e-sh Kumar');
  });
  test('Address upper-cases the first letter of every word', async () => {
    await mount();
    await type('address', 'plot 5, main road');
    expect(host('address-input').props.value).toBe('Plot 5, Main Road');
  });
  test('Pincode takes digits only and 7 digits are invalid (no native maxlength)', async () => {
    await mount();
    await type('first_name', 'Ramesh');
    await type('pincode', '20a1010b1');
    expect(host('pincode-input').props.value).toBe('2010101');
    await press('registration-submit');
    await settle();
    expect(callsTo('app_karigar/addKarigar')).toHaveLength(0);
  });
  test('a short pincode blocks submit, an empty one does not (new mode)', async () => {
    await mount();
    await type('first_name', 'Ramesh');
    await type('pincode', '2010');
    await press('registration-submit');
    await settle();
    expect(callsTo('app_karigar/addKarigar')).toHaveLength(0);
    await type('pincode', '');
    await press('registration-submit');
    await settle();
    expect(callsTo('app_karigar/addKarigar')).toHaveLength(1);
  });
  test('Sales_Boy: a short Dealer Mobile shows "Enter 10 Digits" after submit', async () => {
    await mount({ ...NEW, loginType: 'Sales_Boy' });
    await type('first_name', 'Ramesh');
    await type('dealer_mobile', '98100');
    expect(exists('dealer_mobile-error')).toBe(false);
    await press('registration-submit');
    await settle();
    expect(exists('dealer_mobile-error')).toBe(true);
    expect(callsTo('app_karigar/addKarigar')).toHaveLength(0);
  });
  test('Plumber: the mapping mobile error needs submitted AND touched', async () => {
    await mount();
    await type('first_name', 'Ramesh');
    await type('sales_boy_mobile_no', '98100');
    await press('registration-submit');
    await settle();
    expect(exists('sales_boy_mobile_no-error')).toBe(false);
    await act(async () => {
      host('sales_boy_mobile_no-input').props.onBlur();
    });
    expect(exists('sales_boy_mobile_no-error')).toBe(true);
  });
  test('edit mode requires Address, State, District, Area and Pincode', async () => {
    await mount({ data: { ...EDIT.data, city: '' } });
    await press('registration-submit');
    await settle();
    expect(callsTo('app_karigar/addKarigar')).toHaveLength(0);
  });
  test('edit body: ids replace the objects, karigar_edit_id = id', async () => {
    setFixtureVariant('auth/login', 'other');
    await mount(editParams());
    await press('registration-submit');
    await settle();
    const k = sentBody('app_karigar/addKarigar').karigar;
    expect(k).toMatchObject({ karigar_edit_id: '900001', sales_boy_id: '900012', dealer_id: '900013', sales_executive_id: '900014', id: '900001' });
  });
  test('new body: sales_boy_id is "" and dealer_id is removed', async () => {
    setFixtureVariant('auth/login', 'other');
    await submitNew();
    const k = sentBody('app_karigar/addKarigar').karigar;
    expect(k.sales_boy_id).toBe('');
    expect('dealer_id' in k).toBe(false);
  });
  test('Customer gets status Verified', async () => {
    setFixtureVariant('auth/login', 'other');
    await submitNew({ ...NEW, loginType: 'Customer' });
    expect(sentBody('app_karigar/addKarigar').karigar.status).toBe('Verified');
  });
  test('loader "Please wait..." is open while addKarigar is pending', async () => {
    await mount();
    await type('first_name', 'Ramesh');
    await press('registration-submit');
    expect(openLoaders()).toHaveLength(1);
    expect(openLoaders()[0].options.content).toBe('Please wait...');
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });
  test('HTTP error on addKarigar: the loader stays up, nothing else happens', async () => {
    setFixtureVariant('app_karigar/addKarigar', 'error');
    await submitNew();
    expect(openLoaders()).toHaveLength(1);
    expect(navigation.push).not.toHaveBeenCalled();
    expect(alerts()).toHaveLength(0);
  });
  test.each(['other', 'empty', 'malformed'])('addKarigar %s: loader closes, nothing else', async variant => {
    setFixtureVariant('app_karigar/addKarigar', variant);
    await submitNew();
    expect(openLoaders()).toHaveLength(0);
    expect(callsTo('auth/login')).toHaveLength(0);
    expect(alerts()).toHaveLength(0);
  });
  test('EXIST (new): Already Registered! alert, no login', async () => {
    setFixtureVariant('app_karigar/addKarigar', 'EXIST');
    await submitNew();
    expect(alerts()[0]).toMatchObject({ title: 'Alert!', subTitle: 'Already Registered!' });
    expect(callsTo('auth/login')).toHaveLength(0);
  });
});

describe('auth/login branches and navigation', () => {
  test('SUCCESS + Verified: stores the user and pushes Tabs without params', async () => {
    await submitNew();
    const fx: any = (loginFixture as any).variants.default;
    expect(await stored()).toEqual({ ...fx.user, token: fx.token, loginType: 'CMS' });
    expect(navigation.push).toHaveBeenCalledWith('Tabs');
    expect(navigation.push).toHaveBeenCalledTimes(1);
  });
  test('SUCCESS but not Verified: Tabs, then AboutusModal {country: undefined}', async () => {
    setFixtureVariant('auth/login', 'unverified');
    await submitNew();
    expect(navigation.push.mock.calls).toEqual([['Tabs'], ['AboutusModal', { country: undefined }]]);
  });
  test('edit mode: Tabs only, even when not Verified', async () => {
    setFixtureVariant('auth/login', 'unverified');
    await mount(editParams());
    await press('registration-submit');
    await settle();
    expect(navigation.push.mock.calls).toEqual([['Tabs']]);
  });
  test('NOT FOUND: nothing happens', async () => {
    setFixtureVariant('auth/login', 'NOT FOUND');
    await submitNew();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(alerts()).toHaveLength(0);
    expect(await stored()).toBeNull();
  });
  test('ACCOUNT SUSPENDED (new): alert only', async () => {
    setFixtureVariant('auth/login', 'suspended');
    await submitNew();
    expect(alerts()[0]).toMatchObject({ title: 'Alert!', subTitle: 'Your account has been suspended' });
    expect(navigation.push).not.toHaveBeenCalled();
  });
  test.each(['other', 'empty', 'malformed', 'error'])('auth/login %s: nothing stored, no navigation, does not throw', async variant => {
    setFixtureVariant('auth/login', variant);
    await expect(submitNew()).resolves.toBeUndefined();
    expect(await stored()).toBeNull();
    expect(navigation.push).not.toHaveBeenCalled();
  });
});
