// Ported from: src/pages/scane-pages/coupan-code/coupan-code.module.ts (+ the push targets in coupan-code.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: pushed by Home (scan() with manual_permission == 1: no params; goToQrCode(): {mode:'home'}). Neither param is read.
// coupan-code.ts:63 and :96 setRoot(TabsPage, {index:'0'}) after a successful redeem. Roles: Plumber (card). No feature flag.
const route: RouteMeta = {
  name: 'CoupanCode',
  presentation: 'card',
  links: ['Tabs'],
};

export default route;
