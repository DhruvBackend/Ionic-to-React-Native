// Ported from: src/pages/products/products.scss (empty: `page-products { }`) + the global rules of src/theme/variables.scss that reach products.html:
// [T] 1794-1990 `.listing` / `.grid-listing`, 5560-5602 `.listing button`, 7353-7362 `.nothing-here`, 7850-7860 `.outer`/`.innear`, 9908 `.skleton-box`.
// Text styles are built in index.tsx with textStyle(); only boxes live here.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { catalogueMd as C } from '../../theme/ionicMdCatalogue';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  search: { maxHeight: 68, margin: 0, padding: 0, width: '100%' },
  filter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  fullWidth: { width: '100%' },
  // [T] 1825-1826 `.listing.grid-listing { background: #f8f8f8 }` on the ion-content element
  // [T] 5560-5565 `.listing { margin: 16px 0 }` on `.ion-page>ion-content{position:absolute;top:0;height:100%}` (main.css): the
  // margin moves the content down 16 and the page clips its bottom 16 (the height stays 100%; phone pass 2026-11-04)
  content: { backgroundColor: C.gridBg, marginTop: 16, marginBottom: -16 },
  // [T] 1827-1836 `.main-div`: flex wrap, space-between, `padding-top: 0 !important; padding: 16px`, margin-bottom 32
  mainDiv: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 0, paddingHorizontal: 16, paddingBottom: 16, marginBottom: 32 },
  // [T] 1837-1839 `ion-list { width: calc(50% - 8px) !important; margin-bottom: 16px !important }`: a 50% cell with 8px on the inner side
  cellLeft: { width: '50%', paddingRight: 8, marginBottom: 16 },
  cellRight: { width: '50%', paddingLeft: 8, marginBottom: 16 },
  // [T] 5560-5575 `.listing button { border-radius: 6px; background: $white; box-shadow }` (the shadow sits on its own box: the item clips its content)
  shadowBox: { borderRadius: 6, backgroundColor: colors.white, boxShadow: C.gridShadow },
  // [T] 1840-1845 `button { padding: 0 !important; border: 0 !important; margin-bottom: 0 !important }`, `.item-inner { padding: 0 !important }`
  item: { borderRadius: 6, paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0, marginBottom: 0 },
  itemInner: { padding: 0 },
  // [T] 1848-1852 `ion-label { display: block; margin: 0; height: inherit; padding: 0 }`
  label: { flex: 1, overflow: 'hidden' },
  // [T] 1853-1868 `.image-manage { height: 120px; flex centred; padding: 10px 10px 0; overflow: hidden }`, `img { height: 100%; width: auto }`
  imageManage: { height: 120, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 10, paddingHorizontal: 10, paddingBottom: 0, overflow: 'hidden' },
  image: { height: 110, width: '100%' },
  // [T] 1869-1881 `p { font-size: 13px; line-height: normal; color: #333; font-weight: 500; text-align: center; background: #f3f3f3; padding: 6px; margin: 0 }`
  name: { textAlign: 'center', backgroundColor: C.gridNameBg, padding: 6 },
  // [T] 9908-9913 `.skleton-box { width: 100%; height: 135px }` + `.listing button` radius / shadow
  skeleton: { width: '100%', height: 135, borderRadius: 6, backgroundColor: C.skeleton, boxShadow: C.gridShadow, overflow: 'hidden' },
  shimmerBand: { width: 80, height: 135 },
  // [T] 7353-7362 `.nothing-here { height: 80% }` (of the ion-content height, set from the measured layout); 7850-7860 `.outer`/`.innear`: table cell, middle, centred
  nothingHere: { width: '100%' },
  innear: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imgGap: { height: 4 },
  noDataText: { letterSpacing: 1, textAlign: 'center' },
});
