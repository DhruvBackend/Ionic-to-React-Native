// CancelationPolicy screen (Ionic CancelationPolicyPage): contract, states, loader and close. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContext } from '@react-navigation/native';
import { expectContract } from '../../../__tests__/helpers/contract';
import { getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import CancelationPolicyScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { goBack: jest.fn() };
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

async function settle() {
  for (let i = 0; i < 4; i++) {
    await act(async () => {
      jest.advanceTimersByTime(350);
    });
  }
}

// What the Ionic page has below it when it enters: the modal view (CancelpolicyModal) in the same OverlayPortal -> index 1
const fakeNav = { getState: () => ({ index: 1 }), goBack: jest.fn() };

async function mount() {
  await act(async () => {
    tree = ReactTestRenderer.create(
      <NavigationContext.Provider value={fakeNav as any}>
        <CancelationPolicyScreen navigation={navigation as any} route={{ params: {} } as any} />
      </NavigationContext.Provider>,
    );
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const policyText = () => flat(find('policy-p')[0].props.children);

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.goBack.mockClear();
  fakeNav.goBack.mockClear();
  calls = [];
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
  test('app_master/cancellations_policy: post_rqst with an empty object on mount', async () => {
    installSpy();
    await expectContract('app_master/cancellations_policy', () => mount());
    expect(JSON.parse(calls.find(c => c.fn === 'app_master/cancellations_policy')!.body!)).toEqual({});
  });
});

describe('states (card States)', () => {
  test('CancelationPolicy.default: title, close icon, policy text (<br> = line break, &nbsp; stays a non-breaking space)', async () => {
    installSpy();
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Cancellation Policy', 'clear']));
    expect(policyText()).toBe(
      '1. A redeem request can be cancelled only before it is approved by the company.\n' +
        '2. Once a gift is shipped or the cash transfer is processed, the request cannot be cancelled.\n' +
        '3. Points of a cancelled request are credited back to your account within 7 working days.\n' +
        '4. The company reserves the right to cancel any request found to be fraudulent. Points of such a request will not be returned.',
    );
    expect(openLoaders()).toHaveLength(0);
  });

  test('CancelationPolicy.hin: translated title (the page never calls use(): global language)', async () => {
    installSpy();
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(allText()).toContain(i18n.t('Cancellation Policy'));
  });

  test('CancelationPolicy.empty: blank paragraph, loader gone', async () => {
    setFixtureVariant('app_master/cancellations_policy', 'empty');
    installSpy();
    await mount();
    expect(policyText()).toBe('');
    expect(openLoaders()).toHaveLength(0);
  });

  test('CancelationPolicy.malformed (getData: null): no crash, blank, the loader stays up (Ionic throws before dismiss)', async () => {
    setFixtureVariant('app_master/cancellations_policy', 'malformed');
    installSpy();
    await mount();
    expect(policyText()).toBe('');
    expect(openLoaders()).toHaveLength(1);
  });
});

describe('loader (cancelation-policy.ts:34-44)', () => {
  test('"Please wait..." with dismissOnPageChange false is up while loading and dismissed by the response', async () => {
    installSpy();
    await act(async () => {
      tree = ReactTestRenderer.create(<CancelationPolicyScreen navigation={navigation as any} />);
    });
    const loaders = openLoaders();
    expect(loaders).toHaveLength(1);
    expect((loaders[0].options as any).content).toBe('Please wait...');
    expect((loaders[0].options as any).dismissOnPageChange).toBe(false);
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });

  test('an HTTP error leaves the loader up and the page blank (no error callback in Ionic)', async () => {
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
    expect(policyText()).toBe('');
  });
});

describe('navigation', () => {
  test('the clear button is viewCtrl.dismiss(): goBack', async () => {
    installSpy();
    await mount();
    const press = find('cancelpolicy-close').find(n => typeof n.props.onPress === 'function')!;
    await act(async () => {
      press.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
    });
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  test('the navbar shows the back arrow (the portal still held the modal below when Ionic computed enableBack) and it pops', async () => {
    installSpy();
    await mount();
    expect(exists('ion-navbar-back')).toBe(true);
    const press = find('ion-navbar-back').find(n => typeof n.props.onPress === 'function')!;
    await act(async () => {
      press.props.onPress({ nativeEvent: { locationX: 1, locationY: 1 } });
    });
    expect(fakeNav.goBack).toHaveBeenCalledTimes(1);
  });
});
