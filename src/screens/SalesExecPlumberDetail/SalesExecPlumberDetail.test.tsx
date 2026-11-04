// SalesExecPlumberDetail screen (Ionic SalesExecPlumberDetailPage): contract, states (status / sections / failures). See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import SalesExecPlumberDetailScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn() };
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

function installSpy(mode: 'ok' | 'fail' | 'hang' = 'ok') {
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    if (mode === 'fail') {
      return Promise.reject(new HttpError(500, {}));
    }
    if (mode === 'hang') {
      return new Promise<never>(() => {});
    }
    return previous(req);
  });
  restoreTransport = () => setTransport(previous);
}

async function settle() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
  }
}

async function mount(params: { plumber_id?: any } | undefined = { plumber_id: 401 }) {
  await act(async () => {
    tree = ReactTestRenderer.create(<SalesExecPlumberDetailScreen navigation={navigation as any} route={{ params }} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const textOf = (id: string) => flat(find(id)[0]?.props.children);
const detailCalls = () => calls.filter(c => c.fn === 'app_karigar/sales_exec/plumber_detail');
const fmt = (s: string) => {
  const d = new Date(s);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

beforeEach(() => {
  jest.useFakeTimers();
  resetMock();
  navigation.push.mockClear();
  calls = [];
  db.userStorageData = { id: '900004', type: 'Sales_Executive' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contracts (card Endpoints)', () => {
  test('app_karigar/sales_exec/plumber_detail: {sales_executive_id, plumber_id} on ionViewDidLoad', async () => {
    installSpy();
    await expectContract('app_karigar/sales_exec/plumber_detail', () => mount());
    expect(detailCalls()).toHaveLength(1);
    expect(JSON.parse(detailCalls()[0].body!)).toEqual({ sales_executive_id: '900004', plumber_id: 401 });
  });

  test('no plumber_id nav param: no request', async () => {
    installSpy();
    await mount({});
    expect(detailCalls()).toHaveLength(0);
    expect(exists('saepdetail-profile')).toBe(false);
  });

  test('no user id: no request', async () => {
    db.userStorageData = {};
    installSpy();
    await mount();
    expect(detailCalls()).toHaveLength(0);
  });
});

describe('states (card States)', () => {
  test('SalesExecPlumberDetail.default (Verified, active): every section', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining([
        'Plumber Detail',
        'Ramesh Kumar',
        'Verified',
        '· Active',
        'check_circle',
        'Mobile No.',
        '+919000000401',
        'Balance Points',
        '1250',
        'Last Active',
        fmt('2026-10-30 18:05:00'),
        'Last Scan',
        fmt('2026-10-29 09:15:00'),
        'Address',
        'Sahibabad Ghaziabad Uttar Pradesh',
        'Seller Information',
        'Dealer Information',
      ]),
    );
    expect(textOf('saepdetail-seller')).toBe('Seller InformationMohan Lal (9000000501)');
    expect(textOf('saepdetail-dealer')).toBe('Dealer InformationAnil Traders (9000000601)');
    expect(exists('saepdetail-loading')).toBe(false);
  });

  test('SalesExecPlumberDetail.pending: hourglass, inactive, dashes, seller without a phone, no dealer', async () => {
    setFixtureVariant('app_karigar/sales_exec/plumber_detail', 'pending');
    installSpy();
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['hourglass_full', 'Pending', '· Inactive', 'Sunita Pawar', 'Uttar Pradesh']));
    expect(textOf('saepdetail-active')).toBe('—');
    expect(textOf('saepdetail-scan')).toBe('—');
    expect(textOf('saepdetail-points')).toBe('0');
    expect(textOf('saepdetail-seller')).toBe('Seller InformationMohan Lal');
    expect(exists('saepdetail-dealer')).toBe(false);
  });

  test('SalesExecPlumberDetail.suspect: info icon, no address, no seller, dealer only', async () => {
    setFixtureVariant('app_karigar/sales_exec/plumber_detail', 'suspect');
    installSpy();
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['info', 'Suspect', '· Active']));
    expect(exists('saepdetail-address')).toBe(false);
    expect(exists('saepdetail-seller')).toBe(false);
    expect(exists('saepdetail-dealer')).toBe(true);
  });

  test('SalesExecPlumberDetail.reject: cancel icon, a city alone shows the address, an unparsable date stays as text', async () => {
    setFixtureVariant('app_karigar/sales_exec/plumber_detail', 'reject');
    installSpy();
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['cancel', 'Reject', '· Inactive']));
    expect(textOf('saepdetail-address')).toBe('AddressPune');
    expect(textOf('saepdetail-active')).toBe('not a date');
  });

  test('SalesExecPlumberDetail.bare: unknown status has no icon, null last name / points, no optional sections', async () => {
    setFixtureVariant('app_karigar/sales_exec/plumber_detail', 'bare');
    installSpy();
    await mount();
    expect(textOf('saepdetail-name')).toBe('Meena');
    expect(textOf('saepdetail-status')).toBe('Blocked');
    expect(allText()).not.toEqual(expect.arrayContaining(['check_circle']));
    expect(allText().filter(t => ['hourglass_full', 'info', 'cancel'].includes(t))).toHaveLength(0);
    expect(textOf('saepdetail-points')).toBe('0');
    expect(exists('saepdetail-address')).toBe(false);
    expect(exists('saepdetail-seller')).toBe(false);
    expect(exists('saepdetail-dealer')).toBe(false);
  });

  test.each(['failed', 'empty', 'malformed'])('SalesExecPlumberDetail.%s: no profile card, loader gone, no crash', async variant => {
    setFixtureVariant('app_karigar/sales_exec/plumber_detail', variant);
    installSpy();
    await mount();
    expect(exists('saepdetail-profile')).toBe(false);
    expect(exists('saepdetail-loading')).toBe(false);
    expect(allText()).toContain('Plumber Detail');
  });

  test('loading: "Loading…" shows while the request is open', async () => {
    installSpy('hang');
    await mount();
    expect(exists('saepdetail-loading')).toBe(true);
    expect(allText()).toContain('Loading…');
    expect(exists('saepdetail-profile')).toBe(false);
  });

  test('an HTTP error ends the loading state', async () => {
    installSpy('fail');
    await mount();
    expect(exists('saepdetail-loading')).toBe(false);
    expect(exists('saepdetail-profile')).toBe(false);
  });
});
