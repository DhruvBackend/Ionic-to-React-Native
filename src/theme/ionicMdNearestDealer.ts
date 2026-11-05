// Values of the NearestDealer page (nearest-dealer.html) that come from global rules of src/theme/variables.scss (the page SCSS is empty) and
// that the screen cannot spell as hex (lint rule). Citations: [CSS] the shipped main.css, [T] variables.scss. NOTE: added for the NearestDealer screen.
export const nearestDealerMd = {
  // [CSS] `.prlist .box { box-shadow: 0 3px 6px 0 rgba(0,0,0,.1) !important; background: #fff }`
  boxShadow: '0 3px 6px 0 rgba(0, 0, 0, 0.1)',
  // [CSS] `.prlist .box .heading { border-bottom: 1px solid #dcdcdc }`
  headingBorder: '#dcdcdc',
  // [CSS] `.prlist .box .heading .dist-name .first-leter { background: #000 !important }`. NOTE (parity): the `.prlist .box:nth-child(5n+k)`
  // colour rules are not !important, so the !important black wins on every box (the phone shows black on all of them).
  letterBackground: '#000000',
  // [CSS] `.list-box { box-shadow: 0 0 10px rgba(0,0,0,.2) !important; background: #fff }`
  listBoxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
  // [CSS] `.list-box .mid .content-info .left-info .circle { background: #fff; box-shadow: 0 3px 6px rgba(0,0,0,.16) }`
  circleShadow: '0 3px 6px rgba(0, 0, 0, 0.16)',
  // [CSS] `.list-box .mid .tag-info a i { color: #00b900; font-size: 20px }` (main.css 8114)
  callIcon: '#00b900',
} as const;
