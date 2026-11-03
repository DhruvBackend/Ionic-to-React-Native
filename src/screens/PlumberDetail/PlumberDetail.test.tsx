// PlumberDetail screen (Ionic PlumberDetailPage): contract, states (viewer role / karigar type branches), translation. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import PlumberDetailScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn() };
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

function installSpy(failing = false) {
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    return failing ? Promise.reject(new HttpError(500, {})) : previous(req);
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

async function mount() {
  await act(async () => {
    tree = ReactTestRenderer.create(<PlumberDetailScreen navigation={navigation as any} route={{ params: { id: 401 } }} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const profileCalls = () => calls.filter(c => c.fn === 'app_karigar/profile');

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  calls = [];
  db.userStorageData = { id: '900002', type: 'Sales_Boy' };
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contracts (card Endpoints)', () => {
  test('app_karigar/profile: {karigar_id} from the nav param behind a loader that closes with the answer', async () => {
    setFixtureVariant('app_karigar/profile', 'plumber_detail');
    installSpy();
    await expectContract('app_karigar/profile', () => mount());
    expect(profileCalls()).toHaveLength(1);
    expect(JSON.parse(profileCalls()[0].body!)).toEqual({ karigar_id: 401 });
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('states (card States)', () => {
  test('PlumberDetail.default (Sales_Boy views a Plumber): type line, details, bank table, document', async () => {
    setFixtureVariant('app_karigar/profile', 'plumber_detail');
    installSpy();
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining([
        'Plumber Detail',
        'Ramesh Kumar',
        'Plumber',
        '+919000000401',
        '14 May,1990',
        '12 Rajnagar Extension Uttar Pradesh Ghaziabad Sahibabad 201010',
        'Permanent Address',
        '45 Gandhi Nagar Uttar Pradesh Meerut Meerut 250001',
        'Bank Information',
        'Account Holder Name',
        'Ramesh Kumar',
        'State Bank',
        '30123456789',
        'SBIN0000123',
        'Document Information',
        'Aadhar Card',
        '1234 5678 9012',
      ]),
    );
    expect(exists('plumberdetail-status')).toBe(false);
    expect(exists('plumberdetail-dealer')).toBe(false);
    expect(exists('plumberdetail-document')).toBe(true);
    expect(find('plumberdetail-image')[0].props.source.uri).toBe(db.upload_url3 + 'profile/ramesh.jpg');
  });

  test('PlumberDetail.plumber (a Plumber views the page): status line with the no-break space, dealer information', async () => {
    db.userStorageData = { id: '900002', type: 'Plumber' };
    setFixtureVariant('app_karigar/profile', 'plumber_detail');
    installSpy();
    await mount();
    expect(exists('plumberdetail-type')).toBe(false);
    expect(allText()).toContain('Verified  (Plumber)');
    expect(allText()).toContain('Dealer Information');
    expect(allText()).toContain('Mohan Lal (9810000013)');
  });

  test('PlumberDetail.bare: default picture, dashes and N/A, no permanent address, no document', async () => {
    setFixtureVariant('app_karigar/profile', 'plumber_detail_bare');
    installSpy();
    await mount();
    expect(exists('plumberdetail-image-default')).toBe(true);
    expect(exists('plumberdetail-image')).toBe(false);
    expect(flat(find('plumberdetail-dob')[0].props.children)).toBe('----');
    expect(exists('plumberdetail-permanent')).toBe(false);
    expect(exists('plumberdetail-document')).toBe(false);
    expect([0, 1, 2, 3].map(i => flat(find(`plumberdetail-bank-${i}`)[0].props.children))).toEqual(['N/A', 'N/A', 'N/A', 'N/A']);
    expect(flat(find('plumberdetail-type')[0].props.children)).toBe('Dealer');
    expect(flat(find('plumberdetail-name')[0].props.children)).toBe('Sunita Pawar');
  });

  test('PlumberDetail.hin: translated labels, hard-coded title stays', async () => {
    setFixtureVariant('app_karigar/profile', 'plumber_detail');
    installSpy();
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    const texts = allText();
    for (const key of ['Mobile No.', 'Date of Birth', 'Working Address', 'Bank Information', 'Document Information']) {
      expect(texts).toContain(i18n.t(key).replace(/\s+/g, ' '));
    }
    expect(texts).toContain('Plumber Detail');
  });

  test('PlumberDetail.malformed (karigar: null): no crash, loader gone, the blank page stays', async () => {
    setFixtureVariant('app_karigar/profile', 'malformed');
    installSpy();
    await mount();
    expect(openLoaders()).toHaveLength(0);
    expect(flat(find('plumberdetail-name')[0].props.children)).toBe('');
  });

  test('an HTTP error leaves the "Please wait..." loader up (no error callback in Ionic)', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
  });
});
