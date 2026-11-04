// Ported from: src/pages/scane-pages/scan/scan.scss (empty: `page-scan { }`). No global rule reaches the template (`.scan-bg` is defined nowhere).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1 },
});
