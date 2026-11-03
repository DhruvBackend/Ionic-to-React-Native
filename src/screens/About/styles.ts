// Ported from: src/pages/about/about.scss (empty) + the global rules of src/theme/variables.scss that reach about.html
// Citations: [T] variables.scss line (Ionic source).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 2075-2077 `.about-info { padding: 16px }`
  aboutInfo: { padding: 16 },
  // [T] 2078-2080 `.content { text-align: center }`
  content: { alignItems: 'center' },
  // [T] 2082-2091 `.content p { width: 95%; margin: 0 auto; text-align: center; position: relative }`
  pWrap: { width: '95%' },
  // [T] 2092-2101 `p::before { width: 90px; height: 3px; position: absolute; left: 50%; bottom: -22px; background: #002d25 }`
  // (hardcoded #002d25 equals $primary of the Topbath client: NOTE parity, it follows colors.primary)
  bar: { position: 'absolute', left: '50%', bottom: -22, width: 90, height: 3, marginLeft: -45, backgroundColor: colors.primary },
  // [T] 2101-2102 `.perha { margin: 48px 0 }`
  perha: { marginVertical: 48 },
  // [T] 2104-2108 `.perha ul li { font-size: 14px; line-height: 22px; padding-top: 10px }`
  li: { paddingTop: 10 },
  welcome: { textAlign: 'center' },
  gap: { height: 4 },
});
