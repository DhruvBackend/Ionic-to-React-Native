import { activeNavCanGoBack } from '../src/navigation/navigationRef';

const stack = (index: number, routes: object[]) => ({ type: 'stack', index, routes });
const tabs = (index: number, routes: object[]) => ({ type: 'tab', index, routes });

describe('activeNavCanGoBack (Ionic app.getActiveNavs()[0].canGoBack())', () => {
  test('root stack only: canGoBack follows the root stack', () => {
    expect(activeNavCanGoBack(stack(0, [{}]) as any)).toBe(false);
    expect(activeNavCanGoBack(stack(1, [{}, {}]) as any)).toBe(true);
  });

  test('Otp pushed Tabs over the login pages: back on a tab ROOT page cannot go back', () => {
    const tabStack = stack(0, [{ name: 'Home' }]);
    const root = stack(4, [{}, {}, {}, {}, { name: 'Tabs', state: tabs(0, [{ state: tabStack }]) }]);
    expect(activeNavCanGoBack(root as any)).toBe(false);
  });

  test('a page pushed inside the selected tab: back pops within the tab', () => {
    const tabStack = stack(1, [{ name: 'Home' }, { name: 'Profile' }]);
    const root = stack(1, [{}, { name: 'Tabs', state: tabs(2, [{}, {}, { state: tabStack }]) }]);
    expect(activeNavCanGoBack(root as any)).toBe(true);
  });

  test('a page pushed on the ROOT nav above Tabs: the root nav is active again', () => {
    const root = stack(2, [{}, { name: 'Tabs', state: tabs(0, [{ state: stack(0, [{}]) }]) }, { name: 'Notification' }]);
    expect(activeNavCanGoBack(root as any)).toBe(true);
  });

  test('undefined state (navigator not ready) → false', () => {
    expect(activeNavCanGoBack(undefined)).toBe(false);
  });
});
