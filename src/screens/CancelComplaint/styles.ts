// Ported from: src/pages/cancel-complaint/cancel-complaint.scss (empty `page-cancel-complaint {}`) + the global rules of src/theme/variables.scss that
// reach cancel-complaint.html: `.my-module` / `.pop-imge` 4285-4330, `.main-field` 821-1090, `.enquiry-btn` 2419-2506. Text styles are built in
// index.tsx with textStyle(); only boxes live here.
import { StyleSheet } from 'react-native';
import { imageViewerMd } from '../../theme/ionicMdScroll';
import { complaintMd as C } from '../../theme/ionicMdComplaint';

export const styles = StyleSheet.create({
  // ion-content.my-module { background: rgba(0,0,0,.9) !important } + .scroll-content { top: 50%; translateY(-50%) }: centred vertically
  page: { flex: 1, backgroundColor: imageViewerMd.backdrop, justifyContent: 'center' },
  // [T] 4297-4303 `.pop-imge { padding: 0; margin: 13px; position: relative; border-radius: 5px }`
  pop: { margin: 13, padding: 0, position: 'relative', borderRadius: 5 },
  // [T] 821-827 `.main-field { background: #F8FFFC; width: 100%; height: 100%; padding: 16px; position: relative }`
  mainField: { backgroundColor: C.fieldBg, width: '100%', padding: 16, position: 'relative' },
  // [T] 910-912 `.cs-form ion-list { margin: 0 }`
  list: { margin: 0 },
  // [T] 1081-1083 `.cs-textarea { padding-left: 0 }`; [T] 4324-4331 `.pop-imge .main-field .cs-form ion-list ion-item { background: transparent !important }`
  item: { paddingLeft: 0, backgroundColor: 'transparent' },
  // [T] 2419-2423 `.enquiry-btn button { width: 100%; height: 46px }`; 2483-2490 `.enquiry-btn.my-btn button { border: 2px solid #fff; box-shadow; radius 6; bg #31A700 }`
  button: { height: 46, borderWidth: 2, borderColor: C.white, borderRadius: 6, boxShadow: C.buttonShadow },
  // [T] 2424-2430 `.enquiry-btn button span p { font-size: 14px; letter-spacing: 2px; color: $white; font-weight: normal }`
  inner: { paddingRight: 0 },
  floatLabel: { fontSize: 15, paddingLeft: 14, color: C.floatLabel },
  buttonLabel: { fontSize: 14, letterSpacing: 2, color: C.white, fontWeight: '400' },
  // [T] 4311-4328 `.pop-imge a { position: absolute; top: 9px; right: 9px; 30 x 30; background: #d31010; radius 24; flex center }`
  close: {
    position: 'absolute',
    top: imageViewerMd.closeTop,
    right: imageViewerMd.closeRight,
    width: imageViewerMd.closeSize,
    height: imageViewerMd.closeSize,
    borderRadius: imageViewerMd.closeRadius,
    backgroundColor: imageViewerMd.closeColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
