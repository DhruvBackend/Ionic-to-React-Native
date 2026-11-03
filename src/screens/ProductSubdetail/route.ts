// Ported from: src/pages/product-subdetail/product-subdetail.module.ts (+ the push/modal calls of product-subdetail.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: product-subdetail.ts:396 viewDetail() opens ViewProfilePage as a modal. goToEnquiryPage() (:160 push EnquiryPage) is never called:
// product-subdetail.html has no (click) for it (nor for add_to_fav / remove_from_fav / checkForExistInFavourite), so those are dead code and
// not ported. popToRoot (:199) is the ionViewDidLeave rule. Live for every role (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'ProductSubdetail',
  presentation: 'card',
  links: ['ViewProfile'],
};

export default route;
