// Installed version. Ionic: appVersion.getVersionNumber() (cordova-plugin-app-version 0.1.9) at app.component.ts:798,
// compared with the server's app_version. The plugin returns PackageInfo.versionName, so does BuildInfoModule's
// `versionName` constant. Never rejects: when the native value is missing (Jest, MOCK) the client.json versionName is
// returned, which Gradle writes into versionName anyway (android/client.properties).
import { NativeModules } from 'react-native';
import { client } from '../config/client';
import { isMock } from './mock';

export async function getInstalledVersion(): Promise<string> {
  if (isMock()) {
    return client.versionName;
  }
  const v = NativeModules.BuildInfo?.versionName;
  return typeof v === 'string' && v !== '' ? v : client.versionName;
}
