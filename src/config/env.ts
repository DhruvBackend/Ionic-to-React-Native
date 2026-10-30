// Runtime mode switch.
//   MOCK – no network at all; every request is answered by src/api/mock (default while porting).
//   DEV  – the team's dev server (devcrm.abacusdesk.com), only once we have access + test accounts.
//   LIVE – production (apps.abacusdesk.com). Real users, real data: use only when explicitly asked.
export type Mode = 'MOCK' | 'DEV' | 'LIVE';
// `as Mode` keeps the type wide so the DEV/LIVE branches below still type-check.
export const MODE: Mode = 'MOCK' as Mode;

// URLs copied unchanged from Ionic src/providers/dbservice/dbservice.ts.
// LIVE = the active block in that file, DEV = the commented "Testing URL" block.
const HOSTS = {
  LIVE: 'https://apps.abacusdesk.com/topbathfixtures/',
  DEV: 'https://devcrm.abacusdesk.com/topbathfixtures/',
};

// In MOCK mode the LIVE strings are kept so image/file URLs are built the same way,
// but the API client never sends a request (see src/api/client.ts).
const host = MODE === 'DEV' ? HOSTS.DEV : HOSTS.LIVE;

export const URLS = {
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
