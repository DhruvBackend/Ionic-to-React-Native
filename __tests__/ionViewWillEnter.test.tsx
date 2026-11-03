// Phase 2 kit (2026-11-03): useIonViewWillEnter = Ionic 3 ionViewWillEnter. It runs when the page first enters and
// every time it becomes the active page again (back from a pushed page, tab re-selected). It does NOT run when a modal
// shown above it is dismissed: Ionic 3 presents modals in the overlay portal, so the page underneath never left
// (Profile S8 review: ViewProfile modal, profile.ts:277). React Navigation's 'focus' fires in both cases.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { NavigationContainer } from '@react-navigation/native';
import { createIonStackNavigator } from '../src/navigation/IonStack';
import { useIonViewWillEnter } from '../src/navigation/useIonViewWillEnter';

type Listener = () => void;
function fakeNav() {
  const listeners: Record<string, Listener[]> = {};
  return {
    listeners,
    addListener: jest.fn((ev: string, fn: Listener) => {
      (listeners[ev] ||= []).push(fn);
      return () => {
        listeners[ev] = listeners[ev].filter(f => f !== fn);
      };
    }),
    emit(ev: string) {
      (listeners[ev] || []).forEach(f => f());
    },
  };
}

function mount(nav: ReturnType<typeof fakeNav>, cb: jest.Mock, topRoute: () => string | undefined) {
  function Page() {
    useIonViewWillEnter(cb, { navigation: nav as any, topRouteName: topRoute });
    return null;
  }
  let tree: ReactTestRenderer.ReactTestRenderer;
  ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<Page />);
  });
  return tree!;
}

test('runs on every focus: first entry and back from a pushed page', () => {
  const nav = fakeNav();
  const cb = jest.fn();
  let top = 'Profile';
  mount(nav, cb, () => top);
  nav.emit('focus'); // first entry
  expect(cb).toHaveBeenCalledTimes(1);
  top = 'Registration'; // a card page pushed above
  nav.emit('blur');
  top = 'Profile';
  nav.emit('focus');
  expect(cb).toHaveBeenCalledTimes(2);
});

test('does not run when a modal above the page is dismissed', () => {
  const nav = fakeNav();
  const cb = jest.fn();
  let top = 'Profile';
  mount(nav, cb, () => top);
  nav.emit('focus');
  top = 'ViewProfile'; // Ionic modal page
  nav.emit('blur');
  top = 'Profile';
  nav.emit('focus');
  expect(cb).toHaveBeenCalledTimes(1);
  // the next real re-entry runs again
  top = 'Registration';
  nav.emit('blur');
  top = 'Profile';
  nav.emit('focus');
  expect(cb).toHaveBeenCalledTimes(2);
});

test('always calls the latest callback and unsubscribes on unmount', () => {
  const nav = fakeNav();
  const cb = jest.fn();
  const tree = mount(nav, cb, () => 'Profile');
  ReactTestRenderer.act(() => tree.unmount());
  nav.emit('focus');
  expect(cb).not.toHaveBeenCalled();
});

// Real navigator (lead check 2026-11-03): React Navigation's first 'focus' reaches the hook, so first entry runs.
const calls: string[] = [];
const Stack = createIonStackNavigator();
function A() {
  useIonViewWillEnter(() => calls.push('A'));
  return null;
}
test('first focus reaches the hook in a real navigator', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="A" component={A} />
        </Stack.Navigator>
      </NavigationContainer>,
    );
  });
  expect(calls).toEqual(['A']);
  await ReactTestRenderer.act(async () => tree!.unmount());
});
