// Ported from: src/pages/favorite-product/favorite-product.module.ts (+ the push targets in favorite-product.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: favorite-product.ts:56 push(ProductSubdetailPage, {id}). DEAD in Topbath (feature flag favorites, Phase 6): home.ts:880 goToFav()
// is the only code that navigates here and nothing calls or binds it.
const route: RouteMeta = {
  name: 'FavoriteProduct',
  presentation: 'card',
  feature: 'favorites',
  links: ['ProductSubdetail'],
};

export default route;
