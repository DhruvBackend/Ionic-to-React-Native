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
`adb shell am start -a VIEW -d '<link>' com.topsan.app.rn`, waits for the screen root (`readyId`, default `ion-card-<screen>`) in `uiautomator dump`, then `rnWaitMs` (default 2.5 s; covers the
2 s Android-15 delay), then `adb exec-out screencap -p`. No device (or several without `-s`) prints
"SKIPPED RN capture: <why>" and exits 0. The debug app must already be installed.

Crop and scale: the reference is only the WebView content (1080x2400, no system bars). A phone screenshot also shows the
system bars, so:
- API < 35: `src/app/frame.ts` draws a status band and nav band; the top (and nav) inset read from `dumpsys window`
  (fallback 24 dp top, 0 bottom) is cropped.
- API >= 35: Ionic's `body.android-15` black 30px top border covers the status area and RN reproduces it; nothing is
  cropped. Give such states `"deviceVersion": "15"` so the reference has the same border.
- The result is bilinearly scaled to 1080x2400. Devices with a different aspect ratio will show scaling differences in the
  diff; use a 1080x2400 (20:9) device or emulator for exact comparisons.
