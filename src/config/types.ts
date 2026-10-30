// Shape of clients/<id>/client.json (validated by clients/client.schema.json).
// Everything that differs between the 70+ apps built from the Ionic template lives here, never in screens.

export type Role = 'Plumber' | 'Sales_Boy' | 'Dealer' | 'Sales_Executive' | 'Customer' | 'Retailer';

// One flag per screen group or behaviour that some clients have and others don't.
// Topbath turns on only what its Ionic app actually reaches (spec §6.3).
export type FeatureKey =
  | 'push'
  | 'sfa'
  | 'giftList'
  | 'pointDetail'
  | 'scanPage'
  | 'loginScreen'
  | 'digitalCatalog'
  | 'editProfile'
  | 'enquiry'
  | 'favorites'
  | 'news'
  | 'survey'
  | 'nearestDealer'
  | 'retailerComplaints'
  | 'search'
  | 'superPlumber'
  | 'quotation'
  | 'pointTransfer'
  | 'nativeNavigation'
  | 'nativeGeocode';

// Same names as the Ionic dbservice.ts fields, so ported code reads naturally.
export interface Urls {
  rootUrl: string;
  rootUrlSfa: string;
  image_url: string;
  upload_url1: string;
  upload_url2: string;
  upload_url3: string;
  video_url: string;
  product_image_url: string;
  category_url: string;
  videoUpload: string; // complaint video upload endpoint; '' when the client has none
  legacyImageHost: string; // hardcoded image hosts in Ionic templates (copied for parity)
  gravityImageHost: string;
}

// Ionic has two colour sets and both are used: `$colors` drives color="x" on Ionic components,
// the plain SCSS variables drive custom page styles. Values differ (e.g. danger), so both are kept.
export interface Colors {
  primary: string;
  statusBar: string;
  ionic: Record<'secondary' | 'danger' | 'light' | 'success' | 'red' | 'white' | 'warning' | 'dark', string>;
  scss: Record<'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'light' | 'dark' | 'white' | 'black' | 'blue', string>;
}

export interface Contact {
  phone: string; // used in tel: links
  phoneDisplay: string; // shown on screen
  email: string;
  addressKey: string; // i18n key, rendered through translate like the Ionic template
  mapEmbedUrl: string; // Contact page iframe
  geoLatLng: string; // contact.ts geo: link
  geoLabel: string;
  nearestDealerPhone: string;
}

export interface ClientConfig {
  id: string;
  appName: string;
  androidPackage: string;
  iosBundleId: string;
  versionName: string;
  versionCode: number;
  playStoreId: string;
  platforms: ('android' | 'ios')[];
  urls: { LIVE: Urls; DEV: Urls };
  colors: Colors;
  contact: Contact;
  companyName: string;
  languages: string[];
  countries: string[];
  roles: Role[];
  fcmSenderId: string;
  features: Record<FeatureKey, boolean>;
  brandLabels: Record<string, string>;
  assetsFrom?: string; // reuse another client's assets folder (test configs)
}
