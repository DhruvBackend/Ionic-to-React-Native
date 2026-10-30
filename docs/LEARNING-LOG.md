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
