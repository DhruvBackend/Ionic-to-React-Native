// Ported from: src/pages/main-home/main-home.scss (empty: `page-main-home { }`) + the global rules of src/theme/variables.scss that reach
// main-home.html. Citations: [T] variables.scss line (Ionic source); [CSS] the compiled main.css that Ionic shipped.
// Text styles are built in index.tsx with textStyle(); only boxes live here.
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { mainHomeMd as M } from '../../theme/ionicMdMainHome';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // html:11 `class="list-adjust mt0"`: [T] 4026 `.list-adjust { margin-top: 44px }` loses to [T] 107 `.mt0 { margin-top: 0 !important }`
  listAdjust: { marginTop: 0 },
  // [T] 1794-1797 / 5560 / 7958 `.listing ion-list { margin: 0 }` (beats `.list-md { margin: -1px 0 16px }`)
  list: { marginTop: 0, marginBottom: 0 },
  // The <button ion-item> box. [T] 5560-5575 `.listing button { margin-bottom; border-radius: 6px; background: $white; box-shadow }` (the shadow sits on
  // `shadowBox`: the item clips its content, a shadow on the same box would be cut); [T] 1799-1802 `.listing ion-list button { padding: 8px 16px;
  // margin-bottom: 16px !important }` then [T] 7958 `.listing ion-list button { padding-left: 0 }` and [T] 5570 `padding-right: 16px !important`.
  shadowBox: { marginBottom: 16, borderRadius: 6, backgroundColor: colors.white, boxShadow: M.shadow },
  item: { borderRadius: 6, paddingTop: 8, paddingBottom: 8, paddingLeft: 0, paddingRight: 16, borderLeftWidth: 5 },
  // `.item-inner`: [T] 1803 `padding: 0 16px !important` then `padding-right: 0 !important` (5571, 7958); `border-bottom: inherit !important` (the button has none)
  itemInner: { paddingTop: 0, paddingBottom: 0, paddingLeft: 16, paddingRight: 0 },
  // `ion-label`: [T] 1805-1810 `display: flex; align-items: center; justify-content: space-between; margin: 0 -5px 0 0 !important`,
  // [T] 7958 `ion-label { margin: 0; height: 60px }`; ion-label itself is `flex: 1; overflow: hidden; white-space: nowrap`
  label: { flex: 1, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginRight: -5, overflow: 'hidden' },
  // the label's text node is an anonymous flex item: `white-space: nowrap` keeps it on one line (no ellipsis inside a flex container)
  labelText: { flexShrink: 0 },
  icon: { flexShrink: 0 },
});
