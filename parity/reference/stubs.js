/* Cordova / plugin stubs for the Ionic reference build running in desktop Chrome.
 * Injected with page.addInitScript BEFORE the app loads. Configuration is read from
 * window.__PARITY_CFG = { deviceVersion, appVersion } (set by capture.mjs in an earlier init script).
 * Nothing here talks to a network. */
(function () {
  var cfg = window.__PARITY_CFG || {};
  var noop = function () {};
  var cbOk = function (v) {
    return function () {
      var args = Array.prototype.slice.call(arguments);
      var ok = args[0];
      if (typeof ok === 'function') ok(v);
    };
  };

  window.cordova = {
    platformId: 'android',
    version: '12.0.0',
    plugins: {
      diagnostic: {
        isLocationEnabled: cbOk(true),
        isGpsLocationEnabled: cbOk(true),
        requestLocationAuthorization: cbOk('GRANTED'),
        getLocationAuthorizationStatus: cbOk('GRANTED'),
        isCameraAuthorized: cbOk(true),
        requestCameraAuthorization: cbOk('GRANTED'),
        permission: {},
        permissionStatus: { GRANTED: 'GRANTED', DENIED_ALWAYS: 'DENIED_ALWAYS' },
      },
    },
    exec: noop,
    require: noop,
    define: noop,
    fireDocumentEvent: noop,
    getAppVersion: {
      getVersionNumber: cbOk(cfg.appVersion || '0.1.5'),
      getVersionCode: cbOk('15'),
      getAppName: cbOk('Topsan'),
      getPackageName: cbOk('com.topsan.app'),
    },
    InAppBrowser: { open: noop },
  };
  // cordova-plugin-device
  window.device = {
    platform: 'Android',
    version: cfg.deviceVersion || '14',
    uuid: '0000000000000000',
    model: 'Pixel',
    manufacturer: 'Google',
    isVirtual: false,
    serial: 'unknown',
    cordova: '12.0.0',
  };
  // cordova-plugin-statusbar
  window.StatusBar = {
    overlaysWebView: noop, backgroundColorByHexString: noop, backgroundColorByName: noop,
    styleDefault: noop, styleLightContent: noop, styleBlackTranslucent: noop, styleBlackOpaque: noop,
    show: noop, hide: noop, isVisible: true,
  };
  // cordova-plugin-splashscreen
  navigator.splashscreen = { show: noop, hide: noop };
  // cordova-plugin-network-information
  window.Connection = { UNKNOWN: 'unknown', ETHERNET: 'ethernet', WIFI: 'wifi', CELL_2G: '2g', CELL_3G: '3g', CELL_4G: '4g', CELL: 'cellular', NONE: 'none' };
  try { Object.defineProperty(navigator, 'connection', { value: { type: 'wifi', effectiveType: '4g', addEventListener: noop, removeEventListener: noop }, configurable: true }); } catch (e) {}
  // cordova-plugin-ionic-keyboard
  window.Keyboard = { hide: noop, show: noop, disableScroll: noop, hideFormAccessoryBar: noop, isVisible: false, shrinkView: noop };
  // phonegap-plugin-push: init() returns an emitter that never fires
  window.PushNotification = {
    init: function () { return { on: noop, off: noop, unregister: cbOk(true), setApplicationIconBadgeNumber: cbOk(true), subscribe: cbOk(true), unsubscribe: cbOk(true) }; },
    hasPermission: cbOk({ isEnabled: true }),
  };
  window.plugins = window.plugins || {};
  window.universalLinks = { subscribe: noop };

  // Fire deviceready once the Ionic platform has registered its listener (it boots synchronously with
  // main.js; the extra fires are harmless because Ionic listens with once semantics).
  function fire() {
    var ev = document.createEvent('Event');
    ev.initEvent('deviceready', true, true);
    document.dispatchEvent(ev);
  }
  window.addEventListener('load', function () { setTimeout(fire, 200); setTimeout(fire, 1200); });
})();
