// Values of the ScanPoint page (Ionic ScanPointPage) that the lint rule keeps out of the screen file (hex colours).
// Citations: [S] src/pages/scan-point/scan-point.scss line (Ionic source, `page-scan-point { ... }`). NEW FILE added by the ScanPoint port.
export const scanPointMd = {
  strongColor: '#342501', // [S] 23 `.left-block span strong`
  ptColor: '#588f00', // [S] 45 `.right-block h2 span` (the "PT" next to the coupon value)
  qrTextSpan: '#43901b', // [S] 100 `.qr-code-data p span`
  headerBorder: '#d7ab52', // [S] 107 `ion-list-header { border-bottom: 2px solid }`
  totalLabel: '#000000', // [S] 112 `.total-points { color: #000000 !important }`
  totalValue: '#d7ab52', // [S] 119 `.total-points span { color }`
  totalUnit: '#43901b', // [S] 125 `.total-points span span { color }`
  fieldsBackground: '#fff', // [S] 133 `.ragistration-fields { background }`
  fieldsShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.2)', // [S] 134
  fieldsBorder: '#D4D4D4', // [S] 136
  errorMsg: '#ff0000', // [S] 310 `p.error-msg { color }`
  deleteIcon: 'red', // scan-point.html:35 / :123 `style="color: red;"`
  ink: '#000', // `.item-md` / content text colour
} as const;
