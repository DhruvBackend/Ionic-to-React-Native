// Runtime-permission helper (Android). The shipped Cordova plugins asked at call time, not at start-up:
// barcodescanner (CAMERA), camera (CAMERA / media), geolocation (COARSE + FINE together). The wrappers do the same.
import { PermissionsAndroid, Platform, type Permission } from 'react-native';

// true when every permission is granted, asking for the missing ones (one system dialog per group).
export async function ensurePermissions(perms: Permission[]): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  const result = await PermissionsAndroid.requestMultiple(perms);
  return perms.every(p => result[p] === PermissionsAndroid.RESULTS.GRANTED);
}
