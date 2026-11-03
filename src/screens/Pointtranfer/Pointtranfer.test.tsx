// Pointtranfer screen (Ionic PointtranferPage): contracts, validation alerts, limit / balance compares, karigar_not_exist, SUCCESS + pop. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import sessions from '../../api/fixtures/_sessions.json';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import route from './route';
import PointtranferScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { goBack: jest.fn() };
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

async function settle() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
  }
}
async function mount(params: object | undefined = { totalPoint: 1250 }) {
  db.userStorageData = { ...(sessions as any).Plumber };
  await act(async () => {
    tree = ReactTestRenderer.create(<PointtranferScreen navigation={navigation as any} route={params ? ({ params } as any) : undefined} />);
  });
  await settle();
}
const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' ? c : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const input = (id: string) => find(id).find(n => typeof n.props.onChangeText === 'function')!;
async function type(id: string, text: string) {
  await act(async () => {
    input(id).props.onChangeText(text);
  });
}
async function submit() {
  const target = find('transfer-submit').find(n => typeof n.props.onPress === 'function')!;
  expect(target).toBeDefined();
  await act(async () => {
    target.props.onPress();
  });
  await settle();
}
const lastAlert = () => overlayStore.getEntries().filter(o => o.kind === 'alert').pop()!;
const alertCount = () => overlayStore.getEntries().filter(o => o.kind === 'alert').length;
const callsTo = (fn: string) =>
  calls.filter(c => c.fn === fn).map(c => ({ ...c, body: typeof c.body === 'string' ? JSON.parse(c.body) : c.body }));

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.goBack.mockClear();
  calls = [];
  await act(async () => {
    await i18n.changeLanguage('en');
  });
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    return previous(req);
  });
  restoreTransport = () => setTransport(previous);
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

test('route: a pushed card page with no nav targets, behind the pointTransfer flag', () => {
  expect(route.name).toBe('Pointtranfer');
  expect(route.presentation).toBe('card');
  expect(route.feature).toBe('pointTransfer');
  expect(route.links).toEqual([]);
});

describe('contract (card Endpoints)', () => {
  test('app_karigar/plumber_limit on load: {}', async () => {
    await expectContract('app_karigar/plumber_limit', () => mount());
  });
  test('app_karigar/plumber_transfer_points: {mobile_no, points, karigar_id}', async () => {
    await mount();
    await type('mobile-input', '9812345670');
    await type('points-input', '100');
    await expectContract('app_karigar/plumber_transfer_points', submit);
  });
});

describe('render', () => {
  test('default: title, two inputs, button; plumber_limit is the only request on load', async () => {
    await mount();
    const t = allText();
    expect(t).toContain('Point Transfer');
    expect(t.map(s => s.toLowerCase())).toContain('transfer point');
    expect(input('mobile-input').props.placeholder).toBe('Mobile No');
    expect(input('mobile-input').props.maxLength).toBe(10);
    expect(input('mobile-input').props.keyboardType).toBe('phone-pad');
    expect(input('points-input').props.placeholder).toBe('Transfer Amount');
    expect(input('points-input').props.maxLength).toBeUndefined();
    expect(calls.map(c => c.fn)).toEqual(['app_karigar/plumber_limit']);
  });
  test('Hindi selected: the translated keys follow the global language', async () => {
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(input('mobile-input').props.placeholder).toBe(i18n.t('Mobile No'));
  });
  test.each(['empty', 'malformed'])('%s limit answer renders without throwing', async variant => {
    setFixtureVariant('app_karigar/plumber_limit', variant);
    await mount();
    expect(allText()).toContain('Point Transfer');
  });
});

describe('submit validation (no request, alert "Alert!")', () => {
  test('empty mobile number', async () => {
    await mount();
    await submit();
    expect(lastAlert().options).toMatchObject({ title: 'Alert!', subTitle: 'Please Enter a Mobile Number', buttons: ['ok'] });
    expect(callsTo('app_karigar/plumber_transfer_points')).toHaveLength(0);
  });
  test('empty amount: exact Ionic text, double space kept', async () => {
    await mount();
    await type('mobile-input', '9812345670');
    await submit();
    expect(lastAlert().options.subTitle).toBe('Please  Enter Transfer Amount');
  });
  test('amount above the limit (500): "You Can Transfer Only 500 Point"', async () => {
    await mount();
    await type('mobile-input', '9812345670');
    await type('points-input', '600');
    await submit();
    expect(lastAlert().options.subTitle).toBe('You Can  Transfer Only 500 Point ');
    expect(callsTo('app_karigar/plumber_transfer_points')).toHaveLength(0);
  });
  test('limit string from the server: compared as strings ("500" < "60")', async () => {
    setFixtureVariant('app_karigar/plumber_limit', 'string');
    await mount();
    await type('mobile-input', '9812345670');
    await type('points-input', '60');
    await submit();
    expect(lastAlert().options.subTitle).toBe('You Can  Transfer Only 500 Point ');
  });
  test('limit answer missing (empty): limit is undefined, the compare is false and the transfer goes on', async () => {
    setFixtureVariant('app_karigar/plumber_limit', 'empty');
    await mount();
    await type('mobile-input', '9812345670');
    await type('points-input', '100');
    await submit();
    expect(callsTo('app_karigar/plumber_transfer_points')).toHaveLength(1);
  });
  test('limit request failed: limit stays 0, any amount is refused', async () => {
    const prev = getTransport();
    setTransport(req => (req.fn === 'app_karigar/plumber_limit' ? Promise.reject(new Error('offline')) : prev(req)));
    await mount();
    await type('mobile-input', '9812345670');
    await type('points-input', '5');
    await submit();
    expect(lastAlert().options.subTitle).toBe('You Can  Transfer Only 0 Point ');
  });
  test('amount above the balance (but within the limit): "You Have Insufficient Balence"', async () => {
    await mount({ totalPoint: 50 });
    await type('mobile-input', '9812345670');
    await type('points-input', '100');
    await submit();
    expect(lastAlert().options.subTitle).toBe('You Have Insufficient Balence');
    expect(callsTo('app_karigar/plumber_transfer_points')).toHaveLength(0);
  });
  test('no params: total_point undefined, the balance compare is false', async () => {
    await mount(undefined);
    await type('mobile-input', '9812345670');
    await type('points-input', '100');
    await submit();
    expect(callsTo('app_karigar/plumber_transfer_points')).toHaveLength(1);
  });
});

describe('transfer', () => {
  test('SUCCESS: body, alert "Point Transfer Successfully", button disabled, goBack', async () => {
    await mount();
    await type('mobile-input', '9812345670');
    await type('points-input', '100');
    await submit();
    expect(callsTo('app_karigar/plumber_transfer_points')[0].body).toEqual({ mobile_no: '9812345670', points: '100', karigar_id: '900001' });
    expect(lastAlert().options).toMatchObject({ title: 'Alert!', subTitle: 'Point Transfer Successfully', buttons: ['ok'] });
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(find('transfer-submit').some(n => n.props.disabled === true || n.props.accessibilityState?.disabled === true)).toBe(true);
  });
  test('karigar_not_exist: alert "Plumber not Exist", stays on the page, button still enabled', async () => {
    setFixtureVariant('app_karigar/plumber_transfer_points', 'karigar_not_exist');
    await mount();
    await type('mobile-input', '9812345670');
    await type('points-input', '100');
    await submit();
    expect(lastAlert().options).toMatchObject({ title: 'Alert!', subTitle: 'Plumber not Exist' });
    expect(navigation.goBack).not.toHaveBeenCalled();
    expect(find('transfer-submit').some(n => n.props.disabled === true)).toBe(false);
  });
  test.each(['empty', 'malformed'])('%s answer: nothing happens, no crash', async variant => {
    setFixtureVariant('app_karigar/plumber_transfer_points', variant);
    await mount();
    await type('mobile-input', '9812345670');
    await type('points-input', '100');
    await submit();
    expect(alertCount()).toBe(0);
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
  test('network error: no error callback in Ionic, nothing happens (no loader either)', async () => {
    const prev = getTransport();
    setTransport(req => (req.fn === 'app_karigar/plumber_transfer_points' ? Promise.reject(new Error('offline')) : prev(req)));
    await mount();
    await type('mobile-input', '9812345670');
    await type('points-input', '100');
    await submit();
    expect(alertCount()).toBe(0);
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
  test('a short mobile number is sent as typed (minlength is not checked)', async () => {
    await mount();
    await type('mobile-input', '123');
    await type('points-input', '10');
    await submit();
    expect(callsTo('app_karigar/plumber_transfer_points')[0].body.mobile_no).toBe('123');
  });
});
