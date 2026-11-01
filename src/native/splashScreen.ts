// Ionic app.component.ts:118 calls splashScreen.hide() in platform.ready (cordova-plugin-splashscreen 5.0.2).
// Under the shipped cordova-android 12.0.1 that call does nothing visible: the old plugin only posts a message that
// removes its own dialog (never shown, there is no "screen" drawable), and SplashScreenPlugin.execute("hide") is only
// honoured when AutoHideSplashScreen=false (config.xml:24 is true). The native splash is hidden by a fixed
// 3000 ms timer in MainActivity.kt. So this is intentionally a no-op kept for call-site parity.
// See docs/splash-parity.md.
export const splashScreen = {
  hide(): void {
    // NOTE (parity): no-op, like the shipped app.
  },
};
