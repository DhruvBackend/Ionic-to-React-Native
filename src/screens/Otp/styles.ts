// Ported from: src/pages/login-section/otp/otp.scss (empty) + the global rules of src/theme/variables.scss that reach otp.html
// Citations: [T] variables.scss line, [CSS] compiled main.css rule, [M] measured in the Ionic reference build (parity/out/ref/Otp.default.png,
// Chrome 360x800).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { fontFor } from '../../theme/typography';

export const logoHeight = 45; // [T] 1215 `.header-logo img { height: 45px }`

// [T] 1245 `#D4D4D4`, written as rgb() because screens may not contain hex literals.
export const lineColor = 'rgb(212, 212, 212)';
// Chrome's default `::placeholder` colour (darkgray 54% black): rgba(117,117,117).
export const placeholderColor = 'rgb(117, 117, 117)';

// "line-height: normal" of Roboto (1.172 em) and of the Devanagari fallback face Chrome picked ([M] hin p 18.4 px at 14 px, resend 15.6 at 12 px).
export const normalLine = (fontSize: number, text: string) => (/[ऀ-ॿ]/.test(text) ? fontSize * 1.32 : fontSize * 1.172);

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },

  // [T] 1201-1213 `.header-logo` (same as the Language pilot: spans the toolbar box, z-index -1, 2px primary border)
  headerLogo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  headerLogoImg: { height: logoHeight },

  // `ion-content > .scroll-content` filled by `<form class="hp100">`: height 100% !important [CSS .hp100]
  contentFill: { flexGrow: 1 },
  form: { flex: 1 },

  // [T] 538-553 `.main-login`: 100% x 100%, white, flex centre
  mainLogin: { flex: 1, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },

  // [T] 556-562 `.mobile-login`: 311 wide, radius 10, shadow 0 3px 20px 0 rgba(24,24,24,.6) (overflow stays visible, the button has its own radius)
  mobileLogin: {
    width: 311,
    backgroundColor: colors.white,
    borderRadius: 10,
    boxShadow: '0px 3px 20px 0px rgba(24, 24, 24, 0.6)',
  },

  // [T] 562-575 `.text`: border-bottom 1px #D4D4D4, padding 16 ([M] block 76 px with the border)
  text: { borderBottomWidth: 1, borderBottomColor: lineColor, padding: 16 },
  // `.text p`: 14px, #000, weight 500 (global `p { margin: 0 !important }`)
  p: { includeFontPadding: false, fontSize: 14, color: 'black', ...fontFor(500) },
  // `.text span` (.blue-color): inline-block, padding-top 5, 14px, weight 600, colour #002d25 (= the client primary, [T] 415-417)
  // [M] the span row sits 11 px below the p line box (line-height of the inline-block row).
  spanRow: { marginTop: 11 },
  span: { includeFontPadding: false, lineHeight: 16, fontSize: 14, color: colors.primary, ...fontFor(600) },

  // `.input-section { position: relative }`, `.input-adjust` margin 16 16 0 45 beaten by `.m16 .mb0` (16 16 0 16) [CSS .m16/.mb0]
  inputAdjust: { margin: 16, marginBottom: 0 },
  // `.input-adjust input`: height 45, border 1px #D4D4D4, width 100%; `.radius-none` radius 0 !important; `.pl16` padding-left 16 !important; padding-right 16
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: lineColor,
    borderRadius: 0,
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 0,
    fontSize: 14,
    color: 'black',
    ...fontFor(400),
  },
  // [T] 4595 `.eror p`: 12px, danger, margin 7px 0, text-align right
  eror: { marginVertical: 7 },
  erorText: { fontSize: 12, color: colors.danger, textAlign: 'right', ...fontFor(400) },

  // [T] 677-692 `.resend`: width 100%, text-align right, padding-right 16; `a`: 12px inline-block, padding 6, margin-top 10, primary, white, radius 5
  resend: { alignItems: 'flex-end', paddingRight: 16 },
  resendDim: { opacity: 0.5 }, // [T] 12532 `.opacity`
  resendA: { marginTop: 10, padding: 6, backgroundColor: colors.primary, borderRadius: 5 },
  resendText: { includeFontPadding: false, fontSize: 12, color: colors.white, ...fontFor(400) },

  // [T] 577-594 `.login-btn`: 100% x 45, radius 0 0 10 10, primary, margin-top 32, flex centre; `button`: transparent, 14px white, letter-spacing 1, weight 100
  loginBtn: {
    width: '100%',
    height: 45,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: colors.primary,
    marginTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.4 }, // `button[disabled] { opacity: .4; pointer-events: none }`
  buttonText: { includeFontPadding: false, fontSize: 14, color: colors.white, letterSpacing: 1, ...fontFor(100) },
});
