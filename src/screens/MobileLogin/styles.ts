// Ported from: src/pages/login-section/mobile-login/mobile-login.scss (+ the global rules of src/theme/variables.scss that reach mobile-login.html)
// Citations: [T] variables.scss line, [CSS] compiled main.css rule (.reference/aab .../build/main.css), [M] measured in the Ionic
// reference build (parity/out/ref/MobileLogin.default.png, Chrome 360x800 @3x).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { loginMd } from '../../theme/ionicMdLogin';

export const logoHeight = 45; // [T] 1215 `.header-logo img { height: 45px }`

const border = loginMd.border; // [T] 563, 614, 624

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },

  // [T] 1201-1213 `.header-logo` (same box as Language: spans the toolbar, flex centre, 2px primary bottom border)
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

  // `form.hp100` { height: 100% !important } + [T] 538-547 `.main-login` { width/height 100%; background #fff; flex centre }
  content: { flexGrow: 1 },
  mainLogin: { flex: 1, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },

  // [T] 556-562 `.mobile-login` { background #fff; width 311px; radius 10; box-shadow 0 3px 20px 0 rgba(24,24,24,.6) }
  mobileLogin: {
    width: 311,
    backgroundColor: colors.white,
    borderRadius: 10,
    boxShadow: '0px 3px 20px 0px rgba(24, 24, 24, 0.6)',
  },

  // [T] 562-575 `.text` { border-bottom 1px solid #D4D4D4; padding 16px } `p` { 14px; #000; 500 } (p margin 0: `button,...,p{margin:0!important}`)
  text: { borderBottomWidth: 1, borderBottomColor: border, padding: 16 },

  // [T] 598-603 `.input-section` { position relative } (its first child's 16px top margin collapses through it: margin-top 16, height 45 [M])
  inputSection: { marginTop: 16, height: 45 },
  // [T] 604 `i` { position absolute; top 50%; translateY(-50%); left 12px } (24px icon)
  icon: { position: 'absolute', left: 12, top: 10.5 },
  // [T] 606 `.input-adjust` { margin: 16px 16px 0 45px }
  inputAdjust: { marginLeft: 45, marginRight: 16 },
  // [T] 608-621 `.fixed-number` { radius 45 0 0 45; 50x44; #E5EAFF; absolute top 0; flex centre; border 1px solid #D4D4D4 } `p` { 600 }
  fixedNumber: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 50,
    height: 44,
    borderTopLeftRadius: 45,
    borderBottomLeftRadius: 45,
    backgroundColor: loginMd.fixedNumberBg,
    borderWidth: 1,
    borderColor: border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // [T] 622-628 `input` { padding-left 56; padding-right 16; radius 45; width 100%; border 1px solid #D4D4D4; height 45 }
  // native <input>: font 14px Roboto (inherited), text #000, placeholder #757575 (Chrome default) [M]
  input: {
    width: '100%',
    height: 45,
    paddingLeft: 56,
    paddingRight: 16,
    paddingVertical: 0,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: border,
    backgroundColor: colors.white,
    fontSize: 14,
    color: loginMd.ink,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },

  // [T] 577-596 `.login-btn` { 100% x 45; radius 0 0 10 10; background $primary; margin-top 32; flex centre } `button` { transparent; 14px; #fff; letter-spacing 1px; weight 100; width 100% }
  loginBtn: {
    width: '100%',
    height: 45,
    marginTop: 32,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnPress: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  loginBtnText: { letterSpacing: 1 },
  // global `button[disabled] { opacity: .4; pointer-events: none }`
  disabled: { opacity: 0.4 },
});
