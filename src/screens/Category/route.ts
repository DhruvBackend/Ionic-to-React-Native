// Ported from: src/pages/category/category.module.ts (+ the push targets in category.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: category.ts:54 push(NewarrivalsPage) (goToNewArrivals, no caller in the html), :68 push(SubCategoryPage, {id}), :74 push(ProductsPage, {name}),
// :194 popToRoot. Live for every role (card Status LIVE, no feature flag); no navParams are read.
const route: RouteMeta = {
  name: 'Category',
  presentation: 'card',
  links: ['Newarrivals', 'SubCategory', 'Products'],
};

export default route;
