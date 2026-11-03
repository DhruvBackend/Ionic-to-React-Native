// Ported from: src/pages/points/point-list/point-list.module.ts (+ the push targets in point-list.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: tabs.ts:43 tab7Root ("My Wallet" tab for Plumber, Sales_Boy, Dealer, Sales_Executive) and pushed with no params from Home.
// Live (card Status LIVE, no feature flag). `links` lists only targets a visible control can reach: change_page() pushes PointHistory
// (scan / service / referal / redeem). The dead ones are left out: setRoot(Home) (offline guard, connection is never 'offline'),
// push(PointDetail) goOnPointDetailPage and push(Tabs) goOnHomePage (never called), push(Offers) at :207 (filter.active_mode is never set).
const route: RouteMeta = {
  name: 'PointList',
  presentation: 'card',
  links: ['PointHistory'],
};

export default route;
