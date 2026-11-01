#!/usr/bin/env bash
# Builds the Ionic reference www (commit b33d82f) into parity/reference/work/www.
# Needs a portable Node 10 (never changes the global Node):
#   extract https://nodejs.org/dist/latest-v10.x/node-v10.24.1-win-x64.zip to <repo>/.reference/node10/
# Usage: bash parity/reference/build-ionic.sh   (from the RN repo root)
set -euo pipefail
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
IONIC="${IONIC:-/c/Migrations/Topbath_App_loyalty}"
NODE10="${NODE10:-$REPO/.reference/node10/node-v10.24.1-win-x64}"
W="$REPO/parity/reference/work"
mkdir -p "$W"
# 1. copy the source (read-only use of $IONIC)
( cd "$IONIC" && tar --exclude=node_modules --exclude=platforms --exclude=plugins --exclude=.git \
    --exclude='*.aab' --exclude='*.keystore' --exclude=.claude --exclude=.sourcemaps -cf - . ) | tar -xf - -C "$W"
# 2. lockfile: taobao mirror -> npmjs (also fixes the tarball path layout)
"$NODE10/node.exe" "$REPO/parity/reference/fix-lock.js" "$W/package-lock.json"
# 3. install + build with Node 10 (PATH changed for this script only)
export PATH="$NODE10:$PATH"
cd "$W"
npm ci --no-audit --no-fund --ignore-scripts
npm rebuild node-sass            # downloads the win32-x64-64 binding (ignore-scripts skipped it)
cp "$REPO/parity/reference/jwt-decode-shim.d.ts.txt" src/jwt-decode-shim.d.ts   # see the shim comment (a .txt so the RN tsc ignores it)
npx ionic-app-scripts build
grep -q play_console_flag www/build/main.js && echo "OK: www/build/main.js contains play_console_flag"
