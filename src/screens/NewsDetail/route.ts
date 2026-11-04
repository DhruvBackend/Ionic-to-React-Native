// Ported from: src/pages/news-detail/news-detail.module.ts (+ the nav targets in news-detail.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: pushed by News (news.ts:30) with {id}. DEAD in Topbath (feature flag news, Phase 6): only linked from the dead News page.
// news-detail.ts:68 popToRoot (ionViewDidLeave): no push/setRoot targets.
const route: RouteMeta = {
  name: 'NewsDetail',
  presentation: 'card',
  feature: 'news',
  links: [],
};

export default route;
