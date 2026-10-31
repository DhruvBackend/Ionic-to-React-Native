// Ionic 3.9.5 md values for the scrolling / interactive content controls (plan Task 9 part 5B): segment,
// searchbar, refresher, infinite scroll, spinners, fab, slides (Swiper 3.4), iframe and the image viewer modal,
// plus every Topbath override that reaches them. Citations:
//   [I] = ionic-angular@3.9.5/<path>:<line>   (components/<x>/<x>.md.scss etc.)
//   [T] = Topbath src/theme/variables.scss:<line>
//   [P] = Topbath src/pages/<page>/<page>.html (usage)
//   [CSS] = the shipped app's compiled www/build/main.css, used to settle which rule wins.
// Topbath's variables.scss is emitted BEFORE Ionic's component CSS, so at equal specificity Ionic wins;
// a more specific selector or !important in variables.scss wins.
import { ionicColors, scssColors } from './index';
import { normalLineHeight } from './ionicMdOverlays';

// Ionic color-shade() (themes/ionic.functions.scss): mix(#000, color, 12%). Used for `.activated` fills.
export function colorShade(hex: string, pct = 12): string {
  const n = parseInt(hex.slice(1), 16);
  const f = 1 - pct / 100;
  const c = [Math.floor(n / 65536) % 256, Math.floor(n / 256) % 256, n % 256].map(v => Math.round(v * f));
  return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

// ---------------------------------------------------------------------------------------------------------
// Usage survey (grep of ACTIVE markup in src/pages/**/*.html: HTML comments stripped first, 117 files):
//  - ion-segment 5 / ion-segment-button 15: 4 segments inside .ion-tab-btn (complaint-history, customerdetail x2,
//    plumber-list; 11 buttons) and 1 OUTSIDE it (sales-exec-plumber-list.html:6-13, <ion-toolbar color="light"
//    class="tab-bar"> with (ionChange); 4 buttons).
//  - ion-searchbar 20: 17 inside .search.add-search, 1 inside .search (gift-list), 1 in .cs-search (cart-detail),
//    1 bare in a toolbar (main-distributor-list).
//  - ion-refresher 29 / ion-refresher-content 29, every one pullingIcon="arrow-dropdown" pullingText="Pull to refresh"
//    refreshingSpinner="circles" refreshingText="Refreshing...".
//  - ion-infinite-scroll 26 / ion-infinite-scroll-content 26: every one threshold="100px" (ionInfinite)
//    *ngIf="flag!=1", loadingSpinner="bubbles" loadingText="Loading more data...".
//  - ion-fab 5 (all `right bottom`, `button ion-fab color=primary|danger`, icon "add", no ion-fab-list).
//  - ion-slides 12: 8 `pager autoplay=3000` (dealer-home 1, home 5, sales-exec-home 2; the sales-exec-home ones write
//    autoplay="3000"), 3 bare (home x2, sales-exec-home.html:35), 1 pager="false" (product-subdetail).
//  - <iframe> 5 active: video, complaint-detail, pulmber-customer-detail (these 3 have the `rameborder` typo), contact and
//    point-location (no border).
//  - image viewer = ViewProfilePage modal (no plugin; package.json has none).
// ---------------------------------------------------------------------------------------------------------

// --- Segment ----------------------------------------------------------------------------------------------
export const segmentMd = {
  // [I] components/segment/segment.md.scss (line numbers below are that file)
  buttonOpacity: 0.7, // segment.md.scss:19 $segment-button-md-opacity (inactive)
  buttonOpacityActivated: 1, // segment.md.scss:22
  borderBottomWidth: 2, // segment.md.scss:13 (Topbath sets 0, see topbathSegment)
  borderBottomColor: 'rgba(0, 0, 0, 0.1)', // segment.md.scss:16
  height: 42, // segment.md.scss:43 4.2rem
  fontSize: 12, // segment.md.scss:49 1.2rem
  fontWeight: 500, // segment.md.scss:69 (.segment-md .segment-button), beats the global `*{font-weight:400}` [T:7835]
  textTransform: 'uppercase', // segment.md.scss:71 (Topbath: capitalize !important)
  transitionMs: 100, // segment.md.scss:76 `transition: 100ms all linear`
  paddingEnd: 6, // segment.md.scss:34
  disabledOpacity: 0.3, // segment.md.scss:25
} as const;

export const topbathSegment = {
  // [T:778-808] .ion-tab-btn (4 of the 5 segments live inside one) -> [CSS] .ion-tab-btn ion-segment...
  wrapperPaddingHorizontal: 16, // [T:779]
  background: '#fff', // [T:783]
  borderWidth: 1, // [T:784]
  borderColor: '#878787', // [T:784]
  borderRadius: 6, // [T:785] (overflow hidden clips the buttons)
  buttonHeight: 35, // [T:789] !important
  fontSize: 12, // [T:795] !important
  letterSpacing: 0.5, // [T:796]
  textColor: scssColors.secondary, // [T:793] color: $secondary !important
  activeBackground: scssColors.primary, // [T:804] $primary !important
  activeColor: scssColors.white, // [T:805] $white !important (selector .ion-tab-btn ion-segment .segment-activated, 0,2,1 beats 0,1,3)
  activeFontWeight: 600, // [T:806] beats md 500 (0,2,1 vs 0,2,0); 600 draws Roboto Bold (fontFor)
  textTransform: 'capitalize', // [T:794] !important
  paddingHorizontal: 6, // segment.md.scss:34 `.segment-md .segment-button{padding:0 6px}` is not overridden by Topbath
  // NOTE (parity): `display:flex` [T:798] replaces `display:block`, so segment.scss `text-overflow:ellipsis` stops working: long labels are clipped, not ellipsized
} as const;

// --- Searchbar --------------------------------------------------------------------------------------------
export const searchbarMd = {
  // [I] components/searchbar/searchbar.md.scss, searchbar.js
  debounceMs: 250, // searchbar.js:76 `this.debounce = 250` (only (ionInput) is debounced; ngModelChange is not)
  clearDelayMs: 64, // searchbar.js:308 setTimeout(..., 16 * 4) before value '' + ionInput
  placeholder: 'Search', // searchbar.js:59
  placeholderColor: '#aeaeae', // md.scss:43 $searchbar-md-input-placeholder-color
  textColor: '#141414', // md.scss:46
  inputBackground: '#fff', // md.scss:49
  inputBorderRadius: 2, // md.scss:52
  inputFontSize: 16, // md.scss:129 1.6rem
  inputLineHeight: 30, // md.scss:37 3rem
  inputPaddingVertical: 6, // md.scss:123 `@include padding(6px, 55px)`
  inputPaddingHorizontal: 55,
  inputShadow: '0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 1px 5px 0 rgba(0, 0, 0, 0.12)', // md.scss:40
  containerPadding: 8, // md.scss:10 (in a .toolbar: 3, but Topbath's `ion-searchbar{padding:0 16px!important}` overrides both)
  searchIconSize: 20, // md.scss:31 background-size 20px; box is 21 wide/tall
  searchIconBox: 21, // md.scss:83-84 width/height $size + 1
  searchIconTop: 11, // md.scss:80 position(11px, null, null, 16px)
  searchIconLeft: 16,
  searchIconColor: '#5b5b5b', // md.scss:25
  clearIconSize: 22, // md.scss:61 (box 22 x 100% of the input container)
  clearIconRight: 13, // md.scss:144 position(0, 13px, null, null)
  clearIconColor: '#5b5b5b', // md.scss:55
  cancelIconLeft: 10, // md.scss:92 .searchbar-md-cancel position(0, null, null, 10px); in a toolbar 14px
  cancelIconBox: 21,
  cancelButtonText: 'Cancel', // searchbar.js:55 (the md arrow-back is drawn instead; the text is ios only)
} as const;

// Search icon / clear icon paths: the inline SVGs from searchbar.md.scss:28,58 (viewBox 0 0 512 512).
export const searchbarIconPaths = {
  search:
    'M337.509,305.372h-17.501l-6.571-5.486c20.791-25.232,33.922-57.054,33.922-93.257C347.358,127.632,283.896,64,205.135,64C127.452,64,64,127.632,64,206.629s63.452,142.628,142.225,142.628c35.011,0,67.831-13.167,92.991-34.008l6.561,5.487v17.551L415.18,448L448,415.086L337.509,305.372z M206.225,305.372c-54.702,0-98.463-43.887-98.463-98.743c0-54.858,43.761-98.742,98.463-98.742c54.7,0,98.462,43.884,98.462,98.742C304.687,261.485,260.925,305.372,206.225,305.372z',
  clear:
    'M405,136.798 375.202,107 256,226.202 136.798,107 107,136.798 226.202,256 107,375.202 136.798,405 256,285.798 375.202,405 405,375.202 285.798,256',
} as const;

// Where the 20 Topbath searchbars sit decides which overrides apply. [CSS] rules:
//   `ion-searchbar{padding:0 16px!important}` + `ion-searchbar .searchbar-input-container input{line-height:30px!important;
//   border-radius:30px!important;height:30px;font-size:12px;padding:10px 16px 10px 35px}` apply to ALL [T:9827-9837]
//   `.search ion-searchbar` [T:1239-] and `.search.add-search ion-searchbar` [T:1259-] refine them.
export type SearchbarContext = 'addSearch' | 'search' | 'bare';
export const topbathSearchbar = {
  // global rule [T:9827-9837] (every ion-searchbar; the `input` rule is (0,1,2) so it LOSES to .searchbar-md
  // .searchbar-input (0,2,0) for height/font-size/padding on a plain searchbar, but line-height:30 and
  // radius 30 are !important and win).
  global: {
    paddingHorizontal: 16, // !important
    inputRadius: 30, // !important
    inputLineHeight: 30, // !important
  },
  // `.search.add-search ion-searchbar .searchbar-input` (0,3,1) beats .searchbar-md .searchbar-input (0,2,0). 17 usages. [T:1259-1285]
  addSearch: {
    paddingHorizontal: 16, // [T:1265] !important
    inputHeight: 30, // [T:1267]
    inputRadius: 30, // [T:1268]
    borderWidth: 0, // [T:1269]
    fontSize: 12, // [T:1272]
    letterSpacing: 1, // [T:1273]
    inputPadding: { top: 10, right: 16, bottom: 10, left: 35 }, // [T:1274]
    iconLeft: 10, // [T:1279]
    iconTop: 7, // [T:1280]
    iconBox: 15, // [T:1281-1282] box 15x15, but background-size stays 20px (md.scss) -> the SVG is cropped
    containerPaddingRight: 0, // [T:1277] !important
    textTransform: 'capitalize', // [T:1271] NOTE (parity): drawn on the placeholder only; typed text is not transformed (see IonSearchbar)
    // marginTop 0 !important [T:1270]; box-shadow stays the md one (only `.search ...` kills it)
  },
  // `.search ion-searchbar` (gift-list only) [T:1239-1258]
  search: {
    paddingHorizontal: 32, // [T:1241]
    inputHeight: 45, // [T:1243]
    inputRadius: 20, // [T:1244] (the global `border-radius:30px!important` on input wins: 30)
    borderWidth: 2,
    borderColor: '#D4D4D4', // [T:1245]
    fontSize: 14, // [T:1249]
    marginTop: -27, // [T:1247] !important
    iconLeft: 18, // [T:1253]
    iconTop: -13, // [T:1254]
    iconBackgroundSize: 18, // [T:1255]
    textTransform: 'capitalize', // [T:1248] same limit as addSearch
  },
  // No Topbath refinement (main-distributor-list in a toolbar, cart-detail in .cs-search: its `padding:0` is not
  // !important so the global !important 16px wins [CSS]). The input is then the md default with the global
  // `line-height:30px!important` + `border-radius:30px!important`; `height:auto` => 30 line + 6+6 padding = 42,
  // and .searchbar-md .searchbar-input (0,2,0) beats the global input rule's font-size/padding.
  bare: { paddingHorizontal: 16, inputHeight: 42 },
  // `input{...!important}` [T:397-402] sets font-family Roboto (every font here is Roboto anyway).
} as const;

// --- Spinners (ion-spinner) -------------------------------------------------------------------------------
export const spinnerMd = {
  size: 28, // [I] components/spinner/spinner.scss:7-8 ion-spinner width/height
  viewBox: 64, // spinner.js `<svg viewBox="0 0 64 64">`, circle translated to (32,32)
  durationMs: 1000, // spinner.js SPINNERS.bubbles.dur / circles.dur (crescent 750)
  bubbles: { circles: 9, r: 5, orbit: 9 }, // spinner.js bubbles: fn r:5, top/left = 9*sin/cos(2*pi*i/9)
  circles: { circles: 8, r: 5, orbit: 9 }, // spinner.js circles
  // animation: bubbles -> spinner-scale-out (scale 1 -> 0), circles -> spinner-fade-out (opacity 1 -> 0), both 1s linear
  // per-element delay = -(dur - dur/total*index) (spinner.js _loadEle)
} as const;

// --- Refresher --------------------------------------------------------------------------------------------
// content.md.scss $content-md-background-color (#fff): drawn over the refresher layer by the scroll element
export const scrollContentBackground = '#fff';

export const refresherMd = {
  // [I] components/refresher/refresher.js:30-40 and refresher.scss
  pullMin: 60, // refresher.js:135 default pullMin
  pullMax: 120, // refresher.js:135,141 `this.pullMax = this.pullMin + 60` runs in the constructor: a FIXED 120 (a pullMin input does not move it)
  overscrollExtra: 40, // RN only: spare pull room above pullMax in IonContent's top spacer, so a drag can pass pullMax
  snapbackDuration: 280, // refresher.js:149
  closeDuration: 280, // refresher.js:145
  completeDelayMs: 120, // refresher.js complete() -> _close(STATE_COMPLETING, '120ms') transition-delay
  closeFallbackMs: 600, // refresher.js _close() fallback timer if transitionend never fires
  height: 60, // refresher.scss:7 $refresher-height
  iconSize: 30, // refresher.scss:13 $refresher-icon-font-size
  iconColor: '#000', // refresher.scss:10 (also fill/stroke of the refreshing spinner, :93-99, specificity beats the md spinner colours)
  textSize: 16, // refresher.scss:19 $refresher-text-font-size
  textColor: '#000', // refresher.scss:16
  borderColor: '#ddd', // refresher.scss:22,48 .has-refresher > .scroll-content{margin-top:-1px;border-top:1px solid #ddd}; NOTE the header overlaps this px
  iconTransitionMs: 200, // refresher.scss:79 `transition: 200ms` on the pulling/refreshing icon (:118 ready -> rotate(180deg); cancelling :134 / completing :144 -> scale(0))
  contentTransitionMs: 320, // refresher.scss:49 `.has-refresher > .scroll-content{transition: transform 320ms cubic-bezier(.36,.66,.04,1)}`; refresher.js _close() passes duration '' so this applies
  contentEasing: [0.36, 0.66, 0.04, 1] as const, // same rule
  pullingIcon: 'arrow-dropdown', // [P] every refresher-content (29)
  pullingText: 'Pull to refresh', // [P] all 29 contents
  refreshingSpinner: 'circles', // [P]
  refreshingText: 'Refreshing...', // [P]
} as const;

// --- Infinite scroll --------------------------------------------------------------------------------------
export const infiniteMd = {
  // [I] components/infinite-scroll/infinite-scroll.js:16-18, infinite-scroll.scss
  defaultThreshold: '15%', // infinite-scroll.js:18 _thr
  throttleMs: 32, // infinite-scroll.js:_onScroll `_lastCheck + 32 > ev.timeStamp`
  contentMinHeight: 84, // infinite-scroll.scss:62 ion-infinite-scroll-content min-height
  spinnerMarginBottom: 32, // infinite-scroll.scss:17 $infinite-scroll-loading-margin-bottom (.infinite-loading margin)
  color: '#666', // infinite-scroll.scss:23 $infinite-scroll-loading-color (also the bubbles fill; beats md #000 on specificity)
  textMarginTop: 4, // infinite-scroll.scss:32 $infinite-scroll-loading-text-margin-top
  textMarginHorizontal: 32, // infinite-scroll.scss:35,41 $infinite-scroll-loading-text-margin-end/start
  textSize: 14, // inherited body font-size (md.scss $font-size-md-base 1.4rem)
  threshold: '100px', // [P] all 26 usages
  loadingSpinner: 'bubbles', // [P]
  loadingText: 'Loading more data...', // [P]
} as const;

// --- Fab --------------------------------------------------------------------------------------------------
export const fabMd = {
  // [I] components/fab/fab.scss, fab.md.scss
  size: 56, // fab.scss:7 $fab-size
  miniSize: 40, // fab.scss:10 $fab-mini-size
  contentMargin: 10, // fab.scss:13 $fab-content-margin (ion-fab[right]/[bottom] offsets)
  iconSize: 24, // fab.scss:50-53 `.fab ion-icon{font-size:2.4rem}`
  zIndex: 999, // fab.scss:78 $z-index-fixed-content (themes/ionic.globals.scss:38)
  // fab.md.scss:7 / :10
  boxShadow: '0 4px 6px 0 rgba(0, 0, 0, 0.14), 0 4px 5px rgba(0, 0, 0, 0.1)',
  boxShadowActivated: '0 5px 15px 0 rgba(0, 0, 0, 0.4), 0 4px 7px 0 rgba(0, 0, 0, 0.1)',
  transitionMs: 300, // fab.md.scss:39 $fab-button-md-transition-duration (cubic-bezier(.4,0,.2,1))
  rippleOpacity: 0.2, // button-effect opacity .2 (button.md.scss)
  // Topbath's global `button{margin:0!important}` [T:397-402] removes the .fab[mini] 8px margin too.
  margin: 0,
  contrast: '#fff', // color-contrast of primary (#002d25) and danger (#54595f) is white
  colors: { primary: ionicColors.primary, danger: ionicColors.danger }, // [P] color="primary" x4, "danger" x1 ($colors-md map)
} as const;

// --- Slides (Swiper 3.4 inside Ionic 3.9.5) -----------------------------------------------------------------
export const slidesMd = {
  // [I] components/slides/slides.js
  initDelayMs: 300, // slides.js:785 ngAfterContentInit `plt.timeout(initSlides, 300)`
  speedMs: 300, // slides.js:188 _speedMs
  autoplayStopOnLast: false, // slides.js:234
  autoplayDisableOnInteraction: true, // slides.js:230
  maxPagerSlides: 10, // slides.js:801 update() `length() > 10 -> paginationType = undefined`
  // [CSS] swiper pager
  bulletSize: 8, // .swiper-pagination-bullet width/height
  bulletMarginHorizontal: 5, // .swiper-pagination-bullets .swiper-pagination-bullet{margin:0 5px}
  bulletColor: '#000', // .swiper-pagination-bullet background
  bulletOpacity: 0.2,
  bulletActiveColor: scssColors.primary, // .swiper-pagination-bullet-active{background:#002d25;opacity:1}
  paginationBottom: 10, // .swiper-pagination-bullets{bottom:10px}
  // [T:3032-3045] + [CSS] .slide-zoom: Topbath adds margin 10 (the slide-zoom is `width:100%` + margin, flex-shrunk)
  slideZoomMargin: 10,
  // [CSS] `ion-slides{display:block;width:100%;height:100%}`: every Topbath ion-slides has an auto-height parent, so the
  // 100% computes to auto; RN gives no height instead (see IonSlides.tsx)
} as const;

// --- iframe -> WebEmbed -----------------------------------------------------------------------------------
export const iframeDefaults = {
  // 3 of the 5 active iframes (video.html:20, complaint-detail:101, pulmber-customer-detail:140) write `rameborder="0"`
  // (typo for frameborder), so they keep Chromium's UA `iframe{border:2px inset}`; the other 2 have no border:
  // contact.html (style="border:0") and point-location.html (frameborder="0" style="border:0").
  insetWidth: 2,
  // Chromium (Blink CalculateBorderStyleColor, from WebKit calculateBorderStyleColor): for `inset`, top/left are the
  // DARKER pair and bottom/right the LIGHTER pair. The border colour is currentColor = #000 (Ionic md body text). For
  // black the darken side stays #000 (not lighter than the 0x202020 base dark colour) and the lighten side becomes
  // Color::Light() of black = #545454.
  // NOTE (parity): from memory of Chromium's logic, not measured: verify in the parity harness.
  insetTopLeft: '#000',
  insetBottomRight: '#545454',
  videoHeight: 180, // [P] height="180"
} as const;

// --- Image viewer (ViewProfilePage modal, class "module") -------------------------------------------------
export const imageViewerMd = {
  // [T:4188-4229] .module (+ [CSS] `.module{background:rgba(0,0,0,.9)!important}`)
  backdrop: 'rgba(0, 0, 0, 0.9)',
  popPadding: 20, // [T:4202] .pop-imge padding (margin ends as `0 auto`, width 100%)
  imageRadius: 5, // [T:4211]
  brokenImageSize: 16, // Chromium: an <img> that failed to load with no size/alt is a 16 x 16 icon box (verify in the parity harness)
  closeTop: 9, // [T:4214] a{top:9px;right:9px}
  closeRight: 9,
  closeSize: 30, // [T:4217-4218]
  closeRadius: 24, // [T:4222]
  closeColor: '#d31010', // [T:4216]
  closeIconSize: 20, // [T:4225]
  closeIconColor: scssColors.white, // [T:4224]
  // global `img{max-width:100%;border:0}` [CSS]: natural size, shrunk to the container width, never enlarged
} as const;

export const scrollMetrics = {
  // Roboto line boxes used when a block's height comes from `line-height: normal` text.
  refresherIconRow: normalLineHeight(refresherMd.iconSize),
  refresherTextRow: normalLineHeight(refresherMd.textSize),
  infiniteTextRow: normalLineHeight(infiniteMd.textSize),
  // inline-block 28 px spinner on a baseline: line box = 28 + the strut's descent (Roboto hhea descender 500/2048 em)
  infiniteSpinnerRow: spinnerMd.size + Math.round((infiniteMd.textSize * 500) / 2048),
  refresherSpinnerRow: spinnerMd.size + Math.round((refresherMd.iconSize * 500) / 2048),
};
