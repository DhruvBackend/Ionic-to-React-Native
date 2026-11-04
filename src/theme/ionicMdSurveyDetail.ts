// Values of the SurveyDetail page (survey-detail.scss, page-scoped) that the screen cannot spell as hex (lint rule).
// Citations: [P] src/pages/survey/survey-detail/survey-detail.scss in the Ionic source. NOTE: added for the SurveyDetail screen.
export const surveyDetailMd = {
  // [P] 14 `.survey-count { border-bottom: 3px solid #55adba }`, 20 `.count-box { background: #55adba }`
  countAccent: '#55adba',
  // [P] 33 `.count-box p:last-child { background: rgba(0, 0, 0, 0.2) }`
  countValueOverlay: 'rgba(0, 0, 0, 0.2)',
  // [P] 55 `.survey-que ul li { border-bottom: 4px solid #e6e6e6 }`
  questionDivider: '#e6e6e6',
} as const;
