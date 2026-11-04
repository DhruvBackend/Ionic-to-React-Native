// Ported from: src/pages/gift-gallery/gift-list/gift-list.module.ts (+ the nav targets in gift-list.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: gift-list.ts:62 push(GiftDetailPage, {id}); :138 popToRoot() (ionViewDidLeave). Nothing in the app reaches this page (card: DEAD):
// home.ts:551 goOnGiftListPage() and sales-exec-home.ts:107 goGiftGallery() are never bound; the other two references are commented out.
// navParams 'mode' (:29) is never passed by anyone.
const route: RouteMeta = {
  name: 'GiftList',
  presentation: 'card',
  feature: 'giftList',
  links: ['GiftDetail'],
};

export default route;
