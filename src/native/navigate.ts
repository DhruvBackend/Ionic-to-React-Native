// Turn-by-turn navigation. Ionic: @ionic-native/launch-navigator (nearest-dealer.ts:69-73 navigate([lat, lng],
// { app: GOOGLE_MAPS }); pulmber-customer-detail.ts:199 navigate('lat,lng', { start: 'lat,lng' })) -> a plugin that is NOT
// in the shipped Topbath build (topsan.aab cordova_plugins.js), so in production the click does nothing.
// Unavailable unless client.features.nativeNavigation is on (spec 2a, plan Task 10). With the flag on it opens Google Maps
// through Linking: google.navigation:q=lat,lng, or the Maps directions URL when a start point is given.
import { Linking } from 'react-native';
import { client } from '../config/client';
import { fail, guard, ok, type NativeResult } from './result';
import { isMock, mockFailure } from './mock';

export function openNavigation(lat: number, lng: number, from?: { lat: number; lng: number }): Promise<NativeResult<true>> {
  if (!client.features.nativeNavigation) {
    return Promise.resolve(fail('unavailable', 'nativeNavigation feature is off for this client'));
  }
  if (isMock()) {
    return Promise.resolve(mockFailure('navigate') ?? ok(true));
  }
  return guard(async () => {
    const url = from
      ? `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${lat},${lng}`
      : `google.navigation:q=${lat},${lng}`;
    try {
      await Linking.openURL(url);
    } catch (e) {
      return fail('unavailable', e instanceof Error ? e.message : String(e));
    }
    return ok(true);
  });
}
