// Ported from: src/pages/sub-category/sub-category.module.ts (+ the push targets in sub-category.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: pushed by Category (category.ts:68) with {id: categories[0].id}; sub-category.ts:125 push(ProductDetailPage, {id}).
// Live for every role (card Status LIVE, no feature flag). Not a tab root.
const route: RouteMeta = {
  name: 'SubCategory',
  presentation: 'card',
  links: ['ProductDetail'],
};

export default route;
