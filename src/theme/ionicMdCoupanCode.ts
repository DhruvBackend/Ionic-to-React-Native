// Values of the CoupanCode page (coupan-code.html) that come from global rules of src/theme/variables.scss and from Chrome's
// default <input> look (the page uses a bare <input>, not ion-input). Screens cannot spell hex colours (lint rule).
// Citations: [T] variables.scss line (Ionic source), [D] Chrome user-agent default (not measured in the reference build:
// the lead should compare the first capture). NOTE: added for the CoupanCode screen.
export const coupanCodeMd = {
  ink: '#000', // body text colour (ion-content), `.paragraph p { color: #000 }` [T] 1765
  paragraphBg: '#F6F6F6', // [T] 1759 `.paragraph { background }`
  inputBorder: '#767676', // [D] default text field border (2px inset renders as a 1px #767676 line with a 2px radius)
  inputRadius: 2, // [D]
  placeholder: '#757575', // [D] Chrome ::placeholder
} as const;
