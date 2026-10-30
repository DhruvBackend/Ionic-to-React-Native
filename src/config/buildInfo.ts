// Whether debug-only test tools (deep links, component gallery) are available.
// __DEV__ alone is not enough: sideloaded test APKs bundle their JS in release mode (__DEV__ false)
// but are still debug builds. The native BuildInfo module (android BuildInfoPackage.kt) reports
// BuildConfig.DEBUG; release builds report false and never register the deep-link scheme.
import { NativeModules } from 'react-native';

export const debugToolsEnabled: boolean = __DEV__ || NativeModules.BuildInfo?.isDebugBuild === true;
