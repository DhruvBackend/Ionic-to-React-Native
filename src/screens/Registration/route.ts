// Ported from: src/pages/login-section/registration/registration.module.ts (+ the push targets in registration.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: registration.ts:678 push(TabsPage), :692 push(AboutusModalPage, {country}). Live for every role (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'Registration',
  presentation: 'card',
  links: ['Tabs', 'AboutusModal'],
};

export default route;
