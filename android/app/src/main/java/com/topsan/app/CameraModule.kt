package com.topsan.app

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.provider.MediaStore
import android.util.Base64
import android.webkit.MimeTypeMap
import androidx.core.content.FileProvider
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.Executors

/**
 * Port of cordova-plugin-camera 7.0.0 CameraLauncher.java for the only combination the Ionic pages use:
 * destinationType DATA_URL, encodingType JPEG, mediaType PICTURE, allowEdit false, correctOrientation false,
 * saveToPhotoAlbum false, cameraDirection default. Source: .reference/plugins/cordova-plugin-camera-7.0.0/.../CameraLauncher.java
 *  - camera: MediaStore.ACTION_IMAGE_CAPTURE with EXTRA_OUTPUT = FileProvider uri of cache/.Pic.jpg (takePicture, l.321-355)
 *  - gallery: ACTION_GET_CONTENT, type "image" wildcard, CATEGORY_OPENABLE, Intent.createChooser(.., "Get Picture") (getImage, l.395-441)
 *  - result: getScaledAndRotatedBitmap (l.980-1150) + calculateAspectRatio/calculateSampleSize (l.1154-1210),
 *    then processPicture: Bitmap.compress(JPEG, quality) -> Base64.NO_WRAP (l.1300-1320). No rotation (correctOrientation
 *    false) and no EXIF is read or written for DATA_URL.
 *  - a gallery file whose mime type is not jpeg/png/heic (a GIF, or an unknown type) is NOT decoded: the plugin returns its
 *    path/uri string unchanged (processResultFromGallery, isImageMimeTypeProcessable l.800-830, 975-985).
 * Runtime permissions are asked by src/native/camera.ts exactly where the plugin asked (getPermissions l.225-250 and
 * callTakePicture l.277-319).
 *
 * NOTE (parity): not copied on purpose: checkForDuplicateImage (l.1255-1280), which after the chooser starts deletes the newest
 * MediaStore image when the image count differs from a stale counter by 1. It is a device-specific workaround for cameras that
 * add a second copy; copying it could delete a user's photo, and it is invisible in the app.
 */
class CameraModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private var pending: Promise? = null
  private var quality = 50
  private var targetWidth = -1
  private var targetHeight = -1
  private var imageFile: File? = null
  private val executor = Executors.newSingleThreadExecutor()

  private val listener: ActivityEventListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != REQUEST_CAMERA && requestCode != REQUEST_GALLERY) return
      val promise = pending ?: return
      pending = null
      if (requestCode == REQUEST_CAMERA) {
        when (resultCode) {
          Activity.RESULT_OK -> executor.execute { finishCamera(promise, data) }
          Activity.RESULT_CANCELED -> fail(promise, "cancelled", "No Image Selected")
          else -> fail(promise, "error", "Did not complete!")
        }
      } else {
        when {
          resultCode == Activity.RESULT_OK && data != null -> executor.execute { finishGallery(promise, data) }
          resultCode == Activity.RESULT_CANCELED -> fail(promise, "cancelled", "No Image Selected")
          else -> fail(promise, "error", "Selection did not complete!")
        }
      }
    }
  }

  init {
    reactContext.addActivityEventListener(listener)
  }

  override fun getName() = "CameraModule"

  // source: "camera" | "gallery". width/height 0 = not set (plugin: targetWidth < 1 -> -1).
  @ReactMethod
  fun getPicture(source: String, quality: Int, width: Int, height: Int, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      fail(promise, "error", "No activity")
      return
    }
    if (pending != null) {
      fail(promise, "error", "A picture request is already in progress")
      return
    }
    this.quality = quality
    targetWidth = if (width < 1) -1 else width
    targetHeight = if (height < 1) -1 else height
    try {
      if (source == "camera") {
        val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        val photo = File(reactContext.cacheDir, ".Pic.jpg")
        imageFile = photo
        val uri = FileProvider.getUriForFile(reactContext, reactContext.packageName + ".sharing.provider", photo)
        intent.putExtra(MediaStore.EXTRA_OUTPUT, uri)
        intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
        if (intent.resolveActivity(reactContext.packageManager) == null) {
          // NOTE (parity): the plugin only logged "You don't have a default camera" here and never answered its callback.
          fail(promise, "unavailable", "No camera app")
          return
        }
        pending = promise
        activity.startActivityForResult(intent, REQUEST_CAMERA)
      } else {
        val intent = Intent()
        intent.type = "image/*"
        intent.action = Intent.ACTION_GET_CONTENT
        intent.addCategory(Intent.CATEGORY_OPENABLE)
        pending = promise
        activity.startActivityForResult(Intent.createChooser(intent, "Get Picture"), REQUEST_GALLERY)
      }
    } catch (e: Exception) {
      pending = null
      fail(promise, "error", e.message ?: "launch failed")
    }
  }

  private fun fail(promise: Promise, status: String, message: String) {
    val r = Arguments.createMap()
    r.putString("status", status)
    r.putString("message", message)
    promise.resolve(r)
  }

  private fun success(promise: Promise, data: String) {
    val r = Arguments.createMap()
    r.putString("status", "ok")
    r.putString("data", data)
    promise.resolve(r)
  }

  // processResultFromCamera, DATA_URL branch.
  private fun finishCamera(promise: Promise, data: Intent?) {
    val file = imageFile
    try {
      var bitmap = if (file != null) scaledBitmap(file.absolutePath) else null
      if (bitmap == null) {
        // "Try to get the bitmap from intent."
        @Suppress("DEPRECATION")
        bitmap = data?.extras?.get("data") as? Bitmap
      }
      if (bitmap == null) {
        fail(promise, "error", "Unable to create bitmap!")
        return
      }
      encode(promise, bitmap)
    } catch (e: Exception) {
      fail(promise, "error", "Error capturing image: " + e.localizedMessage)
    } finally {
      file?.delete() // cleanup(): the camera-written temp file
    }
  }

  // processResultFromGallery, DATA_URL branch.
  private fun finishGallery(promise: Promise, intent: Intent) {
    val uri = intent.data
    if (uri == null) {
      fail(promise, "error", "null data from photo library")
      return
    }
    val uriString = uri.toString()
    val mime = mimeType(uriString)
    val processable = mime != null &&
      (mime.equals("image/jpeg", true) || mime.equals("image/png", true) || mime.equals("image/heic", true))
    if (!processable) {
      // NOTE (parity): the plugin hands back the location string (real path, or the uri when there is none) instead of image data.
      // Real-path lookup (FileHelper.getRealPathFromURI) is not ported; the content uri is returned.
      success(promise, uriString)
      return
    }
    val bitmap = try {
      scaledBitmap(uriString)
    } catch (e: Exception) {
      null
    }
    if (bitmap == null) {
      fail(promise, "error", "Unable to create bitmap!")
      return
    }
    encode(promise, bitmap)
    bitmap.recycle()
  }

  // FileHelper.getMimeType: content uris ask the resolver, everything else uses the file extension.
  private fun mimeType(uriString: String): String? {
    val uri = android.net.Uri.parse(uriString)
    return if ("content" == uri.scheme) {
      reactContext.contentResolver.getType(uri)
    } else {
      MimeTypeMap.getSingleton().getMimeTypeFromExtension(MimeTypeMap.getFileExtensionFromUrl(uri.path ?: "").lowercase(Locale.ROOT))
    }
  }

  // processPicture: Bitmap.compress(JPEG, quality) -> Base64.NO_WRAP.
  private fun encode(promise: Promise, bitmap: Bitmap) {
    try {
      val out = ByteArrayOutputStream()
      if (bitmap.compress(Bitmap.CompressFormat.JPEG, quality, out)) {
        success(promise, String(Base64.encode(out.toByteArray(), Base64.NO_WRAP)))
      }
    } catch (e: Exception) {
      fail(promise, "error", "Error compressing image: " + e.localizedMessage)
    }
  }

  private fun open(location: String): InputStream? {
    val uri = android.net.Uri.parse(location)
    return when (uri.scheme) {
      "content" -> reactContext.contentResolver.openInputStream(uri)
      "file" -> FileInputStream(File(uri.path!!))
      else -> FileInputStream(File(location))
    }
  }

  // getScaledAndRotatedBitmap with correctOrientation == false (rotate stays 0).
  private fun scaledBitmap(location: String): Bitmap? {
    if (targetWidth <= 0 && targetHeight <= 0) {
      return try {
        open(location)?.use { BitmapFactory.decodeStream(it) }
      } catch (e: Throwable) {
        null
      }
    }
    // Copy to a temp file first (the plugin does this to read size/orientation of any provider's stream), then delete it.
    val stamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
    val local = File(reactContext.cacheDir, "IMG_$stamp.jpg")
    try {
      val src = open(location) ?: return null
      src.use { input -> local.outputStream().use { input.copyTo(it) } }
      val options = BitmapFactory.Options()
      options.inJustDecodeBounds = true
      FileInputStream(local).use { BitmapFactory.decodeStream(it, null, options) }
      if (options.outWidth == 0 || options.outHeight == 0) return null
      val size = calculateAspectRatio(options.outWidth, options.outHeight)
      options.inJustDecodeBounds = false
      options.inSampleSize = calculateSampleSize(options.outWidth, options.outHeight, size[0], size[1])
      val unscaled = FileInputStream(local).use { BitmapFactory.decodeStream(it, null, options) } ?: return null
      val scaled = Bitmap.createScaledBitmap(unscaled, size[0], size[1], true)
      if (scaled !== unscaled) unscaled.recycle()
      return scaled
    } catch (e: Exception) {
      return null
    } finally {
      local.delete()
    }
  }

  // calculateAspectRatio (l.1154-1190): fit inside the target box keeping the aspect ratio (integer maths as the plugin).
  private fun calculateAspectRatio(origWidth: Int, origHeight: Int): IntArray {
    var newWidth = targetWidth
    var newHeight = targetHeight
    if (newWidth <= 0 && newHeight <= 0) {
      newWidth = origWidth
      newHeight = origHeight
    } else if (newWidth > 0 && newHeight <= 0) {
      newHeight = ((newWidth / origWidth.toDouble()) * origHeight).toInt()
    } else if (newWidth <= 0 && newHeight > 0) {
      newWidth = ((newHeight / origHeight.toDouble()) * origWidth).toInt()
    } else {
      val newRatio = newWidth / newHeight.toDouble()
      val origRatio = origWidth / origHeight.toDouble()
      if (origRatio > newRatio) {
        newHeight = (newWidth * origHeight) / origWidth
      } else if (origRatio < newRatio) {
        newWidth = (newHeight * origWidth) / origHeight
      }
    }
    return intArrayOf(newWidth, newHeight)
  }

  // calculateSampleSize (l.1200-1215)
  private fun calculateSampleSize(srcWidth: Int, srcHeight: Int, dstWidth: Int, dstHeight: Int): Int {
    val srcAspect = srcWidth.toFloat() / srcHeight.toFloat()
    val dstAspect = dstWidth.toFloat() / dstHeight.toFloat()
    return if (srcAspect > dstAspect) srcWidth / dstWidth else srcHeight / dstHeight
  }

  companion object {
    private const val REQUEST_CAMERA = 0xca01
    private const val REQUEST_GALLERY = 0xca02
  }
}
