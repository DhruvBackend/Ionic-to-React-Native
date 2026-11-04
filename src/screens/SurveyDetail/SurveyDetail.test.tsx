// SurveyDetail screen (Ionic SurveyDetailPage): contracts, states, radio answers, counters, submit. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import SurveyDetailScreen from './index';
import route from './route';

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
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

async function mount(params: object | undefined = { id: 1 }, wait = true) {
  await act(async () => {
    tree = ReactTestRenderer.create(<SurveyDetailScreen route={{ params }} />);
  });
  if (wait) {
    await settle();
  }
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children)).filter(s => ![...s].every(ch => ch.charCodeAt(0) >= 0xe000 && ch.charCodeAt(0) <= 0xf8ff)); // drops icon glyphs (the back arrow)
const textOf = (id: string) => flat(find(id)[0].props.children);
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const openAlerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert' && !e.leaving);
const choose = async (q: number, a: number) => {
  const cover = find(`survey-ans-${q}-${a}-cover`).find(n => typeof n.props.onPress === 'function')!;
  await act(async () => cover.props.onPress());
  await settle(50, 2);
};
const save = async () => {
  const btn = find('survey-save').find(n => typeof n.props.onPress === 'function')!;
  await act(async () => btn.props.onPress());
  await settle();
};
const answerAll = async () => {
  await choose(0, 0);
  await choose(1, 1);
  await choose(2, 0);
};

beforeEach(() => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  calls = [];
  db.userStorageData = { id: '900001', type: 'Plumber' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('route', () => {
  test('carries the feature flag of the inventory and has no nav target', () => {
    expect(route.feature).toBe('survey');
    expect(route.links).toEqual([]);
  });
});

describe('contracts (card Endpoints)', () => {
  test('master/surveyDetail on entry: {id: String(id), user_id}', async () => {
    installSpy();
    await expectContract('master/surveyDetail', () => mount({ id: 1 }));
    expect(JSON.parse(calls[0].body!)).toEqual({ id: '1', user_id: '900001' });
  });

  test('master/surveyDetail without an id param sends the string "undefined"', async () => {
    installSpy();
    await mount({});
    expect(JSON.parse(calls[0].body!).id).toBe('undefined');
  });

  test('master/saveSurveyAnswer from Save once every question is answered: the whole question array with selected_answer', async () => {
    installSpy();
    await mount();
    await answerAll();
    await expectContract('master/saveSurveyAnswer', save);
    const body = JSON.parse(calls.find(c => c.fn === 'master/saveSurveyAnswer')!.body!);
    expect(body.survey_id).toBe(1);
    expect(body.question.map((q: any) => q.selected_answer)).toEqual(['1011', '1022', '1031']);
  });
});

describe('states (card States)', () => {
  test('SurveyDetail.default: title, counters (Total 3, Filled 0 after the first ionChange, Not Filled 3), three questions with their answers, Save', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining(['Customer Satisfaction Survey', 'Total', 'Filled', 'Not Filled', '1. How satisfied are you with our products?', 'Very satisfied', 'Within a week', 'No']),
    );
    expect(textOf('survey-total')).toBe('3');
    // the radio groups emit their (undefined) initial model once: checkcount() runs and the blank count becomes 0
    expect(textOf('survey-filled')).toBe('0');
    expect(textOf('survey-not-filled')).toBe('3');
    expect(exists('survey-question-2')).toBe(true);
    expect(exists('survey-save')).toBe(true);
    expect(openLoaders()).toHaveLength(0);
  });

  test('SurveyDetail.empty: title only, no counters, no Save', async () => {
    setFixtureVariant('master/surveyDetail', 'empty');
    installSpy();
    await mount();
    expect(allText()).toEqual(['Customer Satisfaction Survey']);
    expect(exists('survey-count')).toBe(false);
    expect(exists('survey-save')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('malformed (details: null): loader gone, the blank first render stays (binding throws)', async () => {
    setFixtureVariant('master/surveyDetail', 'malformed');
    installSpy();
    await mount();
    expect(allText()).toEqual([]);
    expect(exists('survey-count')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('HTTP error: the loader stays up, blank page', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
    expect(exists('survey-question-0')).toBe(false);
  });

  test('loader: "Please wait..." while the answer is pending', async () => {
    installSpy();
    await mount({ id: 1 }, false);
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('Please wait...');
  });
});

describe('answers and submit', () => {
  test('choosing an answer counts the question once; Filled and Not Filled follow', async () => {
    installSpy();
    await mount();
    await choose(0, 1);
    expect(textOf('survey-filled')).toBe('1');
    expect(textOf('survey-not-filled')).toBe('2');
    await choose(0, 2); // the same question again: still one
    expect(textOf('survey-filled')).toBe('1');
    await choose(2, 1);
    expect(textOf('survey-filled')).toBe('2');
    expect(textOf('survey-not-filled')).toBe('1');
  });

  test('Save with unanswered questions: Error alert "All questions fill compulsory. " (button ok), no request', async () => {
    installSpy();
    await mount();
    await choose(0, 0);
    await save();
    const alerts = openAlerts();
    expect(alerts).toHaveLength(1);
    expect((alerts[0].options as any).title).toBe('Error');
    expect((alerts[0].options as any).message).toBe('All questions fill compulsory. ');
    expect((alerts[0].options as any).buttons[0].text).toBe('ok');
    expect(calls.filter(c => c.fn === 'master/saveSurveyAnswer')).toHaveLength(0);
  });

  test('Save with every question answered and msg "success": Success alert', async () => {
    installSpy();
    await mount();
    await answerAll();
    await save();
    const alerts = openAlerts();
    expect(alerts).toHaveLength(1);
    expect((alerts[0].options as any).title).toBe('Success');
    expect((alerts[0].options as any).message).toBe('Your form Submit Succesfully');
  });

  test('Save answered with another msg: nothing is shown', async () => {
    installSpy();
    await mount();
    await answerAll();
    setFixtureVariant('master/saveSurveyAnswer', 'failed');
    await save();
    expect(openAlerts()).toHaveLength(0);
  });

  test('Save answered with a malformed body (no msg): nothing is shown', async () => {
    installSpy();
    await mount();
    await answerAll();
    setFixtureVariant('master/saveSurveyAnswer', 'malformed');
    await save();
    expect(openAlerts()).toHaveLength(0);
  });
});
