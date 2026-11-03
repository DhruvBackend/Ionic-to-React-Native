// Phase 2 kit (2026-11-03, PointLocation): Ionic pages that call the browser's window.alert() (point-location.ts:245,
// plumber-checkin.ts:240, pulmber-customer-detail.ts:306, add-new-complaint.ts:566) get cordova-android 12's native dialog
// (SystemWebChromeClient.onJsAlert -> CordovaDialogsHelper.showAlert: title "Alert", the message, Android's OK button,
// cancelable), not an Ionic alert.
import { Alert } from 'react-native';
import { webAlert } from '../src/ui/webAlert';

test('window.alert = native Android dialog titled "Alert" with OK, cancelable', () => {
  const spy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  webAlert('Geo Location not found! Try Again');
  expect(spy).toHaveBeenCalledWith('Alert', 'Geo Location not found! Try Again', [{ text: 'OK' }], { cancelable: true });
  spy.mockRestore();
});

test('the message is shown as JavaScript would stringify it', () => {
  const spy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  webAlert(undefined);
  webAlert(5);
  expect(spy.mock.calls[0][1]).toBe('undefined');
  expect(spy.mock.calls[1][1]).toBe('5');
  spy.mockRestore();
});
