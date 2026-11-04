// Values of the NearestDealer page (nearest-dealer.html) that come from global rules of src/theme/variables.scss (the page SCSS is empty) and
// that the screen cannot spell as hex (lint rule). Citations: [CSS] the shipped main.css, [T] variables.scss. NOTE: added for the NearestDealer screen.
export const nearestDealerMd = {
  // [CSS] `.prlist .box { box-shadow: 0 3px 6px 0 rgba(0,0,0,.1) !important; background: #fff }`
  boxShadow: '0 3px 6px 0 rgba(0, 0, 0, 0.1)',
  // [CSS] `.prlist .box .heading { border-bottom: 1px solid #dcdcdc }`
  headingBorder: '#dcdcdc',
  // [CSS] `.prlist .box .heading .dist-name .first-leter { background: #000 !important }` and `.prlist .box:nth-child(5n+k) ...` k = 1..4.
  // NOTE (parity): `:nth-child(5n+n)` (the fifth rule, #00b785) is not valid An+B syntax: the browser drops the rule, so every 5th box keeps #000.
  letterBackground: ['#07a6c6', '#f5e100', '#ff0000', '#6200b7', '#000000'],
  // [CSS] `.list-box { box-shadow: 0 0 10px rgba(0,0,0,.2) !important; background: #fff }`
  listBoxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
  // [CSS] `.list-box .mid .content-info .left-info .circle { background: #fff; box-shadow: 0 3px 6px rgba(0,0,0,.16) }`
  circleShadow: '0 3px 6px rgba(0, 0, 0, 0.16)',
} as const;
