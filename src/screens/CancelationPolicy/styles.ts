// Ported from: src/pages/cancelation-policy/cancelation-policy.scss (+ the global rules of src/theme/variables.scss that reach the template)
// Citations: [T] variables.scss line. [CSS] = shipped main.css (rules split on "}", numbering as in src/theme/ionicMdPage.ts).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 3990-3994 `.header-icons { position: absolute; top: 10px; right: 0 }` (against the navbar box)
  headerIcons: { position: 'absolute', top: 10, right: 0, zIndex: 1 },
  // [T] 3996-4001 `button.cs-hdr-icons`: transparent, no radius / shadow, `padding: 0 !important`; `.mr16 { margin-right: 16px !important }`
  // ([CSS] 6xxx) beats the global `button { margin: 0 !important }` on specificity.
  hdrIconButton: { borderRadius: 0, boxShadow: 'none', paddingHorizontal: 0, paddingVertical: 0, marginRight: 16 },
});
