// Colours of the Offers page (offers.html): global rules of variables.scss that the screen cannot spell as hex (lint rule).
// Citations: [T] src/theme/variables.scss in the Ionic source. NOTE: added for the Offers screen.
export const offersMd = {
  // [T] 3278-3282 `.listings button { box-shadow: 0px 3px 6px 0px #ccc }`
  itemShadow: '0px 3px 6px 0px #ccc',
  // [T] 12451-12466 `.conatiner .img-box { box-shadow: 0px 3px 6px 0px rgba(0,0,0,0.2); border: 6px solid #fff }`
  imgBoxShadow: '0px 3px 6px 0px rgba(0, 0, 0, 0.2)',
  // [T] 3322-3326 `.head a i { color: #00910E }` (the "verified_user" icon)
  verified: '#00910E',
  // [T] 3306-3326 `.head:after { border: 1px solid #DEDEDE }`
  divider: '#DEDEDE',
  // [T] 3369-3386 `.listings button:nth-child(...) { border-left: 5px solid ... !important }`
  stripe: { yellow: '#F5E100', red: '#FA3606', pink: '#F564FF', indigo: '#625DD4' },
} as const;
