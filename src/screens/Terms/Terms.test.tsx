// Terms screen (Ionic TermsPage): contract, both term branches, loader, malformed, HTTP error. See card.md.
import React from 'react';
import { Image } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import TermsScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

function installSpy(failing = false) {
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    if (failing) {
      return Promise.reject(new HttpError(500, {}));
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

async function mount(params: any = { id: 11, term: 'term_and_conditions' }) {
  await act(async () => {
    tree = ReactTestRenderer.create(<TermsScreen route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const body = () => flat(find('terms-body').find(n => (n.type as any) === 'Text')!.props.children);
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  calls = [];
  db.userStorageData = { id: '900001', type: 'Plumber' };
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});

afterEach(() => {
  restoreTransport();
  restoreTransport = () => {};
  jest.restoreAllMocks();
});

describe('contract (card Endpoints)', () => {
  test('app_karigar/offerTermCondition: {offer_id, karigar_id} on mount', async () => {
    await expectContract('app_karigar/offerTermCondition', () => mount());
  });
  test('the body is {offer_id: <id param>, karigar_id: 22}', async () => {
    installSpy();
    await mount();
    expect(JSON.parse(calls.find(c => c.fn === 'app_karigar/offerTermCondition')!.body!)).toEqual({ offer_id: 11, karigar_id: 22 });
  });
});

describe('states (card States)', () => {
  test("Terms.default (term 'term_and_conditions'): title and the terms text, not the description", async () => {
    installSpy();
    await mount();
    expect(allText()).toContain('Terms & Condtion');
    expect(body()).toContain('Points are valid only until the end date');
    expect(exists('terms-text')).toBe(true);
    expect(exists('terms-description')).toBe(false);
    expect(find('terms-banner')[0].props.source).toEqual({ uri: db.upload_url3 + 'offer_banner_11.jpg' });
    expect(openLoaders()).toHaveLength(0);
  });

  test("Terms.description (any other term): title 'Description' and the description text", async () => {
    installSpy();
    await mount({ id: 11, term: 'discriptions' });
    expect(allText()).toContain('Description');
    expect(body()).toContain('Scan the coupons on our products');
    expect(exists('terms-description')).toBe(true);
  });

  test('no term param behaves like the description branch (undefined != term_and_conditions)', async () => {
    installSpy();
    await mount({ id: 11 });
    expect(allText()).toContain('Description');
    expect(body()).toContain('Scan the coupons');
  });

  test('hin: the translated titles (global language)', async () => {
    installSpy();
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(allText()).toContain(i18n.t('Terms & Condtion'));
  });

  test('html in the text: <br> breaks, other tags are dropped, entities decoded (kit stripHtml)', async () => {
    installSpy();
    setFixtureVariant('app_karigar/offerTermCondition', 'default');
    const previous = getTransport();
    setTransport(async req => {
      const r: any = await previous(req);
      return { ...r, offer: { ...r.offer, terms: '<b>One</b> &amp; two<br>three' } };
    });
    restoreTransport = () => setTransport(previous);
    await mount();
    expect(body()).toBe('One & two\nthree');
  });

  test('empty offer {}: banner src ends in "undefined", empty text, loader gone', async () => {
    setFixtureVariant('app_karigar/offerTermCondition', 'empty');
    await mount();
    expect(find('terms-banner')[0].props.source).toEqual({ uri: db.upload_url3 + 'undefined' });
    expect(body()).toBe('');
    expect(openLoaders()).toHaveLength(0);
  });

  test('malformed (offer: null): no crash, the first-load view stays, loader gone', async () => {
    setFixtureVariant('app_karigar/offerTermCondition', 'malformed');
    await mount();
    expect(find('terms-banner')[0].props.source).toEqual({ uri: db.upload_url3 + 'undefined' });
    expect(body()).toBe('');
    expect(openLoaders()).toHaveLength(0);
  });

  test('NOT FOUND (no offer key): same as malformed', async () => {
    setFixtureVariant('app_karigar/offerTermCondition', 'NOT FOUND');
    await mount();
    expect(body()).toBe('');
    expect(openLoaders()).toHaveLength(0);
  });

  test('the banner is sized from its natural size, capped at the box width', async () => {
    jest.spyOn(Image, 'getSize').mockImplementation(((_u: string, ok: (w: number, h: number) => void) => ok(1000, 500)) as any);
    await mount();
    await act(async () => {
      find('terms-banner-box')[0].props.onLayout({ nativeEvent: { layout: { width: 332, height: 0 } } });
    });
    const style = find('terms-banner')[0].props.style;
    expect(style.width).toBe(320);
    expect(style.height).toBe(160);
  });
});

describe('loader (terms.ts:43-50)', () => {
  test("'Please wait...' with dismissOnPageChange while the request is pending", async () => {
    await act(async () => {
      tree = ReactTestRenderer.create(<TermsScreen route={{ params: { id: 11, term: 'x' } } as any} />);
    });
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('Please wait...');
    expect((loaders[0].options as any).dismissOnPageChange).toBe(true);
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });

  test('HTTP error: no error callback, the loader stays up and the view is the empty first-load view', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
    expect(body()).toBe('');
  });
});
