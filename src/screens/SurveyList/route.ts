// Ported from: src/pages/survey/survey-list/survey-list.module.ts (+ the nav target in survey-list.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: survey-list.ts:34 push(SurveyDetailPage, {id}) (the class, not a string: SurveyListPage has @IonicPage() but is imported eagerly and
// listed in app.module.ts). Pushed only by home.ts:946 SurveyList() whose button is commented out (card: DEAD, Phase 6).
const route: RouteMeta = {
  name: 'SurveyList',
  presentation: 'card',
  feature: 'survey',
  links: ['SurveyDetail'],
};

export default route;
