// Values of the ComplaintHistory / ComplaintDetail / CancelComplaint pages (Ionic) that the screens cannot spell as hex (lint rule): the
// global rules of src/theme/variables.scss that reach their templates. [T] = variables.scss line. NEW FILE added by the CustComplaint port.
import { scssColors } from './index';

export const complaintMd = {
  ink: '#000',
  inkSoft: '#1b1b1b', // [T] 2894-2946 .gallery .rating-area p / .ratings p colour
  // ---- ComplaintHistory: [T] 12342-12447 .cs-list
  card: { background: '#fff', shadow: '0px 3px 6px 0px rgba(0, 0, 0, 0.3)', padding: 10, radius: 8, marginBottom: 16 },
  dashed: '#ccc', // [T] 12353 / 12378 border 1px dashed #ccc
  footerBg: '#f4f4f4', // [T] 12380
  badgeBg: '#66ba55', // [T] 12363
  // [T] 4129 / ionic `a { color: $link-color }` (= the primary colour of the $colors map)
  // ---- statuses: [T] 499-516 `.Closed { green }`, `.Pending { #ffc400 }`, `.Reject, .Cancel { $danger }` (all !important)
  closed: 'green',
  pending: '#ffc400',
  cancel: scssColors.danger,
  // ---- ComplaintDetail
  tableShadow: '0px 3px 6px 0px rgba(0, 0, 0, 0.3)', // complaint-detail.scss .basic-table
  rowBorder: 'rgba(238, 238, 238, 0.8)', // complaint-detail.scss `border-bottom: 1px solid #eeec`
  galleryBg: '#D4D4D4', // [T] 2851 .select-img li
  galleryBorder: '#707070', // [T] 2852
  line: '#DEDEDE', // [T] 2890-2895 .rating-area border + .border-box border-bottom
  lineStrong: '#CCC', // [T] 2903 .boxs border-right
  starOff: '#BEBEBE', // [T] 2927
  starOn: '#FDBC0A', // [T] 2938 / 3020
  votes: '#9B9B9B', // [T] 2934
  ratingBg: '#F5F5F5', // [T] 3009 .plumber-rating
  ratingInk: '#9B9B9B', // [T] 3011 .plumber-rating p
  fieldBg: '#F8FFFC', // [T] 822 .main-field
  fieldBorder: '#ccc', // [T] 934
  green: 'green', // [T] 1153 .rupee-btn button
  buttonShadow: '1px 3px 8px 1px rgba(0, 0, 0, 0.2)', // [T] 2467 / 2486
  submit: '#31A700', // [T] 2486 .enquiry-btn.my-btn button
  white: scssColors.white,
  danger: scssColors.danger,
  // ---- CancelComplaint: [T] 4285-4330 .my-module .pop-imge
  floatLabel: '#949494', // [T] 1087 .cs-textarea floating label
} as const;
