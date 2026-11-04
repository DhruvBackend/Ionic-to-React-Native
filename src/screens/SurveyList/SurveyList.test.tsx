// SurveyList screen (Ionic SurveyListPage): contract, states, navigation. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import SurveyListScreen from './index';
import route from './route';

jest.setTimeout(30000);
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

async function settle(ms = 350, rounds = 4) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
  }
}

async function mount(wait = true) {
  await act(async () => {
    tree = ReactTestRenderer.create(<SurveyListScreen navigation={navigation as any} />);
  });
  if (wait) {
    await settle();
  }
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);

beforeEach(() => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  calls = [];
  db.userStorageData = { id: '900001', type: 'Plumber' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('route', () => {
  test('carries the feature flag of the inventory and its nav target', () => {
    expect(route.feature).toBe('survey');
    expect(route.links).toEqual(['SurveyDetail']);
  });
});

describe('contracts (card Endpoints)', () => {
  test('master/surveyList on entry: {user_id}, the loader shown first', async () => {
    installSpy();
    await expectContract('master/surveyList', () => mount());
    expect(JSON.parse(calls[0].body!)).toEqual({ user_id: '900001' });
  });
});

describe('states (card States)', () => {
  test('SurveyList.default: title and one card per survey', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Survey', 'Customer Satisfaction Survey', 'Product Feedback Survey', 'Installation Experience']));
    expect(exists('surveylist-card-2')).toBe(true);
    expect(exists('surveylist-empty')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('SurveyList.empty: only the no_found image', async () => {
    setFixtureVariant('master/surveyList', 'empty');
    installSpy();
    await mount();
    expect(exists('surveylist-card-0')).toBe(false);
    expect(exists('surveylist-empty')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
  });

  test('malformed (surveyList: null): loader gone, nothing breaks, the empty page stays', async () => {
    setFixtureVariant('master/surveyList', 'malformed');
    installSpy();
    await mount();
    expect(exists('surveylist-card-0')).toBe(false);
    expect(exists('surveylist-empty')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
  });

  test('HTTP error: the loader stays up (no error callback in Ionic)', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
  });

  test('loader: "Please wait..." while the answer is pending', async () => {
    installSpy();
    await mount(false);
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('Please wait...');
  });
});

describe('navigation', () => {
  test('tapping a card header pushes SurveyDetail with {id}', async () => {
    installSpy();
    await mount();
    const card = find('surveylist-card-1')[0];
    const pressable = card.findAll(n => typeof n.props.onPress === 'function')[0];
    await act(async () => pressable.props.onPress({ nativeEvent: {} }));
    expect(navigation.push).toHaveBeenLastCalledWith('SurveyDetail', { id: 2 });
  });
});
