// Ported from: src/pages/language/language.module.ts (+ the push targets in language.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: language.ts:113 / :171 navCtrl.push(SelectRegistrationTypePage, { lang }). Live for every role (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'Language',
  presentation: 'card',
  links: ['SelectRegistrationType'],
};

export default route;
