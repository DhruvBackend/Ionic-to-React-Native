// Ported from: src/pages/video/video.module.ts (+ the nav calls in video.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: video.ts:116 popToRoot() (ionViewDidLeave, no named target). Pushed from VideoCategory (video-category.ts:54, {cat}).
// Live for every role (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'Video',
  presentation: 'card',
  links: [],
};

export default route;
