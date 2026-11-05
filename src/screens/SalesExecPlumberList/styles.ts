// Ported from: src/pages/sales-exec-plumber-list/sales-exec-plumber-list.scss + the global rules of src/theme/variables.scss that reach the template
// Citations: [T] variables.scss line (Ionic source), [S] sales-exec-plumber-list.scss line.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { profileMd as P } from '../../theme/ionicMdProfile';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 3051-3053 `.profile-bg { background: #F8FFFC !important }` on <ion-content class="plumber-list profile-bg">
  content: { backgroundColor: P.bg },
  // [S] 56 `.tab-bar { padding: 0 }` (beats `.toolbar-md { padding: 4px }`)
  tabBar: { padding: 0 },
  // [S] 2-6 `.loader { text-align: center; padding: 40px 12px }`
  loader: { paddingVertical: 40, paddingHorizontal: 12 },
  centred: { textAlign: 'center' },
  // [S] 8-27 `.empty { text-align: center; padding: 60px 24px; background: transparent }` (specificity 0,1,1 beats the global one on those) + the global
  // [T] 6589-6600 `.empty { height: 306px; margin-top: 10px; display: flex (row); align-items: center; justify-content: center; border-radius: 5px }`
  // (Ionic resets box-sizing to border-box, so 306 includes the padding). The img and p are flex items: no baseline gap under the img.
  empty: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 306, marginTop: 10, borderRadius: 5, paddingVertical: 60, paddingHorizontal: 24 },
  // [T] 6596-6599 `.empty p { letter-spacing: 1px }` (font-size 13 / colour / margin 0 come from [S] 22-27)
  emptyP: { letterSpacing: 1, flexShrink: 1 },
  // [S] 13-19 `.empty img { margin-bottom: 16px; opacity: .9 }`
  emptyImg: { marginBottom: 16, opacity: 0.9 },
  // [S] 29 `.profile { padding: 8px 12px 0 }` (beats the global `.profile { padding: 16px; padding-top: 0 }`)
  profile: { paddingTop: 8, paddingRight: 12, paddingBottom: 0, paddingLeft: 12, backgroundColor: P.bg },
  // [S] 36 `.card-item:active { transform: scale(.99) }`
  cardPressed: { transform: [{ scale: 0.99 }] },
  // [T] 3067-3080 `.profile .profile-detail`: white, shadow, padding 10, radius 10, margin-bottom 10
  // RN: the flex-wrap lines are explicit (a row for pic + name, then the 100%-wide .rating-area), as on the Profile screen
  profileDetail: {
    boxShadow: '0 0 8px 4px rgba(0, 0, 0, 0.1)',
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  firstLine: { flexDirection: 'row', alignItems: 'center' },
  // [T] 3082-3084 `.profile-pic { margin-right: 16px }` + [S] 38-41 `.profile-pic.small { width: 60px; height: 60px }`
  profilePic: { marginRight: 16, width: 60, height: 60 },
  // [T] 3085-3093 `.profile-pic img` (50px, min-width 50, white 1px border, shadow); [S] 40 `.profile-pic.small img` (0,3,2) beats it: 100% x 100% = 60, radius 50%
  picImage: {
    height: 60,
    width: 60,
    minWidth: 50,
    borderRadius: 30,
    boxShadow: '0 1px 4px 1px rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: colors.white,
  },
  // `.name` is a flex item that may shrink
  name: { flexShrink: 1 },
  // [T] 3119-3150 `.name a { display: flex; align-items: center }`
  nameLink: { flexDirection: 'row', alignItems: 'center' },
  // [T] 3131-3146 `.name a i`: 15x15 border-box, padding 6, flex-centred, margin-right 6; page [S] font-size 13 loses to the global (0,3,2) 18px
  statusIcon: { width: 15, height: 15, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  // the 18px glyph overflows the 15px box (CSS overflow visible); its own height stops the 15px box squeezing the Text (Android clipped the circle)
  statusIconGlyph: { width: 18, height: 18, flexShrink: 0, textAlign: 'center' },
  // [T] 2949-2953 `.rating-area { border: solid 1px #DEDEDE; border-radius: 6px; width: 100% }` + `.mt16 { margin-top: 16px !important }`
  ratingArea: { borderWidth: 1, borderColor: P.line, borderRadius: 6, width: '100%', marginTop: 16 },
  // [T] 2954-2958 `.border-box`
  borderBox: { flexDirection: 'row', alignItems: 'center', width: '100%', borderBottomWidth: 1, borderBottomColor: P.line },
  // [T] 2959-2978 `.boxs`: padding 5 10, width 50%, border-right 1 #ccc (the last child has none)
  boxs: { paddingVertical: 5, paddingHorizontal: 10, width: '50%', borderRightWidth: 1, borderRightColor: P.lineStrong },
  boxsLast: { borderRightWidth: 0 },
  // [T] 2982-3000 `.ratings`: padding 7 10, width 100%
  ratings: { paddingVertical: 7, paddingHorizontal: 10, width: '100%' },
  capitalize: { textTransform: 'capitalize' },
});
