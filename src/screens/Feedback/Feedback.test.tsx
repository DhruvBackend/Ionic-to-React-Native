// Feedback screen (Ionic FeedbackPage): contract, submit flow, alert, navigation and quirks. See card.md.
import React from 'react';
import { StyleSheet } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import FeedbackScreen from './index';

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { reset: jest.fn() };
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

async function settle(ms = 350, rounds = 4) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
  }
}

async function mount() {
  await act(async () => {
    tree = ReactTestRenderer.create(<FeedbackScreen navigation={navigation as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options as any);
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const press = (id: string) => find(id).find(n => typeof n.props.onPress === 'function')!.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
const type = (text: string) => find('feedback-textarea').find(n => typeof n.props.onChangeText === 'function')!.props.onChangeText(text);
const fbCalls = () => calls.filter(c => c.fn === 'app_karigar/feedback');

beforeEach(() => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.reset.mockClear();
  calls = [];
  db.userStorageData = { id: '900001', type: 'Plumber' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contracts (card Endpoints)', () => {
  test('app_karigar/feedback: {karigar_id, feedback}', async () => {
    installSpy();
    await mount();
    await act(async () => type('Great app'));
    await expectContract('app_karigar/feedback', async () => {
      await act(async () => press('feedback-send'));
      await settle();
    });
    expect(JSON.parse(fbCalls()[0].body!)).toEqual({ karigar_id: '900001', feedback: 'Great app' });
  });
});

describe('states (card States)', () => {
  test('Feedback.default: empty textarea with the placeholder, no request on load, no loader', async () => {
    installSpy();
    await mount();
    expect(find('feedback-textarea').find(n => n.props.placeholder)!.props.placeholder).toBe('Write something');
    expect(find('feedback-textarea').find(n => 'value' in n.props)!.props.value).toBe('');
    expect(calls).toHaveLength(0);
    expect(openLoaders()).toHaveLength(0);
  });

  test('submit: ThankYou! alert with the exact text, then setRoot Tabs {index: "0"}; no loader', async () => {
    installSpy();
    await mount();
    await act(async () => type('Nice'));
    await act(async () => press('feedback-send'));
    expect(openLoaders()).toHaveLength(0);
    await settle();
    expect(alerts()).toHaveLength(1);
    expect(alerts()[0].title).toBe('ThankYou!');
    expect(alerts()[0].subTitle).toBe(' Your feedback has been submitted sucessfully');
    expect(alerts()[0].buttons).toEqual(['OK']);
    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Tabs', params: { index: '0' } }] });
  });

  test('nothing typed: submits anyway, `feedback` is dropped from the body', async () => {
    installSpy();
    await mount();
    await act(async () => press('feedback-send'));
    await settle();
    expect(JSON.parse(fbCalls()[0].body!)).toEqual({ karigar_id: '900001' });
    expect(alerts()).toHaveLength(1);
    expect(navigation.reset).toHaveBeenCalledTimes(1);
  });

  test.each(['failed', 'empty', 'malformed'])('answer variant %s: still success (the response is never read)', async variant => {
    setFixtureVariant('app_karigar/feedback', variant);
    installSpy();
    await mount();
    await act(async () => press('feedback-send'));
    await settle();
    expect(alerts()).toHaveLength(1);
    expect(navigation.reset).toHaveBeenCalledTimes(1);
  });

  test('HTTP error: nothing happens (no alert, no navigation)', async () => {
    installSpy(true);
    await mount();
    await act(async () => press('feedback-send'));
    await settle();
    expect(fbCalls()).toHaveLength(1);
    expect(alerts()).toHaveLength(0);
    expect(navigation.reset).not.toHaveBeenCalled();
  });
});

describe('textarea placeholder inset (parity)', () => {
  const style = () => StyleSheet.flatten(find('feedback-textarea').find(n => typeof n.props.onChangeText === 'function')!.props.style);
  test('main.css textarea::placeholder{padding-left:2px}: the placeholder sits 4 from the edge (UA 2 + 2), typed text 2', async () => {
    await mount();
    expect(style().paddingLeft).toBe(4);
    expect(style().padding).toBe(2);
    await act(async () => {
      type('hello');
    });
    expect(style().paddingLeft).toBeUndefined(); // falls back to padding 2
  });
});
