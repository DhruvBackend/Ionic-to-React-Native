// Ported from: src/pages/plumber-checkin/plumber-checkin.scss + the global rules of src/theme/variables.scss that reach plumber-checkin.html
// (`.data-not` 4393-4412). Citations: [T] variables.scss line. Text styles are built in index.tsx with textStyle(); only boxes live here.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { checkinMd as C } from '../../theme/ionicMdCheckin';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // plumber-checkin.scss `.bodr-botm { border-bottom: 1px solid #ccc; margin: 0 }`
  list: { marginTop: 0, marginBottom: 0, borderBottomWidth: 1, borderBottomColor: C.listBorder },
  // [T] 4393-4402 `.data-not { width: 100%; height: calc(100% - 50px); display: flex; align-items/justify-content: center; column }`;
  // the height is set from the content's measured height in index.tsx
  dataNot: { width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
  dataNotText: { fontStyle: 'italic', letterSpacing: C.dataNot.letterSpacing },
});
