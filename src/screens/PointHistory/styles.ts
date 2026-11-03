// Ported from: src/pages/point-history/point-history.scss + the global rules of src/theme/variables.scss that reach point-history.html.
// Citations: [P] point-history.scss line (Ionic source); [T] variables.scss line; [CSS] the compiled main.css that Ionic shipped.
// Text styles (font size, weight, line height) are built in index.tsx with textStyle(); only boxes live here.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { pointHistoryMd as P } from '../../theme/ionicMdPointHistory';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [P] 10-18 `.full_width { font-size: 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #0000007a; padding-bottom: 10px }`
  fullWidth: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: P.rowBorder,
    paddingBottom: 10,
  },
  // [P] 24-26 `.full_width:last-child { border: 0 }`
  lastChild: { borderBottomWidth: 0 },
  // `.part_one` / `.part_two` are flex items (flex: 0 1 auto) of `.full_width`
  partOne: { flexShrink: 1 },
  partTwo: { flexShrink: 1, paddingTop: 10 }, // `.pt10 { padding-top: 10px !important }` ([CSS])
  // `<ul class="pt10">`: [CSS] `ul { list-style: none !important; margin: 0; padding: 0 }` + pt10
  ul: { paddingTop: 10 },
  // [P] 31-34 `.part_one ul li { padding-bottom: 3px }`
  li: { paddingBottom: 3 },
  // [P] 35-37 `.part_two > span { text-align: center; display: block }`
  center: { textAlign: 'center' },
  // html:60 `style="text-transform: capitalize;"`
  capitalize: { textTransform: 'capitalize' },
  // [P] 63-65 `.data-not { height: calc(100vh - 140px) }` (the height is set at run time); [T] 4393-4402 `.data-not { width: 100%; display: flex; center; column }`
  dataNot: { width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
  // [T] 12083-12086 `.his-listing { padding: 10px 16px !important }` + [P] 29-31 `.border-bottom { border-bottom: 1px solid #0000007a !important }`
  // (the !important 1px shorthand beats the 5px border of `.transaction-list .his-listing`)
  hisListing: { borderBottomWidth: 1, borderBottomColor: P.rowBorder, paddingVertical: 10, paddingHorizontal: 16 },
  // [T] 12088-12090 `button.main-list { padding-left: 0 }`; `.item-inner { padding: 0 !important; border: 0 !important }` (12091-12093)
  mainList: { paddingLeft: 0 },
  itemInner: { padding: 0 },
  // the auto-created <ion-label>: margin 0 !important ([T] 12094-12101), flex 1, overflow hidden, white-space nowrap
  label: { flex: 1, overflow: 'hidden', margin: 0 },
  // [T] 12103-12106 `.tr-content`
  trContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // [T] 12107-12110 `.inner` (nowrap text keeps its min-content width: no shrink)
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  // [T] 12111-12125 `.tr-cicle`
  trCircle: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: P.circleBorder,
    backgroundColor: P.circleBg,
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  trTags: { flexShrink: 0 },
  // [T] 12131-12136 `.tr-tags h1 { margin-top: 3px !important }`, 12137-12142 `p { margin-top: 3px !important }`
  trTagsH1: { marginTop: 3 },
  trTagsP: { marginTop: 3 },
  // [T] 12149-12150 `.tr-points { text-align: right }`
  trPoints: { alignItems: 'flex-end', flexShrink: 0 },
  trPointsText: { textAlign: 'right' },
  // [T] 12170-12174 `.tr-status { display: flex; align-items: center; justify-content: space-between; margin-top: 10px }`
  trStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
});
