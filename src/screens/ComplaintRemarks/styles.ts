// Ported from: src/pages/complaint-remarks/complaint-remarks.scss (empty) + the global `.remark` rules of src/theme/variables.scss 5014-5063.
// Text styles are built in index.tsx with textStyle(); only boxes live here.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { complaintRemarksMd as R } from '../../theme/ionicMdComplaintRemarks';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [T] 5015-5020 `.remark ion-list { margin: 0; box-shadow; margin-bottom: 20px; border: solid 1px #cccccc91 }`
  list: { margin: 0, boxShadow: R.listShadow, marginBottom: 20, borderWidth: 1, borderColor: R.listBorder },
  // [T] 5021-5024 `button { padding-left: 0; min-height: inherit !important }`
  item: { paddingLeft: 0, minHeight: 0 },
  // [T] 5025-5026 `.item-inner { padding: inherit; padding-right: 0 !important }` (all of the button's paddings are 0 here); min-height inherit
  inner: { padding: 0, minHeight: 0 },
  // [T] 5028-5029 `ion-label { margin: 0 }` (flex: 1, nowrap)
  label: { flex: 1, margin: 0, overflow: 'hidden' },
  // [T] 5030-5031 `.time-table { padding: 16px }`
  timeTable: { padding: 16 },
  // [T] 5032-5036 `.info { display: flex; align-items: center; justify-content: space-between; border-bottom: solid 1px #ccc }`
  info: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: R.line },
  // [T] 5037-5042 `h4 { padding-bottom: 10px }`
  h4: { paddingBottom: 10 },
  // [T] 5044-5051 `.remak-detail { border: solid 1px #ccc; margin-top: 11px; padding: 16px; background: #f7f7f7; border-radius: 6px }`
  remarkDetail: { borderWidth: 1, borderColor: R.line, marginTop: 11, padding: 16, backgroundColor: R.detailBg, borderRadius: 6 },
});
