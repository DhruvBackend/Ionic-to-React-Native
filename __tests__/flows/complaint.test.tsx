// Complaint flows (plan Phase 4): a Seller (Sales_Boy) adds a complaint, a Plumber finds it in MyCamplaints, checks in and closes it with a
// photo and the customer OTP, and the Seller sees it Closed in ComplaintHistory, rates the plumber and enters the paid amount.
//
// The plan text "getGeoLocation NOT FOUND forces PointLocation first" does not exist: in Ionic add-new-complaint.ts:62 the getGeo/getGeoLocation
// call is commented out, so the real path is form -> addComplaint -> setRoot(Tabs). No PointLocation detour is driven.
//
// The MOCK store has no complaint state (the complaint endpoints are plain fixtures), so each step uses the fixture variant the server would
// answer with at that point (plumber list "complaints", detail "plumberPending", then "plumberClosed" for the Seller). Same approach as
// scan-redeem.test.tsx: the real RootNavigator on Tabs with a seeded session, controls pressed by testID. Home's entry buttons depend on the
// karigar status and the Home dialogs, so the pages are pushed through navigationRef with the params Home passes (goOnComplaintAdd,
// goOnMyCamplaintsPage, complaintHistory).
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackActions } from '@react-navigation/native';
import { db, getTransport, setTransport, type ApiRequest } from '../../src/api/client';
import sessions from '../../src/api/fixtures/_sessions.json';
import { resetMock, setFixtureVariant } from '../../src/api/mock';
import i18n from '../../src/i18n';
import { RootNavigator } from '../../src/navigation/RootNavigator';
import { navigationRef } from '../../src/navigation/navigationRef';
import { emitMockNetwork, MOCK_PHOTO, resetMockNative } from '../../src/native';
import { _resetOverlaysForTests, overlayStore } from '../../src/ui/overlays';

const act = ReactTestRenderer.act;
let tree: ReactTestRenderer.ReactTestRenderer | undefined;
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

async function settle(ms = 350, rounds = 6) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
  }
}
const find = (id: string) => tree!.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const host = (id: string) => find(id).find(n => typeof n.type === 'string')!;
const flat = (c: any): string =>
  Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '';
const textOf = (id: string) => flat(host(id).props.children).trim();
const current = () => navigationRef.getCurrentRoute()?.name;
const rootFocused = () => {
  const s = navigationRef.getRootState();
  return s?.routes[s.index]?.name;
};

async function press(id: string) {
  const n = find(id).find(x => typeof x.props.onPress === 'function');
  if (!n) {
    throw new Error(`no pressable "${id}" on screen (current: ${current()})`);
  }
  await act(async () => {
    n.props.onPress({ nativeEvent: { locationX: 10, locationY: 10 } });
  });
  await settle();
}
async function type(id: string, text: string) {
  await act(async () => {
    host(id).props.onChangeText(text);
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
async function push(name: string, params?: object) {
  await act(async () => {
    navigationRef.dispatch(StackActions.push(name, params));
  });
  await settle();
}
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options as any);
const lastAlert = () => alerts().pop();
const sent = (fn: string) => calls.filter(c => c.fn === fn).map(c => (typeof c.body === 'string' ? JSON.parse(c.body) : c.body));

async function start(role: 'Plumber' | 'Sales_Boy') {
  db.userStorageData = { ...(sessions as any)[role] };
  await act(async () => {
    tree = ReactTestRenderer.create(<RootNavigator initialRouteName="Tabs" />);
  });
  await settle();
  expect(current()).toBe('Home');
}

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetMock();
  resetMockNative();
  _resetOverlaysForTests();
  db.userStorageData = null;
  calls = [];
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    return previous(req);
  });
  restoreTransport = () => setTransport(previous);
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});
afterEach(async () => {
  restoreTransport();
  await act(async () => {
    tree?.unmount();
  });
  tree = undefined;
  jest.useRealTimers();
});

test('Seller (Sales_Boy): AddNewComplaint form -> addComplaint body -> setRoot Tabs', async () => {
  await start('Sales_Boy');
  const seller = (sessions as any).Sales_Boy;
  await push('AddNewComplaint', { mode: 'home', type: 'Service' });
  expect(current()).toBe('AddNewComplaint');

  await type('mobile_no-input', '9000000051');
  await type('first_name-input', 'Sunita Deshmukh');
  await type('address-input', '12 Lake Road');
  await change('state', 'MAHARASHTRA');
  await change('district', 'PUNE');
  await type('city-input', 'Pune');
  await type('pincode-input', '411001');
  await type('nature_problem-input', 'Tap leakage');
  await press('submit');

  const [body] = sent('app_karigar/addComplaint');
  expect(body.complaint).toMatchObject({
    type: 'Service',
    mobile_no: '9000000051',
    first_name: 'Sunita Deshmukh',
    address: '12 Lake Road',
    state: 'MAHARASHTRA',
    district: 'PUNE',
    city: 'Pune',
    pincode: '411001',
    nature_problem: 'Tap leakage',
    customer_id: seller.id,
    created_by: '0',
    image: [],
  });
  expect(lastAlert()).toMatchObject({ title: 'Success!', subTitle: 'New Service request submitted successfully!' });
  expect(rootFocused()).toBe('Tabs');
  expect(navigationRef.getRootState()!.routes).toHaveLength(1);
  expect(navigationRef.getRootState()!.routes[0].params).toEqual({ index: '0' });
});

test('Plumber: MyCamplaints -> PulmberCustomerDetail -> check-in -> TaskClose (photo + OTP) -> complaintTaskCloseByPlumber + plumberCheckOut', async () => {
  await start('Plumber');
  const plumber = (sessions as any).Plumber;
  setFixtureVariant('app_karigar/getPlumberComplaintList', 'complaints');
  setFixtureVariant('app_karigar/getComplaintbyId', 'plumberPending');
  await act(async () => {
    emitMockNetwork({ online: true } as any);
  });

  await push('MyCamplaints', { type: 'Service' });
  expect(current()).toBe('MyCamplaints');
  expect(textOf('complaint-0-name')).toContain('Sunita Deshmukh');
  await press('complaint-0-name-press');
  expect(current()).toBe('PulmberCustomerDetail');
  expect(navigationRef.getCurrentRoute()?.params).toEqual({ id: 71, close_com: false });
  expect(sent('app_karigar/getComplaintbyId')[0]).toEqual({ complaints_id: 71 });

  // Start Checkin: mock geolocation (MOCK_POSITION), network online -> plumberCheckIn
  await press('checkin-button');
  expect(sent('app_karigar/plumberCheckIn')).toEqual([
    { plumber_id: plumber.id, complaint_id: 71, cust_lat: expect.any(Number), cust_long: expect.any(Number) },
  ]);

  await press('close-complaint-button');
  expect(current()).toBe('TaskClose');
  expect(navigationRef.getCurrentRoute()?.params).toMatchObject({ id: 71, mobile: '9000000051', lable: 'Closed' });

  await type('remark-input', 'Replaced the cartridge');
  await press('upload-document');
  const sheet = overlayStore.getEntries().filter(e => e.kind === 'actionSheet').map(e => e.options as any).pop();
  await act(async () => {
    sheet.buttons[0].handler(); // Camera -> takePhoto('camera') (MOCK)
  });
  await settle();
  expect(exists('upload-image')).toBe(true);
  // TaskClose requires a 6-digit OTP (minlength=6), the fixture's 4-digit otp is a data quirk
  await type('otp-input', '482100');
  await press('submit');

  const [close] = sent('app_karigar/complaintTaskCloseByPlumber');
  expect(close.status).toMatchObject({
    complaints_id: 71,
    image: MOCK_PHOTO,
    otp: '482100',
    remark: 'Replaced the cartridge',
    closed_by: plumber.id,
    status: 'Closed',
  });
  expect(lastAlert()).toMatchObject({ title: 'ThankYou!', subTitle: 'Complaint Closed Successfully ' });
  expect(sent('app_karigar/plumberCheckOut')[0]).toMatchObject({
    plumber_id: plumber.id,
    status: 'Closed',
    remark: 'Replaced the cartridge',
    complaint_id: 71,
  });
  expect(rootFocused()).toBe('Tabs');
});

test('Seller: ComplaintHistory lists the Closed complaint -> ComplaintDetail -> rating and paid amount', async () => {
  await start('Sales_Boy');
  const seller = (sessions as any).Sales_Boy;
  setFixtureVariant('app_karigar/getComplaintList', 'closed');
  setFixtureVariant('app_karigar/getComplaintbyId', 'plumberClosed');

  await push('ComplaintHistory', { mode: 'home', type: 'Service' });
  expect(current()).toBe('ComplaintHistory');
  expect(textOf('complaint-0-status')).toContain('Closed');
  await press('complaint-0');
  expect(current()).toBe('ComplaintDetail');
  expect(sent('app_karigar/getComplaintbyId').pop()).toEqual({ complaints_id: 61 });

  await press('rate-4');
  expect(sent('app_karigar/plumberRatingByCustomer')).toEqual([{ star: '4', customer_id: seller.id, plumber_id: 31, complaint_id: 71 }]);

  await type('amount-payment-input', '500');
  await press('amount-submit');
  expect(sent('app_karigar/customerPaidAmount')).toEqual([{ complaints_id: 61, amount: '500' }]);
  expect(lastAlert()).toMatchObject({ title: 'Success!', subTitle: 'Amount Added Successfully!' });
});
