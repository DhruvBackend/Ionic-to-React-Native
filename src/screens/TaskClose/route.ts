// Ported from: src/pages/task-close/task-close.module.ts (+ the nav targets in task-close.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: pushed by PulmberCustomerDetail.goToTaskPage(lable) with {id, mobile, name, lable}. task-close.ts:202 setRoot(TabsPage, {index: '0'}).
// Plumber only (card, no feature flag).
const route: RouteMeta = {
  name: 'TaskClose',
  presentation: 'card',
  links: ['Tabs'],
};

export default route;
