// Ported from: src/pages/plumber-checkin/plumber-checkin.module.ts (+ the nav targets in plumber-checkin.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: plumber-checkin.ts:189 / :197 push(PulmberCustomerDetailPage, {type: 'service' | 'installation', id, close_com: true}).
// Plumber only (card, no feature flag). Pushed from Home.
const route: RouteMeta = {
  name: 'PlumberCheckin',
  presentation: 'card',
  links: ['PulmberCustomerDetail'],
};

export default route;
