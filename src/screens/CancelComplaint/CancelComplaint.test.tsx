// CancelComplaint modal (Ionic CancelComplaintPage): contract, required remark, dismiss, malformed answers. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import CancelComplaintScreen from './index';

jest.setTimeout(30000);
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

async function settle() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
  }
}

async function mount(params: any = { id: 71, label: 'cancel' }) {
  await act(async () => {
    tree = ReactTestRenderer.create(<CancelComplaintScreen navigation={navigation as any} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const pressId = async (id: string) => {
  const node = find(id).filter(n => typeof n.props.onPress === 'function').pop()!;
  await act(async () => {
    node.props.onPress();
  });
  await settle();
};
const type = async (v: string) => {
  const node = tree.root.findAll(n => n.props.testID === 'cancel-remark-input' && typeof n.props.onChangeText === 'function')[0];
  await act(async () => {
    node.props.onChangeText(v);
  });
};
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  navigation.goBack.mockClear();
  calls = [];
  db.userStorageData = { id: '900001', type: 'Customer' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

test('renders the Cancel Reason field, the Submit button and the close icon', async () => {
  await mount();
  expect(allText()).toContain('Cancel Reason');
  expect(allText().some(t => t === 'Submit')).toBe(true);
  expect(find('cancel-close').length).toBeGreaterThan(0);
});

test('contract: cancelComplaintByCustomer on Submit, then the modal closes', async () => {
  installSpy();
  await mount();
  await type('No longer needed');
  await expectContract('app_karigar/cancelComplaintByCustomer', () => pressId('cancel-submit'));
  expect(JSON.parse(calls[0].body!)).toEqual({ id: 71, reason_cancel: 'No longer needed', customer_id: '900001' });
  expect(navigation.goBack).toHaveBeenCalledTimes(1);
});

test('required: an empty remark sends nothing', async () => {
  installSpy();
  await mount();
  await pressId('cancel-submit');
  expect(calls).toHaveLength(0);
  expect(navigation.goBack).not.toHaveBeenCalled();
});

test('the close icon dismisses without a request', async () => {
  installSpy();
  await mount();
  await pressId('cancel-close');
  expect(navigation.goBack).toHaveBeenCalledTimes(1);
  expect(calls).toHaveLength(0);
});

test('malformed answer: the modal still closes (the result is never read)', async () => {
  setFixtureVariant('app_karigar/cancelComplaintByCustomer', 'malformed');
  await mount();
  await type('x');
  await pressId('cancel-submit');
  expect(navigation.goBack).toHaveBeenCalledTimes(1);
});
