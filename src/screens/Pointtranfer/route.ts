// Ported from: src/pages/pointtranfer/pointtranfer.module.ts (+ the nav targets in pointtranfer.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: Home pushes it with {totalPoint: total_balence} (home.ts:658, Plumber block only). Roles: Plumber (card). Feature flag pointTransfer.
// pointtranfer.ts:90 navCtrl.pop() after a successful transfer: no push/setRoot targets.
const route: RouteMeta = {
  name: 'Pointtranfer',
  presentation: 'card',
  feature: 'pointTransfer',
  links: [],
};

export default route;
