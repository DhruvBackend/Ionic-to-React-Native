# Topbath (Topsan) Ionic → React Native migration: design

**Date:** 2026-10-29 · **Owner:** Dhruv · **Status:** draft for approval
**Replaces:** the phase table in `docs/PLAN.md` (rules there still apply unless changed below)
**Sources:** Ionic repo `C:\Migrations\Topbath_App_loyalty` (HEAD `b33d82f`), RN repo `C:\Users\dhruv\Projects\topbath-rn` (2 commits + uncommitted WIP), recon done on 2026-10-29 (screen map, API contract, native/branding audit).

---

## 1. Intent

Ionic 3 / Cordova is end-of-life, slow, and has a bad UX. The client's mobile app must move to React Native **without the users noticing any difference except speed**: every screen, element, text, and flow must match the current app.

Topbath is the first of 70+ client apps built from the same Ionic template. Those apps differ only in **name, logo, colours and API URL**. The real product is therefore **one React Native template that Topbath ships on first**, so that each later client is a config change rather than a code fork.

The conversion is done by **Sonnet 5.5 subagents**, one screen at a time. Opus orchestrates them, and every screen passes automatic gates and a human visual check.

## 2. Review of the earlier plan (`docs/PLAN.md`, `docs/PLAYBOOK.md`)

**Kept as-is (sound decisions):**
- Bare React Native 0.88.1 + TypeScript, New Architecture.
- Straight conversion. The API contract (URLs, paths, headers, body shapes, storage keys) stays identical.
- Security behaviour is copied unchanged and flagged with `// NOTE (security, not changed):`. A colleague owns the security fixes.
- MOCK / DEV / LIVE switch, with MOCK as the default and stateful mocks.
- Debug build installs as `com.topsan.app.rn` alongside the store app.
- Every screen file starts with a header naming its Ionic source, and deviations are commented.
- One commit per screen. Local git only.
- `client.ts` mirrors `dbservice.ts` method by method. The work already done here is good.
- The library mapping (PLAYBOOK B6) and the Angular→React cheat-sheet (B7).

**Problems found and the change for each:**

| # | Problem in earlier plan | Evidence | Change |
|---|---|---|---|
| 1 | Plans all **117 screens** as one undifferentiated list. | Reachability analysis: only **61 screen classes are live in Topbath** (56 folders). 56 are unreachable: the whole SFA/CRM module plus 16 loyalty pages. The Employee/DrLogin radio options don't exist, the side menu only opens from dead pages, and buttons are commented out. | **All 117 are ported (Dhruv's decision, 2026-10-29).** The live 61 come first (they are what Topbath users see). Then the 56 unreachable ones, behind per-client feature flags, because other clients on the template may use them (§6.3). For Topbath the flags are off, so reachability matches today exactly. |
| 2 | `INVENTORY.md` has no live/dead column. | as above | Add `status` (LIVE / PUSH-ONLY / DEAD-in-Topbath), role, backend (`dd_api` / `crm`) and the feature flag that gates the screen. Every row gets a screen card. |
| 3 | **No white-label design.** Part D says "copy the finished app and rebrand" per client. Across 70 apps that means 70 forks. | User: all apps share one template and differ only in name/logo/colours/URL. | Add a `clients/<id>/` config set up in Phase 0, before any screen is ported (§5). Screens never contain client strings. |
| 4 | **Parity testing is undefined.** It says "compare side-by-side", but the old app can't be run because the OTP never arrives. | LEARNING-LOG 2026-10-28. | Add a **reference harness** that runs the Ionic web build in a phone-sized browser against the *same* mock fixtures as RN. It captures reference screenshots per screen and state (§7). |
| 5 | `topsan.aab` was treated as "the app". | The aab's `main.js` has no `play_console_flag` and no `sales_exec/summary`, so it is **older than the source**. | The reference build is made **from source** (`b33d82f`). The aab is only a fallback for screens that are unchanged. |
| 6 | Mock response shapes are guessed separately for each screen and can drift. | | **One fixture set per endpoint**, shared by the RN mock and the reference harness. Plus a per-endpoint **contract test** that the RN request equals the Ionic request (§7.1). |
| 7 | Native plugin list assumes all features work today. | The aab's `cordova_plugins.js` has **no push, no launch-navigator, no native-geocoder, no media-capture, no file-transfer**. In production, push, "navigate to customer" and reverse geocoding currently fail silently. | A parity table (§6.2) states for each feature: replicate the failure, or make it work. |
| 8 | No iOS path. Rules forbid cloud builds, and the laptop is Windows. | User: some clients need iOS, some don't. | The template keeps the `ios/` project compiling. Per-client `platforms` flag. The iOS phase is gated on a build-machine decision (§9). |
| 9 | WIP isn't committed or installable. | `src/` and `__tests__/` are untracked, and `i18next`, `react-i18next`, `jwt-decode` and `async-storage` are imported but not in `package.json`. No APK has been built yet. | The first task of the implementation plan fixes this. |
| 10 | No subagent orchestration design. The playbook is written for one agent. | User wants Sonnet 5.5 subagents to do the conversion. | §8 defines screen cards, the implementer/reviewer loop, and conflict-free parallelism. |

## 2a. The 1:1 rule (Dhruv, 2026-10-30)

**The RN app is an exact 1:1 copy of the Ionic app. There are no UI or behaviour changes of any kind.** This overrides every ★ call in this document that would change what a user sees or experiences.

"Identical" means the same:
- elements, in the same order and hierarchy
- text: wording, case, punctuation, translation key or hardcoded literal
- sizes, spacing, colours, fonts, font weights and icons (the same glyphs)
- images, including the same image hosts
- states (loading, empty, error, disabled)
- overlays and how they look
- transitions and timings (page animation, splash 3 s with fade, toast 3 s)
- navigation and back-button results
- broken behaviour, such as a button that does nothing today because its plugin is missing

The only differences allowed are ones the platform makes impossible to avoid: sub-pixel text antialiasing, and WebView vs native scroll physics. Each one is recorded in the parity report.

Consequences:
1. **Ionic's own UI kit is rebuilt as replicas of Ionic 3 Material-Design ("md") mode** instead of using native widgets. That covers:
   - alert, including radio and checkbox alerts
   - loading, toast, action sheet
   - `ion-select` (alert interface), `ion-datetime` picker wheel, `ionic-selectable` modal
   - popover, modal (slide-up) and the page transition (md: slide-up with fade)
   - navbar, tabs bar, segment, searchbar, refresher, infinite-scroll spinner, fab, item and list, card, buttons with ripple
   
   `Alert.alert`, `ToastAndroid` and native date pickers are banned in screens (lint rule).
2. **Fonts and icons are bundled exactly:**
   - Roboto and Roboto Condensed, as loaded from Google Fonts by `variables.scss:11-12`
   - Material Icons, as loaded by `index.html:18`
   - **Ionicons 3.0.0**, the font from the shipped app's `assets/fonts/ionicons.woff2`, mapped by its own v3 glyph names. The modern `react-native-vector-icons/Ionicons` set is **not** used, because its glyphs differ.
3. **The parity harness checks components as well as screens.** Each replica above is captured in Ionic (rendered in the reference harness) and in RN, and signed off before any screen uses it.
4. **Reversed ★ calls:**
   - The start-up non-SUCCESS case **copies the blank screen** (NOTE parity).
   - Launch-navigator and native-geocoder **fail silently for Topbath exactly as in production**. Working versions sit behind `features.nativeNavigation` and `features.nativeGeocode`, which are off for Topbath.
   - Push stays off for Topbath (no change).
   - The login `reset` vs `push` change remains, because the result on screen is identical.
5. **Changes nobody can see stay allowed:** internal code structure, white-label config, feature flags, tests, and an empty `grafdoer` URL on a dead code path.

## 3. Goals, non-goals, anti-goals

**Goals**
1. All **117 Ionic screens** are rebuilt in RN with element-for-element visual and behavioural parity.
   - The 61 live screens cover all four roles (Plumber, Seller/`Sales_Boy`, Dealer, Sales_Executive) plus the Customer/Retailer tab layout.
   - The 56 Topbath-unreachable screens include the SFA module (Employee/DrLogin login, side menu, CRM backend). They are gated by feature flags.
2. The app sends byte-identical requests (path, method, headers, body keys) for every endpoint the Ionic code calls: ~90 on `dd_api` and ~100 on the SFA `crm/api/app` backend.
3. One codebase, with Topbath as client #1. Adding a client means adding a config folder and running the build, with no code edits.
4. Android release build is ready for the Play internal testing track. iOS compiles from the same code once the build-machine decision is made.
5. A repeatable, mostly automated parity test suite that is reused for every future client.

**Non-goals**
- Fixing backend or security issues (the colleague's job). The RN auth code is isolated so their fixes drop in with one change.
- Making Topbath-unreachable screens reachable for Topbath. Their flags stay off, as today.
- Redesign, new features, or offline mode (none exists today).
- Backend changes of any kind.

**Anti-goals (failure even if it "works")**
- Any request from RN differs from the Ionic one, so the backend behaves differently.
- A client string (Topsan, `#002d25`, a URL, a phone number) hardcoded in a screen.
- Mock or development traffic reaching production data.
- Signing keys, `google-services.json` or passwords committed to the RN repo.
- Screens that "look roughly right". Each one is checked against a reference screenshot.

## 4. Constraints

- Windows 11 laptop, Node 24, local Android SDK. Builds stay local (existing rule). The only possible exception is iOS (§9).
- There is no backend source (the D: drive isn't mounted on this machine), no dev server access, and no test accounts yet. Everything is built in MOCK mode. DEV/LIVE verification waits for test accounts.
- Production has OTP bypass numbers hardcoded in the Ionic client. They must **not** be used to log into production for testing without the client's explicit written OK.
- A security colleague is changing the backend in parallel. The login/OTP contract may change mid-project.

## 5. Architecture

### 5.1 White-label

```
clients/
  topbath/
    client.json          # identity, urls, contact, colours, roles, flags, platforms
    assets/              # logo.png, banner.png, icon.png (1024), splash.png, notification icon
    i18n/                # optional overrides: brand strings (About text, "About Topsan") per language
    google-services.json # NOT committed (gitignored); fetched from the team's secret store
scripts/use-client.mjs   # node scripts/use-client.mjs topbath  → writes generated files
src/config/client.ts     # GENERATED, typed; screens import { client } from here
```

`client.json` fields, from the branding audit:
- `id`, `appName`, `androidPackage`, `iosBundleId`, `version`, `versionCode`
- `urls.{rootUrl, upload_url3, image_url, product_image_url, category_url, video_url}` for LIVE and DEV
- `colors.{primary, statusBar, …}` from the theme
- `contact.{phone, email, address, mapEmbedQuery}`
- `companyName`, `playStoreId`
- `languages` (en, hin) and `countries` (India, Nepal)
- `roles` enabled (Plumber, Sales_Boy, Dealer, Sales_Executive)
- `fcmSenderId`
- `platforms: ["android"] | ["android","ios"]`

`use-client.mjs` does the following:
1. Validates `client.json` against a schema.
2. Writes `src/config/client.ts`.
3. Copies assets into `src/assets/client/` and generates Android mipmaps and splash. iOS asset catalog only when `ios` is enabled.
4. Sets `applicationId` and `app_name` through `android/client.properties`, which Gradle reads. This replaces the hardcoded `resValue "Topsan"`.
5. Copies `google-services.json` into `android/app/` if present.

`src/theme` reads its colours from `client.colors`. A lint rule (`no-restricted-syntax` on hex literals and on brand words in `src/screens/**`) enforces "no client strings in screens".

**Content that is brand text inside i18n keys** (for example Agmeco's About paragraphs in `en.json`) is copied unchanged for Topbath to keep parity, and is listed in the client folder's override file so the next client replaces it.

### 5.2 App structure (extends PLAYBOOK B5)

```
src/
  api/client.ts, api/mock/{index.ts, store.ts}, api/fixtures/<endpoint>.json   # fixtures shared with reference harness
  auth/            # session restore, login, OTP, logout — the ONLY place security behaviour lives
  config/{env.ts, client.ts}
  navigation/{RootNavigator.tsx, RoleTabs.tsx, routes.generated.ts}           # routes generated from screens/*/route.ts
  screens/<IonicPageName>/{index.tsx, route.ts, card.md, contract.test.ts, styles.ts}
  components/      # Header, Loader, AlertHost, Toast, SearchableSelect, Segment, RefreshableList, ImageViewer, WebEmbed, Fab
  native/          # scanner, camera, location, share, browser, push, appVersion — each with a MOCK impl
  storage/, i18n/, theme/
parity/            # reference harness + screenshot diff report (dev-only, not in app bundle)
.maestro/          # E2E flows per role
```

`routes.generated.ts` is produced by a script from each screen's `route.ts`. This keeps parallel subagents from editing the same navigation file.

### 5.3 App-level behaviour to reproduce (from `app.component.ts`)

- **Start-up:**
  - With no stored token, go to Language.
  - With a token and `loginType=='CMS'`, call `app_karigar/profile`:
    - If `del=='1'`, show the suspended alert, clear storage, and go to Language.
    - Otherwise go to Tabs and start push after 2 s.
- **Version check:** on every launch, call `app_version`.
  - Compare the result to the installed version with strict string inequality.
  - If they differ, show the "Update Available" alert.
  - If `play_console_flag==1`, force the update: exit and re-check.
- **Back button:**
  - Dismiss any open overlay first.
  - Do nothing on Home, MobileLogin, Otp and SelectRegistrationType.
  - On tab roots other than Home, switch to tab 0.
  - Otherwise show the translated exit confirm.
- **Tabs per `userStorageData.type`**, as in `tabs.html`.
- **The Android 15 edge-to-edge workaround** maps to the safe-area handling.

## 6. Scope

### 6.1 Screens by phase (117 = 61 live + 56 flagged)

Live screens (Phases 1–5) come first. Flagged screens follow in Phases 6–7 (§6.3).

| Phase | Screens |
|---|---|
| 1 Onboarding & auth (7) | Language, SelectRegistrationType, MobileLogin, Otp, Registration, AboutusModal, Tabs, plus start-up/version/back logic |
| 2 Core loyalty (22) | Home (Plumber + Seller/Dealer variants), MainHome, Profile, ViewProfile, PointList, PointHistory, OfferList, Offers, Terms, GiftDetail, CancelpolicyModal, CancelationPolicy, Transaction, ShippingDetail, Notification, Feedback, Pointtranfer, CoupanCode, ScanPoint, SalesPointTransfer, Super30, PointLocation |
| 3 Catalogue & content (11) | Category, SubCategory, Products, ProductDetail, ProductSubdetail, NewArrivals, VideoCategory, Video, About, Contact, QuotationGenrateByPdf |
| 4 Complaints & service (15) | AddNewComplaint, ComplaintHistory, ComplaintDetail, CancelComplaint, ComplaintRemarks, MyCamplaints, PulmberCustomerDetail, PlumberCheckin, TaskClose, CustomerList, CustomerAdd, CustomerDetail, PlumberList, PlumberAdd, PlumberDetail |
| 5 Sales Executive (6) | SalesExecHome, SalesExecAddPlumber, SalesExecAddSeller, SalesExecAddDealer, SalesExecPlumberList, SalesExecPlumberDetail |

Feedback, Transaction and ShippingDetail are **push-only** entry points. They are still ported, and are reached in tests via deep link.

| Phase | Content |
|---|---|
| 0 Foundation | WIP fix, deps, white-label, first APK on phone, nav shell, shared components, native wrappers, mocks/fixtures, contract framework, reference harness, screen-card generator |
| 6 Unreachable loyalty pages (16) | see §6.3 |
| 7 SFA module (40) | see §6.3 |
| 8 Native & release | push (flagged off for Topbath), icons/splash per client, release signing (outside the repo), forced-update rollout (below), Android permission prompts, full regression, Play internal track |
| 9 Second client | Prove the white-label with a second real client's config, and diff that client's Ionic source against Topbath's |
| 10 iOS | Gated on §9.1 |

★ The Topbath release does not wait for Phases 6–7. Their flags are off for Topbath, so a Topbath release can go out after Phase 8 using the Phase 1–5 screens. Phases 6–7 can run in parallel with Phase 8 if capacity allows.

The Customer/Retailer tab layout from `tabs.html` is built in Phase 1 ★. It only reuses live screens, so it costs one tab set and one Maestro flow.

**Forced-update rollout ★.** Ionic compares `app_version` with strict `!=`, and when `play_console_flag==1` a mismatch exits the app. The rules:
- The RN release's `versionName` must equal the value the admin sets in the backend at rollout. That is a data change made through the existing web admin, not a code change.
- The release checklist names who sets it and when: after the RN build is live on the Play track, never before.
- In MOCK and debug builds, `app_version` returns the installed version, so no alert appears.
- The store link comes from `client.playStoreId`.

**Template variance ★.** `client.json` has a `features` map from day one (`push`, `superPlumber`, `quotation`, `pointTransfer`, roles, countries) so per-client differences become flags, not forks. Phase 9 checks this against a second client's source before the template is called done.

**Auth contract changes ★.** RN follows whatever contract production runs at release time. `src/auth/` holds the copied Ionic flow, and the colleague's server-side OTP replaces `otp.ts` as one module, with its own contract tests. If the colleague's change ships before RN, Phase 1's auth gets re-checked against the new contract. The 61 screens otherwise don't depend on it.

### 6.2 Parity rules for known Ionic quirks

Default rule: **copy the behaviour and flag it** with `// NOTE (parity):` or `// NOTE (security, not changed):`. Exceptions are marked ★ (my call; override if you disagree).

| Quirk | Treatment |
|---|---|
| OTP is generated and checked on the client. 5 bypass numbers get OTP 123456. `auth/login` doesn't take an OTP. | Copy and flag as security. Isolated in `src/auth/otp.ts` so the server-side OTP fix replaces one module. |
| `post_rqst`/`get_rqst` send `Token: Bearer undefined/null` | Copy exactly (already done in `client.ts`). |
| JWT is stored unencrypted, and logout is client-side only | Copy and flag. |
| Login uses `push` (not `setRoot`) into Tabs | ★ Use `reset` in RN. The behaviour users see is identical, because the back button is swallowed on Home. |
| Start-up with a non-SUCCESS profile status leaves a **blank screen** | Copy it: a blank root, flagged `// NOTE (parity)` (§2a). |
| Language is not kept after a restart | Copy (parity). Listed as a candidate improvement for the client. |
| Push is not in the production build (plugin missing from the aab) | ★ Implement push with `@react-native-firebase/messaging`, including the type→screen routing from the source, in Phase 8 (Native & release). It's behind `client.features.push` and is **off for Topbath's first release** until the Firebase decision (§9.5) is made, because turning it on changes what users get. Push-only screens are still ported and reached by deep link. |
| Launch-navigator and native-geocoder are called but missing in production | Topbath fails silently, as in production (§2a). Working versions (`Linking` Google Maps intent; Android Geocoder module) sit behind `features.nativeNavigation` and `features.nativeGeocode` for other clients. |
| Video capture and upload to `grafdoer` host | Ported, since all code is in scope, but the trigger stays unbound as in Ionic. The upload URL moves to `client.urls.videoUpload`. ★ Topbath's value is left **empty**, with a security NOTE, instead of copying another client's host: sending Topbath data to `grafdoer` is never correct. |
| Media capture, file transfer, android-permissions, diagnostic (missing from the production build) | Ported with RN equivalents (`react-native-image-picker` video, `react-native-blob-util` upload) on the code paths that call them, and flagged. |
| Hardcoded other-client hosts and brands in unreachable screens (`cloudwaysapps`, `app.gravitybath.com`, "Agmeco", "Gravity") | Labels and image hosts move into `client.json`, keeping Topbath's current values for parity. `'Gravity'` used as a **data value** in `delivery_from` checks stays in code (backend coupling) with a NOTE. |
| Google Maps JS with no key, plus iframe embeds | Render the same embed URLs in a `WebView` for parity. No API key needed. |
| Videos (iframe) and quotation PDF (system browser) | `WebView` embed and `Linking.openURL`, as in Ionic. |
| About half the UI strings are hardcoded English, not translated | Copy as-is. Translated strings use the same keys, and hardcoded ones stay hardcoded. |
| `terms.ts` sends `karigar_id: 22` | Copy and flag. |

### 6.3 Topbath-unreachable screens (ported behind flags)

**Phase 6: unreachable loyalty pages (16).** All use `dd_api`.
- **Screens:** GiftList, PointDetail, Scan, LoginScreen, Digitalcatalog, EditProfile, Enquiry, FavoriteProduct, News, NewsDetail, SurveyList, SurveyDetail, NearestDealer, RetailerAddComplaint, RetailerListComplaint, Search.
- **Flags:** `features.digitalCatalog`, `features.survey`, `features.news`, `features.nearestDealer`, `features.retailerComplaints`, `features.favorites`, and so on. Each one switches on the entry point that is commented out or unbound in Ionic. That includes the Home buttons, Profile's edit link and the ProductSubdetail enquiry link.

**Phase 7: SFA module (40).** This uses the second backend, `rootUrlSfa` = `crm/api/app/`, with its own login.
- **Login and dashboards:** Login, Otpverify, Dashboard, DealerHome, DealerProfile, plus the **side menu** (Employee/SFA and DrLogin item sets from `app.html`).
- **Sales app:** sales-app/* (AddCheckin, AddDealer, AddDistribution, AddLeads, CheckinDetail, CheckinList, CustomerCheckin, CustomerOrder, DistributorDetail, DistributorList, EditNetwork, EndCheckin, MainDistributorList).
- **Attendance, leave and travel:** Attendence, WorkTypeModal, AddLeave, LeaveList, TravelAdd, TravelList.
- **Dealer and executive management:** DealerCheckIn, DealerDealerList, DealerDiscount, DealerExecutiveApp, DealerExecutiveList, ExecutivDetail, ExecutiveEdit, ExecutivePopover, LeadsDetail.
- **Orders:** AddOrder, DealerAddorder, DealerOrder, CartDetail, OrderList, OrderDetail, ExecutiveOrderDetail.
- **Flag:** `features.sfa` adds the Employee/DrLogin options to SelectRegistrationType. App start resumes `loginType` `SFA`/`Employee`/`DrLogin` sessions, using the branches that are commented out in `app.component.ts:258-299` and restored. Storage keys `order_item_array`, `order_item_length` and `order_details` are carried over.
- **Native:** `react-native-blob-util` for invoice upload, and netinfo on Dashboard.

**Shared rules for both phases:**
- With every flag off (Topbath), navigation must be identical to today. A test asserts that no flagged route is reachable from the Topbath root.
- The parity harness and Maestro reach flagged screens with a test-only client config, `clients/_all-features/`, that turns every flag on. It is never shipped.
- **Reference caveat:** some of these screens never ran in production. Where Ionic code is broken (e.g. missing plugins, `undefined` fields), RN copies the intent, and the reviewer records each gap in the screen's `card.md`.
- `docs/INVENTORY.md` records, for each screen, why it's unreachable in Topbath (file:line), so a client that enables a flag knows what they are switching on.

## 7. Testing strategy

Five layers, cheapest first. Layers 1–4 run with no backend access.

1. **Contract tests (Jest, per endpoint).**
   - For each live endpoint, `api/contracts/<endpoint>.json` records the Ionic call: helper (`onPost…` / `post_rqst` / `get_rqst` / `onGet…`), method, base URL, header set, and body key structure with example values. These are taken from the Ionic source by the screen-card generator and checked by the reviewer.
   - The screen's `contract.test.ts` drives the RN call path and asserts that the outgoing `fetch` (in LIVE mode with `fetch` mocked) matches the contract exactly.
2. **Mock flow tests (Jest).** These run against the stateful mock store, for example scan coupon → balance increases → redeem → transaction listed, and register → pending → AboutusModal.
3. **Visual parity (reference harness).**
   - `parity/reference/`: the Ionic app is built from source at `b33d82f`. It's an old toolchain, so the build uses Node 10 in a container or nvm, with the lockfile registry rewritten from the dead taobao mirror to npmjs. The fallback is the aab www for unchanged screens.
   - The build is served statically and driven by **Playwright** at 360×800 with Android-like fonts. All requests to `apps.abacusdesk.com` are intercepted and answered from `src/api/fixtures`, and Cordova plugins are stubbed.
   - A script walks each screen and state in `parity/states.json` (screen, role, fixture variant, nav params) and saves a reference PNG.
   - The RN side uses Maestro on the Android emulator in MOCK mode with the same fixture variant and deep links, and saves a candidate PNG.
   - `parity/report.html` shows reference, candidate and a diff overlay side by side. Pixel equality isn't expected (WebView vs native text rendering), so the gate is **human sign-off per screen in the report**, plus an automatic flag when the layout diff is over a threshold.
4. **E2E flows (Maestro, per role, MOCK).** Login as each role, go through every tab, the main flow of each phase gate, the back-button rules, and the forced-update alert.
5. **DEV/LIVE smoke (needs test accounts from the team).**
   - Read-only endpoints are checked first: real responses are recorded and checked against the fixtures, and fixtures that drift are updated.
   - Write flows run only on DEV.
   - Nothing runs against LIVE without explicit permission.

**Phase gate** = all of the phase's screens are signed off in the parity report, its contract and flow tests are green, its Maestro flows are green, and the debug APK has been checked on the physical phone.

## 8. Subagent-driven conversion (Sonnet 5.5)

**Roles**
- **Orchestrator (Opus, main session).** Generates screen cards, dispatches batches, merges, runs gates, keeps `PLAN.md` and `LEARNING-LOG.md` current, and escalates questions to Dhruv.
- **Implementer (Sonnet 5.5, fresh context per screen).** Input: the screen card, the Ionic files, and PLAYBOOK Part A/B. Output: `screens/<Name>/*`, fixtures and fixture variants for its endpoints, `contract.test.ts`, a `parity/states.json` entry, a Maestro snippet, and a commit on its branch.
- **Reviewer (Sonnet 5.5, fresh context, never the implementer).** Checks the screen against the **Ionic source**, not the card:
  - every element, text and i18n key
  - every condition (`*ngIf`) and role branch
  - every endpoint body
  - every nav target and param
  - loaders, alerts and toasts
  
  It returns pass or a list of concrete misses. There are at most 2 fix loops; after that it escalates to the orchestrator.

**Screen card** (`screens/<Name>/card.md`, generated by script and finished by the orchestrator):
- Ionic files and line counts
- role(s) and status
- reached-from and nav params in
- endpoints with helper, body and response fields read
- nav targets out
- overlays and natives
- i18n keys and hardcoded strings
- SCSS classes and the global `variables.scss` rules that apply
- parity-quirk notes from §6.2
- the list of states to screenshot

**Parallelism without conflicts**
- Shared foundation (components, native wrappers, navigation shell, harness) is built first, in Phase 0, by the orchestrator or one subagent at a time.
- Within a phase, screens run in batches of up to 4, each in its own git worktree. A screen only touches its own folder plus new fixture files. Routes are generated, and the mock index auto-discovers fixtures.
- If a screen needs a new shared component, it stops and reports. The orchestrator adds the component and then resumes the screen.
- Merge order: an automatic gate (tsc, eslint including the no-brand rule, jest), then the reviewer passes, then a candidate screenshot is produced, then the merge.

## 9. Open decisions (need Dhruv/client)

1. **iOS build path.** Options: a Mac (own, a colleague's, or a rented cloud Mac), or relaxing "local only" for iOS through a cloud build service. Until this is decided, the template keeps `ios/` compiling only as far as can be checked on Windows: TS, pods config and Info.plist entries. No iOS binary is built.
2. **SFA backend access.** The SFA screens call ~100 `crm/api/app` endpoints. Their fixtures are inferred from Ionic code only. DEV verification needs that backend's source or test accounts.
3. **Test accounts and dev server** for layer 5, one per role.
4. **Per-client secrets.** Where `google-services.json`, release keystores and passwords live (a team secret store). The release keystore currently committed in the Ionic repo must be rotated or handled by whoever owns Play signing.
5. **Firebase project.** Topbath currently points at `grafedoer`, another client's project. Decide whether to keep it or create a Topbath project. This affects push in Phase 8 only.
6. **Replacing the live app (release owner, not the migration).** Does RN ship as an update to the existing `com.topsan.app` Play listing? Is Play App Signing on? Must logged-in users stay logged in? Ionic keeps the session in WebView storage, which React Native can't read.
   ★ Default: no session migration, so users log in once with OTP after the update. The migration scope (Dhruv) ends at a signed-ready release build. Phase 8 carries an **optional** "session carry-over" task that reads the old WebView `userStorageData` on first launch. It's built only if the release owner asks for it, and it is listed in the release hand-off notes together with the Play App Signing and keystore question.

## 10. Builder's discretion

Exact library versions; the internal component API; folder naming inside `parity/`; how Maestro screenshots are cropped; fixture data content (realistic Indian names and numbers, no real PII); the reverse-geocode implementation; the commit message format beyond `feat(screen): port <Name>`.
