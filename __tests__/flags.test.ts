// Phase 6 flags: the feature flags really hide the flagged screens (spec §6.3).
//  (a) topbath: a walk over the route links from `Language` and from every tab root reaches no route whose feature is off.
//      (Routes with a feature that is ON for Topbath, e.g. pointTransfer / quotation, are live pages and are reached.)
//  (b) _all-features: the same walk reaches every route, except the explicit allow-list below.
// A link to a route whose feature is off is not followed (isRouteEnabled), exactly as the navigator does not register it.
import { routes } from '../src/navigation/routes.generated';
import { isRouteEnabled } from '../src/navigation/routes';
import { tabsFor } from '../src/navigation/tabs';
import type { ClientConfig } from '../src/config/types';
import topbath from '../clients/topbath/client.json';
import allFeatures from '../clients/_all-features/client.json';

const ROLES = ['Plumber', 'Sales_Boy', 'Dealer', 'Sales_Executive', 'Customer', 'Retailer'];

// Routes that no link leads to even with every feature on, because Ionic has no markup that calls the push (the handler is unbound, or only a
// push notification / a dead page reaches the page). Keep this list explicit: a new unreachable route must be added here on purpose.
const UNREACHABLE_WITH_ALL_FEATURES: Record<string, string> = {
  // feature-flagged pages whose only Ionic caller is a method no template binds
  Enquiry: 'product-subdetail.ts:160 goToEnquiryPage(): product-subdetail.html has no (click) for it, and no commented-out markup either',
  FavoriteProduct: 'home.ts:880 goToFav(): no template binds it',
  GiftList: 'home.ts:551 goOnGiftListPage(), sales-exec-home.ts:107 goGiftGallery(): no template binds them',
  LoginScreen: 'no navigation to LoginScreen anywhere in src/pages or src/app',
  News: 'main-home.ts:60 goOnNewsPage(): no template binds it',
  NewsDetail: 'only linked from News (news.ts:30), which is unreachable',
  PointDetail: 'point-list.ts:65 goOnPointDetailPage(): no template binds it',
  RetailerAddComplaint: 'home.ts:940 add(): no template binds it',
  RetailerListComplaint: 'home.ts:943 list(): no template binds it',
  Scan: 'no navigation to Scan anywhere in src/pages or src/app',
  // not feature-flagged: opened only by the push-notification tap routing, which is off for Topbath and not a route link
  Feedback: 'push-notification target (home.ts notification())',
  ShippingDetail: 'push-notification target (home.ts notification())',
  Transaction: 'push-notification target (home.ts notification())',
};

function reachable(client: ClientConfig): Set<string> {
  const byName = new Map(routes.map(r => [r.name, r]));
  const seeds = ['Language', ...ROLES.flatMap(role => tabsFor(role).map(t => t.route))];
  const seen = new Set<string>();
  const queue = [...seeds];
  while (queue.length) {
    const name = queue.shift() as string;
    const r = byName.get(name);
    if (!r || seen.has(name) || !isRouteEnabled(r, client)) {
      continue;
    }
    seen.add(name);
    queue.push(...r.links);
  }
  return seen;
}

describe('feature flags', () => {
  test('topbath: the walk from Language and the tab roots reaches no route whose feature is off', () => {
    const seen = reachable(topbath as ClientConfig);
    const off = routes.filter(r => r.feature && seen.has(r.name) && (topbath as ClientConfig).features[r.feature] !== true).map(r => r.name);
    expect(off).toEqual([]);
    expect(seen.has('Language')).toBe(true); // the walk is not vacuous
    expect(seen.size).toBeGreaterThan(10);
  });

  test('topbath: the only flagged routes that are on are the live ones', () => {
    const on = routes.filter(r => r.feature && isRouteEnabled(r, topbath as ClientConfig)).map(r => r.feature);
    const live = ['pointTransfer', 'quotation', 'superPlumber']; // superPlumber: PulmberCustomerDetail, not merged into every branch yet
    expect(on.filter(f => !live.includes(f as string))).toEqual([]);
  });

  test('topbath: the flagged-off routes are not in the walk even though a screen links to them', () => {
    const seen = reachable(topbath as ClientConfig);
    const names = routes.filter(r => r.feature && (topbath as ClientConfig).features[r.feature] !== true).map(r => r.name);
    names.forEach(n => expect(seen.has(n)).toBe(false));
    // some enabled screen does link to a flagged-off route (so the skip is what keeps it unreachable)
    const linked = routes.filter(r => seen.has(r.name)).flatMap(r => r.links);
    expect(names.some(n => linked.includes(n))).toBe(true);
  });

  test('_all-features: every route is reachable (except the allow-list)', () => {
    const seen = reachable(allFeatures as ClientConfig);
    const missing = routes.map(r => r.name).filter(n => !seen.has(n) && !(n in UNREACHABLE_WITH_ALL_FEATURES));
    expect(missing).toEqual([]);
    // the allow-list must not hide a route that is reachable after all
    expect(Object.keys(UNREACHABLE_WITH_ALL_FEATURES).filter(n => seen.has(n))).toEqual([]);
  });
});
