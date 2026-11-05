// Native wrappers (plan Task 10). Screens import from here only. Every function returns a NativeResult and never
// throws; in MODE 'MOCK' none of them touches native code. Ionic citations: each file header.
export type { NativeFailureReason, NativeResult } from './result';
export { scanQr, type ScanOptions } from './scanner';
export { takePhoto, MOCK_PHOTO, type PhotoOptions, type PhotoSource } from './camera';
export { getPosition, MOCK_POSITION, type Position, type PositionOptions } from './location';
export { shareText } from './share';
export { openExternal } from './browser';
export { getInstalledVersion } from './appVersion';
export { reverseGeocode } from './geocode';
export { openNavigation } from './navigate';
export { uploadMultipart, type UploadOptions, type UploadResponse } from './upload';
export { onNetworkChange, getNetworkState, emitMockNetwork, type NetworkState } from './network';
export { initPushNotification, setPushProvider, type PushProvider, type PushHandlers } from './push';
export { setMockScan, setMockNativeFailure, resetMockNative, type NativeName } from './mock';
