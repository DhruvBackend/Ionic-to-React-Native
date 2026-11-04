// Ported from: src/pages/scane-pages/scan/scan.module.ts (+ the push target in scan.ts:27)
import type { RouteMeta } from '../../navigation/types';

// Ionic: scan.ts:27 push(CoupanCodePage), no params. Nothing in the app reaches this page (card: DEAD, no navigation to Scan found).
const route: RouteMeta = {
  name: 'Scan',
  presentation: 'card',
  feature: 'scanPage',
  links: ['CoupanCode'],
};

export default route;
