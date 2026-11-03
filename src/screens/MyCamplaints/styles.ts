// Ported from: src/pages/plumber-camplaints/my-camplaints/my-camplaints.scss (empty) + the global rules of src/theme/variables.scss that reach
// my-camplaints.html: `.serach-filter` 4446-4463, `.plumber-cam` 4059-4127, `a.phone-call` 4129-4144, `.add` 4146-4184, `.data-not` 4393-4402.
// Text styles are built in index.tsx with textStyle(); only boxes live here.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { myComplaintsMd as C } from '../../theme/ionicMdMyCamplaints';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 4446-4451 `.serach-filter { display: flex; align-items: center; justify-content: space-between; padding: 10px }`
  serachFilter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 },
  // `<ion-list style="width: 100%">` + `.serach-filter ion-list { margin: 0 }`
  list: { width: '100%', margin: 0 },
  // [T] 4455-4457 `.serach-filter ion-list ion-item { padding-left: 15px; border-radius: 23px }`
  searchItem: { paddingLeft: 15, borderRadius: 23 },
  // [T] 4393-4402 `.data-not { width: 100%; height: calc(100% - 50px); flex column centred }` (the height is set at run time)
  dataNot: { width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
  // [T] 4059-4063 `.plumber-cam { padding: 16px; background: #fff; width: 100% }`
  plumberCam: { padding: 16, backgroundColor: C.white, width: '100%' },
  // [T] 4064-4068 `.box { background: #fff; padding: 17px; position: relative; border-bottom: solid 1px #FF7171; box-shadow }`
  box: { backgroundColor: C.white, padding: 17, position: 'relative', borderBottomWidth: 1, borderBottomColor: C.boxBorder, boxShadow: C.boxShadow },
  // [T] 4122-4125 `&:last-child { border-bottom: 0 !important; margin-bottom: 30px }`
  boxLast: { borderBottomWidth: 0, marginBottom: 30 },
  // [T] 4069-4084 `span.alphabet { position: absolute; left: 0; ... }` has no `top`: its static position is the first line of the box (after the 17px padding)
  alphabet: {
    position: 'absolute',
    left: 0,
    top: 17,
    width: 35,
    height: 38,
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: C.alphabetBg,
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
  },
  // [T] 4086-4087 `.title { padding-left: 24px; position: relative }` > `h4 { padding-bottom: 3px }`
  title: { paddingLeft: 24, position: 'relative' },
  titleH4: { paddingBottom: 3 },
  // [T] 4129-4144 `a.phone-call { position: absolute; top: 0; right: 0 }` > `i { font-size: 22px }`
  phoneCall: { position: 'absolute', top: 0, right: 0 },
  // [T] 4180-4184 `.add .com { display: flex; align-items: center; justify-content: space-between }`; `.add p { padding-bottom: 14px }`, `h3 { padding-bottom: 4px }`
  com: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h3: { paddingBottom: 4 },
  addP: { paddingBottom: 14 },
  // [T] 4109-4119 `.pro-12 { display: flex }` > `h4 { padding-right: 17px }`
  pro12: { flexDirection: 'row' },
  shrink: { flexShrink: 1 },
  pro12H4: { paddingRight: 17 },
});
