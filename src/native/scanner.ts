// QR / barcode scan. Ionic: @ionic-native/barcode-scanner -> phonegap-plugin-barcodescanner 8.1.0 (topsan.aab
// cordova_plugins.js metadata). The plugin starts its own full-screen ZXing CaptureActivity from the bundled
// barcodescanner-release-2.1.5.aar; ScannerModule (android NativeToolsPackage.kt) starts the same activity from the same
// aar with the same intent extras, so the scanner looks and behaves the same.
//
// Call sites (src/pages): home.ts:372 and scane-pages/coupan-code/coupan-code.ts:69 call scan() with NO options;
// scan-point/scan-point.ts:179 calls scan({ prompt: '' }). Every one only reads resp.text and treats '' as "nothing
// scanned" (home.ts:379 `if (resp.text != '')`).
//
// NOTE (parity): when the user backs out of the scanner the plugin does not fail: it resolves { text: '', format: '', cancelled: true }
// and the pages assign `this.qr_code = resp.text` ('') before the `!= ''` check. scanQr therefore resolves ok('') on cancel so a
// screen runs the same assignment and the same "nothing scanned" branch. Permission denied and plugin errors are failures.
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { fail, guard, ok, type NativeResult } from './result';
import { getMockScan, isMock, mockFailure } from './mock';

// Every option phonegap-plugin-barcodescanner 8.1.0 reads (BarcodeScanner.java scan()). Defaults are the plugin's.
export type ScanOptions = {
  preferFrontCamera?: boolean;
  showFlipCameraButton?: boolean;
  showTorchButton?: boolean;
  torchOn?: boolean;
  saveHistory?: boolean;
  disableSuccessBeep?: boolean;
  resultDisplayDuration?: number;
  formats?: string;
  prompt?: string;
  orientation?: string;
};

type NativeScan = { status: 'ok' | 'cancelled' | 'error'; text?: string; format?: string };

// options === undefined means the page passed nothing (the plugin then adds no extras at all).
export function scanQr(options?: ScanOptions): Promise<NativeResult<string>> {
  if (isMock()) {
    const forced = mockFailure('scanner');
    // A forced 'cancelled' behaves like the real wrapper: ok('') (see the NOTE above).
    return Promise.resolve(forced ? (forced.reason === 'cancelled' ? ok('') : forced) : ok(getMockScan()));
  }
  return guard(async () => {
    if (Platform.OS !== 'android' || !NativeModules.ScannerModule) {
      return fail('unavailable', 'scanner is Android only');
    }
    // BarcodeScanner.java scan(): requests CAMERA when it is not granted; denied -> error callback.
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      return fail('denied', 'camera permission denied');
    }
    const config = options ? { ...options } : null;
    if (config?.formats) {
      // barcodescanner.js: "string spaces between formats, ZXing does not like that"
      config.formats = config.formats.replace(/\s+/g, '');
    }
    const r: NativeScan = await NativeModules.ScannerModule.scan(config);
    if (r.status === 'cancelled') {
      return ok('');
    }
    if (r.status !== 'ok') {
      return fail('error', 'Unexpected error');
    }
    let text = r.text ?? '';
    // NOTE (parity): barcodescanner.js "work around bug in ZXing library": a 13 character UPC_A result loses its first digit.
    if (r.format === 'UPC_A' && text.length === 13) {
      text = text.substring(1);
    }
    return ok(text);
  });
}
