// Colours of the MainHome page (main-home.html) that come from global rules of Topbath's src/theme/variables.scss and that the
// screen cannot spell as hex (lint rule). Citations: [T] variables.scss line (Ionic source), [CSS] the shipped main.css.
// NOTE: added for the MainHome screen.
export const mainHomeMd = {
  // [T] 5560-5602 `.listing button { box-shadow: 0px 3px 6px 0px #ccc; background: $white; border-radius: 6px }`
  shadow: '0px 3px 6px 0px #ccc',
  // [T] 5603-5620 `.listing button:nth-child(1n+1 | 2n+2 | 3n+3 | 4n+4) { border-left: 5px solid <colour> !important }`.
  // Equal specificity, the later rule wins: child 1 = [0], 2 = [1], 3 = [2], 4 = [3], 5 = [0] again (1n+1 only; 5 is no multiple of 2/3/4).
  stripes: ['#F5E100', '#FA3606', '#F564FF', '#625DD4'],
} as const;
