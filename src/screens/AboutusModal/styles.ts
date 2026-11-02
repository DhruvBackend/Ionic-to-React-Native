// Ported from: src/pages/aboutus-modal/aboutus-modal.scss + the global `.main-modal` rules of src/theme/variables.scss:4234-4283.
// Citations: [T] variables.scss line, [CSS] compiled main.css, [M] measured in the Ionic reference (parity/out/ref/AboutusModal.default.png,
// Chrome 360x800: box x 48..312, y 310..582).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { loginMd } from '../../theme/ionicMdLogin';
import { fontFor } from '../../theme/typography';

export const styles = StyleSheet.create({
  // white app background under the translucent ion-content: 0.6 black over white shows #666
  screen: { flex: 1, backgroundColor: colors.white },
  // aboutus-modal.scss: `ion-content { background: rgba(0,0,0,0.6) !important }`
  content: { backgroundColor: 'rgba(0,0,0,0.6)' },

  // [T] 4234-4239 `.main-modal`: height 100vh (set at run time), flex centre, position relative
  mainModal: { alignItems: 'center', justifyContent: 'center' },
  // [T] 4240-4244 `.modal-box`: margin 32, padding 16, radius 10, white. Width = viewport - padding 32 - margin 64 ([M] 264).
  modalBox: { alignSelf: 'stretch', margin: 32, padding: 16, borderRadius: 10, backgroundColor: colors.white },
  // [T] 4245-4249 `h1`: 16px, #000, margin-bottom 8 !important, weight 500 [CSS], line-height 1.2 [CSS] ([M] no top margin)
  h1: { includeFontPadding: false, fontSize: 16, lineHeight: 19.2, color: loginMd.ink, marginBottom: 8, ...fontFor(500) },
  // [T] 4250-4256 `h2`: 14px, #000, margin-bottom 16, line-height 28, weight initial (400)
  h2: { includeFontPadding: false, fontSize: 14, lineHeight: 28, color: loginMd.ink, marginBottom: 16, ...fontFor(400) },
  // `a`: Ionic link colour = primary, UA underline
  link: { color: colors.primary, textDecorationLine: 'underline' },

  // [T] 4270-4282 `.modal-cls`: absolute, bottom 54, white circle, flex centre; the wrapper only centres it horizontally (static position)
  modalClsWrap: { position: 'absolute', left: 0, right: 0, bottom: 54, alignItems: 'center' },
  modalCls: { backgroundColor: colors.white, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
});
