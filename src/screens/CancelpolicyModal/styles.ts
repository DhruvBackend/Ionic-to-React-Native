// Ported from: src/pages/cancelpolicy-modal/cancelpolicy-modal.scss + the global rules of src/theme/variables.scss that reach the template
// Citations: [T] variables.scss line, [S] cancelpolicy-modal.scss line, [CSS] shipped main.css rule.
// Global reset [CSS]: `button,h1..h6,input,p,span { margin: 0 !important }`; `h1..h6 { font-weight: 500; line-height: 1.2 }`;
// `button { line-height: 1 }`; `input,label,select,textarea { font-family: inherit; line-height: normal }`.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { cancelpolicyModalMd as M } from '../../theme/ionicMdCancelpolicyModal';
import { fontFor } from '../../theme/typography';

export const styles = StyleSheet.create({
  // [S] 13-18 `ion-content.popup-modal { background: rgba(0,0,0,.5) !important; display: flex; ... }`
  screen: { flex: 1 },
  popupModal: { backgroundColor: M.contentBackground },
  // `<ion-content padding>`; its .scroll-content holds `.dflex1.hp100` (height 100% !important)
  contentFill: { flexGrow: 1 },
  // [T] 9991-9994 `.dflex1 { display: flex; align-items: center }` + [S] 76-78 `.dflex1 { justify-content: center }` + [T] 12556 `.hp100`
  dflex1: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  // [T] 3881-3889 `.modal-content`: white, margin 0 16 !important, shadow, padding 20, radius 10 (a shrink-to-fit flex item)
  modalContent: {
    marginHorizontal: 16,
    flexShrink: 1,
    backgroundColor: colors.white,
    boxShadow: M.boxShadow,
    padding: 20,
    borderRadius: 10,
  },
  // [S] 8-13 `.modal-content h1 { font-size: 14px; color: #002d25 }` + [T] 3890-3894 `margin-bottom: 10px !important`; h1: weight 500, line-height 1.2
  h1: { includeFontPadding: false, fontSize: 14, lineHeight: 14 * 1.2, color: colors.primary, marginBottom: 10, ...fontFor(500) },
  // [T] 3895-3898 `.modal-content p { font-size: 16px; line-height: 28px }` (body colour black)
  p: { includeFontPadding: false, fontSize: 16, lineHeight: 28, color: M.ink, ...fontFor(400) },
  // [T] 3899-3908 `.number-content { background: #F6F6F6; margin: 10px 0 16px; padding: 10px }`, `p { font-size: 12px; line-height: 24px }`
  numberContent: { backgroundColor: M.numberContentBackground, marginTop: 10, marginBottom: 16, padding: 10 },
  numberP: { includeFontPadding: false, fontSize: 12, lineHeight: 24, color: M.ink, ...fontFor(400) },
  // `.blue-color { color: #002d25 }` + `.lineh24`
  blue: { color: colors.primary, lineHeight: 24 },

  // [T] 598-599 `.input-section { position: relative }`, `.input-adjust` margin beaten by `.m0` (0 !important)
  inputAdjust: {},
  // [T] 623-629 `.input-adjust input`: width 100%, border 1px #D4D4D4, height 45, padding-right 16; `.radius-none` radius 0; `.pl16` padding-left 16
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: M.inputBorder,
    borderRadius: 0,
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 0,
    fontSize: 14,
    color: M.ink,
    ...fontFor(400),
  },
  // [T] 631-637 `.input-adjust .otp-error p { color: red; padding: 4px !important; font-size: 14px }`; line-height 28 from `.modal-content p`
  otpErrorP: { includeFontPadding: false, padding: 4, fontSize: 14, lineHeight: 28, color: colors.danger, ...fontFor(400) },
  // [T] 656-674 `.input-adjust .resend.flat` (relative, width 100%, text-align right) + `.mt10 .mb10` (10px !important)
  // NOTE (parity): `.mb10` (10) is followed by `.check-bx { margin-top: 10 }`: adjacent vertical margins collapse to 10, so the 10 lives on checkBx only
  resend: { alignItems: 'flex-end', marginTop: 10, marginBottom: 0 },
  // `.resend a`: [T] 677-689 inline-block, background #002d25, radius 5; [T] 662-668 beats font-size 10, white, weight 600, padding 4, margin-top 0
  resendA: { padding: 4, backgroundColor: colors.primary, borderRadius: 5 },
  resendText: { includeFontPadding: false, fontSize: 10, lineHeight: 10 * 1.172, color: colors.white, ...fontFor(600) },
  // [T] 648-654 `.input-adjust textarea`: width 100%, border 1px #ccc, padding 7 (`.pl16` left 16), font-size 12, height 80, `.mt0`, `.radius-none`
  textarea: {
    height: 80,
    borderWidth: 1,
    borderColor: M.textareaBorder,
    borderRadius: 0,
    paddingTop: 7,
    paddingRight: 7,
    paddingBottom: 7,
    paddingLeft: 16,
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'top',
    color: M.ink,
    ...fontFor(400),
  },
  // main.css `textarea::placeholder { padding-left: 2px }` (the reviewer's "Chrome textarea padding" is this rule: `.pl16`/padding 7 replace the UA 2px)
  textareaPlaceholder: { paddingLeft: 18 },

  // [T] 3908-3914 `.check-bx { display: flex; align-items: center; margin-top: 10px }`
  checkBx: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  // `.check-bx ion-item { width: 27px; padding: 0 }`; the kit puts 4px of margin before a checkbox in an item, `ion-checkbox { margin: 0 !important }`
  // takes it away again, so the item is moved 4px left and its box given the 4px back to keep the next element at x = 27
  checkItem: { width: 27, paddingLeft: 0, marginLeft: -4, marginRight: 4 },
  checkItemInner: { paddingRight: 0, borderBottomWidth: 0 },
  // [T] 3922-3935 `.check-bx p { font-size: 14px; color: #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }`, line-height 28 from `.modal-content p`
  checkP: { flexShrink: 1, includeFontPadding: false, fontSize: 14, lineHeight: 28, color: M.ink, ...fontFor(400) },
  // `.check-bx p a { color: #000ED9; text-decoration: underline }`
  link: { color: M.linkColor, textDecorationLine: 'underline' },

  // [T] 3936-3944 `.btn-align { display: flex; align-items: center; justify-content: flex-end; margin-right: -28px }`
  btnAlign: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginRight: -28 },
  // `a` (the "No" link): colour #002d25 (the global `a { color }`), 14px inherited, line-height normal
  no: { includeFontPadding: false, fontSize: 14, lineHeight: 14 * 1.172, color: colors.primary, ...fontFor(400) },
  // `.btn-align button { background: transparent; padding: 0 !important; width: 65px }`; native button: 13.333px, line-height 1, black, centred
  yes: { width: 65, alignItems: 'center' },
  // `button[disabled] { opacity: .4; pointer-events: none }`
  disabled: { opacity: 0.4 },
  yesText: { includeFontPadding: false, fontSize: 13.3333, lineHeight: 13.3333, color: M.ink, ...fontFor(400) },
});
