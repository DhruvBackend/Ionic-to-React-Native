// Colours of the ProductSubdetail page (product-subdetail.html/.scss + variables.scss) that the screen cannot spell as hex (lint rule).
// Citations: [T] src/theme/variables.scss, [S] product-subdetail.scss in the Ionic source. NOTE: added for the ProductSubdetail screen.
export const productSubdetailMd = {
  // [T] 2192-2197 `.detais .detail-prize h4 { color: #000 }`
  title: '#000000',
  // [T] 2199-2203 `.detais .detail-prize h3 { color: #ED3237 }`
  price: '#ED3237',
  // html:29 `style="color: #c3c3c3"` (perm_media placeholder icon)
  placeholderIcon: '#c3c3c3',
  // [S] 3-8 `.adhar { background: #fff; border: 1px solid #f0efef }`
  cardBorder: '#f0efef',
  // [S] 15 `tr { border-bottom: 1px solid #f5f5f5 }`
  rowBorder: '#f5f5f5',
  // [S] 24-26 `th { background: #002d25; color: #ffffff }`
  thBackground: '#002d25',
  thText: '#ffffff',
  // td text: the body colour (ion-content text, #000 in the Ionic theme)
  tdText: '#000000',
} as const;
