// Ported from: src/pages/sales-exec-add-seller/sales-exec-add-seller.scss (`ion-item { --inner-padding-end }` is a no-op in Ionic 3)
// + the global rules of src/theme/variables.scss that reach sales-exec-add-seller.html. Citations: [T] variables.scss line.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { registrationMd as R } from '../../theme/ionicMdLogin';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 821-827 `.main-field { background; padding: 16px }`
  mainField: { backgroundColor: R.fieldBackground, padding: R.fieldPadding },
  // [T] 827-851 `.main-field h3` (see Registration)
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
  erorText: { textAlign: 'right' },
  // [T] 910-912 `.main-field .cs-form ion-list { margin: 0 }` (explicit sides: a shorthand does not override the kit's own margins)
  list: { marginTop: 0, marginBottom: 0 },
  // html:96 `class="cs-btn mb50"`, outside .main-field
  button: { marginBottom: 50 },
});
