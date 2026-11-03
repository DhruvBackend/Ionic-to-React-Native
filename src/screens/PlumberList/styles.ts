// Ported from: src/pages/plumber-list/plumber-list.scss (empty) + the global rules of src/theme/variables.scss that reach plumber-list.html
// Citations: [T] variables.scss line (Ionic source).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { plumberMd as P } from '../../theme/ionicMdPlumber';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 2631-2632 `.main-history { padding: 16px }` + `.padding0 { padding: 0 !important }`
  mainHistory: { padding: 0 },
  // [T] 12342-12351 `.cs-list`: white, shadow 0 3px 6px rgba(0,0,0,.3), padding 10, radius 8, margin-bottom 16 (overflow hidden)
  csList: {
    backgroundColor: colors.white,
    boxShadow: '0 3px 6px 0 rgba(0, 0, 0, 0.3)',
    padding: 10,
    overflow: 'hidden',
    borderRadius: 8,
    marginBottom: 16,
  },
  // [T] `.cs-list:last-child { margin-bottom: 0 }` (the empty-state div is an ngIf comment while the list is shown)
  csListLast: { marginBottom: 0 },
  // [T] 12402-12409 `.middle-block { padding: 5px 0 }` + `.pt0 { padding-top: 0 !important }` (12658)
  middleBlock: { paddingTop: 0, paddingBottom: 5 },
  // plumber-list.html:61 inline `border-top:1px solid #f0f0f0; padding-top:6px`
  // NOTE (parity): `.pt0 { padding-top: 0 !important }` beats the inline `padding-top: 6px`, so the 6px never applies.
  middleBlockFoot: { paddingTop: 0, paddingBottom: 5, borderTopWidth: 1, borderTopColor: P.divider },
  // [T] 12410-12420 `.date-status { display: flex; align-items: center; justify-content: space-between; padding: 5px 0 }`
  dateStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 },
  dateCell: { flexShrink: 1 },
  // [T] 12351-12354 `.top-block { padding-bottom: 5px }` + `.no-bodr { border: 0 !important }` (295)
  topBlock: { paddingBottom: 5 },
  // [T] 12387-12421 `.number-block { display: flex; align-items: center; justify-content: space-between }`
  numberBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // `a.dialer ion-icon { font-size: 2rem }` (html root 62.5%: 20px); the anchor's line box holds the 20px inline-block icon
  dialer: { height: 20, justifyContent: 'center' },
  // [T] 4393-4411 `.data-not { width: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column }`
  // NOTE (parity): `height: calc(100% - 50px)` resolves to auto (the parent `.main-history` has no fixed height): the 100px image only.
  dataNot: { width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
});
