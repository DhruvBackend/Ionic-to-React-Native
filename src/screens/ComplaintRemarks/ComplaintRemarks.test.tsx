// ComplaintRemarks screen (Ionic ComplaintRemarksPage): contract, render states, refresh. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import ComplaintRemarksScreen from './index';

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
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

async function mount(params: any = { id: 71 }) {
  await act(async () => {
    tree = ReactTestRenderer.create(<ComplaintRemarksScreen route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const textOf = (id: string) => flat(find(id)[0].props.children);
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);

beforeEach(() => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  calls = [];
  db.userStorageData = { id: '900011', type: 'Plumber' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contract (card Endpoints)', () => {
  test('getComplaintHistoryRemark on entry with the nav id', async () => {
    installSpy();
    await expectContract('app_karigar/getComplaintHistoryRemark', () => mount());
    expect(JSON.parse(calls[0].body!)).toEqual({ complaints_id: 71 });
  });

  test('refresh sends the request again and completes at once', async () => {
    installSpy();
    await mount();
    const refresher = tree.root.findAll(n => typeof n.props.onRefresh === 'function')[0];
    const complete = jest.fn();
    await act(async () => {
      refresher.props.onRefresh({ complete });
    });
    expect(complete).toHaveBeenCalledTimes(1);
    await settle();
    expect(calls.filter(c => c.fn === 'app_karigar/getComplaintHistoryRemark')).toHaveLength(2);
  });
});

describe('render', () => {
  test('default: title, dates, times and remarks of every row, no loader', async () => {
    await mount();
    expect(allText()).toContain('Remark-history');
    expect(textOf('remark-0-date')).toBe('30 October 2026');
    expect(textOf('remark-0-time')).toBe('3:22 PM');
    expect(textOf('remark-0-text')).toBe('Remark: Customer not available, visit again tomorrow');
    expect(textOf('remark-1-date')).toBe('28 October 2026');
    expect(textOf('remark-1-time')).toBe('9:05 AM');
    expect(openLoaders()).toHaveLength(0);
  });

  test('empty: no rows', async () => {
    setFixtureVariant('app_karigar/getComplaintHistoryRemark', 'empty');
    await mount();
    expect(exists('remark-0')).toBe(false);
  });

  test('malformed (null complaintHistory) renders without throwing and draws no rows', async () => {
    setFixtureVariant('app_karigar/getComplaintHistoryRemark', 'malformed');
    await mount();
    expect(allText()).toContain('Remark-history');
    expect(exists('remark-0')).toBe(false);
  });
});
