// Values of the SalesPointTransfer page (sales-point-transfer.html/.scss) that come from the page SCSS, global rules of
// src/theme/variables.scss and Chrome's default <input> look (the page uses a bare <input>, not ion-input). Screens cannot spell hex colours.
// Citations: [P] sales-point-transfer.scss line, [T] variables.scss line (Ionic source), [D] Chrome user-agent default, [H] inline style.
// NOTE: added for the SalesPointTransfer screen.
export const salesPointTransferMd = {
  pageBg: '#f9f9f9', // [H] sales-point-transfer.html:22 `style="background:#f9f9f9;"`
  itemBorder: '#ccc', // [P] 112-115 `.item-md { border: none !important; border: 1px solid #ccc !important }` (the last declaration wins)
  inputBorder: '#D4D4D4', // [T] 628 `.input-section .input-adjust input { border: 1px solid #D4D4D4 }`
  ink: '#000', // [D] input text colour (fieldtext)
  placeholder: '#757575', // [D] Chrome ::placeholder
} as const;
