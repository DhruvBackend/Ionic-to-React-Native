// Navigation from outside screens (start-up logic, push notifications, debug links).
import { createNavigationContainerRef } from '@react-navigation/native';
import modalPages from './ionicModalPages.json';
import portalPushedPages from './ionicModalPortalPages.json';

export const navigationRef = createNavigationContainerRef<any>();

// Ionic app.getRootNav().setRoot(Page, params): replace everything with one page.
export function resetTo(name: string, params?: object): void {
  if (navigationRef.isReady()) {
    // resetRoot, not reset: the container's reset() is handled by the FOCUSED (deepest) navigator, so inside the tabs it
    // only reset the current tab's stack (seen on the phone 2026-11-02). Ionic setRoot on the root nav replaces everything.
    navigationRef.resetRoot({ index: 0, routes: [{ name, params }] });
  }
}

type NavState = { type?: string; index?: number; routes: { state?: NavState }[] };

// Ionic's hardware back (app.component.ts:165-243) asks app.getActiveNavs()[0].canGoBack(): the ACTIVE nav is the
// deepest one that is showing — inside <ion-tabs> it is the selected tab's own nav. So after Otp pushes Tabs over the
// login pages, back on a tab root page sees canGoBack() false (the login pages are in the root nav, not the tab's).
// Mirror that: walk the focused route of every navigator and answer for the deepest *stack* (tab navigators are skipped).
export function activeNavCanGoBack(root: NavState | undefined): boolean {
  let s: NavState | undefined = root;
  let deepest: NavState | undefined;
  while (s) {
    if (s.type === 'stack') {
      deepest = s;
    }
    s = s.routes[s.index ?? 0]?.state;
  }
  return (deepest?.index ?? 0) > 0;
}

// Ionic app.getActiveNav(): the deepest stack that is showing (inside <ion-tabs> the selected tab's own nav). Returns its active and
// previous route names (class names without 'Page'). Used to copy ionViewDidLeave checks such as offer-list.ts:131.
export function activeNavNames(): { active: string; previous: string } | null {
  let s: any = navigationRef.isReady() ? navigationRef.getRootState() : undefined;
  let deepest: any;
  while (s) {
    if (s.type === 'stack') {
      deepest = s;
    }
    s = s.routes?.[s.index ?? 0]?.state;
  }
  if (!deepest || !deepest.routes?.length) {
    return null;
  }
  const index = deepest.index ?? deepest.routes.length - 1;
  return { active: deepest.routes[index]?.name ?? '', previous: deepest.routes[index - 1]?.name ?? '' };
}

// Ionic presents modals in the MODAL portal (modal-impl.js:68 PORTAL_MODAL), and App.getActiveNavs() returns that portal's
// nav first (app.js:172-175). In RN the modal routes sit on the root stack, so the portal is the run of modal-portal pages at
// the top of the root stack: modal pages (ionicModalPages.json) and pages a modal pushes into its own portal
// (ionicModalPortalPages.json, e.g. cancelpolicy-modal.ts:58 CancelationPolicy). Returns the portal nav's active page and
// whether it can go back (more than one portal view), or null when the top page is not in the modal portal.
const PORTAL_PAGES = new Set<string>([...modalPages, ...portalPushedPages]);

export function modalPortalNav(root: { routes: { name: string }[]; index?: number } | undefined): { routeName: string; canGoBack: boolean } | null {
  if (!root || !root.routes?.length) {
    return null;
  }
  const top = root.index ?? root.routes.length - 1;
  let count = 0;
  for (let i = top; i >= 0 && PORTAL_PAGES.has(root.routes[i].name); i--) {
    count++;
  }
  return count ? { routeName: root.routes[top].name, canGoBack: count > 1 } : null;
}
