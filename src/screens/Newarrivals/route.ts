// Ported from: src/pages/newarrivals/newarrivals.module.ts (+ the push targets in newarrivals.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: newarrivals.ts:60 push(ProductSubdetailPage, {id}). Live for every role (card Status LIVE, no feature flag); also a Customer tab.
const route: RouteMeta = {
  name: 'Newarrivals',
  presentation: 'card',
  links: ['ProductSubdetail'],
};

export default route;
