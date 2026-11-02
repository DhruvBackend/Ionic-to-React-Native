# Handoff: Topbath Ionic → React Native migration

*Written 2026-11-03 (4 am) to start **Phase 2** in a fresh session. Read this file first, then the plan.*

## Who and what

- **User:** Dhruv, an AI developer at Basiq360/Abacusdesk. His job is only the migration; a colleague owns security fixes.
- **Goal:** migrate the Topbath ("Topsan") Ionic 3.9.5 / Cordova loyalty app to React Native as an **exact 1:1 copy**: no UI or behaviour changes, quirks and bugs included. It becomes a **white-label template** for 70+ client apps.
- **RN repo:** `C:\Users\dhruv\Projects\topbath-rn`. Main branch is **`master`**.
- **Ionic repo (READ-ONLY):** `C:\Migrations\Topbath_App_loyalty`.
- **Plan:** `docs/superpowers/plans/2026-10-29-topbath-rn-migration.md`.
  - Global Constraints are at the top.
  - The "S-task" per-screen procedure (S1–S9, the S5 rules, the interaction check) is in the middle.
  - Phase 2 is the section "Phase 2: Core loyalty (22)".
- **Spec:** `docs/superpowers/specs/2026-10-29-topbath-rn-migration-design.md`.
- **Also:**
  - `docs/PLAYBOOK.md`: pilot lessons and safe worktree clean-up.
  - `docs/LEARNING-LOG.md`: Dhruv's interview-prep log.
  - `docs/inventory.json` / `docs/INVENTORY.md`: 117 screens.
  - `parity/README.md`: the comparison harness.

## Hard rules (Dhruv's)

1. **Push only to `origin` = github.com/DhruvBackend/Ionic-to-React-Native** (private, gh account `DhruvBackend`).
   - Never push from the Ionic repo; its origin is the COMPANY repo. "it can cost me my job".
   - Run `git remote -v` and confirm before any push. Push only when Dhruv asks.
2. **Exact 1:1 copy.** Copy Ionic's loose `==`/`!=`, loaders that stay stuck on errors, typos and dead buttons. Mark each with `// NOTE (parity)`. Copy security weaknesses unchanged with `// NOTE (security, not changed)`.
3. **The app talks to the DEV server** (`devcrm.abacusdesk.com`). Jest is forced to MOCK. **Never send anything to production** (`apps.abacusdesk.com`) without explicit approval.
4. **Use Dhruv's phone, not the emulator.**
   - Phone: OnePlus CPH2707, Android 16, adb serial `444538eb`, 360dp at density 480.
   - Debug build (for captures and tap checks; has debug links + MOCK data): `cd android && ./gradlew assembleDebug -PbundleDebugJs -PreactNativeArchitectures=armeabi-v7a,arm64-v8a -q`, then `adb -s 444538eb install -r android/app/build/outputs/apk/debug/app-debug.apk`.
   - Speed build (for judging how it feels; no debug links): `./gradlew assembleReleaseRn`. It installs as `com.topsan.app.rn` too.
   - **The Play Store app `com.topsan.app` is logged into his PRODUCTION account. Never touch it.** Never install a build whose package is plain `com.topsan.app`; check with `aapt dump badging` if unsure.
   - The USB link drops often. `adb kill-server; adb start-server` usually brings it back; otherwise ask him to replug.
   - Before captures: ask for Do Not Disturb, and set `settings put system screen_off_timeout 1800000` + `svc power stayon usb`. Restore afterwards: `screen_off_timeout 30000`, `stay_on_while_plugged_in 0`.
   - `pm clear` is blocked on this phone (SecurityException); that's harmless.
   - **Never run Gradle and an emulator together** (~15 GB RAM).
5. **After every step:** say whether the APK changed, give a plain-language summary, and add a learning-log entry (What / Learned / Interview angle).
6. **Credentials:** Dhruv types the number and OTP into the app himself, **never in chat**.
7. **Subagents:** Sonnet subagents implement and review. The lead verifies, captures on the phone, merges and talks to Dhruv.
8. **Worktrees:** delete junctions before `git worktree remove`: PowerShell `(Get-Item <wt>\node_modules).Delete(); (Get-Item <wt>\parity\reference\work).Delete()`. **Never use `--force` with junctions present:** it emptied the main node_modules once. Recovery: `npm ci`, then `bash parity/reference/build-ionic.sh`.

## Where things stand (2026-11-03)

- **Phase 0 and Phase 1: COMPLETE, signed off by Dhruv.**
  - 29 Phase 1 states are in `parity/signoff.json`.
  - **Deferred:** `Tabs.Retailer`. Its Ionic Home calls `loginBannersApp`, `product_catalogue_count` and `offerList`, which have no fixtures yet, so the reference renders blank. Re-capture it once the Phase 2 Home fixtures exist.
- **master = `549fb8d`** (before this handoff commit), clean, no worktrees.
  - jest 682/682, tsc clean, eslint 0 errors (17 old warnings), parity:test 13/13.
  - **17+ commits ahead of origin, not pushed.** Ask Dhruv whether to push.
- **Phone:** has the **releaseRn speed build** installed. Reinstall the **debug** build before any capture.
  - Dhruv confirmed the release build "feels snappier". The earlier slowness was debug mode.
  - Cold start ≈ 3.3 s = the 3 s splash copied 1:1 from Ionic `config.xml` + ~0.3 s real work.
  - Optimisation work stays in Phase 8.
- **Dhruv's phone is available from ~2:30 pm on 2026-11-03.** Until then do the non-phone parts: cards, contracts, fixtures, implementation, tests, S8 reviews, merges and Ionic reference captures.

## Harness facts learned in Phase 1 (use them)

- RN captures use debug links `topbathrn://open?screen=&role=&lang=&variant=&params=&mock=1`.
  - `mock=1` switches to the MOCK transport and **resets all fixture variants** (variants used to leak between links).
  - `parity/capture-rn.mjs` always adds `mock=1`.
  - A `tap:` step scrolls up to 6 times to find its target.
  - `rnScrollTop: true` in a state starts the capture at the top.
- The Ionic reference (Playwright) intercepts every request. An endpoint with no fixture is **never sent**, so the screen renders blank or stuck. Every endpoint a screen calls needs a fixture before its reference capture means anything.
- `uiautomator dump` goes stale while an RN overlay is open and can't see views outside their parent's bounds. Tap overlays by screen position.
- **Measure the Ionic DOM instead of guessing.** A temporary probe state in `parity/states.d/_tmp.json` (always delete it afterwards) printing computed classes or styles settled several Phase 1 misses.
- Helper scripts in `.reference/logs/` (git-ignored): `sheet3.cjs` (contact sheets), `mkprobe*.cjs` (DOM probes).
- Kit facts:
  - `androidLineHeight()` in `src/theme/ionicMdOverlays.ts` makes input line boxes match Android device-px rounding; without it text boxes swallow page scrolls.
  - `clipSafeLineBox` stops Hindi matras clipping.

## Next steps: Phase 2 (22 core loyalty screens)

Screens: Home (Plumber and Seller/Dealer variants = two state sets on one screen), MainHome, Profile, ViewProfile, PointList, PointHistory, OfferList, Offers, Terms, GiftDetail, CancelpolicyModal, CancelationPolicy, Transaction, ShippingDetail, Notification, Feedback, Pointtranfer, CoupanCode, ScanPoint, SalesPointTransfer, Super30, PointLocation.

1. **Kit pass first (on master, TDD):** decide globally on `textBreakStrategy`. Android `Text` defaults to `highQuality` (balanced paragraphs); browsers break greedily (`simple`). Only AboutusModal uses `simple` so far. Pick a kit-level way to make `simple` the default for screen text so every Phase 2 screen gets it, and record the decision in the plan.
2. **Order:** screens with the most inbound navigation first (Home, MainHome, Profile, PointList, OfferList…), so later screens can navigate to real routes. Use `docs/inventory.json` for links.
3. **Per screen, the S-task procedure:** S1 card (`node scripts/screen-card.mjs <Name>`) → S2 contracts → S3 fixtures (default, empty, malformed + status variants) → S4 failing tests → S5 implement → S6 gates → S7 commit → S8 independent Sonnet review → S9 merge.
   - Up to **3 parallel worktrees** (`git worktree add ../tb-wt-<Name> -b screen/<Name>`), each with its own implementer.
   - If a screen needs a new shared component or wrapper, it stops and reports. The lead adds it on master first.
   - On merge, regenerate shared files with `node scripts/gen-routes.mjs` and `node scripts/gen-fixtures.mjs`, then run jest (all), tsc, eslint and `npm run parity:test`.
   - Every S8 review checks the i18n risk: an Ionic module with its own `TranslateModule.forRoot` that never calls `use()` shows English.
4. **Once the Home fixtures exist:** re-capture `Tabs.Retailer` and add it to sign-off.
5. **Flow tests** (plan Phase 2): `flows/scan-redeem.test.ts` and `flows/transfer.test.ts`.
6. **When the phone is connected (~2:30 pm):** build and install the debug APK, run `npm run parity:ref -- --only <Screen>.`, `npm run parity:rn -- --only <Screen>. -s 444538eb` and `npm run parity:report`. Look at **every** pair, then tap-check every control.
7. Report to Dhruv for Phase 2 sign-off (`node parity/signoff.mjs <id> ok "<note>"`). Update the plan status and the learning log.

## Open items and decisions

- **Fleet automation for the other ~50 client apps:** a drift scanner, client importer, fleet build and auto-compare. Needs 2–3 other client Ionic repos from Dhruv. Not started. Estimate given: ~1–1.5 weeks per 70%-similar app at first, falling to ~3–5 days.
- **Production bug for Dhruv's colleague:** video and invoice uploads are broken in the Play Store app (`cordova-plugin-file-transfer` was never shipped). RN copies this behind the `nativeUpload` flag (off).
- **Phase 8:**
  - Move `src/api/fixtures/_sessions.json` behind the debug-only path.
  - Bundle-size and startup optimisation.
  - The releaseRn APK is 80 MB because it holds all 4 ABIs; split per ABI for release.
- **Memory notes** for Claude live in `C:\Users\dhruv\.claude\projects\C--Migrations-Topbath-App-loyalty\memory\` (index `MEMORY.md`).
