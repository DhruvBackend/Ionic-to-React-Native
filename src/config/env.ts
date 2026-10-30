// Runtime mode switch.
//   MOCK – no network at all; every request is answered by src/api/mock. Used by the Jest tests (jest.setup.js).
//   DEV  – the team's dev server (devcrm.abacusdesk.com). Default for app builds (Dhruv, 2026-10-30).
//   LIVE – production (apps.abacusdesk.com). Real users, real data: only with Dhruv's explicit approval.
export type Mode = 'MOCK' | 'DEV' | 'LIVE';
// `as Mode` keeps the type wide so the other branches still type-check.
export const MODE: Mode = 'DEV' as Mode;

// URLs copied unchanged from Ionic src/providers/dbservice/dbservice.ts.
// LIVE = the active block in that file, DEV = the commented "Testing URL" block (same paths, other host).
const HOSTS = {
  LIVE: 'https://apps.abacusdesk.com/topbathfixtures/',
  DEV: 'https://devcrm.abacusdesk.com/topbathfixtures/',
};

export function urlsFor(mode: Mode) {
  // MOCK sends no requests, but still builds image/file URLs; use the dev host so nothing points at production.
  const host = mode === 'LIVE' ? HOSTS.LIVE : HOSTS.DEV;
  return {
    rootUrl: host + 'dd_api/',
    rootUrlSfa: host + 'crm/api/app/',
    image_url: host + 'dd_api/app/Http/Controllers/Admin/Master/appOfflineUploads/categoryImage/',
    upload_url1: host + 'crm/api/uploads/',
    upload_url2: host + 'uploads/order-invoice/',
    upload_url3: host + 'dd_api/app/uploads/',
    video_url: host + 'dd_api/app/uploads/videos/',
    product_image_url: host + 'dd_api/app/Http/Controllers/Admin/Master/appOfflineUploads/productImage/',
    category_url: host + 'dd_api/app/Http/Controllers/Admin/Master/appOfflineUploads/imageCatalogue/',
  };
}

export const URLS = urlsFor(MODE);
