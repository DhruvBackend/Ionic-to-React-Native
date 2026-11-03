// Ported from: src/pages/complaints/add-new-complaint/add-new-complaint.module.ts (+ the nav targets in add-new-complaint.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: add-new-complaint.ts:196 push(PointLocationPage) (inside getGeo(), which is never called), :419 setRoot(TabsPage, {index:'0'}).
// Live for Sales_Boy, Dealer and Customer (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'AddNewComplaint',
  presentation: 'card',
  links: ['PointLocation', 'Tabs'],
};

export default route;
