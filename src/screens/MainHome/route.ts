// Ported from: src/pages/main-home/main-home.module.ts (+ the push targets in main-home.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: tabs.ts:42 tab6Root ("Menu" tab, the fifth tab of Plumber, Sales_Boy, Dealer and Sales_Executive; no other page pushes it).
// Live (card Status LIVE, no feature flag). `links` lists only targets a visible control can reach (main-home.html): Super30 (Plumber only),
// About, Category (the "Products" row), VideoCategory (the "Videos" row), Contact. Dead and left out: setRoot(Home) (offline guard in the
// constructor, dbService.connection is never assigned), push(Notification) and push(Feedback) (their buttons are commented out in the
// template), push(News) (goOnNewsPage has no button at all).
const route: RouteMeta = {
  name: 'MainHome',
  presentation: 'card',
  links: ['Super30', 'About', 'Category', 'VideoCategory', 'Contact'],
};

export default route;
