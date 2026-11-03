// Colours of the Terms page (terms.html): global rules of variables.scss that the screen cannot spell as hex (lint rule).
// Citations: [T] src/theme/variables.scss in the Ionic source. NOTE: added for the Terms screen.
export const termsMd = {
  // [T] 261 `$black-clr: #000000`, used by 3960-3968 `.terms-text p { color: $black-clr }`
  ink: '#000000',
  // [T] 12451-12466 `.conatiner .img-box { box-shadow: 0px 3px 6px 0px rgba(0,0,0,0.2) }` (same value as the Offers page)
  imgBoxShadow: '0px 3px 6px 0px rgba(0, 0, 0, 0.2)',
} as const;
