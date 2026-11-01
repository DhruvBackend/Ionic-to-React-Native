// Take a photo / pick from the gallery. Ionic: @ionic-native/camera -> cordova-plugin-camera 7.0.0.
//
// getPicture call sites (src/pages): add-new-complaint.ts:322,343; customeradd.ts:187,345,403,421,541,558; dealer-profile.ts:247,266;
// edit-profile.ts:148,165; executive-order-detail.ts:770,785; login-section/registration/registration.ts:334,349,407,425,548,565;
// order-detail.ts:773,788; plumber-add/plumber-add.ts:183,198,256,274,372,389; profile.ts:234,253;
// sales-app/end-checkin/end-checkin.ts:278,326; task-close.ts:109,127. All of them pass:
//   camera : { quality: 70, destinationType: DATA_URL, targetWidth: 500, targetHeight: 400 }   (add-new-complaint: quality 100, 1000 x 1000)
//   gallery: { quality: 70, destinationType: DATA_URL, sourceType: PHOTOLIBRARY, saveToPhotoAlbum: false }   (no resize)
// and never set sourceType for the camera (default CAMERA), encodingType (JPEG), mediaType (PICTURE), allowEdit (false),
// correctOrientation (false) or cameraDirection. The page prefixes 'data:image/jpeg;base64,' to the plugin's base64 string;
// this wrapper returns that data URL ready-made. Error callbacks are empty or log, so a failure just does nothing.
//
// Not react-native-image-picker: the plugin opens the ACTION_GET_CONTENT "Get Picture" chooser (not the photo picker), writes the
// camera photo through ACTION_IMAGE_CAPTURE + EXTRA_OUTPUT, and decodes/scales/re-encodes the picture itself (no EXIF rotation,
// always JPEG at `quality`). CameraModule (android CameraModule.kt) ports CameraLauncher.java for exactly this combination.
//
// Permissions, asked at call time like the plugin (CameraLauncher.java getPermissions l.225-250, callTakePicture l.277-319):
//   gallery: API 33+ READ_MEDIA_IMAGES; API 32 and below READ_EXTERNAL_STORAGE + WRITE_EXTERNAL_STORAGE together.
//   camera : CAMERA (CAMERA is declared in the manifest), plus the two storage permissions below API 29 (no scoped storage).
// Any denial ends in the plugin's error callback (here { ok: false, reason: 'denied' }).
import { NativeModules, PermissionsAndroid, Platform, type Permission } from 'react-native';
import { ensurePermissions } from './permissions';
import { fail, guard, ok, type NativeResult } from './result';
import { isMock, mockFailure } from './mock';

export type PhotoSource = 'camera' | 'gallery';
export type PhotoOptions = { quality: number; maxWidth?: number; maxHeight?: number };

// 1x1 white JPEG.
export const MOCK_PHOTO =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

const storagePermissions = (): Permission[] =>
  Number(Platform.Version) >= 33
    ? ['android.permission.READ_MEDIA_IMAGES']
    : ['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE'];

const permissionsFor = (source: PhotoSource): Permission[] =>
  source === 'gallery'
    ? storagePermissions()
    : Number(Platform.Version) >= 29
      ? [PermissionsAndroid.PERMISSIONS.CAMERA]
      : [PermissionsAndroid.PERMISSIONS.CAMERA, ...storagePermissions()];

type NativePicture = { status: 'ok' | 'cancelled' | 'unavailable' | 'error'; data?: string; message?: string };

export function takePhoto(source: PhotoSource, opts: PhotoOptions): Promise<NativeResult<string>> {
  if (isMock()) {
    return Promise.resolve(mockFailure('camera') ?? ok(MOCK_PHOTO));
  }
  return guard(async () => {
    if (Platform.OS !== 'android' || !NativeModules.CameraModule) {
      return fail('unavailable', 'camera wrapper is Android only');
    }
    if (!(await ensurePermissions(permissionsFor(source)))) {
      return fail('denied', 'permission denied');
    }
    // targetWidth/targetHeight 0 = not set (plugin: < 1 becomes -1).
    const r: NativePicture = await NativeModules.CameraModule.getPicture(
      source,
      opts.quality,
      opts.maxWidth ?? 0,
      opts.maxHeight ?? 0,
    );
    if (r.status === 'ok' && r.data !== undefined) {
      // The pages prepend this literal whatever the picked file is.
      return ok(`data:image/jpeg;base64,${r.data}`);
    }
    return fail(r.status === 'ok' ? 'error' : r.status, r.message);
  });
}
