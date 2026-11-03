// Ported from: src/pages/notification/notification.module.ts (no push/setRoot targets in notification.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: pushed with NO params from Home's header bell (home.ts:953-955 goOnnotification). main-home.ts:47 goOnNotificationPage also pushes it,
// but its only caller in main-home.html:27 is commented out (dead). Roles: Plumber, Sales_Boy, Dealer (card). Not a tab root.
// notification.ts has no navCtrl calls: no links.
const route: RouteMeta = {
  name: 'Notification',
  presentation: 'card',
  links: [],
};

export default route;
