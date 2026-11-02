// Ported from: src/pages/select-registration-type/select-registration-type.module.ts (+ the push targets in the .ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: select-registration-type.ts:53 push(LoginPage) (dead branch), :57 push(MobileLoginPage), :76 push(LanguagePage) (dead handler).
// Live for every role (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'SelectRegistrationType',
  presentation: 'card',
  links: ['Login', 'MobileLogin', 'Language'],
};

export default route;
