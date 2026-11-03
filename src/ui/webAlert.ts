// The browser's window.alert() inside the Cordova app (Phase 2 kit, 2026-11-03, PointLocation).
// cordova-android 12.0.1 answers WebView alerts natively: SystemWebChromeClient.onJsAlert -> CordovaDialogsHelper.showAlert
// builds an Android AlertDialog with title "Alert", the message, Android's OK button, and cancelable(true).
// So Ionic pages that call alert('...') (point-location.ts:245, plumber-checkin.ts:240, pulmber-customer-detail.ts:306,
// add-new-complaint.ts:566) show a NATIVE dialog, not an Ionic alert. RN's Alert.alert is that same native AlertDialog.
// Screens may not call Alert.alert directly (lint); they call webAlert where Ionic called window.alert.
import { Alert } from 'react-native';

export function webAlert(message: unknown): void {
  Alert.alert('Alert', String(message), [{ text: 'OK' }], { cancelable: true });
}
