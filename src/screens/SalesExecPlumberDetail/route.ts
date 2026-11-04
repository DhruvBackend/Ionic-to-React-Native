// Ported from: src/pages/sales-exec-plumber-detail/sales-exec-plumber-detail.module.ts (+ the nav params in sales-exec-plumber-detail.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: sales-exec-plumber-detail.ts:22 reads navParams.get('plumber_id') (pushed from SalesExecPlumberList). No nav targets. Role Sales_Executive (card); no feature flag.
const route: RouteMeta = {
  name: 'SalesExecPlumberDetail',
  presentation: 'card',
  links: [],
};

export default route;
