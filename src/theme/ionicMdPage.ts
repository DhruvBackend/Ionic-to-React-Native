// Ionic 3.9.5 md values for the page structure of plan Task 9 part 4: the navbar/toolbar/header, the tab bar
// and the page + modal transitions, plus every Topbath global rule that reaches them. Citations:
//   [I] = ionic-angular@3.9.5/<file>:<line> (SCSS or compiled JS source)
//   [T] = Topbath src/theme/variables.scss:<line>
//   [CSS] = line of the shipped build/main.css (topsan.aab) after splitting on "}" (same numbering as
//           ionicMdPickers.ts), used to settle which rule wins. Topbath's rules are emitted BEFORE Ionic's
//           component CSS (main.css 6xxx-8xxx vs 15xxx+), so at equal specificity Ionic wins; only !important
//           or a more specific selector in variables.scss wins.
//   [M] = measured in headless Chrome 156 with the shipped main.css and the DOM Ionic renders (classes copied
//         from the navbar.js / toolbar.js / tab-button.js / tabs.js templates). Used where several rules
//         interact (e.g. the global `span { margin: 0 !important }`).
import { ionicColors, scssColors } from './index';
import { md } from './ionicMd';
import { modalMd } from './ionicMdPickers';

const primary = ionicColors.primary;

// ---------------------------------------------------------------------------------------------------
// Page transition: push / pop in ion-nav (config/mode-registry.js:43 md pageTransition 'md-transition'),
// transitions/transition-md.js
// ---------------------------------------------------------------------------------------------------
export const pageTransition = {
  // transition-md.js:10 OFF_BOTTOM = '40px' (the plan's "56px" is not in the 3.9.5 source).
  // Forward push (:25-28): only the ENTERING page animates, translateY 40px -> 0 and opacity .01 -> 1, 280 ms, easing
  // cubic-bezier(0.36,0.66,0.04,1); the page below is not animated and is hidden once the transition ends.
  // setRoot / reset does NOT animate: nav-controller-base.js:145-152 setPages sets opts.animate = false unless
  // animate === true, and Topbath never passes it. Old pages unmount at once.
  enter: { duration: 280, easing: [0.36, 0.66, 0.04, 1] as const, translateY: [40, 0] as const, opacity: [0.01, 1] as const },
  // Back (:22-23, :52-56): only the LEAVING page animates, translateY 0 -> 40px and opacity 1 -> 0, 200 ms, easing
  // cubic-bezier(0.47,0,0.745,0.715); the page that comes back is not animated (it is shown underneath).
  leave: { duration: 200, easing: [0.47, 0, 0.745, 0.715] as const, translateY: [0, 40] as const, opacity: [1, 0] as const },
} as const;

// ModalController page (ModalMDSlideIn / ModalMDSlideOut, components/modal/modal-transitions.js): the same
// 40 px / 280 ms in (the plan's "400 ms" is the ios-style ModalSlideIn, not the md one) and 200 ms out with
// opacity .99 -> 0. The backdrop is hidden on phones, so only the wrapper moves (ionicMdPickers.ts modalMd).
export const modalTransition = modalMd;

// ---------------------------------------------------------------------------------------------------
// ion-header / ion-toolbar / ion-navbar (components/toolbar/toolbar.md.scss, toolbar.scss, navbar.js)
// ---------------------------------------------------------------------------------------------------
export interface ToolbarColorSet {
  background: string; // .toolbar-md-<color> .toolbar-background-md
  text: string; // title + default bar-button colour
  ripple?: string; // .button-effect colour of bar-buttons; undefined = the generic #555 ([CSS] 12585)
}
export const toolbarColors = {
  // .toolbar-background-md [CSS] 16715 #f8f8f8; title/buttons $toolbar-md-text-color #424242 ([I] ionic.globals.md.scss:27)
  default: { background: '#f8f8f8', text: md.toolbarTextColor },
  // .toolbar-md-primary [CSS] 16748-16750: background primary, title/buttons/ripple #fff
  primary: { background: primary, text: scssColors.white, ripple: scssColors.white },
  // .toolbar-md-white [CSS] 17192-17194
  white: { background: '#fff', text: md.toolbarTextColor, ripple: md.toolbarTextColor },
  // .toolbar-md-light [CSS] 16970-16972
  light: { background: ionicColors.light, text: md.toolbarTextColor, ripple: md.toolbarTextColor },
} as const satisfies Record<string, ToolbarColorSet>;
export type ToolbarColor = Exclude<keyof typeof toolbarColors, 'default'>;

export const toolbarMd = {
  padding: md.toolbarPadding, // toolbar.md.scss:42-45 .toolbar-md padding 4px ([CSS] 16714)
  minHeight: md.toolbarHeight, // 56 ([CSS] 16714; $toolbar-md-height ionic.globals.md.scss:23)
  // [T] 717 .main-header ion-navbar { min-height: 52px } (0,1,1) beats .toolbar-md (0,1,0) ([CSS] 6497) [M] navbar 52
  mainHeaderMinHeight: 52,
  // [T] 718 .main-header ion-navbar { box-shadow: 0 3px 6px 0 rgba(0,0,0,.2) }; .remove sets none ([T] 736, [CSS] 6500)
  mainHeaderShadow: '0 3px 6px 0 rgba(0, 0, 0, 0.2)',
  // [CSS] 4486 .h80 { height: 80px !important } on <ion-toolbar class="h80" color="white"> (Language) and <ion-navbar class="h80"
  // color="white"> (mobile-login, otp, select-registration-type). [M] reference probe (Language): toolbar 360x80 at 0,0 (min-height 56
  // kept, padding 4 inside the 80: box-sizing border-box), display flex / align-items center / overflow hidden, .toolbar-background
  // 360x80 #fff (toolbar-md-white), .toolbar-content 352x0 at (4,40) i.e. vertically centred, ion-header 360x80 with its
  // header-md::after strip at y 80 (5px, bg-position top -2px), z-index 10; the strip is unaffected by h80.
  tallHeight: 80,
  // [T] 816-820 .toolbarHeight { min-height: 0 !important; padding-top: 0 !important; padding-bottom: 10px !important }
  toolbarHeight: { minHeight: 0, paddingTop: 0, paddingBottom: 10 },
  // ion-header::after strip: header-md::after, the 16x7 png of ionicMdPickers.ts headerShadowPng, 5 px tall with its
  // top 2 px cut off ([CSS] 16716). Removed by the [no-border] attribute ([CSS] 16718), by [T] 754-756
  // .main-header.remove::after ([CSS] 6503) and by page rules such as `page-profile ion-header:after` ([CSS] 18430).
  headerStrip: { height: 5, offsetY: 2 },
  headerZIndex: 10, // [CSS] 12349 ion-header { z-index: 10 }
  title: {
    // .toolbar-title-md [CSS] 16720: padding 0 12px; font-size 2rem; weight 500; colour = the toolbar's text colour
    paddingHorizontal: 12,
    fontSize: 20,
    fontWeight: 500,
    // [T] 724-731 .main-header ion-navbar .toolbar-content ion-title .toolbar-title (0,3,2) beats .toolbar-title-md:
    // padding 0 12px; font-size 16px; colour $white (even on a navbar that is not primary); weight normal
    mainHeaderFontSize: 16,
    mainHeaderFontWeight: 400,
    mainHeaderColor: scssColors.white,
  },
  // .bar-button-md [CSS] 16726: height 32px, padding 0 5px, radius 2px. The md margins (.back-button-md 0 6px,
  // .bar-button-menutoggle-md 0 6px, .bar-button-md 0 .2rem) are all zeroed because the global
  // [T] 390-403 `h1..h6, p, span, button, input { margin: 0 !important }` ([CSS] 6438) wins; [M] back button x = 4 (the toolbar padding)
  barButton: { height: 32, paddingHorizontal: 5, borderRadius: 2 },
  backButton: {
    minWidth: 44, // .back-button-md [CSS] 16739
    iconName: 'md-arrow-back', // config/mode-registry.js:35 backButtonIcon (md); backButtonText '' (:34)
    iconSize: 24, // .back-button-icon-md [CSS] 16740: font-size 2.4rem, padding 0 6px [M] icon box 28.03 x 24
    iconPaddingHorizontal: 6,
  },
  // .bar-button-md[icon-only] ion-icon [CSS] 16738: min-width 28px, padding 0 .1em, font-size 1.8em of 14px = 25.2px
  // [M] icon-only button 28 x 32. ion-buttons itself has `margin: 0 .2rem` ([CSS] 16015) = 2px each side.
  iconOnlyButton: { iconSize: 25.2, minWidth: 28 },
  buttonsMarginHorizontal: 2,
  // .bar-button-menutoggle-md [CSS] 16741-16742: min-width 44px, padding 0 2px, icon padding 0 6px, font-size 2.4rem;
  // flex order 1 (start side), 7 when [end] (min-width 28px, margin 0 2px)
  menuToggle: { minWidth: 44, paddingHorizontal: 2, iconName: 'md-menu', iconSize: 24, iconPaddingHorizontal: 6 },
  // [T] 737-740 .main-header.remove ion-navbar button { display: inherit !important; color: $white } ([CSS] 6501)
  // vs [T] 720-722 .main-header ion-navbar button { display: none !important } ([CSS] 6498)
  removeButtonColor: scssColors.white,
  // [I] toolbar.md.scss order map ([CSS] 16719-16725, 16741, 16743): back 0, menuToggle 1, [left] 2, title 3,
  // [start] 4, [end] 5, [right] 6, menuToggle[end] 7. Note [start] buttons sort AFTER the title in md.
} as const;

// ---------------------------------------------------------------------------------------------------
// ion-footer (components/toolbar/toolbar.md.scss, toolbar.scss; [CSS] 12349 / 16716 / 16717)
// ---------------------------------------------------------------------------------------------------
export const footerMd = {
  // [CSS] 12349 `ion-footer { left: 0; bottom: 0; position: absolute; z-index: 10; display: block; width: 100% }` [M] Language page: footer
  // 360x36 at (0,764) of the 800px page; background transparent (the ion-content's white shows behind it); no padding / border.
  // ion-content gets `margin-bottom` = the footer height (scroll-content margin 80px 0 36px), which a flex column does by itself.
  zIndex: 10,
  // [CSS] 16716-16717 `.footer-md::before { top: -2px; bottom: auto; height: 2px; left: 0; width: 100%; position: absolute;
  // background: url(<16x7 png>) repeat-x; background-position: left 0 top 0 }` [M] ::before at top -2, 360x2, position 0 0, repeat-x:
  // the top 2 px of the same png the header strip uses, drawn ABOVE the footer. `[no-border]` ([CSS] 16718) hides it; Topbath hides it
  // for `.csm-footer-tabs` ([CSS] 7284 `.csm-footer-tabs:before { display: none }`), `ion-footer.before-btn:before` ([CSS] 8223) and (together with the
  // header-md one) `.af-none:after, .af-none:before { box-shadow: none !important; background-image: inherit !important }` ([CSS] 946).
  strip: { height: 2, offsetY: 0, top: -2 },
  // [CSS] `[padding] { padding: 16px }` (`ion-app.md [padding]`, contentMd; [CSS] 13359; [I] components/app/app.scss:154) = ionPadding: [M] footer 360x68 at y 732 with the
  // full button 328x36 at (16,748). A non-toolbar footer has NO safe-area padding: only `.md ion-footer .toolbar:last-child` ([CSS] 18064)
  // adds env(safe-area-inset-bottom) (0 in the reference), and it equals the toolbar's own 4px padding / 56px min-height.
  // `button ion-button full` inside: width 100% (the button is a block, margin 0 by the global `button { margin: 0 !important }`), radius 0,
  // height 36, box-shadow of a raised md button [M] button 360x36 at (0,764) -> see IonButton.
} as const;

// ---------------------------------------------------------------------------------------------------
// ion-tabs md ([I] components/tabs/tabs.md.scss, tabs.scss, tab-button.js template) + Topbath's tab rules
// ([T] 1569-1752 stacked `ion-tabs .tabbar` blocks, [T] 7143-7240, [T] 7369)
// ---------------------------------------------------------------------------------------------------
export const tabsMd = {
  // config/mode-registry.js:51-53 tabsHighlight false, tabsPlacement 'bottom', tabsHideOnSubPages false;
  // components/tabs/tabs.js:241 tabsLayout 'icon-top'. forRoot() in app.module.ts:202 passes no config.
  tabbar: {
    // [T] 1710 `ion-tabs .tabbar { background: $white !important }` ([CSS] 6659)
    background: scssColors.white,
    // [T] 1711 box-shadow `0 1px 7px 6px rgba(0,0,0,.1)` ([CSS] 6659) is replaced by the later equal-specificity
    // [T] 7146 `ion-tabs .tabbar { box-shadow: 0 -3px 6px 0 rgba(0,0,0,.1) }` ([CSS] 7563); [M] confirmed
    shadow: '0 -3px 6px 0 rgba(0, 0, 0, 0.1)',
    // [T] 1732-1735 / [T] 7186-7188 `.tabbar:before` is hidden, so the md 2px strip ([CSS] 16716) is not drawn
  },
  tab: {
    // [T] 7148 `.tab-button { min-height: 50px !important }` beats [T] 1717 46px and tabs.md.scss:22 5.6rem; [M] bar 50
    minHeight: 50,
    // [T] 1572 `ion-tabs .tabbar a { padding: 5px !important }` ([CSS] 6639)
    padding: 5,
    // [T] 1747 `.tab-button[aria-selected=true] { border-bottom: solid 3px $primary }` ([CSS] 6667) is later than
    // [T] 1676 (4px, same colour), so 3 px; the border is inside the 50 px (border-box) [M]
    selectedBorderBottom: 3,
    background: scssColors.white, // [T] 7149 `.tab-button { background: $white }`
  },
  icon: {
    // .tabs-md .tab-button-icon: min-width 2.4rem, margin-top 1px; [T] 1578 `ion-icon.ion-md-tab-* { height: 20px }`
    // [M] the ion-icon box is 24 x 20 at margin-top 1; the SVG is `no-repeat center` in it at background-size 20px (18px for points)
    width: 24,
    height: 20,
    marginTop: 1,
    inactiveOpacity: 0.2, // [T] 1714 `ion-tabs .tabbar a ion-icon { opacity: 0.2 }`
    activeOpacity: 1, // [T] 1724 `.tab-button[aria-selected=true] ion-icon { opacity: 1 }`
    // The selected icon's `translate3d(0,-2px,0)` and the label's scale3d(1.16667) of tabs.md.scss are cancelled by
    // [T] 1696-1702 `[aria-selected=true] ion-icon / span { transform: scale(1.0) !important }` ([CSS] 6657-6658).
  },
  label: {
    // [T] 1729 `span { font-size: 10px !important }` (later than the 9px of [T] 1646) beats .tabs-md .tab-button-text 1.2rem
    fontSize: 10,
    // `* { font-weight: 400 }` ([T] 7835-7838, [CSS] 7687) matches the span itself, so the selected anchor's
    // `font-weight: bold` ([T] 1722) and `font-size: 13px !important` ([T] 1721) are not inherited by the label [M] 400
    fontWeight: 400,
    // [T] 1718 `.tab-button { letter-spacing: $letter-space }` ($letter-space 1px, [T] 262), inherited by the label
    letterSpacing: 1,
    // [T] 7181-7184 `.tab-button .tab-button-text { color: #888888 }` and the selected
    // [T] 7236-7241 `.tab-button[aria-selected=true] .tab-button-text { color: #002d25 }` (same (0,3,1), later wins) [M].
    // NOTE (parity): the selected anchor's `color: #000 !important` ([T] 1720) only colours the anchor, not the label.
    inactiveColor: '#888888',
    activeColor: primary,
    // the global `span { margin: 0 !important }` ([T] 390-403) wins over `.tabs-md[tabsLayout=icon-top] .has-icon .tab-button-text`
    // margin-top 4px; [M] the label starts right under the icon box
    marginTop: 0,
  },
  // NOTE (parity): `.tabbar a:gt(3) { display: none !important }` ([T] 7369) is not valid CSS (jQuery's :gt()), so the
  // browser drops the whole rule and all five tabs show [M]; nothing to port.
  // NOTE (parity): tabs have no ripple: `.md button .button-effect { display: block }` ([CSS] 12586) only matches
  // <button>, the tab is an <a>, and no rule styles `.activated` on it.
} as const;
