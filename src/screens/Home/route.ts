// Ported from: src/pages/home/home.ts (+ the push targets in its click handlers; home has no module file, tabs.ts imports it)
import type { RouteMeta } from '../../navigation/types';

// Ionic: tabs.ts tab1Root. Live for every role (card Status LIVE, no feature flag). `links` lists only targets a visible control
// can reach; the dead handlers (goOnPointListPage, goOnOffersListPage, goOnPointeListPage, goOnGiftListPage, viewProfiePic,
// goOnOpenComplaintAdd, goToFav, add, list) and the push-tap routing of
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
    // Phase 6: the commented-out buttons (home.html:101 Digital Catalogue, :105 Nearest Plumbers, :310 Survey) are drawn only when the client
    // has the target route enabled (feature flag on); the targets are flagged, so Topbath never reaches them.
    'Digitalcatalog',
    'NearestDealer',
    'SurveyList',
  ],
};

export default route;
