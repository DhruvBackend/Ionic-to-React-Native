// Ported from: src/pages/points/point-detail/point-detail.module.ts (+ the nav targets in point-detail.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: point-detail.ts:65 popToRoot() (ionViewDidLeave); no push/setRoot targets. navParams 'id' (:25) is a coupon id. Nothing in the app
// reaches this page (card: DEAD): point-list.ts:65 goOnPointDetailPage() is never bound.
const route: RouteMeta = {
  name: 'PointDetail',
  presentation: 'card',
  feature: 'pointDetail',
  links: [],
};

export default route;
