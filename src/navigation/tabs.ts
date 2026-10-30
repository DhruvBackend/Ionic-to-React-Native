// Ported from: src/pages/tabs/tabs.html + tabs.ts
// Ionic shows one of four <ion-tabs> blocks depending on userStorageData.type; any other type
// matches none of the *ngIf blocks, so no tabs are rendered at all (copied: tabsFor returns []).
// Titles are the same translate keys; icons are the Ionic tabIcon names (SVG backgrounds in
// variables.scss, drawn by the tab bar replica in plan Task 9).

export interface TabDef {
  route: string; // root page of the tab (Ionic [root])
  title: string; // translate key (Ionic tabTitle)
  icon: string; // Ionic tabIcon
}

// tab1Root…tab8Root / tabSEHomeRoot in tabs.ts
const HOME: TabDef = { route: 'Home', title: 'Home', icon: 'tab-home' };
const PROFILE: TabDef = { route: 'Profile', title: 'Profile', icon: 'tab-profile' };

const LOYALTY_TAIL: TabDef[] = [
  { route: 'OfferList', title: 'Offers', icon: 'tab-gift' },
  { route: 'PointList', title: 'My Wallet', icon: 'tab-points' },
  PROFILE,
  { route: 'MainHome', title: 'Menu', icon: 'tab-menu' },
];

// Customer and Retailer blocks are identical in tabs.html.
const CUSTOMER: TabDef[] = [
  HOME,
  { route: 'Newarrivals', title: 'New Arrivals', icon: 'tab-arrivals' },
  { route: 'Contact', title: 'Contact Us', icon: 'tab-contact' },
  { route: 'About', title: 'About Us', icon: 'tab-about' },
  PROFILE,
];

export function tabsFor(type: string | undefined): TabDef[] {
  switch (type) {
    case 'Plumber':
    case 'Sales_Boy':
    case 'Dealer':
      return [HOME, ...LOYALTY_TAIL];
    case 'Sales_Executive':
      return [{ route: 'SalesExecHome', title: 'Home', icon: 'tab-home' }, ...LOYALTY_TAIL];
    case 'Customer':
    case 'Retailer':
      return CUSTOMER;
    default:
      return [];
  }
}
