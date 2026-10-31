# Learning log — Top Bath Ionic → React Native

A running diary of what was done, **why**, and what to remember. Written for interview prep and so other people/agents can follow the reasoning. Newest entries at the bottom.

---

## 2026-10-27 — Understanding the old app before touching code

**What:** Read the Ionic repo: `providers/dbservice/dbservice.ts` (all HTTP), `app/app.component.ts` (start-up + push), `pages/tabs` (role-based tabs), the registration-type page (roles).

**Why:** In a migration the *API is the contract*. If you know exactly which URLs, headers and bodies the old app sends, you can rebuild the UI freely and the backend never notices.

**Learned:**
- Ionic 3 apps are Angular inside a WebView; Cordova plugins give native access (camera, GPS…).
- One service (`dbservice.ts`) wraps every call → porting that one file first gives every screen its network layer.
- The app has two backends: loyalty (`dd_api`) and sales-force (`crm/api/app`).
- Which screens a user sees depends on `userStorageData.type` (Plumber, Sales_Boy, Dealer, Sales_Executive, …).

## 2026-10-27 — Classifying features by backend dependency

**What:** Split features into 🟢 local-only (layout, validation, permissions), 🟡 read-only API, 🔴 writes real data (OTP, registration, coupon scan, redeem, transfers, complaints).

**Why:** Without backend access you must know what you *can* test. Anything 🔴 must never be tried against production casually.

**Interview angle:** "How do you test safely when you only have production?" → you don't; you mock, or you ask for a staging environment/test accounts.

## 2026-10-28 — Choosing a mock API layer

**What:** Plan a `MOCK | DEV | LIVE` switch. In MOCK, requests go to local handlers with fixture data and an in-memory store.

**Why:** Unblocks development, never touches real data, makes demos deterministic. Later, flip to DEV/LIVE and no screen changes.

**Pattern names:** adapter pattern, dependency inversion (screens depend on `client.ts`, not on a server), test doubles (fakes).

## 2026-10-28 — Trying to run the old app

**What:** Tried to see the current app. Play Store app needs an OTP that wasn't arriving. Inspected the `topsan.aab` in the repo: it points at the same production server, so building it locally would not fix OTP.

**Learned:**
- An `.aab` is a zip — you can inspect `base/assets/www/build/main.js` to see which server a build talks to.
- `.aab` → installable APK needs Google's `bundletool` (`build-apks --mode=universal`).
- Login problems on production are a backend/test-account question, not a client one.
- Found a signing keystore committed in the repo — a security risk (anyone with repo access can sign "official" updates). Reported, not changed.

**Decision:** skip running the old app; port first, compare later.

## 2026-10-29 — Phase 0: scaffold

**What:**
```bash
npx @react-native-community/cli@latest init TopbathRN --directory topbath-rn --package-name com.topsan.app --skip-git-init true
```
Got React Native **0.88.1**, React 19.3, TypeScript, New Architecture + Hermes on by default.

**Fixes made right after scaffolding (and why):**
| Fix | Why |
|---|---|
| `applicationIdSuffix ".rn"` on debug | Test APK installs as `com.topsan.app.rn` next to the Play Store app instead of conflicting with it (different signature = Android refuses to install over it). |
| `app_name` via `resValue` per build type ("Topsan" / "Topsan RN") | So you can tell the two apps apart on the phone. Removed it from `strings.xml` — a resource can't be defined in both places. |
| `android/local.properties` with `sdk.dir=C:/Users/.../Sdk` | Tells Gradle where the SDK is without changing system env vars. Forward slashes: in `.properties` files a backslash is an escape character. File is git-ignored (machine-specific). |
| Moved Kotlin files from `java/com/com.topsan.app/` to `java/com/topsan/app/` | The CLI made a folder literally named `com.topsan.app`. Kotlin compiles anyway, but folders should mirror the package. |
| `git config core.autocrlf false` | Stops Windows line-ending conversion (CRLF) that can break shell scripts like `gradlew`. |
| npm name `topbath-rn` | The CLI put the Java package into `package.json` `name`; npm names should be simple. |

**Learned:**
- `applicationId` = the app's identity on the phone/Play Store; `namespace` = the Kotlin/Java package for generated code (R class). They can differ.
- Gradle auto-downloads missing SDK platforms/build-tools if licences are accepted (this project needs SDK 37 / build-tools 37).
- Debug builds are signed with a throwaway `debug.keystore`; release builds need your own key (never commit it).

## 2026-10-29 — Inventory script

**What:** `scripts/ionic-inventory.sh <ionic-src>` → `docs/INVENTORY.md`: every page (incl. nested), lines of HTML/TS, endpoints, base URLs, storage keys, plugins, languages.

**Why:** Turns "read 117 pages" into a table you can plan from — and for the next client app you can `diff` two inventories to see what's different.

**Found:** 117 screens; 4 languages (en, es, hin, nep); storage keys `userStorageData`, `token`, `userId`, `user_type`, `fcmId`, `order_*`, `offlineDBLastInfo`; SQLite/Zip plugins are imported but commented out in `app.module.ts` (offline catalogue not in use).

## 2026-10-29 — Recon, reachability and a new design

**What:** Mapped the Ionic app with four parallel read-only searches: screens and navigation, API layer, native features and branding, and the backend (not reachable: no D: drive). Then wrote a design (`docs/superpowers/specs/…-design.md`) and an implementation plan (`docs/superpowers/plans/…-migration.md`).

**Why:** A line count says how *big* the app is. Only reachability says what users can actually *get to*. Of 117 screens, 61 are reachable in Topbath. The other 56 (the SFA/CRM module and 16 loyalty pages) have no path from the UI.

**Decisions (mine):**
- Port all 117 screens. The 56 unreachable ones go behind per-client feature flags, because other clients on the template may use them.
- Exact 1:1 copy, with no UI or behaviour changes, including Ionic's bugs.
- Build one white-label template, not one fork per client.

**Learned:**
- **The same app talks to two backends:** loyalty `dd_api` and SFA `crm/api/app`.
- **The OTP is generated and checked on the phone,** and `auth/login` issues a token without one. It's flagged for the security colleague, not changed.
- **The shipped `.aab` is older than the source.** It has no forced-update logic and no Sales Executive screens. Its plugin list shows push, navigation and reverse geocoding are not in production at all.

**Interview angle:** "How do you scope a migration?" → reachability analysis, not file count. Dead code is still a product decision (flags), not something you delete silently.

## 2026-10-30 — Task 1: making the existing WIP run

**What:** Installed the four libraries the code imported but `package.json` lacked. Fixed the Jest setup for async-storage **v3**, which moved its mock to `…/async-storage/jest` and ships ES modules. Fixed a TypeScript error where `MODE` typed as the literal `'MOCK'` made `MODE === 'DEV'` an "impossible" comparison.

**Learned:**
- A `const X: Union = 'a'` is narrowed to `'a'`. Write `'a' as Union` to keep the comparison legal.
- Jest's React Native preset only transpiles `react-native` and `@react-native/*`. Other ESM packages need adding to `transformIgnorePatterns`.

## 2026-10-30 — Task 2: standalone APK without a cable

**What:** A normal debug APK loads its JavaScript from Metro on the laptop. Without a cable that's a red screen. I added an opt-in Gradle property, `-PbundleDebugJs` (`debuggableVariants = []`), which embeds the bundle so the APK can be sideloaded over WhatsApp or Drive.

**Learned:**
- `debuggableVariants` decides which variants *skip* bundling.
- Build only phone ABIs (`armeabi-v7a,arm64-v8a`) to save time and size.
- **Gotcha found later:** bundled debug APKs are built in *release* JS mode, so `__DEV__` is false. See the Task 9 entry.

## 2026-10-30 — DEV server by default

**What:** The app's default `MODE` is DEV (`devcrm.abacusdesk.com`), copied from the Ionic "Testing URL" block. Jest is forced to MOCK in `jest.setup.js`, so tests never reach a server. LIVE needs explicit approval.

**Learned:** Separate "what the app uses" from "what tests use". A test suite that can hit a real server is a liability.

## 2026-10-30 — Task 3: white-label config

**What:** `clients/<id>/client.json` plus a JSON schema, and `scripts/use-client.mjs <id>`. The script writes `src/config/client.ts`, `android/client.properties` (Gradle reads the application id, version and name from it) and the launcher icons. There's a test-only `_all-features` client.

**Learned:**
- **Two colour sets.** Ionic has `$colors` (what `color="danger"` means, a grey) and SCSS variables (`$danger`, a red). A 1:1 copy keeps both.
- **Copy, don't regenerate.** The launcher icons were copied from Ionic's resources and are md5-identical. Regenerating them would have changed pixels.
- **Fail loudly.** Gradle fails with a clear message when no client is selected, instead of silently using defaults.

**Interview angle:** "How would you ship 70 apps from one codebase?" → config-as-data, a schema, build-time generation, and a lint rule that bans brand strings in screens.

## 2026-10-30 — Task 4: theme, translations, lint rule

**What:**
- Theme colours come from the client config.
- The translation files stay **byte-identical** to Ionic's, with client overrides merged on top.
- An ESLint `no-restricted-syntax` rule bans hex colours, brand names and URLs in `src/screens` and `src/components`. A fixture file proves the rule fires.

**Learned:**
- The translation files hold far more brand text than expected (Agmeco, VMS Bathwares, Valve India in Hindi). Splitting template text from brand text needs a second client to diff against, so it's deferred to Phase 9 rather than guessed.
- A lint test needs its fixture *outside* `__tests__`, or Jest tries to run it.

## 2026-10-30 — Task 5: fixtures with variants

**What:** One JSON file per endpoint with named variants (`default`, `empty`, `malformed`, error statuses), a stateful in-memory store, and `setFixtureVariant()`, which **throws** on a typo. `gen-fixtures.mjs` writes a static import list because Metro can't `require` by dynamic path.

**Learned:** Stateful mocks test *flows* (scan → balance → redeem), not just screens. Make test helpers fail loudly on typos, or a mistyped variant silently tests the happy path.

## 2026-10-30 — Task 6: request contracts

**What:** `expectContract()` checks that an RN call sends exactly the Ionic request: URL, method, header set and body key tree, with `=` pinning literals. To check requests in MOCK mode, the API client now always builds the full request and hands it to a **transport** (network or mock). Tests wrap the transport.

**Learned:**
- **A seam beats a mode switch.** Inserting a transport let tests observe the exact wire request without touching production behaviour.
- **Pin negative tests to a message** (`toThrow(/"otp"/)`), or they can pass for the wrong reason.

**Interview angle:** "How do you prove a rewrite didn't change the API?" → contract tests derived from the old client's call sites.

## 2026-10-30 — Task 7: navigation

**What:** Tab sets copied from `tabs.html`. One native stack per tab. Generated routes, feature-flag gating, debug deep links (`topbathrn://open?...`, registered only in the debug manifest).

**Learned:**
- Ionic 3 defaults (`IonicModule.forRoot` with no config, so `tabsHideOnSubPages=false`) mean pages pushed from a tab **keep the tab bar**. In React Navigation that means a stack per tab.
- An unknown user type renders **no tabs**: Ionic's `*ngIf` blocks all fail. Copied.

## 2026-10-30 — Task 8: start-up, version check, back button

**What:** Ported `app.component.ts`:
- **start-up:** session restore and profile check (every branch, including the blank-screen ones)
- **version check:** against the dev server, which returns `0.1.5` and flag 0, so no alert
- **back-button rules:** Ionic's list, in Ionic's order
- **OTP and session logic:** isolated in `src/auth/`
- **the status-bar frame**

**Learned:**
- **Read the code, not your summary of it.** The back rule sends only GiftList, Transaction, Profile and Menu to the first tab; Offers and Wallet ask to exit.
- **RN 0.88 is edge-to-edge.** `StatusBar backgroundColor` no longer exists, so the Ionic look is drawn as explicit bands.
- **Ionic's Android 15 hack** adds a 30px black border and 94% height after a 2-second delay (`body.android-15`). Copied, including the delay.
- **Verify on a device, not just in tests.** Two emulators (`tb_api36`, `tb_api33`) confirmed both status-bar branches.

## 2026-10-30 — Task 9 part 1: fonts and icons

**What:** Bundled the exact fonts:
- Google Roboto 300/400/400i/500/500i/700 and Condensed, with `latin-ext` for ₹
- Material Icons
- Ionicons 3.0.0, md5-identical to the shipped app's font

Also `fontFor()`, `IonIcon`, `MaterialIcon`, Ionic md base values with file:line citations, and a debug-only component gallery.

**Learned:**
- **Browsers choose font files by rules** (CSS font matching). Weight 600 with no 600 face draws Bold, and italic is matched before weight. Replicate the rule, not just the font.
- **Google Fonts serves TTF to old user agents;** add `subset=latin,latin-ext` or ₹ is missing.
- **Bundled debug APKs run release-mode JS** (`__DEV__` false), which silently disabled the debug tools. A tiny native module exposing `BuildConfig.DEBUG` fixed it.
- **Material Icons uses ligatures,** and they work in Android `Text`. Verified all 57 names on the emulator.

## 2026-10-30 — Task 9 part 2: popups (first subagent build)

**What:** Ionic md replicas of Alert, Loading, Toast and ActionSheet, behind the same `showAlert`-style API the app already used. The process:
1. A **Sonnet 5.5 implementer** built them with tests and emulator screenshots.
2. A **separate Sonnet 5.5 reviewer**, who never saw the implementer's reasoning, checked them against Ionic's source and the compiled `main.css` from the shipped `.aab`.
3. The implementer fixed the 5 confirmed findings.
4. I re-ran every check and looked at the result on the emulator.

**Why two agents:** The implementer anchors on its own decisions. A fresh reviewer given only the code and the ground truth catches what the author can't, here the tap-block during the *enter* animation and a 4px Cancel offset.

**Learned:**
- **The compiled CSS settles cascade questions.** Topbath's rules are emitted *before* Ionic's component CSS, so at equal specificity Ionic wins. Two `.alert-modal` rules in the SCSS never apply.
- **Ionic blocks taps during overlay transitions** (enter + 64 ms, and `max(400, leave + 64)` after closing). That's why you can't double-open a popup in the Ionic app.
- **Ionic's back button closes the *oldest* popup** (`_overlayPortal._views[0]`), not the newest. Copied, with a note.
- **Rule out the obvious before calling something a bug.** A "missing page behind the popup" was the placeholder text sitting exactly under the dialog card. A `uiautomator dump` plus comparing coordinates proved it in two commands.

**Interview angle:** "How do you use AI agents safely on a big migration?" → narrow briefs with ground-truth sources, an independent reviewer, every claim re-verified by running the checks yourself, and visual checks on a device.

## 2026-10-31 — Task 9 part 3: pickers

**What:**
- `ion-select` (alert-based)
- `ion-datetime` with Ionic's md picker wheel
- `ionic-selectable` 3.5.0 and `select-searchable` 2.10.0
- Topbath's form-field styles

The process was the same as part 2: a Sonnet implementer, an independent Sonnet reviewer (9 findings), fixes, then my own re-verification on the emulator.

**Learned:**
- **Check the lockfile, not `package.json`.** `^3.4.0` actually installed **3.5.0**. Porting the wrong version would copy the wrong behaviour.
- **Port the logic files, not just the look.** `datetime-util.js` and `datetime.js` were ported function by function: formats, default year range (this year back to 100 years ago), invalid days disabled, ISO output.
- **Framework internals create user-visible quirks:**
  - Angular's `writeValue` skips the first `ionChange`.
  - Back with a searchable modal open falls through to the exit alert, because `getActiveNavs()` returns the modal's nav.
  - A `min=""` makes Ionic throw and silently open nothing; RN must match that without crashing.
- **Render the real thing for reference.** The implementer rendered real Ionic markup with the shipped `main.css` in headless Chrome. That's how it found md pickers have no highlight bands.
- **Labels are `textContent`.** "State *" comes from `{{ 'State' | translate }} <span>*</span>`, spacing included.

**Interview angle:** "What breaks in a UI-framework migration that tests miss?" → lifecycle semantics (first-write events, back-button routing through overlay portals), not pixels. Port the framework's own code paths and pin them with tests.

## 2026-10-31 — How the app is connected to the development server

**What:** The RN app talks to the dev server (`devcrm.abacusdesk.com`) out of the box, with no extra setup. The connection is built in four layers:
1. **The URLs come from the Ionic app.** `dbservice.ts` had a production block and a commented "Testing URL" block. Both were copied unchanged into `clients/topbath/client.json` under `urls.LIVE` and `urls.DEV`, using Ionic's field names (`rootUrl`, `rootUrlSfa`, `image_url`, `upload_url1`…).
2. **One switch picks the server.** In `src/config/env.ts`, `MODE` (`'MOCK' | 'DEV' | 'LIVE'`) defaults to `'DEV'`. `urlsFor(MODE)` returns that client's DEV URL block, which becomes `URLS`.
3. **The API client reads `URLS`.** `src/api/client.ts` is a port of `dbservice.ts`. Its `db` object builds `rootUrl`, `server_url = rootUrl + 'index.php/app/'` and the rest from `URLS`, so every screen calls the same methods with the same URLs as Ionic (`onPostRequestDataFromApi(data, 'app_karigar/app_version', db.rootUrl)`).
4. **A transport seam decides where requests actually go.** Every call becomes an `ApiRequest {method, url, headers, body}` and is handed to a `Transport`:
   - DEV/LIVE → `networkTransport`, a plain `fetch` over HTTPS.
   - MOCK → `mockTransport`, which answers from the fixture files.
   - Jest forces `MODE: 'MOCK'` in `jest.setup.js`, so tests can never reach a server.

**Proof it works:** On launch the version check posts to `app_karigar/app_version` on dev. One approved read-only call returned `{"app_version":"0.1.5", "play_console_flag":0}`, so a 0.1.5 build shows no update popup.

**Why:**
- The Ionic app hard-coded URLs and switched servers by commenting lines in and out. Here the server is one value (`MODE`), and the URLs live per client in `client.json`. That lets 70 white-label apps share one codebase.
- Keeping Ionic's field names and request shapes means screens convert 1:1, with no URL rewrites.
- A seam between "build the request" and "send the request" lets the same code run against real servers, mocks and contract tests.

**Learned:**
- **Make the safe server the default.** DEV is the default, production needs explicit approval, and tests are hard-wired to mock. Mistakes then fail safe.
- **Connecting needs no credentials. Using the data does.** Public endpoints like the version check work now. Anything after login needs a dev test account, because OTP goes to a real phone.
- **Never use "bypass" numbers found in code** to log in on a shared server. They may be real users' accounts.
- **Separate building the request from sending it.** Tests can check the exact URL, headers and body (`expectContract`) without any network.

**Interview angle:** "How do you manage environments in a mobile app?" → per-client config holds each environment's URLs; one mode switch with a safe default; tests pinned to mocks; a transport seam so the same request code serves real servers, mocks and contract tests.

## 2026-11-01 — Task 9 part 4: page structure

**What:**
- The Ionic header bar (`IonNavbar`), covering every header pattern used across the 110 pages.
- The bottom tab bar (`IonTabBar`), with Topbath's SVG tab icons as white-label client assets.
- Ionic's page and modal animations, through a small custom stack navigator (`IonStack`).

The process was the same as parts 2–3: a Sonnet implementer, an independent Sonnet reviewer (7 findings), fixes, then my own checks on the Android 16 emulator.

**Why:** Every one of the 117 screens sits inside this frame. If the header, tab bar or page animation is wrong, every screen is wrong.

**Learned:**
- **The plan can be wrong; the source can't.** The plan said pages slide 56px. Ionic 3.9.5's `transition-md.js` says 40px. The modal is 280 ms, not 400 ms. Re-read the framework source instead of trusting a summary, including your own.
- **Not every navigation animates.** In Ionic, `setRoot` (login → home, logout) is instant, because `setPages` defaults `animate` to false. Only push and pop animate, and only one page moves (the entering page on push, the leaving page on pop).
- **Library limits can force a custom piece.** React Navigation's native-stack uses fixed Android animations. Rather than add a gesture library, the implementer built a small stack on React Navigation's own `StackRouter`, so routing, params and focus events stay standard and only the drawing is custom.
- **Concurrency is part of parity.** Ionic queues navigation while a page is animating. Without a queue, pressing Back mid-animation made the page jump. Now it's queued, as in Ionic.
- **Invalid CSS is real behaviour.** `.tabbar a:gt(3)` is jQuery syntax; browsers drop the rule, so all five tabs show. Copy what the browser did, not what the author meant.
- **Check memory before heavy work.** The emulator and Gradle together got killed for low memory; running them one after the other worked.

**Interview angle:** "How do you reproduce one framework's navigation in another?" → read the source for which transitions animate (push vs setRoot), which page moves, the timings and curves, and the concurrency rules (queueing), then pin each with a test. Write a custom navigator only when the library can't match, and keep the library's router.
