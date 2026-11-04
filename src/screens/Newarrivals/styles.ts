// Ported from: src/pages/newarrivals/newarrivals.scss (empty) + the global rules of src/theme/variables.scss that reach the template
// Citations: [T] variables.scss line (Ionic source). The product grid itself lives in ../ProductDetail (shared markup).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { productListMd as P } from '../../theme/ionicMdProductList';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 1825-1827 `.listing.grid-listing { background: #f8f8f8 }` on the ion-content. `.listing { margin: 16px 0 }` applies too (no
  // rule cancels it): `.ion-page>ion-content` is absolute with height 100%, so it moves down 16 and the bottom 16 is clipped
  content: { backgroundColor: P.gridListingBackground, marginTop: 16, marginBottom: -16 },
  // [T] 1827-1836 `.listing.grid-listing .main-div`: flex row wrap, space-between, flex-start; padding 16 (top 0 !important); margin-bottom 32
  mainDiv: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 32,
  },
  // [T] 1917-1922 `.sub-category .sub-listing { display: flex; padding: 16px; flex-wrap: wrap; justify-content: space-between; width: 100% }`; `.p0 { padding: 0 !important }`
  subListing: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 0 },
  // [T] 1960-1971 `.tydo-list .tydo-item`: flex, centred, space-between, width 100%, 2px $primary border, height 120, radius 10, margin-bottom 16
  tydoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderWidth: 2,
    borderColor: colors.primary,
    height: 120,
    borderRadius: 10,
    marginBottom: 16,
  },
  // [T] 1972-1979 `.tydo-item h3`: 17px, black, padding-left 16, bold, letter-spacing 1, width 150, line-height 17 (global h3 margin 0)
  h3: { paddingLeft: 16, letterSpacing: 1, width: 150 },
  // [T] 1980-1983 `h3 span { font-size: 12px; letter-spacing: 0 }`
  h3Span: { letterSpacing: 0 },
  // [T] 1966-1971 `.tydo-item img`: 126 x 118, margin-right -2, 2px $primary border, radius 80px 10px 10px 80px
  banner: {
    height: 118,
    width: 126,
    marginRight: -2,
    borderWidth: 2,
    borderColor: colors.primary,
    borderTopLeftRadius: 80,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 80,
  },
  // html:36 the `<div>` that holds the grid (a flex item of .sub-listing)
  gridWrap: { width: '100%' },
});
