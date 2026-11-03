// Values of src/pages/home (home.html + home.scss) and the global variables.scss rules that reach it.
// New file written by the Home implementer (same pattern as ionicMdLogin.ts): screens may not hold hex colours, so the
// template's neutral colours live here. Citations: [T] src/theme/variables.scss line, [S] home.scss, [CSS] compiled main.css.
export const homeMd = {
  black: '#000000', // [T] 261 $black-clr
  // [T] 530-535 `.company-logo { padding: 10px 16px } img { height: 40px }`
  companyLogo: { paddingVertical: 10, paddingHorizontal: 16, imgHeight: 40 },
  // An inline <img> sits on the text baseline: the line box adds the font's descent below it. Chrome rounds Roboto's
  // ascent/descent separately: round(14 * 500 / 2048) = 3 px (body font 1.4rem = 14px). Applied under every inline <img>
  // that is not absolutely positioned. NOTE: computed, not measured; verify against the reference capture.
  inlineImgGap: 3,
  // [S] 4-16 `page-home .badge` (+ [CSS] absolute against the position:relative bar-button)
  badge: { top: -3, left: 12, size: 18, fontSize: 12, background: '#f02121' },
  mr10Extra: 8, // `.mr10 { margin-right: 10px !important }` on ion-buttons (margin 0 .2rem leaves 2px): 8 more
  mr16Extra: 14, // `.mr16`: 16px -> 14 more
  // [T] 1325-1450 `.product-option`
  productOption: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    boxMargin: 5,
    boxRadius: 6,
    boxShadow: '0px 0px 15px 0px rgba(0, 0, 0, 0.1), 0px 0px 15px 0px rgba(0, 0, 0, 0.1)',
    productBoxHeight: 70,
    productBoxPaddingVertical: 15,
    productBoxBorder: '#E5E5E5',
    chipBackground: '#D54545', // `.main-box span`
    chipFontSize: 10,
    barWidth: 70, // `.main-box:before`
    barHeight: 4,
    barBottom: -2,
    barColors: ['#cc8241', '#41adf7', '#ead700'], // :nth-child(1..3)
    headingHeight: 30,
    headingMarginVertical: 10,
    headingFontSize: 12, // h4
    pointHeight: 40,
    pointFontSize: 18, // h3
  },
  // [T] 3182-3270 `.profile-point` inside `.home-pint`
  pointsRow: {
    padding: 16,
    columnGap: 10,
    cardHeight: 85,
    cardRadius: 10,
    cardShadow: '0px 3px 7px 0px rgba(0, 0, 0, 0.2)',
    barWidth: 45,
    barHeight: 5,
    barBottom: -3,
    barRadius: 6,
    barColors: ['#359C38', '#FF00D5', '#FFA200'], // li 1, li 2, li:last-child
    valueFontSize: 20,
    valuePaddingBottom: 12,
    labelFontSize: 12,
    unitRight: -16, // `.pints span`
    unitBottom: 35,
    unitFontSize: 10,
    unitColor: '#c1bdbd',
    unitLetterSpacing: 2,
    unitRotate: '271deg',
  },
  // [T] 10986-11070 `.go-btn.artificial` (Installation Videos)
  goBtn: {
    height: 50,
    radius: 35,
    shadow: '0px 0px 15px 0px rgba(0, 0, 0, 0.1), 0px 0px 15px 0px rgba(0, 0, 0, 0.1)',
    leftWidth: 60,
    leftMarginLeft: 16,
    imgSize: 50,
    imgTop: -25,
    imgLeft: -7,
    rightPaddingHorizontal: 10,
    contentFontSize: 14,
    arrowSize: 27,
    arrowColor: '#b5b5b5',
  },
  // [T] 12324-12333 `.group-btn`
  groupBtn: { paddingHorizontal: 16, gap: 16 },
  h50: 50, // `.h50 { height: 50px !important }`
  mb16: 16,
} as const;
