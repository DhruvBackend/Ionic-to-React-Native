// Ported from: src/pages/plumber-add/plumber-add.module.ts (+ the nav targets in plumber-add.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: plumber-add.ts:419 popTo(PlumberListPage). Live for Sales_Boy and Dealer (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'PlumberAdd',
  presentation: 'card',
  links: ['PlumberList'],
};

export default route;
