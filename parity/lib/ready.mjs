// Ready-wait for the RN capture: poll `uiautomator dump` until the screen root is on screen, then settle.
// (A fixed sleep raced the Android-15 frame, which JS applies 2 s after start: src/app/frame.ts.)

/** Default ready node: the IonStack card of the screen (testID `ion-card-<screen>`), unless the state sets `readyId`. */
export function readyIdFor(state) {
  return state.readyId || `ion-card-${state.screen}`;
}

/** True when the uiautomator XML has a node of `pkg` whose resource-id is `id` (or ends with `:id/<id>`). */
export function hasReadyNode(xml, pkg, id) {
  const re = /<node\b[^>]*>/g;
  for (const m of xml.matchAll(re)) {
    const tag = m[0];
    const rid = /\sresource-id="([^"]*)"/.exec(tag)?.[1] ?? '';
    const p = /\spackage="([^"]*)"/.exec(tag)?.[1] ?? '';
    if (p === pkg && (rid === id || rid.endsWith(`:id/${id}`))) {
      return true;
    }
  }
  return false;
}

const realSleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * dump(): () => string   the output of `adb shell uiautomator dump /dev/tty` (may throw / return junk while the app starts)
 * Resolves { ready, polls, waitedMs }; ready=false on timeout (the caller still takes the shot and warns).
 * After the node is seen it waits `settleMs` more (frame band + page transitions).
 */
export async function waitForReady({
  dump,
  pkg,
  readyId,
  timeoutMs = 30000,
  pollMs = 500,
  settleMs = 2500,
  sleep = realSleep,
  now = Date.now,
}) {
  const start = now();
  let polls = 0;
  for (;;) {
    polls++;
    let xml = '';
    try {
      xml = dump() || '';
    } catch {
      xml = '';
    }
    if (hasReadyNode(xml, pkg, readyId)) {
      await sleep(settleMs);
      return { ready: true, polls, waitedMs: now() - start };
    }
    if (now() - start >= timeoutMs) {
      return { ready: false, polls, waitedMs: now() - start };
    }
    await sleep(pollMs);
  }
}
