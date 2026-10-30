// Forced-update check, ported from app.component.ts:778-842 (plan Task 8).
jest.mock('../src/ui/overlays', () => ({
  showAlert: jest.fn(() => ({ dismiss: jest.fn() })),
  isOverlayOpen: jest.fn(() => false),
  dismissTopOverlay: jest.fn(),
}));

import { getTransport, setTransport } from '../src/api/client';
import { resetMock, setFixtureVariant } from '../src/api/mock';
import { checkVersion, presentVersionAlert } from '../src/app/versionCheck';
import { showAlert } from '../src/ui/overlays';
import { expectContract } from './helpers/contract';

const STORE = 'market://details?id=com.topsan.app&hl=en';

beforeEach(() => {
  resetMock();
  (showAlert as jest.Mock).mockClear();
});

test('same version (what the dev server returns today) → no alert', async () => {
  expect(await checkVersion('0.1.5')).toEqual({ show: false });
});

test('different version → alert, not forced, with the Ionic store link', async () => {
  setFixtureVariant('app_karigar/app_version', 'mismatch');
  expect(await checkVersion('0.1.5')).toEqual({ show: true, forced: false, storeUrl: STORE });
});

test('play_console_flag 1 → forced', async () => {
  setFixtureVariant('app_karigar/app_version', 'forced');
  expect(await checkVersion('0.1.5')).toEqual({ show: true, forced: true, storeUrl: STORE });
});

test('a response without app_version shows the alert (undefined != installed, as in Ionic)', async () => {
  setFixtureVariant('app_karigar/app_version', 'malformed');
  expect(await checkVersion('0.1.5')).toMatchObject({ show: true, forced: false });
});

test('request error → nothing happens (Ionic has no error callback)', async () => {
  const previous = getTransport();
  setTransport(() => Promise.reject(new Error('offline')));
  try {
    expect(await checkVersion('0.1.5')).toEqual({ show: false });
  } finally {
    setTransport(previous);
  }
});

test('version request matches the Ionic call (empty-string body)', async () => {
  await expectContract('app_karigar/app_version', () => checkVersion('0.1.5'));
});

describe('the alert', () => {
  const deps = () => ({ openURL: jest.fn(), exitApp: jest.fn(), recheck: jest.fn() });

  function lastAlert() {
    return (showAlert as jest.Mock).mock.calls[0][0];
  }

  test('exact Ionic title, message and buttons', () => {
    presentVersionAlert({ show: true, forced: false, storeUrl: STORE }, deps());
    expect(lastAlert()).toMatchObject({
      title: 'Update Available',
      message: 'A newer version of this app is available for download. Please update it from PlayStore !',
    });
    expect(lastAlert().buttons.map((b: any) => b.text)).toEqual(['Cancel', 'Update Now']);
  });

  test('not forced: Cancel just closes, Update Now opens the store', () => {
    const d = deps();
    presentVersionAlert({ show: true, forced: false, storeUrl: STORE }, d);
    lastAlert().buttons[0].handler();
    expect(d.exitApp).not.toHaveBeenCalled();
    lastAlert().buttons[1].handler();
    expect(d.openURL).toHaveBeenCalledWith(STORE);
    expect(d.exitApp).not.toHaveBeenCalled();
    expect(lastAlert().onDidDismiss).toBeUndefined();
  });

  test('forced: both buttons exit the app, and dismissing re-runs the check', () => {
    const d = deps();
    presentVersionAlert({ show: true, forced: true, storeUrl: STORE }, d);
    lastAlert().buttons[0].handler();
    expect(d.exitApp).toHaveBeenCalledTimes(1);
    lastAlert().buttons[1].handler();
    expect(d.openURL).toHaveBeenCalledWith(STORE);
    expect(d.exitApp).toHaveBeenCalledTimes(2);
    lastAlert().onDidDismiss();
    expect(d.recheck).toHaveBeenCalled();
  });
});
