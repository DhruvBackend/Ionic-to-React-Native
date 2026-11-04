// Ported from: src/pages/search/search.module.ts
import type { RouteMeta } from '../../navigation/types';

// Ionic: nothing pushes SearchPage (card: DEAD, Phase 6; no reference in src/pages or src/app but its own module and app.module.ts). The page's
// own navigation is commented out: getCategory() (// this.navCtrl.push(CatalougePage)), goToProductDetailPage() (// push(ProductDetailsPage)),
// getsubCategory() and getBrand() are empty methods. The page has @IonicPage() but is imported eagerly (app.module.ts:264), no string-name push.
const route: RouteMeta = {
  name: 'Search',
  presentation: 'card',
  feature: 'search',
  links: [],
};

export default route;
