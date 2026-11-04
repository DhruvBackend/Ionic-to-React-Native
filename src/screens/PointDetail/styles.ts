// Ported from: src/pages/points/point-detail/point-detail.scss (empty: `page-point-detail { }`) + the global rules that reach point-detail.html
// Citations: [CSS] the shipped main.css. `.detail-content` has no rule anywhere. Global reset [CSS]:
// `button,h1,h2,h3,h4,h5,h6,input,p,span { margin: 0 !important }`; `h1,h2 { font-weight: 500; line-height: 1.2 }`, `h1 { font-size: 2.6rem }`,
// `h2 { font-size: 2.4rem }`, `img { max-width: 100%; border: 0 }`. Text styles are built in index.tsx with textStyle().
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // html:9 `<div class="detail-content">`: a plain block
  detailContent: {},
  // html:12 an inline <img> on the text baseline: the 14px strut's descent (round(14 * 500 / 2048) = 3) shows below it
  imgGap: { height: 3 },
});
