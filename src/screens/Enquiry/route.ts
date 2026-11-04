// Ported from: src/pages/enquiry/enquiry.module.ts (+ the nav targets in enquiry.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: enquiry.ts:53 setRoot(TabsPage, {index:'0'}). Phase 6, feature-flagged (card Status DEAD: only product-subdetail.ts:160
// goToEnquiryPage() navigates here and nothing calls it).
const route: RouteMeta = {
  name: 'Enquiry',
  presentation: 'card',
  feature: 'enquiry',
  links: ['Tabs'],
};

export default route;
