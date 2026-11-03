// Ported from: src/pages/customerlist/customerlist.module.ts (+ the push targets in customerlist.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: customerlist.ts:101 push(CustomerdetailPage, {id}), :105 push(CustomeraddPage). Roles Sales_Boy, Dealer (card); no feature flag.
const route: RouteMeta = {
  name: 'Customerlist',
  presentation: 'card',
  links: ['Customerdetail', 'Customeradd'],
};

export default route;
