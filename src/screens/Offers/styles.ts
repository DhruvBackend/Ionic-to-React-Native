// Ported from: src/pages/offers/offers.scss + the global rules of src/theme/variables.scss that reach offers.html
// Citations: [T] variables.scss line (Ionic source), [CSS] shipped main.css rule. `.listings` [T] 3275-3410, `.conatiner` [T] 12451-12490.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { offersMd } from '../../theme/ionicMdOffers';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 12572 `.padding16 { padding: 16px !important }`
  container: { padding: 16 },
  // [T] 12452-12466 `.img-box`: width 100%, box-shadow, border 6px solid #fff, radius 10, overflow hidden, display flex, align-items center
  imgBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: colors.white,
    borderRadius: 10,
    overflow: 'hidden',
    boxShadow: offersMd.imgBoxShadow,
  },
  // [T] 12468-12470 `.content-box { margin-top: 10px }`
  contentBox: { marginTop: 10 },
  // [T] 12432 `.style` of offers.scss: display flex, space-between
  style: { flexDirection: 'row', justifyContent: 'space-between' },
  // [T] 3275-3277 `.listings { padding: 16px }`, `.main-margin-16` margin 16px 0 !important then `.mt0` (later, same specificity) margin-top 0,
  // `.pt0` padding-top 0
  listings: { paddingTop: 0, paddingRight: 16, paddingBottom: 16, paddingLeft: 16, marginTop: 0, marginBottom: 16 },
  // [T] 3277-3300 `.listings button`: radius 6, white, shadow, padding-right 16 !important, padding-left 0, margin-bottom 16 !important
  item: {
    borderRadius: 6,
    backgroundColor: colors.white,
    boxShadow: offersMd.itemShadow,
    paddingLeft: 0,
    paddingRight: 16,
    marginBottom: 16,
    borderLeftWidth: 5,
  },
  // [T] 3283 `.item-inner { padding-right: 0 !important; border-bottom: 0 !important }`
  itemInner: { paddingRight: 0 },
  // the auto-created <ion-label>: [T] 3292-3297 margin 0, display flex, space-between, center; flex 1, overflow hidden, nowrap
  label: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden', margin: 0 },
  // [T] 3300-3303 `.head-detail { display: flex; align-items: center; width: calc(100% - 50px) }` (the label holds this + the 50px image)
  headDetail: { flexGrow: 1, flexShrink: 1, flexBasis: 0, flexDirection: 'row', alignItems: 'center' },
  // [T] 3304-3309 `.head { padding: 12px 20px; text-align: center; position: relative; min-width: 100px }`
  head: { flexShrink: 1, minWidth: 100, paddingVertical: 12, paddingHorizontal: 20 },
  // offers.scss `.head span` (12px, #747474); the span sits in the .head's anonymous line box (strut of the 14px label font)
  headSpanLine: { height: normalLineHeight(16) },
  headSpan: { textAlign: 'center', marginTop: 4 },
  // [T] 3310-3315 `.head h1` 20px / 600 / #1b1b1b (line-height 1.2 from Ionic's h1-h6)
  headH1: { textAlign: 'center' },
  // `#redeem-points` ([T] 3054-3058, id beats `.head p`): padding 0 70px 0 0, 12px; display block, nowrap: the text overflows the
  // (~0 wide) content box, visibly.
  // wrapper: one 12px line box; the Text is absolute (fixed wide box) so it overflows visibly like CSS nowrap text
  redeem: { height: normalLineHeight(12) },
  redeemText: { position: 'absolute', top: 0, left: 0, width: 260 },
  // [T] 3322-3328 `.head a { position: absolute; top: 5px; left: 4px }`
  verified: { position: 'absolute', top: 5, left: 4 },
  // [T] 3316-3321 `.head:after`: absolute, top 50%, translateY(-50%), right 0, height 50, border 1px solid #DEDEDE (width 0)
  divider: {
    position: 'absolute',
    top: '50%',
    right: 0,
    width: 2,
    height: 50,
    borderWidth: 1,
    borderColor: offersMd.divider,
    transform: [{ translateY: -25 }],
  },
  // [T] 3338-3344 `.detail { margin-left: 16px; width: 100%; overflow: hidden }`
  detail: { marginLeft: 16, flexBasis: '100%', flexShrink: 1, flexGrow: 0, overflow: 'hidden', minWidth: 0 },
  // [T] 3368-3378 `.product-img { width/height 50; flex center } img { width/height 100% }`
  productImg: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  productImgImg: { width: '100%', height: '100%' },
});

// [T] 3369-3386, in cascade order (all four `:nth-child` rules use !important, the later one wins): 4n+4 indigo, 3n+3 pink, 2n+2 red, else yellow.
export function stripeColor(position: number): string {
  if (position % 4 === 0) {
    return offersMd.stripe.indigo;
  }
  if (position % 3 === 0) {
    return offersMd.stripe.pink;
  }
  if (position % 2 === 0) {
    return offersMd.stripe.red;
  }
  return offersMd.stripe.yellow;
}
