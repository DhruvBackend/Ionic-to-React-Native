// Ported from: src/pages/survey/survey-detail/survey-detail.scss + the global rules that reach survey-detail.html
// Citations: [P] survey-detail.scss, [CSS] the shipped main.css (global `p/h2/ul/button` rules, `.padding16`, `.h50`, `.mb0`, `.mr5`).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { itemContentMd } from '../../theme/ionicMdContent';
import { surveyDetailMd as S } from '../../theme/ionicMdSurveyDetail';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [P] `.survey-count { display: grid; grid-template-columns: 1fr 1fr 1fr; position: sticky; top: 0; width: 100%; z-index: 9; border-radius: 10px;
  // border-bottom: 3px solid #55adba; overflow: hidden; background: #fff; grid-column-gap: 10px; padding: 10px }`
  surveyCount: {
    flexDirection: 'row',
    columnGap: 10,
    width: '100%',
    zIndex: 9,
    borderRadius: 10,
    borderBottomWidth: 3,
    borderBottomColor: S.countAccent,
    overflow: 'hidden',
    backgroundColor: colors.white,
    padding: 10,
  },
  // [P] `.count-box { background: #55adba; color: #fff; text-align: center; border-radius: 10px; overflow: hidden }` (a 1fr grid cell)
  countBox: { flex: 1, backgroundColor: S.countAccent, borderRadius: 10, overflow: 'hidden' },
  // [P] `.count-box p { font-size: 12px; line-height: 20px; padding: 5px; letter-spacing: .5px }`; global `p { margin: 0 !important }`
  countLabel: { padding: 5, letterSpacing: 0.5, textAlign: 'center' },
  // [P] `.count-box p:last-child { background: rgba(0,0,0,.2); font-size: 14px; font-weight: 600 }`
  countValue: { padding: 5, letterSpacing: 0.5, textAlign: 'center', backgroundColor: S.countValueOverlay },
  // [P] `.survey-que ul li { padding: 16px 16px 8px 16px; border-bottom: 4px solid #e6e6e6 }`; global `ul { list-style: none; margin: 0; padding: 0 }`
  question: { paddingTop: 16, paddingRight: 16, paddingBottom: 8, paddingLeft: 16, borderBottomWidth: 4, borderBottomColor: S.questionDivider },
  // [P] `h2 { font-size: 14px; line-height: 20px }` + global `h1..h6 { font-weight: 500 }`, `h2 { margin: 0 !important }`
  // `.mb0` on the ion-list: `margin-bottom: 0 !important` (the kit keeps its own -1px top margin, `ion-list.list-md { margin: -1px 0 16px }`)
  answerList: { marginBottom: 0 },
  // [P] `.label-md { font-size: 14px; font-weight: 500; margin: 5px }` (explicit sides: the kit label margins beat a shorthand)
  answerLabel: { marginTop: 5, marginRight: 5, marginBottom: 5, marginLeft: 5 },
  // `<ion-radio item-left class="mr5">`: `.mr5 { margin-right: 5px !important }` beats the item-left margin (36px) of the kit's IonRadio, which has no
  // style prop: the wrapper's negative margin gives the same layout (a margin-right of 5 instead of the kit's).
  radioStart: { marginRight: 5 - itemContentMd.radioMarginStart.right },
  // [CSS] `.padding16 { padding: 16px !important }`
  padding16: { padding: 16 },
  // [CSS] `.h50 { height: 50px !important }`
  h50: { height: 50 },
});
