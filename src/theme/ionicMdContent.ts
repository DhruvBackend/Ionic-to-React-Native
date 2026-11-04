// Ionic 3.9.5 md values for the content controls of plan Task 9 part 5A: ion-content, ion-grid/row/col, ion-button,
// ion-list / ion-item / ion-label / ion-list-header, ion-input / ion-textarea, ion-radio (+ radio-group), ion-checkbox
// and ion-card, plus the Topbath global rules that reach them. Citations:
//   [I]   = ionic-angular@3.9.5/<file>:<line> (SCSS or compiled JS source)
//   [T]   = Topbath src/theme/variables.scss:<line>  (T:<page>.scss for a page stylesheet that leaks globally)
//   [CSS] = line of the shipped build/main.css (topsan.aab) after splitting on "}" (same numbering as
//           ionicMdPickers.ts / ionicMdPage.ts). Topbath's rules are emitted BEFORE Ionic's component CSS (main.css
//           6xxx-8xxx vs 12xxx+), so at equal specificity Ionic wins; only !important or a longer selector wins.
//   [M]   = measured in headless Chrome 156 with the shipped main.css and the DOM Ionic renders (classes copied from
//           the Ionic templates), scratchpad p3/h/content.html. Used where several rules interact (e.g. the global
//           `button, input, span { margin: 0 !important }` or `* { font-weight: 400 }`).
// Usage survey (grep of ACTIVE markup in src/pages/**/*.html, i.e. after stripping HTML comments): ion-item 324, ion-label 324
// (222 `floating`), ion-input 208, ion-list 106 (5 are `<ion-list radio-group>`), ion-textarea 18, ion-radio 12, ion-checkbox 4,
// ion-list-header 7, ion-col 10, ion-row 2, ion-grid 1, ion-card 1, ion-card-header 1; `button ion-button` 101 (block 41, round 38,
// full 10, icon-only 11, small 1, clear 2, outline 0), `a ion-button` 5, `button ion-item` 19. NOT used anywhere: ion-toggle,
// ion-badge, ion-avatar, ion-thumbnail, ion-note, ion-item-divider, ion-item-sliding, ion-range, ion-card-title, ion-card-content,
// [clearInput], [stacked]/[fixed] labels. Not modelled: the 6 `tabindex` attributes (no effect on touch devices); autocomplete (8) and
// autocorrect (5) attributes on ion-input are all "off", which is also Ionic's default (inputMd.autocomplete / autocorrect).
import { ionicColors, scssColors } from './index';
import { md } from './ionicMd';
import { appFontSize } from './ionicMdOverlays';

// ---------------------------------------------------------------------------------------------------
// Ionic colour helpers (themes/ionic.functions.scss), so a client's colours.ionic map gives the same
// derived colours the Sass compile produced (checked against the shipped CSS for the Topsan palette).
// ---------------------------------------------------------------------------------------------------
type Rgb = [number, number, number];

export function parseHex(hex: string): Rgb {
  const h = hex.replace('#', '');
  const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
}
const toHex = ([r, g, b]: Rgb) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

// Sass mix($a, $b, $weight): weight of $a (both opaque)
function mix(a: Rgb, b: Rgb, weight: number): Rgb {
  return [0, 1, 2].map(i => a[i] * weight + b[i] * (1 - weight)) as Rgb;
}

// ionic.functions.scss:98-112 color-shade: mix with white (lightness <= 50%) or black (> 50%), default 8%
export function colorShade(hex: string, amount = 0.08): string {
  const [r, g, b] = parseHex(hex);
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const lightness = ((max + min) / 2) * 100;
  return toHex(mix(lightness > 50 ? [0, 0, 0] : [255, 255, 255], [r, g, b], amount));
}

// ionic.functions.scss:49-71 color-inverse (what color-contrast() returns for a colour with no explicit contrast)
export function colorContrast(hex: string): string {
  const [r, g, b] = parseHex(hex);
  const brightness = ((r * 0.299 + g * 0.587 + b * 0.114) / 255) * 100;
  if (brightness > 79 || g > 240 || (r > 220 && g > 180)) {
    return '#000000';
  }
  return '#ffffff';
}

// ---------------------------------------------------------------------------------------------------
// ion-content (components/content/content.md.scss, content.scss, app.scss) + Topbath
// ---------------------------------------------------------------------------------------------------
export const contentMd = {
  textColor: md.textColor, // content.md.scss:4-6 .content-md color $text-md-color
  backgroundColor: md.backgroundColor, // :4-6 background-color $background-md-color #fff ([CSS] 13356)
  padding: 16, // themes/ionic.theme.default.md.scss:16 $content-md-padding ($content-padding 16px, ionic.theme.default.scss:26); [padding] attribute
  // [CSS] 13359 `ion-app.md [padding] { padding: 16px }` applies to ANY element carrying the [padding] attribute (a div, form,
  // ion-footer ...), not only ion-content: screens use `ionPadding` (below) for those; IonContent has its own `padding` prop.
  // [CSS] 13300 ion-content { position: relative; display: block; width: 100%; height: 100% }, 13303 .scroll-content overflow-y: scroll.
  // NOTE (parity): [T] `.scroll-content { border-top: inherit !important }` ([CSS] 7163) inherits the (absent) border of
  // ion-content, so it draws nothing; nothing to port.
} as const;

// `<div padding>`, `<form padding>`, `<ion-footer padding>`: style to spread on the View that stands for that element.
export const ionPadding = { padding: contentMd.padding } as const;

// ---------------------------------------------------------------------------------------------------
// ion-grid / ion-row / ion-col (components/grid/grid.scss, grid.md has no mode rules, [CSS] 13549-13709)
// ---------------------------------------------------------------------------------------------------
export const gridMd = {
  padding: 5, // grid.scss $grid-padding [CSS] 13549 .grid { padding: 5px; width: 100%; flex-direction: column }
  colPadding: 5, // [CSS] 13573 .col { padding: 5px; position: relative; width: 100%; flex: 1 0 0; max-width: 100% }
  columns: 12, // $grid-columns; [col-N] flex: 0 0 N/12 * 100%, rounded to 5 places ([CSS] 13698-13709)
} as const;

// [CSS] 13698-13709: `[col-1] { flex: 0 0 8.33333%; width: 8.33333%; max-width: 8.33333% }` ...
export function colWidthPercent(n: number): number {
  return Math.round((n / gridMd.columns) * 100 * 100000) / 100000;
}

// ---------------------------------------------------------------------------------------------------
// ion-button (components/button/button.md.scss, button.scss; [CSS] 12475-12673) + Topbath
// ---------------------------------------------------------------------------------------------------
export type ButtonKind = 'solid' | 'outline' | 'clear';

export const buttonMd = {
  height: 36, // button.md.scss:79 $button-md-height 3.6rem ([CSS] 12565)
  paddingHorizontal: 15.4, // :31 $button-md-padding-end 1.1em of 14px ([CSS] 12565) [M] 15.4
  borderRadius: 2, // :63 $button-md-border-radius
  fontSize: 14, // :66 $button-md-font-size 1.4rem
  fontWeight: 500, // :69 $button-md-font-weight (the button; see textWeight)
  // [M] the label is `<span class="button-inner">` and Topbath's `* { font-weight: 400 }` ([T] 7835-7838, [CSS] 7686) matches that span
  // itself, so the text is drawn at 400, not the button's 500.
  // NOTE (parity): button text is Roboto Regular although .button-md says 500.
  textWeight: 400,
  textTransform: 'uppercase' as const, // :72 $button-md-text-transform
  lineHeight: 1, // [CSS] 12305 `button { line-height: 1 }` (ionic's normalize); `a[ion-button]` keeps `normal`
  shadow: '0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 1px 5px 0 rgba(0, 0, 0, 0.12)', // :78 $button-md-box-shadow
  shadowActivated: '0 3px 5px rgba(0, 0, 0, 0.14), 0 3px 5px rgba(0, 0, 0, 0.21), 0 0 0 0 transparent', // :87 $button-md-box-shadow-activated
  // :20-31 margin .4rem .2rem, but Topbath's global `button { margin: 0 !important }` ([T] 390-403, [CSS] 6437) removes it from
  // every <button>; only `<a ion-button>` keeps it [M] (b7: margin 4px 2px).
  marginAnchor: { vertical: 4, horizontal: 2 },
  // [CSS] 12573-12574 .button-block-md / .button-full-md { margin-left: 0; margin-right: 0 }: an <a ion-button> with block/full keeps only the vertical 4px
  // Radius: .button-round-md ([CSS] 12583) comes after .button-full-md (12574) at equal specificity, so full+round = round (64).
  disabledOpacity: 0.4, // button.scss [CSS] 12478 `[ion-button][disabled], a[disabled], button[disabled] { opacity: .4; pointer-events: none }`
  large: { height: 56, fontSize: 20, paddingHorizontal: 20 }, // :160-172 .button-large-md height 2.8em, font 2rem, padding 0 1em ([CSS] 12569)
  small: { height: 27.3, fontSize: 13, paddingHorizontal: 11.7, iconOnlyIconSize: 18.2 }, // :179-190 2.1em, 1.3rem, 0 .9em; icon 1.4em ([CSS] 12570-12571) [M] 27.3
  round: { paddingHorizontal: 26, borderRadius: 64 }, // button.scss $button-round-padding-end 2.6rem, border-radius 64px ([CSS] 12500) [M] pad 26, br 64
  outlineBorderWidth: 1, // :113 $button-md-outline-border-width ([CSS] 12574)
  outlineHoverShade: 0.05, // :200 mixin md-button-outline: color-shade($color-base, 5%) (outline border + text + ripple) [M] #0d3830
  clearActivatedBackground: 'rgba(158, 158, 158, 0.2)', // :144 $button-md-clear-background-color-activated ([CSS] 12579)
  clearRipple: '#999', // :152 $button-md-clear-ripple-background-color
  // button.scss: .button-inner { display: flex; align-items: center; justify-content: center; width/height 100% }
  // Icons ([CSS] 12483-12486): [icon-start] ion-icon font-size 1.4em, padding-right .3em; [icon-end] padding-left .4em;
  // [icon-only] ion-icon padding 0 .5em, font-size 1.8em; .button[icon-only] padding 0, min-width .9em. [M] icon-only 44.8 x 36 (25.2px icon)
  iconStart: { scale: 1.4, gap: 0.3 },
  iconEnd: { scale: 1.4, gap: 0.4 },
  iconOnly: { scale: 1.8, paddingHorizontal: 0.5, minWidthEm: 0.9 },
  // Topbath: `.cs-btn` ([T] 459-481, [CSS] 6451-6453) -- `button.cs-btn`/`.cs-btn`: background primary !important,
  // width 100%, position relative, margin 0 !important, height 40px !important, color #fff; its span { font-size 12px;
  // line-height 22px; letter-spacing 1px; font-weight normal }; `.cs-btn.re-btn`: height 36px, margin-bottom 43px, line-height 41px
  // (the 41 is on the BUTTON; the label span keeps `.cs-btn span { line-height: 22px }`, [CSS] ~6452, so reLineHeight is not used for the text)
  csBtn: { height: 40, fontSize: 12, lineHeight: 22, letterSpacing: 1, reHeight: 36, reMarginBottom: 43, reLineHeight: 41 },
  // [T] `.green-color { background: $success !important }` (scss success = #002d25 in Topsan),
  // `.red-color { background: $danger !important }`, `.reen-color { background: $primary !important }` ([T] 419-443, [CSS] 6441 / 6444 / 6446)
  greenColorBackground: scssColors.success,
  redColorBackground: scssColors.danger,
  reenColorBackground: scssColors.primary,
  // `button.pdf-btn` ([CSS] 8443): background primary, text-transform capitalize, font-size 16px, font-weight 600, color #fff.
  // The text is in span.button-inner, which `* { font-weight: 400 }` ([CSS] ~7686) keeps at 400 (the 600 is only on the button).
  // NOTE (parity): pdf-btn text is drawn at 400 although the rule says 600. Its background has no !important and a lower specificity
  // than .button-md-primary:active, so the activated shade still applies.
  pdfBtn: { fontSize: 16, fontWeight: 400, textTransform: 'capitalize' as const },
  csBtnText: scssColors.white, // `.cs-btn { color: #fff }`, `button.pdf-btn { color: #fff }` ([CSS] 6451, 8442)
} as const;

export interface ButtonColors {
  solid: { background: string; text: string; activated: string; ripple: string };
  outline: { border: string; text: string; ripple: string };
  clear: { text: string; ripple: string };
}

// button.md.scss mixins md-button-default / md-button-outline / .button-clear-md-<color>: [CSS] 12586-12673.
// A colour that is not in the $colors map (color="theme" in 2 pages, "medium") produces a class with no rule, so the
// button keeps the plain `.button-md` look = primary ([CSS] 12565).
export function buttonColors(color?: string): ButtonColors {
  const map = ionicColors as Record<string, string>;
  const base = (color && map[color]) || ionicColors.primary;
  const text = colorContrast(base);
  const outline = colorShade(base, buttonMd.outlineHoverShade);
  return {
    solid: { background: base, text, activated: colorShade(base), ripple: text },
    outline: { border: outline, text: outline, ripple: outline },
    clear: { text: base, ripple: buttonMd.clearRipple },
  };
}

// ---------------------------------------------------------------------------------------------------
// ion-list / ion-item / ion-label / ion-list-header (list.md.scss, item.md.scss, label.md.scss; [CSS] 14521-14862)
// ---------------------------------------------------------------------------------------------------
export const listMd = {
  marginTop: -1, // list.md.scss:66 margin -1px 0 16px ([CSS] 14836)
  marginBottom: 16,
  // [CSS] 14844 `.list-md + ion-list ion-list-header { margin-top: -16px }` (a list directly after a list)
  adjacentHeaderMarginTop: -16,
  borderColor: md.listBorderColor, // #dedede
  borderWidth: 1, // [CSS] 14837 `.list-md .item-block .item-inner { border-bottom: 1px solid #dedede }`
  // [CSS] 14838 `.list-md > .item-block:last-child .item-inner { border-bottom: 0 }` (the last item of a list has no line)
  // [CSS] 14862 `.list-md .item-input:last-child { border-bottom: 1px solid #dedede }` on the ITEM itself, which wins over the
  // line above: the last input item of a list is 1px taller and has the line [M] ci3 46px.
} as const;

export const itemContentMd = {
  minHeight: 44, // item.scss .item-block min-height 4.4rem ([CSS] 14521)
  paddingLeft: md.itemPaddingLeft, // 16
  innerPaddingRight: 8, // [CSS] 14634 .item-md.item-block .item-inner padding-right 8px
  fontSize: 16, // item.md.scss $item-md-font-size 1.6rem ([CSS] 14627)
  backgroundColor: md.backgroundColor,
  textColor: md.textColor, // item.md.scss $item-md-text-color #000 ([CSS] 14627)
  activatedBackground: md.listActivatedBackgroundColor, // [CSS] 14628 `.item-md.activated { background-color: #f1f1f1 }`
  label: { marginTop: 13, marginRight: 8, marginBottom: 13, marginLeft: 0 }, // [CSS] 14768 .label-md [M] 13px 8px 13px 0
  // [M] ion-label text: 16 px, line-height normal (18 px at 16 px in Chrome's Roboto metrics), black
  // [CSS] `.item-md p { margin: 0 0 2px; font-size: 1.4rem; line-height: normal; color: #666 }` (item.md.scss $item-md-paragraph-*);
  // Topbath `p { margin: 0 !important }` removes the margin. Applies to every <p> inside an ion-item / ion-list-header (both are `.item-md`).
  paragraph: { fontSize: 14, color: '#666' },
  checkboxMargin: { top: 9, right: 36, bottom: 9, left: 4 }, // checkbox.md.scss:120-127 `.item.item-md .checkbox-md` ([CSS] 13211) [M]
  checkboxMarginEnd: { top: 11, right: 10, bottom: 10, left: 0 }, // [item-end]/[item-right] ([CSS] 13212)
  radioMarginEnd: { top: 9, right: 10, bottom: 9, left: 0 }, // radio.md.scss:141-147 `.item-md .radio-md` ([CSS] 15090) [M] ri1c
  radioMarginStart: { top: 11, right: 36, bottom: 10, left: 4 }, // [item-left]/[item-start] ([CSS] 15091)
  controlDisabledOpacity: 0.3, // [CSS] 13210 / 15089 .checkbox-disabled, .radio-disabled, .item-*-disabled ion-label
  // the item's `.button-effect` is only drawn for a <button ion-item> (`.md button .button-effect { display: block }`, [CSS] 12585)
  // [CSS] 12584 .button-effect { background-color: #555; opacity: .2 } = overlay.rippleColor / rippleOpacity
  // NOTE (parity): `[no-lines]` removes the inner border and the item border ([CSS] 14524, 14629, 14843).
} as const;

export const listHeaderMd = {
  // ion-list-header IS an Ionic Item (components/item/item.js selector `ion-list-header, ion-item, [ion-item], ion-item-divider`), so
  // Ionic renders it as `ion-list-header.item.item-md.list-header.list-header-md > div.item-inner > div.input-wrapper > ion-label.label-md`
  // around the projected content (no `item-block` class, so no .item-inner border-bottom) [M] probe of the reference build, Language page.
  background: itemContentMd.backgroundColor, // `.item-md { background-color: #fff }` [M] rgb(255,255,255) for a plain header
  paddingLeft: md.itemPaddingLeft, // list.md.scss:170 padding-left 16 ([CSS] 14852) [M] inner at x 16
  marginBottom: 13, // :171 $list-md-header-margin-bottom ([CSS] 14852) [M] lh2 margin-bottom 13
  minHeight: 45, // :173 4.5rem; `.item-inner` min-height 45 makes the box 46 with the 1px border-top [M] plain 326x46
  borderTopWidth: 1, // :175 $list-md-header-border-top 1px solid #dedede
  borderTopColor: md.listBorderColor,
  fontSize: 14, // :176 1.4rem [M] plain label text 14px 400
  color: '#757575', // :177 [M] rgb(117,117,117); color="x" (.list-header-md-<c>, [CSS] 14854) gives background + contrast colour
  // The label is the ordinary `.label-md`: margin 13px 8px 13px 0, flex 1, overflow hidden, nowrap + ellipsis ([CSS] 14768, [M] 302x16 at 16,15.5)
  // A projected <p> keeps `.item-md p` (itemContentMd.paragraph: 14px #666 400, margin 0 by Topbath's global `p { margin: 0 !important }`).
  // Topbath `ion-list ion-list-header.border-heading` ([T] 9742-9768, [CSS] 8016-8018): background #f8f8f8; margin-bottom 0; border-radius
  // 8px 8px 0 0; border-top 0, AND (the `.item-inner .input-wrapper ion-label` selectors DO match, because of the structure above):
  // label font 16px / 600 / #000, margin-left 15 (margin 13px 8px 13px 15px, [M] label 287x17 at 31,14), plus the ::after bar:
  // position absolute; top 20; left 0; 22x5; #002d25. ion-label is not positioned, so the bar's containing block is the header
  // (`.item-md` is position: relative) [M] bar at header (0,20) 22x5 rgb(0,45,37).
  borderHeading: {
    background: '#f8f8f8',
    radius: 8,
    label: { fontSize: 16, fontWeight: 600, color: '#000', marginLeft: 15 },
    bar: { top: 20, left: 0, width: 22, height: 5, color: ionicColors.primary },
  },
} as const;

// ---------------------------------------------------------------------------------------------------
// ion-input / ion-textarea (components/input/input.scss, input.md.scss; [CSS] 14468-14509) + Topbath
// ---------------------------------------------------------------------------------------------------
export const inputMd = {
  fontSize: 16, // `input { font: inherit }` ([CSS] 12301) from the item's 16px [M] pi2x
  placeholderColor: '#999', // [CSS] 14472-14474 .text-input::placeholder
  // [CSS] 14494 .text-input-md { margin: 13px 8px; padding: 0; width: calc(100% - 8px - 8px) }. BUT Topbath's global
  // `input { margin: 0 !important }` ([T] 390-403, [CSS] 6437) zeroes the margin of every <input> (not <textarea>), so
  // an input is 16px narrower than its wrapper (8 + 8 of the old margins) and has no vertical margin [M] pi2x 305 wide, 18 high.
  inputMargin: 0,
  widthInset: 16,
  floatingWidthInset: 8, // [CSS] 14505 .item-label-floating .text-input-md { margin-left: 0; margin-top: 8px; margin-bottom: 8px; width: calc(100% - 8px) }
  // [CSS] 14505: the <textarea> keeps its margins: 13px 8px, or in a floating item 8px 8px 8px 0 [M] pt1x / pt2x
  textareaMargin: { top: 13, right: 8, bottom: 13, left: 8 },
  textareaFloatingMargin: { top: 8, right: 8, bottom: 8, left: 0 },
  // T:task-close.scss:42-47 (a rule outside the page's wrapper, so it is global, [CSS] 18575):
  // `ion-textarea textarea { height: 100px; font-size: 12px }` [M] pt1x 12px / 100px
  textareaHeight: 100,
  textareaFontSize: 12,
  // [CSS] 12297-12300 textarea::placeholder { padding-left: 2px } (no effect on the glyph position in RN; kept as a note)
  disabledOpacity: 0.4, // [CSS] 14476 .text-input[disabled] { opacity: .4 }
  autocomplete: 'off', // input.js:141 config.get('autocomplete', 'off')
  autocorrect: false, // input.js:142 config.get('autocorrect', 'off')
  // item-input underline states (item.md / input.md [CSS] 14496-14504): same numbers as ionicMdPickers selectableMd.underline
  underline: { focus: ionicColors.primary, valid: '#32db64', invalid: '#f53d3d' },
  // `.cs-form ion-list ion-item.cs-input` ([T] 918-985, [CSS] 6531-6541; the registration style form, see csForm in ionicMdPickers.ts)
  csInput: {
    minHeight: 45, // [T] 920 min-height 45px; [M] ci1 h 45
    marginVertical: 16, // [T] 923 margin: 16px 0 [M]
    paddingLeft: 0, // [T] 921 padding-left 0 !important
    borderWidth: 1, // [T] 934 .item-inner border 1px solid #ccc (all four sides); border-bottom-color #ccc !important
    borderColor: '#ccc',
    innerPaddingRight: 0, // [T] 932
    // [T] 937-950 the label is absolutely positioned: padding-left 16px; margin-top -15px; font-size 14px; floating colour
    // #949494; transform-origin 0 80px. [M] untransformed top = -15 relative to the input-wrapper (static position = top, NOT
    // centred); empty: translate3d(0,27px,0) -> y 12; with value/focus: scale(.8) about (0,80px) -> y = -15 + 16 = 1
    labelPaddingLeft: 16,
    labelMarginTop: -15,
    labelFontSize: 14,
    labelColor: '#949494',
    labelOriginY: 80,
    labelTranslateY: 27, // label.md.scss [CSS] 14772 .label-md[floating] translate3d(0, 27px, 0)
    labelScale: 0.8, // :  with value/focus translate3d(0,0,0) scale(.8)
    // [T] 951-960 `ion-input input { padding-left 13; padding-right 13; padding-top 15; width 100%; margin 0; font-size 13px }`
    // [M] ci1x: 311 x 30 (13px font: line 15 + 15 top padding), sits at the wrapper's top
    inputPadding: { top: 15, right: 13, bottom: 0, left: 13 },
    inputFontSize: 13,
    // [T] 927-929 `ion-textarea { padding: 10px 10px !important }` on the ion-textarea element
    textareaPadding: 10,
    errorColor: scssColors.danger, // [T] 962-978: inner border 1px solid $danger !important; label colour $danger; input colour #000
    errorInputColor: '#000',
  },
  // `.edit ion-list ion-item` pages ([T] 8815-9010, [CSS] 7957-7982): `ion-input, parea { color: #000; font-size: 13px;
  // .text-input { padding-left: 8px } }`, `ion-input input { height: 35px }`
  // `.edit ion-list ion-item .item-inner ion-input { border: 1px solid #b5b5b5; height: 35px }` ([CSS] main.css, the ion-input ELEMENT carries the border; border-box)
  edit: { fontSize: 13, color: '#000', paddingLeft: 8, height: 35, borderWidth: 1, borderColor: '#b5b5b5',
    // Floating items: ion-input is `flex: 1` (basis 0) in the column .input-wrapper, so its height:35 is not used as the flex size;
    // the item grows to the content size = inner `input { height: 35px }` + the 2 border px = 37 (measured on the Ionic QuotationGenrateByPdf: 37).
    floatingHeight: 37 },
  // `.edit ion-list ion-item.cs-textarea1 ion-textarea textarea` ([T] 8857-8873): border 1px #ccc, margin 0 !important,
  // width 100%, height 70px, padding 10px, font-size 13px
  editTextarea: { borderColor: '#ccc', height: 70, padding: 10, fontSize: 13 },
  // `.edit ... .cs-error ion-label { color: $danger } ion-input, ion-textarea textarea { border-color: $danger }` ([T] 9000-9010)
  editErrorColor: scssColors.danger,
} as const;

// ---------------------------------------------------------------------------------------------------
// ion-radio / ion-checkbox (radio.md.scss, checkbox.md.scss; [CSS] 13206-13214, 15084-15093)
// ---------------------------------------------------------------------------------------------------
export const radioMd = {
  size: 16, // .radio-md .radio-icon width/height 16px ([CSS] 15085)
  borderWidth: 2,
  borderColor: '#787878', // :  $radio-md-color-off
  innerSize: 8, // .radio-md .radio-inner 8px at left/top 2px ([CSS] 15086)
  innerOffset: 2,
  transitionMs: 280, // transform 280ms cubic-bezier(.4,0,.2,1)
  easing: [0.4, 0, 0.2, 1] as const,
  checkedColor: ionicColors.primary, // $radio-md-color-on = primary ([CSS] 15086-15087); color="x" uses the colour's own base
  // `.item-radio-checked.item-md ion-label { color: primary }` ([CSS] 15093) [M] ri2l rgb(0,45,37)
} as const;

export const checkboxMd = {
  size: 16, // [CSS] 13207
  borderWidth: 2,
  borderColor: '#787878',
  borderRadius: 2,
  backgroundColor: '#fff',
  checkedColor: ionicColors.primary, // [CSS] 13208
  transitionMs: 280, // background 280ms
  easing: [0.4, 0, 0.2, 1] as const,
  // [CSS] 13216-13232 .checkbox-md-<c> .checkbox-checked .checkbox-inner { border-color: color-contrast }: #fff, but #000 for light / white /
  // warning (see colorContrast); the tick colour below is the default.
  // [CSS] 13208 .checkbox-icon transition-property: background ONLY: the border colour changes at once, the background over 280ms.
  // [CSS] 13209 .checkbox-checked .checkbox-inner: left 4px, top 0, 5 x 10, border 2px (no top/left), colour #fff, rotate(45deg)
  tick: { left: 4, top: 0, width: 5, height: 10, borderWidth: 2, color: '#fff', rotate: '45deg' },
} as const;

// ---------------------------------------------------------------------------------------------------
// ion-card (card.md.scss, [CSS] 12784-12932)
// ---------------------------------------------------------------------------------------------------
export const cardMd = {
  margin: 10, // [CSS] 12919 .card-md { margin: 10px; width: calc(100% - 20px); border-radius: 2px; font-size: 1.4rem }
  borderRadius: 2,
  fontSize: appFontSize,
  backgroundColor: '#fff',
  shadow: '0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 1px 5px 0 rgba(0, 0, 0, 0.12)',
  header: { fontSize: 16, color: '#222', padding: 16 }, // [CSS] 12924
  content: { paddingVertical: 13, paddingHorizontal: 16, fontSize: 14, lineHeight: 1.5, color: md.textColor }, // [CSS] 12923 (text colour inherits the app's #000)
  // [CSS] 12925 .card-header-md + .card-content-md { padding-top: 0 }
  // [CSS] 12932 .card-md + ion-card { margin-top: 0 }
} as const;
