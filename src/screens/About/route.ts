// Ported from: src/pages/about/about.ts (no @IonicPage, no module)
import type { RouteMeta } from '../../navigation/types';

// Ionic: about.ts has no nav calls. Live for every role (card Status LIVE, no feature flag). A Customer tab and pushed from the side menu.
const route: RouteMeta = {
  name: 'About',
  presentation: 'card',
  links: [],
};

export default route;
