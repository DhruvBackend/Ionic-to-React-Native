// Ported from: src/pages/offer-list/offer-list.module.ts (+ the push targets in offer-list.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: offer-list.ts:67 push(OffersPage, {id, lang}), :42 setRoot(HomePage) (offline guard, dead: dbService.connection is never assigned).
// Live for every role (card Status LIVE, no feature flag). Tab root of the 'Offers' tab (tabs.ts:41 tab5Root) and pushed from Home.
const route: RouteMeta = {
  name: 'OfferList',
  presentation: 'card',
  links: ['Offers', 'Home'],
};

export default route;
