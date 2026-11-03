// Ported from: src/pages/customeradd/customeradd.scss (empty) + the global rules of src/theme/variables.scss that reach customeradd.html
// Citations: [T] variables.scss line.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { customeraddMd as C } from '../../theme/ionicMdCustomeradd';
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
  list: { marginTop: 0, marginBottom: 0 }, // .main-field .cs-form ion-list { margin: 0 }
  back: { alignSelf: 'flex-start' },
  otpItem: { marginTop: 16, marginBottom: 16 }, // .cs-input { margin: 16px 0 }
  // inline style of the Back link: `margin-top: 10px; padding: 0px`
  backButton: { marginTop: C.backMarginTop, paddingHorizontal: 0, paddingVertical: 0 },
  // [T] 677-689 `.resend { width: 100%; text-align: right; padding-right: 16px }`
  resend: { alignItems: 'flex-end', paddingRight: C.resend.paddingRight },
  resendDim: { opacity: C.opacity }, // `.opacity`
  // `.resend a`: inline-block, padding 6, margin-top 10, background #002d25, radius 5
  resendA: { padding: C.resend.padding, marginTop: C.resend.marginTop, backgroundColor: C.resend.background, borderRadius: C.resend.radius },
  button: { marginBottom: 50 }, // class="cs-btn mb50"
});
