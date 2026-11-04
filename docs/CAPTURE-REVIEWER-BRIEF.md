# Capture reviewer brief (phone pass, diagnose only)

You review Ionic-vs-RN screenshot crops for an **exact 1:1** React Native port of an Ionic 3 app. Repo `C:\Users\dhruv\Projects\topbath-rn` (do NOT edit any file, do not run captures, adb, Gradle or jest). Ionic source `C:\Migrations\Topbath_App_loyalty` (READ-ONLY).

## Inputs
- Crops: `parity/out/triage/<id>.png`. Left = Ionic reference, right = RN on the phone, red divider in the middle. Only the bands that differ are kept, stacked top to bottom, separated by a blue line (a crop is NOT one continuous screenshot: a jump in content at a blue line is the next band). Scale: **1 crop pixel ≈ 1 dp** (phone 1080 px, density 3, crop downscaled 3x).
- `parity/out/triage/triage.json`: diff % and band y-ranges (device px) per id.
- RN screen: `src/screens/<Name>/index.tsx` + `styles.ts`; its first line names the Ionic files (`// Ported from: src/pages/...`). States: `parity/states.d/<Name>.json`.
- Ionic global CSS: `src/theme/variables.scss`, `src/app/app.scss`. Settle disputes with the shipped compiled CSS `C:\Users\dhruv\Projects\topbath-rn\.reference\aab\base\assets\www\build\main.css` (grep only, it is one huge line: use `grep -o '.\{0,120\}<selector>.\{0,200\}'`).
- Kit components: `src/components/ionic/*` (read one only when you need its behaviour).

## Not findings (ignore)
- Ionic shows Chrome's broken-image icon (or a grey sad-page iframe) where RN shows an empty box or the loaded embed: the harness blocks network pictures and iframes in the reference. Only report if the BOX SIZE or position differs.
- Status bar / gesture bar (masked), anti-aliasing, sub-1dp text rendering differences.

## Method
Look at the first state of each screen, find every visible difference, then check the other states only for differences of their own. For each difference find the cause: the Ionic rule (file:line, including global CSS and Ionic md defaults) and the RN code that does not match (file:line).

## Answer (at most 12 lines per screen, no file contents, no praise)
`<Screen>`: `PASS`, or numbered items:
`N. <state(s)>: <what differs, with dp> — Ionic <file:line or css rule> / RN <file:line> — fix: <one line>`
Say `UNSURE` when you cannot find the cause; say `HARNESS` when it is a capture artefact (and why).
