// Ported from: src/pages/super30/super30.scss (empty) + the `.super-plumber` rules of src/theme/variables.scss (4829-5010) and
// `.data-not` (4393-4402). Citations: [T] variables.scss line. Text styles are built in index.tsx with textStyle().
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { super30Md as S } from '../../theme/ionicMdSuper30';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 4393-4402 `.data-not { width: 100%; height: calc(100% - 50px); flex column centred }`; the height is set from the measured content height
  dataNot: { width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
  // [T] 4830-4836 `ion-list { margin: 16px; margin-bottom: 0; margin-top: 0; position: relative; z-index: 1 }`
  listWrap: { marginHorizontal: 16, marginTop: 0, marginBottom: 0, zIndex: 1 },
  // [T] 4837-4838 `button { padding-left: 0; min-height: inherit !important }`; `.item-inner { padding-right: 0 !important }`
  item: { paddingLeft: 0, minHeight: 0 },
  itemInner: { paddingRight: 0, minHeight: 0 },
  // the auto-created <ion-label>: `margin: 0` ([T] 4843); flex 1, overflow hidden (label-md)
  label: { flex: 1, margin: 0, overflow: 'hidden' },
  // [T] 4844-4850 `.list { display: flex; align-items: center; justify-content: space-between; position: relative; padding-top: 16px }`
  list: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative', paddingTop: 16 },
  // [T] 4951-4968 `.list:before / :after { position: absolute; height: 50%; border: dashed 1px #ccc; z-index: 1; left: 14px }`
  dashTop: { position: 'absolute', top: 0, left: 14, width: 2, height: '50%', borderWidth: 1, borderStyle: 'dashed', borderColor: S.line, zIndex: 1 },
  dashBottom: { position: 'absolute', bottom: 0, left: 14, width: 2, height: '50%', borderWidth: 1, borderStyle: 'dashed', borderColor: S.line, zIndex: 1 },
  // [T] 4851-4856 `.point { position: relative; width/height: 30px; border-radius: 100px; border: solid 1px #ccc; z-index: 9; background: white }`
  point: { width: 30, height: 30, borderRadius: 100, borderWidth: 1, borderColor: S.line, backgroundColor: colors.white, zIndex: 9, alignItems: 'center', justifyContent: 'center' },
  pointActive: { borderColor: S.activePointBorder, backgroundColor: S.activePointBg }, // [T] 4940-4943
  // [T] 4862-4871 `.detail { width: 80%; border: solid 1px #ccc; flex space-between centre; padding: 5px; border-radius: 8px; position: relative }`
  detail: { width: '80%', borderWidth: 1, borderColor: S.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 5, borderRadius: 8, position: 'relative' },
  detailActive: { borderWidth: 0 }, // [T] 4949 `border: none` (the gradient fills the box)
  gradientClip: { ...StyleSheet.absoluteFill, borderRadius: 8, overflow: 'hidden' },
  // [T] 4872-4874 `.info { padding-left: 8px }`; the texts are nowrap (ion-label), so the block keeps its text width
  info: { paddingLeft: 8, flexShrink: 0 },
  // [T] 4877 `h4 { padding-bottom: 4px }`
  name: { paddingBottom: 4 },
  // [T] 4883-4884 `ul { display: flex }`; `li` height from the line box (measured on the Ionic build: 20px, font-size 16px, line-height normal)
  stars: { flexDirection: 'row' },
  star: { height: 20 },
  // [T] 4903-4913 `.photo { 55x55; overflow hidden; background #ccc; radius 100; flex centre }`
  photo: { width: 55, height: 55, overflow: 'hidden', backgroundColor: S.line, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  // [T] 4914-4918 `.photo img { height: 100%; border-radius: 8px; max-width: inherit }`
  photoImg: { height: 55, borderRadius: 8 },
  // [T] 4919-4931 `.detail:after { left: -6px; border-top/bottom: 9px transparent; border-right: 11px solid #ccc; top: 50%; translate(-50%, -50%) }`; active: left -5px, border-right colour #11998e ([T] 4954-4958)
  arrow: {
    position: 'absolute',
    left: -6,
    top: '50%',
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderRightWidth: 11,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: S.line,
    transform: [{ translateX: -5.5 }, { translateY: -9 }],
  },
  arrowActive: { left: -5, borderRightColor: S.gradientFrom },
});
