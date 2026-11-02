// SelectRegistrationType screen (Ionic SelectRegistrationTypePage): states, navigation and quirks. See card.md. No endpoints.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import i18n from '../../i18n';
import { isOverlayOpen } from '../../ui/overlays';
import Screen from './index';

let tree: ReactTestRenderer.ReactTestRenderer;
const act = ReactTestRenderer.act;
const navigation = { push: jest.fn() };

async function mount(params: object = { lang: 'en' }) {
  await act(async () => {
    tree = ReactTestRenderer.create(<Screen navigation={navigation as any} route={{ params } as any} />);
  });
}

const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const host = (id: string) => find(id).find(n => typeof n.type === 'string')!;
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' ? c : c?.props ? flat(c.props.children) : '');
const allText = (): string[] => tree.root.findAll(n => (n.type as any) === 'Text').map(n => flat(n.props.children));
const checked = (id: string) => !!host(`reg-${id}-cover`).props.accessibilityState.checked;
async function press(id: string) {
  const n = find(id).find(x => typeof x.props.onPress === 'function')!;
  await act(async () => {
    n.props.onPress({ nativeEvent: { locationX: 10, locationY: 10 } });
  });
}
const goDisabled = () => !!host('reg-go').props.accessibilityState?.disabled;

beforeEach(async () => {
  navigation.push.mockClear();
  await act(async () => {
    await i18n.changeLanguage('en');
  });
});
afterEach(() => {
  act(() => tree?.unmount());
});

describe('states (card States)', () => {
  test('default: four unchecked radios in English, Go disabled', async () => {
    await mount();
    expect(allText()).toEqual(expect.arrayContaining(['Select Registration Type', 'Plumber', 'Seller', 'Dealer', 'Sales Executive']));
    for (const id of ['plumber', 'seller', 'dealer', 'sales-executive']) {
      expect(checked(id)).toBe(false);
    }
    expect(goDisabled()).toBe(true);
  });

  test('selected: tapping Plumber checks it and enables Go', async () => {
    await mount();
    await press('reg-plumber-cover');
    expect(checked('plumber')).toBe(true);
    expect(goDisabled()).toBe(false);
  });

  test('hin: header, Plumber, Seller and Go are Hindi; Dealer and Sales Executive stay English (quirk 3)', async () => {
    await mount({ lang: 'hin' });
    const text = allText();
    expect(text).toEqual(expect.arrayContaining(['पंजीकरण प्रकार का चयन करें', 'नलसाज', 'विक्रेता', 'Dealer', 'Sales Executive']));
    expect(text.some(s => s.includes('जाओ'))).toBe(true);
    expect(i18n.language).toBe('hin');
  });
});

describe('navigation', () => {
  test.each([
    ['reg-plumber-cover', 'Plumber'],
    ['reg-seller-cover', 'Sales_Boy'],
    ['reg-dealer-cover', 'Dealer'],
    ['reg-sales-executive-cover', 'Sales_Executive'],
  ])('%s then Go navigates to MobileLogin with {registerType: %s, lang}', async (cover, value) => {
    await mount({ lang: 'hin' });
    await press(cover);
    await press('reg-go');
    expect(navigation.push).toHaveBeenCalledWith('MobileLogin', { registerType: value, lang: 'hin' });
  });
});

describe('quirks', () => {
  test('1: the Customer radio is not offered (four radios)', async () => {
    await mount();
    expect(find('reg-plumber').length + find('reg-seller').length + find('reg-dealer').length + find('reg-sales-executive').length).toBeGreaterThan(0);
    expect(allText()).not.toContain('Consumer');
    expect(['plumber', 'seller', 'dealer', 'sales-executive'].every(id => find(`reg-${id}-radio`).length > 0)).toBe(true);
    expect(find('reg-customer-radio').length).toBe(0);
  });

  test('3: Dealer and Sales Executive show their key text in Hindi too', async () => {
    await mount({ lang: 'hin' });
    expect(i18n.t('Dealer')).toBe('Dealer');
    expect(i18n.t('Sales Executive')).toBe('Sales Executive');
  });

  test('4: a missing lang does not throw and leaves the language alone', async () => {
    await expect(mount({})).resolves.toBeUndefined();
    expect(i18n.language).toBe('en');
  });

  test('7: no overlay or loader is ever shown', async () => {
    await mount();
    await press('reg-plumber-cover');
    await press('reg-go');
    expect(isOverlayOpen()).toBe(false);
  });

  test('8: header is a navbar with the logo overlay', async () => {
    await mount();
    expect(find('ion-navbar').length).toBeGreaterThan(0);
    expect(find('header-logo').length).toBeGreaterThan(0);
  });
});
