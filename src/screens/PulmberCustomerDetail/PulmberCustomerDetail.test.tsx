// PulmberCustomerDetail screen (Ionic PulmberCustomerDetailPage): contracts, states, check-in, navigation. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Linking } from 'react-native';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { MOCK_POSITION, resetMockNative, setMockNativeFailure } from '../../native';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import { webAlert } from '../../ui/webAlert';
import PulmberCustomerDetailScreen from './index';

jest.mock('../../ui/webAlert', () => ({ webAlert: jest.fn() }));
jest.setTimeout(30000);
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

async function mount(params: any = { id: 71, close_com: false }) {
  await act(async () => {
    tree = ReactTestRenderer.create(<PulmberCustomerDetailScreen navigation={navigation as any} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const textOf = (id: string) => flat(find(id)[0].props.children);
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const toasts = () => overlayStore.getEntries().filter(e => e.kind === 'toast');
const press = async (id: string) => {
  const node = find(id).filter(n => typeof n.props.onPress === 'function').pop()!;
  await act(async () => {
    node.props.onPress();
  });
  await settle();
};
const body = (c: ApiRequest) => JSON.parse(c.body!);
const callsTo = (fn: string) => calls.filter(c => c.fn === fn);

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  resetMockNative();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  (webAlert as jest.Mock).mockClear();
  await i18n.changeLanguage('en');
  calls = [];
  db.userStorageData = { id: '900011', type: 'Plumber' };
  setFixtureVariant('app_karigar/getComplaintbyId', 'plumberPending');
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contract (card Endpoints)', () => {
  test('getComplaintbyId on entry with the nav id', async () => {
    installSpy();
    await expectContract('app_karigar/getComplaintbyId', () => mount());
    expect(body(callsTo('app_karigar/getComplaintbyId')[0])).toEqual({ complaints_id: 71 });
  });

  test('Start Checkin: position, then plumberCheckIn with the plumber, complaint and coordinates', async () => {
    installSpy();
    await mount();
    await expectContract('app_karigar/plumberCheckIn', () => press('checkin-button'));
    expect(body(callsTo('app_karigar/plumberCheckIn')[0])).toEqual({
      plumber_id: '900011',
      complaint_id: 71,
      cust_lat: MOCK_POSITION.lat,
      cust_long: MOCK_POSITION.lng,
    });
  });
});

describe('render', () => {
  test('Pending with gallery: title, seller, customer, rows, images, Start Checkin, loader closed', async () => {
    await mount();
    expect(allText()).toContain('Customer Detail');
    expect(textOf('seller-letter')).toBe('V');
    expect(textOf('seller-name')).toBe('Vikas More');
    expect(textOf('seller-mobile')).toBe('9000000021 (Seller)');
    expect(textOf('customer-name')).toBe('Sunita Deshmukh');
    expect(textOf('customer-mobile')).toBe('9000000051');
    expect(textOf('address')).toBe('12 Lake Road PunePuneMaharashtra411001');
    expect(textOf('value-id')).toBe('COM#71');
    expect(textOf('value-problem')).toBe('Tap leakage');
    expect(textOf('value-status')).toBe('Pending');
    expect(exists('new-remark')).toBe(false);
    expect(exists('select-img')).toBe(true);
    expect(exists('image-0')).toBe(true);
    expect(exists('video-2')).toBe(true);
    expect(find('image-src-0')[0].props.source.uri).toBe(db.upload_url3 + 'complaint_71_a.jpg');
    expect(exists('checkin-block')).toBe(true);
    expect(exists('task-btn')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('Pending with a remark (reason_cancel !== ""): the new-remark block', async () => {
    setFixtureVariant('app_karigar/getComplaintbyId', 'plumberRemark');
    await mount();
    expect(textOf('new-remark-date')).toBe('30 October 2026');
    expect(textOf('new-remark-text')).toBe('Remark : Customer not available, visit again');
  });

  test('plumberStatus Pending: no Start Checkin', async () => {
    setFixtureVariant('app_karigar/getComplaintbyId', 'plumberVerifying');
    await mount();
    expect(exists('checkin-block')).toBe(false);
  });

  test('Closed: Closed By / Closing Date / Closing Remark rows and the rating', async () => {
    setFixtureVariant('app_karigar/getComplaintbyId', 'plumberClosed');
    await mount();
    expect(textOf('value-status')).toBe('Closed');
    expect(textOf('value-closedBy')).toBe('Ramesh Patil');
    expect(textOf('value-closeDate')).toBe('14 September 2026');
    expect(textOf('value-closeRemark')).toBe('Work completed');
    expect(textOf('rating-votes')).toBe('4 Star ');
    expect(exists('checkin-block')).toBe(false);
  });

  test('Cancel: rows and View all (history count above 0)', async () => {
    setFixtureVariant('app_karigar/getComplaintbyId', 'plumberCancel');
    await mount();
    expect(textOf('value-cancelBy')).toBe('Vijay Patil');
    expect(textOf('value-cancelRemark')).toBe('No longer needed');
    expect(exists('cancel-view-all')).toBe(true);
  });

  test('Part_Pending and Unit_Replacement: image row and Start Checkin', async () => {
    setFixtureVariant('app_karigar/getComplaintbyId', 'partPending');
    await mount();
    expect(exists('value-status')).toBe(false);
    expect(find('part-image-src')[0].props.source.uri).toBe(db.upload_url3 + 'part_71.jpg');
    expect(exists('checkin-block')).toBe(true);
    act(() => tree.unmount());
    setFixtureVariant('app_karigar/getComplaintbyId', 'unitReplacement');
    await mount();
    expect(find('unit-image-src')[0].props.source.uri).toBe(db.upload_url3 + 'unit_71.jpg');
    expect(exists('checkin-block')).toBe(true);
  });

  test('hin: title comes from the language file', async () => {
    await i18n.changeLanguage('hin');
    await mount();
    expect(allText()).toContain(i18n.t('Customer Detail'));
  });

  test('empty (no image): root text stays blank, status blocks before the gallery exist, nothing after', async () => {
    setFixtureVariant('app_karigar/getComplaintbyId', 'empty');
    await mount();
    expect(allText()).toContain('Customer Detail');
    expect(textOf('value-id')).toBe('COM#71');
    expect(exists('select-img')).toBe(false);
    expect(exists('checkin-block')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('offline: no plumberCheckIn call', async () => {
    installSpy();
    const spy = jest.spyOn(require('../../native/network'), 'getNetworkState').mockResolvedValue({ ok: true, value: { online: false, type: 'none' } });
    await mount();
    await press('checkin-button');
    expect(callsTo('app_karigar/plumberCheckIn')).toHaveLength(0);
    spy.mockRestore();
  });

  test('malformed (complaintDetails null) renders without throwing and keeps the blank page', async () => {
    setFixtureVariant('app_karigar/getComplaintbyId', 'malformed');
    await mount();
    expect(allText()).toContain('Customer Detail');
    expect(exists('seller-name')).toBe(false); // an empty h4 renders nothing
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('check-in', () => {
  test('success: the button is replaced by Close Complaint / In process at once, no alert', async () => {
    await mount();
    await press('checkin-button');
    expect(exists('checkin-block')).toBe(false);
    expect(allText()).toContain('Close Complaint');
    expect(allText()).toContain('In process');
    expect(webAlert).not.toHaveBeenCalled();
  });

  test('a response other than CheckinSuccess shows the native alert', async () => {
    setFixtureVariant('app_karigar/plumberCheckIn', 'failed');
    await mount();
    await press('checkin-button');
    expect(webAlert).toHaveBeenCalledWith('Geo Location not found! Try Again');
  });

  test('accuracy request rejected: Allow Location Permissions toast, no check-in call (the buttons still switch)', async () => {
    installSpy();
    setMockNativeFailure('location', 'denied', 'accuracy: user disagreed');
    await mount();
    await press('checkin-button');
    expect(toasts().map(e => (e.options as any).message)).toEqual(['Allow Location Permissions']);
    expect(callsTo('app_karigar/plumberCheckIn')).toHaveLength(0);
    expect(exists('task-btn')).toBe(true);
  });

  test('position failure: swallowed (no toast, no call)', async () => {
    installSpy();
    setMockNativeFailure('location', 'unavailable', 'no fix');
    await mount();
    await press('checkin-button');
    expect(toasts()).toHaveLength(0);
    expect(callsTo('app_karigar/plumberCheckIn')).toHaveLength(0);
  });
});

describe('navigation (Ionic params)', () => {
  test('TaskClose with {id, mobile, name, lable} for Close Complaint and In process', async () => {
    await mount();
    await press('checkin-button');
    await press('close-complaint-button');
    expect(navigation.push).toHaveBeenLastCalledWith('TaskClose', { id: 71, mobile: '9000000051', name: 'sunita deshmukh', lable: 'Closed' });
    await press('in-process-button');
    expect(navigation.push).toHaveBeenLastCalledWith('TaskClose', { id: 71, mobile: '9000000051', name: 'sunita deshmukh', lable: 'Pending' });
  });

  test('ComplaintRemarks {id} from View All (Pending remark and Cancel rows)', async () => {
    setFixtureVariant('app_karigar/getComplaintbyId', 'plumberRemark');
    await mount();
    await press('new-remark-view-all');
    expect(navigation.push).toHaveBeenLastCalledWith('ComplaintRemarks', { id: 71 });
    act(() => tree.unmount());
    setFixtureVariant('app_karigar/getComplaintbyId', 'plumberCancel');
    await mount();
    await press('cancel-view-all');
    expect(navigation.push).toHaveBeenLastCalledWith('ComplaintRemarks', { id: 71 });
  });

  test('ViewProfile modal for a gallery image ({Image}) and for the Part_Pending image ({Image, mode: profile})', async () => {
    await mount();
    await press('image-0');
    expect(navigation.push).toHaveBeenLastCalledWith('ViewProfile', { Image: db.upload_url3 + 'complaint_71_a.jpg' });
    act(() => tree.unmount());
    setFixtureVariant('app_karigar/getComplaintbyId', 'partPending');
    await mount();
    await press('part-image');
    expect(navigation.push).toHaveBeenLastCalledWith('ViewProfile', { Image: 'part_71.jpg', mode: 'profile' });
  });

  test('the call buttons open tel: links', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    await mount();
    await press('customer-dial');
    expect(open).toHaveBeenCalledWith('tel:9000000051');
    await press('seller-dial');
    expect(open).toHaveBeenLastCalledWith('tel:9000000021');
    open.mockRestore();
  });
});
