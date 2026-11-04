// Ported from: src/pages/category/category.scss (empty: `page-category { }`) + [T] 4696-4744 `.product-data`, 12572 `.padding16`, 4393-4402 `.data-not`
// and 1239-1300 `.search.add-search` of src/theme/variables.scss. Text styles are built in the components with textStyle(); only boxes live here.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { catalogueMd as C } from '../../theme/ionicMdCatalogue';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 1259-1264 `.search.add-search { margin: 0; max-height: 68px; padding: 0 }` > `.filter { display: flex; align-items: center; justify-content: space-between; width: 100% }`
  search: { maxHeight: 68, margin: 0, padding: 0, width: '100%' },
  filter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  // [T] 12572 `.padding16 { padding: 16px !important }`
  padding16: { padding: 16 },
  // [T] 4696-4708 `.product-data`: grid 100px 1fr, column gap 10, min-height 100, margin 30 0 40, border 1px, radius 6, padding 0 10
  // the 30px top margin of a row after the first collapses into the 40px bottom margin above it (CSS block siblings)
  collapsedTop: { marginTop: 0 },
  productData: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginTop: 30,
    marginBottom: 40,
    marginHorizontal: 0,
    boxShadow: C.cardShadow,
    borderRadius: 6,
    flexDirection: 'row',
    columnGap: 10,
    paddingHorizontal: 10,
    minHeight: 100,
  },
  // [T] 4709-4727 `.image-thubmnail`: the 100px grid column, margin-top -16, 100px high, centred, clipped
  thumbnail: {
    width: 100,
    marginTop: -16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: C.cardBorder,
    boxShadow: C.cardShadow,
    borderRadius: 6,
    height: 100,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailImg: { width: 150, height: 150 },
  // [T] 4729-4748 `.content { display: flex; align-items: center; justify-content: space-between; grid-column-gap: 5px }` (the 1fr grid column)
  content: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 5 },
  title: { flexShrink: 1 },
  titleCenter: { textAlign: 'center' },
  fullWidth: { width: '100%' },
  chevron: { flexShrink: 0 },
  // [T] 4393-4402 `.data-not { width: 100%; height: calc(100% - 50px) (auto: the padding16 parent has no height); flex column centred }`
  dataNot: { width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
});
