// Ported from: src/pages/offers/offers.module.ts (+ the push targets in offers.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: offers.ts:50/:53 push(TermsPage, {id, term}) (only from template links that never show, see index.tsx), :57 push(GiftDetailPage, {id}),
// :62 push(GiftDetailPage) (goOnGiftDetail1, never called), :129 popToRoot().
// Pushed from OfferList (offer-list.ts:67 {id, lang}), Home (home.ts:505 {id}), GiftDetail (gift-detail.ts:59 {id}) and PointList.
// Live for every role (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'Offers',
  presentation: 'card',
  links: ['Terms', 'GiftDetail'],
};

export default route;
