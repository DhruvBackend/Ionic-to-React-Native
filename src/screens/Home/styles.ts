// Ported from: src/pages/home/home.scss (+ the global rules of src/theme/variables.scss that reach home.html)
// Values and citations: src/theme/ionicMdHome.ts. h3/h4 are Ionic md headings: weight 500, line-height 1.2 (the global
// `h1..p { margin: 0 !important }` removes their margins); `p` and `span` have `normal` line-height.
import { StyleSheet } from 'react-native';
import { textStyle } from '../../components/ionic/text';
import { colors } from '../../theme';
import { homeMd } from '../../theme/ionicMdHome';
import { toolbarColors } from '../../theme/ionicMdPage';

const PO = homeMd.productOption;
const PR = homeMd.pointsRow;
const GO = homeMd.goBtn;

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },

  // header (Ionic `.company-logo`: a block div with an inline <img>)
  companyLogo: {
    paddingVertical: homeMd.companyLogo.paddingVertical,
    paddingHorizontal: homeMd.companyLogo.paddingHorizontal,
  },
  mr10: { marginRight: homeMd.mr10Extra },
  mr16: { marginRight: homeMd.mr16Extra },
  // icon-only bar-button holding an icon + `.badge`: the button has padding 0 (icon-only) but the kit's text button
  // variant adds 5px each side, so the icon box takes it back.
  barIcon: { minWidth: 28, marginHorizontal: -5, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: homeMd.badge.top,
    left: homeMd.badge.left,
    width: homeMd.badge.size,
    height: homeMd.badge.size,
    borderRadius: homeMd.badge.size / 2,
    backgroundColor: homeMd.badge.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: textStyle(homeMd.badge.fontSize, 500, toolbarColors.white.text),

  // `.banner { overflow: hidden }`
  banner: { overflow: 'hidden' },

  // `.product-option`
  productOption: {
    flexDirection: 'row',
    paddingHorizontal: PO.paddingHorizontal,
    paddingBottom: PO.paddingBottom,
  },
  mainBox: {
    flex: 1,
    margin: PO.boxMargin,
    backgroundColor: colors.white,
    borderRadius: PO.boxRadius,
    boxShadow: PO.boxShadow,
    alignItems: 'center',
  },
  productBox: {
    height: PO.productBoxHeight,
    width: '100%',
    paddingVertical: PO.productBoxPaddingVertical,
    borderBottomWidth: 1,
    borderBottomColor: PO.productBoxBorder,
    alignItems: 'center',
  },
  heading: {
    height: PO.headingHeight,
    marginVertical: PO.headingMarginVertical,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  headingText: {
    ...textStyle(PO.headingFontSize, 600, homeMd.black, PO.headingFontSize * 1.2),
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  point: { height: PO.pointHeight, alignItems: 'center', justifyContent: 'center' },
  pointText: textStyle(PO.pointFontSize, 500, homeMd.black, PO.pointFontSize * 1.2),
  // `.main-box span` count chip (Plumber, Sales_Boy, Dealer first box; Plumber boxes 2 and 3)
  chip: {
    position: 'absolute',
    top: 3,
    left: 3,
    paddingTop: 1,
    paddingBottom: 2,
    paddingHorizontal: 3,
    borderRadius: 2,
    backgroundColor: PO.chipBackground,
  },
  chipText: textStyle(PO.chipFontSize, 500, colors.white),
  // `.main-box:before` coloured bar
  bar: {
    position: 'absolute',
    bottom: PO.barBottom,
    alignSelf: 'center',
    width: PO.barWidth,
    height: PO.barHeight,
    borderRadius: PO.barHeight / 2,
  },

  // `.home-pint .profile-point`
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
  // `.pints` shrink-wraps and centres inside the flex li (text-align:center). RN: a shrink-wrapped Text centred at a fractional x
  // can get its width rounded down 1px, and Android then wraps the last letter ("Today" drew as "Toda", phone pass 2026-11-04).
  // Stretching the column to the card width and centring the text inside gives the same picture without the clip.
  pints: { alignSelf: 'stretch', alignItems: 'center' },
  pintsValue: {
    ...textStyle(PR.valueFontSize, 700, homeMd.black, PR.valueFontSize * 1.2),
    paddingBottom: PR.valuePaddingBottom,
    textAlign: 'center',
  },
  pintsLabel: { ...textStyle(PR.labelFontSize, 500, homeMd.black), textTransform: 'capitalize', alignSelf: 'stretch', textAlign: 'center' },
  pintsUnit: {
    position: 'absolute',
    right: PR.unitRight,
    bottom: PR.unitBottom,
    transform: [{ rotate: PR.unitRotate }],
  },
  pintsUnitText: {
    ...textStyle(PR.unitFontSize, 300, PR.unitColor),
    letterSpacing: PR.unitLetterSpacing,
  },

  // `.pd-left-right16.mb16` + `.go-btn.artificial`
  videosWrap: { paddingHorizontal: 16, marginBottom: homeMd.mb16 },
  goBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: GO.height,
    borderRadius: GO.radius,
    backgroundColor: colors.white,
    boxShadow: GO.shadow,
  },
  goLeft: { width: GO.leftWidth, minWidth: GO.leftWidth, marginLeft: GO.leftMarginLeft },
  goLeftImg: { position: 'absolute', top: GO.imgTop, left: GO.imgLeft },
  goRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: GO.rightPaddingHorizontal,
    paddingRight: GO.rightPaddingHorizontal,
  },
  goContentText: textStyle(GO.contentFontSize, 600, homeMd.black),

  // `.group-btn`
  groupBtn: { paddingHorizontal: homeMd.groupBtn.paddingHorizontal },
  groupBtnGap: { marginBottom: homeMd.groupBtn.gap },
  h50: { height: homeMd.h50 },
});
