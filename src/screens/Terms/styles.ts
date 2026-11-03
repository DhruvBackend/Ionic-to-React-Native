// Ported from: src/pages/terms/terms.scss (empty) + the global rules of src/theme/variables.scss that reach terms.html
// Citations: [T] variables.scss line (Ionic source). `.conatiner` [T] 12451-12490, `.terms-text` [T] 3960-3968.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { termsMd } from '../../theme/ionicMdTerms';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 12572 `.padding16 { padding: 16px !important }`
  container: { padding: 16 },
  // [T] 12452-12466 `.conatiner .img-box`: width 100%, box-shadow, border 6px solid #fff, radius 10, overflow hidden, display flex, align-items center
  imgBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: colors.white,
    borderRadius: 10,
    overflow: 'hidden',
    boxShadow: termsMd.imgBoxShadow,
  },
  // [T] 3960-3961 `.terms-text { padding: 32px }`; [T] 162 `.pt0 { padding-top: 0 !important }`
  termsText: { paddingTop: 0, paddingRight: 32, paddingBottom: 32, paddingLeft: 32 },
  // [T] 3962-3967 `.terms-text p`: 14px / line-height 24px / #000 / weight 500 (margin 0: `button,h1..h6,input,p,span { margin: 0 !important }`)
  p: { margin: 0 },
});
