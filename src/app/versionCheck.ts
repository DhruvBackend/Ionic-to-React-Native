// Ported from: src/app/app.component.ts:778-842 (onCheckAppCurrentVersionHandler).
// Runs on every launch: if the server's app_version differs from the installed version, show the
// Ionic "Update Available" alert; play_console_flag == 1 makes it forced (both buttons exit).
import { BackHandler, Linking } from 'react-native';
import { db } from '../api/client';
import { client } from '../config/client';
import { showAlert } from '../ui/overlays';

export type VersionResult = { show: false } | { show: true; forced: boolean; storeUrl: string };

// Ionic window.open('market://details?id=com.topsan.app&hl=en', '_system').
export const storeUrl = () => `market://details?id=${client.playStoreId}&hl=en`;

// The installed versionName. Gradle sets it from the same client.json value (android/client.properties),
// so this equals what Ionic's AppVersion.getVersionNumber() reads from the package.
export const installedVersion = () => client.versionName;

export async function checkVersion(installed: string): Promise<VersionResult> {
  let resp: any;
  try {
    resp = await db.onPostRequestDataFromApi('', 'app_karigar/app_version', db.rootUrl);
  } catch {
    return { show: false }; // Ionic has no error callback here
  }
  // NOTE (parity): loose != as in Ionic; a missing app_version (undefined) also shows the alert.
  // eslint-disable-next-line eqeqeq
  if (installed != resp?.app_version) {
    // eslint-disable-next-line eqeqeq
    return { show: true, forced: resp?.play_console_flag == 1, storeUrl: storeUrl() };
  }
  return { show: false };
}

interface Deps {
  openURL(url: string): void;
  exitApp(): void;
  recheck(): void;
}

const defaultDeps: Deps = {
  openURL: url => {
    Linking.openURL(url).catch(() => {});
  },
  exitApp: () => BackHandler.exitApp(),
  recheck: () => {
    runVersionCheck();
  },
};

export function presentVersionAlert(result: Extract<VersionResult, { show: true }>, deps: Deps = defaultDeps) {
  showAlert({
    title: 'Update Available',
    message: 'A newer version of this app is available for download. Please update it from PlayStore !',
    buttons: [
      {
        text: 'Cancel',
        handler: () => {
          if (result.forced) {
            deps.exitApp();
          }
        },
      },
      {
        text: 'Update Now',
        handler: () => {
          deps.openURL(result.storeUrl);
          if (result.forced) {
            deps.exitApp();
          }
        },
      },
    ],
    ...(result.forced ? { onDidDismiss: () => deps.recheck() } : {}),
  });
}

export async function runVersionCheck(): Promise<void> {
  const result = await checkVersion(installedVersion());
  if (result.show) {
    presentVersionAlert(result);
  }
}
