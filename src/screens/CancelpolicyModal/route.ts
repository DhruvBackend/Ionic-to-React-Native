// Ported from: src/pages/cancelpolicy-modal/cancelpolicy-modal.module.ts (+ the nav targets in cancelpolicy-modal.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: cancelpolicy-modal.ts:58 push(CancelationPolicyPage) (goOnCancelationPolicy), :129 setRoot(TabsPage, {index:'3'}) after a successful redeem.
// :197 push(RegistrationPage, {data}) is updateProfile(), called only from commented-out template lines: dead, so Registration is not a link.
// Opened by GiftDetail with modalCtrl.create(CancelpolicyModalPage, {karigar_id, gift_id}).present() (gift-detail.ts:53), so it is an Ionic modal.
// Live for every role (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'CancelpolicyModal',
  presentation: 'modal',
  links: ['CancelationPolicy', 'Tabs'],
};

export default route;
