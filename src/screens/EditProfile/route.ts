// Ported from: src/pages/edit-profile/edit-profile.module.ts (+ the nav targets in edit-profile.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: edit-profile.ts:189 / :195 setRoot(TabsPage, {index:'0'|'4'}). Phase 6, feature-flagged (card Status DEAD: profile.ts:301
// editProfilePage() and dealer-profile.ts:144 are never called from a template).
const route: RouteMeta = {
  name: 'EditProfile',
  presentation: 'card',
  feature: 'editProfile',
  links: ['Tabs'],
};

export default route;
