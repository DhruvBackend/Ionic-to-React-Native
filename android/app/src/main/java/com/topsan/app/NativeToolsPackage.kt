package com.topsan.app

import android.app.Activity
import android.content.ClipData
import android.content.Intent
import android.content.IntentSender
import android.location.Geocoder
import android.net.Uri
import android.util.Base64
import android.webkit.MimeTypeMap
import androidx.core.content.FileProvider
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.uimanager.ViewManager
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.api.ResolvableApiException
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.LocationSettingsRequest
import com.google.android.gms.location.LocationSettingsStatusCodes
import com.google.android.gms.location.Priority
import com.google.zxing.client.android.CaptureActivity
import com.google.zxing.client.android.Intents
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale
import java.util.concurrent.Executors

// Native pieces for src/native/*. Each one reproduces what the shipped Cordova plugin did; the plugin
// source is cited above each module (plugins downloaded to .reference/plugins, versions from
// topsan.aab base/assets/www/cordova_plugins.js).

/**
 * Barcode scanner. phonegap-plugin-barcodescanner 8.1.0 launches com.google.zxing.client.android.CaptureActivity
 * from its bundled barcodescanner-release-2.1.5.aar. That same aar is used here, so the screen (viewfinder,
 * laser line, prompt text, beep) is the shipped one. The intent is built exactly like
 * BarcodeScanner.java scan() (src/android/com/phonegap/plugins/barcodescanner/BarcodeScanner.java).
 * The CAMERA runtime permission is requested from JS before this is called (the plugin did the same at call time).
 */
class ScannerModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private var pending: Promise? = null

  private val listener: ActivityEventListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != REQUEST_CODE) return
      val promise = pending ?: return
      pending = null
      val result = Arguments.createMap()
      when (resultCode) {
        Activity.RESULT_OK -> {
          result.putString("status", "ok")
          result.putString("text", data?.getStringExtra("SCAN_RESULT") ?: "")
          result.putString("format", data?.getStringExtra("SCAN_RESULT_FORMAT") ?: "")
        }
        Activity.RESULT_CANCELED -> result.putString("status", "cancelled")
        else -> result.putString("status", "error")
      }
      promise.resolve(result)
    }
  }

  init {
    reactContext.addActivityEventListener(listener)
  }

  override fun getName() = "ScannerModule"

  // options == null mirrors scan() with no config (plugin JS passes [] and no extras are added).
  @ReactMethod
  fun scan(options: ReadableMap?, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("E_NO_ACTIVITY", "No activity")
      return
    }
    if (pending != null) {
      // barcodescanner.js: errorCallback('Scan is already in progress')
      promise.reject("E_IN_PROGRESS", "Scan is already in progress")
      return
    }
    val intent = Intent(activity.baseContext, CaptureActivity::class.java)
    intent.action = Intents.Scan.ACTION
    intent.addCategory(Intent.CATEGORY_DEFAULT)
    if (options != null) {
      // Every Integer/String entry is copied as a raw extra first (BarcodeScanner.java loop) ...
      val keys = options.keySetIterator()
      while (keys.hasNextKey()) {
        val key = keys.nextKey()
        when (options.getType(key)) {
          ReadableType.Number -> {
            val d = options.getDouble(key)
            if (d == Math.floor(d)) intent.putExtra(key, d.toInt())
          }
          ReadableType.String -> intent.putExtra(key, options.getString(key))
          else -> {}
        }
      }
      // ... then the named options, with the plugin's defaults.
      fun bool(key: String) =
        options.hasKey(key) && options.getType(key) == ReadableType.Boolean && options.getBoolean(key)
      intent.putExtra(Intents.Scan.CAMERA_ID, if (bool("preferFrontCamera")) 1 else 0)
      intent.putExtra(Intents.Scan.SHOW_FLIP_CAMERA_BUTTON, bool("showFlipCameraButton"))
      intent.putExtra(Intents.Scan.SHOW_TORCH_BUTTON, bool("showTorchButton"))
      intent.putExtra(Intents.Scan.TORCH_ON, bool("torchOn"))
      intent.putExtra(Intents.Scan.SAVE_HISTORY, bool("saveHistory"))
      intent.putExtra(Intents.Scan.BEEP_ON_SCAN, !bool("disableSuccessBeep"))
      if (options.hasKey("resultDisplayDuration")) {
        intent.putExtra(
          Intents.Scan.RESULT_DISPLAY_DURATION_MS,
          "" + options.getDouble("resultDisplayDuration").toLong(),
        )
      }
      if (options.hasKey("formats")) intent.putExtra(Intents.Scan.FORMATS, options.getString("formats"))
      if (options.hasKey("prompt")) intent.putExtra(Intents.Scan.PROMPT_MESSAGE, options.getString("prompt"))
      if (options.hasKey("orientation")) {
        intent.putExtra(Intents.Scan.ORIENTATION_LOCK, options.getString("orientation"))
      }
    }
    // avoid calling other phonegap apps (plugin comment)
    intent.setPackage(reactContext.applicationContext.packageName)
    pending = promise
    try {
      activity.startActivityForResult(intent, REQUEST_CODE)
    } catch (e: Exception) {
      pending = null
      promise.reject("E_LAUNCH", e.message, e)
    }
  }

  companion object {
    private const val REQUEST_CODE = 0xba7c
  }
}

/**
 * cordova-plugin-request-location-accuracy 2.3.0 request(REQUEST_PRIORITY_HIGH_ACCURACY): checks the device
 * location settings with setAlwaysShow(true) and, when they are not satisfied, shows Google's
 * "For better experience, turn on device location" dialog (RequestLocationAccuracy.java checkLocationSettings /
 * onResult / onActivityResult). Resolves 0 = settings satisfied, 1 = user agreed; rejects with the plugin's
 * error codes (3 cannot change, 4 user disagreed, 2 exception).
 */
class LocationAccuracyModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  private var pending: Promise? = null

  private val listener: ActivityEventListener = object : BaseActivityEventListener() {
    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
      if (requestCode != REQUEST_CHECK_SETTINGS) return
      val promise = pending ?: return
      pending = null
      when (resultCode) {
        Activity.RESULT_OK -> promise.resolve(1)
        else -> promise.reject("4", "User chose not to make required location settings changes.")
      }
    }
  }

  init {
    reactContext.addActivityEventListener(listener)
  }

  override fun getName() = "LocationAccuracyModule"

  @ReactMethod
  fun request(requestedAccuracy: Int, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("2", "No activity")
      return
    }
    // REQUEST_PRIORITY_NO_POWER=0, LOW_POWER=1, BALANCED_POWER_ACCURACY=2, HIGH_ACCURACY=3 (plugin constants)
    val priority = when (requestedAccuracy) {
      0 -> Priority.PRIORITY_PASSIVE
      1 -> Priority.PRIORITY_LOW_POWER
      2 -> Priority.PRIORITY_BALANCED_POWER_ACCURACY
      3 -> Priority.PRIORITY_HIGH_ACCURACY
      else -> {
        promise.reject("1", "'$requestedAccuracy' is not a valid accuracy constant")
        return
      }
    }
    // `new LocationRequest()` in the plugin keeps the library's default interval (1 hour).
    val request = LocationRequest.Builder(priority, 3600000L).build()
    val settings = LocationSettingsRequest.Builder().addLocationRequest(request).setAlwaysShow(true).build()
    LocationServices.getSettingsClient(activity).checkLocationSettings(settings)
      .addOnSuccessListener { promise.resolve(0) }
      .addOnFailureListener { e ->
        if (e is ResolvableApiException) {
          if (pending != null) {
            promise.reject("2", "A location accuracy request is already in progress")
            return@addOnFailureListener
          }
          pending = promise
          try {
            e.startResolutionForResult(activity, REQUEST_CHECK_SETTINGS)
          } catch (ex: IntentSender.SendIntentException) {
            pending = null
            promise.reject("3", "PendingIntent unable to execute request: " + ex.message)
          }
        } else if (e is ApiException && e.statusCode == LocationSettingsStatusCodes.SETTINGS_CHANGE_UNAVAILABLE) {
          promise.reject("3", "Location settings are inadequate, and cannot be fixed here. Dialog not created.")
        } else {
          promise.reject("2", e.message ?: "Location settings check failed")
        }
      }
  }

  companion object {
    private const val REQUEST_CHECK_SETTINGS = 0x1
  }
}

/**
 * cordova-plugin-x-socialsharing 6.0.4 share(message, subject, file, url): ACTION_SEND chooser
 * (SocialSharing.java doSendIntent). A file argument that is an http(s) URL is downloaded into
 * getExternalFilesDir(null)/socialsharing-downloads and shared through a FileProvider
 * (authority ${applicationId}.sharing.provider, like the plugin); without a file the type is text/plain.
 */
class ShareModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private val executor = Executors.newSingleThreadExecutor()

  override fun getName() = "ShareModule"

  @ReactMethod
  fun share(message: String?, file: String?, promise: Promise) {
    executor.execute {
      try {
        val send = Intent(Intent.ACTION_SEND)
        send.addFlags(Intent.FLAG_ACTIVITY_CLEAR_WHEN_TASK_RESET)
        var withFile = false
        val isData = !file.isNullOrEmpty() && file.startsWith("data:") && file.contains(";base64,")
        if (!file.isNullOrEmpty() && (file.startsWith("http") || isData)) {
          try {
            val dir = File(reactContext.getExternalFilesDir(null), "socialsharing-downloads")
            if (dir.exists()) dir.listFiles()?.forEach { it.delete() }
            dir.mkdirs()
            val target: File
            val mime: String
            if (isData) {
              // data:image/png;base64,... -> file.png (SocialSharing.java getFileUriAndSetType, "data:" branch)
              mime = file.substring(file.indexOf("data:") + 5, file.indexOf(";base64"))
              target = File(dir, "file." + mime.substringAfter("/"))
              target.writeBytes(Base64.decode(file.substring(file.indexOf(";base64,") + 8), Base64.DEFAULT))
            } else {
              val name = (Uri.parse(file).lastPathSegment ?: "file")
                .replace(Regex("[^a-zA-Z0-9._-]"), "").ifEmpty { "file" }
              target = File(dir, name)
              val conn = URL(file).openConnection() as HttpURLConnection
              conn.inputStream.use { input -> target.outputStream().use { input.copyTo(it) } }
              val ext = MimeTypeMap.getFileExtensionFromUrl(file)
              mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext.lowercase(Locale.ROOT)) ?: "image/*"
            }
            val uri = FileProvider.getUriForFile(reactContext, reactContext.packageName + ".sharing.provider", target)
            send.type = mime
            send.putExtra(Intent.EXTRA_STREAM, uri)
            send.clipData = ClipData.newRawUri("", uri)
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            withFile = true
          } catch (e: Exception) {
            // Like the plugin: getFileUriAndSetType had already set the type to image/* before the download failed, and the
            // chooser still opens with the text only (that type is kept, not reset to text/plain).
            send.type = "image/*"
          }
        }
        if (!withFile && send.type == null) send.type = "text/plain"
        if (!message.isNullOrEmpty()) send.putExtra(Intent.EXTRA_TEXT, message)
        send.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        val chooser = Intent.createChooser(send, null)
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactContext.startActivity(chooser)
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("E_SHARE", e.message, e)
      }
    }
  }
}

/**
 * Reverse geocode through android.location.Geocoder (replaces cordova-plugin-nativegeocoder, which the
 * shipped build does not contain; only reachable when client.features.nativeGeocode is on).
 * Resolves the first address's parts in the plugin's key order.
 */
class ReverseGeocodeModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {
  private val executor = Executors.newSingleThreadExecutor()

  override fun getName() = "ReverseGeocodeModule"

  @ReactMethod
  fun reverse(lat: Double, lng: Double, promise: Promise) {
    executor.execute {
      try {
        @Suppress("DEPRECATION")
        val list = Geocoder(reactContext, Locale.getDefault()).getFromLocation(lat, lng, 5)
        val a = list?.firstOrNull()
        if (a == null) {
          promise.reject("E_NONE", "No address found")
          return@execute
        }
        val parts = Arguments.createArray()
        listOf(
          a.countryCode, a.countryName, a.postalCode, a.adminArea, a.subAdminArea,
          a.locality, a.subLocality, a.thoroughfare, a.subThoroughfare,
        ).forEach { parts.pushString(it ?: "") }
        promise.resolve(parts)
      } catch (e: Exception) {
        promise.reject("E_GEOCODE", e.message, e)
      }
    }
  }
}

class NativeToolsPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
    listOf(
      ScannerModule(context),
      CameraModule(context),
      LocationAccuracyModule(context),
      ShareModule(context),
      ReverseGeocodeModule(context),
    )

  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
