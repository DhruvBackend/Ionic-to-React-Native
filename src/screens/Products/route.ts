// Ported from: src/pages/products/products.module.ts (+ the push targets in products.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: pushed by Category (category.ts:74) with {name}; products.ts:47 push(ProductDetailPage, {id}), :143 popToRoot (ionViewDidLeave).
// Live for every role (card Status LIVE, no feature flag). Not a tab root.
const route: RouteMeta = {
  name: 'Products',
  presentation: 'card',
  links: ['ProductDetail'],
};

export default route;
