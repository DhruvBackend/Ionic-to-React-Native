# Implementer brief (one screen, or a small batch)

You port Ionic 3 page(s) to React Native as an **exact 1:1 copy** in your worktree `../tb-wt-<Name>` (branch `screen/<Name>`). The Ionic repo `C:\Migrations\Topbath_App_loyalty` is READ-ONLY (source at commit `b33d82f`). Your inputs: this brief, the screen card(s) (`src/screens/<Name>/card.md`), the Ionic `.html/.ts/.scss/.module.ts`. **Do not read the plan**; this brief is the plan's rules, condensed. Token rules: `docs/TOKEN-POLICY.md`.

## Hard rules
- **No UI or behaviour changes.** Copy typos, odd spacing, capitalisation, dead buttons, loose `==`/`!=` (use `==` + `// eslint-disable-line eqeqeq`), loaders Ionic leaves stuck on error paths (then no `useLoader().wrap`). Mark each with `// NOTE (parity): <what/why>`; security weaknesses with `// NOTE (security, not changed): <what>`.
- Same endpoint paths, HTTP method, headers, body key tree and storage keys as Ionic.
- File header: `// Ported from: src/pages/<path>/<file>.html + .ts + .scss`.
- No client strings in `src/screens/**` / `src/components/**` (no hex colours, brand names, URLs, phone numbers): use `client` / `theme`.
- **Do not edit shared code** (`src/components/**`, `src/navigation/**`, `src/ui/**`, `src/api/*.ts`, `scripts/**`, other screens). Need a new kit piece or a change there → **STOP and report**.
- **Shared fixtures: only add variants**, never change existing ones.
- No APK, Gradle, adb or captures. No `git push`. Jest only with `--maxWorkers=2` (use `npm run gates`).

## Files per screen
`src/screens/<Name>/index.tsx`, `styles.ts`, `route.ts` (`feature` from `docs/inventory.json`; `presentation: 'modal'` where Ionic used `modalCtrl`), `<Name>.test.tsx`; `src/api/contracts/<endpoint>.json` (with `ionicSource` file:line); `src/api/fixtures/<endpoint>.json` variants (`default`, `empty`, `malformed`, plus each status the screen branches on; real server types: ids/flags/points are NUMBERS); `parity/states.d/<Name>.json`; `.maestro/screens/<Name>.yaml`. Fill the card's **Quirks** and **States** (`default`, each role / `*ngIf` branch, `empty`, `malformed`, `hin` if translated).

## Steps
1. Contracts and fixtures from the Ionic call sites.
2. Failing tests first: one `expectContract` per endpoint driven through the real press/entry path; a render test per state (key texts or i18n keys); a nav test per target (Ionic params); `malformed` renders without throwing.
3. Implement. Template element order and hierarchy as in Ionic; SCSS px → dp 1:1 plus the global `variables.scss` rules that apply.
4. `npm run gates -- --only jest,tsc,eslint --jest src/screens/<Name> --eslint src/screens/<Name>`, then the full `npm run gates`. All green.
5. Commit: `feat(screen): port <Name>`.

## Kit you must use (never a local copy)
- Text: kit `Text` from `src/components/ionic/IonText` (react-native `Text` is lint-banned).
- Overlays/controls: `src/components/ionic/*` replicas with Ionic's exact options (titles, button texts, input types, `enableBackdropDismiss`, `dismissOnPageChange`). No `Alert.alert`, `ToastAndroid`, native pickers, vector-icons Ionicons.
- Icons: `ion-icon name` → `IonIcon` (same name); `<i class="material-icons">` → `MaterialIcon`.
- Navigation: `push` → `navigation.push('Name', params)`; `setRoot` → `reset`/`resetTo`; `pop` → `goBack()`; `modalCtrl.create` → modal route. `ionViewWillEnter` → `useIonViewWillEnter(cb)` (`src/navigation/useIonViewWillEnter`), never a timing guard. `getActiveNav()` → `activeNavNames()` (`src/navigation/navigationRef`). A page a modal pushes → report it for `ionicModalPortalPages.json` (shared: STOP item).
- Pipes/moment: `src/ui/angularPipes` (`interp`, `collapseWs`, `titlecase`, `datePipe`, `momentFormat`).
- Ionic `window.alert('…')` → `webAlert('…')` (`src/ui/webAlert`).
- Alert/loading text: pass Ionic's **exact** strings (double/trailing spaces, `<br>`); the kit collapses white space like `innerHTML`. Never pre-collapse.
- i18n: `t('<same key>')` where Ionic used `| translate`; literal where Ionic hardcoded. Check the page's `.module.ts`: own `TranslateModule.forRoot` + `use()` → copy the resulting language.
- Client pictures: `clients/<id>/assets/...` through `scripts/use-client.mjs` (adding one = STOP item).

## Lessons from earlier S8 reviews (check these before reporting)
- **Global SCSS applies too:** grep `src/theme/variables.scss` / `src/app/app.scss` (Ionic repo) for every class in the template (`.listing`, `.mt0`, `.list-adjust`, `.data-not`, `.product-data`…). Typical misses: `.listing{margin:16px 0}` on ion-content, `.listing button` white bg + radius 6 + shadow, `!important` utility classes overriding page rules. Check specificity when two rules compete.
- **Statement order on error paths:** if Ionic dismisses the loader and THEN reads a field that throws on a null body, RN hides first and then stops. Do not reorder.
- **Inline `<iframe>`/`<img>` leave a ~4px baseline gap** below them in Ionic: add a 4px spacer.
- **Remote images with `width:100%`** keep their natural aspect ratio: use `Image.getSize` → height (see GiftDetail); never `resizeMode="stretch"` unless Ionic stretches.
- **Page SCSS overrides kit sizes** (fab 30px, icon 2rem): use the kit's override props (`IonFabButton size/iconSize`); a missing prop is a STOP item, not a not-1:1.
- **Colours not in the theme:** a per-screen theme file `src/theme/ionicMd<Name>.ts` (pattern: `ionicMdCatalogue.ts`), never an eslint-disable for hex.
- **Dead code:** a method nothing in the template or a reachable lifecycle calls is not ported; list it under Quirks with its file:line.
- **Brand text inside translate keys** (company names, addresses) belongs in client config: STOP and report.
- **Known worktree artefact:** the parity test "Language.default capture produces a non-blank PNG" fails in worktrees (no Ionic build): ignore it. The repo has no `.maestro` dir: skip maestro.

## Report (at most 150 words, no file contents, no logs)
- Files added/changed (paths only).
- Gates: the 4 lines from `npm run gates`.
- Quirks copied (one line each, file:line) and States added.
- **STOP items** (shared code needed) and **not-1:1 items** (anything you could not copy exactly, with the reason).
