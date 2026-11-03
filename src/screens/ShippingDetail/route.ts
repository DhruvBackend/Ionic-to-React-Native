// Ported from: src/pages/shipping-detail/shipping-detail.module.ts (+ the nav target in shipping-detail.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: shipping-detail.ts:106 setRoot(TabsPage, {index:'3'}) after a successful 'received' confirmation, :147-164 popToRoot() (ionViewDidLeave).
// Pushed only by Transaction (transaction.ts:44 push(ShippingDetailPage, {id}), from every row and from the Receive button). Transaction is
// itself PUSH-ONLY (the `redeem` push handlers), so this page never opens in the shipped Topbath APK (no push plugin, features.push false);
// live for push-enabled clients. Not a tab root, not in the side menu.
const route: RouteMeta = {
  name: 'ShippingDetail',
  presentation: 'card',
  links: ['Tabs'],
};

export default route;
