// Share via the system chooser. Ionic: @ionic-native/social-sharing -> cordova-plugin-x-socialsharing 6.0.4.
//
// Call sites: home.ts:872 and profile.ts:306 share('Hey There ! ... com.topsan.app' + ref_code) (text only);
// dealer-home.ts:162 the same (text only); product-subdetail.ts:149 share(shareData, null, this.imgData, null) where imgData
// is an http(s) URL of the product image (product-subdetail.ts:98,113). Results are ignored (empty then / catch logs).
// ShareModule (android NativeToolsPackage.kt) builds the same ACTION_SEND chooser (text/plain, or the downloaded image with
// the text as EXTRA_TEXT) as SocialSharing.java doSendIntent.
import { NativeModules, Platform } from 'react-native';
import { fail, guard, ok, type NativeResult } from './result';
import { isMock, mockFailure } from './mock';

// `image` is the plugin's `file` argument: an http(s) URL (downloaded, then shared) or a data: URL.
export function shareText(text: string, image?: string): Promise<NativeResult<true>> {
  if (isMock()) {
    return Promise.resolve(mockFailure('share') ?? ok(true));
  }
  return guard(async () => {
    if (Platform.OS !== 'android' || !NativeModules.ShareModule) {
      return fail('unavailable', 'share wrapper is Android only');
    }
    await NativeModules.ShareModule.share(text, image ?? null);
    return ok(true);
  });
}
