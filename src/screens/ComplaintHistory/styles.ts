// Ported from: src/pages/complaints/complaint-history/complaint-history.scss (only `.filter-select ion-list`, which no element uses) + the global
// rules of src/theme/variables.scss that reach complaint-history.html: `.search.add-search` 1239-1300, `.ion-tab-btn` 778-808, `.data-not` 4393-4402,
// `.main-history` 2631, `.cs-list` 12342-12447. Text styles are built in index.tsx with textStyle(); only boxes live here.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { complaintMd as C } from '../../theme/ionicMdComplaint';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 1259-1264 `.search.add-search { margin: 0; max-height: 68px; padding: 0 }` > `.filter { display: flex; ... width: 100% }`
  search: { maxHeight: 68, margin: 0, padding: 0, width: '100%' },
  filter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  fullWidth: { width: '100%' },
  // [T] 4393-4402 `.data-not { width: 100%; height: calc(100% - 50px); display: flex; center; column }` (the height is set at run time)
  dataNot: { width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
  // [T] 2631-2632 `.main-history { padding: 16px }`
  mainHistory: { padding: 16 },
  // [T] 12342-12350 `.cs-list` (+ `&:last-child { margin-bottom: 0 }`)
  csList: {
    backgroundColor: C.card.background,
    boxShadow: C.card.shadow,
    padding: C.card.padding,
    overflow: 'hidden',
    borderRadius: C.card.radius,
    marginBottom: C.card.marginBottom,
  },
  lastChild: { marginBottom: 0 },
  // [T] 12351-12354 `.top-block { padding-bottom: 5px; border-bottom: 1px dashed #ccc }`
  topBlock: { paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: C.dashed, borderStyle: 'dashed' },
  // [T] 12377-12385 `.top-block.footer-block`: border-top dashed, padding 10 (the later shorthand wins), border-bottom 0, bg #f4f4f4, margin 0 -10 -10
  footerBlock: {
    borderTopWidth: 1,
    borderTopColor: C.dashed,
    borderBottomWidth: 0,
    borderStyle: 'dashed',
    padding: 10,
    backgroundColor: C.footerBg,
    marginHorizontal: -10,
    marginBottom: -10,
  },
  // [T] 12410-12425 `.date-status, .number-block { display: flex; align-items: center; justify-content: space-between }`, `.date-status { padding: 5px 0 }`
  numberBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 },
  dateCell: { flexShrink: 1 },
  // [T] 12402 `.middle-block { padding: 5px 0 }`
  middleBlock: { paddingVertical: 5 },
  // `a.dialer` is a flex item (a block): the 20px icon (`.dialer ion-icon{font-size:2rem}`, html 62.5% = 10px) in a line box; 25dp measured (card 168)
  dialer: { height: 25 },
  // [T] 12367-12373 `span.cs-badge { padding: 2px; border-radius: 6px }` (inline: the vertical padding only paints)
  // NOTE (parity): an inline View sits with its bottom on the baseline, Ionic's span background extends below by descent + 2px: shifted 4px down (check on device)
  badge: { backgroundColor: C.badgeBg, paddingHorizontal: 2, paddingVertical: 2, marginVertical: -2, borderRadius: 6, transform: [{ translateY: 4 }] },
});
