// Start-up route decision, ported from app.component.ts:137-160 and 398-462 (plan Task 8).
jest.mock('../src/ui/overlays', () => ({
  showAlert: jest.fn(() => ({ dismiss: jest.fn() })),
  isOverlayOpen: jest.fn(() => false),
  dismissTopOverlay: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, getTransport, setTransport } from '../src/api/client';
import { resetMock, setFixtureVariant } from '../src/api/mock';
import { decideStartRoute } from '../src/app/startup';
import { storage } from '../src/storage';
import { showAlert } from '../src/ui/overlays';
import { expectContract } from './helpers/contract';

const CMS = { id: '7', type: 'Plumber', token: 'jwt', loginType: 'CMS', status: 'Verified' };

beforeEach(async () => {
  resetMock();
  await AsyncStorage.clear();
  db.userStorageData = undefined;
  (showAlert as jest.Mock).mockClear();
});

test.each([
  ['nothing stored', undefined],
  ['{} (left by logout)', {}],
  ['an empty token', { token: '', loginType: 'CMS' }],
])('Language when %s', async (_label, value) => {
  if (value !== undefined) {
    await storage.set('userStorageData', value);
  }
  expect(await decideStartRoute()).toEqual({ route: 'Language' });
});

test('Language when the stored text is corrupt (never throws)', async () => {
  await AsyncStorage.setItem('userStorageData', 'garbage{');
  expect(await decideStartRoute()).toEqual({ route: 'Language' });
});

test('a token with a non-CMS loginType leaves a blank root (Ionic: SFA branches commented out)', async () => {
  await storage.set('userStorageData', { ...CMS, loginType: 'SFA' });
  expect(await decideStartRoute()).toEqual({ route: 'Blank' });
});

test('CMS session with an active account → Tabs, push after 2 s, session kept in memory', async () => {
  await storage.set('userStorageData', CMS);
  expect(await decideStartRoute()).toEqual({ route: 'Tabs', startPushAfterMs: 2000 });
  expect(db.userStorageData).toEqual(CMS);
});

test('an unverified account also goes to Tabs', async () => {
  await storage.set('userStorageData', CMS);
  setFixtureVariant('app_karigar/profile', 'unverified');
  expect(await decideStartRoute()).toEqual({ route: 'Tabs', startPushAfterMs: 2000 });
});

test('suspended (del == "1") → Language, "Message!" alert, stored session cleared', async () => {
  await storage.set('userStorageData', CMS);
  setFixtureVariant('app_karigar/profile', 'suspended');
  expect(await decideStartRoute()).toEqual({ route: 'Language' });
  expect(showAlert).toHaveBeenCalledWith({
    title: 'Message!',
    subTitle: 'Your Account has been suspended',
    buttons: ['OK'],
  });
  expect(await storage.get('userStorageData')).toEqual({});
  expect(db.userStorageData).toEqual({});
});

test('any other status → session cleared and a blank root (copied from Ionic)', async () => {
  await storage.set('userStorageData', CMS);
  setFixtureVariant('app_karigar/profile', 'notSuccess');
  expect(await decideStartRoute()).toEqual({ route: 'Blank' });
  expect(await storage.get('userStorageData')).toEqual({});
});

test('SUCCESS without a karigar object → blank root, no crash (Ionic throws inside subscribe)', async () => {
  await storage.set('userStorageData', CMS);
  setFixtureVariant('app_karigar/profile', 'malformed');
  expect(await decideStartRoute()).toEqual({ route: 'Blank' });
});

test('request error → Tabs anyway (Ionic error callback)', async () => {
  await storage.set('userStorageData', CMS);
  const previous = getTransport();
  setTransport(() => Promise.reject(new Error('offline')));
  try {
    expect(await decideStartRoute()).toEqual({ route: 'Tabs', startPushAfterMs: 2000 });
  } finally {
    setTransport(previous);
  }
});

test('profile request matches the Ionic call', async () => {
  await storage.set('userStorageData', CMS);
  await expectContract('app_karigar/profile', () => decideStartRoute());
});
