// Ported from: src/pages/complaints/complaint-detail/complaint-detail.module.ts (+ the nav targets in complaint-detail.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: pushed by ComplaintHistory.onComplaintdetail(id) with {'id': id} (also by other complaint lists). :103 modalCtrl.create(ViewProfilePage,
// {Image}), :108 modalCtrl.create(CancelComplaintPage, {id, label}). Live for every role (card Status LIVE, no feature flag).
const route: RouteMeta = {
  name: 'ComplaintDetail',
  presentation: 'card',
  links: ['ViewProfile', 'CancelComplaint'],
};

export default route;
