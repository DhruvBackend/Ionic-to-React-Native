# S8 reviewer brief (independent, diff-only)

You review one ported screen (or a small batch) for an **exact 1:1 copy** of the Ionic 3 page. You did not write it. Inputs: `git diff master...screen/<Name>` (run it in `../tb-wt-<Name>`), `src/screens/<Name>/card.md`, the Ionic `.html/.ts/.scss/.module.ts` in `C:\Migrations\Topbath_App_loyalty` (READ-ONLY). Read a kit file only when the diff calls it and you need its behaviour. Do not explore the rest of the repo, do not run captures, APK or adb. Rules the port must follow: `docs/IMPLEMENTER-BRIEF.md`.

## Checklist (Ionic file:line vs RN file:line for each finding)
1. Every element and text, in Ionic's order and hierarchy; SCSS values px → dp 1:1.
2. Every `*ngIf` / role branch, and a parity state for each.
3. Every endpoint: path, method, headers, body key tree (contract + `expectContract` test).
4. Every nav target and its params; push / setRoot / pop / modal mapping.
5. Overlays (alert, toast, loading, action sheet, modal) use the kit replica with Ionic's exact texts and options; loaders shown/hidden exactly where Ionic does (stuck loaders copied).
6. Natives and their options.
7. Icons: same name and family.
8. Nothing "improved": typos, spacing, dead buttons, loose `==` copied; quirk NOTEs present.
9. No client strings; kit `Text`, `useIonViewWillEnter`, `angularPipes`, `webAlert` used where they apply.
10. i18n keys identical; the module's own `TranslateModule.forRoot` / `use()` language handled.
11. `malformed` fixture renders without throwing; shared fixtures only gained variants.

## Answer (at most 250 words)
`PASS`, or a numbered list of concrete misses: `N. <what> — Ionic <file:line> / RN <file:line> — fix: <one line>`. No praise, no summaries, no file contents.
