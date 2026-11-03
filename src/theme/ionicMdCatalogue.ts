// Values of the Category / SubCategory / Products pages that the Topbath global SCSS spells as hex colours.
// Citations: [T] = src/theme/variables.scss line (Ionic source).
export const catalogueMd = {
  ink: '#000', // ion-content text colour ($text-color): the perm_media icon
  cardBorder: '#f0f0f0', // [T] 4698 / 4711 `.product-data` / `.image-thubmnail` border
  cardShadow: '0px 3px 6px 0px rgba(0, 0, 0, 0.1)', // [T] 4699 / 4712 box-shadow
  title: '#1e1d1b', // [T] 4742 `.product-data .content h6` colour
  gridBg: '#f8f8f8', // [T] 1826 `.listing.grid-listing` background
  gridShadow: '0px 3px 6px 0px #ccc', // [T] 5560-5575 `.listing button` box-shadow
  gridName: '#333333', // [T] 1865 `.image-manage ~ p` colour
  gridNameBg: '#f3f3f3', // [T] 1869 background
  skeleton: '#ddd', // [T] 9908 `.skleton-box` (the animated gradient starts and ends with #ddd)
  skeletonShine: '#e8e8e8', // [T] 9909 gradient middle stop
  noDataText: '#000', // [T] 7353-7362 `.nothing-here p { color: $black-clr }`
} as const;
