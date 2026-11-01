// Open a URL outside the app. Ionic: window.open(url, '_system') through cordova-plugin-inappbrowser 3.2.0, and
// InAppBrowser.create(url, '_system') (@ionic-native/in-app-browser).
//
// Call sites: app.component.ts:821 window.open('market://details?id=com.topsan.app&hl=en','_system','location=yes');
// contact.ts:44 window.open('geo:0,0?q=...', '_system'); product-subdetail.ts:79 window.open(Link,'_system','location=yes');
// quotation-genrate-by-pdf.ts:249 iab.create(url, '_system'); order-detail.ts:1035 window.open(url, '_blank').
// The '_system' target is Intent.ACTION_VIEW (inappbrowser.js openExternal), which is Linking.openURL.
import { Linking } from 'react-native';
import { fail, guard, ok, type NativeResult } from './result';
import { isMock, mockFailure } from './mock';

// NOTE (parity): '_blank' made the plugin open its own in-app browser window (toolbar, URL bar). That is a screen, not a
// native call, so it is not reproduced here: '_blank' also goes to the system. order-detail.ts:1035 is the only caller
// and it is not reachable for Topbath; it decides (WebView screen) when it is ported.
export function openExternal(url: string, _target: '_system' | '_blank' = '_system'): Promise<NativeResult<true>> {
  if (isMock()) {
    return Promise.resolve(mockFailure('browser') ?? ok(true));
  }
  return guard(async () => {
    try {
      await Linking.openURL(url);
    } catch (e) {
      return fail('unavailable', e instanceof Error ? e.message : String(e));
    }
    return ok(true);
  });
}
