// Push (plan Task 8.1): Ionic app.component.ts:896-1015 and home.ts:960-1088, with the native push provider mocked.
import { StackActions } from '@react-navigation/native';
import { db } from '../src/api/client';
import { client } from '../src/config/client';
import { initPushNotification, routeForNotification, setPushProvider, type PushHandlers } from '../src/native/push';
import { navigationRef } from '../src/navigation/navigationRef';

jest.mock('../src/navigation/navigationRef', () => ({
  navigationRef: { isReady: jest.fn(() => true), dispatch: jest.fn(), getRootState: jest.fn(() => ({ key: 'root-key' })) },
}));

const features = client.features as Record<string, boolean>;
let handlers: PushHandlers | null = null;
const provider = { init: jest.fn((h: PushHandlers) => (handlers = h)) };

beforeEach(() => {
  jest.useFakeTimers();
  handlers = null;
  provider.init.mockClear();
  (navigationRef.dispatch as jest.Mock).mockClear();
  setPushProvider(provider);
  features.push = true;
});
afterEach(() => {
  features.push = false;
  setPushProvider(null);
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('Topbath: push is off, the provider is never started', () => {
  features.push = false;
  initPushNotification();
  initPushNotification('home');
  expect(provider.init).not.toHaveBeenCalled();
});

test('no native provider (no Firebase in the build): nothing happens, no throw', () => {
  setPushProvider(null);
  expect(() => initPushNotification()).not.toThrow();
});

test('app.component table (:938-955)', () => {
  const t = (type: string) => routeForNotification('app', type);
  expect([t('message'), t('offer'), t('redeem'), t('catalogue'), t('product'), t('video'), t('profile')]).toEqual([
    'Feedback', 'OfferList', 'Transaction', 'Products', 'Products', 'Video', 'Profile',
  ]);
  // only home.ts handles these
  expect([t('gift'), t('Service'), t('Installation'), t('nope')]).toEqual([null, null, null, null]);
});

test('home.ts table (:1001-1025): adds gift, Service, Installation', () => {
  const t = (type: string) => routeForNotification('home', type);
  expect([t('message'), t('offer'), t('redeem'), t('gift'), t('catalogue'), t('product'), t('video')]).toEqual([
    'Feedback', 'OfferList', 'Transaction', 'GiftDetail', 'Products', 'Products', 'Video',
  ]);
  expect([t('Service'), t('Installation'), t('profile'), t('service'), t('nope')]).toEqual([
    'MyCamplaints', 'MyCamplaints', 'Profile', null, null,
  ]);
});

test('app: a tap pushes on the root nav (this.nav.push)', () => {
  initPushNotification();
  handlers!.onNotification({ additionalData: { type: 'redeem' } });
  expect(navigationRef.dispatch).toHaveBeenCalledWith({ ...StackActions.push('Transaction'), target: 'root-key' });
});

test('home: a tap pushes on the active nav (navCtrl.push)', () => {
  initPushNotification('home');
  handlers!.onNotification({ additionalData: { type: 'Service' } });
  expect(navigationRef.dispatch).toHaveBeenCalledWith(StackActions.push('MyCamplaints'));
});

test('unknown type or no additionalData: no navigation', () => {
  initPushNotification();
  handlers!.onNotification({ additionalData: { type: 'gift' } });
  handlers!.onNotification({});
  expect(navigationRef.dispatch).not.toHaveBeenCalled();
});

test('registration: update_token with { registration_id, id } after 5 s (:1003-1012)', () => {
  const post = jest.spyOn(db, 'post_rqst').mockResolvedValue({});
  db.userStorageData = { id: 77 };
  initPushNotification();
  handlers!.onRegistration('tok-1');
  jest.advanceTimersByTime(4999);
  expect(post).not.toHaveBeenCalled();
  // the id is read when the timer fires, as Ionic reads dbService.userStorageData.id inside the setTimeout
  db.userStorageData = { id: 78 };
  jest.advanceTimersByTime(1);
  expect(post).toHaveBeenCalledWith({ registration_id: 'tok-1', id: 78 }, 'app_karigar/update_token');
});

test('a failed update_token is swallowed (Ionic subscribe has no error callback)', async () => {
  jest.spyOn(db, 'post_rqst').mockRejectedValue(new Error('net'));
  initPushNotification();
  handlers!.onRegistration('tok-2');
  jest.advanceTimersByTime(5000);
  await Promise.resolve();
});
