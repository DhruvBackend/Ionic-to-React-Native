// Ported from: src/pages/search/search.scss (every rule is commented out) + the global rules that reach search.html
// Citations: [CSS] the shipped main.css (`.listing`, `.nothing`, `.outer`/`.innear`, `.mt64`, `.dflex`, h1 and `p` rules).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { normalLineHeight } from '../../theme/ionicMdOverlays';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // `ion-title` > `.toolbar-title { flex: 1; padding: 0 12px }` holding the ion-input
  title: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  // [CSS] `.listing { margin: 16px 0; padding: 0 16px }` + `.listing ion-list { margin: 0 }` (margins collapse through the empty list, see index.tsx)
  listing: { marginTop: 16, paddingHorizontal: 16 },
  listingFilled: { marginBottom: 16 },
  list: { marginTop: 0, marginBottom: 0 },
  // [CSS] `.nothing { height: 100% }` (set in index.tsx), `.outer { display: table; height: 100% }`, `.innear { display: table-cell; vertical-align: middle; text-align: center }`
  nothing: { justifyContent: 'center' },
  // [CSS] `.nothing img { height: 100px }` (the image is a 404: a 0 x 100 box) + the ~4px inline gap
  nothingImg: { height: 104 },
  // [CSS] `.nothing p { font-size: 12px; color: #000; padding: 10px 16px !important; text-transform: capitalize; letter-spacing: 1px }`
  nothingText: { alignSelf: 'stretch', textAlign: 'center', paddingVertical: 10, paddingHorizontal: 16, letterSpacing: 1, textTransform: 'capitalize' },
  // `.bg` has the `padding` attribute twice: 16px all round; no `.bg` rule (the page SCSS is commented out)
  bg: { padding: 16 },
  // `h1 { font-size: 2.6rem; font-weight: 500; line-height: 1.2 }`, global `h1 { margin: 0 !important }`; the cell centres its text
  h1: { alignSelf: 'stretch', textAlign: 'center' },
  // `<img class="csicon">`: a 404 with alt="" and no rule for .csicon: a 0 x 0 inline box that still makes one line box (strut) between h1 and the button
  csiconStrut: { height: normalLineHeight(14) },
  // [CSS] `.dflex { display: flex !important }`, `.mt64 { margin-top: 64px !important }`
  dflexMt64: { flexDirection: 'row', marginTop: 64 },
});
