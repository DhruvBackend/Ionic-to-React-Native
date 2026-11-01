package com.topsan.app

import android.app.Activity
import android.app.Application
import android.os.Build
import android.os.Bundle
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          add(BuildInfoPackage())
          add(NativeToolsPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    registerActivityLifecycleCallbacks(LegacyFullscreenScanner)
  }
}

// NOTE (parity): the shipped app targets SDK 34, so on Android 15+ the ZXing CaptureActivity
// (Theme.NoTitleBar.Fullscreen) still hides the status bar and lays out above the navigation bar
// and display cutout. This app targets SDK 36, where edge-to-edge is enforced: the status bar
// showed over the camera and the "Place a barcode..." status text sat under the navigation bar
// (seen on the Android 16 emulator, 2026-11-01). Keep that one activity's content clear of the navigation bar and
// cutout, as under SDK 34. Hiding the status bar via WindowInsetsController had no effect on the emulator, so the
// status bar still shows over the camera; compare with the Play Store app on a real Android 15+ phone (plan Task 10).
private object LegacyFullscreenScanner : Application.ActivityLifecycleCallbacks {
  private const val CAPTURE = "com.google.zxing.client.android.CaptureActivity"

  override fun onActivityPostCreated(activity: Activity, savedInstanceState: Bundle?) {
    if (Build.VERSION.SDK_INT < 35 || activity.javaClass.name != CAPTURE) return
    val content = activity.findViewById<View>(android.R.id.content)
    ViewCompat.setOnApplyWindowInsetsListener(content) { v, insets ->
      val bars = insets.getInsets(WindowInsetsCompat.Type.navigationBars() or WindowInsetsCompat.Type.displayCutout())
      v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
      insets
    }
    ViewCompat.requestApplyInsets(content)
  }

  override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) = Unit
  override fun onActivityStarted(activity: Activity) = Unit
  override fun onActivityResumed(activity: Activity) = Unit
  override fun onActivityPaused(activity: Activity) = Unit
  override fun onActivityStopped(activity: Activity) = Unit
  override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit
  override fun onActivityDestroyed(activity: Activity) = Unit
}
