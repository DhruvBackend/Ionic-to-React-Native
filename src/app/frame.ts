// Page frame and status bar, ported from:
//   app.component.ts:117-119   statusBar.overlaysWebView(false); backgroundColorByHexString('#002d25')
//   app.component.ts:781-790   after 2 s, Android >= 15 → document.body.classList.add('android-15')
//   variables.scss:12734       body.android-15 { border-top: 30px solid black; height: 94% !important; }
// React Native here is edge-to-edge (gradle.properties edgeToEdgeEnabled=true), so the system
// status bar colour is ignored and the Ionic look is drawn explicitly.
import type { ViewStyle } from 'react-native';
import { client } from '../config/client';

export const ANDROID_15_API = 35; // Ionic checks Math.floor(device.version) >= 15
export const ANDROID_15_DELAY_MS = 2000;

export interface Frame {
  statusBand?: { height: number; color: string };
  // Below Android 15 the Ionic WebView ends above the system navigation bar; the bar itself keeps
  // the theme's default black. (To confirm against the store app on a device: plan Task 8 status.)
  navBand?: { height: number; color: string };
  frame: ViewStyle;
}

export function frameFor(
  os: string,
  apiLevel: number,
  insets: { top: number; bottom: number },
  android15Applied: boolean,
): Frame {
  if (os === 'android' && apiLevel >= ANDROID_15_API) {
    // NOTE (parity): Ionic's Android 15 workaround, including the 2-second delay before it applies.
    return android15Applied
      ? { frame: { height: '94%', borderTopWidth: 30, borderTopColor: 'black' } }
      : { frame: { flex: 1 } };
  }
  return {
    statusBand: { height: insets.top, color: client.colors.statusBar },
    navBand: { height: insets.bottom, color: '#000000' },
    frame: { flex: 1 },
  };
}
