// Ported from: src/pages/quotation-genrate-by-pdf/quotation-genrate-by-pdf.scss + the global rules of src/theme/variables.scss that reach the template
// Citations: [P] page scss line, [T] variables.scss line.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { textStyle } from '../../components/ionic/text';
import { quotationMd } from '../../theme/ionicMdQuotationGenrateByPdf';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 8813 `.edit { margin: 0 16px }`; `item-flex` has no CSS rule; `.edit.mt16` gets `.mt16 { margin-top: 16px !important }` (main.css)
  edit: { marginHorizontal: 16, marginTop: 16 },
  // `.edit ion-list { margin: 0 }` (main.css) zeroes list-md's `margin: -1px 0 16px`; explicit sides (a shorthand loses to the kit's marginTop/Bottom)
  editList: { marginTop: 0, marginBottom: 0 },
  // [P] 147-152 `.sprate-block { padding: 10px; border: 1px dashed #2e5ea2; border-radius: 6px; margin-top: 16px }`
  sprateBlock: { padding: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: quotationMd.blockBorder, borderRadius: 6, marginTop: 16 },
  // [T] 459 `.cs-btn { height: 40px !important; width: 100% }` sits in a `div.mt16` (`.mt16 { margin-top: 16px !important }`)
  btnWrap: { marginTop: 16 },
  // `.mt16 { margin-top: 16px !important }` on an ion-item
  mt16: { marginTop: 16 },
  // [P] 2-3 `.card-list { display: flex; flex-direction: column-reverse }`
  cardList: { flexDirection: 'column-reverse' },
  // [P] 5-19 `.card-item`
  cardItem: {
    backgroundColor: quotationMd.cardBackground,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: quotationMd.cardBorder,
    padding: 10,
    borderRadius: 8,
    marginTop: 16,
    flexDirection: 'row',
    columnGap: 16,
    alignItems: 'center',
    marginLeft: 13,
    marginRight: 13,
  },
  // [P] 25 `.data-content { width: 100% }` (shrinks next to the image and the button)
  dataContent: { flex: 1 },
  // [P] 26-34 `.data-content p`: 12px, line-height 20px, colour #000
  p: textStyle(12, 400, quotationMd.text, 20),
  strong: textStyle(12, 700, quotationMd.strong, 20), // global `* { font-weight: 400 }` loses to the element rule strong { font-weight: bold }
  // `.item-flex` has no rule: a plain block, the three p stack
  itemFlex: {},
  // [P] 52-61 `.product-img { width: 90px; height: 90px; display: flex; align-items: center; justify-content: center } img { width: 100% }`
  productImg: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center' },
  productImgImg: { width: 90 },
  // [P] 38 `.data-action { min-width: 30px }` with `.fab[mini] { width: 30px; height: 30px; margin: 0 }`
  dataAction: { minWidth: 30 },
});
