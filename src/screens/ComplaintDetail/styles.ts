// Ported from: src/pages/complaints/complaint-detail/complaint-detail.scss (.basic-table) + the global rules of src/theme/variables.scss that reach
// complaint-detail.html: `.gallery` 2837-2946, `.plumber-rating` 3008-3027, `.main-field(.remove-padding)` 821-1150, `.rupee-btn` 1151-1162,
// `.enquiry-btn(.task-btn)` 2419-2481, `.padding10/16` 12568-12574. Text styles are built in index.tsx with textStyle(); only boxes live here.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { complaintMd as C } from '../../theme/ionicMdComplaint';
import { listMd } from '../../theme/ionicMdContent';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  pb10: { paddingBottom: 10 },
  pb5: { paddingBottom: 5 },
  mv10: { marginVertical: 10 }, // `.gallery h2 { margin: 10px 0 !important }`
  capitalize: { textTransform: 'capitalize' },
  list: { margin: 0 }, // `.main-field .cs-form ion-list { margin: 0 }`
  amountHeading: { marginBottom: -8 }, // `.remove-padding .cs-form h4 { margin-bottom: -8px !important }`
  amountInput: { paddingLeft: 13 + 32, paddingTop: 0 },
  padding10: { padding: 10 },
  // complaint-detail.scss `.basic-table { box-shadow: 0 3px 6px 0 rgba(0,0,0,.3); border-radius: 10px }` (no background, no overflow)
  basicTable: { boxShadow: C.tableShadow, borderRadius: 10 },
  // `table { width: 100%; table-layout: fixed }`: two equal columns (no width given); `td { padding: 8px }`; `tr { border-bottom: 1px solid #eeec }`
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.rowBorder },
  trLast: { borderBottomWidth: 0 },
  // `td` has the UA default `vertical-align: middle`: a multi-line cell (Address) centres its neighbour
  td: { flex: 1, padding: 8, justifyContent: 'center' },
  // `<td class="w120">` `.w120{width:120px!important}` (border-box, so the padding is inside the 120)
  tdFirst: { flex: 0, width: 120 },
  // [T] 2837-2838 `.gallery { padding: 0 16px 16px }`
  gallery: { paddingHorizontal: 16, paddingBottom: 16 },
  // `.select-img ul { display: flex; flex-wrap: wrap }`
  ul: { flexDirection: 'row', flexWrap: 'wrap' },
  // [T] 2850-2858 `.select-img li { background: #D4D4D4; border: 1px solid #707070; padding: 3px; margin: 6px }` (+ the video area's `margin-right: 0`)
  li: { backgroundColor: C.galleryBg, borderWidth: 1, borderColor: C.galleryBorder, padding: 3, margin: 6 },
  liLast: { marginRight: 0 },
  videoLi: { marginRight: 0 },
  // `img { width: 100%; height: 80px }` (stretched: Ionic does not keep the aspect ratio here)
  img: { width: '100%', height: 80 },
  // an inline <img> / <iframe> leaves the line box's descender gap below it
  gap: { height: 4 },
  // [T] 2890-2896 `.gallery .rating-area { border: 1px solid #DEDEDE; border-radius: 6px; width: 100% }`
  ratingArea: { borderWidth: 1, borderColor: C.line, borderRadius: 6, width: '100%' },
  // `.border-box { display: flex; align-items: center; width: 100%; border-bottom: 1px solid #DEDEDE }`
  borderBox: { flexDirection: 'row', alignItems: 'center', width: '100%', borderBottomWidth: 1, borderBottomColor: C.line },
  // `.boxs { padding: 8px; width: 50%; border-right: 1px solid #CCC }`, `&:last-child { border-right: 0 !important }`
  boxs: { padding: 8, width: '50%', borderRightWidth: 1, borderRightColor: C.lineStrong },
  boxsLast: { borderRightWidth: 0 },
  // `.ratings { padding: 12px 10px; width: 100% }`, `ul { display: inline-flex }`
  ratings: { paddingVertical: 12, paddingHorizontal: 10, width: '100%' },
  stars: { flexDirection: 'row', alignItems: 'flex-start' },
  star: { paddingRight: 10 },
  // `li p { margin: 6px 0 !important; padding-bottom: 10px (from `.ratings p`) }`
  votes: { marginVertical: 6, paddingBottom: 10 },
  // [T] 821-827 `.main-field`, 1107-1112 `.remove-padding { background: transparent; width: 100%; height: inherit; padding: 15px }`
  mainField: { backgroundColor: 'transparent', width: '100%', padding: 15, position: 'relative' },
  // `.remove-padding .cs-form ion-list ion-item { width: 74% }`
  // `.list-md .item-input:last-child { border-bottom: 1px solid #dedede }` sits OUTSIDE the item's min-height 45: 46 tall (the border is not in a kit isLast
  // item here: the item is wrapped in `amountWrap`)
  amountItem: { width: '100%', minHeight: 46, borderBottomWidth: listMd.borderWidth, borderBottomColor: listMd.borderColor },
  // measured on the closed crop (Ionic): the form is 108dp tall (15 padding, heading, input 46, 28 below it). The RN stack came out 10dp taller (kit item
  // margin kept inside the wrapper; RN margins do not collapse), so the height is pinned instead of guessed.
  amountForm: { height: 108 },
  amountWrap: { width: '74%' },
  rupeeIcon: { position: 'absolute', left: 13, top: 27 },
  // [T] 1151-1162 `.rupee-btn { position: absolute; right: 11px; top: 52%; translateY(-50%); height: 42px }` > `button { height: 43px; border-radius: 0; box-shadow: none }`
  // 52% of the 108dp field (padding box) - 21 = 35. A % `top` in RN resolves against the content box (field minus padding), which put the button 11dp too high.
  rupeeBtn: { position: 'absolute', right: 11, top: 35, height: 42 },
  rupeeButton: { height: 43, borderRadius: 0, boxShadow: 'none' },
  // [T] 3008-3027 `.plumber-rating { background: #F5F5F5; padding: 5px 32px 25px }`, `li { padding-right: 26px }`
  plumberRating: { backgroundColor: C.ratingBg, paddingTop: 5, paddingHorizontal: 32, paddingBottom: 25 },
  rateStar: { paddingRight: 26 },
  // [T] 2419-2481 `.enquiry-btn.task-btn { display: flex }` + `.padding16` + `button { margin: 0 !important (later `.enquiry-btn.task-btn button`); border: 2px solid #fff; shadow; radius 6; height 46 }`
  taskBtn: { flexDirection: 'row', padding: 16 },
  taskButton: { flex: 1, margin: 0, height: 46, borderWidth: 2, borderColor: C.white, borderRadius: 6, boxShadow: C.buttonShadow },
  taskLabel: { fontSize: 14, letterSpacing: 2, color: C.white, fontWeight: '400' },
});
