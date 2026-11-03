// Transaction screen (Ionic TransactionPage): contracts, row branches, receive confirmation, paging, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContext } from '@react-navigation/native';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { navigationRef } from '../../navigation/navigationRef';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import TransactionScreen from './index';

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn() };
let listeners: Record<string, (() => void)[]> = {};
const fakeNav = {
  getState: () => ({ index: 1 }),
  addListener: (ev: string, fn: () => void) => {
    (listeners[ev] ||= []).push(fn);
    return () => {
      listeners[ev] = (listeners[ev] || []).filter(f => f !== fn);
    };
  },
};
const emit = (ev: string) => (listeners[ev] || []).forEach(f => f());
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

function render() {
  return (
    <NavigationContext.Provider value={fakeNav as any}>
      <TransactionScreen navigation={navigation as any} />
    </NavigationContext.Provider>
  );
}

async function mount(enter = true) {
  await act(async () => {
    tree = ReactTestRenderer.create(render());
  });
  if (enter) {
    await act(async () => emit('focus')); // first entry: ionViewWillEnter
  }
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const textOf = (id: string) => flat(find(id)[0].props.children);
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options as any);
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const refresher = () => tree.root.findAll(n => typeof n.props.onRefresh === 'function')[0];
const infinite = () => tree.root.findAll(n => typeof n.props.onInfinite === 'function');
const press = (id: string) => find(id).find(n => typeof n.props.onPress === 'function')!.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
const txCalls = () => calls.filter(c => c.fn === 'app_karigar/transaction');

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  listeners = {};
  calls = [];
  db.userStorageData = { id: '900001', type: 'Plumber' };
});
afterEach(() => {
  restoreTransport();
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('contracts (card Endpoints)', () => {
  test('app_karigar/transaction on entry: {karigar_id, filter: {limit: 0}}', async () => {
    installSpy();
    await expectContract('app_karigar/transaction', () => mount());
    expect(JSON.parse(txCalls()[0].body!)).toEqual({ karigar_id: '900001', filter: { limit: 0 } });
  });

  test('app_karigar/transaction from the infinite scroll: filter.limit is the current list length', async () => {
    installSpy();
    await mount();
    await expectContract('app_karigar/transaction', async () => {
      await act(async () => {
        infinite()[0].props.onInfinite({ complete: jest.fn() });
      });
      await settle();
    });
    expect(JSON.parse(txCalls()[1].body!)).toEqual({ karigar_id: '900001', filter: { limit: 5 } });
  });

  test('app_karigar/redeemReceiveStatus: {id, karigar_id} when the alert says Yes', async () => {
    installSpy();
    await mount();
    await expectContract('app_karigar/redeemReceiveStatus', async () => {
      await act(async () => press('transaction-receive-3'));
      await act(async () => {
        alerts()[0].buttons[1].handler();
      });
      await settle();
    });
    expect(JSON.parse(calls.find(c => c.fn === 'app_karigar/redeemReceiveStatus')!.body!)).toEqual({ id: 502, karigar_id: '900001' });
  });
});

describe('states (card States)', () => {
  test('Transaction.default: header, balance, five rows with their status blocks', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(
      expect.arrayContaining([
        'Balance Points',
        'Request Send',
        'Steel Water Bottle',
        'Req Id : REQ# 505',
        '400',
        'Points',
        '28 October 2026',
        'Pending',
        'Wall Clock',
        '20 October 2026',
        'Approved',
        'Bluetooth Speaker',
        'Reject',
        'Hand Tool Kit',
        'Receive',
        'Shipped',
        'Travel Bag',
        'Receive on : 22 September 2026',
        'call_made',
      ]),
    );
    expect(textOf('balance-point')).toBe('1350'); // parseInt(1250) + parseInt(100)
    expect(find('ion-navbar').length).toBeGreaterThan(0);
    expect(allText()).toContain('Transaction');
    expect(exists('transaction-status-pending-0')).toBe(true);
    expect(exists('transaction-status-approved-1')).toBe(true);
    expect(exists('transaction-status-reject-2')).toBe(true);
    expect(exists('transaction-status-shipped-3')).toBe(true);
    expect(exists('transaction-status-received-4')).toBe(true);
    // a Shipped row has no date block and no gift_status block; only Shipped rows have the Receive button
    expect(exists('transaction-receive-3')).toBe(true);
    expect(exists('transaction-receive-0')).toBe(false);
    expect(exists('transaction-status-approved-3')).toBe(false);
  });

  test('Transaction.empty: balance only, no rows, the infinite scroll element stays', async () => {
    setFixtureVariant('app_karigar/transaction', 'empty');
    installSpy();
    await mount();
    expect(textOf('balance-point')).toBe('1350');
    expect(exists('transaction-row-0')).toBe(false);
    expect(infinite()).toHaveLength(1);
    expect(openLoaders()).toHaveLength(0);
  });

  test('Transaction.malformed (transaction: null, karigar: null): no crash, loader gone, empty balance', async () => {
    setFixtureVariant('app_karigar/transaction', 'malformed');
    installSpy();
    await mount();
    expect(textOf('balance-point')).toBe('');
    expect(exists('transaction-row-0')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
  });

  test('karigar: null with a list: the list shows, balance stays empty (TypeError after the assignment in Ionic)', async () => {
    setFixtureVariant('app_karigar/transaction', 'noKarigar');
    installSpy();
    await mount();
    expect(exists('transaction-row-0')).toBe(true);
    expect(textOf('balance-point')).toBe('');
    expect(openLoaders()).toHaveLength(0);
  });

  test('malformed after a good load keeps the old balance and clears the list', async () => {
    installSpy();
    await mount();
    setFixtureVariant('app_karigar/transaction', 'malformed');
    await act(async () => {
      refresher().props.onRefresh({ complete: jest.fn() });
    });
    await settle();
    expect(textOf('balance-point')).toBe('1350');
    expect(exists('transaction-row-0')).toBe(false);
    // transaction_detail is null now: the infinite scroll handler dies before complete()
    const before = txCalls().length;
    await act(async () => {
      infinite()[0].props.onInfinite({ complete: jest.fn() });
    });
    expect(txCalls().length).toBe(before);
  });

  test('a Reject row shows the reason and "Refunded" whatever its receive_status (template reads a page property that does not exist)', async () => {
    setFixtureVariant('app_karigar/transaction', 'rejectedWithStatus');
    installSpy();
    await mount();
    expect(textOf('transaction-reason-0')).toBe('Address Not Serviceable');
    expect(textOf('transaction-refund-0')).toBe('Refunded');
    // receive_status is 'Refunded' (not ''), so no Reject status block and no other block
    expect(exists('transaction-status-reject-0')).toBe(false);
    expect(exists('transaction-status-shipped-0')).toBe(false);
  });

  test('default: the Reject row has reason + Refunded and its status block; other rows have neither', async () => {
    installSpy();
    await mount();
    expect(textOf('transaction-reason-2')).toBe('Out Of Stock');
    expect(textOf('transaction-refund-2')).toBe('Refunded');
    expect(exists('transaction-reason-0')).toBe(false);
    expect(exists('transaction-refund-1')).toBe(false);
  });

  test('received variant: "Receive on : 3 November 2026" and no Receive button', async () => {
    setFixtureVariant('app_karigar/transaction', 'received');
    installSpy();
    await mount();
    expect(allText()).toContain('Receive on : 3 November 2026');
    expect(exists('transaction-receive-0')).toBe(false);
    expect(textOf('balance-point')).toBe('750');
  });

  test('no i18n: the page has no `| translate`, Hindi changes nothing', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Balance Points', 'Request Send', 'Points']));
  });
});

describe('loader (transaction.ts:66-72)', () => {
  test('"Please wait..." is up from the first render and dismissed by the first response', async () => {
    installSpy();
    await act(async () => {
      tree = ReactTestRenderer.create(render());
    });
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('Please wait...');
    expect((loaders[0].options as any).dismissOnPageChange).toBe(true);
    await act(async () => emit('focus'));
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });

  test('an HTTP error leaves the loader up (no error callback in Ionic)', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
    expect(exists('transaction-row-0')).toBe(false);
  });
});

describe('lifecycle and refresh', () => {
  test('ionViewWillEnter: every focus fetches again (return from ShippingDetail)', async () => {
    installSpy();
    await mount();
    expect(txCalls()).toHaveLength(1);
    await act(async () => emit('focus'));
    await settle();
    expect(txCalls()).toHaveLength(2);
  });

  test('refresh calls the endpoint again with limit 0 and completes at once', async () => {
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      refresher().props.onRefresh({ complete });
    });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(txCalls()).toHaveLength(2);
    expect(JSON.parse(txCalls()[1].body!).filter).toEqual({ limit: 0 });
    await settle();
  });
});

describe('infinite scroll (transaction.ts:115-141)', () => {
  test('a non-empty page is appended after 1000 ms and complete() runs then', async () => {
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete });
    });
    await act(async () => {
      jest.advanceTimersByTime(350); // the response arrives; the append waits 1000 ms more (setTimeout in the subscribe callback)
    });
    expect(complete).not.toHaveBeenCalled();
    expect(exists('transaction-row-5')).toBe(false);
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(exists('transaction-row-9')).toBe(true); // the default fixture answers with its 5 rows again
  });

  test('an empty page removes the infinite scroll for good (flag = 1), even after a refresh', async () => {
    installSpy();
    await mount();
    setFixtureVariant('app_karigar/transaction', 'empty');
    const complete = jest.fn();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete });
    });
    await settle();
    expect(infinite()).toHaveLength(0);
    expect(complete).not.toHaveBeenCalled();
    setFixtureVariant('app_karigar/transaction', 'default');
    await act(async () => {
      refresher().props.onRefresh({ complete: jest.fn() });
    });
    await settle();
    expect(infinite()).toHaveLength(0);
  });
});

describe('receive confirmation (transaction.ts:74-113)', () => {
  test('Receive shows the Confirmation alert with its exact texts and also pushes ShippingDetail (the click bubbles to the row)', async () => {
    installSpy();
    await mount();
    await act(async () => press('transaction-receive-3'));
    const a = alerts();
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ title: 'Confirmation!', subTitle: 'Did you receive this gift?', cssClass: 'action-close' });
    expect(a[0].buttons[0]).toMatchObject({ text: 'No', role: 'cancel' });
    expect(a[0].buttons[1]).toMatchObject({ text: 'Yes', cssClass: 'close-action-sheet' });
    expect(navigation.push).toHaveBeenCalledWith('ShippingDetail', { id: 502 });
  });

  test('No does nothing', async () => {
    installSpy();
    await mount();
    await act(async () => press('transaction-receive-3'));
    await act(async () => {
      alerts()[0].buttons[0].handler();
    });
    await settle();
    expect(calls.filter(c => c.fn === 'app_karigar/redeemReceiveStatus')).toHaveLength(0);
    expect(alerts()).toHaveLength(1);
  });

  test('Yes posts, shows Success! with the exact (typo) text and reloads the list', async () => {
    installSpy();
    await mount();
    await act(async () => press('transaction-receive-3'));
    await act(async () => {
      alerts()[0].buttons[1].handler();
    });
    await settle();
    expect(calls.filter(c => c.fn === 'app_karigar/redeemReceiveStatus')).toHaveLength(1);
    const success = alerts().find(x => x.title === 'Success!');
    expect(success).toMatchObject({ cssClass: 'action-close', subTitle: 'You have receive gift successfully', buttons: ['OK'] });
    expect(txCalls()).toHaveLength(2);
  });

  test('a malformed (null) answer still shows Success! and reloads (the response is not looked at)', async () => {
    setFixtureVariant('app_karigar/redeemReceiveStatus', 'malformed');
    installSpy();
    await mount();
    await act(async () => press('transaction-receive-3'));
    await act(async () => {
      alerts()[0].buttons[1].handler();
    });
    await settle();
    expect(alerts().some(x => x.title === 'Success!')).toBe(true);
    expect(txCalls()).toHaveLength(2);
  });

  test('an HTTP error on redeemReceiveStatus: nothing else happens', async () => {
    installSpy();
    await mount();
    await act(async () => press('transaction-receive-3'));
    restoreTransport();
    installSpy(true);
    await act(async () => {
      alerts()[0].buttons[1].handler();
    });
    await settle();
    expect(alerts().some(x => x.title === 'Success!')).toBe(false);
  });
});

describe('navigation (card Nav targets)', () => {
  test('tapping a row (item or the surrounding block) pushes ShippingDetail with {id}', async () => {
    installSpy();
    await mount();
    await act(async () => press('transaction-item-1'));
    expect(navigation.push).toHaveBeenLastCalledWith('ShippingDetail', { id: 504 });
    await act(async () => press('transaction-row-0'));
    expect(navigation.push).toHaveBeenLastCalledWith('ShippingDetail', { id: 505 });
  });
});

describe('ionViewDidLeave (transaction.ts:143-166)', () => {
  const stackState = (names: string[]) => ({ type: 'stack', index: names.length - 1, routes: names.map(name => ({ name })) });
  async function leave(stackRoutes: number, root: any) {
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(true);
    jest.spyOn(navigationRef, 'getRootState').mockReturnValue(root);
    installSpy();
    const nav = {
      push: jest.fn(),
      popToTop: jest.fn(),
      getState: () => ({ routes: new Array(stackRoutes).fill({}) }),
      addListener: (type: string, cb: () => void) => {
        (listeners[type] ||= []).push(cb);
        return () => {};
      },
    };
    await act(async () => {
      tree = ReactTestRenderer.create(<TransactionScreen navigation={nav as any} />);
    });
    await settle();
    await act(async () => emit('blur'));
    return nav;
  }
  afterEach(() => jest.restoreAllMocks());

  test('active page is a root page (Home), previous is not, stack has >1 page: popToTop', async () => {
    const nav = await leave(2, stackState(['Home']));
    expect(nav.popToTop).toHaveBeenCalledTimes(1);
  });
  test('previous page is a root page: nothing', async () => {
    const nav = await leave(2, stackState(['Home', 'Profile']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
  test('single-route stack: nothing to pop', async () => {
    const nav = await leave(1, stackState(['Home']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
  test('active page ShippingDetail (not a root page): nothing', async () => {
    const nav = await leave(2, stackState(['Home', 'Transaction', 'ShippingDetail']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
  test('MainHome is not a root page in this copy of the check', async () => {
    const nav = await leave(2, stackState(['MainHome']));
    expect(nav.popToTop).not.toHaveBeenCalled();
  });
});
