// Ported from: src/pages/scane-pages/coupan-code/coupan-code.scss (empty) + the global rules of src/theme/variables.scss that reach coupan-code.html
// Citations: [T] variables.scss line, [D] Chrome user-agent default.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { coupanCodeMd } from '../../theme/ionicMdCoupanCode';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 1754-1756 `.bg-margin { margin: 0px 32px !important }`
  bgMargin: { marginHorizontal: 32 },
  // [T] 1758-1761 `.paragraph { background #F6F6F6; padding 10px; margin-top 32px }`, `.mt15 { margin-top: 15px !important }` wins
  paragraph: { backgroundColor: coupanCodeMd.paragraphBg, padding: 10, marginTop: 15 },
  // [T] 1769-1771 `.nrml-input { margin: 16px 0 }`
  nrmlInput: { marginVertical: 16 },
  // [T] 1772-1777 `.nrml-input input { height 45; width 100%; padding 0 16; font-size 14 }`; border [D]; global `input { margin: 0 !important }`
  input: {
    width: '100%',
    height: 45,
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: coupanCodeMd.inputBorder,
    borderRadius: coupanCodeMd.inputRadius,
    backgroundColor: colors.white,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  // [T] 459-467 `.cs-btn { background #002d25 (= the client primary); width 100%; height 40 !important; margin 0 }`; main.css `button { border: 0 }`;
  // `.btn-radius-four` has no CSS rule. The button text is centred (UA default).
  csBtn: { width: '100%', height: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  // [T] 468-473 `.cs-btn span { font-size 12; line-height 22; letter-spacing 1; font-weight normal }`
  csBtnText: { letterSpacing: 1 },
  // [T] 1778-1783 `.scane-img { display flex; align-items center; margin-top 32; grid-column-gap 10 }`
  scaneImg: { flexDirection: 'row', alignItems: 'center', marginTop: 32, columnGap: 10 },
  // [T] 1788-1790 `.scane-img p { font-size: 14px }`; the p is a flex item (shrinks, wraps)
  scaneText: { flexShrink: 1 },
});
