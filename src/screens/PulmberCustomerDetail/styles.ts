// Ported from: src/pages/plumber-camplaints/pulmber-customer-detail/pulmber-customer-detail.scss (empty) + the global rules of src/theme/variables.scss
// that reach pulmber-customer-detail.html: `.lists` 2729-2835, `.add` 4146-4184, `a.phone-call` 4129-4144, `.new-remark` 5068-5111,
// `.gallery` 2837-2946, `.customer-ratings` 4414-4442, `.enquiry-btn(.task-btn)` 2419-2481. Text styles are built in index.tsx with textStyle(); only boxes live here.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { pulmberDetailMd as C } from '../../theme/ionicMdPulmberCustomerDetail';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 2729-2734 `.lists { background: #fff; padding: 16px; box-shadow; margin-bottom: 32px }` (`.mb10 { margin-bottom: 10px !important }` beats it on the first card: see `listsFirst`)
  lists: { backgroundColor: C.white, padding: 16, boxShadow: C.listShadow, marginBottom: 32 },
  listsFirst: { marginBottom: 10 }, // html:14 `.lists mb10` (`.mb10 !important`, main.css)
  // [T] 2735-2738 `.pumber-name { display: flex; align-items: center; padding-bottom: 16px }` (`.pb0 { padding-bottom: 0 !important }`)
  pumberName: { flexDirection: 'row', alignItems: 'center', paddingBottom: 16 },
  pb0: { paddingBottom: 0 },
  // [T] 2739-2757 `span.alphabet { position: absolute; left: 0; ... }` has no `top`: its static position in the flex container is centred
  // (align-items: center) and its containing block is the ion-content scroll area, so `left: 0` is the screen edge (16px = the `.lists` padding).
  alphabetSlot: { position: 'absolute', left: -16, top: 0, justifyContent: 'center' },
  slotPad: { bottom: 16 }, // the pumber-name's padding-bottom (the content box is what the badge centres in)
  slotNoPad: { bottom: 0 }, // `.pb0`
  alphabet: {
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
  // [T] 2758-2771 `.name { width: 100%; position: relative }` > `h4 { padding-bottom: 3px }`
  name: { width: '100%', position: 'relative', paddingLeft: 30 }, // html:17/27 `.name pl30` (`.pl30 !important`)
  nameH4: { paddingBottom: 3 },
  // [T] 4129-4144 `a.phone-call { position: absolute; top: 0; right: 0; display: flex }` > `i { font-size: 22px }`
  phoneCall: { position: 'absolute', top: 0, right: 0 },
  // [T] 4175-4182 `.add p { padding-bottom: 14px }` (`.pb0` wins)
  addP: { paddingBottom: 0 },
  // [T] 2792-2822 `ul li { display: flex; padding-top: 12px }` > `h4 { width: 150px }`, `p { width: 126px; display: inherit (flex) }`, `p span { padding-right: 10px }`
  li: { flexDirection: 'row', paddingTop: 12 },
  liH4: { width: 150 },
  liP: { width: 126, flexDirection: 'row' },
  colon: { paddingRight: 10 },
  grow: { flexShrink: 1 },
  // [T] 2802-2807 `li a { position: absolute; right: 10px }` (relative to the scroll area: the li ends 16px before the screen edge); top = the li's padding-top
  liLink: { position: 'absolute', right: -6, top: 12 },
  // img style="width:100px;height:70px;padding-left:12px" (border-box: the image is 88 wide)
  partImg: { width: 100, height: 70, paddingLeft: 12 },
  partImgInner: { width: 88, height: 70 },
  // [T] 5068-5073 `.new-remark { border: solid 1px #ccc; margin: 16px; padding: 16px }`
  newRemark: { borderWidth: 1, borderColor: C.line, margin: 16, padding: 16 },
  // [T] 5074-5081 `.timing { display: flex; align-items: center; justify-content: space-between; border-bottom: solid 1px #ccc; padding-bottom: 4px }`
  timing: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 4 },
  // [T] 5082-5090 `.date { display: flex }` > `h4 { margin-right: 22px !important }`
  date: { flexDirection: 'row' },
  dateH4: { marginRight: 22 },
  // [T] 5095-5101 `.content { border: solid 1px #ccc; margin-top: 11px; padding: 16px; background: #f7f7f7; border-radius: 6px }`
  content: { borderWidth: 1, borderColor: C.line, marginTop: 11, padding: 16, backgroundColor: C.detailBg, borderRadius: 6 },
  // [T] 2837-2838 `.gallery { padding: 0 16px 16px }`
  gallery: { paddingHorizontal: 16, paddingBottom: 16 },
  pb10: { paddingBottom: 10 },
  // `.select-img ul { display: flex; flex-wrap: wrap }`
  ul: { flexDirection: 'row', flexWrap: 'wrap' },
  // [T] 2850-2858 `.select-img li { background: #D4D4D4; border: 1px solid #707070; padding: 3px; margin: 6px }` (+ the video area's `margin-right: 0`)
  galleryLi: { backgroundColor: C.galleryBg, borderWidth: 1, borderColor: C.galleryBorder, padding: 3, margin: 6 },
  liLast: { marginRight: 0 },
  videoLi: { marginRight: 0 },
  img: { width: '100%', height: 80 },
  // an inline <img> / <iframe> leaves the line box's descender gap below it
  gap: { height: 4 },
  // [T] 4414-4419 `.customer-ratings { padding: 12px 10px; width: 100%; border: solid 1px #ccc; margin-bottom: 26px }`, `ul { display: inline-flex }`, `li { padding-right: 10px }`
  customerRatings: { paddingVertical: 12, paddingHorizontal: 10, width: '100%', borderWidth: 1, borderColor: C.line, marginBottom: 26 },
  stars: { flexDirection: 'row', alignItems: 'flex-start' },
  star: { paddingRight: 10 },
  // `li p { margin: 6px 0 !important; padding-bottom: 10px (from `.customer-ratings p`) }`
  votes: { marginVertical: 6, paddingBottom: 10 },
  // [T] 2463-2481 `.enquiry-btn.task-btn { width: 100%; padding: 0; display: flex }` > `button { margin: 3px !important; border: solid 2px #fff; shadow; radius 6; height 46 }`
  taskBtn: { flexDirection: 'row', width: '100%', padding: 0 },
  taskButton: { flex: 1, margin: 3, height: 46, borderWidth: 2, borderColor: C.white, borderRadius: 6, boxShadow: C.buttonShadow },
  taskLabel: { fontSize: 14, letterSpacing: 2, color: C.white, fontWeight: '400' },
  // `<div class="pr16 pl16">`: `.pr16` / `.pl16` (!important) = 16 each side
  checkinBlock: { paddingHorizontal: 16 },
});
