// Ported from: src/pages/news/news.scss (empty: `page-news { }`) + the global rules of src/theme/variables.scss / main.css that reach news.html:
// only `.m16 { margin: 16px !important }`. `.glsec .figuree .csr .csl` are defined nowhere; `.thumb` / `.description` only exist nested
// inside other selectors ([T] 7512-9664), so they do not apply here.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // html:9 `<div class="glsec m16">`: margin 16 on every side (inside the ion-content padding: no margin collapse)
  glsec: { margin: 16 },
});
