// Ported from: src/pages/terms/terms.module.ts (no push targets in terms.ts)
import type { RouteMeta } from '../../navigation/types';

// Ionic: terms.ts has no navigation. Pushed from offers.ts:50 / :53 push(TermsPage, {id, term}), but both calls sit behind
// `*ngIf="gift_list.length && notdata"` in offers.html, which can never be true (see the Offers card), and no other page references TermsPage.
// So the page is not reachable in production for any client (card Status LIVE, no feature flag). Ported anyway.
const route: RouteMeta = {
  name: 'Terms',
  presentation: 'card',
  links: [],
};

export default route;
