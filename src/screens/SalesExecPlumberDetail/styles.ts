// Ported from: src/pages/sales-exec-plumber-detail/sales-exec-plumber-detail.scss + the global rules of src/theme/variables.scss that reach the template
// Citations: [T] variables.scss line (Ionic source), [S] sales-exec-plumber-detail.scss line.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { profileMd as P } from '../../theme/ionicMdProfile';

// The root font is 14px; an inline <img> sits on the baseline of a line box whose strut is `line-height: normal`, so the
// .profile-pic wrapper is the image height + the strut's descent.
export const strutDescent = normalLineHeight(14) - Math.round((14 * 1900) / 2048);

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 3051-3053 `.profile-bg { background: #F8FFFC !important }` on <ion-content class="profile-bg plumber-detail">
  content: { backgroundColor: P.bg },
  // [S] 2-6 `.loader { text-align: center; padding: 40px 12px }`
  loader: { paddingVertical: 40, paddingHorizontal: 12 },
  centred: { textAlign: 'center' },
  // [S] 20 `.profile { padding: 8px 12px 30px }` (beats the global `.profile { padding: 16px; padding-top: 0 }`)
  profile: { paddingTop: 8, paddingRight: 12, paddingBottom: 30, paddingLeft: 12, backgroundColor: P.bg },
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
  // [T] 3082-3084 `.profile-pic { margin-right: 16px }`
  profilePic: { marginRight: 16, width: 50, height: 50 + strutDescent },
  // [T] 3085-3093 `.profile-pic img`; [S] 22 `.profile .profile-pic img` (0,2,2) loses to the global (0,3,1): the picture stays 50x50 / radius 50
  picImage: {
    height: 50,
    width: 50,
    minWidth: 50,
    borderRadius: 50,
    boxShadow: '0 1px 4px 1px rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: colors.white,
  },
  // `.name` is a flex item that may shrink
  name: { flexShrink: 1 },
  // [T] 3119-3150 `.name a { display: flex; align-items: center }`
  nameLink: { flexDirection: 'row', alignItems: 'center' },
  // [T] 3131-3146 `.name a i`: 15x15 border-box, padding 6, flex-centred, margin-right 6; page [S] font-size 14 loses to the global (0,3,2) 18px
  statusIcon: { width: 15, height: 15, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  statusIconGlyph: { width: 18, flexShrink: 0, textAlign: 'center' },
  // [T] 2949-2953 `.rating-area { border: solid 1px #DEDEDE; border-radius: 6px; width: 100% }` + `.mt16 { margin-top: 16px !important }`
  ratingArea: { borderWidth: 1, borderColor: P.line, borderRadius: 6, width: '100%', marginTop: 16 },
  // [T] 2954-2958 `.border-box`
  borderBox: { flexDirection: 'row', alignItems: 'center', width: '100%', borderBottomWidth: 1, borderBottomColor: P.line },
  // [T] 2959-2978 `.boxs`: padding 5 10, width 50%, border-right 1 #ccc (the last child has none)
  boxs: { paddingVertical: 5, paddingHorizontal: 10, width: '50%', borderRightWidth: 1, borderRightColor: P.lineStrong },
  boxsLast: { borderRightWidth: 0 },
  // [T] 2982-3000 `.ratings`: padding 7 10, width 100%
  ratings: { paddingVertical: 7, paddingHorizontal: 10, width: '100%' },
  // [T] 451-453 `.border-bottom { border-bottom: solid 1px #ccc !important }`
  borderBottom: { borderBottomWidth: 1, borderBottomColor: P.lineStrong },
  capitalize: { textTransform: 'capitalize' },
});
