// Ported from: src/pages/home/home.ts (+ the push targets in its click handlers; home has no module file, tabs.ts imports it)
import type { RouteMeta } from '../../navigation/types';

// Ionic: tabs.ts tab1Root. Live for every role (card Status LIVE, no feature flag). `links` lists only targets a visible control
// can reach; the dead handlers (goOnPointListPage, goOnOffersListPage, goOnPointeListPage, goOnGiftListPage, viewProfiePic,
// goOnOpenComplaintAdd, goToNearestDealers, goToFav, add, list, SurveyList, goTodigitalcat) and the push-tap routing of
// notification() / initPushNotification() (Feedback, OfferList, Transaction, GiftDetail, Products, Video, MyCamplaints, Profile:
// push is off for Topbath) are left out.
const route: RouteMeta = {
  name: 'Home',
  presentation: 'card',
  links: [
    'Newarrivals',
    'PointList',
    'CoupanCode',
    'ScanPoint',
    'Offers',
    'MyCamplaints',
    'Category',
    'PlumberList',
    'Customerlist',
    'AddNewComplaint',
    'Pointtranfer',
    'SalesPointTransfer',
    'ComplaintHistory',
    'PlumberCheckin',
    'VideoCategory',
    'Video',
    'Notification',
    'QuotationGenrateByPdf',
  ],
};

export default route;
