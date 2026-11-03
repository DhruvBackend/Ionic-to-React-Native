// CancelpolicyModal screen (Ionic CancelpolicyModalPage): contracts, states, navigation and quirks. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { expectContract, loadContract } from '../../../__tests__/helpers/contract';
import { db, getTransport, HttpError, setTransport, type ApiRequest } from '../../api/client';
import { resetMock, setFixtureVariant } from '../../api/mock';
import { client } from '../../config/client';
import i18n from '../../i18n';
import { _resetOverlaysForTests, overlayStore } from '../../ui/overlays';
import CancelpolicyModalScreen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn(), goBack: jest.fn(), reset: jest.fn() };
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

const PARAMS = { karigar_id: '900001', gift_id: 21 };
async function mount(params: any = PARAMS, nav: any = navigation) {
  await act(async () => {
    tree = ReactTestRenderer.create(<CancelpolicyModalScreen navigation={nav} route={{ params } as any} />);
  });
  await settle();
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const exists = (id: string) => find(id).length > 0;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' || typeof c === 'number' ? String(c) : c?.props ? flat(c.props.children) : '');
const text = (id: string) => flat(find(id).find(n => (n.type as any) === 'Text')!.props.children);
const host = (id: string) => find(id).find(n => typeof n.type === 'string')!;
const openLoaders = () => overlayStore.getEntries().filter(e => e.kind === 'loading' && !e.leaving);
const alerts = () => overlayStore.getEntries().filter(e => e.kind === 'alert').map(e => e.options as any);
const sentBody = (fn: string, i = 0) => JSON.parse(calls.filter(c => c.fn === fn)[i].body ?? 'null');
const callsTo = (fn: string) => calls.filter(c => c.fn === fn);
const yes = () => find('yes').find(n => typeof n.props.onPress === 'function')!;
const yesDisabled = () => !!yes().props.disabled;

async function typeOtp(v: string) {
  await act(async () => {
    host('otp-input').props.onChangeText(v);
  });
}
async function blurOtp() {
  await act(async () => {
    host('otp-input').props.onBlur();
  });
}
async function press(id: string) {
  const n = find(id).find(x => typeof x.props.onPress === 'function')!;
  await act(async () => {
    n.props.onPress({ nativeEvent: { locationX: 10, locationY: 10 } });
  });
}
// a tap on a checkbox is a tap on the item cover (`button.item-cover`)
async function tapBox(id: string) {
  await press(`${id}-item-cover`);
}
async function enableYes(otp = '123456') {
  await typeOtp(otp);
  await tapBox('check'); // data.check = true
}

beforeEach(async () => {
  jest.useFakeTimers();
  resetMock();
  _resetOverlaysForTests();
  navigation.push.mockClear();
  navigation.goBack.mockClear();
  navigation.reset.mockClear();
  calls = [];
  db.userStorageData = { id: '900001', mobile_no: '9000000001', type: 'Plumber' };
  await act(async () => {
    await i18n.changeLanguage('en');
  });
  installSpy();
});

afterEach(() => {
  act(() => tree?.unmount());
  restoreTransport();
  restoreTransport = () => {};
  jest.useRealTimers();
});

describe('contracts (card Endpoints)', () => {
  test('app_karigar/sendOtp: {karigar_id, mobile_no, gift_id} on mount', async () => {
    await expectContract('app_karigar/sendOtp', () => mount());
    expect(sentBody('app_karigar/sendOtp')).toEqual({ karigar_id: '900001', mobile_no: '9000000001', gift_id: 21 });
  });

  test('Resend: sendOtp {karigar_id, gift_id} only (no mobile_no), no loader', async () => {
    await mount();
    expect(openLoaders()).toHaveLength(0);
    await expectContract({ ...loadContract('app_karigar/sendOtp'), body: { karigar_id: '900001', gift_id: 21 } }, async () => {
      await press('otp-resend');
      await settle();
    });
    expect(callsTo('app_karigar/sendOtp')).toHaveLength(2);
    expect(sentBody('app_karigar/sendOtp', 1)).toEqual({ karigar_id: '900001', gift_id: 21 });
    expect(openLoaders()).toHaveLength(0);
  });

  test('app_karigar/redeemRequest: full body (Gift type, address from the profile)', async () => {
    await mount();
    await enableYes();
    await tapBox('check1'); // first tap fills the address
    await expectContract('app_karigar/redeemRequest', async () => {
      await press('yes');
      await settle();
    });
    expect(sentBody('app_karigar/redeemRequest')).toEqual({
      karigar_id: '900001',
      mobile: '9000000001',
      bank_detail_type: '',
      paytm_mobile: '',
      gift_id: 21,
      offer_id: 11,
      bankDetails: '',
      shipping_address: '12 Rose Lane ,Sahibabad ,GHAZIABAD ,UTTAR PRADESH ,201010',
    });
  });

  test('a push-notification entry (no gift_id): the key is dropped from the body', async () => {
    await mount({});
    expect(sentBody('app_karigar/sendOtp')).toEqual({ karigar_id: '900001', mobile_no: '9000000001' });
  });
});

describe('states (card States)', () => {
  test('default: title, question, prompt, OTP box, Gift block, policy row, No / Yes (disabled)', async () => {
    await mount();
    expect(text('modal-title')).toBe(client.appName);
    expect(text('modal-question')).toBe('Are you sure to redeem your 500 points?');
    expect(text('modal-mobile')).toBe('+91 9000000001');
    expect(host('otp-input').props.placeholder).toBe('Enter OTP');
    expect(host('otp-input').props.keyboardType).toBe('phone-pad');
    expect(exists('gift-block')).toBe(true);
    expect(host('shipping-address').props.placeholder).toBe('Enter Shipping Address');
    expect(text('policy-link')).toBe('Cancellation Policy');
    expect(yesDisabled()).toBe(true);
    expect(openLoaders()).toHaveLength(0); // closed by the sendOtp response
  });

  test('loader "Please wait..." (dismissOnPageChange false) is up until sendOtp answers', async () => {
    await act(async () => {
      tree = ReactTestRenderer.create(<CancelpolicyModalScreen navigation={navigation as any} route={{ params: PARAMS } as any} />);
    });
    const l = openLoaders();
    expect(l).toHaveLength(1);
    expect((l[0].options as any).content).toBe('Please wait...');
    expect((l[0].options as any).dismissOnPageChange).toBe(false);
    await settle();
    expect(openLoaders()).toHaveLength(0);
  });

  test('cash: no address block', async () => {
    setFixtureVariant('app_karigar/sendOtp', 'cash');
    await mount();
    expect(exists('gift-block')).toBe(false);
    expect(text('modal-question')).toBe('Are you sure to redeem your 1000 points?');
  });

  test('empty: blank points and number, no Gift block, Yes disabled', async () => {
    setFixtureVariant('app_karigar/sendOtp', 'empty');
    await mount();
    expect(text('modal-question')).toBe('Are you sure to redeem your  points?');
    expect(text('modal-mobile')).toBe('+91 ');
    expect(exists('gift-block')).toBe(false);
    expect(yesDisabled()).toBe(true);
  });

  test('malformed (karigar/gift null): renders the start state; Yes stays disabled for good', async () => {
    setFixtureVariant('app_karigar/sendOtp', 'malformed');
    await mount();
    expect(text('modal-question')).toBe('Are you sure to redeem your  points?');
    expect(text('modal-mobile')).toBe('+91 ');
    expect(exists('gift-block')).toBe(false);
    expect(openLoaders()).toHaveLength(0);
    await enableYes();
    expect(yesDisabled()).toBe(true);
  });

  test('HTTP error on sendOtp: no callback, the loader stays up and nothing else happens', async () => {
    restoreTransport();
    installSpy(true);
    await mount();
    expect(openLoaders()).toHaveLength(1);
    expect(text('modal-mobile')).toBe('+91 ');
  });

  test('Wrong OTP value shows only after the box was touched (blur) and while the typed text differs', async () => {
    await mount();
    expect(exists('otp-error')).toBe(false);
    await typeOtp('12');
    expect(exists('otp-error')).toBe(false); // not touched yet
    await blurOtp();
    expect(exists('otp-error')).toBe(true);
    expect(flat(find('otp-error')[0].props.children)).toBe('Wrong OTP value');
    await typeOtp('123456'); // the server sent the NUMBER 123456: loose ==
    expect(exists('otp-error')).toBe(false);
  });

  test('Yes needs a matching OTP and data.check (checked="true" has no effect: the box starts unchecked, one tap enables)', async () => {
    await mount();
    await typeOtp('123456');
    expect(yesDisabled()).toBe(true); // data.check undefined
    await tapBox('check'); // data.check = true
    expect(yesDisabled()).toBe(false);
    await typeOtp('1234567');
    expect(yesDisabled()).toBe(true);
  });

  test('"Same as Permanent Address": first tap fills from the profile, second clears; label is one line with an ellipsis', async () => {
    await mount();
    expect(host('shipping-address').props.value).toBe('');
    await tapBox('check1');
    expect(host('shipping-address').props.value).toBe('12 Rose Lane ,Sahibabad ,GHAZIABAD ,UTTAR PRADESH ,201010');
    await tapBox('check1');
    expect(host('shipping-address').props.value).toBe('');
    const label = tree.root.findAll(n => (n.type as any) === 'Text' && flat(n.props.children) === 'Same as Permanent Address')[0];
    expect(label.props.numberOfLines).toBe(1);
    expect(label.props.ellipsizeMode).toBe('tail');
  });

  test('keyboard Enter in the OTP box submits only while Yes is enabled', async () => {
    await mount();
    await typeOtp('123456');
    await act(async () => {
      host('otp-input').props.onSubmitEditing();
    });
    await settle();
    expect(callsTo('app_karigar/redeemRequest')).toHaveLength(0);
    expect(alerts()).toHaveLength(0); // disabled: nothing, not even the address alert
    await tapBox('check');
    await act(async () => {
      host('otp-input').props.onSubmitEditing();
    });
    await settle();
    expect(alerts()[0]).toMatchObject({ subTitle: 'Please fill Address' }); // enabled: submit() ran
  });
});

describe('submit and navigation', () => {
  test('Gift with an empty address: alert "Please fill Address" (Alert!, Cancel + OK), no request, no loader', async () => {
    await mount();
    await enableYes();
    await press('yes');
    await settle();
    expect(callsTo('app_karigar/redeemRequest')).toHaveLength(0);
    expect(openLoaders()).toHaveLength(0);
    const a = alerts();
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ title: 'Alert!', cssClass: 'action-close', subTitle: 'Please fill Address' });
    expect(a[0].buttons.map((b: any) => b.text)).toEqual(['Cancel', 'OK']);
  });

  async function filledSubmit(variant?: string) {
    if (variant) {
      setFixtureVariant('app_karigar/redeemRequest', variant);
    }
    await mount();
    await enableYes();
    await act(async () => {
      host('shipping-address').props.onChangeText('Flat 4, Rose Lane');
    });
    await press('yes');
    await settle();
  }

  test('SUCCESS: setRoot Tabs {index:"3"} (reset) then the "Success!" alert', async () => {
    await filledSubmit();
    expect(sentBody('app_karigar/redeemRequest').shipping_address).toBe('Flat 4, Rose Lane');
    expect(navigation.reset).toHaveBeenCalledWith({ index: 0, routes: [{ name: 'Tabs', params: { index: '3' } }] });
    expect(alerts()).toHaveLength(1);
    expect(alerts()[0]).toMatchObject({ title: 'Success!', cssClass: 'action-close', subTitle: 'Redeemed Request Sent Successfully', buttons: ['OK'] });
    expect(openLoaders()).toHaveLength(0);
  });

  test('EXIST: alert " Already Redeemed!" (leading space), stays on the modal', async () => {
    await filledSubmit('EXIST');
    expect(alerts()[0]).toMatchObject({ title: 'Alert!', subTitle: ' Already Redeemed!' });
    expect(navigation.reset).not.toHaveBeenCalled();
    expect(openLoaders()).toHaveLength(0);
  });

  test('monthly_redeem_limit_exceed: alert with the server msg', async () => {
    await filledSubmit('monthly_redeem_limit_exceed');
    expect(alerts()[0]).toMatchObject({ title: 'Alert!', subTitle: 'Monthly redeem limit exceeded' });
  });

  test.each(['empty', 'malformed'])('redeemRequest %s: loader closed, nothing happens', async variant => {
    await filledSubmit(variant);
    expect(alerts()).toHaveLength(0);
    expect(navigation.reset).not.toHaveBeenCalled();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(openLoaders()).toHaveLength(0);
  });

  test('redeemRequest HTTP error: no callback, the loader stays up', async () => {
    await mount();
    await enableYes();
    await act(async () => {
      host('shipping-address').props.onChangeText('Flat 4');
    });
    restoreTransport();
    installSpy(true);
    await press('yes');
    await settle();
    expect(openLoaders()).toHaveLength(1);
    expect(alerts()).toHaveLength(0);
  });

  test('No: dismiss -> goBack()', async () => {
    await mount();
    await press('no');
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });

  test('Cancellation Policy link: push CancelationPolicy', async () => {
    await mount();
    await press('policy-link');
    expect(navigation.push).toHaveBeenCalledWith('CancelationPolicy');
  });

  test('blur while another page is on top (ionViewDidLeave -> dismiss): the modal route is removed, the page on top stays', async () => {
    let blur: () => void = () => {};
    const dispatch = jest.fn();
    const state: any = { index: 2, routes: [{ key: 'g' }, { key: 'm' }, { key: 'p' }] };
    const nav = { ...navigation, addListener: (_t: string, cb: () => void) => {
        blur = cb;
        return () => {};
      }, getState: () => state, dispatch };
    await act(async () => {
      tree = ReactTestRenderer.create(<CancelpolicyModalScreen navigation={nav as any} route={{ key: 'm', params: PARAMS } as any} />);
    });
    await settle();
    blur();
    expect(dispatch).toHaveBeenCalledTimes(1);
    const action = dispatch.mock.calls[0][0];
    expect(action.payload.routes.map((r: any) => r.key)).toEqual(['g', 'p']);
    expect(action.payload.index).toBe(1);
    dispatch.mockClear();
    state.index = 1;
    state.routes = [{ key: 'g' }, { key: 'm' }];
    blur(); // the modal itself is the top page (normal dismiss): nothing to do
    expect(dispatch).not.toHaveBeenCalled();
  });

  test('language: labels come from the app-wide language (hin)', async () => {
    await act(async () => {
      await i18n.changeLanguage('hin');
    });
    await mount();
    expect(text('policy-link')).toBe(i18n.t('Cancellation Policy'));
    expect(host('otp-input').props.placeholder).toBe(i18n.t('Enter OTP'));
  });
});

describe('blur -> reset through a real navigator', () => {
  test('pushing a page over the modal removes only the modal route; no route is lost and nothing throws', async () => {
    const { NavigationContainer } = require('@react-navigation/native');
    const { createIonStackNavigator } = require('../../navigation/IonStack');
    const Stack = createIonStackNavigator();
    const Plain = () => null;
    let nav: any;
    function Gift(props: any) {
      nav = props.navigation;
      return null;
    }
    function Modal(props: any) {
      return <CancelpolicyModalScreen {...props} />;
    }
    await act(async () => {
      tree = ReactTestRenderer.create(
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="GiftDetail" component={Gift} />
            <Stack.Screen name="CancelpolicyModal" component={Modal} options={{ presentation: 'modal' }} initialParams={PARAMS} />
            <Stack.Screen name="CancelationPolicy" component={Plain} />
          </Stack.Navigator>
        </NavigationContainer>,
      );
    });
    await act(async () => {
      nav.push('CancelpolicyModal', PARAMS);
    });
    await settle();
    await act(async () => {
      nav.push('CancelationPolicy');
    });
    await settle();
    const names = nav.getState().routes.map((r: any) => r.name);
    expect(names[names.length - 1]).toBe('CancelationPolicy');
    expect(names).not.toContain('CancelpolicyModal');
    expect(names).toContain('GiftDetail');
  });
});
