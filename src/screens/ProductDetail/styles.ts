// Ported from: src/pages/product-detail/product-detail.scss (empty) + the global rules of src/theme/variables.scss that reach the template
// Citations: [T] variables.scss line (Ionic source). Shared with Newarrivals (same product grid).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { productListMd as P } from '../../theme/ionicMdProductList';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 1239-1246 `.search.add-search { margin: 0; max-height: 68px; padding: 0 }`, `.filter { display: flex; align-items: center; justify-content: space-between; width: 100% }`
  addSearch: { margin: 0, maxHeight: 68, padding: 0 },
  filter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  // [T] 12572 `.padding16 { padding: 16px !important }`
  padding16: { padding: 16 },
  // [T] 4818-4823 `.grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px }`
  gridRow: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 16 },
  gridRowLast: { marginBottom: 0 },
  gridGap: { width: 16 },
  gridCell: { flex: 1 },
  // [T] 4696-4708 + 4765-4772 `.product-data.two-column`: #fff, 1px #f0f0f0, shadow, radius 6, margin 0, padding 16 0 0 0, min-height 100
  productData: {
    flex: 1,
    backgroundColor: P.cardBackground,
    borderWidth: 1,
    borderColor: P.cardBorder,
    borderRadius: 6,
    boxShadow: P.cardShadow,
    paddingTop: 16,
    minHeight: 100,
  },
  // [T] 4709-4721 + 4773-4786 `.two-column .image-thubmnail`: no border/shadow/radius, border-bottom 1px #e5e5e5, min-height 160, centred, overflow hidden
  imageThumbnail: {
    borderBottomWidth: 1,
    borderBottomColor: P.imageDivider,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: P.cardBackground,
  },
  // [T] 4718-4722 `.image-thubmnail img { width: 150px; height: 150px; object-fit: contain }`
  image: { width: 150, height: 150 },
  // [T] 4783-4786 `.two-column .image-thubmnail i { font-size: 50px; color: #979797 }`
  placeholder: {},
  // [T] 4788-4800 `.two-column .content { padding: 10px }`
  content: { padding: 10 },
  // [T] 4742-4747 `.content h6 { 13px; color #1e1d1b }` + `.two-column .content h6 { line-height 20; capitalize; 1 line, ellipsis }`
  h6: { textTransform: 'capitalize' },
  // [T] 4704-4710 `.code { display: flex; align-items: center; justify-content: space-between; column-gap: 5px }`
  code: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 5 },
  // [T] `.data-not { width: 100%; height: calc(100% - 50px); flex centre column }`; height set from the content's measured height
  dataNot: { width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
});
