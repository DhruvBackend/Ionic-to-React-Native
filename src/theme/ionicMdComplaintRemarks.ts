// Values of the ComplaintRemarks page (Ionic ComplaintRemarksPage) that the screen cannot spell as hex (lint rule): the global `.remark`
// rules of src/theme/variables.scss that reach complaint-remarks.html. [T] = variables.scss line. NEW FILE added by the PlumberFlow port.
export const complaintRemarksMd = {
  ink: '#000', // [T] 5037 h4 / 5056 span colour
  paragraph: '#666', // item.md.scss `.item-md p` colour (Topbath sets no colour on `.remak-detail p`)
  listShadow: '0px 4px 5px -2px rgba(0, 0, 0, 0.2)', // [T] 5017 ion-list box-shadow (!important)
  listBorder: '#cccccc91', // [T] 5019 border: solid 1px #cccccc91
  line: '#ccc', // [T] 5034 .info border-bottom, 5046 .remak-detail border
  detailBg: '#f7f7f7', // [T] 5049
} as const;
