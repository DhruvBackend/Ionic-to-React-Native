// Ported from: src/pages/sales-exec-plumber-list/sales-exec-plumber-list.module.ts (+ the push target in sales-exec-plumber-list.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: sales-exec-plumber-list.ts:54 push('SalesExecPlumberDetailPage', {plumber_id}). Role Sales_Executive (card); no feature flag.
const route: RouteMeta = {
  name: 'SalesExecPlumberList',
  presentation: 'card',
  links: ['SalesExecPlumberDetail'],
};

export default route;
