// Push notifications (plan Task 8.1). Ionic: @ionic-native/push (phonegap-plugin-push), initPushNotification in
// app.component.ts:896-1015 (called 2 s after a logged-in start reaches Tabs, :416-458; App.tsx) and home.ts:960-1088
// (called from the Home constructor, :98; Home/index.tsx).
//
// Off for Topbath: client.features.push is false (its production build has no push plugin), so both calls return at once.
// For a push-enabled client the native side is a PushProvider (Firebase Messaging) registered with setPushProvider() at
// start-up; it is not in the build until the Firebase project is decided (docs/RELEASE.md section 5). Without a
// provider nothing happens.
//
// NOTE (parity): phonegap-plugin-push keeps ONE native callback: every init() replaces the previous object's events, so the
// last initPushNotification (normally the app's, 2 s after Home's) receives taps and registrations. setPushProvider's
// provider must behave the same (init replaces the handlers). Unverified on a device: the Topbath APK never had the plugin.
// NOTE (parity): `hasPermission()` only logs, and `storage.set('fcmId', registration)` is never read: not ported. The
// POST_NOTIFICATIONS prompt (Android 13+) belongs to the native provider.
import { StackActions } from '@react-navigation/native';
import { db } from '../api/client';
import { client } from '../config/client';
import { navigationRef } from '../navigation/navigationRef';

export interface PushNotification {
  additionalData?: { type?: unknown } | null;
}

export interface PushHandlers {
  onRegistration(registrationId: string): void;
  onNotification(notification: PushNotification): void;
}

export interface PushProvider {
  init(handlers: PushHandlers): void;
}

export type PushSource = 'app' | 'home';

let provider: PushProvider | null = null;

export function setPushProvider(p: PushProvider | null): void {
  provider = p;
}

// The `additionalData.type` -> page tables (loose `==` on strings: exact match).
const APP_ROUTES: Record<string, string> = {
  // app.component.ts:938-955
  message: 'Feedback',
  offer: 'OfferList',
  redeem: 'Transaction',
  catalogue: 'Products',
  product: 'Products',
  video: 'Video',
  profile: 'Profile',
};
const HOME_ROUTES: Record<string, string> = {
  // home.ts:1001-1017 (one if/else chain)
  message: 'Feedback',
  offer: 'OfferList',
  redeem: 'Transaction',
  gift: 'GiftDetail', // pushed without params (GiftDetailPage with no id)
  catalogue: 'Products',
  product: 'Products',
  video: 'Video',
  // home.ts:1018-1025 (a second chain: no type is in both)
  Service: 'MyCamplaints',
  Installation: 'MyCamplaints',
  profile: 'Profile',
};

export function routeForNotification(source: PushSource, type: unknown): string | null {
  const table = source === 'app' ? APP_ROUTES : HOME_ROUTES;
  return typeof type === 'string' && Object.prototype.hasOwnProperty.call(table, type) ? table[type] : null;
}

function onNotification(source: PushSource, notification: PushNotification): void {
  // Ionic reads notification.additionalData.type without a guard: a missing additionalData throws in the handler, nothing opens.
  const route = routeForNotification(source, notification?.additionalData?.type);
  if (!route || !navigationRef.isReady()) {
    return;
  }
  if (source === 'app') {
    // this.nav.push: the root nav (app.html <ion-nav #content>)
    navigationRef.dispatch({ ...StackActions.push(route), target: navigationRef.getRootState()?.key });
  } else {
    // this.navCtrl.push: Home's own nav, the active one while Home is showing
    navigationRef.dispatch(StackActions.push(route));
  }
}

function onRegistration(registrationId: string): void {
  // registrationid(): post after 5 s; `dbService.userStorageData.id` is read when the timer fires. No error callback.
  setTimeout(() => {
    db.post_rqst({ registration_id: registrationId, id: db.userStorageData?.id }, 'app_karigar/update_token').catch(() => undefined);
  }, 5000);
}

export function initPushNotification(source: PushSource = 'app'): void {
  if (!client.features.push || !provider) {
    return;
  }
  provider.init({
    onRegistration,
    onNotification: n => onNotification(source, n),
  });
}
