// Ported from: src/pages/cancelation-policy/cancelation-policy.module.ts (+ the push in cancelpolicy-modal.ts:58)
import type { RouteMeta } from '../../navigation/types';

// Ionic: cancelpolicy-modal.ts:58 `this.navCtrl.push(CancelationPolicyPage)` (no params), called from INSIDE the CancelpolicyModal modal.
// The modal page's navCtrl is the app's OverlayPortal, so CancelationPolicy is pushed into the portal (md transition: slides up and
// fades in) and the modal then dismisses itself (cancelpolicy-modal.ts:186 ionViewDidLeave -> dismiss()), leaving it as the only view.
// NOTE (parity): despite closmodal()/viewCtrl.dismiss() this is NOT in ionicModalPages.json (no modalCtrl.create targets it), so the
// route is a plain card. Live for every role (card Status LIVE, no feature flag). No navigation out of the page.
const route: RouteMeta = {
  name: 'CancelationPolicy',
  presentation: 'card',
  links: [],
};

export default route;
