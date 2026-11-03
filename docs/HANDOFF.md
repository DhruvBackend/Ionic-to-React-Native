# Handoff: Topbath Ionic → React Native migration

*Written 2026-11-03 (~19:00) at the end of session 3, to start **Phase 3** in a fresh session. Read this file first, then the plan sections it points to.*

## Update 2026-11-04 (session 4, overnight): Phase 3 merged

- **All 11 Phase 3 screens ported, independently reviewed (S8) and merged** into `master` (`56cf1e3`, + this docs commit). Flow tests `__tests__/flows/catalogue.test.tsx` (catalogue → infinite scroll offset → share text; quotation → `quotation_pdf` → `openExternal`). Gates: jest 1408/1408 (88 suites), tsc clean, eslint 0 errors (74 warnings), parity:test 14/14. No worktrees left. Details and phone-pass items: plan, "Phase 3" status.
- Ran under the new token rules (`docs/TOKEN-POLICY.md`): 6 batches, diff-only Sonnet reviews, quiet gates. Subagent tokens about 2.1M in total (implementers 145-200k each, reviewers 60-85k each).
- **Not done yet: phone pass for Phase 2 + Phase 3** (needs Dhruv's phone, in the office 2026-11-04). Use `npm run parity:triage`. Phase 3 is not "signed off" until that pass and Dhruv's sign-off.
- **master is 131+ commits ahead of origin.** Ask Dhruv before pushing.
- Worktrees lack `parity/reference/work`, so the parity test "Language.default capture produces a non-blank PNG" always fails there; it passes on master. Tell implementers to ignore it.
- TL work summary for Phase 3: given to Dhruv in chat on 2026-11-04 (true statements only: ported + reviewed + merged; phone testing pending).

## Who and what

- **User:** Dhruv, an AI developer at Basiq360/Abacusdesk. His job is only the migration; a colleague owns security fixes. He reports daily to his TL ("Manu sir").
- **Goal:** migrate the Topbath ("Topsan") Ionic 3.9.5 / Cordova loyalty app to React Native as an **exact 1:1 copy**: no UI or behaviour changes, quirks and bugs included. It becomes a **white-label template** for 70+ client apps.
- **RN repo:** `C:\Users\dhruv\Projects\topbath-rn`. Main branch is **`master`**.
- **Ionic repo (READ-ONLY):** `C:\Migrations\Topbath_App_loyalty`.
- **Plan:** `docs/superpowers/plans/2026-10-29-topbath-rn-migration.md`.
  - Global Constraints are at the top.
  - The **S-task** per-screen procedure (S1–S9, the S5 rules, the interaction check) is in the middle. **The S5 rules list every kit helper screens must use** (kit `Text`, `useIonViewWillEnter`, `src/ui/angularPipes`, `webAlert`, modal-portal back, alert text rules…). Read them.
  - Phase 2 status is recorded in "Phase 2: Core loyalty (22)". Phase 3 is "Phase 3: Catalogue & content (11)".
- **Token rules (2026-11-03, read these):** `docs/TOKEN-POLICY.md`, agent briefs `docs/IMPLEMENTER-BRIEF.md` and `docs/REVIEWER-BRIEF.md`, `npm run gates` (quiet gates), `npm run parity:triage` (cropped diffs + contact sheets).
- **Also:** `docs/PLAYBOOK.md` (worktree clean-up), `docs/LEARNING-LOG.md` (Dhruv's interview-prep log; add an entry per step), `docs/inventory.json`, `parity/README.md`.

## Hard rules (Dhruv's)

1. **Push only to `origin` = github.com/DhruvBackend/Ionic-to-React-Native** (private). Never push from the Ionic repo (its origin is the COMPANY repo). Run `git remote -v` first. **Push only when Dhruv asks.** master is **99 commits ahead of origin** (last push 88877f0 this morning); ask him whether to push.
2. **Exact 1:1 copy.** Copy loose `==`, stuck loaders, typos, dead buttons; mark with `// NOTE (parity)`. Security weaknesses copied with `// NOTE (security, not changed)`.
3. **DEV server only** (`devcrm.abacusdesk.com`); Jest forced to MOCK; never production without explicit approval.
4. **Phone, not emulator.** OnePlus CPH2707, Android 16, adb serial `444538eb`, 1080x2378, density 480 (360dp).
   - Debug build (captures/tap checks; debug links + MOCK): `cd android && ./gradlew assembleDebug -PbundleDebugJs -PreactNativeArchitectures=armeabi-v7a,arm64-v8a -q`, then `adb -s 444538eb install -r android/app/build/outputs/apk/debug/app-debug.apk`.
   - Speed build for demos (no debug links, real login on the dev server): `./gradlew assembleReleaseRn`.
   - **Play Store `com.topsan.app` is his PRODUCTION account: never touch it.** Check packages with `aapt dump badging` (expect `com.topsan.app.rn`).
   - USB drops often: `adb kill-server; adb start-server`, else ask him to replug and allow USB debugging.
   - Before captures: set `settings put system screen_off_timeout 1800000` + `svc power stayon usb`; **restore afterwards** (`30000`, `svc power stayon false`). They are restored now.
   - **Git Bash mangles phone paths** (`/sdcard/...` becomes `C:/Program Files/Git/sdcard`): prefix adb shell commands with `export MSYS_NO_PATHCONV=1;`.
   - **Never run Gradle and jest/captures together** (laptop has 16 GB RAM). Max 3 worktrees in parallel; jest `--maxWorkers=2`.
5. **After every step:** say whether the APK changed, give a plain-language summary, add a learning-log entry (What / Learned / Interview angle).
6. **Credentials:** Dhruv types numbers and OTPs himself, never in chat.
7. **Subagents:** Sonnet implementers + an independent Sonnet reviewer per screen; the lead verifies, merges and talks to Dhruv.
8. **Worktrees:** delete junctions before `git worktree remove`: PowerShell `(Get-Item <wt>\node_modules).Delete()` and, if present, `(Get-Item <wt>\parity\reference\work).Delete()`. **Never `--force` with junctions** (it once emptied the main node_modules; recovery `npm ci` + `bash parity/reference/build-ionic.sh`).
9. **Honest status only.** Dhruv once asked to report Phase 3 as "done" before it was started; the lead declined and wrote "tonight" instead. Never write a status (to him or for his TL) that is not true at that moment.
10. **Phone screenshots:** when he says "don't take screenshots", use `uiautomator dump` + logcat instead.
11. **Debug build tip for Dhruv:** a fresh launch has no test user (blank page). He asks "switch to plumber" and the lead opens `topbathrn://open?screen=Tabs&role=Plumber&mock=1` via `adb shell am start -a android.intent.action.VIEW -d '<link>' com.topsan.app.rn`. Old `app-debug.apk` copies in his phone's Downloads caused a "white screen" once: install from the laptop.

## Where things stand (2026-11-03 evening)

- **Phases 0 and 1: complete and signed off. Phase 2: all 22 screens ported, reviewed and merged** (Home, MainHome, Profile, ViewProfile, PointList, PointHistory, OfferList, Offers, Terms, GiftDetail, CancelpolicyModal, CancelationPolicy, Transaction, ShippingDetail, Notification, Feedback, Pointtranfer, CoupanCode, ScanPoint, SalesPointTransfer, Super30, PointLocation) + flow tests `__tests__/flows/scan-redeem.test.tsx` and `transfer.test.tsx`.
- **master = `5037188`** (+ this handoff commit), clean, no worktrees. jest **1269/1269** (74 suites), tsc clean, eslint 0 errors (63 warnings), `npm run parity:test` 14/14.
- **Phone:** has the newest debug build (5037188). Screen settings restored.
- **Phase 2 phone pass: first round done, second round pending.**
  - Round 1 (88 Ionic-vs-RN pairs, reviewed by 3 agents) found ~30 misses; **all fixed and merged** (fix sets A and B), plus kit fixes (below).
  - **Still to do for Phase 2:** re-capture all 89 RN states with the new build, look at every pair, confirm the fixes, tap-check every control, then Dhruv's sign-off (`node parity/signoff.mjs <id> ok "<note>"`). Re-capture `Tabs.Retailer` (deferred from Phase 1) too.
  - Items needing a phone check: PointLocation map (now an iframe; confirm Google accepts it), Home "Toda" label (unit moved out of `pints`), Offers redeem line + title truncation, Super30 dashed connector, PointList chevron (offset cause not proven), ViewProfile close button.
- **Known items still open (not bugs in the RN code):**
  - Missing pictures: Ionic shows Chrome's broken-image icon, RN an empty box (same size). A kit "broken image" component was considered and deferred.
  - Real server HTML in CancelationPolicy / Terms policy text may contain `<ul><li>`; `stripHtml` flattens lists. Check on the dev server (speed build).
  - Per-screen client pictures (PointList icons, Profile avatar, OfferList `noFound.ts`) should move into `clients/<id>/assets` via `scripts/use-client.mjs`.
  - Kit question: `normalLineHeight(14)` = 16 but Chrome measured 17 for 14px paragraphs (CancelationPolicy); check other multi-line 14px text.
  - Retailer Home reference shows no tab bar (harness, not checked).

## Kit / harness changes made in session 3 (use them, do not re-invent)

- `src/components/ionic/IonText.tsx`: kit `Text` (textBreakStrategy simple). Lint bans react-native `Text` in screens/components.
- `src/navigation/useIonViewWillEnter.ts`: Ionic ionViewWillEnter semantics (no re-entry after a modal is dismissed).
- `scripts/gen-routes.mjs` + `src/navigation/ionicModalPages.json`: placeholder routes for unported pages; modal presentation enforced.
- `src/navigation/navigationRef.ts`: `activeNavNames()`, `modalPortalNav()` (+ `ionicModalPortalPages.json`): hardware back on Ionic modal pages shows the exit alert.
- `src/ui/angularPipes.ts`: `interp`, `collapseWs`, `titlecase`, `datePipe(v, fmt)`, `momentFormat(v, fmt)`.
- `src/ui/webAlert.ts`: Ionic `window.alert` = Cordova native dialog titled "Alert".
- `src/components/ionic/html.ts`: alert/loading text collapses white space like Ionic's innerHTML (screens pass Ionic's exact strings).
- `IonField labelStyle`; `IonContent` re-parks the refresher spacer and never reports a negative scrollTop; `IonInfiniteScroll` ignores scroll events without movement; `WebEmbed iframe` mode; IonStack modal routes are transparent (page below visible).
- i18n starts in **`cimode`** (raw keys) like Ionic after a restart; Language/MobileLogin/Otp set the language. Jest setup selects `en`.
- MOCK: stateful loyalty handlers `src/api/mock/handlers/loyalty.ts` (unchanged fixture output until a write).
- Harness: fixture answers wait 1 s (`parity/reference/capture.mjs`); `google.maps` / location-accuracy / geolocation stubs (`stubs.js`); RN shots kept 1:1 and padded (`fitToRef`, no stretch); states may set `rnScreen`/`rnParams`/`rnAction` to open a screen through another one. Debug links: logged-in English state = cold start (`cimode`).
- Helper scripts (git-ignored) in `.reference/logs/`: `sheet3.cjs` (side-by-side sheets), `diffs.mjs` (diff % per Phase 2 pair), `mkprobe*.cjs` (DOM probes). **Settle disputes by probing the Ionic DOM** (temporary `parity/states.d/_tmp.json`, delete afterwards): it decided the CancelpolicyModal checkbox state and the Super30 star row height today.

## Next steps

### 1. Phase 3: Catalogue & content (11 screens)

Screens: Category, SubCategory, Products, ProductDetail, ProductSubdetail, Newarrivals, VideoCategory, Video, About, Contact, QuotationGenrateByPdf.

- Same process as Phase 2: `node scripts/screen-card.mjs <Name>` → worktree `../tb-wt-<Name>` (branch `screen/<Name>`, junction node_modules) → Sonnet implementer with the brief → independent Sonnet S8 review → fix loop (max 2) → merge → `node scripts/gen-routes.mjs` + `node scripts/gen-fixtures.mjs` → jest, tsc, eslint, parity:test → remove worktree (junctions first).
- **Implementer and reviewer briefs:** recreated as `docs/IMPLEMENTER-BRIEF.md` and `docs/REVIEWER-BRIEF.md` (2026-11-03). Send those, not the plan. Batch simple screens 2–3 per implementer (`docs/TOKEN-POLICY.md`).
- Order: screens with the most inbound links first (check the cards' "Nav targets"); check endpoint overlaps before running screens in parallel (a shared endpoint's contract/fixture goes on master first, as `offerList` did).
- Phase 3 flow test (plan): Category → SubCategory → ProductDetail (infinite scroll next offset) → ProductSubdetail → share with the Ionic text; Quotation: build a list → `quotation_pdf` → `openExternal(upload_url3 + file_name)`.

### 2. Phone pass for Phase 2 + Phase 3 together

Build the debug APK, install, capture refs (`node parity/reference/capture.mjs --only <Screen>.`) and RN (`node parity/capture-rn.mjs --only <Screen>. -s 444538eb`) for both phases, run `npm run parity:triage` (cropped DIFF images + OK contact sheets), review every DIFF crop and every contact sheet (split between reviewer agents, spot-check), fix, re-capture, tap-check every control, report for sign-off. Then build the **speed build** for Dhruv's TL demo.

### 3. Phase 4: Complaints & service (15 screens), starting 2026-11-04

AddNewComplaint, ComplaintHistory, ComplaintDetail, CancelComplaint, ComplaintRemarks, MyCamplaints, PulmberCustomerDetail, PlumberCheckin, TaskClose, CustomerList, CustomerAdd, CustomerDetail, PlumberList, PlumberAdd, PlumberDetail (flow test in the plan).

### 4. Work summaries for Dhruv's TL: after Phase 3 AND after Phase 4

When Phase 3 is merged (and again when Phase 4 is merged), write Dhruv a work summary he can paste to his TL:
- Format (his template): starts `@Manu sir,` / `Today's work summary,`, then numbered bold sections with short nested bullets (what was done, findings, fixes, quality and safety, next). **No tables.** About 550–650 words.
- Plain language, concrete numbers (screens, tests passing, differences found and fixed), real bugs called out.
- **Only true statements**: say exactly what is ported, what is reviewed, and what is still pending (e.g. phone testing). Never mark a phase "done" before its screens are merged.
- Also give the usual "APK changed?" line and summary to Dhruv.

## Open items (unchanged from earlier handoffs)

- Fleet automation for the other ~50 client apps (needs 2–3 client Ionic repos from Dhruv).
- Production bug for his colleague: video/invoice uploads broken in the Play Store app (file-transfer plugin never shipped); RN copies it behind `nativeUpload` (off).
- Phase 8: move `_sessions.json` behind debug, bundle/startup optimisation, split APK per ABI.
- Memory notes: `C:\Users\dhruv\.claude\projects\C--Migrations-Topbath-App-loyalty\memory\` (index `MEMORY.md`).
