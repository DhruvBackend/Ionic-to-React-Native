// Ionic 3.9.5 Material Design popup values (Alert, Loading, Toast, ActionSheet) plus every Topbath
// global override that reaches them (plan Task 9 part 2). Citations:
//   [I] = ionic-angular@3.9.5/components/<file>:<line>
//   [T] = Topbath src/theme/variables.scss:<line>
//   [CSS] = the shipped app's compiled www/build/main.css (topsan.aab), used to settle which rule wins.
// Topbath's variables.scss is emitted BEFORE Ionic's component CSS in main.css, so at equal selector
// specificity Ionic wins; only !important or a more specific selector in variables.scss wins.
import { ionicColors, scssColors } from './index';

// Roboto "line-height: normal": Chrome rounds ascent and descent separately.
// hhea ascender 1900, descender 500 per 2048 em (read from the bundled Roboto-Regular.ttf; the
// OS/2 USE_TYPO_METRICS bit is clear, so hhea applies).
export function normalLineHeight(fontSize: number): number {
  return Math.round((fontSize * 1900) / 2048) + Math.round((fontSize * 500) / 2048);
}

// themes/ionic.theme.default.md.scss:14 $font-size-md-base (1.4rem, themes/ionic.theme.dark.scss $font-size-base)
export const appFontSize = 14;
// components/app/app.scss:32 $headings-line-height (h1-h6 { line-height: 1.2 })
export const headingsLineHeight = 1.2;

export const overlay = {
  backdropColor: '#000', // backdrop/backdrop.scss:7 $backdrop-color
  backdropStartOpacity: 0.01, // backdrop/backdrop.scss:20
  clickBlockMs: 400, // navigation/view-controller.js:130-134 minClickBlockDuration for dismissed overlays
  clickBlockBufferMs: 64, // components/app/app.js:422 CLICK_BLOCK_BUFFER_IN_MILLIS
  activatedDelayMs: 80, // tap-click/activator.js ADD_ACTIVATED_DEFERS
  activatedClearMs: 80, // tap-click/activator.js CLEAR_STATE_DEFERS
  // button.md.scss:79 $button-md-ripple-background-color, :480 opacity .2
  rippleColor: '#555',
  rippleOpacity: 0.2,
  rippleClearColor: '#999', // button.md.scss: .button-clear-md .button-effect (CSS 624016)
  rippleTouchDownAccel: 300, // tap-click/ripple.js TOUCH_DOWN_ACCEL
  // CSS "ease-in-out" and Ionic's 'cubic-bezier(.36,.66,.04,1)'
  easeInOut: [0.42, 0, 0.58, 1] as const,
  slideEasing: [0.36, 0.66, 0.04, 1] as const, // toast-transitions.js:81, action-sheet-transitions.js:30
  // Shadow shared by the md alert and loading wrapper: 0 16px 20px rgba(0,0,0,.4)
  boxShadow: { offsetX: 0, offsetY: 16, blurRadius: 20, color: 'rgba(0, 0, 0, 0.4)' }, // alert.md.scss:16,19 / loading.md.scss:37,40
} as const;

export const alertMd = {
  minWidth: 250, // alert.scss:7 $alert-min-width
  maxWidth: 280, // alert.md.scss:7
  maxHeightPct: '90%', // alert.scss:10 $alert-max-height
  borderRadius: 2, // alert.md.scss:10
  backgroundColor: '#fafafa', // alert.md.scss:13
  topPadding: 50, // alert.scss:25 ion-alert.alert-top (text-input alerts on mobile, alert-component.js ionViewDidLoad)
  // transitions: alert-transitions.js:34-57 (AlertMdPopIn / AlertMdPopOut)
  enter: { duration: 200, wrapperOpacity: [0.01, 1], wrapperScale: [1.1, 1], backdropOpacity: [0.01, 0.5] },
  leave: { duration: 200, wrapperOpacity: [0.99, 0], wrapperScale: [1, 0.9], backdropOpacity: [0.5, 0] },
  head: { paddingTop: 24, paddingRight: 24, paddingBottom: 20, paddingLeft: 24 }, // :25,:28,:31,:34
  titleFontSize: 22, // :41 (Topbath overrides to 16, see topbathAlert.titleFontSize)
  subTitleFontSize: 16, // :44
  subTitleFontWeight: 400, // alert.scss .alert-sub-title font-weight: normal
  titleFontWeight: 500, // components/app/app.scss:151 h1-h6 font-weight ($headings-font-weight)
  message: {
    paddingTop: 0, // :50
    paddingRight: 24, // :53
    paddingBottom: 24, // :56
    paddingLeft: 24, // :59
    fontSize: 15, // :62
    color: 'rgba(0, 0, 0, 0.5)', // :65
    maxHeight: 240, // :83
  },
  input: {
    borderBottomWidth: 1, // :86
    borderColor: '#dedede', // :92
    color: '#000', // :95
    focusedBorderWidth: 2, // :98
    focusedBorderColor: ionicColors.primary, // :104
    paddingVertical: 10, // alert.scss .alert-input padding: 10px 0
    placeholderColor: '#999', // alert.scss:19 $alert-input-placeholder-color
  },
  buttonGroup: { paddingTop: 8, paddingRight: 8, paddingBottom: 8, paddingLeft: 24 }, // :129,:132,:135,:138
  button: {
    padding: 10, // :147
    marginRight: 8, // :165 (Topbath's `button { margin: 0 !important }` removes it, see topbathAlert)
    fontWeight: 500, // :174
    color: ionicColors.primary, // :177
    activatedBackground: 'rgba(158, 158, 158, 0.2)', // :183
    borderRadius: 2, // :186
    fontSize: 14, // alert.scss:16
    lineHeight: 20, // alert.scss:13
  },
  list: { maxHeight: 240, borderColor: '#dedede', borderWidth: 1 }, // :83, :196 border-top/bottom
  tappable: { minHeight: 44 }, // :4.4rem alert.md.scss .alert-tappable min-height
  label: { paddingVertical: 13, paddingHorizontal: 26 }, // :205,:208
  radio: {
    left: 13, // :226
    size: 16, // :229,:232
    borderWidth: 2, // :235
    borderColorOff: '#787878', // :244 darken($list-md-border-color #dedede, 40%) (value from CSS 598775)
    borderColorOn: ionicColors.primary, // :247
    dotInset: 2, // :250,:253 top/left of the dot
    dotSize: 8, // :258,:261
    labelColorChecked: ionicColors.primary, // :220
    transitionMs: 280, // :273 transform 280ms cubic-bezier(.4,0,.2,1)
    transitionEasing: [0.4, 0, 0.2, 1] as const,
  },
  checkbox: {
    left: 13, // :301
    size: 16, // :304,:307
    borderWidth: 2, // :310
    borderRadius: 2, // :316
    borderColorOff: '#787878', // :319
    borderColorOn: ionicColors.primary, // :322
    checkLeft: 3, // :329
    checkTop: 0, // :326
    checkWidth: 6, // :334
    checkHeight: 10, // :337
    checkBorderWidth: 2, // :340
    checkColor: '#fff', // :346 color-contrast(primary) (value from CSS 600150)
    checkRotate: '45deg', // :349
  },
} as const;

export const loadingMd = {
  padding: 24, // loading.md.scss:10-19
  maxWidth: 280, // :22
  maxHeightPct: '90%', // :25
  contentMarginStart: 16, // :43 $content-md-margin = $content-margin (themes/ionic.theme.dark.scss:27)
  spinnerSize: 28, // spinner/spinner.scss ion-spinner width/height
  spinnerColor: ionicColors.primary, // :58 crescent
  enter: { duration: 200, wrapperOpacity: [0.01, 1], wrapperScale: [1.1, 1], backdropOpacity: [0.01, 0.5] }, // loading-transitions.js:34-46
  leave: { duration: 200, wrapperOpacity: [0.99, 0], wrapperScale: [1, 0.9], backdropOpacity: [0.5, 0] }, // :48-60
  // config/mode-registry.js:50 spinner: 'crescent' (md)
  crescent: {
    durationMs: 750, // spinner.js:268 dur, applied as animation-duration (spinner.js:168)
    viewBox: 64, // spinner.js template viewBox="0 0 64 64"
    r: 26, // spinner.js crescent fn
    strokeWidth: 4, // spinner.scss .spinner-crescent circle
    dashArray: 128, // same rule
    dashOffset: 82, // same rule
  },
} as const;

export const toastMd = {
  background: '#333', // toast.md.scss:7
  maxWidth: 700, // toast.scss:11
  messageFontSize: 15, // toast.md.scss:13 1.5rem
  messageColor: '#fff', // :10
  padding: { top: 19, right: 16, bottom: 17, left: 16 }, // :19,:22,:25,:28
  buttonFontSize: 15, // toast.scss .toast-button font-size 1.5rem
  buttonHeight: 36, // button.md.scss .button-md height 3.6rem (CSS 621978)
  buttonColor: '#fff', // CSS 930008 .toast-button { color: #fff } (later than .button-clear-md)
  buttonFontWeight: 500, // .button-md font-weight (CSS 621978)
  buttonActivated: 'rgba(158, 158, 158, 0.2)', // .button-clear-md.activated (CSS 624016)
  buttonBorderRadius: 2, // .button-md border-radius
  defaultCloseText: 'Close', // toast-component.js template: d.closeButtonText || 'Close'
  slideIn: { duration: 400 }, // toast-transitions.js:81
  slideOut: { duration: 450 }, // toast-transitions.js:104
  middleFadeIn: [0.01, 1], // :73
  middleFadeOut: [0.99, 0], // :97
  defaultDuration: 3000, // Topbath dbservice.ts:232-236 presentToast (Ionic itself has no default)
} as const;

export const actionSheetMd = {
  maxWidth: 500, // action-sheet.scss:10
  paddingTop: 8, // action-sheet.md.scss:13 .8rem (group:first-child)
  paddingBottom: 8, // :16 (group:last-child)
  background: '#fafafa', // :10 (Topbath overrides to white, see topbathActionSheet)
  title: { color: '#757575', fontSize: 16, padding: { top: 11, right: 16, bottom: 17, left: 16 } }, // :19,:22,:28-37
  button: {
    minHeight: 48, // :40 4.8rem
    color: '#222', // :43
    fontSize: 16, // :46
    paddingHorizontal: 16, // :55
    activatedBackground: '#f1f1f1', // :67
  },
  icon: { fontSize: 24, marginEnd: 32 }, // :70,:88
  selectedFontWeight: 700, // .action-sheet-selected font-weight: bold
  enter: { duration: 400, backdropOpacity: [0.01, 0.26] }, // action-sheet-transitions.js:23-31
  leave: { duration: 450, backdropOpacity: [0.26, 0] }, // :33-41
} as const;

// ---- Topbath global overrides --------------------------------------------------------------
// [T]390-399: h1..h6, p, span, button, input { margin: 0 !important; font-family: Roboto !important }
//   -> alert title/sub-title/input/button and toast/action-sheet buttons have margin 0 (Roboto is the
//      default md font already).
// [T]12316: .alert-md .alert-title { font-size: 16px !important }
// [T]6216-6240: .alert-modal (cssClass of dashboard.ts:196 "Stop Time", sales-app/end-checkin.ts:209, travel-add.ts:194, travel-list.ts:94)
// [T]4338-4390: .action-sheet-wrapper ... (every action sheet)
// [T]9940-9943: .loading-md .loading-wrapper { background: transparent !important; box-shadow: none !important }
// [T]9945-9947: .loading-content { color: $white }
export const topbathAlert = {
  titleFontSize: 16, // [T]12316 (!important beats .alert-modal h2's 20px and Ionic's 22px)
  // .alert-modal rules that WIN (more specific or !important):
  modal: {
    titleFontWeight: 600, // [T]6219-6221 .alert-modal .alert-head h2 (0,2,1) beats .alert-md .alert-title (0,2,0)
    titleLetterSpacing: 1, // same rule
    groupPadding: { vertical: 10, horizontal: 16 }, // [T]6230 padding: 10px 16px !important
    buttonPadding: { vertical: 8, horizontal: 10 }, // [T]6235 (0,2,1) beats .alert-md .alert-button (0,2,0)
    buttonMargin: 8, // [T]6236 margin: 8px !important
    buttonColor: scssColors.white, // [T]6234 color: $white
    firstButtonBackground: '#469c11', // [T]6242 :nth-child(1)
    secondButtonBackground: '#ef0606', // [T]6246 :nth-child(2)
    // NOT applied (lose to Ionic, which comes later in main.css at equal specificity):
    // .alert-modal .alert-head { padding: 16px }  [T]6217-6218   -> head keeps 24/24/20/24
    // .alert-modal .alert-message { padding-bottom: 0 } [T]6225  -> keeps 24
    // .alert-modal .alert-button-group button:nth-child(1) margin-right: 10px (loses to margin 8 !important)
  },
} as const;

export const topbathActionSheet = {
  containerPaddingHorizontal: 10, // [T]4340
  groupBackground: scssColors.white, // [T]4342 (0,3,0) beats .action-sheet-md .action-sheet-group (0,2,0)
  groupRadiusTop: 10, // [T]4343 border-radius: 10px 10px 0 0
  title: {
    fontSize: 18, // [T]4345
    color: '#000', // [T]4346
    padding: 12, // [T]4347
    fontWeight: 600, // [T]4348
    borderBottomColor: '#ececec', // [T]4350
  },
  button: {
    fontSize: 16, // [T]4353
    color: '#222', // [T]4354
    paddingHorizontal: 15, // [T]4356 padding: 0 15px
    minHeight: 53, // [T]4357
    width: 99, // [T]4358
    marginLeft: 49, // [T]4359 margin-left: 49px !important
  },
  icon: {
    marginRight: 8, // [T]4362 margin: 0 8px 0 0
    color: '#731b3b', // [T]4363
    thirdChildColor: '#008000', // [T]4367-4373 button:nth-child(3) span ion-icon { color: green }
  },
  cancel: {
    fontWeight: 600, // [T]4375-4390 .action-sheet-group-cancel button span
    fontSize: 16,
    // button margin 0 !important, padding 0, width inherit (shrink-to-fit); group text-align center, radius 0
  },
} as const;

export const topbathLoading = {
  contentColor: scssColors.white, // [T]9945
  // [T]9940-9943: wrapper background transparent, no shadow
  gifSize: 58, // assets/imgs/gif.svg width/height
  gifSizeH55: 55, // .h55 { height: 55px !important } generated by variables.scss:223 .h#{$i} (main.css ".h55{height:55px!important}")
} as const;
