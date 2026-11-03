// Ported from: src/pages/super30/super30.module.ts (no push targets in super30.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: super30.ts has no navigation. Pushed with NO params from MainHome (main-home.ts:71-73 goOnSuper30Page, main-home.html:14, behind
// `*ngIf="dbService.userStorageData.type == 'Plumber'"`). MainHome is the Menu tab, so the page is production-reachable for a Plumber
// (card Roles: Plumber; feature flag superPlumber is true for Topbath).
const route: RouteMeta = {
  name: 'Super30',
  presentation: 'card',
  links: [],
};

export default route;
