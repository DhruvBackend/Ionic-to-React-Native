// Ported from: src/pages/edit-profile/edit-profile.scss (empty) + the global rules of src/theme/variables.scss that reach edit-profile.html
// Citations: [T] variables.scss line.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { plumberAddMd as P } from '../../theme/ionicMdPlumberAdd';
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
  // [T] 5215-5236 `.check-box ion-item`: transparent, padding-left 0; the kit puts 4px before a checkbox and 36px after it, `ion-checkbox
  // { margin: 0 !important; padding-right: 14px }` takes those away: the item is moved 4px left and the label pulled back by 22px.
  checkItem: { paddingLeft: 0, marginLeft: -4, backgroundColor: 'transparent' },
  checkItemInner: { borderBottomWidth: 0 },
  checkLabel: { marginLeft: -(36 - P.checkboxPaddingRight) },
  // [T] 5181-5203 `.upload-document`
  upload: {
    height: P.upload.height,
    borderWidth: P.upload.borderWidth,
    borderColor: P.upload.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadP: { textAlign: 'center' },
  uploadPrompt: { alignItems: 'center' },
});
