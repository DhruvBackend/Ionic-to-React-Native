// Reverse geocode. Ionic: @ionic-native/native-geocoder reverseGeocode (pulmber-customer-detail.ts:114,
// plumber-checkin.ts:134, point-location.ts:202) -> cordova-plugin-nativegeocoder, which is NOT in the shipped Topbath
// build (topsan.aab cordova_plugins.js has no geocoder), so in production every call fails and the catch does nothing
// (the address stays empty). The wrapper reproduces that unless client.features.nativeGeocode is on (spec 2a, plan Task 10).
// With the flag on, ReverseGeocodeModule (android Geocoder) returns the first result's parts, in the order
// countryCode, countryName, postalCode, administrativeArea, subAdministrativeArea, locality, subLocality, thoroughfare,
// subThoroughfare, which the pages join (generateAddress reverses and joins the non-empty ones).
import { NativeModules, Platform } from 'react-native';
import { client } from '../config/client';
import { fail, guard, ok, type NativeResult } from './result';
import { isMock, mockFailure } from './mock';

export const MOCK_ADDRESS_PARTS = ['IN', 'India', '201001', 'Uttar Pradesh', 'Ghaziabad', 'Ghaziabad', 'Indirapuram', 'NH 24', '1'];

export function reverseGeocode(lat: number, lng: number): Promise<NativeResult<string[]>> {
  if (!client.features.nativeGeocode) {
    return Promise.resolve(fail('unavailable', 'nativeGeocode feature is off for this client'));
  }
  if (isMock()) {
    return Promise.resolve(mockFailure('geocode') ?? ok(MOCK_ADDRESS_PARTS));
  }
  return guard(async () => {
    if (Platform.OS !== 'android' || !NativeModules.ReverseGeocodeModule) {
      return fail('unavailable', 'geocoder is Android only');
    }
    return ok((await NativeModules.ReverseGeocodeModule.reverse(lat, lng)) as string[]);
  });
}
