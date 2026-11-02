// Plan Task 7: tab sets copied from Ionic tabs.html, feature-flag gating, debug deep links.
import { isRouteEnabled } from '../src/navigation/routes';
import { tabsFor } from '../src/navigation/tabs';
import { parseDebugLink } from '../src/navigation/debugLinks';
import type { RouteDef } from '../src/navigation/types';
import type { ClientConfig } from '../src/config/types';
import topbath from '../clients/topbath/client.json';
import allFeatures from '../clients/_all-features/client.json';

const Dummy = () => null;
const sfaRoute: RouteDef = { name: 'Dashboard', presentation: 'card', feature: 'sfa', links: [], component: Dummy };
const plainRoute: RouteDef = { name: 'Home', presentation: 'card', links: [], component: Dummy };

describe('feature gating', () => {
  test('a flagged route is disabled for topbath', () => {
    expect(isRouteEnabled(sfaRoute, topbath as ClientConfig)).toBe(false);
  });
  test('a flagged route is enabled for _all-features', () => {
    expect(isRouteEnabled(sfaRoute, allFeatures as ClientConfig)).toBe(true);
  });
  test('a route without a flag is always enabled', () => {
    expect(isRouteEnabled(plainRoute, topbath as ClientConfig)).toBe(true);
  });
});

describe('tab sets (Ionic src/pages/tabs/tabs.html)', () => {
  const names = (role?: string) => tabsFor(role).map(t => t.route);

  test.each(['Plumber', 'Sales_Boy', 'Dealer'])('%s: Home · Offers · My Wallet · Profile · Menu', role => {
    expect(names(role)).toEqual(['Home', 'OfferList', 'PointList', 'Profile', 'MainHome']);
    expect(tabsFor(role).map(t => t.title)).toEqual(['Home', 'Offers', 'My Wallet', 'Profile', 'Menu']);
    expect(tabsFor(role).map(t => t.icon)).toEqual(['tab-home', 'tab-gift', 'tab-points', 'tab-profile', 'tab-menu']);
  });

  test('Sales_Executive: same tabs, but Home is SalesExecHome', () => {
    expect(names('Sales_Executive')).toEqual(['SalesExecHome', 'OfferList', 'PointList', 'Profile', 'MainHome']);
  });

  test.each(['Customer', 'Retailer'])('%s: Home · New Arrivals · Contact Us · About Us · Profile', role => {
    expect(names(role)).toEqual(['Home', 'Newarrivals', 'Contact', 'About', 'Profile']);
    expect(tabsFor(role).map(t => t.title)).toEqual(['Home', 'New Arrivals', 'Contact Us', 'About Us', 'Profile']);
    expect(tabsFor(role).map(t => t.icon)).toEqual(['tab-home', 'tab-arrivals', 'tab-contact', 'tab-about', 'tab-profile']);
  });

  test('any other or missing type gets no tabs at all (Ionic renders none of the ngIf blocks)', () => {
    expect(names('Employee')).toEqual([]);
    expect(names(undefined)).toEqual([]);
  });
});

describe('debug deep links', () => {
  const link =
    'topbathrn://open?screen=Otp&role=Plumber&lang=hin' +
    '&variant=' + encodeURIComponent('auth/login:NOT FOUND,app_karigar/profile:suspended') +
    '&params=' + encodeURIComponent(JSON.stringify({ mobile_no: '9876543210' }));

  test('parses screen, role, language, fixture variants and params', () => {
    expect(parseDebugLink(link, { dev: true })).toEqual({
      screen: 'Otp',
      role: 'Plumber',
      lang: 'hin',
      variants: { 'auth/login': 'NOT FOUND', 'app_karigar/profile': 'suspended' },
      params: { mobile_no: '9876543210' },
    });
  });

  test('ignored in release builds', () => {
    expect(parseDebugLink(link, { dev: false })).toBeNull();
  });

  test('ignored for other schemes, a missing screen, or broken params JSON', () => {
    expect(parseDebugLink('https://example.com/open?screen=Otp', { dev: true })).toBeNull();
    expect(parseDebugLink('topbathrn://open?role=Plumber', { dev: true })).toBeNull();
    expect(parseDebugLink('topbathrn://open?screen=Otp&params=%7Bbroken', { dev: true })).toBeNull();
  });

  test('mock=1 asks for the MOCK transport (parity captures: fixtures, no network)', () => {
    expect(parseDebugLink('topbathrn://open?screen=Language&mock=1', { dev: true })).toEqual({
      screen: 'Language',
      variants: {},
      params: {},
      mock: true,
    });
  });

  test('optional parts may be left out', () => {
    expect(parseDebugLink('topbathrn://open?screen=Language', { dev: true })).toEqual({
      screen: 'Language',
      variants: {},
      params: {},
    });
  });
});
