// Notification screen (Ionic NotificationPage): contracts, list rendering, loaders, infinite scroll and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import { notificationMd } from '../../theme/ionicMdNotification';
import NotificationScreen from './index';

jest.setTimeout(30000);
let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
let calls: ApiRequest[] = [];
let restoreTransport: () => void = () => {};
const EP = 'app_karigar/get_notification';

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
    tree = ReactTestRenderer.create(<NotificationScreen />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const textOf = (id: string) => flat(find(id)[0].props.children);
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const infinite = () => tree.root.findAll(n => typeof n.props.onInfinite === 'function');
const styleOf = (id: string) => ([] as any[]).concat(...[find(id)[0].props.style].flat(5)).filter(Boolean);
const bg = (id: string) => Object.assign({}, ...styleOf(id)).backgroundColor;
const border = (id: string) => Object.assign({}, ...styleOf(id)).borderBottomWidth;
const epCalls = () => calls.filter(c => c.fn === EP);

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

describe('contracts (card Endpoints)', () => {
  test('app_karigar/get_notification on entry: {karigar_id, limit: 0}', async () => {
    installSpy();
    await expectContract(EP, () => mount());
    expect(JSON.parse(epCalls()[0].body!)).toEqual({ karigar_id: '900001', limit: 0 });
  });

  test('the infinite scroll posts through post_rqst (token header only) with limit = the list length', async () => {
    installSpy();
    await mount();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete: jest.fn() });
    });
    await settle();
    const second = epCalls()[1];
    expect(JSON.parse(second.body!)).toEqual({ karigar_id: '900001', limit: 5 });
    expect(Object.keys(second.headers).sort()).toEqual(['Content-Type', 'Token']);
    expect(second.method).toBe('POST');
  });
});

describe('states', () => {
  test('default: 5 rows, text and date as `d MMMM y`, read flag highlights, loader gone, no empty image', async () => {
    await mount();
    expect(exists('notification-row-4')).toBe(true);
    expect(exists('notification-row-5')).toBe(false);
    expect(textOf('notification-text-0')).toBe('Your gift request for steel water bottle has been approved.');
    expect(textOf('notification-date-0')).toBe('28 October 2026');
    expect(bg('notification-row-0')).toBe(notificationMd.unreadBg); // read: 1
    expect(bg('notification-row-2')).toBeUndefined(); // read: 0
    expect(exists('notification-empty')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
    expect(infinite()).toHaveLength(1);
    // the last row keeps its border while the infinite scroll element follows it
    expect(border('notification-row-4')).toBe(1);
  });

  test('the loader shows "Please wait..." until the answer arrives', async () => {
    await act(async () => {
      tree = ReactTestRenderer.create(<NotificationScreen />);
    });
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('Please wait...');
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });

  test('empty: the no-found image shows, no rows, the infinite scroll stays', async () => {
    setFixtureVariant(EP, 'empty');
    await mount();
    expect(exists('notification-empty')).toBe(true);
    expect(exists('notification-row-0')).toBe(false);
    expect(infinite()).toHaveLength(1);
    expect(openLoaders()).toHaveLength(0);
  });

  test('malformed (notification: null): loader gone, the empty image stays, the infinite scroll handler dies before complete()', async () => {
    setFixtureVariant(EP, 'malformed');
    installSpy();
    await mount();
    expect(openLoaders()).toHaveLength(0);
    expect(exists('notification-empty')).toBe(true);
    const complete = jest.fn();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete });
    });
    await settle(1100);
    expect(epCalls()).toHaveLength(1);
    expect(complete).not.toHaveBeenCalled();
  });

  test('read as text: "0" is truthy and highlights, "" does not (Angular ngClass truthiness)', async () => {
    setFixtureVariant(EP, 'readAsText');
    await mount();
    expect(bg('notification-row-0')).toBe(notificationMd.unreadBg);
    expect(bg('notification-row-1')).toBeUndefined();
    expect(textOf('notification-date-1')).toBe('28 October 2026');
  });

  test('HTTP error: the error callback dismisses the loader, the empty image shows', async () => {
    setFixtureVariant(EP, 'error');
    await mount();
    expect(openLoaders()).toHaveLength(0);
    expect(exists('notification-empty')).toBe(true);
  });

  test('a null body leaves the loader up', async () => {
    const previous = getTransport();
    setTransport(async req => (req.fn === EP ? null : previous(req)));
    restoreTransport = () => setTransport(previous);
    await mount();
    expect(openLoaders()).toHaveLength(1);
  });
});

describe('infinite scroll (notification.ts:80-102)', () => {
  test('a page is appended after 1000 ms and complete() runs then', async () => {
    installSpy();
    await mount();
    const complete = jest.fn();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete });
    });
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
    expect(complete).not.toHaveBeenCalled();
    expect(exists('notification-row-5')).toBe(false);
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(exists('notification-row-9')).toBe(true);
  });

  test('an empty-string body removes the infinite scroll for good (flag = 1) and the last row loses its border', async () => {
    installSpy();
    await mount();
    setFixtureVariant(EP, 'endOfList');
    const complete = jest.fn();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete });
    });
    await settle();
    expect(infinite()).toHaveLength(0);
    expect(complete).not.toHaveBeenCalled();
    expect(border('notification-row-4')).toBe(0);
  });

  test('an empty list answer ({notification: []}) is not the end: complete() runs and the scroll stays', async () => {
    installSpy();
    await mount();
    setFixtureVariant(EP, 'empty');
    const complete = jest.fn();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete });
    });
    await settle(1100);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(infinite()).toHaveLength(1);
    expect(exists('notification-row-4')).toBe(true);
    expect(exists('notification-row-5')).toBe(false);
  });

  test('an HTTP error leaves the infinite scroll loading (no error callback)', async () => {
    installSpy();
    await mount();
    setFixtureVariant(EP, 'error');
    const complete = jest.fn();
    await act(async () => {
      infinite()[0].props.onInfinite({ complete });
    });
    await settle(1100);
    expect(complete).not.toHaveBeenCalled();
    expect(infinite()).toHaveLength(1);
  });
});
