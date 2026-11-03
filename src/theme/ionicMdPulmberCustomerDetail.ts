// Values of the PulmberCustomerDetail page (Ionic PulmberCustomerDetailPage) that the screen cannot spell as hex (lint rule): the global rules
// of src/theme/variables.scss that reach its template (`.lists` 2729-2835, `.new-remark` 5068-5111, `.customer-ratings` 4414-4442,
// `a.phone-call` 4129-4144, `.add` 4146-4184). [T] = variables.scss line. NEW FILE added by the PlumberFlow port.
import { complaintMd as C } from './ionicMdComplaint';

export const pulmberDetailMd = {
  ...C,
  nameColor: '#393F58', // [T] 2764 .lists .pumber-name .name h4
  phoneBlue: '#4A6AFB', // [T] 2769 .name p
  alphabetBg: '#002d25', // [T] 2740 .lists .pumber-name span.alphabet
  callGreen: '#09b126', // [T] 4140 a.phone-call i
  listShadow: '0px 3px 7px 0px rgba(0, 0, 0, 0.2)', // [T] 2732 .lists box-shadow
  line: '#ccc', // [T] 5069 .new-remark border / 5077 .timing border-bottom / 5091 .content border / 4417 .customer-ratings border
  detailBg: '#f7f7f7', // [T] 5094 .new-remark .content background
} as const;
