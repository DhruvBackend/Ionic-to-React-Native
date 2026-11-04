// SalesExecHome screen (Ionic SalesExecHomePage): contracts, states, navigation. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import sessions from '../../api/fixtures/_sessions.json';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import SalesExecHomeScreen from './index';

const mockResetTo = jest.fn();
jest.mock('../../navigation/navigationRef', () => ({ ...jest.requireActual('../../navigation/navigationRef'), resetTo: (...a: any[]) => mockResetTo(...a) }));

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
let navHandlers: Record<string, () => void> = {};
const navigation = {
  push: jest.fn(),
  addListener: (e: string, cb: () => void) => {
    navHandlers[e] = cb;
    return () => {};
  },
};
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
      jest.advanceTimersByTime(350);
    });
  }
}
async function mount(overrides: object = {}) {
  db.userStorageData = { ...(sessions as any).Sales_Executive, ...overrides };
  await act(async () => {
    tree = ReactTestRenderer.create(<SalesExecHomeScreen navigation={navigation as any} />);
  });
  await act(async () => {
    navHandlers.focus?.();
  });
  await settle();
}
const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' ? c : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
async function press(id: string) {
  const target = find(id).find(n => typeof n.props.onPress === 'function')!;
  expect(target).toBeDefined();
  await act(async () => {
    target.props.onPress();
  });
  await settle();
}

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  mockResetTo.mockClear();
  navHandlers = {};
  calls = [];
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
  test.each([['app_karigar/sales_exec/summary'], ['app_karigar/loginBannersApp'], ['app_karigar/offerList']])(
    '%s is requested on entry, as Ionic does',
    async endpoint => {
      await expectContract(endpoint, () => mount());
    },
  );
});

describe('states', () => {
  test('default: greeting, counts, points, buttons', async () => {
    await mount();
    const t = allText();
    expect(t).toEqual(expect.arrayContaining(['Hello, Test Sales Executive', '9000000004', 'Active', 'Inactive', 'Total', 'My Points', '1250', '30', '12', '42']));
    expect(t.filter(x => x === 'PLUMBERS')).toHaveLength(3);
    for (const l of ['Add Plumber', 'Plumber List', 'Add Seller', 'Seller List', 'Add Dealer', 'Dealer List']) {
      expect(t).toContain(l);
    }
    expect(find('seh-offer-slides').length).toBeGreaterThan(0);
  });
  test('empty: zero counts, banner slides absent, bundled banner', async () => {
    setFixtureVariant('app_karigar/sales_exec/summary', 'empty');
    setFixtureVariant('app_karigar/offerList', 'empty');
    setFixtureVariant('app_karigar/loginBannersApp', 'empty');
    await mount();
    expect(find('seh-offer-slides')).toHaveLength(0);
    expect(find('seh-banner-slides').length).toBeGreaterThan(0);
  });
  test('login banners show when there are no offers', async () => {
    setFixtureVariant('app_karigar/offerList', 'empty');
    await mount();
    expect(find('seh-offer-slides')).toHaveLength(0);
    expect(find('seh-banner-slides').length).toBeGreaterThan(0);
  });
  test('failed summary keeps the zero defaults', async () => {
    setFixtureVariant('app_karigar/sales_exec/summary', 'failed');
    await mount();
    expect(find('seh-my-points').length).toBeGreaterThan(0);
    expect(flat(find('seh-my-points')[0].props.children)).toBe('0');
  });
  test('malformed responses render without throwing', async () => {
    setFixtureVariant('app_karigar/sales_exec/summary', 'malformed');
    setFixtureVariant('app_karigar/offerList', 'malformed');
    setFixtureVariant('app_karigar/loginBannersApp', 'malformed');
    await mount();
    expect(allText()).toContain('My Points');
  });
  test('no user id: no summary / offers request, banners still requested', async () => {
    await mount({ id: undefined });
    const fns = calls.map(c => c.fn);
    expect(fns).not.toContain('app_karigar/sales_exec/summary');
    expect(fns).not.toContain('app_karigar/offerList');
    expect(fns).toContain('app_karigar/loginBannersApp');
  });
});

describe('navigation', () => {
  test.each([
    ['seh-add-plumber', 'SalesExecAddPlumber', undefined],
    ['seh-plumber-list', 'SalesExecPlumberList', undefined],
    ['seh-add-seller', 'SalesExecAddSeller', undefined],
    ['seh-seller-list', 'SalesExecPlumberList', { list_type: 'Sales_Boy' }],
    ['seh-add-dealer', 'SalesExecAddDealer', undefined],
    ['seh-dealer-list', 'SalesExecPlumberList', { list_type: 'Dealer' }],
    ['seh-active', 'SalesExecPlumberList', undefined],
    ['seh-inactive', 'SalesExecPlumberList', undefined],
    ['seh-total', 'SalesExecPlumberList', undefined],
  ])('%s pushes %s', async (id, target, params) => {
    await mount();
    await press(id);
    expect(navigation.push).toHaveBeenCalledTimes(1);
    if (params) {
      expect(navigation.push).toHaveBeenCalledWith(target, params);
    } else {
      expect(navigation.push).toHaveBeenCalledWith(target);
    }
  });

  test('logout: confirm alert, Yes clears the user and resets to Language', async () => {
    await mount();
    await press('seh-logout');
    const a = overlayStore.getEntries().find(o => o.kind === 'alert' && !o.leaving)!;
    expect(a.options.title).toBe('Logout');
    expect(a.options.message).toBe('Do you want to logout?');
    expect(a.options.buttons.map((b: any) => b.text)).toEqual(['Cancel', 'Yes']);
    await act(async () => {
      a.options.buttons[1].handler();
    });
    expect(db.userStorageData).toEqual({});
    expect(mockResetTo).toHaveBeenCalledWith('Language');
  });
});
