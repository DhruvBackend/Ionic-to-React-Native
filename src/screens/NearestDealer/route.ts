// Ported from: src/pages/nearest-dealer/nearest-dealer.module.ts (+ the nav params in nearest-dealer.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: pushed with {pincode, type} ('Dealer' | 'Plumber') by home.ts:738 goToNearestDealers() (its button is commented out) and
// dealer-home.ts:146 (DealerHome, also dead): push(NearestDealerPage, ...), the class, not a string name (the page has @IonicPage() but is
// imported eagerly and listed in app.module.ts). No nav target of its own: show_loc() opens Google Maps through launch-navigator.
const route: RouteMeta = {
  name: 'NearestDealer',
  presentation: 'card',
  feature: 'nearestDealer',
  links: [],
};

export default route;
