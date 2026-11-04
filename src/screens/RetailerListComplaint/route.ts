// Ported from: src/pages/retailer-list-complaint/retailer-list-complaint.module.ts
import type { RouteMeta } from '../../navigation/types';

// Reached from home.ts:943 list() (nothing binds list()). No nav targets.
const route: RouteMeta = {
  name: 'RetailerListComplaint',
  presentation: 'card',
  feature: 'retailerComplaints',
  links: [],
};

export default route;
