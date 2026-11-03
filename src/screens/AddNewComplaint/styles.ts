// Ported from: src/pages/complaints/add-new-complaint/add-new-complaint.scss (empty) + the global rules of src/theme/variables.scss
// that reach add-new-complaint.html. Citations: [T] variables.scss line.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { addNewComplaintMd as A } from '../../theme/ionicMdAddNewComplaint';
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
  // `.cs-heading1.pl0.pb10`
  heading: { paddingTop: A.headingPaddingTop, paddingBottom: A.headingPaddingBottom },
  headingText: { fontStyle: 'italic', textTransform: 'uppercase' },
  // `.add-new.padding0 > .uplode-image > ul`: inline-block tiles that wrap
  tiles: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
  tile: {
    width: A.tile.size,
    height: A.tile.size,
    borderRadius: A.tile.radius,
    overflow: 'hidden',
    backgroundColor: A.tile.background,
    marginHorizontal: A.tile.marginHorizontal,
    marginBottom: A.tile.marginBottom + A.tileRowGap,
  },
  tileImage: { width: '100%', height: '100%' }, // `img { width: 100%; height: 100% }` stretches
  removeButton: {
    position: 'absolute',
    zIndex: 99,
    top: 0,
    right: A.removeButton.right,
    width: A.removeButton.size,
    height: A.removeButton.size,
    borderRadius: 100,
    backgroundColor: A.removeButton.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraLabel: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  // `.enquiry-btn.add-btns.mt20 button.h40`
  submitWrap: { marginTop: A.submitMarginTop },
  submit: { height: A.submitHeight, borderRadius: 0, boxShadow: 'none' },
  submitLabel: { fontSize: A.submitFontSize, letterSpacing: A.submitLetterSpacing },
});
