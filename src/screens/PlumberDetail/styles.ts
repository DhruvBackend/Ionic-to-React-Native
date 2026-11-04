// Ported from: src/pages/plumber-detail/plumber-detail.scss + the global rules of src/theme/variables.scss that reach plumber-detail.html
// Citations: [T] variables.scss line, [S] plumber-detail.scss line. The profile card reuses the Profile screen's styles (same global rules).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { plumberDetailMd as P } from '../../theme/ionicMdPlumber';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] `.pt16 { padding-top: 16px !important }` (beats `.profile { padding-top: 0 }`)
  pt16: { paddingTop: 16 },
  capitalize: { textTransform: 'capitalize' },
  // [T] 3152-3180 `.document-section h4 { padding-bottom: 10px }`, `.document-info h3 { padding-bottom: 2px }`
  pb10: { paddingBottom: 10 },
  pb2: { paddingBottom: 2 },
  // html:71 `.heading.line.mt18.mb10`: `.mt18 { margin-top: 18px !important }`, `.mb10 { margin-bottom: 10px !important }` (`.heading` / `.line` have no rule)
  // its 18px top margin collapses with .profile-detail's 10px bottom margin (block siblings): 18 in total, so RN adds 8
  heading: { marginTop: 8, marginBottom: 10 },
  // [S] 3-8 `.adhar`: white, radius 10, shadow 0 3px 6px rgba(0,0,0,.3), margin-bottom 10
  adhar: {
    backgroundColor: colors.white,
    borderRadius: 10,
    boxShadow: '0 3px 6px 0 rgba(0, 0, 0, 0.3)',
    marginBottom: 10,
  },
  // [S] 17-19 `tr { border-bottom: 1px solid #f5f5f5 }` (`&:last-child { border-bottom: 0 }`)
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: P.rowBorder },
  trLast: { borderBottomWidth: 0 },
  // [S] 21-30 `th, td { padding: 10px 5px; font-size: 12px }`; th width 160 (table-layout: fixed), top-aligned, left; td padding-left 10
  th: { width: 160, paddingVertical: 10, paddingHorizontal: 5 },
  td: { flex: 1, paddingTop: 10, paddingRight: 5, paddingBottom: 10, paddingLeft: 10 },
});
