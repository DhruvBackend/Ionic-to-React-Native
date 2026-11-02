// Colours of the Topbath login-section pages (mobile-login, otp, select-registration-type): global rules of variables.scss that the
// screens cannot spell as hex (lint rule). Citations: [T] src/theme/variables.scss in the Ionic source, [M] measured in the reference.
export const loginMd = {
  border: '#D4D4D4', // [T] 563, 614, 624 `.text` border-bottom, `.fixed-number` and `input` border
  fixedNumberBg: '#E5EAFF', // [T] 613 `.fixed-number { background }`
  placeholder: '#757575', // Chrome's default ::placeholder colour [M]
  ink: '#000', // [T] 565 `.text p { color }`, body text colour
} as const;
