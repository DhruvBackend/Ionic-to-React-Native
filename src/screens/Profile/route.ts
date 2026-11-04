// Ported from: src/pages/profile/profile.module.ts (+ the nav targets in profile.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: profile.ts:65 setRoot(Home), :121 setRoot(Language), :185 push(PointLocation), :277 modal(ViewProfile), :301 push(EditProfile)
// (never called from the template), :316 push(Registration). Live for every role (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'Profile',
  presentation: 'card',
  // EditProfile is NOT a link: profile.ts:301 editProfilePage() is bound by no template (the edit buttons call updateProfile())
  links: ['Home', 'Language', 'PointLocation', 'ViewProfile', 'Registration'],
};

export default route;
