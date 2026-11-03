// Ported from: src/pages/product-subdetail/product-subdetail.scss + the global rules of src/theme/variables.scss that reach the template
// Citations: [T] variables.scss line (Ionic source), [S] product-subdetail.scss line.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { productSubdetailMd as P } from '../../theme/ionicMdProductSubdetail';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // html:12 `.detais.mt10`: [T] 12579-ish `.mt10 { margin-top: 10px !important }`
  detais: { marginTop: 10 },
  // [T] 2191-2193 `.detais .detail-prize { padding: 0 16px }`
  detailPrize: { paddingTop: 0, paddingRight: 16, paddingBottom: 0, paddingLeft: 16 },
  // [T] 2194-2200 h4 {16px, #000, 600, letter-spacing 1px}; global `h1..h6 { margin: 0; line-height: 1.2 }`
  h4: { margin: 0, letterSpacing: 1 },
  // [T] 2201-2207 h3 {30px, #ED3237, padding-bottom 9}; `.m0 { margin: 0 !important }`
  h3: { margin: 0, paddingBottom: 9 },
  // html:29 `style="font-size: 50px; padding: 60px; color: #c3c3c3"` on `<i class="material-icons">`
  placeholder: { padding: 60 },
  // [T] 12572 `.padding16 { padding: 16px !important }`
  padding16: { padding: 16 },
  // [S] 3-9 `.adhar`: radius 10, margin-bottom 10, border 1px, overflow hidden
  adhar: {
    backgroundColor: colors.white,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: P.cardBorder,
    overflow: 'hidden',
  },
  // [S] 15-17 `tr { border-bottom: 1px solid #f5f5f5 }` (`&:last-child { border-bottom: 0 }`)
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: P.rowBorder },
  trLast: { borderBottomWidth: 0 },
  // [S] 19-22 `th, td { padding: 10px 5px; font-size: 12px }`; [S] 23-28 th {top, left, #002d25, #fff}; html `.w100 { width: 100px !important }`
  th: { width: 100, paddingVertical: 10, paddingHorizontal: 5, backgroundColor: P.thBackground },
  // [S] 29-31 `td { padding-left: 10px; line-height: 20px }`
  td: { flex: 1, paddingTop: 10, paddingRight: 5, paddingBottom: 10, paddingLeft: 10 },
});
