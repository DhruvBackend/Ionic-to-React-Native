// Ported from: src/pages/contact/contact.module.ts (+ the nav calls in contact.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: contact.ts:29 setRoot(HomePage) (offline guard, dead: dbService.connection is never assigned), :65 popToRoot() (ionViewDidLeave).
// Live for every role (card Status LIVE, no feature flag). A Customer tab and pushed from the side menu.
const route: RouteMeta = {
  name: 'Contact',
  presentation: 'card',
  links: ['Home'],
};

export default route;
