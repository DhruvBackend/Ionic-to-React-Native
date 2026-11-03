// Ported from: src/pages/product-detail/product-detail.module.ts (+ the push targets in product-detail.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: product-detail.ts:48 push(ProductSubdetailPage, {id}); popToRoot (:163) is the ionViewDidLeave rule.
// Live for every role (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'ProductDetail',
  presentation: 'card',
  links: ['ProductSubdetail'],
};

export default route;
