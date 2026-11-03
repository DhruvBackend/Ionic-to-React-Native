// Super30 screen (Ionic Super30Page): contracts, states, active row, title rank, refresh, malformed, HTTP errors. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import { super30Md as S } from '../../theme/ionicMdSuper30';
import Super30Screen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

function installSpy(failing?: string) {
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    if (failing && req.fn === failing) {
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

async function mount() {
  await act(async () => {
    tree = ReactTestRenderer.create(<Super30Screen />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const textOf = (id: string) => flat(find(id).find(n => (n.type as any) === 'Text')!.props.children);
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const refresher = () => tree.root.findAll(n => typeof n.props.onRefresh === 'function')[0];
const listCalls = () => calls.filter(c => c.fn === 'app_karigar/getSuperPlumberList');
const title = () => allText().find(s => / : [0-9]*$/.test(s));

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
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contracts (card Endpoints)', () => {
  test('app_karigar/get_country: GET on mount', async () => {
    installSpy();
    await expectContract('app_karigar/get_country', () => mount());
  });
  test('app_karigar/getSuperPlumberList: {filter: {limit: 0, country}} with the country from get_country', async () => {
    installSpy();
    await expectContract('app_karigar/getSuperPlumberList', () => mount());
    expect(JSON.parse(listCalls()[0].body!)).toEqual({ filter: { limit: 0, country: 'India' } });
  });
  test('loadData (the second call site, :116) is dead: only one list request on load', async () => {
    installSpy();
    await mount();
    expect(listCalls()).toHaveLength(1);
  });
});

describe('states', () => {
  test('Super30.default: five rows, the Plumber own row is active, title shows the rank', async () => {
    await mount();
    expect(title()).toBe('super30 || Your Rank : 3');
    expect(exists('super30-empty')).toBe(false);
    expect(find('super30-item-4')).not.toHaveLength(0);
    expect(textOf('super30-name-0')).toBe('Rakesh Kumar');
    expect(textOf('super30-name-1')).toBe('Suresh Yadav');
    expect(textOf('super30-place-0')).toBe('Lucknow Uttar Pradesh');
    expect(exists('super30-gradient')).toBe(true);
    // the active row is index 2 (id 900001 == '900001', loose compare of a number with a string)
    expect(find('super30-detail-2')[0].props.style).toEqual(expect.arrayContaining([expect.objectContaining({ borderWidth: 0 })]));
    expect(openLoaders()).toHaveLength(0);
  });
  test('stars: rating 3 lights three stars (number coerced against the strings)', async () => {
    await mount();
    const c = (n: string) => JSON.stringify(find(`super30-star-2-${n}`)[0].findAll(x => (x.type as any) === 'Text')[0].props.style);
    expect(c('3')).toContain(S.starOn);
    expect(c('4')).toContain(S.starOff);
  });
  test('Super30.notRanked: user not in karigarData, title ends in " : "', async () => {
    setFixtureVariant('app_karigar/getSuperPlumberList', 'notRanked');
    await mount();
    expect(title()).toBe('super30 || Your Rank : ');
    expect(exists('super30-gradient')).toBe(false);
    expect(exists('super30-item-1')).toBe(true);
    expect(exists('super30-item-2')).toBe(false);
  });
  test('Super30.empty: no_found image, no rows', async () => {
    setFixtureVariant('app_karigar/getSuperPlumberList', 'empty');
    await mount();
    expect(exists('super30-empty')).toBe(true);
    expect(exists('super30-item-0')).toBe(false);
  });
  test('Super30.hin: translated title', async () => {
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(title()).toBe('सुपर 30 || आपका रैंक : 3');
  });
  test('the loader only flashes: nothing is left open after the response', async () => {
    await mount();
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('malformed and errors (Review Focus 2 and 4)', () => {
  test('malformed (karigars: null, karigarData: null): no crash, first-load empty state stays', async () => {
    setFixtureVariant('app_karigar/getSuperPlumberList', 'malformed');
    await mount();
    expect(exists('super30-empty')).toBe(true);
    expect(title()).toBe('super30 || Your Rank : ');
  });
  test('get_country malformed ({}): list is requested with no country', async () => {
    setFixtureVariant('app_karigar/get_country', 'malformed');
    installSpy();
    await mount();
    expect(JSON.parse(listCalls()[0].body!)).toEqual({ filter: { limit: 0 } });
  });
  test('get_country HTTP error: nothing else happens, no loader', async () => {
    installSpy('app_karigar/get_country');
    await mount();
    expect(listCalls()).toHaveLength(0);
    expect(exists('super30-empty')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
  });
  test('list HTTP error: empty state, no loader left, no crash', async () => {
    installSpy('app_karigar/getSuperPlumberList');
    await mount();
    expect(exists('super30-empty')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
  });
});

describe('refresh', () => {
  test('doRefresh asks again with an EMPTY country and completes right away (quirk)', async () => {
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      refresher().props.onRefresh({ complete });
    });
    await settle();
    expect(complete).toHaveBeenCalledTimes(1);
    expect(listCalls()).toHaveLength(2);
    expect(JSON.parse(listCalls()[1].body!)).toEqual({ filter: { limit: 0, country: '' } });
  });
  test('malformed refresh keeps the old list', async () => {
    await mount();
    setFixtureVariant('app_karigar/getSuperPlumberList', 'malformed');
    await act(async () => {
      refresher().props.onRefresh({ complete: jest.fn() });
    });
    await settle();
    expect(exists('super30-item-4')).toBe(true);
    expect(title()).toBe('super30 || Your Rank : 3');
  });
  test('SelfData.index is never reset: a refresh without the user keeps the old rank', async () => {
    await mount();
    setFixtureVariant('app_karigar/getSuperPlumberList', 'notRanked');
    await act(async () => {
      refresher().props.onRefresh({ complete: jest.fn() });
    });
    await settle();
    expect(exists('super30-item-2')).toBe(false);
    expect(title()).toBe('super30 || Your Rank : 3');
  });
});

describe('S8 review additions', () => {
  const onStars = (i: number) =>
    ['1', '2', '3', '4', '5'].filter(n =>
      JSON.stringify(find(`super30-star-${i}-${n}`)[0].findAll(x => (x.type as any) === 'Text')[0].props.style).includes(S.starOn),
    ).length;
  const withRows = (ratings: any[]) => {
    const rows = ratings.map((rating, k) => ({ id: 1000 + k, first_name: 'x', city: 'c', state: 's', rating, profile: '' }));
    const previous = getTransport();
    setTransport(req => (req.fn === 'app_karigar/getSuperPlumberList' ? Promise.resolve({ status: 'SUCCESS', karigars: rows, karigarData: [] }) : previous(req)));
    restoreTransport = () => setTransport(previous);
  };
  test('string ratings compare as text: "3" lights 3 stars, "10" lights 1 ("10" >= "1" only)', async () => {
    withRows(['3', '10']);
    await mount();
    expect(onStars(0)).toBe(3);
    expect(onStars(1)).toBe(1);
  });
  test('karigarData null but karigars valid: the list shows, the rank stays empty', async () => {
    const previous = getTransport();
    setTransport(req =>
      req.fn === 'app_karigar/getSuperPlumberList'
        ? Promise.resolve({ status: 'SUCCESS', karigars: [{ id: 900001, first_name: 'a', city: 'c', state: 's', rating: 2, profile: '' }], karigarData: null })
        : previous(req),
    );
    restoreTransport = () => setTransport(previous);
    await mount();
    expect(exists('super30-item-0')).toBe(true);
    expect(exists('super30-empty')).toBe(false);
    expect(title()).toBe('super30 || Your Rank : ');
  });
});
