// Current position. Ionic: @ionic-native/location-accuracy (cordova-plugin-request-location-accuracy 2.3.0) followed by
// @ionic-native/geolocation (cordova-plugin-geolocation 4.1.0).
//
// Every page that needs a position does (dashboard.ts:157-161, dealer-home.ts:207-212, point-location.ts:103-108,
// plumber-checkin.ts:65-70, task-close.ts:136-141, work-type-modal.ts:85-89, add-checkin.ts:170-176 and 3 more,
// end-checkin.ts:83-87 and 1 more, pulmber-customer-detail.ts:218-223):
//   1. locationAccuracy.request(REQUEST_PRIORITY_HIGH_ACCURACY)       Google's "turn on device location" dialog
//   2. geolocation.getCurrentPosition(options)                        runtime permission (COARSE + FINE together), then the fix
// where options is { maximumAge: 10000, timeout: 15000, enableHighAccuracy: true } (dashboard, add-checkin, end-checkin,
// work-type-modal, dealer-home, point-location, task-close) or omitted (plumber-checkin, pulmber-customer-detail:187/223).
// pulmber-customer-detail.ts:187 (getDirection) calls getCurrentPosition() WITHOUT the accuracy request: pass requestAccuracy: false.
// Pages read only resp.coords.latitude / longitude. A rejected accuracy request goes to the page's rejection handler, a rejected
// fix to its catch; both end up here as { ok: false } (message starts with 'accuracy:' for the first).
import { NativeModules, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { ensurePermissions } from './permissions';
import { fail, guard, ok, type NativeResult } from './result';
import { isMock, mockFailure } from './mock';

export type PositionOptions = {
  highAccuracy?: boolean; // enableHighAccuracy
  timeoutMs?: number; // timeout
  maximumAgeMs?: number; // maximumAge
  // false skips step 1 (the accuracy dialog). Default true, as almost every page asks first.
  requestAccuracy?: boolean;
};

export type Position = { lat: number; lng: number };

export const MOCK_POSITION: Position = { lat: 28.6692, lng: 77.4538 };

const REQUEST_PRIORITY_HIGH_ACCURACY = 3;

// WebView getCurrentPosition defaults (the Cordova plugin delegated to navigator.geolocation): enableHighAccuracy false,
// maximumAge 0, timeout Infinity. The library's own defaults differ (maximumAge Infinity, timeout 10 minutes) and it
// forwards keys that are present even when undefined, so the object below always has all three, never undefined.
// 2147483647 ms (about 24.8 days) is the largest delay a native Handler takes safely: it stands in for Infinity.
const WEBVIEW_TIMEOUT_MS = 2147483647;

let configured = false;
// cordova-plugin-request-location-accuracy www/android/RequestLocationAccuracy.js: one request at a time.
let accuracyInProgress = false;

// Shows Google's location-settings dialog (no-op when the settings are already satisfied). Rejection codes are the
// plugin's: 4 user disagreed, 3 cannot change, 2 exception.
async function requestAccuracy(): Promise<NativeResult<true>> {
  if (accuracyInProgress) {
    // The plugin JS answers { code: -1, message: "A request is already in progress" } without asking again.
    return fail('error', 'accuracy: A request is already in progress');
  }
  accuracyInProgress = true;
  try {
    await NativeModules.LocationAccuracyModule.request(REQUEST_PRIORITY_HIGH_ACCURACY);
    return ok(true);
  } catch (e) {
    const code = (e as { code?: string }).code;
    const message = `accuracy: ${(e as Error).message ?? 'failed'}`;
    return fail(code === '4' ? 'denied' : 'error', message);
  } finally {
    accuracyInProgress = false;
  }
}

export function getPosition(opts?: PositionOptions): Promise<NativeResult<Position>> {
  if (isMock()) {
    return Promise.resolve(mockFailure('location') ?? ok(MOCK_POSITION));
  }
  return guard(async () => {
    if (Platform.OS !== 'android' || !NativeModules.LocationAccuracyModule) {
      return fail('unavailable', 'location wrapper is Android only');
    }
    if (opts?.requestAccuracy !== false) {
      const accuracy = await requestAccuracy();
      if (!accuracy.ok) {
        return accuracy;
      }
    }
    // Geolocation.java getPermission: COARSE and FINE requested together, any denial = PERMISSION_DENIED ("Illegal Access").
    if (!(await ensurePermissions(['android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_FINE_LOCATION']))) {
      return fail('denied', 'location permission denied');
    }
    if (!configured) {
      configured = true;
      // The permission was asked for above, exactly where the plugin asked.
      Geolocation.setRNConfiguration({ skipPermissionRequests: true, authorizationLevel: 'whenInUse' });
    }
    return new Promise<NativeResult<Position>>(resolve => {
      Geolocation.getCurrentPosition(
        p => resolve(ok({ lat: p.coords.latitude, lng: p.coords.longitude })),
        e => resolve(fail(e.code === 1 ? 'denied' : e.code === 2 ? 'unavailable' : 'error', e.message)),
        {
          enableHighAccuracy: opts?.highAccuracy ?? false,
          timeout: opts?.timeoutMs ?? WEBVIEW_TIMEOUT_MS,
          maximumAge: opts?.maximumAgeMs ?? 0,
        },
      );
    });
  });
}
