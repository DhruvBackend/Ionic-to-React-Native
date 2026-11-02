# Handoff: Topbath Ionic → React Native migration

*Written 2026-11-02 to hand over to a fresh session. Read this file first, then the plan.*

## Who and what

- **User:** Dhruv, an AI developer at Basiq360/Abacusdesk. His job is only the migration; a colleague owns security fixes.
- **Goal:** migrate the Topbath ("Topsan") Ionic 3.9.5 / Cordova loyalty app to React Native as an **exact 1:1 copy**: no UI or behaviour changes, quirks and bugs included. It becomes a **white-label template** for 70+ client apps.
- **RN repo:** `C:\Users\dhruv\Projects\topbath-rn`. Main branch is **`master`**.
- **Ionic repo (READ-ONLY):** `C:\Migrations\Topbath_App_loyalty`.
- **Plan:** `docs/superpowers/plans/2026-10-29-topbath-rn-migration.md`. The Global Constraints are at the top; the "S-task" per-screen procedure (including the S5 rules and the interaction check) is below them; every task has a **Status** note.
- **Spec:** `docs/superpowers/specs/2026-10-29-topbath-rn-migration-design.md`.
- **Also:** `docs/PLAYBOOK.md` (pilot lessons, safe worktree clean-up), `docs/LEARNING-LOG.md` (Dhruv's interview-prep log), `docs/inventory.json` / `docs/INVENTORY.md` (117 screens: 58 LIVE, 3 PUSH-ONLY, 56 DEAD behind flags), `parity/README.md` (comparison harness).

## Hard rules (Dhruv's)

1. **Push only to `origin` = github.com/DhruvBackend/Ionic-to-React-Native** (private, named by Dhruv 2026-11-02, gh account `DhruvBackend`). No other remote.
2. **Exact 1:1 copy.** Copy Ionic's loose `==`/`!=`, loaders that stay stuck on errors, typos and dead buttons. Mark each with `// NOTE (parity)`. Copy security weaknesses unchanged with `// NOTE (security, not changed)`: client-side OTP, 5 bypass numbers, "Bearer undefined".
3. **The app talks to the DEV server** (`devcrm.abacusdesk.com`). Jest is forced to MOCK. **Never send anything to production** (`apps.abacusdesk.com`) without explicit approval.
4. **Use Dhruv's phone, not the emulator.** He said the emulator is too heavy and laggy.
   - Phone: OnePlus CPH2707, Android 16, adb serial `444538eb`, already 360dp at density 480.
   - Build arm APKs only: `cd android && ./gradlew assembleDebug -PbundleDebugJs -PreactNativeArchitectures=armeabi-v7a,arm64-v8a -q`.
   - Install: `adb -s 444538eb install -r android/app/build/outputs/apk/debug/app-debug.apk`.
   - The USB link drops often. `adb kill-server; adb start-server` usually brings it back; otherwise ask him to replug.
   - For captures, ask him to turn on Do Not Disturb. Use `svc power stayon usb` during captures and restore `settings put global stay_on_while_plugged_in 0` afterwards.
   - **Never run Gradle and an emulator together** (the laptop has ~15 GB RAM).
5. **After every step:** say whether the APK changed, give a plain-language summary, and add a learning-log entry (What / Why / Learned / Interview angle).
6. **Credentials:** Dhruv has a dev test account. He types the number and OTP into the app himself, **never in chat**.
7. **Subagents:** Sonnet subagents implement and review. The lead (you) verifies, captures on the phone, merges and talks to Dhruv.

## Where things stand

- **Phase 0: COMPLETE.** Signed off by Dhruv. The kit, splash, native wrappers, parity harness, inventory and the Language pilot are all done.
- **Phase 1** (onboarding/auth, 7 screens):

| Screen | State |
|---|---|
| Language | Merged, signed off |
| SelectRegistrationType, MobileLogin, Otp | Merged to master (S8 reviews PASS). **Phone captures, tap checks and sign-off not done yet** |
| Registration | Branch `screen/Registration` (aefc2c6), worktree `../tb-wt-Registration`. S8 PASS. **Not merged yet** |
| AboutusModal | Branch `screen/AboutusModal` (2f3829b, rebased on master 0bb6c4c), worktree `../tb-wt-AboutusModal`. Contact details now come from `client.contact`. **Needs S8 review, then merge** |
| Tabs | Branch `screen/Tabs` (2aa639a), worktree `../tb-wt-Tabs`. Changes `src/navigation/RoleTabs.tsx` (parseInt index; index '5' + token → `resetTo('Profile')`). **Needs S8 review, then merge; rebase first, master changed nav files** |

- **Dev-server check: done.** Dhruv logged in end to end on dev.
  - Fixed: the dev server sends `del`, ids, points and the OTP as **numbers**. Fixtures were updated, and startup now uses a loose `==`.
  - A debug-only `[api-shape]` log in `src/api/client.ts` records only reply structure. Captured shapes are in `.reference/logs/devcheck_shapes*.txt`.
- **Fixed today:**
  - All tab-bar taps went to the last tab: the measuring `Text` overflowed, and on Android a `Text` ignores `pointerEvents`. The copy is now wrapped in a `View`.
  - `resetTo` used the focused navigator; it now uses `resetRoot`.
  - Hardware back now uses the active (tab) nav.
  - A contact-detail lint ban was added.
- **Tests on master:** 574+ passing; `npx tsc --noEmit` and `npx eslint .` clean.
- **APK on Dhruv's phone:** a master build from ~66d4469 (tab fix included).

## Next steps, in order

1. **S8 reviews, in parallel subagents, for `screen/AboutusModal` and `screen/Tabs`.** Use the same brief style as the earlier reviewers: diff vs master, Ionic sources, card, ref PNGs, plan rules. Fix any misses.
2. **Merge Registration, AboutusModal and Tabs into master.**
   - Regenerate shared generated files with `node scripts/gen-routes.mjs` and `node scripts/gen-fixtures.mjs`.
   - Resolve contract/fixture overlaps (e.g. `auth__login`).
   - Run `npx jest` (all), tsc, eslint and `npm run parity:test`.
   - **Before removing worktrees, delete their junctions first:** PowerShell `(Get-Item <wt>\node_modules).Delete(); (Get-Item <wt>\parity\reference\work).Delete()`, then `git worktree remove <wt>`. **Never use `--force` with junctions present:** it emptied the main repo's node_modules once. Recovery: `npm ci`, then `bash parity/reference/build-ionic.sh`.
3. **Phase 1 flow test** `__tests__/flows/login.test.ts` (plan, Phase 1 section). In MOCK, for each role: Language → SelectRegistrationType → MobileLogin → Otp, then SUCCESS → Tabs, NOT FOUND → Registration → submit → Tabs, unverified → AboutusModal.
4. **Build the arm APK, then phone captures for all Phase 1 states:** `npm run parity:ref -- --only <Screen>.` and `npm run parity:rn -- --only <Screen>. -s 444538eb`, then `npm run parity:report`.
   - Look at **every** pair; contact sheets via `.reference/logs/sheet.cjs` and `sbs.cjs`.
   - Do the **tap check**: tap every interactive element with `adb shell input tap` and confirm the right thing happened.
5. **Report for Dhruv's Phase 1 sign-off.** Record it with `node parity/signoff.mjs <id> ok "<note>"`, then update the plan status and learning log.
6. **Then Phase 2** (22 core loyalty screens), the same way. Up to ~3 parallel worktrees (laptop memory). Kit gaps go to master first.

## Open items and decisions

- **Fleet automation for the other ~50 client apps** is proposed: a drift scanner, a client importer, a fleet build and auto-compare. It needs 2-3 other client Ionic repos from Dhruv. Not started.
- **Production bug for Dhruv's colleague:** the video and invoice uploads are broken in the Play Store app because `cordova-plugin-file-transfer` was never shipped. RN copies this behind the `nativeUpload` flag (off).
- **Phase 8 note:** `src/api/fixtures/_sessions.json` (fake sessions) is bundled into the JS. Move it behind the debug-only path before release.
- **i18n risk:** pages whose module has its own `TranslateModule.forRoot` and never calls `use()`. Check each screen in S8 (plan, Phase 1 note). Registration is eagerly imported, so it is fine.
- **Memory notes** for Claude live in `C:\Users\dhruv\.claude\projects\C--Migrations-Topbath-App-loyalty\memory\` (index `MEMORY.md`).
