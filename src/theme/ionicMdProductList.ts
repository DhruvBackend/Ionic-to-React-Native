// Colours of the product-grid pages (ProductDetail, Newarrivals) that screens cannot spell as hex (lint rule).
// Citations: [T] src/theme/variables.scss in the Ionic source. NOTE: added for the ProductDetail / Newarrivals screens.
export const productListMd = {
  // [T] 4696-4697 `.product-data { background: #fff; border: 1px solid #f0f0f0 }`
  cardBackground: '#ffffff',
  cardBorder: '#f0f0f0',
  // [T] 4701 `.product-data { box-shadow: 0px 3px 6px 0px rgba(0, 0, 0, 0.1) }`
  cardShadow: '0px 3px 6px 0px rgba(0, 0, 0, 0.1)',
  // [T] 4770 `.two-column .image-thubmnail { border-bottom: 1px solid #e5e5e5 }`
  imageDivider: '#e5e5e5',
  // [T] 4781 `.two-column .image-thubmnail i { color: #979797 }`
  placeholderIcon: '#979797',
  // [T] 4743 `.product-data .content h6 { color: #1e1d1b }`
  name: '#1e1d1b',
  // body text colour of ion-content (the Ionic theme's text colour), inherited by the code span
  bodyText: '#000000',
  // [T] 1826 `.listing.grid-listing { background: #f8f8f8 }`
  gridListingBackground: '#f8f8f8',
  // [T] 1957 `.tydo-list .tydo-item h3 { color: $black-clr }`
  tydoText: '#000000',
} as const;
