// Ported from: src/pages/customeradd/customeradd.module.ts (+ the nav targets in customeradd.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: customeradd.ts:596 popTo(CustomerlistPage). Live for Sales_Boy and Dealer (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'Customeradd',
  presentation: 'card',
  links: ['Customerlist'],
};

export default route;
