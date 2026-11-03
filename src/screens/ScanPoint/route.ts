// Ported from: src/pages/scan-point/scan-point.module.ts (+ the push target in scan-point.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: scan-point.ts:446 push(HomePage) after saveCoupon. Entry: home.ts:469 / :472 push(ScanPointPage, {mode:'home', type:'scan' | 'enter_coupon'})
// (Sales_Boy / Dealer goOnScanePage). Live for those roles (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'ScanPoint',
  presentation: 'card',
  links: ['Home'],
};

export default route;
