// Ported from: src/pages/retailer-add-complaint/retailer-add-complaint.scss (empty) + the global rules of src/theme/variables.scss
// that reach retailer-add-complaint.html. Citations: [T] variables.scss line.
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
  list: { marginTop: 0, marginBottom: 0 }, // .main-field .cs-form ion-list { margin: 0 }
  // [T] 223 `.h100 { height: 100px !important }`
  h100: { height: 100 },
});
