// Ported from: src/pages/customerlist/customerlist.scss (empty) + the global rules of src/theme/variables.scss that reach customerlist.html
// Citations: [T] variables.scss line (Ionic source).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 12342-12351 `.cs-list`: white, shadow 0 3px 6px rgba(0,0,0,.3), padding 10, radius 8, margin-bottom 16 (overflow hidden)
  csList: {
    backgroundColor: colors.white,
    boxShadow: '0 3px 6px 0 rgba(0, 0, 0, 0.3)',
    padding: 10,
    overflow: 'hidden',
    borderRadius: 8,
    marginBottom: 16,
  },
  // [T] 12402-12409 `.middle-block { padding: 5px 0 }` + `.pt0 { padding-top: 0 !important }` (12658)
  middleBlock: { paddingTop: 0, paddingBottom: 5 },
  // [T] 12410-12420 `.date-status { display: flex; align-items: center; justify-content: space-between; padding: 5px 0 }`
  dateStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 },
  // [T] 12351-12354 `.top-block { padding-bottom: 5px; border-bottom: 1px dashed #ccc }` + `.no-bodr { border: 0 !important }` (295)
  topBlock: { paddingBottom: 5 },
  // [T] 12387-12421 `.number-block { display: flex; align-items: center; justify-content: space-between }`
  numberBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // `a.dialer ion-icon { font-size: 2rem }` (html root 62.5%: 20px); the anchor's line box holds the 20px inline-block icon
  dialer: { height: 20, justifyContent: 'center' },
});
