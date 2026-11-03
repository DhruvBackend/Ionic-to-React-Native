// Ported from: src/pages/video-category/video-category.scss (empty) + the global rules of src/theme/variables.scss that reach video-category.html
// Citations: [T] variables.scss line (Ionic source).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { catalogueMd } from '../../theme/ionicMdCatalogue';

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
  item: { paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, marginBottom: 16, backgroundColor: colors.white, borderRadius: 6, boxShadow: catalogueMd.gridShadow }, // + [T] 5560-5571 `.listing button { border-radius: 6px; background: #fff; box-shadow: 0 3px 6px #ccc }`
  // [T] 1802 `.item-inner { padding: 0 16px !important }` + [T] 4029-4031 `.list-adjust ... .item-inner { border-bottom: 1px solid #dedede }`
  // (its padding-bottom: 25px loses against the !important shorthand)
  itemInner: { paddingTop: 0, paddingBottom: 0, paddingLeft: 16, paddingRight: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  // [T] 1807-1812 `ion-label { display: flex; align-items: center; justify-content: space-between; margin: 0 -5px 0 0 !important }`
  label: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: 0, marginRight: -5 },
});

// [T] 4036-4038 `ion-label i { color: #002d25 }`: the hardcoded value equals $primary of the Topbath client (NOTE parity: it follows colors.primary)
export const arrowColor = colors.primary;
