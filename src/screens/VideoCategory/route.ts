// Ported from: src/pages/video-category/video-category.module.ts (+ the push target in video-category.ts:54)
import type { RouteMeta } from '../../navigation/types';

// Ionic: video-category.ts:54 push(VideoPage, {cat}). Live for every role (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'VideoCategory',
  presentation: 'card',
  links: ['Video'],
};

export default route;
