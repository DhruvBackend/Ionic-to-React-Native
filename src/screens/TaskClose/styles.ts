// Ported from: src/pages/task-close/task-close.scss + the global rules of src/theme/variables.scss that reach task-close.html
// (`.enquiry-btn` / `.task-btn` 2419-2481, `.green-color` 419). Citations: [T] variables.scss line. Text styles are built in index.tsx with
// textStyle(); only boxes live here.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { checkinMd as C } from '../../theme/ionicMdCheckin';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // task-close.scss `.form-block { padding: 0 16px }`
  formBlock: { paddingHorizontal: 16 },
  // task-close.scss `.form-block ion-item { padding-left: 0 }`
  item: { paddingLeft: 0 },
  label: { fontSize: 14 },
  otpInput: { height: 35, textAlignVertical: 'top' },
  // task-close.scss `.upload-document`: 100 x 100, #002d25, flex centred, radius 16, margin-top 10, text-align centre
  upload: {
    height: C.upload.size,
    width: C.upload.size,
    backgroundColor: C.upload.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: C.upload.radius,
    marginTop: C.upload.marginTop,
  },
  uploadPrompt: { alignItems: 'center' },
  uploadP: { textAlign: 'center' },
  // `img { height: 100%; object-fit: contain }`: the width follows the natural ratio (see index.tsx)
  uploadImage: { height: C.upload.size },
  // `.enquiry-btn.task-btn` (display: flex; width 100%) with the inline `style="padding: 16px"`
  taskBtn: { flexDirection: 'row', width: '100%', padding: 16 },
  // [T] 2419-2423 `.enquiry-btn button { width: 100%; height: 46px }` + 2463-2481 `.task-btn button` (border 2 white, shadow, radius 6) + task-close.scss `margin: 0 !important`
  button: { flex: 1, height: 46, borderWidth: 2, borderColor: C.white, borderRadius: 6, boxShadow: C.submitShadow },
  // [T] 2424-2430 `.enquiry-btn button span p { font-size: 14px; letter-spacing: 2px; color: $white; font-weight: normal }`
  buttonLabel: { fontSize: 14, letterSpacing: 2, color: C.white, fontWeight: '400' },
});
