package com.topsan.app

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.uimanager.ViewManager

// Tells JS whether this APK is a debug build. Sideloaded test APKs (-PbundleDebugJs) bundle their JS
// in release mode, so __DEV__ is false there; the debug-only test tools (deep links, component
// gallery) use this instead. Release builds report false. See src/config/buildInfo.ts.
class BuildInfoModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "BuildInfo"

  // versionName is what cordova-plugin-app-version 0.1.9 getVersionNumber() returned (PackageInfo.versionName).
  override fun getConstants(): Map<String, Any> =
    mapOf(
      "isDebugBuild" to BuildConfig.DEBUG,
      "versionName" to (
        reactApplicationContext.packageManager
          .getPackageInfo(reactApplicationContext.packageName, 0).versionName ?: ""
        ),
    )
}

class BuildInfoPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
    listOf(BuildInfoModule(context))

  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
