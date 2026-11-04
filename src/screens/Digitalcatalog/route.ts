// Ported from: src/pages/digitalcatalog/digitalcatalog.module.ts (+ the nav targets in digitalcatalog.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: pushed by Home goTodigitalcat() (home.ts:957). DEAD in Topbath (feature flag digitalCatalog, Phase 6): the button that calls it
// (home.html:101) is commented out. No push/setRoot targets; each row is an `<a href>` that opens the PDF.
const route: RouteMeta = {
  name: 'Digitalcatalog',
  presentation: 'card',
  feature: 'digitalCatalog',
  links: [],
};

export default route;
