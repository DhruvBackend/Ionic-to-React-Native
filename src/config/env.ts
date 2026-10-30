// Runtime mode switch.
//   MOCK – no network at all; every request is answered by src/api/mock. Used by the Jest tests (jest.setup.js).
//   DEV  – the team's dev server (devcrm.abacusdesk.com). Default for app builds (Dhruv, 2026-10-30).
//   LIVE – production (apps.abacusdesk.com). Real users, real data: only with Dhruv's explicit approval.
import { client } from './client';
import type { Urls } from './types';

export type Mode = 'MOCK' | 'DEV' | 'LIVE';
// `as Mode` keeps the type wide so the other branches still type-check.
export const MODE: Mode = 'DEV' as Mode;

// URLs come from the selected client's config (clients/<id>/client.json). For Topbath they are
// copied unchanged from Ionic src/providers/dbservice/dbservice.ts: LIVE = the active block,
// DEV = the commented "Testing URL" block.
export function urlsFor(mode: Mode): Urls {
  // MOCK sends no requests, but still builds image/file URLs; use DEV so nothing points at production.
  return client.urls[mode === 'LIVE' ? 'LIVE' : 'DEV'];
}

export const URLS = urlsFor(MODE);
