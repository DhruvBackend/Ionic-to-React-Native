// Ported from: src/pages/plumber-camplaints/pulmber-customer-detail/pulmber-customer-detail.module.ts (+ the nav targets in pulmber-customer-detail.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: pushed by MyCamplaints.plumberDetail(id) with {'id': id, 'close_com': false}. :175 modalCtrl.create(ViewProfilePage, {Image}),
// :180 push(TaskClosePage, {id, mobile, name, lable}), :210 push(ComplaintRemarksPage, {id}), :214 modalCtrl.create(ViewProfilePage, {Image, mode: 'profile'}).
// Plumber only (card). TaskClose is not ported yet (placeholder route).
const route: RouteMeta = {
  name: 'PulmberCustomerDetail',
  presentation: 'card',
  links: ['ViewProfile', 'TaskClose', 'ComplaintRemarks'],
};

export default route;
