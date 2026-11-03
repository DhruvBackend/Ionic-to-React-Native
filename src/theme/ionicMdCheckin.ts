// Values of the PlumberCheckin / TaskClose pages (Ionic) that the screens cannot spell as hex (lint rule): page SCSS and the global rules of
// src/theme/variables.scss that reach their templates. [T] = variables.scss line. NEW FILE added by the Checkin port.
import { scssColors } from './index';

export const checkinMd = {
  // plumber-checkin.scss `.bodr-botm { border-bottom: 1px solid #ccc }`
  listBorder: '#ccc',
  // [T] 4393-4412 `.data-not p { font-size: 16px; color: #3e53a2; font-style: italic; line-height: 20px; letter-spacing: .5px }`, `img { height: 100px }`
  dataNot: { ink: '#3e53a2', fontSize: 16, lineHeight: 20, letterSpacing: 0.5, imageHeight: 100, viewportOffset: 50 },
  // task-close.scss `.upload-document { background: #002d25; 100 x 100; radius 16; margin-top 10; color: white }`
  upload: { background: '#002d25', size: 100, radius: 16, marginTop: 10, ink: scssColors.white },
  // [T] 2419-2481 `.enquiry-btn button` + `.task-btn button` (margin 0 !important from task-close.scss)
  submitShadow: '1px 3px 8px 1px rgba(0, 0, 0, 0.2)',
  white: scssColors.white,
} as const;
