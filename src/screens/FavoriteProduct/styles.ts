// Ported from: src/pages/favorite-product/favorite-product.scss (empty: `page-favorite-product { }`) + the global rules of src/theme/variables.scss
// that reach favorite-product.html on `<ion-content class="listing grid-listing category-product sub-category">`.
// Citations: [T] variables.scss line (Ionic source). Text styles are built in index.tsx with textStyle(); only boxes live here.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { catalogueMd as C } from '../../theme/ionicMdCatalogue';
import { favoriteProductMd as F } from '../../theme/ionicMdFavoriteProduct';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 1825-1826 `.listing.grid-listing { background: #f8f8f8 }`. [T] 5560-5565 `.listing { margin: 16px 0 }` on `.ion-page>ion-content` (absolute,
  // height 100%): the margin moves the content down 16 and the page clips its bottom 16 (same as Products / Newarrivals)
  content: { backgroundColor: C.gridBg, marginTop: 16, marginBottom: -16 },
  // [T] 1827-1836 `.listing.grid-listing .main-div`: flex wrap, space-between, padding 16 (top 0 !important), margin-bottom 32
  mainDiv: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 0, paddingHorizontal: 16, paddingBottom: 16, marginBottom: 32 },
  // [T] 1917-1922 `.sub-category .sub-listing { display: flex; padding: 16px; flex-wrap: wrap; justify-content: space-between; width: 100% }`,
  // `.p0 { padding: 0 !important }`
  subListing: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 0 },
  // [T] 1961-1968 `.tydo-list ion-list { width: 50% !important; border: solid 1px #C9C9C9; margin-bottom: -1px !important }` (4 classes: beats the
  // grid-listing `calc(50% - 8px)` and the sub-category `48%`, all !important); [T] 2008-2012 `.sub-category ion-list { background: $white !important;
  // padding: 0 !important }`; [T] 1904-1908 `.category-product ion-list { margin: 0 0 -16px }` (only its bottom is overridden)
  list: { width: '50%', borderWidth: 1, borderColor: F.listBorder, marginBottom: -1, backgroundColor: F.listBackground, padding: 0 },
  // [T] 1840-1845 `.main-div ion-list button { padding: 0 !important; border: 0 !important; margin-bottom: 0 !important }`, `.item-inner { padding: 0 !important }`;
  // [T] 5560 `.listing button { border-radius: 6px; background: $white }`; [T] 1969-1972 `.tydo-list ion-list button { box-shadow: inherit !important }` (the list has none)
  item: { borderRadius: 6, paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0, marginBottom: 0 },
  itemInner: { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }, // explicit sides: the kit's beat a shorthand
  // [T] 1848-1852 `ion-label { display: block; margin: 0 !important; height: inherit; padding: 0 }` (the label's nowrap / overflow hidden stay)
  label: { flex: 1, overflow: 'hidden', marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0 }, // explicit sides: the kit label margins beat a shorthand
  // [T] 1853-1868 `.image-manage { height: 120px; flex centred; padding: 10px 10px 0; overflow: hidden }`, `img { height: 100% }` (110 content box);
  // html:14 `style="width: 60%"` beats `width: auto`
  imageManage: { height: 120, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 10, paddingHorizontal: 10, paddingBottom: 0, overflow: 'hidden' },
  image: { height: 110, width: '60%' },
  // [T] 1923-1925 `.sub-listing .detail { text-align: center }`
  detail: { width: '100%' },
  // [T] 1926-1931 `.detail h4 { font-size: 12px; font-weight: 600; padding: 0 5px; white-space: normal }` (global h1..h6 margin 0 !important)
  h4: { paddingHorizontal: 5, textAlign: 'center' },
  // [T] 1938-1950 `.detail h3 { margin: 10px 0 !important; display: inherit; font-weight: normal }`: the `.m0 { margin: 0 !important }` class is less
  // specific than `.listing.sub-category .sub-listing .detail h3`, so the 10px stays. The span has `padding-right: 3px`.
  h3: { flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', marginTop: 10, marginBottom: 10 },
  rupee: { marginRight: 3 },
  // [T] 7353-7362 `.nothing-here { height: 80% }`; 7850-7860 `.outer`/`.innear`: table cell, middle, centred
  nothingHere: { width: '100%' },
  innear: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imgGap: { height: 4 },
  noDataText: { letterSpacing: 1, textAlign: 'center' },
});
