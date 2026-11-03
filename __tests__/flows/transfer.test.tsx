// Point transfer flows (plan Phase 2): Plumber Pointtranfer and Seller/Dealer SalesPointTransfer, each entered from the real
// "Point Transfer" button on Home. Same approach as login.test.tsx and scan-redeem.test.tsx: the REAL RootNavigator in MOCK mode on
// Tabs with a seeded session, controls pressed by testID, fixture variants for the server answers.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, getTransport, setTransport, type ApiRequest } from '../../src/api/client';
import sessions from '../../src/api/fixtures/_sessions.json';
import { resetMock, setFixtureVariant } from '../../src/api/mock';
import i18n from '../../src/i18n';
import { RootNavigator } from '../../src/navigation/RootNavigator';
import { navigationRef } from '../../src/navigation/navigationRef';
import { _resetOverlaysForTests, overlayStore } from '../../src/ui/overlays';

const act = ReactTestRenderer.act;
let tree: ReactTestRenderer.ReactTestRenderer | undefined;
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};

async function settle(ms = 350, rounds = 6) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
  }
}
const find = (id: string) => tree!.root.findAll(n => n.props.testID === id);
const host = (id: string) => find(id).find(n => typeof n.type === 'string')!;
const current = () => navigationRef.getCurrentRoute()?.name;
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options as any);
const sent = (fn: string) => calls.filter(c => c.fn === fn).map(c => (typeof c.body === 'string' ? JSON.parse(c.body) : c.body));
const submitButton = () => find('transfer-submit').find(n => typeof n.props.onPress === 'function')!;
const isDisabled = () => find('transfer-submit').some(n => n.props.disabled === true || n.props.accessibilityState?.disabled === true);

async function press(id: string) {
  const n = find(id).find(x => typeof x.props.onPress === 'function');
  if (!n) {
    throw new Error(`no pressable "${id}" on screen (current: ${current()})`);
  }
  await act(async () => {
    n.props.onPress({ nativeEvent: { locationX: 10, locationY: 10 } });
  });
  await settle();
}
async function type(id: string, text: string) {
  await act(async () => {
    host(id).props.onChangeText(text);
  });
}
// press Transfer without settling, then let only the mock latency pass: the page has its answer (istrue set, pop started) but the
// pop transition has not finished, so the button can still be inspected
async function submitAndAnswer() {
  await act(async () => {
    submitButton().props.onPress();
  });
  await act(async () => {
    jest.advanceTimersByTime(310);
  });
}

async function start(role: 'Plumber' | 'Sales_Boy' | 'Dealer') {
  db.userStorageData = { ...(sessions as any)[role] };
  await act(async () => {
    tree = ReactTestRenderer.create(<RootNavigator initialRouteName="Tabs" />);
  });
  await settle();
  expect(current()).toBe('Home');
}

beforeEach(async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  resetMock();
  _resetOverlaysForTests();
  db.userStorageData = null;
  calls = [];
  const previous = getTransport();
  setTransport(req => {
    calls.push(req);
    return previous(req);
  });
  restoreTransport = () => setTransport(previous);
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});
afterEach(async () => {
  restoreTransport();
  await act(async () => {
    tree?.unmount();
  });
  tree = undefined;
  jest.useRealTimers();
});

describe('Plumber: Home -> Pointtranfer', () => {
  async function open() {
    await start('Plumber');
    await press('home-point-transfer');
    expect(current()).toBe('Pointtranfer');
    expect(sent('app_karigar/plumber_limit')).toEqual([{}]);
  }

  test('karigar_not_exist: "Plumber not Exist" alert, the page stays and the button stays enabled', async () => {
    setFixtureVariant('app_karigar/plumber_transfer_points', 'karigar_not_exist');
    await open();
    await type('mobile-input', '9812345670');
    await type('points-input', '100');
    await press('transfer-submit');

    expect(sent('app_karigar/plumber_transfer_points')).toEqual([
      { mobile_no: '9812345670', points: '100', karigar_id: (sessions as any).Plumber.id },
    ]);
    expect(alerts().pop()).toMatchObject({ subTitle: 'Plumber not Exist' });
    expect(current()).toBe('Pointtranfer');
    expect(isDisabled()).toBe(false);
  });

  test('SUCCESS: "Point Transfer Successfully" alert, the button is disabled, then back on Home', async () => {
    await open();
    await type('mobile-input', '9812345670');
    await type('points-input', '100');
    await submitAndAnswer();

    expect(sent('app_karigar/plumber_transfer_points')).toHaveLength(1);
    expect(alerts().pop()).toMatchObject({ subTitle: 'Point Transfer Successfully' });
    expect(isDisabled()).toBe(true);
    await settle();
    expect(current()).toBe('Home');
    expect(find('transfer-submit')).toHaveLength(0);
  });
});

describe.each(['Sales_Boy', 'Dealer'] as const)('%s: Home -> SalesPointTransfer', role => {
  async function open() {
    await start(role);
    await press('home-point-transfer');
    expect(current()).toBe('SalesPointTransfer');
    expect(sent('app_karigar/list_of_plumber')).toEqual([{ filter: { limit: 20 } }]);
    // the picker lists the plumbers as name(mobile)
    const select = find('plumber-select').find(n => typeof n.props.onChange === 'function')!;
    expect(select.props.items.map((i: any) => i.first_name)).toEqual(['Rakesh Verma(9810000001)', 'Sunil Kumar(9810000011)', 'Mohan Lal(9810000012)']);
    return select;
  }
  const pick = async (select: any, item: any) => {
    await act(async () => {
      select.props.onChange(item, { value: item });
    });
  };

  test('bonus_points SUCCESS: "Success!" alert, the button is disabled, then back on Home', async () => {
    const select = await open();
    await pick(select, select.props.items[1]);
    await type('points-input', '100');
    await submitAndAnswer();

    expect(sent('app_karigar/bonus_points')).toEqual([{ plumber_id: '900011', points: '100', sales_boy_id: (sessions as any)[role].id }]);
    expect(alerts().pop()).toMatchObject({ title: 'Success!', subTitle: 'Point Transfer Successfully' });
    expect(isDisabled()).toBe(true);
    await settle();
    expect(current()).toBe('Home');
  });

  test('bonus_points not SUCCESS: "show went wrong" alert (sic), the page stays and the button stays enabled', async () => {
    setFixtureVariant('app_karigar/bonus_points', 'failed');
    const select = await open();
    await pick(select, select.props.items[0]);
    await type('points-input', '100');
    await press('transfer-submit');

    expect(sent('app_karigar/bonus_points')).toHaveLength(1);
    expect(alerts().pop()).toMatchObject({ title: 'Alert!', subTitle: 'show went wrong' });
    expect(current()).toBe('SalesPointTransfer');
    expect(isDisabled()).toBe(false);
  });
});
