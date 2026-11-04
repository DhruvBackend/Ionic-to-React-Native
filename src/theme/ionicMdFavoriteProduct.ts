// Values of the FavoriteProduct page that the Topbath global SCSS spells as hex colours.
// Citations: [T] = src/theme/variables.scss line (Ionic source).
export const favoriteProductMd = {
  listBorder: '#c9c9c9', // [T] 1962 `.sub-listing.tydo-list ion-list { border: solid 1px #C9C9C9 }`
  price: '#ed3237', // [T] 1938 `.sub-listing .detail h3 { color: #ED3237 }`
  listBackground: '#ffffff', // [T] 2008 `.sub-category ion-list { background: $white !important }`
  text: '#000000', // `.item-md` text colour: h4 inherits it
} as const;
