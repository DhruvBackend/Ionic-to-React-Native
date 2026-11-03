// Values of the Transaction page (Ionic TransactionPage) that come from Topbath's global src/theme/variables.scss rules reaching
// transaction.html. Citations: [T] = variables.scss line. NEW FILE added by the Transaction port (shared theme dir: the lead may move it).
import { scssColors } from './index';

export const transactionMd = {
  topNavBg: '#F5F7FF', // [T] 3536 .top-nav { background }
  ink: '#000', // [T] 3541, 3547, 12127-12160 colour: #000
  inkMuted: 'rgba(0, 0, 0, 0.6)', // [T] 12132-12141, 12157-12160, 12177-12180 `color: #000; opacity: .6` (text only, so an alpha colour is equal)
  white: scssColors.white, // [T] 12118 $white
  listBorder: 'rgba(167, 166, 166, 0.5)', // [T] 12085 .his-listing border-bottom: 5px solid
  circleBorder: '#254B9C', // [T] 12113 .tr-cicle border
  circleBg: '#083143', // [T] 12114 .tr-cicle background
  danger: scssColors.danger, // [T] 12146, 12204 $danger
  pending: '#FF8431', // [T] 12186 .pending p
  approved: '#1C6A2F', // [T] 12220 .approved p
  received: '#6AC259', // [T] 12238 .received p
  shipped: '#00B5C9', // [T] 12255 .shipped p
  receiveButton: '#6AC259', // [T] 12271 .btn-received button { background: ... !important }
} as const;
