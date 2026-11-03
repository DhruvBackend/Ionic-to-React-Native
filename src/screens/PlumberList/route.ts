// Ported from: src/pages/plumber-list/plumber-list.module.ts (+ the push targets in plumber-list.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: plumber-list.ts:45 push(PlumberAddPage), :117 push(PlumberDetailPage, {'id': id}). Roles Sales_Boy, Dealer (card); no feature flag.
const route: RouteMeta = {
  name: 'PlumberList',
  presentation: 'card',
  links: ['PlumberAdd', 'PlumberDetail'],
};

export default route;
