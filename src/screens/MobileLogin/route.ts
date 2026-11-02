// Ported from: src/pages/login-section/mobile-login/mobile-login.module.ts (+ the push targets in mobile-login.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: SelectRegistrationType pushes it with { registerType, lang } (select-registration-type.ts:57); Otp pushes it with no params
// (otp.ts:87, :97, :217). Live for every role (card Status LIVE, no feature flag). mobile-login.ts:79 pushes Language, :136 Otp
// (:152 SelectRegistrationType is dead code, never called).
const route: RouteMeta = {
  name: 'MobileLogin',
  presentation: 'card',
  links: ['Language', 'Otp'],
};

export default route;
