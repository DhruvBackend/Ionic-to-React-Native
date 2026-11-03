// Ported from: src/pages/pointtranfer/pointtranfer.scss (empty) + the global rules of src/theme/variables.scss that reach pointtranfer.html
// Citations: [T] variables.scss line, [D] Chrome user-agent default, [H] inline style.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { pointtranferMd } from '../../theme/ionicMdPointtranfer';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 12572 `.padding16 { padding: 16px !important }`, [H] `background:#f9f9f9` (the div is as tall as its content)
  padding16: { padding: 16, backgroundColor: pointtranferMd.pageBg },
  // `.pt10` / `.pb10` [T] 167 / 178 `padding-top|bottom: 10px !important` on the second `.input-section`
  inputSectionPad: { paddingVertical: 10 },
  // [T] 74 `.m0 { margin: 0 !important }` beats 607 `.input-adjust { margin: 16px 16px 0 45px }`; the first one is an empty div (the commented select), 0 high
  inputAdjust: {},
  // [T] 623-629 `.input-section .input-adjust input { padding-left 56; padding-right 16; radius 45; width 100%; border 1px solid #D4D4D4; height 45 }`
  // overridden by `.pl16` [T] 145 (padding-left 16 !important) and `.radius-none` [T] 411 (radius 0 !important); global `input { margin: 0 !important }` [T] 399
  input: {
    width: '100%',
    height: 45,
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 0,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: pointtranferMd.inputBorder,
    backgroundColor: colors.white,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});
