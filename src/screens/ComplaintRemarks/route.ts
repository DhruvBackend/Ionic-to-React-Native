// Ported from: src/pages/complaint-remarks/complaint-remarks.module.ts (no navigation targets in complaint-remarks.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: pushed by PulmberCustomerDetail.goToRemarkHistory() with {'id': complaintId}. Plumber only (card). complaint-remarks.ts has no navCtrl calls.
const route: RouteMeta = {
  name: 'ComplaintRemarks',
  presentation: 'card',
  links: [],
};

export default route;
