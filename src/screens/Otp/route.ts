// Ported from: src/pages/login-section/otp/otp.module.ts (+ the push targets in otp.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: otp.ts:87/97/217 push(MobileLoginPage), :91 push(RegistrationPage), :111 push(AboutusModalPage), :117 push(TabsPage).
// Live for every role (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'Otp',
  presentation: 'card',
  links: ['MobileLogin', 'Registration', 'AboutusModal', 'Tabs'],
};

export default route;
