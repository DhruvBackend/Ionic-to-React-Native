// Values of src/pages/sales-exec-home/sales-exec-home.scss (colours not in the theme) + the global rules that reach its template.
export const salesExecHomeMd = {
  // [S] `.company-logo img { height: 36px; margin-left: 12px }` (beats the global 40px, the global 10px 16px padding stays)
  logo: { imgHeight: 36, marginLeft: 12 },
  card: { background: '#fff', radius: 8, shadow: '0px 1px 3px 0px rgba(0, 0, 0, 0.06)' },
  greet: { marginTop: 12, marginHorizontal: 16, paddingVertical: 14, paddingHorizontal: 16, titleSize: 17, titleColor: '#2c3e50', subSize: 13, subColor: '#888' },
  points: { marginVertical: 14, marginHorizontal: 16, padding: 16, labelSize: 13, labelColor: '#888', valueSize: 28, valueColor: '#f39c12', iconSize: 36, iconOpacity: 0.6 },
  mr10Extra: 8, // `.mr10 { margin-right: 10px !important }` on ion-buttons (margin 0 .2rem leaves 2px)
} as const;
