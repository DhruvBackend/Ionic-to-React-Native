// Ported from: src/pages/survey/survey-detail/survey-detail.module.ts (+ the nav param in survey-detail.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: pushed by SurveyList (survey-list.ts:34 push(SurveyDetailPage, {id}), the class, not a string name; the page has @IonicPage() but is
// imported eagerly and listed in app.module.ts). Only linked from the dead SurveyList page (card: DEAD, Phase 6). No nav target of its own.
const route: RouteMeta = {
  name: 'SurveyDetail',
  presentation: 'card',
  feature: 'survey',
  links: [],
};

export default route;
