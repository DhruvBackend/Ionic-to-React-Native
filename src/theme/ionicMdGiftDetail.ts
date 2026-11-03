// Colours of the GiftDetail page (gift-detail.html): global rules of variables.scss and gift-detail.scss that the screen
// cannot spell as hex (lint rule). Citations: [T] src/theme/variables.scss, [S] src/pages/gift-gallery/gift-detail/gift-detail.scss.
// NOTE: added for the GiftDetail screen.
export const giftDetailMd = {
  // [T] 3535-3539 `.top-nav { background: #F5F7FF }`
  topNavBackground: '#F5F7FF',
  // [T] 3745-3758 `.margin-padding .phone .phone-head p { color: #0089FF }`
  pointsColor: '#0089FF',
  // [T] 3760-3774 `.margin-padding .phone .phone-img { border: solid 1px #ccc }`
  phoneImgBorder: '#ccc',
  // [T] 3782-3787 `.detail-list .detail .img-section { box-shadow: 0px 3px 6px 0px rgba(0,0,0,0.5) }`
  imgSectionShadow: '0px 3px 6px 0px rgba(0, 0, 0, 0.5)',
  // [S] 28-32 `.kyc-reject-text { color: #3a40ff }`
  linkColor: '#3a40ff',
  // [S] 35-56 `.error-bg.kyc-reject { background: #ffe9e9; border-color: #ff0008 }`
  rejectBackground: '#ffe9e9',
  rejectBorder: '#ff0008',
} as const;
