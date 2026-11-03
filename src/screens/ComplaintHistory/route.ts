// Ported from: src/pages/complaints/complaint-history/complaint-history.module.ts (+ the nav targets in complaint-history.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: complaint-history.ts:49 push(ComplaintDetailPage, {'id': id}). Pushed with navParams.data = { type: 'Service' | 'Installation' }.
// Live for every role (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'ComplaintHistory',
  presentation: 'card',
  links: ['ComplaintDetail'],
};

export default route;
