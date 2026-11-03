// Values of the PointHistory page (Ionic PointHistoryPage) that the screen cannot spell as hex (lint rule): point-history.scss and the
// global `.transaction-list` rules of src/theme/variables.scss. [P] = src/pages/point-history/point-history.scss line,
// [T] = src/theme/variables.scss line. NEW FILE added by the PointHistory port.
import { scssColors } from './index';

export const pointHistoryMd = {
  ink: '#000', // [T] 12127-12160 colour: #000, [P] 38 .date_color
  inkMuted: 'rgba(0, 0, 0, 0.6)', // [P] 38-40 `.date_color { color: #000; opacity: .6 }` and [T] 12177-12180 (text only, so an alpha colour is equal)
  rowBorder: 'rgba(0, 0, 0, 0.478)', // [P] 13 `.full_width { border-bottom: 1px solid #0000007a }` and 29 `.border-bottom { ... #0000007a !important }` (0x7a = 122/255)
  staticPoint: '#808080', // [P] 45 `.static_point { color: grey }`
  white: scssColors.white, // [T] 12118 $white
  circleBorder: '#254B9C', // [T] 12113 .tr-cicle border
  circleBg: '#083143', // [T] 12114 .tr-cicle background
  danger: scssColors.danger, // [T] 12146, 12204 $danger
  pending: '#FF8431', // [T] 12186 .pending p
  approved: '#1C6A2F', // [T] 12220 .approved p
  received: '#6AC259', // [T] 12238 .received p
  shipped: '#00B5C9', // [T] 12255 .shipped p
} as const;
