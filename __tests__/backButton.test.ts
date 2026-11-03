// Hardware back button rules, ported from app.component.ts:165-243 (plan Task 8).
import { handleBack } from '../src/app/backButton';

const at = (routeName: string, canGoBack = false, overlayOpen = false) => handleBack({ routeName, canGoBack, overlayOpen });

test('an open overlay is dismissed first, whatever the page', () => {
  expect(at('Home', false, true)).toBe('dismissOverlay');
  expect(at('Category', true, true)).toBe('dismissOverlay');
});

test.each(['Home', 'MobileLogin', 'Otp', 'DealerHome', 'Dashboard', 'SelectRegistrationType', 'DealerAddorder'])(
  'back does nothing on %s, even when it could go back',
  name => {
    expect(at(name, true)).toBe('ignore');
    expect(at(name, false)).toBe('ignore');
  },
);

test('any other page with history goes back', () => {
  expect(at('Category', true)).toBe('pop');
  expect(at('Profile', true)).toBe('pop');
});

test.each(['GiftList', 'Transaction', 'Profile', 'MainHome'])('%s at the bottom of its stack selects the first tab', name => {
  expect(at(name, false)).toBe('selectTab0');
});

test.each(['OfferList', 'PointList', 'Language', 'SalesExecHome'])(
  '%s at the bottom of its stack asks to exit (not in Ionic\'s tab list)',
  name => {
    expect(at(name, false)).toBe('confirmExit');
  },
);

// Phase 2 kit (2026-11-03, CancelationPolicy S8 review): Ionic presents modals in the MODAL portal (modal-impl.js:68
// PORTAL_MODAL) and App.getActiveNavs() returns that portal first (app.js:172-175). A modal page, or a page the modal pushes
// (cancelpolicy-modal.ts:58 CancelationPolicy, after the modal dismissed itself), is the portal's only view: canGoBack() is false,
// so the Topbath handler ends in the "App termination" alert instead of closing the modal.
import { modalPortalNav } from '../src/navigation/navigationRef';

const stack = (...names: string[]) => ({ type: 'stack', index: names.length - 1, routes: names.map(name => ({ name })) });

test('a modal page on top is the modal portal nav with no history', () => {
  expect(modalPortalNav(stack('Tabs', 'ViewProfile') as any)).toEqual({ routeName: 'ViewProfile', canGoBack: false });
  expect(modalPortalNav(stack('Tabs', 'GiftDetail', 'CancelpolicyModal') as any)).toEqual({ routeName: 'CancelpolicyModal', canGoBack: false });
});

test('a page pushed inside the modal portal is the portal nav too', () => {
  expect(modalPortalNav(stack('Tabs', 'GiftDetail', 'CancelationPolicy') as any)).toEqual({ routeName: 'CancelationPolicy', canGoBack: false });
  // while the modal is still below it (Ionic's push transition) the portal has history
  expect(modalPortalNav(stack('Tabs', 'GiftDetail', 'CancelpolicyModal', 'CancelationPolicy') as any)).toEqual({
    routeName: 'CancelationPolicy',
    canGoBack: true,
  });
});

test('no modal portal page on top: null (the normal active-nav rules apply)', () => {
  expect(modalPortalNav(stack('Tabs', 'GiftDetail') as any)).toBeNull();
  expect(modalPortalNav(undefined)).toBeNull();
});

test('modal portal pages end in the exit question', () => {
  expect(at('ViewProfile', false)).toBe('confirmExit');
  expect(at('CancelationPolicy', false)).toBe('confirmExit');
});
