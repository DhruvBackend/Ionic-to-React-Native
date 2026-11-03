// Ported from: src/pages/gift-gallery/gift-detail/gift-detail.module.ts (+ the nav targets in gift-detail.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: gift-detail.ts:53 modalCtrl.create(CancelpolicyModalPage, {karigar_id, gift_id}), :59 push(OffersPage, {id}) (goOnOfferDetailPage, only
// called from a commented-out template line: dead), :191 push(RegistrationPage, {data, mode: 'edit_page', lang}), :167 popToRoot().
// Pushed from Offers (offers.ts:57 {id}), GiftList (gift-list.ts:62 {id}) and, with no params, from Home / app.component push-notification
// handlers of type 'gift'. Live for every role (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'GiftDetail',
  presentation: 'card',
  links: ['CancelpolicyModal', 'Registration', 'Offers'],
};

export default route;
