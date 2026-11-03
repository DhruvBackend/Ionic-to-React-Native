// Ported from: src/pages/plumber-detail/plumber-detail.module.ts (+ the nav params in plumber-detail.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: plumber-detail.ts:28 reads navParams.data.id (pushed from PlumberList). No nav targets. Roles Sales_Boy, Dealer (card); no feature flag.
const route: RouteMeta = {
  name: 'PlumberDetail',
  presentation: 'card',
  links: [],
};

export default route;
