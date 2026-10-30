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
