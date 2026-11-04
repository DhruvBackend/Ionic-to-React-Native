// Ported from: src/pages/enquiry/enquiry.scss (empty) + the global rules of src/theme/variables.scss that reach enquiry.html
// Citations: [T] variables.scss line.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { enquiryMd as E } from '../../theme/ionicMdEnquiry';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 2344-2349 `.enquriy { padding: 16px 32px }`
  enquriy: { paddingVertical: E.padding.vertical, paddingHorizontal: E.padding.horizontal },
  // [T] 2347-2350 `.enquriy p`; `p { margin: 0 !important }` (global)
  p: { fontSize: E.p.fontSize, lineHeight: E.p.lineHeight },
  // [T] 2352-2353 `.enquriy .cs-form ion-list { margin: 0 !important }`
  list: { marginTop: 0, marginBottom: 0 },
  // [T] 2419-2447 `.enquiry-btn.tranparnt-btn button`
  button: { width: '100%', height: E.button.height, borderWidth: E.button.borderWidth, borderColor: E.button.color, boxShadow: 'none' },
  buttonLabel: { fontSize: E.button.fontSize, letterSpacing: E.button.letterSpacing, color: E.button.color },
});
