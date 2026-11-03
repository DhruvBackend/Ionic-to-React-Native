// Values of the MyCamplaints page (Ionic MyCamplaintsPage) that the screen cannot spell as hex (lint rule): the global `.plumber-cam` rules of
// src/theme/variables.scss 4059-4127 (+ `a.phone-call` 4129-4144, `.add` 4146-4184, `.serach-filter` 4446). [T] = variables.scss line.
// NEW FILE added by the PlumberFlow port.
import { scssColors } from './index';
import { pulmberDetailMd } from './ionicMdPulmberCustomerDetail';

export const myComplaintsMd = {
  ...pulmberDetailMd,
  boxBorder: '#FF7171', // [T] 4066 .box border-bottom
  boxShadow: '0px 0px 5px 0px rgba(0, 0, 0, 0.2)', // [T] 4067
  alphabetBg: scssColors.tertiary, // [T] 4072 span.alphabet background: $tertiary
} as const;
