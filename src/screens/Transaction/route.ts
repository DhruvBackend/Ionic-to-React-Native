// Ported from: src/pages/transaction/transaction.module.ts (+ the push target in transaction.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: transaction.ts:44 push(ShippingDetailPage, {id}), :164 popToRoot() (ionViewDidLeave).
// PUSH-ONLY: pushed from the push-notification handlers (app.component.ts:945 `redeem`, home.ts:801/1009 inside the dead notification()).
// Not a tab root, not in the side menu.
const route: RouteMeta = {
  name: 'Transaction',
  presentation: 'card',
  links: ['ShippingDetail'],
};

export default route;
