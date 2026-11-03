// Values of the QuotationGenrateByPdf page that the lint rule keeps out of the screen file (hex colours).
// Citations: [S] src/pages/quotation-genrate-by-pdf/quotation-genrate-by-pdf.scss line (Ionic source). NEW FILE added by the QuotationGenrateByPdf port.
export const quotationMd = {
  cardBackground: '#fff', // [S] 7 `.card-item { background }`
  cardBorder: '#000000', // [S] 8 `border: 1px dashed #000000`
  text: '#000', // [S] 25 `.data-content p { color }`
  strong: '#002d25', // [S] 28 `p strong { color }`
  blockBorder: '#2e5ea2', // [S] 150 `.sprate-block { border: 1px dashed #2e5ea2 }`
  red: '#ff0000', // [S] 170 `.red-text { color: #ff0000 !important }`
} as const;
