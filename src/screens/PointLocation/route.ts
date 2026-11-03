// Ported from: src/pages/point-location/point-location.module.ts (+ the nav target in point-location.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: point-location.ts:257 setRoot(ProfilePage) after the Customer's geo location was saved (cust_geo_address is always ''), :276 pop()
// (addDealerLocation, never called). Pushed by Profile (profile.ts:185 {lat, log, old_loc}, Customer footer button), DealerProfile
// (dealer-profile.ts:94 {lat, log, mode:'Dealer'}) and AddNewComplaint (add-new-complaint.ts:196, no params). Not a tab root, not in the side menu.
const route: RouteMeta = {
  name: 'PointLocation',
  presentation: 'card',
  links: ['Profile'],
};

export default route;
