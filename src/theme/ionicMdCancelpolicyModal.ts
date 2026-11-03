// Colours of the CancelpolicyModal page (cancelpolicy-modal.html): global rules of variables.scss and cancelpolicy-modal.scss that the screen
// cannot spell as hex (lint rule). Citations: [T] src/theme/variables.scss, [S] src/pages/cancelpolicy-modal/cancelpolicy-modal.scss.
// NOTE: added for the CancelpolicyModal screen.
export const cancelpolicyModalMd = {
  // [S] 14 `ion-content.popup-modal { background: rgba(0, 0, 0, 0.5) !important }` (drawn over the white modal wrapper)
  contentBackground: 'rgba(0, 0, 0, 0.5)',
  // [T] 3881-3883 `.modal-content { background: #fff !important; box-shadow: 0px 3px 16px 0px #545454 }`
  boxShadow: '0px 3px 16px 0px #545454',
  // [T] 3896-3897 `.modal-content .number-content { background: #F6F6F6 !important }`
  numberContentBackground: '#F6F6F6',
  // [T] 598-611 `.input-section .input-adjust input { border: 1px solid #D4D4D4 }`
  inputBorder: '#D4D4D4',
  // [T] 648-654 `.input-section .input-adjust textarea { border: 1px solid #ccc }`
  textareaBorder: '#ccc',
  // Chrome's default ::placeholder colour (same as loginMd.placeholder)
  placeholder: '#757575',
  // [T] 3922-3925 `.check-bx p a { color: #000ED9; text-decoration: underline }`
  linkColor: '#000ED9',
  // Chrome's default colour of a native <button> (buttontext) and of the page text (`p`): black
  ink: '#000',
} as const;

// Native <button> in Chrome: UA `button:disabled { color: rgba(16, 16, 16, 0.3) }`, then Ionic's `button[disabled] { opacity: .4 }`
export const disabledButtonInk = 'rgba(16, 16, 16, 0.3)';
