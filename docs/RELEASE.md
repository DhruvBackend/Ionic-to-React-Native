# Release hand-off notes (Topbath, plan Task 8.4)

Written 2026-11-05. The migration scope ends at a **signed-ready release build**. Uploading to Google Play and every decision
marked **(release owner)** belong to whoever owns the `com.topsan.app` Play listing. Nothing here has been done on the
production app or the live server.

## 1. What a store build is

- Client config: `node scripts/use-client.mjs topbath` (writes `src/config/client.ts`, `android/client.properties`, pictures, icons, splash).
- Store build: `cd android && ./gradlew bundleRelease` → `android/app/build/outputs/bundle/release/app-release.aab`.
  - Package `com.topsan.app` (no `.rn` suffix): it **replaces the live Ionic app** when uploaded to the same listing.
  - `src/config/env.ts` `MODE` must be `'LIVE'` for the store build (it is `'DEV'` in the repo, the team's default). Changing it is part of the release, not of the migration.
- Test builds never touch the Play app: `assembleDebug` and the speed build `assembleReleaseRn` install as `com.topsan.app.rn`, signed with the debug key.

## 2. Signing (Task 8.3)

- `bundleRelease` / `assembleRelease` read four properties from **outside the repo**, normally `~/.gradle/gradle.properties`:
  ```
  TB_STORE_FILE=C:/path/to/upload-key.jks
  TB_STORE_PASSWORD=...
  TB_KEY_ALIAS=...
  TB_KEY_PASSWORD=...
  ```
  Without them the build stops at once with: `Release signing is not configured: missing ...`.
- Verified 2026-11-05: without the properties the build fails with that message; with a throwaway local test keystore
  (not committed, not the real key) `bundleRelease` produces a signed `.aab`.
- **(release owner)** Is Play App Signing on for `com.topsan.app`? If yes, the file above is the *upload* key. If no, it must be the original app signing key, or Play rejects the update.
- **(release owner)** The Ionic repo has a release keystore committed. Treat it as exposed: rotate it (upload-key reset in Play Console when Play App Signing is on) and keep the new key in the team's secret store.

## 3. Version and forced update (spec §6.1)

- `clients/topbath/client.json`: `versionName` **0.1.5** (same as the Ionic `config.xml` version), `versionCode` **1**.
- **(release owner)** `versionCode` must be **higher than the live Ionic build's versionCode** on Play. Set it in `client.json` (then run `use-client.mjs topbath`) before building. The live value is shown in Play Console (it could not be read from the local copy of the app bundle).
- Forced update: Ionic compares the server's `app_version` with the installed `versionName` using strict `!=`; when `play_console_flag == 1` a mismatch shows the update alert and exits. RN copies this 1:1. Order of rollout:
  1. Release the RN build on Play (internal track first).
  2. Only **after** it is live, the admin sets `app_version` in the existing web admin to the RN `versionName`. Setting it earlier locks out everyone on the old version.
  3. If `versionName` stays 0.1.5 (same as Ionic), no forced-update alert appears for anyone; raising it forces the old Ionic installs to update.

## 4. Existing users' login (spec §9.6)

- Ionic keeps the session in WebView storage, which React Native cannot read. **Default: no carry-over.** Every user logs in once more with OTP after the update.
- **(release owner)** If users must stay logged in, plan Task 8.5 (optional) adds a small native module that reads the old WebView `userStorageData` on first launch. Not built.

## 5. Push notifications (Task 8.1)

- Topbath has push **off** (`features.push: false`), exactly like the shipped app's behaviour for these screens. The tap routing in Ionic (`app.component.ts:896-1015`, `home.ts:960-1040`) is the only way to Feedback / Transaction / ShippingDetail.
- **(release owner / TL)** Firebase project: Topbath's Ionic config points at `grafedoer`, another client's project. Decide whether to keep it or create a Topbath project, and supply that project's `google-services.json` before the native Firebase libraries are added. Until then no Firebase code is in the build.

## 6. Open security notes (copied from Ionic on purpose, not changed)

`grep -rn "NOTE (security" src` lists them. As of 2026-11-05:

| Where | What |
|---|---|
| src/api/client.ts:77 | token sent in both `Authorization` and a custom `Token` header |
| src/api/client.ts:98 | `set_token_value()` is never called in Ionic |
| src/auth/otp.ts:3, MobileLogin:103, Otp:77 | the login OTP is generated and compared on the phone (loose `==`); bypass numbers get `123456` |
| src/auth/session.ts:4, Profile:142, SalesExecHome:152 | the JWT is stored unencrypted; logout only clears the phone, the token stays valid on the server |
| CancelpolicyModal:176 | the redeem OTP is compared on the phone and arrives in the `sendOtp` response |
| Terms:49 | `karigar_id` is the literal 22 for every user |

These need server-side changes (OTP verification, token revocation). They are the same in the live Ionic app today.

## 7. Before the store upload (checklist)

- [ ] Real-server smoke test on **DEV** with test accounts for every role (login, scan, redeem, complaints), speed build `assembleReleaseRn`.
- [ ] Parity reports signed off for Phases 1-6 (`node parity/signoff.mjs`), tap checks done on the phone.
- [ ] `MODE = 'LIVE'`, `versionCode` raised, signing properties in place.
- [ ] Release owner: Play App Signing / key, Firebase decision, session carry-over decision.
- [ ] Upload to the **internal** track first; then set `app_version` in the admin as in section 3.
