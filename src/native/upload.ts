// Multipart file upload. Ionic: @ionic-native/file-transfer FileTransferObject.upload (cordova-plugin-file-transfer).
//
// Call sites: add-new-complaint.ts:518-533 upload(videoId, '<...>/uploadVideos.php',
//   { fileKey: 'video_upload_file', fileName: videoId, headers: {}, mimeType: 'multipart/form-data', params: {}, chunkedMode: false });
// executive-order-detail.ts:686-695 and order-detail.ts:689-698 upload(element, rootUrlSfa + 'dealerData/upload_invoice?id=..&created_type=..&created_by=..',
//   { fileKey: 'photo', fileName: 'myImage_' + random + '.jpg', chunkedMode: false, mimeType: 'image/jpeg' }).
// Pages read only data.response (a JSON string, JSON.parse'd at add-new-complaint.ts:540).
//
// NOTE (parity): cordova-plugin-file-transfer is NOT in the shipped Topbath build (topsan.aab cordova_plugins.js lists
// cordova-plugin-file but no file-transfer, and package.json has no such plugin), so in production `transfer.create()` throws
// and uploads never happen. With features.nativeUpload off (Topbath) uploadMultipart returns { ok: false, reason: 'unavailable' }
// in every mode, MOCK included. Screen porters must reproduce the production effect of that failure:
//   - add-new-complaint with a video (uploadVideo, :518): the loader stays up and the complaint is never created
//     (genrateCompliant() runs only after a successful upload).
//   - order dispatch with photos (executive-order-detail.ts:686, order-detail.ts:689): dispatch_order succeeded on the server,
//     but the code after the upload (toast, list refresh, dispatch=false) never runs.
// With the flag on it is the working version: fetch + FormData (multipart/form-data, POST), like the plugin.
import { fail, guard, ok, type NativeResult } from './result';
import { client } from '../config/client';
import { isMock, mockFailure } from './mock';

export type UploadOptions = {
  fileName?: string; // FileUploadOptions.fileName (plugin default 'image.jpg')
  headers?: Record<string, string>;
  params?: Record<string, string>;
};
export type UploadResponse = { responseCode: number; response: string };

export function uploadMultipart(
  url: string,
  fileUri: string,
  fileKey: string,
  mime: string,
  opts?: UploadOptions,
): Promise<NativeResult<UploadResponse>> {
  if (!client.features.nativeUpload) {
    return Promise.resolve(fail('unavailable', 'nativeUpload feature is off for this client'));
  }
  if (isMock()) {
    return Promise.resolve(mockFailure('upload') ?? ok({ responseCode: 200, response: '{}' }));
  }
  return guard(async () => {
    const body = new FormData();
    Object.entries(opts?.params ?? {}).forEach(([k, v]) => body.append(k, v));
    // React Native FormData file part: { uri, name, type }.
    body.append(fileKey, { uri: fileUri, name: opts?.fileName ?? 'image.jpg', type: mime } as unknown as Blob);
    // No Content-Type header: fetch adds multipart/form-data with the boundary.
    const res = await fetch(url, { method: 'POST', headers: opts?.headers, body });
    const response = await res.text();
    if (!res.ok) {
      // FileTransferError.HTTP_STATUS (code 3): a non-2xx answer rejects the plugin's promise.
      return fail('error', `HTTP ${res.status}: ${response}`);
    }
    return ok({ responseCode: res.status, response });
  });
}
