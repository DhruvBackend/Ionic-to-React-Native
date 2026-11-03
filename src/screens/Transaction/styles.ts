// Ported from: src/pages/transaction/transaction.scss (empty: `page-transaction { }`) + the global rules of src/theme/variables.scss that reach
// transaction.html. Citations: [T] variables.scss line (Ionic source); [CSS] the compiled main.css that Ionic shipped.
// Text styles (font size, weight, line height) are built in index.tsx with textStyle(); only boxes live here.
import { StyleSheet } from 'react-native';
import { transactionMd as T } from '../../theme/ionicMdTransaction';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.white },
  // [T] 3535-3564 `.top-nav { background; position: relative; overflow: hidden }` (+ `.nav-adjust h1 { padding-bottom: 11px }`)
  topNav: { backgroundColor: T.topNavBg, overflow: 'hidden' },
  // [T] 3537-3542 `.top-nav p { padding-left: 16px; padding-top: 16px }`
  topNavP: { paddingLeft: 16, paddingTop: 16 },
  // [T] 3543-3551 `.top-nav h1 { padding-left: 16px }` + [T] 3565-3568 `.nav-adjust h1 { padding-bottom: 11px }`
  topNavH1: { paddingLeft: 16, paddingBottom: 11 },
  // [T] 3552-3562 `.top-nav:after` (+ `.nav-adjust:after { bottom: -35px }`): 91x97 box, `background-size: cover` of a square svg = 97x97 centred
  surpriseBox: { position: 'absolute', bottom: -35, right: 10, width: 91, height: 97, overflow: 'hidden' },
  surprise: { marginLeft: -3 },
  // [T] 12084-12086 `.his-listing { border-bottom: 5px solid rgba(167,166,166,.5); padding: 10px 16px !important }`
  hisListing: { borderBottomWidth: 5, borderBottomColor: T.listBorder, paddingVertical: 10, paddingHorizontal: 16 },
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
    borderColor: T.circleBorder,
    backgroundColor: T.circleBg,
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
  // [T] 12268-12278 `.btn-received button { padding: 10px 10px !important; padding-left: 26px !important; border-radius: 3px }`
  receiveButton: { backgroundColor: T.receiveButton, borderRadius: 3, paddingVertical: 10, paddingRight: 10, paddingLeft: 26 },
  // `.h100 { height: 100px !important }` ([CSS]; the rule is not in the scss sources that were searched but ships in main.css)
  h100: { height: 100 },
});
