// Values of the Customeradd page (customeradd.html) that come from global rules of src/theme/variables.scss.
// Citations: [T] variables.scss line (Ionic source). NOTE: added for the Customeradd screen.
import { colors } from './index';

export const customeraddMd = {
  // [T] 677-689 `.resend { width: 100%; text-align: right; padding-right: 16px } .resend a { font-size: 12px; display: inline-block; padding: 6px; margin-top: 10px; background: #002d25; color: $white; border-radius: 5px }`
  resend: { paddingRight: 16, fontSize: 12, padding: 6, marginTop: 10, background: colors.primary, color: colors.white, radius: 5 },
  // [T] 12532 `.opacity { opacity: 0.5 !important }`
  opacity: 0.5,
  // inline style of the Back link: `margin-top: 10px; text-transform: capitalize; padding: 0px`
  backMarginTop: 10,
  // `.eror p { font-size: 12px; margin: 7px 0 !important; text-align: right !important }` (see registrationMd.eror)
} as const;
