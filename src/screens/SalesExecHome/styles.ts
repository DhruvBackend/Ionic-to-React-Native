// Ported from: src/pages/sales-exec-home/sales-exec-home.scss (+ the global rules of src/theme/variables.scss that reach the template)
// The global `h1..p, span { margin: 0 !important }` beats the page's h2/p/h3 margins, so those are 0 here.
import { StyleSheet } from 'react-native';
import { textStyle } from '../../components/ionic/text';
import { colors } from '../../theme';
import { homeMd } from '../../theme/ionicMdHome';
import { salesExecHomeMd as S } from '../../theme/ionicMdSalesExecHome';

const PR = homeMd.pointsRow;

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  companyLogo: { paddingVertical: homeMd.companyLogo.paddingVertical, paddingHorizontal: homeMd.companyLogo.paddingHorizontal },
  mr10: { marginRight: S.mr10Extra },
  banner: { overflow: 'hidden' },

  greetCard: {
    backgroundColor: S.card.background,
    marginTop: S.greet.marginTop,
    marginBottom: 0,
    marginHorizontal: S.greet.marginHorizontal,
    paddingVertical: S.greet.paddingVertical,
    paddingHorizontal: S.greet.paddingHorizontal,
    borderRadius: S.card.radius,
    boxShadow: S.card.shadow,
  },
  greetTitle: textStyle(S.greet.titleSize, 500, S.greet.titleColor, S.greet.titleSize * 1.2),
  greetSub: textStyle(S.greet.subSize, 400, S.greet.subColor),

  // `.home-pint .profile-point` (3 columns, gap 10)
  profilePoint: { padding: PR.padding },
  pointsList: { flexDirection: 'row' },
  pointsCard: {
    flex: 1,
    height: PR.cardHeight,
    borderRadius: PR.cardRadius,
    backgroundColor: colors.white,
    boxShadow: PR.cardShadow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsBar: {
    position: 'absolute',
    bottom: PR.barBottom,
    alignSelf: 'center',
    width: PR.barWidth,
    height: PR.barHeight,
    borderRadius: PR.barRadius,
  },
  // centred labels stretch to the card width (a shrink-wrapped centred Text can be clipped on Android)
  pints: { alignSelf: 'stretch', alignItems: 'center' },
  pintsValue: {
    ...textStyle(PR.valueFontSize, 700, homeMd.black, PR.valueFontSize * 1.2),
    paddingBottom: PR.valuePaddingBottom,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  pintsLabel: { ...textStyle(PR.labelFontSize, 500, homeMd.black), textTransform: 'capitalize', alignSelf: 'stretch', textAlign: 'center' },
  pintsUnit: { position: 'absolute', right: PR.unitRight, bottom: PR.unitBottom, transform: [{ rotate: PR.unitRotate }] },
  pintsUnitText: { ...textStyle(PR.unitFontSize, 300, PR.unitColor), letterSpacing: PR.unitLetterSpacing },

  myPointsCard: {
    backgroundColor: S.card.background,
    marginVertical: S.points.marginVertical,
    marginHorizontal: S.points.marginHorizontal,
    padding: S.points.padding,
    borderRadius: S.card.radius,
    boxShadow: S.card.shadow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  myPointsLabel: textStyle(S.points.labelSize, 400, S.points.labelColor),
  myPointsValue: textStyle(S.points.valueSize, 600, S.points.valueColor, S.points.valueSize * 1.2),
  myPointsIcon: { opacity: S.points.iconOpacity },

  groupBtn: { paddingHorizontal: homeMd.groupBtn.paddingHorizontal },
  h50: { height: homeMd.h50 },
});
