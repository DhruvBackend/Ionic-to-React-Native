// Ported from: src/pages/notification/notification.scss (+ [T] 4393-4402 `.data-not` of src/theme/variables.scss).
// Text styles (size, weight, line height) are built in index.tsx with textStyle(); only boxes live here.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { notificationMd as N } from '../../theme/ionicMdNotification';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [N] 4-9 `.notification-list { border-bottom: 1px solid #ccc; padding: 5px 16px }` (the first `padding: 5px 0px` and `margin: 0 auto` are overridden/neutral)
  row: { borderBottomWidth: 1, borderBottomColor: N.rowBorder, paddingVertical: 5, paddingHorizontal: 16 },
  // [N] 26-28 `&:last-child { border-bottom: 0 }`
  rowLast: { borderBottomWidth: 0 },
  // [N] 30-32 `&.new { background: #ebf7ff }`
  rowNew: { backgroundColor: N.unreadBg },
  // [N] 18-24 `span { width: 100%; text-align: right; display: block }`
  date: { width: '100%', textAlign: 'right' },
  // [T] 4393-4402 `.data-not { width: 100%; height: calc(100% - 50px); flex column centred }`; the height is set from the measured content height
  dataNot: { width: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
});
