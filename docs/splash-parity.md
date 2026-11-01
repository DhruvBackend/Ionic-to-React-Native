# Splash screen parity (plan Task 8b)

The shipped app is `topsan.aab` (cordova-android 12.0.1). The plan's assumption of a JS overlay shown on first launch only is wrong. The shipped splash is the **native Android splash screen (androidx.core:core-splashscreen 1.0.0)**, shown on every cold start.

Artifacts used: `.reference/aab-full/base/**` (unzipped aab), `.reference/conv/out.apk` (aapt2 `convert` of the base module, for `aapt2 dump resources/xmltree`), `npm pack cordova-android@12.0.1` and `cordova-plugin-splashscreen@5.0.2` in `.reference/pkgs`.

## Shipped behaviour

| Item | Value | Source |
|---|---|---|
| Mechanism | `SplashScreen.installSplashScreen(this)` at the top of `CordovaActivity.onCreate`; MainActivity theme is `Theme.App.SplashScreen` | cordova-android `CordovaActivity.java:110`; aab manifest activity `com.topsan.app.MainActivity` theme `@0x7f110103` = `style/Theme.App.SplashScreen` |
| Theme | parent `Theme.SplashScreen.IconBackground`; `windowSplashScreenAnimatedIcon=@drawable/ic_cdv_splashscreen`, `windowSplashScreenAnimationDuration=200`, `windowSplashScreenBackground=@color/cdv_splashscreen_background`, `postSplashScreenTheme=@style/Theme.AppCompat.NoActionBar` | `aapt2 dump resources` on the shipped aab; template `templates/project/res/values/themes.xml` + `prepare.js updateProjectSplashScreen` |
| Background | `#FFFFFFFF` (white). `AndroidWindowSplashScreenBackground` is not set, so the template default stays | aab `color/cdv_splashscreen_background`; config.xml has no such pref |
| Icon | `resources/splash.png`, 2732x2732 palette PNG, via `AndroidWindowSplashScreenAnimatedIcon` (config.xml:48), copied as `drawable-nodpi/ic_cdv_splashscreen.png` | aab `res/drawable-nodpi-v4/ic_cdv_splashscreen.png` |
| Icon size and mask | Android 12+ (API 31+): system rules for an icon on an icon background (icon in a 240dp circle area, the image is masked to the inner 2/3 circle = about 160dp visible). Icon background colour unset (`windowSplashScreenIconBackgroundColor` not in config.xml). Android 6-11 (minSdk 22): core-splashscreen compat view, `splashScreenIconSize=240dp` (`splashscreen_icon_size_with_background`), same masking, window background = white | aab `style/Theme.SplashScreen.IconBackground`, dimens `splashscreen_icon_*` |
| Hide timing | A fixed timer: `SplashScreenPlugin.setupSplashScreen` posts `keepOnScreen=false` after **3000 ms** (`SplashScreenDelay=3000`, config.xml:21; autoHide true, config.xml:24). The timer starts when the Cordova view is created (`CordovaActivity.init()` posts `setupSplashScreen`, called from `loadUrl` in MainActivity.onCreate). It does not wait for page load, `platform.ready`, or `hide()` | `SplashScreenPlugin.java` `setupSplashScreen`; `CordovaActivity.java` `init()` |
| Fade | `setOnExitAnimationListener`: view alpha 1 to 0, **3000 ms** (`FadeSplashScreenDuration=3000`, config.xml:18; the `<30` seconds-conversion exists only in the old plugin), start delay 0, **AccelerateInterpolator**, then `provider.remove()`. The fade runs once the 3 s hold ends, so the splash is fully gone about 6 s after start (the app is visible and interactive under the fading splash) | `SplashScreenPlugin.java` `setupSplashScreen` (FadeSplashScreen=true, config.xml:25) |
| JS `splashScreen.hide()` (`app.component.ts:118`) | **No effect.** JS `navigator.splashscreen.hide()` calls service `SplashScreen` = the old plugin, which only posts `splashscreen`/`hide` to `removeSplashScreen` (nothing to remove). The new `SplashScreenPlugin.execute("hide")` is not reachable from that call and, in any case, is only honoured when `AutoHideSplashScreen=false` | `cordova-plugin-splashscreen/src/android/SplashScreen.java` `execute`; `SplashScreenPlugin.java` `execute` |
| Hide earlier or later than 3000 ms | Neither matters: hide is a no-op; the timer is fixed. If `platform.ready` is later than 3 s the splash fades away over the not-yet-ready app | as above |
| Every cold start? | Yes. `SplashShowOnlyFirstTime` is a dead pref (see below). Warm starts follow the OS (activity not recreated = no splash) | |
| Android 12+ vs older | Same Java code path. On 12+ the OS draws the window splash and the compat library hands the real `SplashScreenView` to the exit listener; on older versions the library draws its own full-screen view (`layout/splash_screen_view.xml`) | core-splashscreen 1.0.0 (`META-INF/androidx.core_core-splashscreen.version`) |

## config.xml prefs that are dead under cordova-android 12.0.1

cordova-plugin-splashscreen 5.0.2 is still in the build (class `org.apache.cordova.splashscreen.SplashScreen`, registered with `onload=true` in the aab `res/xml/config.xml`), but its dialog is only built when a drawable named by `SplashScreen` ("screen") exists. The aab has **no** `drawable*/screen*` resource (config.xml has no android `<splash>` tags), so `getSplashId()` returns 0 and `showSplashScreen` returns early. Dead:

- `SplashMaintainAspectRatio`, `SplashShowOnlyFirstTime`, `SplashScreen="screen"`, `ShowSplashScreenSpinner` (old plugin only, never reaches its dialog code)
- `ShowSplashScreen` (read by nothing)
- Live (read by `SplashScreenPlugin`): `SplashScreenDelay=3000`, `FadeSplashScreen=true`, `FadeSplashScreenDuration=3000`, `AutoHideSplashScreen=true`, and `AndroidWindowSplashScreenAnimatedIcon`.
- Only side effect of the old plugin: `pluginInitialize` makes the WebView INVISIBLE until JS calls `CoreAndroid.show` at deviceready. Not visible in RN.

## RN implementation

- `MainActivity.kt`: `installSplashScreen()` before `super.onCreate`, `setKeepOnScreenCondition` released by a 3000 ms main-looper timer, `setOnExitAnimationListener` with the same 3000 ms alpha fade, `AccelerateInterpolator`, `remove()`.
- `styles.xml`: `Theme.App.SplashScreen` (same parent and items as above); AndroidManifest sets it on MainActivity. `postSplashScreenTheme` is the RN `AppTheme` (Ionic used `Theme.AppCompat.NoActionBar`; the RN app's own theme is a separate concern).
- `android/app/build.gradle`: `androidx.core:core-splashscreen:1.0.0` (same version as shipped).
- White-label: `scripts/use-client.mjs` copies `clients/<id>/assets/splash.png` byte-identically to `android/app/src/main/res/drawable-nodpi/ic_splash.png` (fails if missing) and writes `values/splash_colors.xml` from the optional `client.json` key `splashBackground` (default `#FFFFFF`, as Cordova's template).
- `src/native/splashScreen.ts`: `hide()` is a no-op, called from `App.tsx` startup where Ionic called it (`app.component.ts:118`). No native module is needed.
- Icon file: `clients/topbath/assets/splash.png` is `resources/splash.png` of the Ionic repo (md5 89a4e908...). The aab copy differs in bytes only because aapt2 recompresses PNGs when building the bundle (same 2732x2732 palette PNG); the RN release build does the same, so the source PNG is the correct input.
- Interaction with `AppFrame` (Android 15+ band after 2 s): the band is applied at 2 s, while the splash still covers the screen (3 s hold). Same ordering as Ionic, where the class was added at 2 s under the splash.

## Still to verify on a device

Side-by-side screen recording of the Play Store app and the RN app: icon size and circular mask, white background, the 3 s hold then 3 s accelerating fade, behaviour on an Android < 12 phone/emulator image, and whether the content under the fade looks the same (the Ionic WebView background vs RN root).
