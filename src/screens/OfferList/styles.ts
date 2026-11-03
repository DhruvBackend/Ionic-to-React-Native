// Ported from: src/pages/offer-list/offer-list.scss (empty) + the global rules of src/theme/variables.scss that reach offer-list.html
// Citations: [T] variables.scss line (Ionic source). `.bg-product` etc. are under `.Product` ([T] 3418-3533).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { md } from '../../theme/ionicMd';

// [T] 3432 `.errow { background: #424242 }`. NOTE: screens may not spell a hex colour; the same grey is Ionic's $toolbar-md-text-color.
export const errowBackground = md.toolbarTextColor;

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 4393-4402 `.data-not { width: 100%; height: calc(100% - 50px); display: flex; align-items/justify-content: center; column }`;
  // the height is set from the content's measured height in index.tsx
  dataNot: { width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
  // `.data-not img { height: 100px }` (auto width = 100 * 396.622 / 402.309)
  // [T] 3419-3420 `.Product { margin: 16px }`
  product: { margin: 16 },
  // [T] 3421-3426 `.bg-product`: border 1px primary, padding-left 0, margin-bottom 16 !important; `button ion-item` => width 100%
  bgProduct: { borderWidth: 1, borderColor: colors.primary, paddingLeft: 0, marginBottom: 16 },
  // [T] 3500 `.item-inner { padding-right: 0 !important; border-bottom: 0 !important }`
  itemInner: { paddingRight: 0 },
  // the auto-created <ion-label> that wraps the item's content: margin 0 !important ([T] 3504), flex 1, overflow hidden
  label: { flex: 1, overflow: 'hidden', margin: 0 },
  // [T] 3427-3430 `.thumbnail { line-height: 0; height: 150px }`; `ion-label img { width: 100%; height: 100% }` ([T] 3505-3508)
  thumbnail: { height: 150 },
  thumbnailImg: { width: '100%', height: '100%' },
  // [T] 3431-3441 `.errow`: #424242, width 100%, flex row, center, space-between, padding 16
  errow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: errowBackground,
  },
  // the h1/p are `white-space: nowrap` (ion-label) so the block keeps its text width (flexShrink 0); see index.tsx
  listTags: { flexShrink: 0 },
  // [T] 3447-3452 `.list-tags h1 { text-align left; color white; font-size 15; letter-spacing 1; weight 600 }` (+ h1 line-height 1.2 = 18)
  h1: { textAlign: 'left', letterSpacing: 1, marginBottom: 2 }, // `.wthspan h1 { display: flex; align-items: center; margin-bottom: 2px !important }` ([T] 3459-3464)
  // [T] 3453-3458 `.list-tags p { font-size 12; weight 400; margin-top 1px !important }` (+ `.label-md` line-height 1.5 = 18)
  p: { textAlign: 'left', marginTop: 1 },
  // [T] 3489-3492 `.errow i { font-size: 28px; color: white }`
  arrow: { flexShrink: 0 },
});
