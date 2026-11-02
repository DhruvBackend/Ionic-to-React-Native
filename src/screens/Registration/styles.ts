// Ported from: src/pages/login-section/registration/registration.scss (+ the global rules of src/theme/variables.scss that reach registration.html)
// Citations: [T] variables.scss line, [M] measured in the Ionic reference build (parity/out/ref/Registration.plumber.png, Chrome 360x800).
import { StyleSheet } from 'react-native';
import { colors, scssColors } from '../../theme';
import { registrationMd as R } from '../../theme/ionicMdLogin';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 821-827 `.main-field { background; padding: 16px }`
  mainField: { backgroundColor: R.fieldBackground, padding: R.fieldPadding },
  // [T] 827-851 `.main-field h3`: 14px, #000, margin-bottom 10, line-height 18, width fit-content, capitalize, ::after underline
  h3: { alignSelf: 'flex-start' },
  h3Text: { color: R.h3.ink, textTransform: 'capitalize' },
  h3Line: {
    position: 'absolute',
    bottom: R.h3.lineBottom,
    left: 0,
    height: R.h3.lineHeight3,
    borderRadius: R.h3.lineRadius,
    backgroundColor: colors.primary,
  },
  // [T] 4595-4601 `.eror p { font-size: 12px; color: $danger; margin: 7px 0 !important; text-align: right !important }`
  erorText: { textAlign: 'right', color: scssColors.danger },
  list: { marginTop: 0, marginBottom: 0 }, // .main-field .cs-form ion-list { margin: 0 }
  updateButton: { marginBottom: 50 }, // class="cs-btn mb50"
});
