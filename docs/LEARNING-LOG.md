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
