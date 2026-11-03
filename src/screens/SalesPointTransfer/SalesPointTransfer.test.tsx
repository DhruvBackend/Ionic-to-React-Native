// SalesPointTransfer screen (Ionic SalesPointTransferPage): contracts, plumber list labels, required points, bonus_points statuses. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, setTransport, type ApiRequest } from '../../api/client';
import sessions from '../../api/fixtures/_sessions.json';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import route from './route';
import SalesPointTransferScreen from './index';

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
  db.userStorageData = { ...(sessions as any).Sales_Boy };
  await act(async () => {
    tree = ReactTestRenderer.create(
      <SalesPointTransferScreen navigation={navigation as any} route={params ? ({ params } as any) : undefined} />,
    );
  });
  await settle();
}
const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' ? c : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const input = (id: string) => find(id).find(n => typeof n.props.onChangeText === 'function')!;
const selectable = () => find('plumber-select').find(n => typeof n.props.onChange === 'function')!;
async function type(text: string) {
  await act(async () => {
    input('points-input').props.onChangeText(text);
  });
}
async function pick(item: any) {
  await act(async () => {
    selectable().props.onChange(item, { value: item });
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
const isDisabled = () => find('transfer-submit').some(n => n.props.disabled === true || n.props.accessibilityState?.disabled === true);

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
  expect(route.name).toBe('SalesPointTransfer');
  expect(route.presentation).toBe('card');
  expect(route.feature).toBe('pointTransfer');
  expect(route.links).toEqual([]);
});

describe('contract (card Endpoints)', () => {
  test('app_karigar/list_of_plumber on load: {filter: {limit: 20}}', async () => {
    await expectContract('app_karigar/list_of_plumber', () => mount());
    expect(callsTo('app_karigar/list_of_plumber')[0].body).toEqual({ filter: { limit: 20 } });
  });
  test('app_karigar/bonus_points: {sales_boy_id, plumber_id, points}', async () => {
    await mount();
    await pick(selectable().props.items[0]);
    await type('100');
    await expectContract('app_karigar/bonus_points', submit);
  });
});

describe('render', () => {
  test('default: title, label, placeholder, button; list_of_plumber is the only request on load', async () => {
    await mount();
    const t = allText();
    expect(t).toContain('Point Transfer');
    expect(t).toContain('Select plumber*');
    expect(t.map(s => s.toLowerCase())).toContain('transfer point');
    expect(input('points-input').props.placeholder).toBe('Transfer Amount');
    expect(input('points-input').props.keyboardType).toBe('phone-pad');
    expect(calls.map(c => c.fn)).toEqual(['app_karigar/list_of_plumber']);
  });
  test('the picker labels are "name(mobile)"; a null name or mobile becomes ""', async () => {
    await mount();
    expect(selectable().props.items.map((i: any) => i.first_name)).toEqual([
      'Rakesh Verma(9810000001)',
      'Sunil Kumar(9810000011)',
      'Mohan Lal(9810000012)',
    ]);
    expect(selectable().props.canSearch).toBe(true);
    expect(selectable().props.itemValueField).toBe('first_name');
  });
  test('null name / null mobile: "(mobile)", "name()", and "" when both are null', async () => {
    setFixtureVariant('app_karigar/list_of_plumber', 'nulls');
    await mount();
    expect(selectable().props.items.map((i: any) => i.first_name)).toEqual(['(9810000021)', 'Anil Sharma()', '']);
  });
  test('Hindi selected: the translated keys follow the global language', async () => {
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(input('points-input').props.placeholder).toBe(i18n.t('Transfer Amount'));
    expect(allText()).toContain(i18n.t('Select plumber') + '*');
  });
  test.each(['none', 'empty', 'malformed'])('%s plumber list renders without throwing', async variant => {
    setFixtureVariant('app_karigar/list_of_plumber', variant);
    await mount();
    expect(allText()).toContain('Point Transfer');
    expect(allText()).toContain('Select plumber*');
  });
  test('list request failed: renders, no alert', async () => {
    const prev = getTransport();
    setTransport(req => (req.fn === 'app_karigar/list_of_plumber' ? Promise.reject(new Error('offline')) : prev(req)));
    await mount();
    expect(allText()).toContain('Point Transfer');
    expect(alertCount()).toBe(0);
  });
});

describe('points field', () => {
  test('only digits are kept (onkeypress charCode 48-57)', async () => {
    await mount();
    await type('1a2-3 .4');
    expect(input('points-input').props.value).toBe('1234');
  });
  test('empty points: the click does nothing (form invalid): no alert, no request', async () => {
    await mount();
    await submit();
    expect(alertCount()).toBe(0);
    expect(callsTo('app_karigar/bonus_points')).toHaveLength(0);
  });
  test('points typed then emptied: still invalid', async () => {
    await mount();
    await type('5');
    await type('');
    await submit();
    expect(callsTo('app_karigar/bonus_points')).toHaveLength(0);
  });
});

describe('transfer', () => {
  test('SUCCESS: body with the picked karigar_id, alert "Point Transfer Successfully", button disabled, goBack', async () => {
    await mount();
    await pick(selectable().props.items[1]);
    await type('100');
    await submit();
    expect(callsTo('app_karigar/bonus_points')[0].body).toEqual({ sales_boy_id: '900002', plumber_id: '900011', points: '100' });
    expect(lastAlert().options).toMatchObject({
      title: 'Success!',
      cssClass: 'action-close',
      subTitle: 'Point Transfer Successfully',
      buttons: ['OK'],
    });
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(isDisabled()).toBe(true);
  });
  test('no plumber picked: the request still goes out, without plumber_id', async () => {
    await mount();
    await type('100');
    await submit();
    expect(callsTo('app_karigar/bonus_points')[0].body).toEqual({ sales_boy_id: '900002', points: '100' });
  });
  test('sales_boy_id comes from the session, not from the nav params', async () => {
    await mount({ sales_boy_id: '777', totalPoint: 1250 });
    await type('100');
    await submit();
    expect(callsTo('app_karigar/bonus_points')[0].body.sales_boy_id).toBe('900002');
  });
  test('no params at all: still works', async () => {
    await mount(undefined);
    await type('100');
    await submit();
    expect(callsTo('app_karigar/bonus_points')).toHaveLength(1);
  });
  test('other status: alert "show went wrong" (sic), stays on the page, button enabled', async () => {
    setFixtureVariant('app_karigar/bonus_points', 'failed');
    await mount();
    await type('100');
    await submit();
    expect(lastAlert().options).toMatchObject({ title: 'Alert!', cssClass: 'action-close', subTitle: 'show went wrong', buttons: ['OK'] });
    expect(navigation.goBack).not.toHaveBeenCalled();
    expect(isDisabled()).toBe(false);
  });
  test('empty answer (no status): "show went wrong" too', async () => {
    setFixtureVariant('app_karigar/bonus_points', 'empty');
    await mount();
    await type('100');
    await submit();
    expect(lastAlert().options.subTitle).toBe('show went wrong');
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
  test('malformed (null) answer: Ionic throws in the callback, nothing happens', async () => {
    setFixtureVariant('app_karigar/bonus_points', 'malformed');
    await mount();
    await type('100');
    await submit();
    expect(alertCount()).toBe(0);
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
  test('network error: no error callback in Ionic, nothing happens', async () => {
    const prev = getTransport();
    setTransport(req => (req.fn === 'app_karigar/bonus_points' ? Promise.reject(new Error('offline')) : prev(req)));
    await mount();
    await type('100');
    await submit();
    expect(alertCount()).toBe(0);
    expect(navigation.goBack).not.toHaveBeenCalled();
  });
  test('a failed attempt replaces data.plumber_id by the bare id: the second attempt sends no plumber_id', async () => {
    setFixtureVariant('app_karigar/bonus_points', 'failed');
    await mount();
    await pick(selectable().props.items[0]);
    await type('100');
    await submit();
    await submit();
    const sent = callsTo('app_karigar/bonus_points');
    expect(sent).toHaveLength(2);
    expect(sent[0].body.plumber_id).toBe('900001');
    expect(sent[1].body).toEqual({ sales_boy_id: '900002', points: '100' });
    expect(selectable().props.value).toBeNull();
  });
  test('a plumber with no karigar_id: plumber_id is dropped from the body', async () => {
    setFixtureVariant('app_karigar/list_of_plumber', 'noId');
    await mount();
    await pick(selectable().props.items[0]);
    await type('100');
    await submit();
    expect(callsTo('app_karigar/bonus_points')[0].body).toEqual({ sales_boy_id: '900002', points: '100' });
  });
});
