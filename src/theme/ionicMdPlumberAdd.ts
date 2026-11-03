// Values of the PlumberAdd page (plumber-add.html) that come from global rules of src/theme/variables.scss.
// Screens cannot spell hex colours (lint rule). Citations: [T] variables.scss line (Ionic source). NOTE: added for the PlumberAdd screen.
import { colors } from './index';

export const plumberAddMd = {
  // [T] 5181-5203 `.ragistration-fields .upload-document { height: 180px; border: solid 1px #ccc; display: flex; align-items/justify-content: center; overflow: hidden }`
  upload: { height: 180, borderWidth: 1, borderColor: '#ccc' },
  // [T] 5195-5201 `.upload-document p { font-size: 12px; text-align: center; line-height: 16px; color: #002d25 }` + `i { font-size: 24px }`
  uploadText: { fontSize: 12, lineHeight: 16, color: colors.primary, iconSize: 24 },
  // [T] 5215-5236 `.check-box ion-item { background: transparent; padding-left: 0 }` + `ion-checkbox { padding-right: 14px; margin: 0 !important }`
  checkboxPaddingRight: 14,
} as const;
