// Ported from: src/pages/cancel-complaint/cancel-complaint.module.ts (+ the modalCtrl.create call in complaint-detail.ts:108)
import type { RouteMeta } from '../../navigation/types';

// Ionic: an Ionic MODAL page (src/navigation/ionicModalPages.json), opened by ComplaintDetail.cancelComplaint(label) with {id, label}
// (`label` is never read: its line in cancel-complaint.ts:32 is commented out). closeModal() = viewCtrl.dismiss(). Live for every role.
const route: RouteMeta = {
  name: 'CancelComplaint',
  presentation: 'modal',
  links: [],
};

export default route;
