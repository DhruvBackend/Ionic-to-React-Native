// Ported from: src/pages/feedback/feedback.module.ts (+ the nav targets in feedback.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: feedback.ts:36 setRoot(TabsPage, {index:'0'}), :68 popToRoot() (ionViewDidLeave).
// PUSH-ONLY: pushed from the `message` push handlers (app.component.ts:940 and home.ts:1004, both in initPushNotification; home.ts:796 is dead
// inside Home.notification(); main-home.ts:64 goOnFeedbackPage() is dead, its only button is commented out in main-home.html:30).
// Never fires in the shipped Topbath APK (no push plugin, features.push false); live for push-enabled clients.
// Not a tab root, not in the side menu.
const route: RouteMeta = {
  name: 'Feedback',
  presentation: 'card',
  links: ['Tabs'],
};

export default route;
