// Colours of the Topbath login-section pages (mobile-login, otp, select-registration-type): global rules of variables.scss that the
// screens cannot spell as hex (lint rule). Citations: [T] src/theme/variables.scss in the Ionic source, [M] measured in the reference.
export const loginMd = {
  border: '#D4D4D4', // [T] 563, 614, 624 `.text` border-bottom, `.fixed-number` and `input` border
  fixedNumberBg: '#E5EAFF', // [T] 613 `.fixed-number { background }`
  placeholder: '#757575', // Chrome's default ::placeholder colour [M]
  ink: '#000', // [T] 565 `.text p { color }`, body text colour
} as const;

// Registration page (variables.scss `.main-field`, lines 821-851). NOTE: added for the Registration screen (screens cannot spell hex).
export const registrationMd = {
  fieldBackground: '#F8FFFC', // [T] 822 `.main-field { background }`
  fieldPadding: 16, // [T] 825
  h3: { fontSize: 14, lineHeight: 18, marginBottom: 10, ink: '#000', lineBottom: -3, lineHeight3: 3, lineWidthPct: 107, lineRadius: 5 }, // [T] 827-850
  eror: { fontSize: 12, marginVertical: 7 }, // [T] 4595-4601 `.eror p`
  helperMargin10: 10, // `.mb10` / `.mt10`
} as const;
