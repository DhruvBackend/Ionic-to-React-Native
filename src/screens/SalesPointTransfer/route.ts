// Ported from: src/pages/sales-point-transfer/sales-point-transfer.module.ts (+ the nav targets in sales-point-transfer.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: Home pushes it with {totalPoint: total_balence} (home.ts:662, Seller/Dealer block). The page reads `sales_boy_id` instead (:29),
// which Home never passes. Roles: Sales_Boy, Dealer (card). Feature flag pointTransfer.
// sales-point-transfer.ts:116 navCtrl.pop() after a successful transfer: no push/setRoot targets.
const route: RouteMeta = {
  name: 'SalesPointTransfer',
  presentation: 'card',
  feature: 'pointTransfer',
  links: [],
};

export default route;
