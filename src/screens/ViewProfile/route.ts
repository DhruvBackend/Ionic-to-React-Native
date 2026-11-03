// Ported from: src/pages/view-profile/view-profile.module.ts (+ the modalCtrl.create(ViewProfilePage, ...) call sites)
import type { RouteMeta } from '../../navigation/types';

// Ionic: view-profile.ts:41 viewCtrl.dismiss() (closeModal). An Ionic MODAL page (see src/navigation/ionicModalPages.json). Live for
// every role (card Status LIVE, no feature flag). No other navigation.
const route: RouteMeta = {
  name: 'ViewProfile',
  presentation: 'modal',
  links: [],
};

export default route;
