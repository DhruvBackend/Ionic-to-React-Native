// Ported from: src/pages/aboutus-modal/aboutus-modal.module.ts (+ the push calls in otp.ts:111 and registration.ts:692)
import type { RouteMeta } from '../../navigation/types';

// NOTE (parity): despite the name this is NOT a modal. Otp and Registration call navCtrl.push(AboutusModalPage, {country}); the
// modalCtrl.create(...) lines are commented out. So it is a pushed card page (slide transition, stack kept below).
// Live for every role (card Status LIVE, no feature flag). aboutus-modal.ts:43 setRoot(TabsPage, {index:'0'}).
const route: RouteMeta = {
  name: 'AboutusModal',
  presentation: 'card',
  links: ['Tabs'],
};

export default route;
