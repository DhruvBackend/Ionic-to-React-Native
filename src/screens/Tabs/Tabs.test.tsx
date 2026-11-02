// Tabs (Ionic TabsPage): per-role tab sets, selectedIndex from the `index` param, unknown type, the index '5' setRoot.
// The tab ROOT pages are other screens (placeholders until ported); this file covers the container only. See card.md.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { db } from '../../api/client';
import sessions from '../../api/fixtures/_sessions.json';
import i18n from '../../i18n';
import { RoleTabs } from '../../navigation/RoleTabs';
import { resetTo } from '../../navigation/navigationRef';

jest.mock('../../navigation/navigationRef', () => ({
  ...jest.requireActual('../../navigation/navigationRef'),
  resetTo: jest.fn(),
}));

const act = ReactTestRenderer.act;
let tree: ReactTestRenderer.ReactTestRenderer;
const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' ? c : c?.props ? flat(c.props.children) : '');
const labels = () => ['tab-home', 'tab-arrivals', 'tab-contact', 'tab-about', 'tab-gift', 'tab-points', 'tab-profile', 'tab-menu']
  .map(i => [i, find(`ion-tab-label-${i}`).find(n => typeof n.type === 'string')])
  .filter(([, n]) => !!n)
  .map(([i, n]: any) => [i, flat(n.props.children)]);

function mount(role: string | null, params?: object, overrides: object = {}) {
  db.userStorageData = role ? { ...(sessions as any)[role], ...overrides } : undefined;
  act(() => {
    tree = ReactTestRenderer.create(
      <NavigationContainer>
        <RoleTabs route={{ params } as any} />
      </NavigationContainer>,
    );
  });
}
const selected = () =>
  find('ion-tabbar')
    .find(n => typeof n.type === 'string')!
    .findAll(n => n.props.accessibilityState?.selected === true && typeof n.type === 'string').length;

beforeEach(async () => {
  jest.useFakeTimers();
  (resetTo as jest.Mock).mockClear();
  await i18n.changeLanguage('en');
});
afterEach(() => {
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('tab sets per role (tabs.html), reached as Otp pushes Tabs {lang}', () => {
  test.each([
    ['Plumber', ['Home', 'Offers', 'My Wallet', 'Profile', 'Menu']],
    ['Sales_Boy', ['Home', 'Offers', 'My Wallet', 'Profile', 'Menu']],
    ['Dealer', ['Home', 'Offers', 'My Wallet', 'Profile', 'Menu']],
    ['Sales_Executive', ['Home', 'Offers', 'My Wallet', 'Profile', 'Menu']],
    ['Customer', ['Home', 'New Arrivals', 'Contact Us', 'About Us', 'Profile']],
    ['Retailer', ['Home', 'New Arrivals', 'Contact Us', 'About Us', 'Profile']],
  ])('%s', (role, titles) => {
    mount(role, { lang: 'en' });
    expect(labels().map(l => l[1])).toEqual(titles);
    expect(selected()).toBe(1);
  });

  test('Hindi titles come from the translate keys', async () => {
    await i18n.changeLanguage('hin');
    mount('Customer', { lang: 'hin' });
    expect(labels().map(l => l[1])).not.toEqual(['Home', 'New Arrivals', 'Contact Us', 'About Us', 'Profile']);
    expect(labels()).toHaveLength(5);
  });
});

describe('selectedIndex="{{index}}"', () => {
  test.each([
    [{ lang: 'en' }, 0], // no index: '' -> first tab
    [{ index: '0' }, 0],
    [{ index: '3' }, 3],
    [{ index: '4' }, 4],
    [{ index: 4 }, 4],
    [{ index: '9' }, 0], // out of range: first tab
    [{ index: '' }, 0],
    [{ index: 'x' }, 0],
  ])('%j selects tab %i', (params, want) => {
    mount('Plumber', params);
    const sel = find('ion-tabbar')
      .find(n => typeof n.type === 'string')!
      .findAll(n => typeof n.type === 'string' && typeof n.props.testID === 'string' && /^ion-tab-tab-/.test(n.props.testID));
    const idx = sel.findIndex(n => n.props.accessibilityState?.selected);
    expect(idx).toBe(want);
  });
});

describe('type outside the four ngIf blocks', () => {
  test.each(['Employee', 'SFA'])('%s: no tab bar at all', role => {
    mount(role, { lang: 'en' });
    expect(find('ion-tabbar')).toHaveLength(0);
    expect(find('tabs-none').length).toBeGreaterThan(0);
  });
  test('no session: nothing rendered, no crash', () => {
    mount(null);
    expect(find('ion-tabbar')).toHaveLength(0);
  });
});

describe("constructor: index == '5' with a token -> setRoot(ProfilePage)", () => {
  test("token + '5' resets the root to Profile", () => {
    mount('Plumber', { index: '5' });
    expect(resetTo).toHaveBeenCalledWith('Profile');
  });
  test('number 5 too (loose ==)', () => {
    mount('Plumber', { index: 5 });
    expect(resetTo).toHaveBeenCalledWith('Profile');
  });
  test.each(['', null, undefined])('token %p: tabs stay, no reset', token => {
    mount('Plumber', { index: '5' }, { token });
    expect(resetTo).not.toHaveBeenCalled();
    expect(find('ion-tabbar').length).toBeGreaterThan(0);
  });
  test.each(['0', '4'])("index %s never resets", index => {
    mount('Plumber', { index });
    expect(resetTo).not.toHaveBeenCalled();
  });
});
