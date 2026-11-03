// Values of the Pointtranfer page (pointtranfer.html) that come from global rules of src/theme/variables.scss and from Chrome's
// default <input> look (the page uses bare <input>s, not ion-input). Screens cannot spell hex colours (lint rule).
// Citations: [T] variables.scss line (Ionic source), [D] Chrome user-agent default, [H] inline style in the template.
// NOTE: added for the Pointtranfer screen.
export const pointtranferMd = {
  pageBg: '#f9f9f9', // [H] pointtranfer.html:11 `style="background:#f9f9f9;"`
  inputBorder: '#D4D4D4', // [T] 628 `.input-section .input-adjust input { border: 1px solid #D4D4D4 }`
  ink: '#000', // [D] input text colour (fieldtext)
  placeholder: '#757575', // [D] Chrome ::placeholder
} as const;
