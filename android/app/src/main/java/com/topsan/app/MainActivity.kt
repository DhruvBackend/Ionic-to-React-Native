package com.topsan.app

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.animation.AccelerateInterpolator
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  // Splash screen, ported from cordova-android 12.0.1 SplashScreenPlugin.java with the shipped config.xml
  // (AutoHideSplashScreen=true, SplashScreenDelay=3000, FadeSplashScreen=true, FadeSplashScreenDuration=3000).
  // See docs/splash-parity.md.
  private var keepSplashOnScreen = true

  override fun onCreate(savedInstanceState: Bundle?) {
    val splashScreen = installSplashScreen() // CordovaActivity.java:110, before super.onCreate
    splashScreen.setKeepOnScreenCondition { keepSplashOnScreen }
    // SplashScreenPlugin.java setupSplashScreen: fixed delay from start-up. NOTE (parity): JS splashScreen.hide()
    // never ends it early (autoHide is true), and neither does the app being ready.
    Handler(Looper.getMainLooper()).postDelayed({ keepSplashOnScreen = false }, SPLASH_DELAY_MS)
    splashScreen.setOnExitAnimationListener { provider ->
      provider.view
          .animate()
          .alpha(0.0f)
          .setDuration(SPLASH_FADE_MS)
          .setStartDelay(0)
          .setInterpolator(AccelerateInterpolator())
          .setListener(
              object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                  provider.remove()
                }
              })
          .start()
    }
    super.onCreate(savedInstanceState)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "TopbathRN"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  companion object {
    private const val SPLASH_DELAY_MS = 3000L // config.xml:21 SplashScreenDelay
    private const val SPLASH_FADE_MS = 3000L // config.xml:18 FadeSplashScreenDuration
  }
}
