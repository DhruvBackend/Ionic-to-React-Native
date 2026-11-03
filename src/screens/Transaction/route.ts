// Ported from: src/pages/transaction/transaction.module.ts (+ the push target in transaction.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: transaction.ts:44 push(ShippingDetailPage, {id}), :164 popToRoot() (ionViewDidLeave).
// PUSH-ONLY: pushed from the `redeem` push handlers (app.component.ts:945, home.ts:1009 in initPushNotification; home.ts:801 is dead).
// Never fires in the shipped Topbath APK (no push plugin, features.push false); live for push-enabled clients.
// Not a tab root, not in the side menu.
const route: RouteMeta = {
  name: 'Transaction',
  presentation: 'card',
  links: ['ShippingDetail'],
};

export default route;
