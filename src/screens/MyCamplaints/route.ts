// Ported from: src/pages/plumber-camplaints/my-camplaints/my-camplaints.module.ts (+ the nav targets in my-camplaints.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: my-camplaints.ts:110 push(PulmberCustomerDetailPage, {'id': id, 'close_com': false}). Pushed with navParams {type}. Plumber only (card).
const route: RouteMeta = {
  name: 'MyCamplaints',
  presentation: 'card',
  links: ['PulmberCustomerDetail'],
};

export default route;
