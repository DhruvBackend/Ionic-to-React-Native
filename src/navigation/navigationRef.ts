// Navigation from outside screens (start-up logic, push notifications, debug links).
import { createNavigationContainerRef } from '@react-navigation/native';

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
