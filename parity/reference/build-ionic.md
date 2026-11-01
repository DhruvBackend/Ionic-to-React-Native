# Building the Ionic reference (www)

Outcome: **built from source** (Ionic 3.9 / app-scripts 3.2.4) at commit `b33d82f`, no aab fallback needed.
`work/www/build/main.js` exists (2.1 MB) and contains `play_console_flag`.
So Sales_Executive and forced-update states DO have a reference.

Run: `bash parity/reference/build-ionic.sh` (about 1 minute, warm npm cache).

## Exact steps (what the script does)
1. Portable Node 10.24.1 in `.reference/node10/` (zip from nodejs.org/dist/latest-v10.x). It is put on PATH only
   inside the script. No nvm, no Docker, global Node untouched.
2. Copy `$IONIC` (C:\Migrations\Topbath_App_loyalty) to `parity/reference/work/`, excluding node_modules, platforms,
   plugins, .git, *.aab, *.keystore (plus .claude and .sourcemaps). `$IONIC` is never modified.
3. Fix `package-lock.json` in the copy with `fix-lock.js`: `registry.npm.taobao.org` -> `registry.npmjs.org`,
   AND the path layout (`/<pkg>/download/<file>.tgz?cache=...` -> `/<pkg>/-/<file>.tgz`). A plain host rename is
   not enough, npmjs 404s on the `/download/` paths. The sha1 integrity values still match.
4. `npm ci --ignore-scripts` (1196 packages), then `npm rebuild node-sass` (fetches node-sass 4.14.1's prebuilt
   win32-x64-64 binding from GitHub releases).
5. Copy `jwt-decode-shim.d.ts.txt` into `work/src/jwt-decode-shim.d.ts` (stored as .txt so the RN `tsc` does not load it). Reason: `work/` sits inside the RN repo, and TypeScript prefers the
   RN repo's typed `jwt-decode@4` (parent `node_modules`) over the untyped `jwt-decode@2.2.0` in `work/node_modules`,
   giving 6 "no call signature" errors. The shim only affects type-checking; webpack still bundles 2.2.0.
6. `npx ionic-app-scripts build` (the package.json `build` script). tslint prints "unused import" warnings; ignore.

Everything under `parity/reference/work/` and `parity/out/` is git-ignored.
