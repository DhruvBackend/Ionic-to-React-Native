# Topbath Ionic → React Native Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Model for implementer and reviewer subagents: `sonnet` (Sonnet 5.5).** The orchestrator is the main session.

**Goal:** Rebuild all 117 screens of the Ionic 3 Topbath loyalty app in bare React Native as a white-label template, with element-for-element parity and byte-identical API requests. Topbath is client #1.

**Architecture:**
- **Phase 0** builds the shared foundation:
  - per-client config
  - API client with a stateful MOCK backend and shared fixtures
  - per-endpoint contract tests
  - generated navigation with feature-flag gating
  - shared components
  - native wrappers
  - a visual-parity harness (Ionic web build in Playwright vs RN on an emulator with Maestro)
  - a screen-card generator
- **Phases 1–7** port screens with one repeatable per-screen procedure (S-task), run by Sonnet subagents in batches of up to 4 parallel git worktrees. Each screen gets an implementer and an independent reviewer.
- **Phases 8–10** are native/release, second client, and iOS.

**Tech Stack:**
- React Native 0.88.1 (New Architecture, Hermes), React 19.3, TypeScript, Jest
- React Navigation (native-stack, bottom-tabs), AsyncStorage, i18next + react-i18next, jwt-decode
- react-native-vision-camera, react-native-image-picker, @react-native-community/geolocation, react-native-permissions, react-native-share, react-native-webview, react-native-device-info, @react-native-community/netinfo, react-native-blob-util, @react-native-firebase/messaging (Phase 8)
- Playwright (Node) for the reference harness, Maestro for RN E2E and screenshots

**Spec:** `docs/superpowers/specs/2026-10-29-topbath-rn-migration-design.md`. Executors read the spec and this plan. The spec wins on any conflict.

**Repos:**
- RN, working repo: `C:\Users\dhruv\Projects\topbath-rn`. All paths below are relative to it.
- Ionic source, **read-only**: `C:\Migrations\Topbath_App_loyalty`, referred to as `$IONIC`.

## Global Constraints

- **Exact 1:1 copy: no UI or behaviour changes** (spec §2a). This includes Ionic's broken behaviour, its overlays' look, its transitions and its timings. When in doubt, the Ionic source wins.
- **Ionic md-mode replicas only.** Screens must not use `Alert.alert`, `ToastAndroid`, native date/time pickers or `react-native-vector-icons/Ionicons`. Use the `src/components/ionic/*` replicas and the bundled Ionicons v3 / Material Icons fonts. The lint rule enforces this.
- **Straight conversion.** API base URLs, endpoint paths, HTTP method, headers, body key structure and storage keys stay identical to `$IONIC/src` at commit `b33d82f`.
- **Copy security behaviour unchanged** and mark it `// NOTE (security, not changed): <what>`. Mark parity deviations `// NOTE (parity): <what and why>`.
- **Every screen file starts with a header:** `// Ported from: src/pages/<path>/<file>.html + .ts + .scss`. Every deviation gets a comment.
- **App builds default to `MODE = 'DEV'`** (`devcrm.abacusdesk.com`), per Dhruv, 2026-10-30. Jest always runs in `MOCK` (forced in `jest.setup.js`), so tests never reach a server. **`LIVE` (`apps.abacusdesk.com`) is never used** unless Dhruv explicitly asks in that session.
- **Local git only:** never add a remote or push. One commit per screen (`feat(screen): port <IonicClassName>`) or per foundation task.
- **No client strings in `src/screens/**` or `src/components/**`:** no hex colours, no "Topsan", "Topbath", "Agmeco" or "Gravity" labels, no URLs, no phone numbers. Take them from `client` or `theme`. `'Gravity'` as a data value in `delivery_from` comparisons is the one exception, and it carries a NOTE.
- **Never commit** `*.keystore` (except `android/app/debug.keystore`), `google-services.json`, `GoogleService-Info.plist`, passwords or `.env` files.
- **Topbath feature flags** are all `false` except the live roles. With all flags off, navigation reachability equals Ionic exactly.
- **Debug builds** install as `com.topsan.app.rn` with name "Topsan RN". Release uses `client.androidPackage`.
- **Screen and route names** equal the Ionic page class name without the `Page` suffix (e.g. `PulmberCustomerDetail`, `CoupanCode`). The misspellings are kept for traceability.
- **Ask Dhruv before** installing global tools, setting system environment variables, deleting files outside the RN repo, or changing package ids.

## Review Focus

1. **Stored session in an unexpected shape.** Logout writes `userStorageData = {}` (not remove), an old install may hold partial data, and the JSON can be corrupt. Start-up must take the same branch Ionic would: no token goes to Language. It must never throw. The one Ionic blank-root case is copied deliberately. Test in Task 8.
2. **HTTP 200 with an unknown `status` or missing nested objects** (e.g. `karigar: null`, `gift: []`). A screen must render its empty or default state, never a red-box crash. Every S-task adds a `"malformed"` fixture variant and a render test (S-task step 4).
3. **Permission denied or GPS off** (camera, location, Android 13 notifications). Ionic shows a toast or does nothing, and the RN app must not crash or hang a loader. Test in Task 10 (wrapper returns `{ ok: false, reason }`) plus each native-using S-task.
4. **Network failure or timeout in LIVE/DEV.** Many Ionic callers have no error callback, so their loaders closed only on page change. RN must close the loader on error, both on failure and when the user leaves the screen, and must never leave a permanent spinner. Test in Task 9 (`useLoader` closes on unmount and on rejected promise).
5. **Hindi (`hin`) selected, plus keys missing from a locale.** Text falls back to the English key (ngx-translate behaviour), and long Hindi strings must not clip buttons or headers. Test in Task 4 (i18n fallback) plus a `lang: 'hin'` parity state for each screen with translated text (S-task step 6).

---

## File Structure (Phase 0 output)

```
clients/
  client.schema.json             # JSON schema for client.json
  topbath/client.json            # Topbath values (from Ionic audit)
  topbath/assets/                # logo.png, banner.png, icon.png, splash.png, notification.png (copied from $IONIC)
  topbath/i18n/{en,hin,nep,es}.json   # brand-text overrides (copied verbatim for parity)
  _all-features/client.json      # test-only: every flag on; never shipped
scripts/
  use-client.mjs                 # node scripts/use-client.mjs <id>  → generated files below
  gen-routes.mjs                 # src/screens/*/route.ts → src/navigation/routes.generated.ts
  gen-fixtures.mjs               # src/api/fixtures/*.json → src/api/fixtures.generated.ts
  screen-card.mjs                # node scripts/screen-card.mjs <IonicClass> → src/screens/<Name>/card.md
  ionic-inventory.sh             # existing
docs/inventory.json              # 117 rows: ionicClass, ionicPath, status, roles, backend, feature, phase
src/
  config/env.ts                  # MODE; URLs now from client
  config/client.ts               # GENERATED by use-client.mjs (committed for topbath)
  config/types.ts                # ClientConfig, FeatureKey, Role
  api/client.ts                  # existing (DbService)
  api/mock/index.ts              # existing + fixture auto-registration + variants
  api/mock/store.ts              # in-memory stateful store
  api/fixtures/<group>__<action>.json   # one file per endpoint
  api/contracts/<group>__<action>.json  # Ionic request contract per endpoint
  auth/{session.ts, otp.ts}      # all security-relevant client logic
  app/{startup.ts, versionCheck.ts, backButton.ts}
  navigation/{RootNavigator.tsx, RoleTabs.tsx, SideMenu.tsx, routes.generated.ts, types.ts, debugLinks.ts}
  screens/<Name>/{index.tsx, route.ts, styles.ts, card.md, <Name>.test.tsx}
  components/…                   # Task 9
  native/…                       # Task 10
  storage/, i18n/, theme/
parity/
  reference/                     # build script for Ionic www + Playwright capture
  states.json                    # every screen state to capture
  capture-rn.mjs                 # drives Maestro screenshots
  report.mjs                     # → parity/out/report.html
.maestro/                        # flows per role
__tests__/helpers/contract.ts    # expectContract()
```

---

## Phase 0: Foundation

### Task 1: Repair and commit the existing WIP

**Files:**
- Modify: `package.json` (add deps), `jest.config.js`, `.gitignore`
- Create: `jest.setup.js`
- Test: existing `__tests__/api-client.test.ts`, `__tests__/api-mock.test.ts`, `__tests__/App.test.tsx`

**Interfaces:**
- Produces: a green `npx jest` baseline; `src/api/client.ts` `db`, `HttpError`; `src/api/mock` `registerMock(fn, handler)`, `mockRequest(method, fn, body?, serverURL?)`, `hasMock(fn)`; `src/storage` `storage.get/set/remove/clear`; `src/i18n` default export `i18n`, `LANGUAGES`.

**Status: DONE 2026-10-30** (commits `60193d9`, `1e9ae81`). Two deviations are recorded below.

- [x] **Step 1: Run the tests to record the current failure.** Result: FAIL, "Cannot find module 'jwt-decode'".
- [x] **Step 2: Install the missing dependencies.** Ran `npm i i18next react-i18next jwt-decode @react-native-async-storage/async-storage` (async-storage resolved to **v3.1.1**).
- [x] **Step 3: Set up the async-storage Jest mock.** *Deviation: v3 moved the mock.* `jest.setup.js` mocks the module with `require('@react-native-async-storage/async-storage/jest')` (exports `default` and `createAsyncStorage`). `jest.config.js` gets `setupFiles` plus `transformIgnorePatterns` that also allow `@react-native-async-storage`, which ships ESM.
- [x] **Step 4: Extend `.gitignore`.** Done.
- [x] **Step 5: Run the tests.** Result: 11/11 PASS, `tsc` clean, lint clean. *Extra fix:* `env.ts` `MODE` was typed as a literal, so `tsc` errored; it's now `'…' as Mode`.
- [x] **Step 6: Commit.** Done.
- [x] **Added (Dhruv, 2026-10-30):** the app default is the **DEV** server. `env.ts` exports `urlsFor(mode)`, `MODE = 'DEV'`, and Jest is forced to MOCK. Tests cover "default is dev, MOCK never points at production" and "LIVE equals the Ionic production block".

### Task 2: First debug APK on the phone (risk gate)

**Files:** none (build only). Record the result in `docs/LEARNING-LOG.md`.

**Status: Step 1 DONE 2026-10-30; Steps 2–4 pending.**
- The toolchain was verified: JDK 17, platform 37, build-tools 37.0.0, NDK 27.1, CMake 3.22.1, Gradle 9.4.1. Nothing needed installing.
- Dhruv has no cable at the moment. He will sideload the APK, and live reload over USB or wireless debugging starts at Task 13.

- [x] **Step 1: Build the debug APK.**
  - **Standalone build** (JS bundled, runs without Metro, sideloadable): `cd android && ./gradlew assembleDebug -PbundleDebugJs -PreactNativeArchitectures=armeabi-v7a,arm64-v8a`. The `-PbundleDebugJs` switch is opt-in in `app/build.gradle`.
  - **Live-reload development:** plain `./gradlew assembleDebug` plus `npx react-native start`, with the phone on USB or wireless debugging.
  - Result: BUILD SUCCESSFUL (first build 10 min), APK 63 MB, `com.topsan.app.rn` / "Topsan RN".
- [ ] **Step 2: Install it.** Run `adb devices`, then `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`. Expected: the device is listed and the install prints `Success`. If no device is connected, **stop and ask Dhruv** to connect the phone with USB debugging on. Don't mark this step done on the emulator alone.
- [ ] **Step 3: Launch it.** Open "Topsan RN" on the phone. Expected: the RN welcome screen appears and the Play Store "Topsan" app is still installed beside it.
- [ ] **Step 4: Log and commit.** Add a dated entry to `docs/LEARNING-LOG.md` (build time, any fixes), then run `git commit -am "docs: first debug APK verified on device"`.

### Task 3: White-label client config

**Status: DONE 2026-10-30.** Tests 6/6 (17/17 total), `tsc` and lint clean. The APK is `com.topsan.app.rn`, versionName `0.1.5`, label "Topsan RN", and the launcher icons are md5-identical to the Ionic `resources/android/icon/*`. A missing `client.properties` fails the build with instructions.

Deviations from the steps below, all in the direction of 1:1:
1. **Colours.** Ionic has two colour sets with different values (`$colors` map: danger `#54595F`; SCSS variables: `$danger` `#ff0000`). `ClientConfig.colors` is therefore `{ primary, statusBar, ionic: {…8 keys}, scss: {…10 keys} }` (see `src/config/types.ts`), not a single flat list. Task 4 maps the theme from both.
2. **Icons are copied, not generated.** `use-client.mjs` copies the Ionic `drawable-<dpi>-icon.png` files unchanged into `mipmap-<dpi>/ic_launcher.png` and `ic_launcher_round.png` (Ionic had no round icon). `sharp` is not used. Splash generation moves to Task 8.
3. **Contact fields** were extended to what the Ionic templates really show: `phone` (tel:) plus `phoneDisplay`, `addressKey` (an i18n key), `mapEmbedUrl`, `geoLatLng`/`geoLabel` (contact.ts geo link), `nearestDealerPhone`.
4. **`FeatureKey`** includes `nativeNavigation` and `nativeGeocode` (both false for Topbath).
5. **Test helpers.** `__tests__/use-client.test.ts` runs the script with `--skip-assets` and `--validate <file>`. `@types/node` is referenced only in that test file.
6. **Lint.** `scripts/*.mjs` are not linted: the RN ESLint parser can't read `import.meta`. They're covered by their tests.

**Files:**
- Create: `src/config/types.ts`, `clients/client.schema.json`, `clients/topbath/client.json`, `clients/_all-features/client.json`, `scripts/use-client.mjs`, `src/config/client.ts` (generated)
- Copy (from `$IONIC`): `src/assets/imgs/logo.png`, `src/assets/imgs/banner.png`, `resources/icon.png` and `resources/splash.png` into `clients/topbath/assets/`
- Modify: `src/config/env.ts` (URLs come from `client`), `android/app/build.gradle:82-87,102-103` (read `android/client.properties`)
- Test: `__tests__/use-client.test.ts`, existing `__tests__/api-client.test.ts`

**Interfaces:**
- Produces:
  - `type Role = 'Plumber' | 'Sales_Boy' | 'Dealer' | 'Sales_Executive' | 'Customer' | 'Retailer'`
  - `type FeatureKey = 'push' | 'sfa' | 'giftList' | 'pointDetail' | 'scanPage' | 'loginScreen' | 'digitalCatalog' | 'editProfile' | 'enquiry' | 'favorites' | 'news' | 'survey' | 'nearestDealer' | 'retailerComplaints' | 'search' | 'superPlumber' | 'quotation' | 'pointTransfer'`
  - `interface ClientConfig { id; appName; androidPackage; iosBundleId; versionName; versionCode; playStoreId; platforms: ('android'|'ios')[]; urls: { LIVE: Urls; DEV: Urls }; colors: { primary; statusBar; secondary; danger; success; warning; light; dark }; contact: { phone; email; address; mapEmbedQuery }; companyName; languages: string[]; countries: string[]; roles: Role[]; fcmSenderId: string; features: Record<FeatureKey, boolean>; brandLabels: Record<string,string> }`
  - `interface Urls { rootUrl; rootUrlSfa; image_url; upload_url1; upload_url2; upload_url3; video_url; product_image_url; category_url; videoUpload; legacyImageHost; gravityImageHost }`
  - `export const client: ClientConfig` from `src/config/client.ts`
  - `node scripts/use-client.mjs <id>` exits 0 and writes `src/config/client.ts`, `android/client.properties` (`applicationId=`, `appName=`, `versionName=`, `versionCode=`), `src/assets/client/*` and the Android mipmaps.

Topbath values (from the spec and the Ionic audit):
- `androidPackage` `com.topsan.app`, `appName` `Topsan`, `versionName` `0.1.5`, `playStoreId` `com.topsan.app`, `platforms` `["android"]`
- `urls.LIVE` = the active block in `$IONIC/src/providers/dbservice/dbservice.ts:25-35`; `urls.DEV` = the commented block at `:42-53`
- `videoUpload` = `""`, with a security note in the schema description
- `legacyImageHost` = `http://phpstack-83335-1980946.cloudwaysapps.com/`, `gravityImageHost` = `http://app.gravitybath.com/`
- `colors.primary` and `colors.statusBar` = `#002d25`
- `contact.phone` `8655050950`, `contact.email` `care@topsan.in`
- `companyName` `Machino Tech (Topsan)`
- `languages` `["en","hin"]`, `countries` `["India","Nepal"]`
- `roles` `["Plumber","Sales_Boy","Dealer","Sales_Executive","Customer","Retailer"]`
- `fcmSenderId` `849648964768`
- `features`: `superPlumber`, `quotation` and `pointTransfer` are `true`; everything else is `false`
- `brandLabels`: `{ "dealerBrand": "Agmeco", "orderTo": "Gravity" }`, copied for parity

- [ ] **Step 1: Write the failing tests** in `__tests__/use-client.test.ts`:

```ts
test('topbath client.json validates against schema', () => { expect(validate(load('topbath'))).toEqual([]); });
test('_all-features has every FeatureKey true', () => { expect(Object.values(load('_all-features').features).every(Boolean)).toBe(true); });
test('generated client.ts for topbath exposes Ionic LIVE rootUrl', () => {
  run('topbath'); expect(require('../src/config/client').client.urls.LIVE.rootUrl).toBe('https://apps.abacusdesk.com/topbathfixtures/dd_api/');
});
test('client.properties carries package and version', () => {
  expect(read('android/client.properties')).toMatch(/applicationId=com\.topsan\.app[\s\S]*versionName=0\.1\.5/);
});
test('schema rejects missing androidPackage', () => { expect(validate({ ...load('topbath'), androidPackage: undefined }).length).toBeGreaterThan(0); });
```
(`load`, `validate`, `run` and `read` are small helpers in the test file. `validate` uses `ajv`, installed as a devDependency.)

- [ ] **Step 2: Run the new tests.** Run `npx jest __tests__/use-client.test.ts`. Expected: FAIL, because the files don't exist yet.
- [ ] **Step 3: Implement the config.**
  - Write `types.ts`, the schema, both client files and `scripts/use-client.mjs`.
  - `use-client.mjs` uses only Node built-ins plus `ajv`.
  - Mipmap and splash generation uses `sharp` (devDependency) to produce the mdpi–xxxhdpi sizes from `icon.png`.
  - `env.ts` keeps `MODE` and the `URLS` export shape, built as `client.urls[MODE === 'DEV' ? 'DEV' : 'LIVE']`.
  - `build.gradle` loads `android/client.properties` with `Properties` and uses those values for `applicationId`, `versionName`, `versionCode` and `app_name`. Debug keeps `applicationIdSuffix ".rn"` and appends `" RN"` to the name.
- [ ] **Step 4: Run all tests.** Run `node scripts/use-client.mjs topbath && npx jest`. Expected: all PASS, including the untouched `api-client.test.ts` URL test.
- [ ] **Step 5: Rebuild the APK.** Run `cd android && ./gradlew assembleDebug`. Expected: BUILD SUCCESSFUL. Then run `aapt dump badging app/build/outputs/apk/debug/app-debug.apk | grep package`, which should show `com.topsan.app.rn`.
- [ ] **Step 6: Commit.** Run `git add -A && git commit -m "feat(config): per-client white-label config with topbath + _all-features"`.

### Task 4: Theme, i18n overrides and the no-brand lint rule

**Status: DONE 2026-10-30.** Tests 25/25, `tsc` clean, project-wide `eslint .` clean.

Deviations from the steps below:
1. **Brand text in i18n is not split out yet.** The locale files contain far more brand text than the audit listed (Agmeco, Topsan, "VMS Bathwares", "Valve India" in Hindi, addresses), so a regex split would be guesswork.
   - `src/i18n/locales/*` stay byte-identical to Topbath's Ionic files, which a test confirms.
   - `clients/<id>/i18n/<lang>.json` overrides are merged on top: `buildResources(base, overrides)`, with client keys winning.
   - Topbath has none, so `use-client` writes `{}` for each language into `src/i18n/client/`.
   - The real template/brand split happens in **Phase 9**, by diffing two clients' locale files.
2. **Theme exports both colour sets:** `ionicColors` (the `$colors` map) and `scssColors` (SCSS variables), plus `colors` with every previous value unchanged and `colors.statusBar` added.
3. **Lint fixture location.** It lives in `test-fixtures/lint/brand-violation.tsx`, not `__tests__/`, because Jest would try to run it there. `.eslintignore` excludes it, and the test lints it with `--no-ignore`.
4. **What the lint rule matches.** Besides plain literals, it also covers `TemplateElement` and `JSXText`, so brand names inside template strings and in JSX text are caught.
5. **The Hindi test key** is `'About Topsan'`, because `'Are you sure you want Exit?'` is not in `hin.json`.

**Files:**
- Modify: `src/theme/index.ts` (colours from `client.colors`), `src/i18n/index.ts` (merge `clients/<id>/i18n` overrides, which `use-client` copies to `src/i18n/client/`), `.eslintrc.js`
- Test: `__tests__/theme-i18n.test.ts`, plus a lint fixture `__tests__/lint/brand-violation.fixture.tsx`

**Interfaces:**
- Consumes: `client` (Task 3).
- Produces: `colors.*`, the same keys as today with `primary` = `client.colors.primary`; `i18n.changeLanguage(code)`; ESLint rule config `no-restricted-syntax` scoped to `src/screens/**` and `src/components/**`.

- [ ] **Step 1: Write the failing tests:**

```ts
test('primary colour comes from client', () => expect(colors.primary).toBe(client.colors.primary));
test('missing key falls back to the key itself', async () => { await i18n.changeLanguage('hin'); expect(i18n.t('Some key that does not exist')).toBe('Some key that does not exist'); });
test('hin translation of a known key differs from English', async () => { await i18n.changeLanguage('hin'); expect(i18n.t('Are you sure you want Exit?')).not.toBe('Are you sure you want Exit?'); });
test('lint flags hex colour and brand word in screens', () => {
  const out = execSync('npx eslint --no-ignore __tests__/lint/brand-violation.fixture.tsx -f json || true').toString();
  expect(out).toMatch(/#002d25/); expect(out).toMatch(/Topsan/);
});
```
Before writing the third test, check that `'Are you sure you want Exit?'` exists in `hin.json`. If it doesn't, use any key that is present in both `en.json` and `hin.json`.

The lint fixture needs the screens rule to apply to it. Use an ESLint `overrides` entry whose `files` includes both `src/screens/**` and `__tests__/lint/**`.

- [ ] **Step 2: Run the tests.** Run `npx jest __tests__/theme-i18n.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Lint selectors:
    - `Literal[value=/^#[0-9a-fA-F]{3,8}$/]`
    - `Literal[value=/(Topsan|Topbath|Agmeco|Gravity)/]`, with the message "use client/theme"
    - `Literal[value=/^https?:\/\//]`
  - Allow `'Gravity'` only in the form `// eslint-disable-next-line no-restricted-syntax -- NOTE (parity): backend data value`.
- [ ] **Step 4: Run the tests.** Run `npx jest && npx eslint src`. Expected: PASS, with 0 lint errors in `src`.
- [ ] **Step 5: Commit.** Run `git commit -am "feat(theme,i18n): client-driven colours, brand overrides, no-brand lint rule"`.

### Task 5: Fixtures, variants and the stateful mock store

**Status: DONE 2026-10-30.** Tests 35/35, `tsc` and `eslint .` clean. An end-to-end probe with a real fixture file in `src/api/fixtures/` was auto-registered, type-checked and switched variants; the probe was then removed.

Additions beyond the steps below:
1. `setFixtureVariant` **throws** on an unknown endpoint or variant, naming the variants that exist, so typos in tests fail loudly.
2. `fixture(endpoint, variant?)` and `hasMock()` also count fixtures. Responses are deep-copied, with a test that a mutated response can't change the next one.
3. `resetMock()` resets variants and the store but keeps registered handlers and fixtures, which are module-level registrations.
4. `gen-fixtures.mjs` validates every file: the name must match the endpoint, `server` must be one of `root`/`sfa`/`server_url`, and `variants.default` is required. A missing `malformed` variant only warns for now. It takes `--dir`/`--out` for tests, skips `_`-prefixed files, and emits static `import`s, not `require`. `pretest` runs it.
5. `src/api/fixtures/README.md` documents naming, shape, variants and test usage for the S-task subagents.

**Files:**
- Create: `src/api/fixtures/` (empty plus `README.md` with the naming rules), `scripts/gen-fixtures.mjs`, `src/api/fixtures.generated.ts`, `src/api/mock/store.ts`
- Modify: `src/api/mock/index.ts`
- Test: `__tests__/api-mock.test.ts` (extend)

**Interfaces:**
- Fixture file: `src/api/fixtures/<endpoint with "/" replaced by "__">.json`, for example `app_karigar__karigarHome.json`. Shape: `{ "endpoint": "app_karigar/karigarHome", "server": "root" | "sfa", "variants": { "default": <response>, "<name>": <response>, … } }`. A `"malformed"` variant is required once a screen uses the endpoint.
- Produces:
  - `setFixtureVariant(endpoint: string, variant: string): void`
  - `resetMock(): void` resets variants and the store
  - `store` with `get<T>(key: string): T`, `set(key, value)`, `reset()`
  - Stateful handlers live in `src/api/mock/handlers/<group>.ts` and call `registerMock`. A registered handler takes precedence over a fixture and may read `fixture(endpoint, variant)`.
- `fixtures.generated.ts` is a static `require` map. Metro can't load dynamically, so `scripts/gen-fixtures.mjs` regenerates it, and `npm test` runs it in `pretest`.

- [ ] **Step 1: Add failing tests** to `__tests__/api-mock.test.ts`:

```ts
test('fixture default variant answers in MOCK', async () => {
  registerFixture({ endpoint: 'test/fx', server: 'root', variants: { default: { status: 'SUCCESS', n: 1 }, other: { status: 'NOT FOUND' } } });
  expect(await db.onPostRequestDataFromApi({}, 'test/fx', db.rootUrl)).toEqual({ status: 'SUCCESS', n: 1 });
  setFixtureVariant('test/fx', 'other');
  expect((await db.onPostRequestDataFromApi({}, 'test/fx', db.rootUrl)).status).toBe('NOT FOUND');
});
test('resetMock restores default variant and clears store', async () => { store.set('k', 1); resetMock(); expect(store.get('k')).toBeUndefined(); });
test('registered handler wins over fixture', async () => { registerMock('test/fx', () => ({ status: 'HANDLER' })); expect((await db.onPostRequestDataFromApi({}, 'test/fx', db.rootUrl)).status).toBe('HANDLER'); });
```
Also export `registerFixture(f: FixtureFile): void`.

- [ ] **Step 2: Run the tests.** Run `npx jest __tests__/api-mock.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `store.ts`, the variant map, `registerFixture`, and auto-registration of every entry in `fixtures.generated.ts` at import time. Add `"pretest": "node scripts/gen-fixtures.mjs"` to `package.json`.
- [ ] **Step 4: Run the tests.** Run `npm test`. Expected: PASS.
- [ ] **Step 5: Commit.** Run `git commit -am "feat(mock): shared endpoint fixtures with variants and stateful store"`.

### Task 6: Request-contract test framework

**Status: DONE 2026-10-30.** Tests 47/47 (12 for the helper), `tsc` and `eslint .` clean.

Deviations and additions:
1. **Transport seam instead of switching `MODE`.** `src/api/client.ts` now always builds the full request (`ApiRequest`: method, url, headers, JSON body, serverURL, fn, data) and hands it to a `Transport`: network in DEV/LIVE, `mockRequest` in MOCK.
   - `expectContract` wraps the transport with `getTransport()`/`setTransport()`, records the request and passes it on, so the call still gets its mock response.
   - Nothing on the wire changed: the existing fetch-level tests (URL, headers, body) pass unchanged.
2. **`expectContract(contract | endpoint, invoke, { loggedIn? })`** accepts an inline `Contract` object or an endpoint name (loaded from `src/api/contracts/`).
   - It also asserts that `helper` and `headers` agree.
   - `"body": "="` means the literal empty body `""` (Ionic's `app_version`), and `"body": null` means no body.
   - Arrays are checked by the shape of their first element.
3. **Pinned negative tests.** Every negative test is pinned to its specific mismatch (`/"otp"/`, `/Web/`, `/crm\/api\/app/`, `/Authorization/`…) so it can't pass for the wrong reason.
4. **Test helpers folder.** `jest.config.js` `testPathIgnorePatterns` excludes `__tests__/helpers/`.
5. **Agent docs.** `src/api/contracts/README.md` documents the format and rules for the S-task subagents.

**Files:**
- Create: `src/api/contracts/README.md`, `__tests__/helpers/contract.ts`
- Test: `__tests__/contract-helper.test.ts`

**Interfaces:**
- Contract file: `src/api/contracts/<group>__<action>.json` = `{ "endpoint": "app_karigar/karigarHome", "helper": "onPostRequestDataFromApi" | "onGetRequestDataFromApi" | "post_rqst" | "get_rqst", "server": "root" | "sfa" | "server_url", "method": "POST" | "GET", "headers": "user" | "tokenOnly", "body": <example body with exact key structure, or null>, "ionicSource": "src/pages/home/home.ts:205" }`.
- Produces: `expectContract(endpoint: string, invoke: () => Promise<unknown>, opts?: { loggedIn?: boolean }): Promise<void>`. It switches `MODE` to `LIVE` with a fake `fetch`, runs `invoke`, and asserts:
  - the URL is `base(server) + endpoint`
  - the method matches
  - the header **set** matches: `user` means `Content-Type` + `Authorization` + `Token` when logged in; `tokenOnly` means `Content-Type` + `Token`
  - the body keys deep-equal the contract's key tree. Leaf values aren't compared, except string literals that start with `=`, such as `"=App"`, which must match exactly.

- [ ] **Step 1: Write the failing test** using an inline contract for `auth/login` (`{ mobile_no: '', mode: '=App' }`, helper `onPostRequestDataFromApi`, server `root`). Cover one passing call, one call with an extra key that must fail, and one with `mode: 'Web'` that must fail.
- [ ] **Step 2: Run the test.** Run `npx jest __tests__/contract-helper.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `expectContract` in `__tests__/helpers/contract.ts`. It loads the JSON from `src/api/contracts/` by endpoint name.
- [ ] **Step 4: Run the test.** Run the same command. Expected: PASS.
- [ ] **Step 5: Commit.** Run `git commit -am "test: request-contract helper"`.

### Task 7: Generated navigation, role tabs, side menu and feature gating

**Status: DONE 2026-10-30.**
- Tests 67/67 (navigation 15, gen-routes 4, app render 3); `tsc` and `eslint .` clean.
- APK rebuilt (79 MB, adds react-native-screens). It now opens on a "Language — not ported yet" placeholder instead of the RN welcome screen.
- The debug merged manifest has the `topbathrn://open` scheme.

Deviations and findings:
1. **Tab sets live centrally in `src/navigation/tabs.ts`**, copied from `tabs.html` (titles = translate keys, icons = Ionic `tabIcon` names), not in each screen's `route.ts`. That's where Ionic defines them, and screens don't need to know about tabs.
   - `RouteMeta` is `{ name, presentation, feature?, links }`, without `roles`/`tab`.
   - `tabsFor(type)` returns `[]` for any type outside the four `*ngIf` blocks, and `RoleTabs` then renders nothing (NOTE parity).
2. **Navigation structure follows Ionic defaults.** `IonicModule.forRoot(MyApp)` has no config, so `tabsHideOnSubPages` is false and every tab has its own stack.
   - Each tab is a native stack that can show any card route, starting at its root (pages pushed from a tab keep the tab bar).
   - Modal routes exist only in the root stack, so they open above the tabs.
   - The root stack holds `Tabs`, all enabled routes, and placeholders for required entry routes (`Language`).
   - The tab navigator names tabs by icon (`tab-home`…) to avoid nested same-name screens.
3. **The side menu is a frame only.** `SideMenuProvider`, `openSideMenu()`/`closeSideMenu()` and swipe disabled match the CMS behaviour. Its item sets are SFA-only content (Employee/DrLogin menus, CRM image hosts), so they move to the **Phase 7 pre-task**.
4. **Unported routes.** `placeholderFor(name)` shows the route name for routes not ported yet (development aid).
5. **Debug links.** `applyDebugLink(link, sessions)` sets fixture variants, session (from `_sessions.json`, Task 12), language, then `resetTo`. It only runs when `__DEV__`, and the scheme is only in `android/app/src/debug/AndroidManifest.xml`.
6. **Jest setup.** `transformIgnorePatterns` gains `@react-navigation`, `react-native-screens` and `react-native-safe-area-context`. `jest.setup.js` uses the safe-area library's own mock, and the render tests unmount their trees.
7. **No gesture-handler dependency** is needed (native-stack, bottom-tabs and the Modal-based menu).

**Files:**
- Create: `src/navigation/types.ts`, `scripts/gen-routes.mjs`, `src/navigation/routes.generated.ts`, `src/navigation/RootNavigator.tsx`, `src/navigation/RoleTabs.tsx`, `src/navigation/SideMenu.tsx` (content per `$IONIC/src/app/app.html` and `app.component.ts:465-678`; opened only via `openSideMenu()`), `src/navigation/debugLinks.ts`
- Modify: `App.tsx` (replace the template with `RootNavigator` inside providers)
- Test: `__tests__/navigation.test.tsx`

**Interfaces:**
- `route.ts` per screen: `export default { name: 'Otp', presentation: 'card' | 'modal', feature?: FeatureKey, roles?: Role[], links: string[], tab?: { role: Role[]; index: number; label: string; icon: string } } satisfies RouteDef`
  - `links` holds every route name this screen can navigate to, taken from the card's nav targets. Every S-task fills it, and the Phase 6 reachability test reads it.
- Produces:
  - `RouteDef`
  - `routes: RouteDef[]` (generated)
  - `tabsFor(role: Role): RouteDef[]`, ordered by `tab.index`
  - `isRouteEnabled(r: RouteDef, c: ClientConfig): boolean`, which returns false when `r.feature` is set and `c.features[r.feature]` is false
  - `RootNavigator`
  - `navigationRef`
  - `openSideMenu()`
  - `resetTo(name: string, params?: object)`
- Tab sets follow `$IONIC/src/pages/tabs/tabs.html`:
  - `Plumber`/`Sales_Boy`/`Dealer`: Home · OfferList · PointList · Profile · MainHome
  - `Sales_Executive`: SalesExecHome · OfferList · PointList · Profile · MainHome
  - `Customer`/`Retailer`: Home · Newarrivals · Contact · About · Profile
- Debug-only deep link (`__DEV__` only): `topbathrn://open?screen=<Name>&role=<Role>&variant=<endpoint:variant,...>&params=<urlencoded JSON>&lang=<code>`. It seeds `userStorageData` for the role from `src/api/fixtures/_sessions.json`, sets the fixture variants, then `resetTo` the screen. Maestro and parity capture use it.

- [ ] **Step 1: Write the failing tests:**

```ts
test('flagged route disabled for topbath', () => expect(isRouteEnabled({ name: 'Dashboard', feature: 'sfa' } as RouteDef, topbath)).toBe(false));
test('flagged route enabled for _all-features', () => expect(isRouteEnabled({ name: 'Dashboard', feature: 'sfa' } as RouteDef, allFeatures)).toBe(true));
test('Plumber tabs match Ionic order', () => expect(tabsFor('Plumber').map(t => t.name)).toEqual(['Home','OfferList','PointList','Profile','MainHome']));
test('Sales_Executive first tab is SalesExecHome', () => expect(tabsFor('Sales_Executive')[0].name).toBe('SalesExecHome'));
test('debug links are ignored in release', () => expect(parseDebugLink('topbathrn://open?screen=Home', { dev: false })).toBeNull());
```
Use placeholder screens for the tests: generated stubs `src/screens/_Placeholder*`, which are deleted as real screens land. Alternatively, `tabsFor` can work on `RouteDef` metadata only.

- [ ] **Step 2: Run the tests.** Run `npx jest __tests__/navigation.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `gen-routes.mjs` globs `src/screens/*/route.ts` and writes static imports. Add it to `pretest` and to a `prestart` script.
  - Install `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `react-native-screens`, and `react-native-gesture-handler` for the drawer.
  - The side menu uses a plain `Modal` drawer, which matches Ionic's overlay menu with swipe disabled.
  - Register the `topbathrn` scheme in `AndroidManifest.xml` under the debug manifest only (`android/app/src/debug/AndroidManifest.xml`).
- [ ] **Step 4: Run the tests and build.** Run `npm test` and `cd android && ./gradlew assembleDebug`. Expected: PASS and BUILD SUCCESSFUL.
- [ ] **Step 5: Commit.** Run `git commit -am "feat(nav): generated routes, role tabs, side menu, feature gating, debug deep links"`.

### Task 8: App-level behaviour (start-up, session, version check, back button)

**Status: DONE 2026-10-30** (splash moved to Task 8b). Tests 118/118, `tsc` and `eslint .` clean, APK rebuilt (80 MB).

Dev server check (read-only `POST app_karigar/app_version`, Dhruv approved): it returns `{"app_version":"0.1.5","ios_app_version":"0.0.1","play_console_flag":0}`. The version matches, so the DEV APK shows no update alert. `ios_app_version` is ignored by Ionic (Android-only check) and noted for Phase 10.

Findings from reading `app.component.ts` and how they were ported:
1. **Back rules.** The "select first tab" list is **GiftList, Transaction, Profile, MainHome** only. OfferList and PointList tab roots fall through to the exit question (NOTE parity). The ignore list includes `DealerAddorder`. The tab navigator uses `backBehavior="none"` so only these rules decide.
2. **Start-up branches** (`src/app/startup.ts`):
   - no token → Language
   - token with a non-CMS loginType → **Blank** (SFA branches are commented out in Ionic)
   - profile `SUCCESS`: `del=='1'` → "Message!"/"Your Account has been suspended"/OK, session `{}`, then Language; otherwise Tabs + push after 2 s
   - `SUCCESS` without a karigar object → **Blank** (Ionic throws inside subscribe)
   - other status → session `{}` + **Blank**
   - request error → Tabs
   - The plan's `'Blank'` route is an empty root screen.
3. **Version check** (`src/app/versionCheck.ts`):
   - Loose `!=`, so a missing `app_version` shows the alert.
   - The store link is `market://details?id=<playStoreId>&hl=en`.
   - Forced: both buttons exit, and dismissing re-checks.
   - The installed version is `client.versionName`. Gradle sets the APK versionName from the same value, which equals Ionic's `AppVersion.getVersionNumber()`. No native dependency is needed. Task 10's `getInstalledVersion` may replace it.
4. **Status bar / frame** (`src/app/frame.ts`, `AppFrame.tsx`). RN 0.88 is edge-to-edge (`edgeToEdgeEnabled=true`), and `StatusBar` has no `backgroundColor`/`translucent` any more, so the Ionic look is drawn explicitly:
   - Below Android 15: a `#002d25` band of status-bar height and light icons, plus a black band of nav-bar height (Ionic's WebView ends above the nav bar). **The nav-bar black is to be confirmed on a device against the store app.**
   - Android 15+: nothing for 2 s, then `body.android-15` (border-top 30 black, height 94%), copied with its delay.
5. **Overlays.** `src/ui/overlays.ts` (`showAlert`, `isOverlayOpen`, `dismissTopOverlay`) is the overlay interface. For now its body is RN's native `Alert` (same texts and buttons, different look), and **Task 9 replaces the body** with the replica.
6. **Auth** (`src/auth/otp.ts`, `session.ts`):
   - The bypass numbers get the **string** `'123456'` and other numbers a **number** (Ionic's body difference is kept), with a loose `==` check.
   - `session.load()` returns null for missing or corrupt data. `saveLoginResult` adds `token` + `loginType:'CMS'`. `clear()` writes `{}`.
7. **Push.** `src/native/push.ts` `initPushNotification()` is a no-op unless `features.push` (Topbath is off). It's filled in Phase 8.
8. **Splash → Task 8b.** cordova-android 12 replaced the splash plugin with the Android 12 SplashScreen API: icon `resources/splash.png`, hidden at `platform.ready` with a 3 s fade (`FadeSplashScreenDuration`). `SplashShowOnlyFirstTime` is not supported by cordova-android ≥ 11. The exact behaviour has to be matched natively and checked on a device against the store app, so it is a separate task.

### Task 8b: Splash screen (Android 12+ SplashScreen API)

**Status** (2026-11-01): DONE. Verified on Dhruv's phone (OnePlus CPH2707, Android 16) against the Play Store app: timed cold-start screenshots of both apps show a 0.00% pixel difference below the status bar for the first ~3 s, and the fade starts at the same moment. Details and citations: `docs/splash-parity.md`.
- The shipped app (cordova-android 12.0.1) uses the native androidx core-splashscreen 1.0.0 splash on **every cold start**: white `#FFFFFF` background, `resources/splash.png` as the icon (Android 12 icon rules: 240dp, circle mask), held for a fixed 3000 ms (`SplashScreenDelay`) from activity start, then faded out over 3000 ms with `AccelerateInterpolator` (`SplashScreenPlugin.java`).
- **The plan below was wrong on two points:** there is no JS overlay, and "first launch only" does not apply. `SplashShowOnlyFirstTime`, `SplashMaintainAspectRatio`, `SplashScreen="screen"`, `ShowSplashScreenSpinner` and `ShowSplashScreen` are dead under cordova-android 12. `splashScreen.hide()` in `app.component.ts:118` is a no-op, because `AutoHideSplashScreen` is true.
- RN: `MainActivity.kt` uses `installSplashScreen()` with the same 3000 ms hold and 3000 ms accelerating fade, and `Theme.App.SplashScreen` matches the shipped theme. `use-client.mjs` copies `clients/<id>/assets/splash.png` and writes the optional `splashBackground` colour.
- To check on device: icon size and mask, hold and fade timing, the window colour behind the fade (RN `AppTheme` vs Ionic `Theme.AppCompat.NoActionBar`), and Android below 12.

- Theme `Theme.SplashScreen` with `windowSplashScreenAnimatedIcon` from the client's `splash.png` (via `use-client.mjs`) and the Cordova default background.
- Keep it on screen until the start-up decision is made, then fade out over 3000 ms (`FadeSplashScreenDuration`) with `androidx.core:core-splashscreen` `setOnExitAnimationListener`.
- Verify side by side with the Play Store app on Dhruv's phone before marking done.

**Files:**
- Create: `src/auth/session.ts`, `src/auth/otp.ts`, `src/app/startup.ts`, `src/app/versionCheck.ts`, `src/app/backButton.ts`
- Test: `__tests__/startup.test.ts`, `__tests__/versionCheck.test.ts`, `__tests__/backButton.test.ts`, `src/api/contracts/app_karigar__profile.json`, `src/api/contracts/app_karigar__app_version.json`, fixtures for both (variants `default`, `suspended`, `notSuccess`, `forced`, `malformed`)

**Interfaces:**
- `decideStartRoute(storage, api): Promise<{ route: 'Language' | 'Tabs' | 'Blank'; alert?: 'suspended'; startPushAfterMs?: 2000 }>`, ported from `app.component.ts:137-160,401-462`. The non-SUCCESS case returns `'Blank'`, an empty root view, with `// NOTE (parity): Ionic leaves no root page here (app.component.ts:443-448)`. This follows spec §2a.
- `checkVersion(installed: string, api): Promise<{ show: false } | { show: true; forced: boolean; storeUrl: string }>`, ported from `:778-842`. Strict `!==`. `storeUrl` = `market://details?id=${client.playStoreId}`. In `MOCK` mode the fixture `default` returns `app_version` equal to `client.versionName`.
- `handleBack(state: { overlayOpen: boolean; routeName: string; canGoBack: boolean; tabIndex: number | null }): 'dismissOverlay' | 'ignore' | 'pop' | 'selectTab0' | 'confirmExit'`. The rules come from `app.component.ts:165-243`, and the ignore list is `Home`, `MobileLogin`, `Otp`, `DealerHome`, `Dashboard`, `SelectRegistrationType`, `DealerAddorder`.
- `session.save(user, token)`, `session.load()`, `session.clear()`. `clear()` writes `{}` to `userStorageData`, matching Ionic. `session.load()` returns `null` for `{}`, a missing token, or JSON that won't parse.
- `otp.generate(mobile: string): string` and `otp.matches(input, expected): boolean`. Both are copied from `mobile-login.ts:104-112` and `otp.ts:201-207` (bypass numbers included), marked `// NOTE (security, not changed)`.

- [ ] **Step 1: Write the failing tests** covering:
  - no token → `Language`
  - a token with `loginType: 'CMS'` and the `default` profile → `Tabs` with `startPushAfterMs: 2000`
  - `suspended` (`karigar.del == '1'`) → `Language` + `alert: 'suspended'`, with storage cleared
  - `notSuccess` → `Blank`, with storage cleared
  - **Review Focus 1:** `userStorageData` set to `{}`, `'garbage{'` or `{ token: '' }` → `Language`, with no throw
  - a version mismatch with `play_console_flag: 0` → `{ show: true, forced: false }`
  - the `forced` variant → `forced: true`
  - equal versions → `{ show: false }`
  - `handleBack` gives one case per rule
  - `otp.generate('1212121212')` returns `'123456'`
  - a contract test for `app_karigar/profile` via `expectContract` (body `{ karigar_id }`) and for `app_karigar/app_version` (body `""`)
- [ ] **Step 2: Run the tests.** Run `npx jest __tests__/startup.test.ts __tests__/versionCheck.test.ts __tests__/backButton.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** and wire everything into `App.tsx`:
  - The start route comes from `decideStartRoute`.
  - The version alert uses the Ionic alert replica (`showAlert` from Task 9) with the exact Ionic title, message and button texts from `app.component.ts:807-809`. Task 8 runs before Task 9, so it calls the `showAlert` interface through a temporary stub, and Task 9 swaps in the replica.
  - `BackHandler` calls `handleBack`.
  - The status bar colour is `client.colors.statusBar`, with `overlaysWebView(false)` behaviour (not translucent).
  - Splash, per `config.xml:16-24`: the Android 12+ splash API shows `resources/splash.png` (via `use-client`). A JS overlay holds it for 3000 ms, then fades it out, and it's shown only on first launch (`SplashShowOnlyFirstTime`, flag kept in AsyncStorage key `__rn_splash_shown`). Test: a second launch skips the overlay.
- [ ] **Step 4: Run the tests and build.** Run `npm test` and `./gradlew assembleDebug`. Expected: PASS. On the phone the app opens to a placeholder Language route.
- [ ] **Step 5: Commit.** Run `git commit -am "feat(app): start-up, session, version check, back button"`.

### Task 9: Ionic md-mode replica kit and exact fonts

**Done in parts.** All five parts are DONE: part 1 (fonts, icons, base values), part 2 (popups), part 3 (pickers), part 4 (page structure) and part 5 (content controls).

**Part 5 — status** (2026-11-01).
- Built by two Sonnet implementers in parallel (5A forms/lists, 5B scrolling/interactive), each reviewed by its own independent Sonnet reviewer (14 + 20 findings), then fixed by fresh fixer agents (the original agents could not be resumed after a session restart).
- Tests 389/389; `tsc` and `eslint .` clean (warnings only).
- Checked on the Android 16 emulator: pull-to-refresh (pull, ready arrow, circles spinner, complete), infinite scroll (bubbles, 30 → 60 rows), fab, segments (Topbath and md default), searchbars, slides, buttons, radio list, checkboxes, cs-input / plain / `.edit` floating fields, card, grid.
- Usage survey (HTML comments stripped): ion-item 324, ion-input 208, ion-label 324 (222 floating), button ion-button 101, ion-refresher 29, ion-infinite-scroll 26, ion-searchbar 20, ion-slides 12, ion-segment 5, ion-fab 5, iframes 5. Unused, so not built: toggle, badge, avatar, thumbnail, note, item-divider, item-sliding, range, card-title/content.

What landed:
- 5A: `IonContent` (+ `IonGrid/Row/Col`), `IonButton`, `IonList/IonListHeader/IonItem/IonLabel`, `IonInput/IonTextarea/IonInputItem`, `IonRadioGroup/IonRadio/IonCheckbox`, `IonCard`. Values are in `src/theme/ionicMdContent.ts`; `ionPadding` covers `[padding]` on non-content elements.
- 5B: `IonSegment`, `IonSearchbar`, `IonSpinner` (bubbles, circles), `IonRefresher`, `IonInfiniteScroll`, `IonFab`, `IonSlides`, `WebEmbed` (react-native-webview 14.0.1, builds on RN 0.88 New Architecture) and `ImageViewer` (the ViewProfilePage modal, not a plugin). Values are in `src/theme/ionicMdScroll.ts`.
- `IonContent` is the single ion-content: it hosts the scroll context, the refresher and infinite scroll (`IonScrollView` removed).
- Pull-to-refresh is driven by native scrolling into a transparent spacer above scrollTop 0, not by a JS gesture (a PanResponder loses the touch to Android's ScrollView). The scroll content is opaque below the spacer, so the refresher only shows through the pulled gap.
- Lint: `src/screens/**` also bans `Alert.alert`, `ToastAndroid`, `@react-native-community/datetimepicker` and `react-native-vector-icons`.
- Reference sources moved to the git-ignored `.reference/` folder (npm tarballs + `main.css` from `topsan.aab`), excluded from Jest, tsc, eslint and Metro.

Behaviour copied (`NOTE (parity)` in code):
- `TimeoutDebouncer(0)` runs synchronously (`util/debouncer.js:12-13`): checkbox and segment `ionChange` fire immediately, before the page's `(click)`.
- Radio group: the null first write is skipped, then the initial model value emits `ionChange` once (even when undefined); re-tapping the selected radio emits again. The checkbox `ionChange` payload is `{ checked, value, disabled }`.
- Slides autoplay stops for good after wrapping to slide 0 (Swiper `slideTo` without the internal flag). The period is 3300 ms, and a drag stops autoplay.
- Searchbar: `ionInput` is debounced 250 ms, `ngModelChange` is immediate, `ionClear` fires twice per tap, and the default type is `search`.
- Refresher `pullMax` is fixed at 120; scrolling is frozen while refreshing, cancelling or completing.
- **The plain floating label is half clipped at rest.** Topbath's `input{margin:0!important}` removes the input margins, so the label overflows the `overflow:hidden` wrapper. Confirmed by rendering the Ionic markup with the shipped `main.css` in headless Chrome (`.reference/render/float.html`).
- 3 iframes keep the default inset border because of the `rameborder` typo.

Bugs found only on the emulator (all tests passed):
- `ion-slides{height:100%}` made the slides as tall as the whole page in RN; CSS treats it as auto here.
- The refresher text showed through content that has no background.
- The floating input collapsed to 0 height: `flex:1` means basis 0 in RN, but content height in CSS for an auto-height column.

**To check in the Task 11 parity harness:**
- Line heights: RN `normalLineHeight` gives 19 where Chrome measures 18 at 16px, so plain items and floating fields may be 1dp taller.
- Webview inset border colours, pager bullet offset (~3-4px), refresher and infinite-scroll heights, slide swipe physics, search icon crop, the Android scroll indicator.
- Typed-text capitalize in searchbars can't be reproduced; only the placeholder is capitalized.

**Part 4 — status** (2026-11-01).
- Process as before: a Sonnet implementer, an independent Sonnet reviewer (7 findings), all fixed.
- Tests 283/283; `tsc` and `eslint .` clean.
- Checked on the Android 16 emulator: every navbar variant and tab set in the gallery, push and pop, and hardware back during a push (it is queued, then pops).

What landed:
- `IonNavbar` (+ `Header`, `IonHeader`, `IonToolbar`, `IonTitle`, `IonButtons`, `IonBarButton`). Supports every header pattern used by the 110 page `.html` files: `main-header`, `main-header remove`, `no-border`, plain, primary/white/light, `h80`, `toolbarHeight`, `ion-buttons end`, `menuToggle`.
- `IonTabBar` / `IonTabButton` as the bottom-tabs `tabBar`. Topbath's SVG tab icons are client assets (`clients/topbath/assets/tab-icons/` + `icons.json`), embedded by `scripts/use-client.mjs` into `src/assets/client/tabIcons.ts`.
- `IonStack` (`src/navigation/IonStack.tsx`, `pageTransition.ts`): a small JS stack on React Navigation's `StackRouter`, because native-stack cannot do Ionic's offsets, durations and curves on Android. No new dependencies.
- Values with citations are in `src/theme/ionicMdPage.ts`.

Corrections to this plan, from the Ionic 3.9.5 source:
- The md page transition offset is **40px**, not 56px (`transition-md.js`). Push: entering page only, 280 ms, `cubic-bezier(.36,.66,.04,1)`. Pop: leaving page only, 200 ms, `cubic-bezier(.47,0,.745,.715)`.
- The md modal transition is 280 ms in / 200 ms out (`ModalMDSlideIn/Out`), not 400 ms.

Behaviour copied:
- `setRoot`/reset is instant (`nav-controller-base.js:145-152`: `setPages` defaults `animate` to false).
- Navigation arriving during a transition is queued and run afterwards (Ionic `_queueTrns`).
- Modal pages show no back button (`view-controller.js:169-178` `enableBack`).
- Re-tapping the selected tab pops its stack to the root; tab switches are not animated.
- `.tabbar a:gt(3)` is invalid CSS and is dropped (all five tabs show); tabs have no ripple; `tab-gift` draws `arrivals.svg`.

**To check in the Task 11 parity harness:**
- Tab label truncation ("New Arriva…" in the customer tab set): Ionic has both `text-overflow:ellipsis; white-space:nowrap` and a `white-space:normal` rule in main.css; confirm which wins.
- Icon vertical position in icon-only bar buttons (Ionic line-height .67).
- Navbar and tab-bar shadows drawn over page content.

Not built: the `Tabs.select` setRoot fallback (unreachable in this app; NOTE in `IonTabs.tsx`).


**Part 3 — status** (2026-10-31).
- Process as in part 2: a Sonnet implementer, then an independent Sonnet reviewer (9 findings: 7 confirmed, 2 plausible), then 8 fixed.
- Tests 253/253; `tsc` and `eslint .` clean.
- Emulator screenshots checked: the `.edit` form fields, the selectable modal titled "State *", the date wheel, and the select alert.

What landed:
- `IonSelect` (alert interface, reusing the part 2 Alert).
- `IonDatetime` + `Picker`: md flat wheel (no highlight bands in md), 43px options, primary-coloured selection, 400/450 ms transitions.
- `IonicSelectable` (ionic-selectable **3.5.0**, the lockfile version, not 3.4) and `SelectSearchable` (2.10.0, SFA), with `open()`/`close()` refs.
- `IonField`, with variants for Topbath's `cs-select`/`cs-date` (main-field), `edit` / `editCsSelect` / `editCsNormalSelect` / `editCsSelectable` and floating labels.
- Logic ports: `src/ui/datetimeUtil.ts` (datetime-util.js), `datetimePicker.ts` (datetime.js) and `selectableModel.ts`.
- Values with citations are in `src/theme/ionicMdPickers.ts`.

Behaviour copied:
- ionChange is skipped on the first external write (base-input `_initModel`).
- `min=""` makes the picker open nothing (Ionic throws inside) and never crash.
- An `undefined` value keeps the previous text.
- Clear order is onChange → onClear → close, and `onClose` fires after the transition.
- **Hardware back with a selectable modal open shows the "App termination" alert.** This is verified through `app.js` getActiveNavs and `app.component.ts`.
- Back with the picker or select alert open dismisses it with no handler.

Labels: screens pass `labelText`, the exact `textContent` of the Ionic label (e.g. "State *", "Select plumber*"), and that string is used for popup titles.

**To check in the Task 11 parity harness:**
- An `ion-select` inside an `.edit` `cs-select` keeps its own `#b5b5b5` bordered box (main.css 7967). It follows the CSS but looks odd.
- Floating labels outside `.edit` pages use the generic md rules only.

Not built (unused by Topbath): selectable `startSearch`/`endSearch` spinner, groups, add/save/delete templates, infinite scroll; ion-select action-sheet and popover interfaces.

**Part 2 — status.**
- Built by a Sonnet 5.5 implementer and reviewed by a separate Sonnet 5.5 reviewer against Ionic 3.9.5 source and the shipped `main.css`. All 5 confirmed findings were fixed in one round.
- Tests 191/191; `tsc` and `eslint .` clean.
- Verified on the Android 16 emulator: the real hardware-back exit alert, every gallery variant, and the backdrop showing the page through it (action sheet 0.26, alert 0.5).

What landed:
- `src/ui/overlays.ts` is a stack-backed API: `showAlert`, `showLoading`, `showToast`, `showActionSheet`, `isOverlayOpen`, `dismissTopOverlay`, `notifyPageChange`.
- `src/ui/useLoader.ts`.
- Replicas in `src/components/ionic/` (Alert, Loading, Toast, ActionSheet, OverlayHost, Backdrop, Spinner with crescent + the Topbath 8-dot gif loader, RippleButton). Values with citations are in `src/theme/ionicMdOverlays.ts`.
- `<OverlayHost/>` is mounted inside `AppFrame`, so popups share the app area (94% on Android 15+, as in Ionic). `react-native-svg` was added for the exact crescent arc.

Topbath overrides applied (cascade checked against the compiled `main.css`):
- `margin:0 !important` on `h1-h6,p,span,button,input` (`variables.scss:390-399`).
- Alert title 16px (`:12316`).
- `.alert-modal` (Stop Time; dashboard/end-checkin/travel-add/travel-list): bold title, green and red 50% buttons.
- Action sheets fully restyled (`:4338-4390`): rounded white sheet, 2-per-row buttons, maroon/green icons, centred bold Cancel.
- Loading wrapper transparent with a white content box (`:9940-9947`).
- The `cssClass` values `action-close`, `close-action-sheet`, `sheet-m*` and `cs-*` have no rules and change nothing.

Behaviour copied:
- Cancel-role handler on backdrop tap; a handler returning `false` keeps the popup open.
- Radio, checkbox and input values reach the handlers.
- `onDidDismiss` fires after the leave animation.
- Click-block on enter (enter + 64 ms) and on leave (max(400, leave + 64) ms); toasts never block.
- Hardware back dismisses the **oldest** alert or action sheet with no handler (`app.component.ts:167` `_views[0]`). Loading and toast don't count.

Known limits (documented in code): no shadow before Android 9; only plain text plus the Topbath gif `<img>` in popup HTML; `dismissOnPageChange` is timer-based after navigation.

**Part 1 — status.**
- Tests 139/139; `tsc` and `eslint .` clean.
- Verified on the Android 16 emulator in the debug-only `_ComponentGallery`: all faces, 600→Bold, italics, condensed, ₹, the Hindi fallback, all 16 Ionicons names and all 57 Material Icons names used by the app render.

Findings and decisions:
1. **Fonts** live in `android/app/src/main/assets/fonts/` (README there lists the sources).
   - Roboto 300/400/400i/500/500i/700 and Roboto Condensed 400 come from Google Fonts **with `latin-ext`** (carries ₹), plus Material Icons.
   - `ionicons.ttf` comes from npm `ionicons@3.0.0`; the shipped app's woff/woff2 are md5-identical to it, so **no fonttools needed**.
   - Open Sans, Colfax and DS-Digital are referenced in the SCSS but never loaded, so they're not bundled and fall back to Roboto, as in Ionic.
   - The shipped app bundles no Roboto of its own, so it's Google's.
2. **`fontFor(weight, { italic, family })`** (`src/theme/typography.ts`) implements CSS font matching:
   - 600 → Bold.
   - Style is matched before weight: bold italic uses MediumItalic with bold synthesised.
   - Condensed ≥600 gets bold synthesised.
   - Screens must use it instead of `fontWeight` on default fonts.
3. **Icons.** `IonIcon` (md- resolution, glyph map `src/components/ionic/ionicons3.json` from `scripts/gen-ionicons-map.mjs`, 934 names) and `MaterialIcon` (ligatures, 24px default).
4. **Base values file location.** It's `src/theme/ionicMd.ts`, not `src/components/ionic/tokens.ts`, because the no-client-strings lint rule bans hex in `src/components`.
   - Topbath's `variables.scss` overrides **none** of Ionic's 2,028 `!default` variables except `$colors`, `$font-path` and `$app-direction`, so Ionic defaults apply.
   - Global selector overrides in `variables.scss` (e.g. toolbar or alert classes) are handled per control in parts 2–5.
5. **Debug tools in sideloaded APKs.** `-PbundleDebugJs` bundles JS in release mode (`__DEV__` false), which silently disabled the debug links and the gallery.
   - Added the native `BuildInfo` module (`BuildInfoPackage.kt`, `BuildConfig.DEBUG`) and `src/config/buildInfo.ts` `debugToolsEnabled`.
   - Debug APKs (bundled or not) get the test tools; release builds don't.
6. **Emulators.** AVDs `tb_api36` (Android 16) and `tb_api33` (Android 13), x86_64, are available for visual checks. Build `-PreactNativeArchitectures=x86_64` for them, and rebuild the arm APK for the phone afterwards (same output path).

**Files:**
- `src/components/ionic/*.tsx` (the replicas) and `src/components/{Header,WebEmbed,ImageViewer}.tsx`, exported from `src/components/index.ts`
- `src/components/ionic/tokens.ts`: md-mode values copied from `ionic-angular@3.9.5` SCSS. Read them from `$IONIC/node_modules` or the npm tarball `ionic-angular-3.9.5/src/**/*.md.scss` and `src/themes/ionic.globals.md.scss`, and cite file:line for every value.
- `assets/fonts/`:
  - `Ionicons.ttf`, converted from the shipped `assets/fonts/ionicons.woff2` (extract it from `$IONIC/topsan.aab` `base/assets/www/assets/fonts/` with `fonttools`)
  - `MaterialIcons-Regular.ttf`
  - `Roboto-*.ttf` and `RobotoCondensed-*.ttf`, at the weights `variables.scss` uses
- `src/components/ionic/ionicons3.json`: glyph map from `ionicons@3.0.0/dist/css/ionicons.css` content codes
- Link the fonts with `react-native.config.js` assets plus `npx react-native-asset`
- Test: `__tests__/components.test.tsx`

**Interfaces** (Ionic equivalent in brackets):
- `IonIcon({ name: string /* v3 name e.g. 'md-arrow-back' */, size?, color? })`. `MaterialIcon({ name, size?, color? })`.
- `showAlert(opts: { title?: string; subTitle?: string; message?: string; inputs?: { type: 'radio'|'checkbox'|'text'|'number'|'tel'; label?; value?; checked?; placeholder? }[]; buttons: (string | { text: string; role?: 'cancel'; handler?: (data) => boolean | void })[]; enableBackdropDismiss?: boolean }): { dismiss(): void }` [AlertController]. `onDidDismiss` support is needed for the forced-update loop.
- `useLoader(): { show(content = 'Please wait...'): void; hide(): void; wrap<T>(p: Promise<T>): Promise<T> }` [LoadingController, md spinner `crescent`]
- `showToast(message, { duration = 3000, position = 'bottom' | 'top' | 'middle', showCloseButton?, closeButtonText? })` [ToastController]
- `showActionSheet({ title?, buttons: { text; role?; icon?; handler? }[] })` [ActionSheetController]
- `IonSelect({ value, onChange, options: { value; label }[], title?, multiple?, okText = 'OK', cancelText = 'Cancel', placeholder? })` [ion-select, alert interface]
- `IonDatetime({ value, onChange, displayFormat, pickerFormat?, min?, max?, placeholder?, doneText = 'Done', cancelText = 'Cancel' })` [ion-datetime with the md picker wheel]
- `IonicSelectable<T>({ items, value, onChange, itemTextField, itemValueField, canSearch, searchPlaceholder, title })` [ionic-selectable 3.4 modal]
- `IonNavbar({ title, back?, right?, color = 'primary' })`, plus `Header` as an alias [ion-navbar md: 56dp, title 20sp/500]
- `IonTabs`, the tab-bar replica used by `RoleTabs` [ion-tabs md, with the SVG tab icons from `variables.scss:1570+`]
- `IonSegment`, `IonSearchbar`, `IonRefresher` (via the `RefreshControl` colour/offset and md spinner), `IonInfiniteScroll` (md crescent spinner at list end), `IonFab`, `IonItem`, `IonList`, `IonCard`, `IonButton` (md ripple, `clear` / `outline` / `block` / `round`), `IonRadio`, `IonCheckbox`, `IonToggle`, `IonBadge`, `IonSlides` [ion-slides with pager and autoplay]
- `pageTransition`: React Navigation `cardStyleInterpolator` / `animation` config that reproduces the Ionic md page transition (translateY 56px→0 + opacity, 280 ms, `cubic-bezier(0.36,0.66,0.04,1)`), and the modal slide-up (400 ms)
- `WebEmbed({ uri, height })` [iframe]; `ImageViewer({ uri, visible, onClose })`

- [ ] **Step 1: Write the failing tests:**
  - every replica renders
  - `showAlert` with `inputs: [{ type: 'radio' … }]` returns the checked value to the button handler
  - a handler returning `false` keeps the alert open (Ionic behaviour)
  - `IonSelect` shows the OK and Cancel texts
  - `IonicSelectable` filters by search text
  - `IonIcon` resolves `'md-arrow-back'` to the v3 codepoint from `ionicons3.json`
  - **Review Focus 4:** `useLoader().wrap(Promise.reject(new Error()))` hides the loader and rethrows, and unmounting while it's shown hides it
  - `IonInfiniteScroll` triggers at the list end
- [ ] **Step 2: Run the tests.** Run `npx jest __tests__/components.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement the kit.**
  - Every size, colour, radius, shadow, font and duration comes from `tokens.ts`, with citations, or from `theme`.
  - Install `react-native-webview` and `react-native-pager-view` (for slides). Do **not** install `react-native-vector-icons/Ionicons` glyph sets; use the bundled fonts through `Text` with `fontFamily`.
  - Extend the Task 4 lint rule: ban `Alert.alert`, `ToastAndroid`, `@react-native-community/datetimepicker` and `react-native-vector-icons` imports in `src/screens/**`.
- [ ] **Step 4: Run the tests and lint.** Run `npm test && npx eslint src`. Expected: PASS.
- [ ] **Step 5: Commit.** Run `git commit -am "feat(components): Ionic 3 md-mode replica kit with exact fonts and icons"`.
- [ ] **Step 6 (after Task 11): Component parity.** **Status** (2026-11-02): states, Ionic harness page and RN route are BUILT (49 states, reference PNGs checked by eye); RN captures and sign-off are still to do (the lead captures). Implemented as the debug route `_ComponentState` (`src/dev/componentStates.tsx`) and the Ionic page `ParityGalleryPage` (`parity/reference/gallery/`, installed by `build-ionic.sh` through `install-gallery.js`); see `parity/README.md` "Component parity states". Not covered: refresher, WebEmbed, navbar menuToggle.
  - Add a debug-only `ComponentGallery` route. Add `parity/states.d/_components.json`: one state per replica and variant (alert plain, radio and checkbox; loader; toast top and bottom; action sheet; select; datetime wheel; selectable; navbar; each tab set; segment; searchbar; buttons; items; card; fab; badge; slides).
  - On the Ionic side each state renders the same component through `ionicNav` on a harness page built from the Ionic app's own components. `parity/reference/gallery.page.ts` is compiled into the reference build, in the work copy only.
  - **Every component state is signed off before Phase 1 starts.** Run `node parity/reference/capture.mjs --only _components.` and `node parity/capture-rn.mjs --only _components.`, then sign off in the report.

### Task 10: Native wrappers with MOCK implementations

**Status** (2026-11-01): DONE except the phone checks listed below. Built by a Sonnet implementer, reviewed by an independent Sonnet reviewer (16 findings), fixed, then checked on the Android 16 emulator. Tests 431/431.
- **Shipped plugins** (from `topsan.aab` `cordova_plugins.js`): barcodescanner 8.1.0, camera 7.0.0, geolocation 4.1.0, request-location-accuracy 2.3.0, x-socialsharing 6.0.4, inappbrowser 3.2.0, app-version 0.1.9, network-information 3.0.0. **Used by pages but not shipped:** file-transfer, launch-navigator, native-geocoder, diagnostic, android-permissions, media-capture, push.
- **Scanner:** the plugin's own `barcodescanner-release-2.1.5.aar` (byte-identical) launched by `ScannerModule` with the plugin's exact intent extras, so it is the same ZXing screen. A `LocalBroadcastManager` shim forwards to AndroidX. Cancel resolves `ok('')`, because the pages assign `resp.text` before checking it.
- **Camera/gallery:** a Kotlin `CameraModule` ports `CameraLauncher.java` (GET_CONTENT chooser "Get Picture", ACTION_IMAGE_CAPTURE, its scaling, JPEG re-encode, no EXIF rotation, so portrait photos stay sideways as in production). `react-native-image-picker` was removed. Permissions are asked at call time, as the plugin does.
- **Location:** `LocationAccuracyModule` (play-services-location 21.3.0) mirrors the accuracy plugin, including its "already in progress" guard; `@react-native-community/geolocation` 3.4.0 with the WebView defaults when no options are passed (maximumAge 0, no timeout, low accuracy).
- **Other wrappers:** share (own Kotlin module, plugin download folder and chooser), browser (`Linking`), app version (`BuildInfo.versionName`), network (`@react-native-community/netinfo` 12.0.1).
- **Feature-gated:** `reverseGeocode`, `openNavigation` and **`uploadMultipart`** return `unavailable` unless `nativeGeocode` / `nativeNavigation` / **`nativeUpload`** is on (all off for Topbath). Production uploads are broken: the complaint-with-video loader never closes, and dispatch-with-photos skips its toast and refresh. Screens must replicate that.
- **Manifest** matches the shipped permission set and `<queries>`.
- **Emulator results:** camera prompt, then the ZXing scanner (viewfinder, laser, hint); photos prompt, then the system photo picker (Android 14+ routes GET_CONTENT for images there, for the shipped app too); location accuracy dialog, then the location prompt, then a fix.
- **Scanner layout:** on the emulator the hint text sat under the navigation bar and looked like a bug, so a padding "fix" was added. Then Dhruv's phone showed that the Play Store scanner *also* draws edge-to-edge (camera 0-2378 px, hint at 2321-2378 overlapping the nav handle, status bar hidden). The fix was removed; RN now matches it exactly (0.107% pixel diff, the laser line's pulse).
- **Deliberately not ported:** the camera plugin's `checkForDuplicateImage` (it can delete the user's newest gallery photo) and its real-path lookup.

**Phone checks** (2026-11-01, Dhruv's phone, Android 16):
- Scanner: identical to the Play Store app (see above).
- No-options location: returns a fix immediately (the emulator just has no network provider).
- Camera: a portrait photo returned a ~24 KB JPEG data URL. Gallery: picked photo returned as a re-encoded JPEG.
- **Share was broken and is fixed.** The module was named `ShareModule`, the same name as React Native core's Share API module, which shadowed it ("Expected argument 0 of method share to be a Object"). It's renamed `SocialSharingModule`; the share sheet now opens with the text. The Jest tests mocked the module and could not catch the name clash.
- Still open: photo orientation and image (FileProvider) share are checked again when the first screens that use them are ported.

**Files:** `src/native/{scanner,camera,location,share,browser,appVersion,geocode,navigate,upload,network,push}.ts` and `src/native/index.ts`. Modify `android/app/src/main/AndroidManifest.xml` (CAMERA, ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, INTERNET; POST_NOTIFICATIONS is added in Phase 8). Test: `__tests__/native.test.ts`.

**Interfaces.** Every function returns `Promise<NativeResult<T>>`, where `type NativeResult<T> = { ok: true; value: T } | { ok: false; reason: 'denied' | 'cancelled' | 'unavailable' | 'error'; message?: string }`. None of them ever throws.
- `scanQr(): NativeResult<string>`: barcodeScanner `scan()`. Ionic only read `resp.text`.
- `takePhoto(source: 'camera' | 'gallery', opts: { quality: number; maxWidth?: number; maxHeight?: number }): NativeResult<string>` returns `'data:image/jpeg;base64,…'`. Ionic used quality 70 and 500×400, or 100 and 1000×1000 in AddNewComplaint. Callers pass the exact values.
- `getPosition(opts?: { highAccuracy?: boolean; timeoutMs?: number; maximumAgeMs?: number }): NativeResult<{ lat: number; lng: number }>` asks for location accuracy first, as `locationAccuracy.request` did.
- `reverseGeocode(lat, lng): NativeResult<string[]>` returns `{ ok: false, reason: 'unavailable' }` unless `client.features.nativeGeocode` is on. That reproduces production, where the plugin is missing (spec §2a).
- `openNavigation(lat, lng, from?)` does the same: a no-op with `'unavailable'` unless `features.nativeNavigation` is on, and with the flag on it uses `Linking` and `google.navigation:q=`. Add both keys to `FeatureKey` and the schema in Task 3; both are `false` for Topbath.
- `shareText(text: string, imageDataUrl?: string)`
- `openExternal(url)`: `_system` and `window.open`
- `getInstalledVersion(): Promise<string>`
- `uploadMultipart(url, fileUri, fileKey, mime)`
- `onNetworkChange(cb)`
- `push.init(onToken, onTap)` stays a no-op until Phase 8.
- In `MOCK` mode:
  - `scanQr` returns the value set by `setMockScan(code)` (default `'TB-MOCK-0001'`).
  - `takePhoto` returns a 1×1 JPEG data URL.
  - `getPosition` returns `{ lat: 28.6692, lng: 77.4538 }`.
  - Tests can force any wrapper to fail with `setMockNativeFailure(name, reason)`.

- [ ] **Step 1: Write the failing tests.** Cover the MOCK success value for each wrapper. **Review Focus 3:** `setMockNativeFailure('location','denied')` makes `getPosition` resolve to `{ ok: false, reason: 'denied' }` without rejecting, and the same holds for camera and scanner.
- [ ] **Step 2: Run the tests.** Run `npx jest __tests__/native.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Install the libraries listed in the Tech Stack. Real implementations map permission results to `NativeResult`. Reverse geocode uses Android `Geocoder` through a ~40-line Kotlin module `ReverseGeocodeModule`; that choice is the builder's discretion per the spec.
- [ ] **Step 4: Run the tests and verify on the phone.** Run `npm test` and `./gradlew assembleDebug`, then install. Add a temporary dev screen to confirm that the camera, scanner and location permission prompts appear on the phone, then delete it.
- [ ] **Step 5: Commit.** Run `git commit -am "feat(native): wrappers with NativeResult and MOCK implementations"`.

### Task 11: Visual-parity harness

**Status** (2026-11-01): DONE (harness built; RN capture verified once a device is connected). See `parity/README.md`.
- The Ionic reference is **built from source** at `b33d82f` (no aab fallback), so Sales_Executive and forced-update states have references.
  - Portable Node 10.24.1 in `.reference/node10/`; no global Node, nvm or Docker change.
  - `fix-lock.js` rewrites the taobao registry host *and* paths (780 URLs).
  - `npm ci --ignore-scripts`, then `npm rebuild node-sass`.
  - A `jwt-decode` type shim is needed because `work/` sits inside the RN repo.
- Capture uses Playwright 1.64.1 with the installed Chrome (360×800, DPR 3). `stubs.js` fakes Cordova plugins and fires deviceready. Every abacusdesk request is answered from `src/api/fixtures`; other hosts are aborted and logged to `parity/out/blocked-requests.log`. Nothing reaches a server.
- **Deviation: Maestro → adb.** The RN side opens states with the debug deep link and `adb exec-out screencap`, so no global tool is installed. It crops the system bars below API 35 and scales to 1080×2400.
- The report uses pixelmatch 8.0.0 and pngjs 7.0.0; sign-off goes through `node parity/signoff.mjs <id> ok|fail "<note>"` into the committed `parity/signoff.json`.
- **Open:** roles need `src/api/fixtures/_sessions.json` (Task 12); `app_karigar/get_languages` has no fixture yet; use a 20:9 (1080×2400) device or emulator for clean diffs.

**Files:**
- `parity/reference/build-ionic.md` (documented commands)
- `parity/reference/build-ionic.sh`
- `parity/reference/capture.mjs` (Playwright)
- `parity/reference/stubs.js` (Cordova stubs, storage seeding)
- `parity/states.json`
- `parity/capture-rn.mjs`
- `parity/report.mjs`
- `.maestro/_capture.yaml`

**Interfaces:**
- `states.json` entry: `{ "id": "Otp.default", "screen": "Otp", "role": null | Role, "lang": "en" | "hin", "variants": { "<endpoint>": "<variant>" }, "params": {}, "ionicNav": "<JS expression run in the Ionic app to reach the page, e.g. app.getRootNav().setRoot('OtpPage', {...})>" }`
- `node parity/reference/capture.mjs [--only <id>]` writes `parity/out/ref/<id>.png`
- `node parity/capture-rn.mjs [--only <id>]` writes `parity/out/rn/<id>.png`, via the debug deep link (Task 7) and `maestro test .maestro/_capture.yaml -e LINK=… -e OUT=…`
- `node parity/report.mjs` writes `parity/out/report.html`. For each state it shows the ref, the RN shot and a diff (`pixelmatch`), the diff %, and a sign-off checkbox stored in `parity/signoff.json`. That file is committed.

- [ ] **Step 1: Build the Ionic reference www from `$IONIC` at `b33d82f`.**
  - Copy it to `parity/reference/work/`; never modify `$IONIC`.
  - Rewrite `registry.npm.taobao.org` to `registry.npmjs.org` in the copy's `package-lock.json`.
  - Install with Node 10. Use Docker `node:10` if `docker --version` works. Otherwise **ask Dhruv** before installing nvm-windows.
  - Run `npx ionic-app-scripts build`.
  - Expected: `work/www/build/main.js` exists and contains `play_console_flag`.
  - If the build can't be made to work in about 2 hours, fall back to `topsan.aab`'s `base/assets/www`, record that in `build-ionic.md`, and mark the Sales_Executive and forced-update states as "no reference".
- [ ] **Step 2: Write the capture script.**
  - `capture.mjs` serves `work/www` statically.
  - It launches Chromium at 360×800, DPR 3, user agent Android, locale en-IN.
  - It injects `stubs.js` before load: a `cordova` object with the plugin stubs, `deviceready` fired, and `_ionicstorage` IndexedDB seeded with `userStorageData` from `_sessions.json` for the role.
  - It routes `https://apps.abacusdesk.com/**` to `src/api/fixtures`, matching the endpoint path and applying the state's variants.
  - It runs `ionicNav`, waits for network idle plus 500 ms, and takes a screenshot.
  - **Test:** a state `Language.default` produces `parity/out/ref/Language.default.png` with non-blank pixels. Assert this in `parity/reference/capture.test.mjs`, run with `node --test`.
- [ ] **Step 3: Write `capture-rn.mjs` and the Maestro flow.** **Test:** with a placeholder `Language` route, `parity/out/rn/Language.default.png` exists.
- [ ] **Step 4: Write `report.mjs`.** **Test:** `node --test parity/report.test.mjs` checks that the report lists every state in `states.json` and marks missing images "missing".
- [ ] **Step 5: Commit.** Run `git add parity .maestro && git commit -m "feat(parity): Ionic reference capture, RN capture, diff report"`.

### Task 12: Inventory with status, and the screen-card generator

**Status** (2026-11-01): DONE. Tests 448/448.
- `docs/inventory.json` has 117 rows: **LIVE 58, PUSH-ONLY 3** (Feedback, Transaction, ShippingDetail) and **DEAD 56**. Phases 1-7 hold 7 / 22 / 11 / 15 / 6 / 16 / 40 screens. It is built by `scripts/build-inventory.mjs`, which traces navigation from the start-up roots, tabs per user type, push/setRoot/modal targets and the push handlers.
- An independent re-trace agrees with spec §6.3 exactly. Extra evidence:
  - The side menu only opens from dead pages.
  - The Employee/DrLogin radio options don't exist (`select-registration-type.html:19-40`), recorded as `INFEASIBLE_EDGES`.
  - CartDetail, Scan, Search and LoginScreen are never navigated to.
- Ionic quirk found: `executive-order-detail.ts:77` and `favorite-product.ts:71` test `login_type == 'CMS'`, but login stores `loginType`, so those branches never run for CMS users.
- `scripts/screen-card.mjs <name>` writes `src/screens/<name>/card.md`; samples exist for Language, Otp and Home. `scripts/inventory-md.mjs` regenerates `docs/INVENTORY.md`.
- `src/api/fixtures/_sessions.json` holds fake `userStorageData` for Plumber, Sales_Boy, Dealer, Sales_Executive, Customer, Retailer, SFA, Employee and DrLogin, with unsigned test JWTs (`sub` = id). The SFA-family shapes are inferred from what pages read.
- Debug links now apply `role=` (RootNavigator passes the sessions to `applyDebugLink`), and the parity capture seeds roles.
- **Phase 8 note:** `_sessions.json` is statically imported, so it ships inside the JS bundle. Move it behind the debug-only path before release.

**Files:** `docs/inventory.json`, `scripts/screen-card.mjs`, `scripts/inventory-md.mjs` (regenerates `docs/INVENTORY.md` with the status, role, backend, feature and phase columns), `src/api/fixtures/_sessions.json` (one `userStorageData` per role, with `loginType: 'CMS'`, plus `SFA`, `Employee` and `DrLogin` sessions). Test: `__tests__/screen-card.test.ts`.

**Interfaces:**
- An `inventory.json` row: `{ "ionicClass": "PulmberCustomerDetailPage", "name": "PulmberCustomerDetail", "ionicPath": "src/pages/plumber-camplaints/pulmber-customer-detail", "status": "LIVE" | "PUSH-ONLY" | "DEAD", "roles": [...], "backend": "root" | "sfa" | "both", "feature": FeatureKey | null, "phase": 1-7, "unreachableBecause": "file:line …" | null }`
  - Fill it from the spec §6.1 and §6.3 lists. Statuses and reasons come from the recon screen map; the orchestrator holds it and Dhruv can request it.
  - There must be **exactly 117 rows**: 61 LIVE or PUSH-ONLY plus 56 DEAD.
- `node scripts/screen-card.mjs <name>` writes `src/screens/<name>/card.md` with these sections, extracted mechanically:
  - Ionic files and line counts
  - nav params read (`navParams.get('…')`)
  - endpoints called (helper, endpoint, server arg, the body expression's source text, and file:line)
  - response fields read (property chains on the response variable)
  - nav targets (`push`/`setRoot`/`modalCtrl.create` targets)
  - overlays (`alertCtrl`/`loadingCtrl`/`toastCtrl`/`actionSheetCtrl`)
  - natives used (injected `@ionic-native` names)
  - i18n keys (`| translate` and `translate.get`) and hardcoded text nodes
  - SCSS file plus the global classes used from `variables.scss`
  - an empty **Quirks** section and an empty **States** section, which the orchestrator fills from spec §6.2

- [ ] **Step 1: Write the failing tests.**
  - The card for `Otp` lists the endpoints `auth/login` and `app_karigar/karigarLoginOtp`, and nav params including `mobile_no`.
  - The card for `Home` lists `app_karigar/karigarHome`.
  - `inventory.json` has 117 rows and unique names, and every DEAD row has a `feature` and an `unreachableBecause`.
- [ ] **Step 2: Run the tests.** Run `npx jest __tests__/screen-card.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** using regex and line scanning over `$IONIC`. The script takes `IONIC_SRC` from an environment variable, defaulting to `C:/Migrations/Topbath_App_loyalty/src`.
- [ ] **Step 4: Generate and check.** Run `npm test`, then `node scripts/inventory-md.mjs > docs/INVENTORY.md`. Expected: PASS, and the regenerated table shows the status column.
- [ ] **Step 5: Commit.** Run `git commit -am "feat(tooling): inventory with reachability + screen-card generator"`.

### Task 13: Pilot screen (Language) through the full S-procedure

**Status** (2026-11-02): S1–S9 DONE. Dhruv signed off `Language.default` and `Language.hin` ("looks the same as the Ionic app"); merged locally into `master` (49f59ee). Final diffs vs the Ionic reference: 0.38% / 0.36% (status-bar icons, gesture bar, sub-pixel text).
- Card quirks (10) are all ported with NOTEs. Three planned states (`loggedInHin`, `loggedInEmpty`, `malformed`) are **unreachable in production**: the Ionic app reads the storage key `token` (language.ts:44, dbservice.ts:90) but never writes it. They are unit-tested only.
- The S8 review passed the screen; its findings were all **kit-level** and were fixed on `master` first (8a49873, 75013c9):
  - `IonListHeader` really is an Ionic Item (inner/wrapper/label + the `.border-heading` bar); the part-5 claim was wrong.
  - `IonToolbar tall` (h80), an `overlay` slot for `.header-logo`, and a new `IonFooter`.
  - Button labels clipped Devanagari marks above the line (the "आगे बढ़ें" anusvara). They now get a clip-safe line box.
  - The page frame clips like `contain:strict`; the header/footer shadow strips are smooth (`ShadowStrip`).
- Harness fixes:
  - `rnAction tap:<testID>` for RN taps.
  - A ready-wait plus a 5.5 s settle (the splash can cover a ready page).
  - `deviceVersion: "15"` for API ≥ 35 devices.
  - The ref uses Roboto and the emulator's NotoSansDevanagari.
  - Ionic taps are driven through the page's own handler inside NgZone, because TapClick swallows synthetic events.

**Retro (Step 2)**, folded into the S-task below and `docs/PLAYBOOK.md`:
1. **Kit gaps first.** When a screen needs a missing or wrong shared piece, it goes on `master` as a mini-task, and the screen branch rebases. Do not hand-build it in the screen.
2. **Only production-reachable parity states.** The card generator now lists storage keys and flags keys that are read but never written.
3. **Diff % is not proof.** At one point the `Language.hin` reference showed the wrong state (English still selected) at only 0.5%. The reviewer *and* the lead must look at both images and confirm the same state before sign-off.
4. **Capture setup:** RN at 360dp (`wm density 480` on a 1080-wide emulator), API ≥ 35 states use `deviceVersion: "15"`, and only one emulator at a time (laptop memory). APK builds and emulator runs are done by the lead, sequentially.
5. **Fixtures can now return HTTP errors** (`$httpError` variants), so "server error does nothing" paths need no custom transport.
6. **Worktrees for parallel batches:** implementers code and run Jest in worktrees (junction `node_modules`); the lead merges to `master` and does all builds and captures.
7. One Jest run failed once and passed on 3 reruns. Watch for flakiness; rerun before investigating.

Port `Language` using the **S-task procedure below**, end to end, with one Sonnet implementer and one Sonnet reviewer. The purpose is to validate the procedure, harness and gates before any batches run. Whatever fails here is fixed in this plan and in `docs/PLAYBOOK.md` before Phase 1 starts.

- [ ] **Step 1: Run S-steps 1–9 for `Language`.**
- [ ] **Step 2: Retro.** Orchestrator and Dhruv review the parity report together. Note what was missing from the card, fixtures or harness, and amend the S-procedure and the screen-card generator.
- [ ] **Step 3: Update and commit the docs.** Update `docs/PLAN.md` (phase table from spec §6.1) and `docs/PLAYBOOK.md` (Part A rules now point to this plan, Part C scope = 117 with flags), then run `git commit -am "docs: plan/playbook aligned with design; pilot retro"`.

**Phase 0 gate:**
- `npm test` is green and `npx eslint src` is clean.
- Every `_components.*` state is signed off in the parity report (Task 9 Step 6). ⏳ 49 states built (b0f0627), fixed (48b1b34 + button nowrap), captured on Dhruv's phone 2026-11-02 at 360dp; all 51 pairs looked at by the lead; all ≤ 2.6% diff with the same state on both sides. ✅ Signed off by Dhruv 2026-11-02.
- The splash screen matches the **shipped** app (corrected by Task 8b: cordova-android 12 ignores `SplashShowOnlyFirstTime`): `resources/splash.png`, every cold start, 3 s hold, 3 s fade. ✅ Verified on Dhruv's phone 2026-11-01 (0.00% diff).
- The debug APK runs on the phone. ✅ (2026-11-01, Android 16)
- The `Language` state is signed off in `parity/out/report.html`. ✅ (2026-11-02)
- Dhruv approves moving to Phase 1. ✅ 2026-11-02 ("approved, go Phase 1"). **Phase 0 complete.**

---

## S-task: Per-screen porting procedure (used for all 117 screens)

The orchestrator dispatches one **implementer** (Sonnet) per screen in its own worktree (`git worktree add ../tb-wt-<Name> -b screen/<Name>`). The prompt contains:
- this section
- the Global Constraints
- the screen's `card.md`
- the paths to its Ionic files
- the Interfaces of Tasks 3–10

**Files (per screen):**
- `src/screens/<Name>/index.tsx`, `route.ts`, `styles.ts`, `card.md`, `<Name>.test.tsx`
- `src/api/fixtures/<endpoint>.json`, created or extended for each endpoint it calls
- `src/api/contracts/<endpoint>.json`, one per endpoint
- `parity/states.json`, its entries only, via `parity/states.d/<Name>.json` merged by `report.mjs`, to avoid conflicts
- `.maestro/screens/<Name>.yaml`

**Steps:**
- [ ] **S1 – Card.** The orchestrator runs `node scripts/screen-card.mjs <Name>`, then fills **Quirks** from spec §6.2 and **States**. States: `default`, one per role branch and `*ngIf` branch, `empty`, `malformed`, plus `hin` when the screen has translated text.
- [ ] **S2 – Contracts.** For each endpoint in the card, write `src/api/contracts/<endpoint>.json` from the Ionic call site (exact helper, server and body key tree), and add `ionicSource` file:line.
- [ ] **S3 – Fixtures.** For each endpoint, add the `default`, `empty` and `malformed` variants, plus any status variants the screen branches on, such as `NOT FOUND`, `INVALID` or `USED`. Values are realistic, with no real PII. Write endpoints that later screens read go through a `handlers/<group>.ts` store handler.
- [ ] **S4 – Failing tests** in `<Name>.test.tsx`:
  - one `expectContract` per endpoint, driven through the screen's real call path by rendering the screen and firing the triggering press
  - a render test per state asserting the key texts or i18n keys from the card are present
  - a navigation test per nav target (mocked `navigation.navigate` called with the Ionic params)
  - **Review Focus 2:** the `malformed` variant renders without throwing
  
  Run `npx jest src/screens/<Name>`. Expected: FAIL.
- [ ] **S5 – Implement** `index.tsx`, `styles.ts` and `route.ts` (with `feature` from `inventory.json` and `presentation: 'modal'` where Ionic used `modalCtrl`).
  - Mirror the Ionic template's element order and hierarchy.
  - Port SCSS values (px→dp 1:1) and the applicable global `variables.scss` rules into `styles.ts`. Every overlay or control uses its `src/components/ionic` replica with the same options the Ionic code passed (titles, button texts, input types, `enableBackdropDismiss`, `dismissOnPageChange`).
  - Icons use the same name and family as Ionic: `ion-icon name` becomes `IonIcon`, and `<i class="material-icons">` becomes `MaterialIcon`.
  - **No improvements.** Typos, odd spacing, inconsistent capitalisation and dead buttons are all copied.
  - **Navigation mapping** (2026-11-02): Ionic `navCtrl.push(Page, params)` → `navigation.push('Name', params)` (always adds a page; `navigate()` would jump back to an existing route). `setRoot` → `resetTo`/`reset`; `pop` → `goBack()`; `modalCtrl.create` → a `presentation: 'modal'` route.
  - **Comparisons as in Ionic** (dev-server check 2026-11-02): where Ionic uses `==`/`!=`, RN uses `==`/`!=` too (`// eslint-disable-line eqeqeq`). The dev server sends ids, flags (`del`), points and OTPs as NUMBERS where the fixtures had strings, so a strict `===` silently breaks branches (it stopped suspended accounts being blocked at start-up). Fixtures use the real server types (see `.reference/logs/devcheck_shapes*.txt`).
  - **Loaders and errors as in Ionic:** if Ionic leaves a loader up on an error path (no dismiss in the error callback), the RN screen does the same — do not use `useLoader().wrap` there. Copy the exact show/hide calls.
  - Every visible string either uses `t('<same key>')` where Ionic used `| translate`, or stays a literal where Ionic hardcoded it.
  - Add a NOTE for every quirk.
- [ ] **S6 – Gates** (pilot lessons: the lead runs RN captures on the single emulator at 360dp after merging kit fixes; **look at every ref/RN pair and confirm both show the same state** — the diff % alone is not proof).
  Original gate text: Run `npm test`, `npx tsc --noEmit` and `npx eslint src/screens/<Name>`. Expected: all green. Then run `node parity/capture-rn.mjs --only <Name>.` and `node parity/reference/capture.mjs --only <Name>.`. Expected: a PNG for every state.
- **Interaction check on the phone** (added 2026-11-02 after the tab-bar bug): screenshots only prove looks. Before sign-off, the lead taps every interactive element of the screen on Dhruv's phone with `adb shell input tap` and confirms the right handler ran (pixel check or a debug log). The tab bar passed every screenshot test while every tap went to the last tab.
- [ ] **S7 – Commit on the branch.** Run `git commit -m "feat(screen): port <Name>"`.
- [ ] **S8 – Independent review.** The orchestrator dispatches a fresh Sonnet **reviewer** with the Ionic `.html`/`.ts`/`.scss`, the RN diff, `card.md` and both PNG sets. It answers PASS or a numbered list of concrete misses, each with Ionic file:line and RN file:line. Checklist:
  - every element and text
  - every `*ngIf`/role branch
  - every endpoint body
  - every nav target and param
  - overlays and their texts
  - natives and their options
  - every overlay and control uses its Ionic replica with identical options
  - icons use the same name and family
  - nothing "improved" (typos and dead buttons copied)
  - quirk NOTEs present
  - no client strings
  
  The implementer fixes the misses (at most 2 loops); after that the orchestrator escalates to Dhruv.
- [ ] **S9 – Merge.** The orchestrator merges `screen/<Name>` into `main`, reruns `npm test`, regenerates `report.html`, and removes the worktree. The screen counts as **done** only when Dhruv ticks its states in the parity report.

**Batching:** up to 4 S-tasks run in parallel. If an S-task needs a new shared component or wrapper, it **stops and reports** instead of creating one. The orchestrator adds it as a mini-task on `main` (TDD, commit) and then resumes the screen. Order within a phase: screens with the most inbound navigation go first, so later screens can navigate to real routes.

---

## Phases 1–7: Screen batches

Each phase = S-tasks for the listed screens, followed by its **flow tests** and **gate**. The phase gate (spec §7):
- every state of the phase is signed off in the parity report
- `npm test` is green
- the phase's Maestro flows pass on the emulator
- the debug APK has been checked on the phone by Dhruv against the phase checklist in `docs/PLAN.md`

### Phase 1: Onboarding & auth (7 + Customer/Retailer tabs)

**Global risk to re-check in later phases (from the SelectRegistrationType S8 review, 2026-11-02):** Ionic pages whose `.module.ts` calls `TranslateModule.forRoot` get their *own* TranslateService instance. `setDefaultLang/use` on such a page only affect that page, and pages that never call `use()` show English keys. RN switches the language globally (`i18n.changeLanguage`). That is identical for the login flow (Language → SelectRegistrationType → MobileLogin, which calls its own `use(lang)`), but **every later screen's S8 review must check whether its Ionic module has its own `forRoot` and calls `use()`**, and copy the resulting language (e.g. force English where Ionic would).
Screens: Language (pilot, done), SelectRegistrationType, MobileLogin, Otp, Registration, AboutusModal, Tabs.

**Status** (2026-11-02, session 2): all 7 screens merged into `master` with S8 PASS. Registration (ffaf406), AboutusModal (9875b06; S8 added two NOTEs), Tabs (8dc7e5e; S8: `index == '5'` now a loose compare as in tabs.ts:88). Gates on master: jest 654/654, tsc clean, eslint 0 errors, parity:test 13/13. Worktrees removed (junctions first). Flow test done (`__tests__/flows/login.test.tsx`, 4 roles x 3 outcomes; a Sales_Executive NOT FOUND goes back to MobileLogin with an alert, otp.ts:83-86).

**Status** (2026-11-03): phone captures + tap check DONE on branch `fix/phase1-parity` (Dhruv's phone, MOCK via `mock=1` debug links).
- 30 states captured; every pair reviewed. Misses found and fixed: Registration h3 underline width; prefilled inputs never green (all prefilled ion-inputs are `ng-invalid`, measured in the Ionic DOM); mapping inputs not dimmed; page would not scroll from a text box (kit: Android device-px line box, `androidLineHeight`); last cs-select green border; sales executive select binds the raw id; MobileLogin Hindi label clipped (`clipSafeLineBox`); AboutusModal double space + greedy line breaks (`textBreakStrategy="simple"`).
- Harness fixes: `tap:` scrolls a target into view; `mock=1` links use the MOCK transport and reset all fixture variants (a variant from an earlier link leaked into later states).
- Tap check: Language (rows, Continue), SelectRegistrationType (4 rows, disabled/enabled GO, back), MobileLogin (empty/short/10 digits), Otp (Resend alert + 30 s countdown, OK, wrong OTP -> "Wrong OTP value" on blur, right OTP -> Tabs), Tabs (all 5 Plumber tabs), Registration (State/District lists, DOB picker, typing, Submit validation, back -> Otp), AboutusModal (tel: chooser, mailto: Gmail, cancel -> Tabs). All PASS.
- **Deferred:** `Tabs.Retailer` cannot be compared yet: Ionic's Retailer Home calls `loginBannersApp`, `product_catalogue_count`, `offerList` which have no fixtures, so the Ionic reference renders blank. Re-capture in Phase 2 once Home's fixtures exist.
- **Kit question for the Phase 2 kit pass:** Android `Text` defaults to `textBreakStrategy="highQuality"` (balanced paragraphs); browsers break greedily. Only AboutusModal uses `simple` so far; decide globally before Phase 2 screens.
- **Signed off by Dhruv 2026-11-03** ("for now phase 1 is done"): 29 states recorded in parity/signoff.json; Tabs.Retailer deferred to Phase 2. Performance optimisation: later (see the optimisation note in the Phase 2 section when added).
- [ ] **Flow test** `__tests__/flows/login.test.ts`, in MOCK, for each of the 4 roles: Language → SelectRegistrationType → MobileLogin → Otp. Then:
  - `auth/login` SUCCESS → Tabs with that role's tab set
  - `NOT FOUND` → Registration → submit → Tabs
  - unverified → AboutusModal
- [ ] **Maestro** `.maestro/flows/login-<role>.yaml` × 4, plus `customer-tabs.yaml` (seeded `Customer` session). It shows the Home · Newarrivals · Contact · About · Profile labels; the Newarrivals, Contact and About tabs render placeholders until Phases 3 and 2 land.
- [ ] **Gate.**

### Phase 2: Core loyalty (22)
Home (Plumber and Seller/Dealer variants are two state sets on one screen), MainHome, Profile, ViewProfile, PointList, PointHistory, OfferList, Offers, Terms, GiftDetail, CancelpolicyModal, CancelationPolicy, Transaction, ShippingDetail, Notification, Feedback, Pointtranfer, CoupanCode, ScanPoint, SalesPointTransfer, Super30, PointLocation.
- [ ] **Flow test** `flows/scan-redeem.test.ts`:
  - Plumber: scan (`setMockScan`) → `karigarCoupon` → balance increases on PointList → GiftDetail → CancelpolicyModal (`sendOtp`, then the client OTP match) → `redeemRequest` → Transaction lists it
  - Seller: ScanPoint multi-scan → `saveCoupon`
- [ ] **Flow test** `flows/transfer.test.ts`: Pointtranfer `karigar_not_exist` alert and SUCCESS; SalesPointTransfer `bonus_points`.
- [ ] **Maestro:** one flow per role covering every tab.
- [ ] **Gate.**

### Phase 3: Catalogue & content (11)
Category, SubCategory, Products, ProductDetail, ProductSubdetail, Newarrivals, VideoCategory, Video, About, Contact, QuotationGenrateByPdf.
- [ ] **Flow test:** Category → SubCategory → ProductDetail (infinite scroll fetches the next `filter.limit` offset) → ProductSubdetail → share is called with the Ionic text. Quotation: build a list → `quotation_pdf` → `openExternal(upload_url3 + file_name)`.
- [ ] **Gate.**

### Phase 4: Complaints & service (15)
AddNewComplaint, ComplaintHistory, ComplaintDetail, CancelComplaint, ComplaintRemarks, MyCamplaints, PulmberCustomerDetail, PlumberCheckin, TaskClose, CustomerList, CustomerAdd, CustomerDetail, PlumberList, PlumberAdd, PlumberDetail.
- [ ] **Flow test:** Seller creates a complaint (with `getGeoLocation` `NOT FOUND` forcing PointLocation first), then the Plumber sees it in MyCamplaints → check-in (`plumberCheckIn`) → TaskClose with photo and OTP → `complaintTaskCloseByPlumber` → the Seller sees it closed in ComplaintHistory, then rates and pays in ComplaintDetail.
- [ ] **Gate.**

### Phase 5: Sales Executive (6)
SalesExecHome, SalesExecAddPlumber, SalesExecAddSeller, SalesExecAddDealer, SalesExecPlumberList, SalesExecPlumberDetail.
- [ ] **Flow test:** summary counts; add plumber `EXIST` and SUCCESS; the list `list_type` switch across Plumber, Sales_Boy and Dealer; detail with `recent_scans`.
- [ ] **Gate.** **Milestone:** all 61 live screens are done. A full regression on the phone across 4 roles plus Customer follows.

### Phase 6: Topbath-unreachable loyalty pages (16, flagged)
GiftList, PointDetail, Scan, LoginScreen, Digitalcatalog, EditProfile, Enquiry, FavoriteProduct, News, NewsDetail, SurveyList, SurveyDetail, NearestDealer, RetailerAddComplaint, RetailerListComplaint, Search.
- [ ] **Before the S-tasks, add** `__tests__/flags.test.ts`:
  - with `client = topbath`, a BFS over `route.ts` `links` from `Language` and from every tab root, skipping routes where `isRouteEnabled` is false, reaches **no** route with `feature` set
  - with `_all-features`, all 117 routes are reachable
  - Re-run it at the end of Phase 7.
- [ ] Each S-task also enables its **entry point** behind the flag: the commented Home button, Profile's edit link and the ProductSubdetail enquiry button, with the Ionic markup restored exactly. Parity states run with `_all-features`.
- [ ] **Gate:** the flags test is green, and the parity sign-off is done.

### Phase 7: SFA module (40, flagged `sfa`, backend `rootUrlSfa`)
- [ ] **Pre-task (orchestrator):**
  - Add the Employee/DrLogin radio options to SelectRegistrationType behind `features.sfa`.
  - Restore the SFA start-up branches (`app.component.ts:258-299`) into `decideStartRoute`, with tests for the `SFA`, `Employee` and `DrLogin` sessions.
  - Add the SideMenu item sets, with tests.
  - Add the SFA cart storage keys (`order_item_array`, `order_item_length`, `order_details`) to the session docs.
- **Sub-batches, in order:**
  1. Login, Otpverify, Dashboard, DealerHome, DealerProfile, WorkTypeModal
  2. Attendence, AddLeave, LeaveList, TravelAdd, TravelList, DealerCheckIn
  3. sales-app: AddCheckin, EndCheckin, CheckinList, CheckinDetail, CustomerCheckin, CustomerOrder, AddDealer, AddDistribution, AddLeads, EditNetwork, DistributorList, MainDistributorList, DistributorDetail
  4. DealerDealerList, DealerDiscount, DealerExecutiveApp, DealerExecutiveList, ExecutivDetail, ExecutiveEdit, ExecutivePopover, LeadsDetail
  5. AddOrder, DealerAddorder, CartDetail, OrderList, OrderDetail, DealerOrder, ExecutiveOrderDetail (invoice upload via `uploadMultipart` to `rootUrlSfa + 'dealerData/upload_invoice?…'`)
- [ ] **Flow tests:** SFA login → Dashboard → attendance punch-in (work-type modal, location) → check-in → order → cart → `Order/add_order`; DrLogin → DealerHome → DealerAddorder.
- [ ] **Gate.**

## Phase 8: Native & release (Topbath)

- [ ] **Task 8.1 – Push.**
  - Add `@react-native-firebase/app` and `@react-native-firebase/messaging`, and the POST_NOTIFICATIONS runtime prompt.
  - Port `app.component.ts:896-1015` and `home.ts:960-1040`: token → `update_token` via `post_rqst` with `{ registration_id, id }` after 5 s, and tap routing by `additionalData.type`.
  - Gate it on `client.features.push` (Topbath is `false`).
  - Tests: routing per type and the `update_token` contract, both with the push wrapper mocked.
- [ ] **Task 8.2 – Icons and splash.** Generate them per client in `use-client.mjs`: adaptive icon, Android 12 splash and notification icon. Verify on the phone.
- [ ] **Task 8.3 – Release signing outside the repo.**
  - `signingConfigs.release` reads from `~/.gradle/gradle.properties` (`TB_STORE_FILE`, `TB_STORE_PASSWORD`, `TB_KEY_ALIAS`, `TB_KEY_PASSWORD`). The build fails with a clear message if they're missing.
  - Run `./gradlew bundleRelease` with a **local test keystore**. Expected: an `.aab` is produced.
  - The real key is supplied by the release owner, so this step is outside the migration scope.
- [ ] **Task 8.4 – Release hand-off notes** in `docs/RELEASE.md`:
  - forced-update rollout order (spec §6.1)
  - `versionName` and `versionCode` to set
  - Play App Signing / keystore question
  - session carry-over option (spec §9.6)
  - Firebase project decision
  - open security NOTEs list, generated by `grep -rn "NOTE (security" src`
- [ ] **Task 8.5 (optional, only if the release owner asks) – Session carry-over.** A native module reads the old Ionic WebView IndexedDB `_ionicstorage/_ionickv` `userStorageData` on first launch and writes it to AsyncStorage. Test it on a phone with the Play Store build logged in, then install the RN release build over it.
- [ ] **Task 8.6 – Full regression.**
  - Every Maestro flow passes.
  - The parity report is 100% signed off for Phases 1–5.
  - Manual phone checklist per role: permissions prompts, back button rules, Hindi language, offline behaviour (no crash), Android 15 edge-to-edge.
  - DEV/LIVE smoke **only** with test accounts and Dhruv's explicit go-ahead.

## Phase 9: Second client (template proof)
- [ ] Given a second client's Ionic repo:
  - Run `scripts/ionic-inventory.sh` on it.
  - Diff it against Topbath's inventory and `$IONIC/src` page by page, and record the screen and flow differences in `docs/clients/<id>-diff.md`.
  - Each difference becomes either a new `FeatureKey` or a `brandLabels` entry, never a fork.
  - Create `clients/<id>/` and run `use-client.mjs <id>`. Build, then rerun parity for the changed screens against that client's Ionic build.
- [ ] Update `docs/PLAYBOOK.md` Part D with the onboarding steps that actually worked.

## Phase 10: iOS (gated on spec §9.1)
- [ ] Once a Mac or cloud build path is approved:
  - `use-client.mjs` writes the iOS bundle id, display name and asset catalog when `platforms` includes `ios`.
  - `pod install`; Info.plist usage strings (camera, location, photo library).
  - Version check: the server already returns `ios_app_version` (dev: `"0.0.1"`). Ionic never read it because it was Android-only. Decide with the client whether iOS compares against it (the iOS store link differs too).
  - Run the Maestro flows on the iOS simulator and produce the parity screenshots at an iPhone size.
  - Push needs APNs keys via Firebase.
