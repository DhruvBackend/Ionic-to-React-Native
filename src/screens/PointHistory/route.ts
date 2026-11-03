// Ported from: src/pages/point-history/point-history.module.ts (+ the nav params read in point-history.ts:43-46)
import type { RouteMeta } from '../../navigation/types';

// Ionic: pushed by PointList.change_page() (point-list.ts:191-201) with exactly one of {scan:'scan'}, {service:'service'},
// {referal:'referal'}, {redeem:'redeem'}. Live (card Status LIVE, no feature flag). Navigates nowhere (no nav targets).
const route: RouteMeta = {
  name: 'PointHistory',
  presentation: 'card',
  links: [],
};

export default route;
