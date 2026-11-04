// Ported from: src/pages/login-section/login-screen/login-screen.module.ts (+ login-screen.ts: no nav calls)
import type { RouteMeta } from '../../navigation/types';

// Ionic: login-screen.ts has no nav calls. Nothing in the app reaches this page (card: DEAD, no navigation to LoginScreen found).
const route: RouteMeta = {
  name: 'LoginScreen',
  presentation: 'card',
  feature: 'loginScreen',
  links: [],
};

export default route;
