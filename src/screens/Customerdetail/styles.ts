// Ported from: src/pages/customerdetail/customerdetail.scss (empty) + the global rules of src/theme/variables.scss that reach customerdetail.html
// Citations: [T] variables.scss line. The Basic Details block reuses the Profile screen's `.profile` / `.rating-area` styles (same global rules).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] `.pt16 { padding-top: 16px !important }` (beats `.profile { padding-top: 0 }`)
  pt16: { paddingTop: 16 },
  // [T] 2631-2632 `.main-history { padding: 16px }` (the Complaint list; no padding0 here)
  mainHistory: { padding: 16 },
  // [T] 12342-12351 `.cs-list`: white, shadow 0 3px 6px rgba(0,0,0,.3), padding 10, radius 8, margin-bottom 16 (overflow hidden)
  csList: {
    backgroundColor: colors.white,
    boxShadow: '0 3px 6px 0 rgba(0, 0, 0, 0.3)',
    padding: 10,
    overflow: 'hidden',
    borderRadius: 8,
    marginBottom: 16,
  },
});
