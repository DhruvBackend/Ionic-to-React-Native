// Ionic 3.9.5 md values for the pickers of plan Task 9 part 3: ion-select, ion-datetime (+ the md picker),
// ionic-selectable 3.5.0 / ionic-select-searchable 2.10.0 and the Topbath global rules that reach them.
// Citations:
//   [I] = ionic-angular@3.9.5/components/<file>:<line> (SCSS source)
//   [IS] = ionic-selectable@3.5.0 package (src/*.scss, esm2015 template strings)
//   [T] = Topbath src/theme/variables.scss:<line>
//   [CSS] = line of the shipped build/main.css (topsan.aab) after splitting on "}", used to settle the
//           cascade. Topbath's rules are emitted BEFORE Ionic's component CSS (main.css line 6xxx-8xxx vs 12xxx+),
//           so at equal specificity Ionic wins; only !important or a more specific selector in variables.scss wins.
//   [M] = measured in headless Chrome 156 with the shipped main.css and Ionic's rendered markup (the DOM
//         classes copied from the Ionic templates), scratchpad p3/h/*.html. Used where CSS "normal" sizes matter.
import { ionicColors, scssColors } from './index';
import { md } from './ionicMd';

const primary = ionicColors.primary;

// ---------------------------------------------------------------------------------------------------
// The closed controls inside an <ion-item> (item.scss, item.md.scss, label.md.scss, select.md.scss,
// datetime.md.scss; [CSS] 14522-14524, 14628-14640, 14746-14774, 15534-15547, 13435-13442)
// ---------------------------------------------------------------------------------------------------
export const itemMd = {
  fontSize: 16, // item.md.scss $item-md-font-size 1.6rem ([CSS] 14628)
  minHeight: 44, // item.scss .item-block min-height 4.4rem ([CSS] 14522)
  paddingLeft: md.itemPaddingLeft, // 16 (item.md.scss .item-md padding-left)
  innerPaddingRight: 8, // .item-md.item-block .item-inner padding-right ($item-md-padding-end / 2) ([CSS] 14635)
  innerBorderBottomWidth: 1, // [CSS] 14635
  innerBorderBottomColor: md.listBorderColor, // #dedede (ionic.globals.md.scss:44 $list-md-border-color)
  backgroundColor: md.backgroundColor, // #fff
  textColor: md.textColor, // #000
  activatedBackground: md.listActivatedBackgroundColor, // #f1f1f1 ([CSS] 14629)
  // label.md.scss: .label-md margin 13px 8px 13px 0 ([CSS] 14769); .item-select/.item-datetime/.item-input .label-md color #999 ([CSS] 14771)
  label: { marginTop: 13, marginRight: 8, marginBottom: 13, marginLeft: 0, color: '#999' },
  // [CSS] 14639: .item-md [item-left] icons: margin 11px 0 10px 0 + .item-md [item-left] margin-right 8px
  disabledOpacity: 0.4, // select.scss .select-disabled / .item-select-disabled ion-label ([CSS] 15537)
} as const;

export const selectMd = {
  padding: { top: 13, right: 8, bottom: 13, left: 16 }, // select.md.scss .select-md ([CSS] 15543)
  maxWidthPct: 45, // select.scss ion-select max-width 45% ([CSS] 15534)
  textMinWidth: 16, // .select-text min-width 16px ([CSS] 15535)
  placeholderColor: '#999', // $select-md-placeholder-color ([CSS] 15544)
  icon: { width: 12, height: 19 }, // .select-md .select-icon ([CSS] 15546)
  iconInner: { left: 5, top: '50%', marginTop: -3, borderTop: 5, borderSide: 5, color: '#999' }, // [CSS] 15547
} as const;

export const datetimeMd = {
  padding: { top: 13, right: 8, bottom: 13, left: 16 }, // datetime.md.scss .datetime-md ([CSS] 13441)
  placeholderColor: '#999', // ([CSS] 13442)
  textLineHeight: 1.2, // .datetime-text min-height 1.2em, line-height 1.2 ([CSS] 13436)
  textMinWidth: 16,
  disabledOpacity: 0.4, // ([CSS] 13437)
} as const;

// ionic-selectable.component.scss ([IS] / [CSS] 18109-18160)
export const selectableMd = {
  maxWidthPct: 45, // .ionic-selectable max-width 45%
  disabledOpacity: 0.4, // :not(.ionic-selectable-is-enabled) opacity .4
  placeholderColor: '#999',
  value: { paddingTop: 13, paddingBottom: 13, paddingLeft: 16 }, // .ionic-selectable-value + :not(.item-label-stacked) .ionic-selectable-md .ionic-selectable-value
  valueItemMarginBottom: 5, // .ionic-selectable-value-item:not(:last-child)
  icon: { width: 20, top: 20, left: 5, borderTop: 5, borderSide: 5, color: '#999' }, // .ionic-selectable-icon(-inner), -md .ionic-selectable-icon-inner color #999
  // [CSS] 18083-18084: .item-ionic-selectable ion-label { flex: 1; max-width: initial }
  // item states set on the ion-item by the component (ionic-selectable.component ngOnInit/_setIonItem*):
  // `item-input` + `item-ionic-selectable`, `item-input-has-focus` while the modal is open,
  // `item-input-has-value`, ng-valid / ng-invalid / ng-touched copied from the control.
  // [CSS] 14497-14505: item-input md underline states (only where Topbath does not remove the box-shadow/border).
  underline: { focus: primary, valid: '#32db64', invalid: '#f53d3d' },
} as const;

// ---------------------------------------------------------------------------------------------------
// Topbath rules for the registration style form: `.main-field .cs-form ion-list ion-item.cs-select|cs-date`
// ([T] 981-1040 compiled to [CSS] 6543-6563). Same specificity class chain as Ionic's but a longer selector, so
// Topbath wins on every property it sets. Registration pages: registration.html:32-36,81-92,125-136,243-256 and
// the pages that share the markup (customeradd, plumber-add, edit-profile, ...).
// ---------------------------------------------------------------------------------------------------
export const csForm = {
  border: { width: 1, color: '#ccc' }, // [T] 982 / 1025 -> item border: 1px solid #ccc
  paddingLeft: 0, // padding-left: 0 !important
  innerPaddingRight: 0, // .item-inner padding-right: 0 !important
  csDate: {
    height: 40, // [T] 981-983 (height: 40px; min-height: inherit)
    labelPaddingLeft: 16, // ion-label padding-left 16px
    labelFontSize: 14, // ion-label font-size 14px
  },
  csSelect: {
    height: 45, // height: 45px
    marginVertical: 16, // margin: 16px 0
    innerBorderBottomWidth: 0, // .item-inner border-bottom: 0 !important
    labelPaddingLeft: 14,
    labelFontSize: 13,
    selectMaxWidthPct: 75, // ion-select max-width 75%
    selectPadding: { top: 15, right: 8, bottom: 13, left: 16 }, // ion-select padding: 15px 8px 13px 16px
    selectTextFontSize: 13, // .select-text font-size 13px
    arrowColor: scssColors.black, // .select-icon-inner color: $black-clr (#000000)
  },
  errorBorderColor: scssColors.danger, // .error .item-inner { border: 1px solid $danger !important }
  requiredStarColor: scssColors.danger, // .main-field .cs-form ion-list ion-item ion-label span { color: red } ([CSS] 6531)
} as const;

// ---------------------------------------------------------------------------------------------------
// ion-picker (md): picker.scss, picker.md.scss, picker-component.js, picker-column.js, picker-transitions.js,
// Ionic MODE_MD config (config/mode-registry.js:46-47): pickerRotateFactor 0 (a flat list) and pickerScaleFactor 0.81 (every option except
// the selected one is drawn with scale(0.81), picker-column.js:277)
// ---------------------------------------------------------------------------------------------------
export const pickerMd = {
  wrapperHeight: 260, // picker.md.scss:5 $picker-md-height
  wrapperMaxWidth: 500, // picker.scss:6 $picker-max-width
  wrapperBorderTopWidth: 0.55, // picker.md.scss: border-top: $hairlines-width solid #dedede ([CSS] 15012)
  borderColor: md.listBorderColor,
  backgroundColor: md.backgroundColor,
  toolbarHeight: 44, // :7
  buttonHeight: 44, // :9
  buttonColor: primary, // :10 color($colors-md, primary)
  buttonFontSize: 14, // button.md.scss .button-md font-size 1.4rem ([CSS] 12566)
  buttonFontWeight: 400, // .button-md font-weight 500 sits on the <button>; the text span.button-inner gets Topbath's `* { font-weight: 400 }`
  buttonPaddingHorizontal: 15.4, // .button-md padding 0 1.1em at 14px ([CSS] 12566)
  buttonActivatedBackground: 'rgba(158, 158, 158, 0.2)', // .button-clear-md.activated ([CSS] 12580)
  rippleColor: '#999', // .button-clear-md .button-effect ([CSS] 12582)
  columnsHeight: 216, // :43 $picker-md-height - $picker-md-toolbar-height
  perspective: 1800, // :44
  columnPaddingHorizontal: 8, // :14 $picker-md-column-padding-end/start
  optFontSize: 22, // :28
  optScale: 0.81, // MODE_MD pickerScaleFactor: applied to the options that are not selected
  optLineHeight: 42, // :29 $picker-md-option-height
  optHeight: 43, // :105 .picker-md .picker-opt height: 4.3rem  (also the step the wheel snaps to: picker-column.js optHeight = clientHeight)
  optsTop: 77, // :30 $picker-md-option-offset-y: ((260 - 44) / 2) - (42 / 2) - 10
  optColor: md.textColor, // :27
  optSelectedColor: primary, // :31
  // .picker-above-highlight / .picker-below-highlight: styled in picker.md.scss:48-69 but `display: none` from picker.scss:119 stays
  // (md never sets display: block, unlike ios), so they are not drawn.
  maxVisibleOffset: 170, // picker-column.js update(): |translateY| > 170 hides the option
  tapAnimationMs: 150, // picker-column.js optClick -> setSelected(index, 150); refresh() uses 150 too
  decelerationFriction: 0.97, // picker-options.js DECELERATION_FRICTION
  frameMs: 1000 / 60, // FRAME_MS
  maxSpeed: 60, // MAX_PICKER_SPEED
  // picker-transitions.js PickerSlideIn / PickerSlideOut
  enter: { duration: 400, backdropOpacity: [0.01, 0.26] as const },
  leave: { duration: 450, backdropOpacity: [0.26, 0] as const },
  easing: [0.36, 0.66, 0.04, 1] as const,
  // components/datetime/datetime.js divyColumns: 17 px per character
  charWidth: 17,
} as const;

// ---------------------------------------------------------------------------------------------------
// ion-modal (md) as used by ModalController in ionic-selectable / ionic-select-searchable.
// modal.md.scss, modal-transitions.js (ModalMDSlideIn / ModalMDSlideOut), [CSS] 14941-14955
// ---------------------------------------------------------------------------------------------------
export const modalMd = {
  // On phones (width < 768 px) ion-backdrop is `visibility: hidden` and the wrapper is full screen.
  enter: { duration: 280, easing: [0.36, 0.66, 0.04, 1] as const, translateY: [40, 0] as const, opacity: [0.01, 1] as const },
  leave: { duration: 200, easing: [0.47, 0, 0.745, 0.715] as const, translateY: [0, 40] as const, opacity: [0.99, 0] as const },
  backgroundColor: md.backgroundColor,
} as const;

// ---------------------------------------------------------------------------------------------------
// The modal page of ionic-selectable / select-searchable (ion-header > ion-navbar + ion-toolbar(searchbar),
// ion-content > ion-list > button[ion-item], ion-footer). [CSS] 14000-16760, measured in [M] modal.html.
// ---------------------------------------------------------------------------------------------------
export const selectableModal = {
  toolbar: {
    minHeight: md.toolbarHeight, // toolbar.md.scss .toolbar-md min-height 56px ([CSS] 16714)
    padding: md.toolbarPadding, // 4px
    background: '#f8f8f8', // .toolbar-background-md ([CSS] 16715)
    borderColor: '#b2b2b2',
  },
  // header-md::after / footer-md::before shadow strip ([CSS] 16716-16718): 16x7 px PNG repeated, 5px (2px) visible
  headerShadow: { height: 5, offsetY: 2 },
  footerShadow: { height: 2 },
  // ion-title in the navbar: [CSS] 16720 .toolbar-title-md padding 0 12px, font-size 2rem, weight 500, #424242,
  // overridden for the span by Topbath [T] 5296-5312 + 12726-12731: span { font-size: 16px; color: #040404 !important }
  // The title text is a <span> (ionic-selectable modal template), so `* { font-weight: 400 }` (main.css) wins over the 500 of the div.
  title: { paddingHorizontal: 12, fontSize: 16, fontWeight: 400, color: '#040404' },
  // ion-buttons start in md sorts AFTER the title ([CSS] 16721: order 4 vs content 3), so the close X is at the right edge.
  closeButton: { marginHorizontal: 2, paddingHorizontal: 5, height: 32, borderRadius: 2, fontSize: 14 /* icon 1.2em */, iconSize: 16.8, iconColor: '#151414' /* [T] 12726 */ },
  searchbar: {
    // Topbath ion-searchbar { padding: 0 16px !important } ([T] 9827 -> [CSS] 8023); the .toolbar .searchbar-md padding is overridden
    paddingHorizontal: 16,
    // .searchbar-md .searchbar-input (0,2,0) beats Topbath's `ion-searchbar .searchbar-input-container input` (0,1,2):
    // font-size 1.6rem, padding 6px 55px, height auto, color #141414; only the !important parts of Topbath win:
    // line-height 30px, border-radius 30px ([CSS] 8024, 15380)
    inputPaddingVertical: 6,
    inputPaddingHorizontal: 55,
    inputFontSize: 16,
    inputLineHeight: 30,
    inputRadius: 30,
    inputColor: '#141414',
    inputBackground: '#fff',
    placeholderColor: '#aeaeae', // [CSS] 15383
    shadow: '0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.2), 0 1px 5px 0 rgba(0,0,0,0.12)', // [CSS] 15380
    icon: { left: 16, top: 11, size: 21, bgSize: 20, color: '#5b5b5b' }, // .searchbar-md .searchbar-search-icon ([CSS] 15376-15378)
    clearIcon: { right: 13, size: 22, color: '#5b5b5b' }, // .searchbar-md .searchbar-clear-icon ([CSS] 15384); only while focused and has a value ([CSS] 15273)
    debounceMs: 250, // searchbar.js debounce default; ionic-selectable searchDebounce = 250
  },
  list: {
    // button[ion-item]: [CSS] 14522 min-height 44; icon item-left 28px (ion-icon font-size 2.8rem) with margin 11/8/10/0 -> 49 px rows [M]
    rowHeight: 49,
    iconSize: 28,
    iconWidth: 24,
    iconMargin: { top: 11, right: 8, bottom: 10 },
    selectedIconColor: primary, // [color]="selected ? 'primary' : 'daek'" ('daek' is a typo: no such colour -> inherits #000)
    unselectedIconColor: md.textColor,
    innerMarginLeft: 24, // [CSS] 14640 ion-icon[item-left] + .item-inner margin-left 24px
    // Topbath ion-list button .item-inner .input-wrapper ion-label span { white-space: normal; font-size: 14px } ([T] 8405)
    textFontSize: 14,
  },
  message: { margin: 16, fontSize: 14 }, // <div margin>{{searchFailText}}</div>: [margin] = 16px; ion-content font-size 1.4rem
  footer: { height: 56, paddingTop: 5, paddingBottom: 4, paddingHorizontal: 16, colPadding: 5, buttonHeight: 36 }, // ionic-selectable-modal ion-footer ion-toolbar padding 5px 16px ([CSS] 18159); .button-md height 3.6rem
  button: { background: primary, color: '#fff', fontSize: 14, fontWeight: 400 /* text in span.button-inner: `* { font-weight: 400 }` beats .button-md 500 */, disabledOpacity: 0.4 /* [CSS] 12479 */ },
  searchPlaceholder: 'Search', // ionic-selectable searchPlaceholder default
  searchFailText: 'No items found.', // searchFailText default
  clearButtonText: 'Clear',
  confirmButtonText: 'OK',
  closeButtonText: 'Cancel', // only shown in ios mode (showWhen="ios"); kept for completeness
} as const;

// the 16x7 header/footer shadow PNG, [CSS] 16716 (data URI, base64)
export const headerShadowPng =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAHBAMAAADzDtBxAAAAD1BMVEUAAAAAAAAAAAAAAAAAAABPDueNAAAABXRSTlMUCS0gBIh/TXEAAAAaSURBVAjXYxCEAgY4UIICBmMogMsgFLtAAQCNSwXZKOdPxgAAAABJRU5ErkJggg==';

// SVG paths of the md searchbar icons (viewBox 0 0 512 512), [CSS] 15376 / 15384
export const searchIconPath =
  'M337.509,305.372h-17.501l-6.571-5.486c20.791-25.232,33.922-57.054,33.922-93.257C347.358,127.632,283.896,64,205.135,64C127.452,64,64,127.632,64,206.629s63.452,142.628,142.225,142.628c35.011,0,67.831-13.167,92.991-34.008l6.561,5.487v17.551L415.18,448L448,415.086L337.509,305.372z M206.225,305.372c-54.702,0-98.463-43.887-98.463-98.743c0-54.858,43.761-98.742,98.463-98.742c54.7,0,98.462,43.884,98.462,98.742C304.687,261.485,260.925,305.372,206.225,305.372z';
export const clearIconPoints =
  '405,136.798 375.202,107 256,226.202 136.798,107 107,136.798 226.202,256 107,375.202 136.798,405 256,285.798 375.202,405 405,375.202 285.798,256';


// ---------------------------------------------------------------------------------------------------
// Topbath `.edit ion-list ion-item ...` pages (add-leave, travel-add, add-order, dealer-addorder, quotation, ...).
// [T] 8855-9010 (+ the older duplicate set compiled at [CSS] 7957-7982), cascade checked in main.css:
//  - [CSS] 7865 / 7960 `.edit ion-list ion-item { background: transparent !important; padding: 0 !important; box-shadow: none !important }`
//    and 7866 / 7961 `.item-inner { padding-right: 0 !important; border: none !important }` (the cs-* variants below beat the
//    border one with a longer selector, both !important).
//  - ionic-selectable's own arrow rule is `.select-searchable-icon .select-searchable-icon-inner`: the class names of
//    select-searchable, so it matches <select-searchable> only; <ionic-selectable> uses .ionic-selectable-icon(-inner) and keeps top 20 / left 5.
// ---------------------------------------------------------------------------------------------------
export const editForm = {
  itemPaddingLeft: 0, // [CSS] 7865 padding: 0 !important
  innerPaddingRight: 0, // [CSS] 7866
  // `<ion-label floating>` ([CSS] 7867 + 7962 + 7394 + 7901; Ionic label.md.scss `.label-md[floating]` [CSS] 14773-14776 gives the
  // transform-origin left top, margin-left/bottom 0 and the 150 ms transition). Both transforms carry !important and 7867's selector is
  // more specific than 7901's, so the label is ALWAYS translate3d(0, 10px, 0) scale(.8), with or without a value.
  floatingLabel: {
    fontSize: 13, // 7867 / 7962
    lineHeight: 14, // 7394
    color: '#a1a1a1', // 7962 (beats `.input-has-focus .label-md[floating] { color: primary }`, 14775, by specificity)
    paddingLeft: 10,
    marginTop: 0, // 7867 margin-top: 0; margin-bottom 0 from 14774; margin-right 8 from .label-md
    marginRight: 8,
    translateY: 10,
    scale: 0.8,
    spanBackground: '#fff', // 7868 `span { background: #fff; padding: 0 5px }`
    spanPaddingHorizontal: 5,
    strongColor: scssColors.danger, // 7869 `span strong { color: red }` (#ff0000 = $danger)
  },
  // item-label-floating: `.item-label-floating ion-datetime { padding-left: 0; width: 100% }` ([CSS] 13438), `.item-label-floating .select-md { padding-left 0; padding-top/bottom 8 }` (14507, padding-left overridden below)
  datetime: {
    borderColor: '#b5b5b5', // [CSS] 7965 `ion-datetime { border: 1px solid #b5b5b5; font-size: 13px; height: 35px; color: #000 }`
    height: 35,
    fontSize: 13,
    textPaddingLeft: 12, // 7966 `.datetime-text { padding-left: 12px }`
  },
  select: {
    borderColor: '#b5b5b5', // [CSS] 7967 `ion-select { border: 1px solid #b5b5b5; font-size: 13px; padding-left: 8px }`
    fontSize: 13,
    paddingLeft: 8,
  },
  csSelect: {
    minHeight: 35, // [CSS] 7874
    marginBottom: 16,
    innerBorderColor: '#dedede', // 7875 border: solid 1px #dedede !important
    label: { fontSize: 12, lineHeight: 30, paddingLeft: 10 }, // 7876 (margin 0; display flex; align-items center)
    valuePadding: { top: 9, right: 10, bottom: 8, left: 10 }, // 7877
    valueFontSize: 13, // 7878 (+ text-overflow/overflow inherit, white-space normal, word-break break-all)
    arrow: { top: '50%' as const, left: 4 }, // 7879 (select-searchable only, see above)
  },
  csNormalSelect: {
    minHeight: 35, // [CSS] 7881
    height: 35,
    marginBottom: 15,
    innerBorderColor: '#dedede', // 7882
    label: { fontSize: 12, lineHeight: 30, paddingLeft: 10 }, // 7883 (margin 0, no flex)
    select: { padding: { top: 0, right: 8, bottom: 0, left: 16 }, textFontSize: 13, textColor: scssColors.black, textLineHeight: 18 }, // 7884-7885 (color: #000 !important also paints the placeholder)
  },
  csSelectable: {
    minHeight: 35, // [CSS] 7888
    marginBottom: 16,
    innerBorderColor: '#ccc', // 7889
    labelSpan: { fontSize: 13, lineHeight: 35, paddingLeft: 10 }, // 7891 (label: margin 0; display flex; align-items center)
    valuePadding: { top: 9, right: 10, bottom: 8, left: 10 }, // 7892
    valueFontSize: 13, // 7893 (white-space normal; no word-break)
    arrow: { top: '50%' as const, left: 4 }, // 7894 (select-searchable only)
  },
} as const;
