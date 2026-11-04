// Ported from: src/pages/news/news.module.ts (+ the push targets in news.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: news.ts:30 push(NewsDetailPage, {id}); :93 popToRoot (ionViewDidLeave). DEAD in Topbath (feature flag news, Phase 6): main-home.ts:60
// goOnNewsPage() is the only code that navigates here and nothing calls it.
const route: RouteMeta = {
  name: 'News',
  presentation: 'card',
  feature: 'news',
  links: ['NewsDetail'],
};

export default route;
