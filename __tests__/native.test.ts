// Native wrappers in MOCK mode (plan Task 10). Jest forces MODE 'MOCK' (jest.setup.js), so nothing touches native code.
import { client } from '../src/config/client';
import {
  emitMockNetwork,
  getInstalledVersion,
  getNetworkState,
  getPosition,
  MOCK_PHOTO,
  MOCK_POSITION,
  onNetworkChange,
  openExternal,
  openNavigation,
  resetMockNative,
  reverseGeocode,
  scanQr,
  setMockNativeFailure,
  setMockScan,
  shareText,
  takePhoto,
  uploadMultipart,
  type NativeName,
} from '../src/native';

beforeEach(() => {
  resetMockNative();
});

describe('MOCK success values', () => {
  test('scanQr returns the default code, or the one set by setMockScan', async () => {
    expect(await scanQr()).toEqual({ ok: true, value: 'TB-MOCK-0001' });
    setMockScan('ABC-123');
    expect(await scanQr({ prompt: '' })).toEqual({ ok: true, value: 'ABC-123' });
  });

  test('takePhoto returns a 1x1 JPEG data URL for the camera and the gallery', async () => {
    const opts = { quality: 70, maxWidth: 500, maxHeight: 400 };
    const cam = await takePhoto('camera', opts);
    expect(cam).toEqual({ ok: true, value: MOCK_PHOTO });
    expect(MOCK_PHOTO.startsWith('data:image/jpeg;base64,')).toBe(true);
    expect(await takePhoto('gallery', { quality: 70 })).toEqual({ ok: true, value: MOCK_PHOTO });
  });

  test('getPosition returns the fixed Ghaziabad position, with or without options', async () => {
    expect(MOCK_POSITION).toEqual({ lat: 28.6692, lng: 77.4538 });
    expect(await getPosition()).toEqual({ ok: true, value: MOCK_POSITION });
    expect(await getPosition({ highAccuracy: true, timeoutMs: 15000, maximumAgeMs: 10000 })).toEqual({
      ok: true,
      value: MOCK_POSITION,
    });
  });

  test('share, browser, network succeed', async () => {
    expect(await shareText('hello')).toEqual({ ok: true, value: true });
    expect(await shareText('hello', 'https://example.invalid/a.png')).toEqual({ ok: true, value: true });
    expect(await openExternal('market://details?id=com.topsan.app&hl=en', '_system')).toEqual({ ok: true, value: true });
    expect(await getNetworkState()).toEqual({ ok: true, value: { online: true, type: 'wifi' } });
  });

  test('getInstalledVersion is the client versionName', async () => {
    expect(await getInstalledVersion()).toBe(client.versionName);
  });

  test('onNetworkChange delivers changes until unsubscribed', () => {
    const seen: boolean[] = [];
    const off = onNetworkChange(o => seen.push(o));
    emitMockNetwork(false);
    emitMockNetwork(true);
    off();
    emitMockNetwork(false);
    expect(seen).toEqual([false, true]);
  });
});

// Review Focus 3: a forced failure resolves { ok: false, reason }, it never rejects.
describe('forced failures resolve, never reject', () => {
  test("setMockNativeFailure('location', 'denied') -> getPosition resolves { ok: false, reason: 'denied' }", async () => {
    setMockNativeFailure('location', 'denied');
    await expect(getPosition()).resolves.toEqual({ ok: false, reason: 'denied' });
  });

  test("camera 'denied' fails both sources", async () => {
    setMockNativeFailure('camera', 'denied');
    await expect(takePhoto('camera', { quality: 70 })).resolves.toEqual({ ok: false, reason: 'denied' });
    await expect(takePhoto('gallery', { quality: 70 })).resolves.toEqual({ ok: false, reason: 'denied' });
  });

  test("scanner 'cancelled' resolves ok('') like the plugin, 'denied' fails", async () => {
    setMockNativeFailure('scanner', 'cancelled');
    await expect(scanQr()).resolves.toEqual({ ok: true, value: '' });
    setMockNativeFailure('scanner', 'denied', 'camera permission denied');
    await expect(scanQr()).resolves.toEqual({ ok: false, reason: 'denied', message: 'camera permission denied' });
  });

  test('every other wrapper can be forced to fail too', async () => {
    const names: NativeName[] = ['share', 'browser', 'network'];
    names.forEach(n => setMockNativeFailure(n, 'error', 'boom'));
    await expect(shareText('x')).resolves.toMatchObject({ ok: false, reason: 'error' });
    await expect(openExternal('https://example.invalid')).resolves.toMatchObject({ ok: false, reason: 'error' });
    await expect(getNetworkState()).resolves.toMatchObject({ ok: false, reason: 'error' });
  });

  test('resetMockNative clears failures and the scan value', async () => {
    setMockNativeFailure('location', 'denied');
    setMockScan('X');
    resetMockNative();
    expect((await getPosition()).ok).toBe(true);
    expect(await scanQr()).toEqual({ ok: true, value: 'TB-MOCK-0001' });
  });
});

// Production for Topbath has no geocoder / launch-navigator plugin: both are unavailable unless the feature flags are on.
describe('geocode and navigate are gated by feature flags', () => {
  const features = client.features as Record<string, boolean>;
  afterEach(() => {
    features.nativeGeocode = false;
    features.nativeNavigation = false;
    features.nativeUpload = false;
  });

  // cordova-plugin-file-transfer is not in the shipped build, so uploads fail in production (see upload.ts).
  test('uploadMultipart is unavailable with nativeUpload off (Topbath), in MOCK mode too', async () => {
    expect(features.nativeUpload).toBe(false);
    const r = await uploadMultipart('https://example.invalid/up', 'file:///a.jpg', 'photo', 'image/jpeg');
    expect(r).toMatchObject({ ok: false, reason: 'unavailable' });
    setMockNativeFailure('upload', 'error');
    await expect(uploadMultipart('u', 'f', 'k', 'm')).resolves.toMatchObject({ reason: 'unavailable' });
  });

  test('uploadMultipart with nativeUpload on: MOCK value and forced failure', async () => {
    features.nativeUpload = true;
    expect(await uploadMultipart('https://example.invalid/up', 'file:///a.jpg', 'photo', 'image/jpeg')).toEqual({
      ok: true,
      value: { responseCode: 200, response: '{}' },
    });
    setMockNativeFailure('upload', 'error', 'boom');
    await expect(uploadMultipart('u', 'f', 'k', 'm')).resolves.toEqual({ ok: false, reason: 'error', message: 'boom' });
  });

  test('flags off (Topbath): unavailable', async () => {
    expect(features.nativeGeocode).toBe(false);
    expect(features.nativeNavigation).toBe(false);
    await expect(reverseGeocode(28.6, 77.4)).resolves.toMatchObject({ ok: false, reason: 'unavailable' });
    await expect(openNavigation(28.6, 77.4)).resolves.toMatchObject({ ok: false, reason: 'unavailable' });
  });

  test('flags off: unavailable even when a test forces a mock failure of another kind', async () => {
    setMockNativeFailure('geocode', 'denied');
    await expect(reverseGeocode(28.6, 77.4)).resolves.toMatchObject({ ok: false, reason: 'unavailable' });
  });

  test('flags on: MOCK values', async () => {
    features.nativeGeocode = true;
    features.nativeNavigation = true;
    const g = await reverseGeocode(28.6, 77.4);
    expect(g.ok).toBe(true);
    if (g.ok) {
      expect(Array.isArray(g.value)).toBe(true);
    }
    await expect(openNavigation(28.6, 77.4, { lat: 1, lng: 2 })).resolves.toEqual({ ok: true, value: true });
  });
});
