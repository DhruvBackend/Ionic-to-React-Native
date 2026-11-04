// Ported from: src/pages/sales-exec-home/sales-exec-home.module.ts (+ the nav targets in sales-exec-home.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: tabs.ts tab1Root for Sales_Executive. Live (card Status LIVE, no feature flag). goGiftGallery (:106) and goTransaction
// (:110) are never called from the template (dead), so GiftList / Transaction are not linked.
const route: RouteMeta = {
  name: 'SalesExecHome',
  presentation: 'card',
  links: ['SalesExecAddPlumber', 'SalesExecPlumberList', 'SalesExecAddSeller', 'SalesExecAddDealer', 'Language'],
};

export default route;
