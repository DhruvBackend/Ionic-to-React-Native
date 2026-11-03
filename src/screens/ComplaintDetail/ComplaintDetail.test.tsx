// ComplaintDetail screen (Ionic ComplaintDetailPage): contracts, states per status, rating, paid amount, modals. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import ComplaintDetailScreen from './index';

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
let focusCb: (() => void) | undefined;
const navigation = {
  push: jest.fn(),
  addListener: jest.fn((_t: string, cb: () => void) => {
    focusCb = cb;
    return () => {};
  }),
};
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};
const D = 'app_karigar/getComplaintbyId';

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

async function mount(params: any = { id: 71 }) {
  await act(async () => {
    tree = ReactTestRenderer.create(<ComplaintDetailScreen navigation={navigation as any} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const textOf = (id: string) => flat(find(id)[0].props.children);
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options as any);
const callsTo = (fn: string) => calls.filter(c => c.fn === fn);
const body = (c: ApiRequest) => JSON.parse(c.body!);
const press = async (id: string) => {
  const node = find(id).filter(n => typeof n.props.onPress === 'function').pop()!;
  await act(async () => {
    node.props.onPress();
  });
  await settle();
};
const typeAmount = async (v: string) => {
  const node = tree.root.findAll(n => n.props.testID === 'amount-payment-input' && typeof n.props.onChangeText === 'function')[0];
  await act(async () => {
    node.props.onChangeText(v);
  });
};

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  focusCb = undefined;
  calls = [];
  db.userStorageData = { id: '900001', type: 'Customer' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contracts (card Endpoints)', () => {
  test('getComplaintbyId on entry', async () => {
    installSpy();
    await expectContract(D, () => mount());
    expect(body(callsTo(D)[0])).toEqual({ complaints_id: 71 });
  });

  test('plumberRatingByCustomer from a star, then the detail is reloaded', async () => {
    installSpy();
    setFixtureVariant(D, 'closed');
    await mount();
    await expectContract('app_karigar/plumberRatingByCustomer', () => press('rate-4'));
    expect(body(callsTo('app_karigar/plumberRatingByCustomer')[0])).toEqual({ star: '4', customer_id: '900001', plumber_id: 31, complaint_id: 61 });
    expect(body(callsTo(D)[1])).toEqual({ complaints_id: 61 });
    expect(openLoaders()).toHaveLength(0);
  });

  test('customerPaidAmount from Submit: success alert, then the detail is reloaded', async () => {
    installSpy();
    setFixtureVariant(D, 'closed');
    await mount();
    await typeAmount('500');
    await expectContract('app_karigar/customerPaidAmount', () => press('amount-submit'));
    expect(body(callsTo('app_karigar/customerPaidAmount')[0])).toEqual({ complaints_id: 71, amount: '500' });
    expect(alerts()[0]).toMatchObject({ title: 'Success!', cssClass: 'action-close', subTitle: 'Amount Added Successfully!', buttons: ['OK'] });
    expect(callsTo(D)).toHaveLength(2);
  });

  test('a status other than "success" shows no alert but still reloads', async () => {
    installSpy();
    setFixtureVariant(D, 'closed');
    setFixtureVariant('app_karigar/customerPaidAmount', 'failed');
    await mount();
    await typeAmount('500');
    await press('amount-submit');
    expect(alerts()).toHaveLength(0);
    expect(callsTo(D)).toHaveLength(2);
  });
});

describe('render', () => {
  test('Pending Service: title, table rows, gallery, plumber box, Cancel button; loader closed', async () => {
    await mount();
    expect(allText()).toContain('Service Request Detail');
    expect(textOf('value-no')).toBe('COM# 71');
    expect(textOf('value-date')).toBe('28 October 2026');
    expect(textOf('value-problem')).toBe('Tap leakage');
    expect(textOf('value-status')).toBe('Pending');
    expect(textOf('value-address')).toBe('12 Lake Road Pune Pune Maharashtra 411001');
    expect(exists('row-closedBy')).toBe(false);
    expect(exists('row-cancelBy')).toBe(false);
    expect(exists('row-remark')).toBe(false);
    expect(exists('row-amount')).toBe(false); // amount '0'
    expect(exists('select-img')).toBe(true);
    expect(find('image-src-0')[0].props.source).toEqual({ uri: `${db.upload_url3}complaint_71_a.jpg` });
    expect(find('video-embed-2')[0].props.uri).toBe(`${db.video_url}complaint_71.mp4`);
    expect(textOf('plumber-name')).toBe('ramesh patil');
    expect(exists('ratings')).toBe(false);
    expect(exists('amount-form')).toBe(false);
    expect(exists('plumber-rating')).toBe(false);
    expect(exists('cancel-block')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
  });

  test('Installation: IR#, Remark label, NA plumber, no gallery', async () => {
    setFixtureVariant(D, 'installation');
    await mount();
    expect(textOf('value-no')).toBe('IR# 72');
    expect(allText()).toContain('Remark');
    expect(allText()).not.toContain('Nature Problem');
    expect(textOf('plumber-name')).toBe('NA');
    expect(textOf('plumber-mobile')).toBe('NA');
    expect(exists('select-img')).toBe(false);
  });

  test('Closed with amount 0: Closed By / Close Date, amount form and Rate a Plumber', async () => {
    setFixtureVariant(D, 'closed');
    await mount();
    expect(textOf('value-closedBy')).toBe('Ramesh Patil');
    expect(textOf('value-closeDate')).toBe('14 September 2026');
    expect(exists('amount-form')).toBe(true);
    expect(exists('plumber-rating')).toBe(true);
    expect(exists('cancel-block')).toBe(false);
  });

  test('Closed and paid: Amount Paid row and the Rating row, no amount form', async () => {
    setFixtureVariant(D, 'closedPaid');
    await mount();
    expect(textOf('value-amount')).toBe('₹ 500');
    expect(exists('amount-form')).toBe(false);
    expect(textOf('rating-votes')).toBe('4 Star 12 Complaints');
  });

  test('Cancel: Cancel By / Cancel Date and Remark rows', async () => {
    setFixtureVariant(D, 'cancel');
    await mount();
    expect(textOf('value-cancelBy')).toBe('Vijay Patil');
    expect(textOf('value-cancelDate')).toBe('21 August 2026');
    expect(textOf('value-remark')).toBe('No longer needed');
    expect(exists('cancel-block')).toBe(false);
  });

  test('empty ({}): blank values, the Amount Paid row shows (undefined != "0"), no crash', async () => {
    setFixtureVariant(D, 'empty');
    await mount();
    expect(allText()).toContain('Request Detail');
    expect(exists('row-amount')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
  });

  test('malformed (complaintDetails: null): loader dismissed, the initial template stays', async () => {
    setFixtureVariant(D, 'malformed');
    await mount();
    expect(openLoaders()).toHaveLength(0);
    expect(textOf('value-no')).toBe('');
  });

  test('Submit is disabled for "0" / "" (payment == 0) and enabled for an untouched model', async () => {
    setFixtureVariant(D, 'closed');
    await mount();
    const disabled = () => find('amount-submit').some(n => n.props.disabled === true);
    expect(disabled()).toBe(false);
    await typeAmount('0');
    expect(disabled()).toBe(true);
    await typeAmount('');
    expect(disabled()).toBe(true);
    await typeAmount('250');
    expect(disabled()).toBe(false);
  });
});

describe('navigation', () => {
  test('an image opens the ViewProfile modal with {Image}', async () => {
    await mount();
    await press('image-1');
    expect(navigation.push).toHaveBeenCalledWith('ViewProfile', { Image: `${db.upload_url3}complaint_71_b.jpg` });
  });

  test('Cancel Complaint opens the CancelComplaint modal; its dismissal reloads the detail', async () => {
    installSpy();
    await mount();
    await press('cancel-complaint-button');
    expect(navigation.push).toHaveBeenCalledWith('CancelComplaint', { id: 71, label: 'cancel' });
    expect(callsTo(D)).toHaveLength(1);
    await act(async () => {
      focusCb?.();
    });
    await settle();
    expect(callsTo(D)).toHaveLength(2);
    // a later focus (e.g. after the ViewProfile modal) does not reload
    await act(async () => {
      focusCb?.();
    });
    await settle();
    expect(callsTo(D)).toHaveLength(2);
  });
});
