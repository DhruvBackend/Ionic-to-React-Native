// Colours of the PointList page (point-list.scss, page-scoped) that the screen cannot spell as hex (lint rule).
// Citations: [P] src/pages/points/point-list/point-list.scss in the Ionic source. NOTE: added for the PointList screen.
export const pointListMd = {
  // [P] 7 `.point-table { background: #f7f7f7 }`
  tableBg: '#f7f7f7',
  // [P] 9-10 `.point-table { border-top/bottom: 1px #b3b3b3 dashed }`
  tableBorder: '#b3b3b3',
  // [P] 41 `td.red-text { color: #ff0000 }`
  red: '#ff0000',
} as const;
