# Visual-parity harness

Compares the Ionic reference (built from `b33d82f`, run in Chrome) with the RN debug app on a device.

| Step | Command | Output |
| --- | --- | --- |
| Build the Ionic reference once | `bash parity/reference/build-ionic.sh` (see `reference/build-ionic.md`) | `parity/reference/work/www` |
| Reference screenshots | `npm run parity:ref -- [--only <id>]` | `parity/out/ref/<id>.png` |
| RN screenshots | `npm run parity:rn -- [--only <id>] [-s <serial>]` (or `ANDROID_SERIAL`) | `parity/out/rn/<id>.png` |
| Report | `npm run parity:report` | `parity/out/report.html` (ref, rn, diff, diff %) |
| Sign off | `node parity/signoff.mjs <id> ok\|fail "<note>"` | `parity/signoff.json` (committed) |
| Harness tests | `npm run parity:test` | |

`--only` takes an exact id or a prefix ending in `.` or `*` (for example `_components.`).

## States
`parity/states.json` plus every `parity/states.d/*.json` (arrays). Entry:
`{ id, screen, role, lang, variants: {"<endpoint>": "<variant>"}, params, ionicNav }`, with optional `deviceVersion`
(Android version the Cordova device stub reports, default "14"; use "15" to get Ionic's `android-15` border),
`appVersion` (default "0.1.5"), `waitMs`, `rnWaitMs`.
`ionicNav` is a JS expression evaluated in the Ionic page with: `nav` (root NavController), `root` (MyApp instance),
`app`, `Page('Otp')` (page class by name), `ctrl('alertCtrl')` (any `*Ctrl` found on MyApp or the active page),
`injector`, `params`. Example: `nav.setRoot(Page('Otp'), params)`. The same state drives RN through the debug deep link
`topbathrn://open?screen=&role=&lang=&variant=&params=` (`src/navigation/debugLinks.ts`).

## State actions
- Ionic side: `ionicNav` (JS expression, see above). Note Ionic's TapClick cancels a bare `element.click()` until a pointer press
  has happened, so to tap a control dispatch `mousedown`, `mouseup` and `click` MouseEvents (bubbles, cancelable) on it.
- RN side: optional `rnAction: "tap:<testID>"` (plus `rnActionWaitMs`, default 1000). After the deep link and `rnWaitMs`,
  `capture-rn.mjs` runs `adb shell uiautomator dump`, finds the node whose `resource-id` is the testID (RN sets the Android
  resource-id from `testID`, a package prefix `...:id/` is accepted), taps its centre with `adb shell input tap`, waits,
  then takes the screenshot. A missing element fails that state. Only states reachable in production get a parity state.

## Reference side (Playwright + Chrome)
- Uses the installed Chrome (`channel: 'chrome'`, falling back to `C:\Program Files\Google\Chrome\...`); no browser download.
- Chrome 360x800, DPR 3, Android UA, locale en-IN. `stubs.js` fakes Cordova plus device, status bar, splash, network,
  keyboard, app-version and push; `deviceready` is fired after load.
- `role` states: `userStorageData` is seeded into Ionic storage (IndexedDB `_ionicstorage`/`_ionickv`) from
  `src/api/fixtures/_sessions.json` (`{ "<Role>": <userStorageData> }`). TODO: that file is created in Task 12; until
  then only `role: null` can be captured and other states print "no reference".
- Network: every request to `apps.abacusdesk.com` and `devcrm.abacusdesk.com` is answered from `src/api/fixtures`
  (server prefix and endpoint parsed like `dbservice.ts`; the state's `variants` pick the variant). Images from those hosts
  get a 1x1 placeholder. Endpoints with no fixture get a 404 `{}`. Any other host is aborted (Google Maps) except
  `fonts.googleapis.com`, whose CSS is replaced by local @font-face rules using the RN app's bundled Roboto and Material Icons
  TTFs. Every blocked/unfixtured request is logged to `parity/out/blocked-requests.log`. Nothing reaches a real server.

## RN side (adb instead of Maestro)
Deviation from the plan: no Maestro (global tool, not installed). `capture-rn.mjs` runs
`adb shell am start -a VIEW -d '<link>' com.topsan.app.rn`, waits for the screen root (`readyId`, default `ion-card-<screen>`) in `uiautomator dump`, then `rnWaitMs` (default 5.5 s: the native splash can still cover the page after its root exists, and the
2 s Android-15 delay), then `adb exec-out screencap -p`. No device (or several without `-s`) prints
"SKIPPED RN capture: <why>" and exits 0. The debug app must already be installed.

Crop and scale: the reference is only the WebView content (1080x2400, no system bars). A phone screenshot also shows the
system bars, so:
- API < 35: `src/app/frame.ts` draws a status band and nav band; the top (and nav) inset read from `dumpsys window`
  (fallback 24 dp top, 0 bottom) is cropped.
- API >= 35: Ionic's `body.android-15` black 30px top border covers the status area and RN reproduces it; nothing is
  cropped. Rule: states captured against an API >= 35 device/emulator (the Android 16 emulator) carry `"deviceVersion": "15"` so the reference gets the same border; give such states `"deviceVersion": "15"` so the reference has the same border.
- The result is bilinearly scaled to 1080x2400. Devices with a different aspect ratio will show scaling differences in the
  diff; use a 1080x2400 (20:9) device or emulator for exact comparisons.

## Component parity states (`_components.*`, plan Task 9 step 6)
`parity/states.d/_components.json`: one state per kit replica variant, each rendering the SAME component with the SAME inputs on both sides
in isolation, so a diff is about the component and not about a screen.
- Ionic side: the harness-only page `ParityGalleryPage` (`parity/reference/gallery/parity-gallery.{ts.txt,html,scss}`, plus the module).
  `bash parity/reference/build-ionic.sh` copies it into the git-ignored work copy through `parity/reference/install-gallery.js` and patches
  the work copy's `app.module.ts` (nothing is ever written to the Ionic source). `SKIP_INSTALL=1` reuses `work/node_modules` when only the
  gallery changed. The page reads `navParams.get('id')`. Overlay ids call the real controllers with the options the Topbath pages pass
  (cited per entry in `parity-gallery.ts.txt`) from `ionViewDidEnter` inside NgZone. State `ionicNav` is
  `nav.setRoot(Page('ParityGallery'), params)`, or for navbars a two-page `nav.setPages([...])` so the back button shows.
- RN side: the debug-only route `_ComponentState` (`src/dev/ComponentState.tsx`, registry `src/dev/componentStates.tsx`), deep link
  `topbathrn://open?screen=_ComponentState&params={"id":"alert-plain"}`; its root is IonStack's `ion-card-_ComponentState`.
  `select-open` and `datetime-open` use `rnAction: tap:<testID>-cover` (the kit has no imperative open for them).
- `__tests__/componentStates.test.tsx` fails when the state file, the RN registry and the Ionic page disagree on the id list.
- Determinism: no autoplay (slides), toasts and loaders have no `duration` (Topbath passes 3000 for toasts), every CSS animation on the
  Ionic side is paused at its first frame (`parity-gallery.scss`), no input is focused (no caret blink). RN spinners cannot be frozen, so the
  spinner phase differs in `loading-default` and `infinite-scroll` (expected).
- Not covered on purpose: refresher (pull gesture), `WebEmbed` (network iframe), `navbar menuToggle` (no Topbath template uses it and
  Ionic hides the button without an `ion-menu`).
