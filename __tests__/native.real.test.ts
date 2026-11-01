// The non-MOCK paths of the native wrappers with the native modules faked: permission order, option mapping and error
// mapping. (On device these run against the real modules; the `_NativeDemo` debug screen exercises them.)
jest.mock('../src/config/env', () => ({ ...jest.requireActual('../src/config/env'), MODE: 'DEV' }));

import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { getInstalledVersion, getPosition, scanQr, shareText, takePhoto } from '../src/native';
import { client } from '../src/config/client';

const GRANTED = PermissionsAndroid.RESULTS.GRANTED;
const DENIED = PermissionsAndroid.RESULTS.DENIED;
const order: string[] = [];

beforeEach(() => {
  order.length = 0;
  Platform.OS = 'android';
  Object.defineProperty(Platform, 'Version', { value: 34, configurable: true });
  jest.spyOn(PermissionsAndroid, 'request').mockImplementation(async p => {
    order.push(`perm:${p}`);
    return GRANTED;
  });
  jest.spyOn(PermissionsAndroid, 'requestMultiple').mockImplementation(async ps => {
    order.push(`perm:${ps.join('+')}`);
    return Object.fromEntries(ps.map(p => [p, GRANTED])) as never;
  });
  NativeModules.ScannerModule = { scan: jest.fn() };
  NativeModules.LocationAccuracyModule = { request: jest.fn(async () => 0) };
  NativeModules.SocialSharingModule = { share: jest.fn(async () => true) };
  NativeModules.CameraModule = { getPicture: jest.fn() };
});

afterEach(() => {
  jest.restoreAllMocks();
  delete NativeModules.ScannerModule;
  delete NativeModules.LocationAccuracyModule;
  delete NativeModules.SocialSharingModule;
  delete NativeModules.CameraModule;
  delete NativeModules.BuildInfo;
});

describe('scanQr', () => {
  test('asks for CAMERA, then starts the scanner; no options -> null config (no extras)', async () => {
    NativeModules.ScannerModule.scan.mockResolvedValue({ status: 'ok', text: 'QR1', format: 'QR_CODE' });
    expect(await scanQr()).toEqual({ ok: true, value: 'QR1' });
    expect(order).toEqual(['perm:android.permission.CAMERA']);
    expect(NativeModules.ScannerModule.scan).toHaveBeenCalledWith(null);
  });

  test("passes { prompt: '' } through and strips spaces from formats", async () => {
    NativeModules.ScannerModule.scan.mockResolvedValue({ status: 'ok', text: 'A', format: 'QR_CODE' });
    await scanQr({ prompt: '', formats: 'QR_CODE, EAN_13' });
    expect(NativeModules.ScannerModule.scan).toHaveBeenCalledWith({ prompt: '', formats: 'QR_CODE,EAN_13' });
  });

  test("back button -> ok('') like the plugin's { text: '', cancelled: true }; denied permission -> denied (scanner not started)", async () => {
    NativeModules.ScannerModule.scan.mockResolvedValue({ status: 'cancelled' });
    expect(await scanQr()).toEqual({ ok: true, value: '' });
    (PermissionsAndroid.request as jest.Mock).mockResolvedValue(DENIED);
    NativeModules.ScannerModule.scan.mockClear();
    expect(await scanQr()).toMatchObject({ ok: false, reason: 'denied' });
    expect(NativeModules.ScannerModule.scan).not.toHaveBeenCalled();
  });

  test('UPC_A 13 character results lose the first digit (barcodescanner.js)', async () => {
    NativeModules.ScannerModule.scan.mockResolvedValue({ status: 'ok', text: '0123456789012', format: 'UPC_A' });
    expect(await scanQr()).toEqual({ ok: true, value: '123456789012' });
  });

  test('a native rejection becomes { ok: false, reason: error }, not a rejection', async () => {
    NativeModules.ScannerModule.scan.mockRejectedValue(new Error('boom'));
    expect(await scanQr()).toEqual({ ok: false, reason: 'error', message: 'boom' });
  });
});

describe('takePhoto', () => {
  const picture = (status: string, extra = {}) => NativeModules.CameraModule.getPicture.mockResolvedValue({ status, ...extra });

  test('camera: CAMERA permission, then CameraModule with quality and the 500 x 400 box; data URL is built here', async () => {
    picture('ok', { data: 'QUJD' });
    const r = await takePhoto('camera', { quality: 70, maxWidth: 500, maxHeight: 400 });
    expect(r).toEqual({ ok: true, value: 'data:image/jpeg;base64,QUJD' });
    expect(order).toEqual(['perm:android.permission.CAMERA']);
    expect(NativeModules.CameraModule.getPicture).toHaveBeenCalledWith('camera', 70, 500, 400);
  });

  test('gallery: READ_MEDIA_IMAGES on API 33+, no resize (0 = not set)', async () => {
    picture('ok', { data: 'QUJD' });
    await takePhoto('gallery', { quality: 70 });
    expect(order).toEqual(['perm:android.permission.READ_MEDIA_IMAGES']);
    expect(NativeModules.CameraModule.getPicture).toHaveBeenCalledWith('gallery', 70, 0, 0);
  });

  test('gallery on API 32 asks READ and WRITE external storage together', async () => {
    Object.defineProperty(Platform, 'Version', { value: 32, configurable: true });
    picture('ok', { data: 'QUJD' });
    await takePhoto('gallery', { quality: 70 });
    expect(order).toEqual(['perm:android.permission.READ_EXTERNAL_STORAGE+android.permission.WRITE_EXTERNAL_STORAGE']);
  });

  test('camera below API 29 also asks for the storage permissions', async () => {
    Object.defineProperty(Platform, 'Version', { value: 28, configurable: true });
    picture('ok', { data: 'QUJD' });
    await takePhoto('camera', { quality: 100, maxWidth: 1000, maxHeight: 1000 });
    expect(order).toEqual([
      'perm:android.permission.CAMERA+android.permission.READ_EXTERNAL_STORAGE+android.permission.WRITE_EXTERNAL_STORAGE',
    ]);
  });

  test('a gallery file the plugin cannot decode (GIF) comes back as its location string inside the same data URL prefix', async () => {
    picture('ok', { data: 'content://media/external/images/media/7' });
    expect(await takePhoto('gallery', { quality: 70 })).toEqual({
      ok: true,
      value: 'data:image/jpeg;base64,content://media/external/images/media/7',
    });
  });

  test('cancel, unavailable and error map to reasons; a denied prompt never opens the camera', async () => {
    picture('cancelled', { message: 'No Image Selected' });
    expect(await takePhoto('camera', { quality: 70 })).toEqual({ ok: false, reason: 'cancelled', message: 'No Image Selected' });
    picture('unavailable', { message: 'No camera app' });
    expect(await takePhoto('camera', { quality: 70 })).toMatchObject({ ok: false, reason: 'unavailable' });
    picture('error', { message: 'Unable to create bitmap!' });
    expect(await takePhoto('gallery', { quality: 70 })).toMatchObject({ ok: false, reason: 'error' });
    (PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValueOnce({ 'android.permission.CAMERA': DENIED });
    NativeModules.CameraModule.getPicture.mockClear();
    expect(await takePhoto('camera', { quality: 70 })).toMatchObject({ ok: false, reason: 'denied' });
    expect(NativeModules.CameraModule.getPicture).not.toHaveBeenCalled();
  });
});

describe('getPosition', () => {
  const fix = { coords: { latitude: 1.5, longitude: 2.5 } };

  beforeEach(() => {
    (Geolocation.getCurrentPosition as jest.Mock).mockImplementation(ok => ok(fix));
  });

  test('accuracy dialog first, then COARSE+FINE, then the fix with the page options', async () => {
    NativeModules.LocationAccuracyModule.request.mockImplementation(async () => {
      order.push('accuracy');
      return 0;
    });
    const r = await getPosition({ highAccuracy: true, timeoutMs: 15000, maximumAgeMs: 10000 });
    expect(r).toEqual({ ok: true, value: { lat: 1.5, lng: 2.5 } });
    expect(order).toEqual(['accuracy', 'perm:android.permission.ACCESS_COARSE_LOCATION+android.permission.ACCESS_FINE_LOCATION']);
    expect(NativeModules.LocationAccuracyModule.request).toHaveBeenCalledWith(3);
    expect(Geolocation.getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    });
  });

  test('no options -> WebView defaults: maximumAge 0, huge timeout, enableHighAccuracy false, no undefined keys', async () => {
    (Geolocation.getCurrentPosition as jest.Mock).mockClear();
    await getPosition();
    const opts = (Geolocation.getCurrentPosition as jest.Mock).mock.calls[0][2];
    expect(opts).toEqual({ enableHighAccuracy: false, timeout: 2147483647, maximumAge: 0 });
    expect(Object.values(opts).every(v => v !== undefined)).toBe(true);
    // partial options keep the other defaults
    await getPosition({ requestAccuracy: false, timeoutMs: 5000 });
    expect((Geolocation.getCurrentPosition as jest.Mock).mock.calls[1][2]).toEqual({
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 0,
    });
  });

  test('a second accuracy request while one is open fails with "A request is already in progress"', async () => {
    let release: (v: number) => void = () => {};
    NativeModules.LocationAccuracyModule.request.mockImplementationOnce(() => new Promise<number>(r => (release = r)));
    const first = getPosition();
    await Promise.resolve();
    await Promise.resolve();
    const second = await getPosition();
    expect(second).toEqual({ ok: false, reason: 'error', message: 'accuracy: A request is already in progress' });
    expect(NativeModules.LocationAccuracyModule.request).toHaveBeenCalledTimes(1);
    release(0);
    expect((await first).ok).toBe(true);
  });

  test('requestAccuracy: false skips the dialog', async () => {
    await getPosition({ requestAccuracy: false });
    expect(NativeModules.LocationAccuracyModule.request).not.toHaveBeenCalled();
  });

  test('user says no to the accuracy dialog -> denied, and no permission prompt follows', async () => {
    NativeModules.LocationAccuracyModule.request.mockRejectedValue(Object.assign(new Error('no'), { code: '4' }));
    expect(await getPosition()).toEqual({ ok: false, reason: 'denied', message: 'accuracy: no' });
    expect(order).toEqual([]);
  });

  test('permission denied -> denied; fix timeout -> error', async () => {
    (PermissionsAndroid.requestMultiple as jest.Mock).mockResolvedValueOnce({
      'android.permission.ACCESS_COARSE_LOCATION': GRANTED,
      'android.permission.ACCESS_FINE_LOCATION': DENIED,
    });
    expect(await getPosition()).toMatchObject({ ok: false, reason: 'denied' });
    (Geolocation.getCurrentPosition as jest.Mock).mockImplementation((_ok, err) => err({ code: 3, message: 'Location request timed out' }));
    expect(await getPosition()).toEqual({ ok: false, reason: 'error', message: 'Location request timed out' });
  });
});

describe('shareText and getInstalledVersion', () => {
  test('shareText passes the text and the optional image URL to the native chooser', async () => {
    expect(await shareText('Hello')).toEqual({ ok: true, value: true });
    expect(NativeModules.SocialSharingModule.share).toHaveBeenCalledWith('Hello', null);
    await shareText('P', 'https://example.invalid/p.png');
    expect(NativeModules.SocialSharingModule.share).toHaveBeenLastCalledWith('P', 'https://example.invalid/p.png');
  });

  test('getInstalledVersion prefers the native versionName and falls back to client.json', async () => {
    NativeModules.BuildInfo = { versionName: '9.9.9' };
    expect(await getInstalledVersion()).toBe('9.9.9');
    delete NativeModules.BuildInfo;
    expect(await getInstalledVersion()).toBe(client.versionName);
  });
});
