// Ported from: src/pages/customerdetail/customerdetail.module.ts (+ the push target in customerdetail.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: customerdetail.ts:110 push(ComplaintDetailPage, {id}). Roles Sales_Boy, Dealer (card); no feature flag. Pushed from Customerlist.
const route: RouteMeta = {
  name: 'Customerdetail',
  presentation: 'card',
  links: ['ComplaintDetail'],
};

export default route;
