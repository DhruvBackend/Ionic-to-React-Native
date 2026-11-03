// Ported from: src/pages/profile/profile.scss (+ the global rules of src/theme/variables.scss that reach profile.html)
// Citations: [T] variables.scss line. profile.scss itself only styles `.adhar` (inside a commented-out block) and hides the
// header strip (`page-profile ion-header:after { display: none }` = noBorder on the Header).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { profileMd as P } from '../../theme/ionicMdProfile';

// The root font is 14px; an inline <img> sits on the baseline of a line box whose strut is `line-height: normal`, so the
// line box (and the .profile-pic / .document-img wrapper) is the image height + the strut's descent.
export const strutDescent = normalLineHeight(14) - Math.round((14 * 1900) / 2048);

export const styles = StyleSheet.create({
  // [T] 3051-3053 `.profile-bg` (staff branch only)
  staffContent: { backgroundColor: P.bg },
  // [T] 3059-3066 `.profile { padding: 16px; padding-top: 0; position: relative; background: #F8FFFC }`
  // NOTE (parity): `.profile:after` (white 140px block, z-index -1) is painted BEHIND `.profile`'s own background, so it never shows.
  profile: { padding: 16, paddingTop: 0, backgroundColor: P.bg },
  // [T] 3067-3080 `.profile-detail`
  profileDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    boxShadow: '0 0 8px 4px rgba(0, 0, 0, 0.1)',
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  // [T] 3082-3084 `.profile-pic { margin-right: 16px; position: relative }`
  profilePic: { marginRight: 16, width: 50, height: 50 + strutDescent },
  // [T] 3085-3093 `.profile-pic img`
  picImage: {
    height: 50,
    width: 50,
    minWidth: 50,
    borderRadius: 50,
    boxShadow: '0 1px 4px 1px rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: colors.white,
  },
  // [T] 3094-3111 `.profile-pic a`
  picCamera: {
    position: 'absolute',
    bottom: 6,
    right: -6,
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    boxShadow: '1px 2px 7px 0 rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: colors.white,
  },
  // `.name` is a flex item that may shrink (CSS flex-shrink 1; RN defaults to 0)
  name: { flexShrink: 1 },
  // [T] 3112-3118 `.name p`
  // [T] 3119-3150 `.name a { display: flex; align-items: center }`
  nameLink: { flexDirection: 'row', alignItems: 'center' },
  // [T] 3131-3146 `.name a i`: font-size 18, 15x15 border-box with padding 6 (content box 3x3), flex-centred, margin-right 6
  statusIcon: { width: 15, height: 15, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  statusIconGlyph: { width: 18, flexShrink: 0, textAlign: 'center' },
  // [T] 4664-4691 `.edit-profile.pencil-btn`: absolute right 8 top 8; button 30x30, radius 30 0 30 30, primary
  pencil: { position: 'absolute', right: 8, top: 8 },
  pencilButton: {
    width: 30,
    height: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // [T] 2949-2953 `.rating-area { border: solid 1px #DEDEDE; border-radius: 6px; width: 100% }`
  // NOTE (parity): profile.html:40 / :211 `<div class="rating-area mt16">`; `.mt16{margin-top:16px!important}` (main.css)
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
  // [T] 2998-3004 `.rating-area.new-cl .ratings` (the last one has no line)
  newClRatings: { borderBottomWidth: 1, borderBottomColor: P.newClLine },
  // [T] 3152-3180 `.document-section`
  // NOTE (parity): profile.html:117 `.document-section.pb10.pt10` (`!important` 10px top/bottom padding)
  documentSection: { paddingTop: 10, paddingBottom: 10 },
  documentImg: { borderWidth: 1, borderColor: P.docBg, borderRadius: 4, overflow: 'hidden' },
  documentImage: { height: 200, width: '100%', backgroundColor: P.docBg },
  documentGap: { height: strutDescent },
  documentInfo: { backgroundColor: colors.white, padding: 10 },
  // [T] 1462-1490 `.share-code { background: $primary; padding: 10px; display: grid; grid-template-columns: 35px 1fr 50px; margin-bottom: 19px }`
  shareCode: { backgroundColor: colors.primary, padding: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 19 },
  shareIconCol: { width: 35 },
  shareMiddle: { flex: 1 },
  shareButtonCol: { width: 50 },
  // [T] 4604-4620 `.point-loc .point-add`
  pointAdd: { padding: 9, paddingBottom: 0 },
  pointAddText: { textDecorationLine: 'underline' },
  // NOTE (parity): `<textarea>` default rows=2: 2 x 18px (`line-height: 18px`, variables.scss:4615-4620) + 2 x 2px default padding = 40px
  geoTextarea: { borderWidth: 0, width: '100%', padding: 2, height: 40, textAlignVertical: 'top' },
  // [T] 3985-4001 `.header-icons { position: absolute; top: 10px; right: 0 }` (against the navbar box)
  headerIcons: { position: 'absolute', top: 10, right: 0, zIndex: 1 },
  // [T] 3993-4001 `.header-icons button.cs-hdr-icons`: transparent, no radius / shadow, padding 0
  // NOTE (parity): profile.html:5 `cs-hdr-icons mr16` -> `.mr16{margin-right:16px!important}`
  hdrIconButton: { borderRadius: 0, boxShadow: 'none', paddingHorizontal: 0, marginRight: 16 },
  // NOTE (parity): profile.html:260 `class="green-color h35"`: `.h35{height:35px!important}` beats `.loction-btn button{height:45px}`
  buttonLocation: { height: 35, borderRadius: 0 },
});
