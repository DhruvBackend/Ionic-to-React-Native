// Ported from: src/pages/points/point-list/point-list.scss (+ the global rules of src/theme/variables.scss that reach point-list.html)
// Citations: [P] point-list.scss line. `.p16`/`.pt16`/`.pr29`/`.w110` are utility classes of the shipped main.css (padding 16 !important,
// padding-top 16, padding-right 29, width 110, all !important).
import { StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { pointListMd as P } from '../../theme/ionicMdPointList';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  // html:14 `class="p16 pt16"`: padding 16 (pt16 re-sets the top to 16)
  wrap: { padding: 16 },
  // [P] 67-75 `.card-list { display: grid; grid-template-columns: 1fr 100px; align-items: center; box-shadow; padding: 16px 10px; border-radius: 16px; margin-bottom: 16px }`
  cardList: {
    flexDirection: 'row',
    alignItems: 'center',
    boxShadow: '0px 3px 6px 0px rgba(0, 0, 0, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: colors.white,
  },
  // [P] 77-81 `.card-content { display: flex; align-items: center; grid-column-gap: 10px }` (the `1fr` grid column)
  cardContent: { flex: 1, flexDirection: 'row', alignItems: 'center', columnGap: 10 },
  // [P] 87-90 `.card-content img { height: 25px; object-fit: cover }`: width auto = 25 (the PNGs are 512x512)
  cardImg: { width: 25, height: 25, flexShrink: 0 },
  // [P] 82-85 `.card-content p { width: 100%; font-size: 14px }` (a flex item that shrinks to the free width)
  cardText: { flex: 1 },
  // [P] 93-98 `.points { text-align: right; font-weight: 600; font-size: 18px; position: relative; padding-right: 22px }`, the grid's 100px column
  points: { width: 100, paddingRight: 22 },
  pointsFlat: { paddingRight: 0 }, // [P] 102-108 `.points.flat { padding-right: 0; &:after { display: none } }`
  // [P] 111-121 `.points:after`: 20x25 box at right 0, top 50%, translateY(-50%), the svg `cover`d (25x25, left aligned, clipped to 20 wide)
  pointsAfter: { position: 'absolute', top: '50%', right: 0, width: 20, height: 25, marginTop: -12.5, overflow: 'hidden' },
  // [P] 3-12 `.point-table { margin: 0 -16px; padding: 0 16px; background: #f7f7f7; margin-bottom: 16px; border-top/bottom: 1px #b3b3b3 dashed }`
  pointTable: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    backgroundColor: P.tableBg,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: P.tableBorder,
    borderStyle: 'dashed',
  },
  // [P] 14-19 `table { width: 100%; table-layout: fixed; border-collapse: collapse }`: one flex row per <tr>
  tr: { flexDirection: 'row', alignItems: 'center' },
  // [P] 20-25 `tr td { font-size: 14px; line-height: 20px; padding: 10px 5px }`
  td: { paddingVertical: 10, paddingHorizontal: 5 },
  tdLabel: { flex: 1 }, // the auto column of the fixed layout
  // `.w110` (width 110 !important, box-sizing border-box) is the fixed column's width
  tdValue: { width: 110 },
  // `.pr29` padding-right 29 !important
  pr29: { paddingRight: 29 },
  // [P] 26-31 `td p { display: flex; align-items: center; grid-column-gap: 5px; justify-content: flex-end }`
  tdP: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', columnGap: 5 },
  // [P] `.points { text-align: right }`, `.text-right` (text-align: right !important)
  right: { textAlign: 'right' },
});
