// Ported from: src/pages/scan-point/scan-point.scss (+ the global rules of src/theme/variables.scss that reach scan-point.html)
// Citations: [S] scan-point.scss line; [CSS] the compiled main.css that Ionic shipped. Text styles are built in index.tsx with textStyle().
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { scanPointMd as S } from '../../theme/ionicMdScanPoint';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // [S] 79-95 `.qr-code-data { text-align: center; height: 70vh (set in index.tsx); display: flex; align/justify center; column }`
  qrCodeData: { alignItems: 'center', justifyContent: 'center' },
  // [S] 97-99 `img { height: 170px }`
  qrImage: { height: 170 },
  // [S] 102-104 `p { font-size: 16px; margin-top: 16px !important }`
  qrText: { textAlign: 'center', marginTop: 16 },
  // [S] 106-108 `ion-list-header { margin-bottom: 0 !important; border-bottom: 2px solid #d7ab52 }` (font-size / line-height in index.tsx)
  listHeader: { marginBottom: 0, borderBottomWidth: 2, borderBottomColor: S.headerBorder },
  // [S] 110-113 `&.total-points { border-top: 0 }`
  totalHeader: { marginBottom: 0, borderTopWidth: 0, borderBottomWidth: 2, borderBottomColor: S.headerBorder },
  // [S] 114-127 `.total-points span { float: right; margin-right: 20px ... }`: the floated value + unit at the end of the header
  totalValueRow: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  // [S] 123-126 `span span { margin-left: 5px }`
  totalUnit: { marginLeft: 5 },
  // [S] 3-6 `ion-item ion-label { display: grid; align-items: center; justify-content: space-between; grid-template-columns: 1fr 100px }`
  grid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftBlock: { flex: 1 },
  // [S] 32-47 `.right-block { text-align: right; display: flex; align-items: center; justify-content: flex-end; column-gap: 4px }` in a 100px column
  rightBlock: { width: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', columnGap: 4 },
  // [S] 38-47 `h2 { display: flex; justify-content: flex-end; column-gap: 5px }`
  rightH2: { flexDirection: 'row', justifyContent: 'flex-end', columnGap: 5 },
  // [S] 130-137 `.ragistration-fields`
  fields: {
    padding: 16,
    backgroundColor: S.fieldsBackground,
    boxShadow: S.fieldsShadow,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: S.fieldsBorder,
  },
  // `.heading.line.mt0.mb16`: `.mt0 { margin-top: 0 !important }`, `.mb16 { margin-bottom: 16px !important }` ([CSS])
  heading: { marginTop: 0, marginBottom: 16 },
  // [S] 139-141 `.cs-form ion-list { margin: 0 !important }`
  formList: { marginTop: 0, marginBottom: 0 },
  // [S] 142-146 `ion-item { margin-bottom: 10px }` + `.cs-input { min-height: inherit; height: 40px }`
  csItem: { marginTop: 0, marginBottom: 10, minHeight: 0, height: 40 },
  // [S] 306-312 `p.error-msg { text-align: right; margin-top: -8px !important; margin-bottom: 10px !important }`
  errorMsg: { textAlign: 'right', marginTop: -8, marginBottom: 10 },
  // `.mt16 { margin-top: 16px !important }`
  mt16: { marginTop: 16 },
});
