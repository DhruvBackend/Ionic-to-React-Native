// Ported from: src/pages/retailer-list-complaint/retailer-list-complaint.scss (empty) + the global rules of src/theme/variables.scss that reach
// retailer-list-complaint.html: `.cs-list` 12342-12447 (see ComplaintHistory). Text styles are built in index.tsx; only boxes live here.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { complaintMd as C } from '../../theme/ionicMdComplaint';
import { retailerListComplaintMd as L } from '../../theme/ionicMdRetailerListComplaint';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 12342-12350 `.cs-list` (+ `&:last-child { margin-bottom: 0 }`: it is the only child of the scroll content)
  csList: {
    backgroundColor: C.card.background,
    boxShadow: C.card.shadow,
    padding: C.card.padding,
    overflow: 'hidden',
    borderRadius: C.card.radius,
    marginBottom: 0,
  },
  // [T] 12351-12354 `.top-block { padding-bottom: 5px; border-bottom: 1px dashed #ccc }`
  topBlock: { paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: C.dashed, borderStyle: 'dashed' },
  // [T] 12410-12425 `.date-status, .number-block { display: flex; align-items: center; justify-content: space-between }`, `.date-status { padding: 5px 0 }`
  numberBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 5 },
  dateCell: { flexShrink: 1 },
  // [T] 12402 `.middle-block { padding: 5px 0 }`
  middleBlock: { paddingVertical: 5 },
  // `a.dialer` is a flex item (a block): the 20px icon (`.dialer ion-icon{font-size:2rem}`) in a line box; 25dp measured (see ComplaintHistory)
  dialer: { height: 25 },
  // [T] 12367-12373 `span.cs-badge { padding: 2px; border-radius: 6px }` (inline; see ComplaintHistory)
  badge: { backgroundColor: C.badgeBg, paddingHorizontal: 2, paddingVertical: 2, marginVertical: -2, borderRadius: 6, transform: [{ translateY: 4 }] },
  // [T] 12429-12446 `.botm-block { margin: 0 -10px -10px; padding: 10px; background }`
  botmBlock: { marginHorizontal: -10, marginBottom: -10, padding: 10, backgroundColor: L.botmBackground },
  // `.botm-block p ion-icon { font-size: 22px; margin-right: 5px }`
  navigateIcon: { marginRight: 5 },
});
