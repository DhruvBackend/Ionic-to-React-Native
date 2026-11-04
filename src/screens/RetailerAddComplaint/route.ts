// Ported from: src/pages/retailer-add-complaint/retailer-add-complaint.module.ts (+ the nav targets in retailer-add-complaint.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: retailer-add-complaint.ts:75 push(ComplaintHistoryPage). Reached from home.ts:940 add() (nothing binds add()).
const route: RouteMeta = {
  name: 'RetailerAddComplaint',
  presentation: 'card',
  feature: 'retailerComplaints',
  links: ['ComplaintHistory'],
};

export default route;
