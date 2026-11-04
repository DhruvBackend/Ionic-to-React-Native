// Ported from: src/pages/video-category/video-category.scss (empty) + the global rules of src/theme/variables.scss that reach video-category.html
// Citations: [T] variables.scss line (Ionic source).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { catalogueMd } from '../../theme/ionicMdCatalogue';
import { videoCategoryMd } from '../../theme/ionicMdVideoCategory';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 4393-4402 `.data-not { width: 100%; height: calc(100% - 50px); flex centre, column }`; `.data-not img { height: 100px }`.
  // The height is set from the content's measured height in index.tsx.
  dataNot: { width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginTop: 0 },
  // [T] 107 `.mt0 { margin-top: 0 !important }` on `<div class="list-adjust mt0">` (html:15) beats `.list-adjust { margin-top: 44px }` ([T] 4026)
  listAdjust: { marginTop: 0 },
  listAdjustAfterNoRec: { marginTop: 0 },
  // [T] 1794-1797 `.listing ion-list { margin: 0 }`
  list: { margin: 0 },
  // [T] 1798-1801 `.listing ion-list button { padding: 8px 16px; font-size: 16px; margin-bottom: 16px !important }`
  // NOTE (parity): later global rules in the shipped CSS (main.css offset 379630+) win: `.listing ion-list button { position: relative; padding-left: 0 }`
  // beats `padding: 8px 16px` (same specificity, later), so the button has padding-left 0 (text x = 5 border + 16 inner); the 5px left stripe comes
  // from `.listing button:nth-child(4n+..)` (!important).
  item: { paddingTop: 8, paddingBottom: 8, paddingLeft: 0, paddingRight: 16, borderLeftWidth: 5, marginBottom: 16, backgroundColor: colors.white, borderRadius: 6, boxShadow: catalogueMd.gridShadow }, // + [T] 5560-5571 `.listing button { border-radius: 6px; background: #fff; box-shadow: 0 3px 6px #ccc }`
  // [T] 1802 `.item-inner { padding: 0 16px !important }` (its padding-bottom: 25px loses against the !important shorthand); the later
  // `.listing ion-list button .item-inner { padding-right: 0 !important }` wins for the right side. No bottom divider: `.listing button .item-inner
  // { border-bottom: 0 !important }` / `border-bottom: inherit !important` beat `.list-adjust ... .item-inner { border-bottom: 1px solid }`.
  itemInner: { paddingTop: 0, paddingBottom: 0, paddingLeft: 16, paddingRight: 0 },
  // [T] 1807-1812 `ion-label { display: flex; align-items: center; justify-content: space-between; margin: 0 -5px 0 0 !important }`
  // + [CSS] `.listing ion-list button ion-label { margin: 0; height: 60px }` (global, later): the card is 8 + 60 + 8 = 76 tall
  // explicit sides: the kit label's marginTop/marginBottom (11) beat a `margin: 0` shorthand in RN (phone pass 2026-11-04: card was 102dp)
  label: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: -5, height: 60 },
});

// [CSS] `.listing button:nth-child(...)` in cascade order (all !important, later wins): 4n+4 indigo, 3n+3 pink, 2n+2 red, else yellow.
export function stripeColor(position: number): string {
  if (position % 4 === 0) {
    return videoCategoryMd.stripe.indigo;
  }
  if (position % 3 === 0) {
    return videoCategoryMd.stripe.pink;
  }
  if (position % 2 === 0) {
    return videoCategoryMd.stripe.red;
  }
  return videoCategoryMd.stripe.yellow;
}

// [T] 4036-4038 `ion-label i { color: #002d25 }`: the hardcoded value equals $primary of the Topbath client (NOTE parity: it follows colors.primary)
export const arrowColor = colors.primary;
