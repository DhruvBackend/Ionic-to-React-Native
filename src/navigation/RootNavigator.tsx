// The app's root navigation (Ionic: <ion-nav [root]="rootPage"> in app.html).
// Holds the pre-login pages, the role tabs ('Tabs', Ionic TabsPage), every enabled card route
// (Ionic app.getRootNav().push/setRoot) and every modal route (Ionic ModalController).
// The start route is decided by the start-up logic (plan Task 8); until then it is Language.
import React, { useEffect } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { db, switchToMockTransport } from '../api/client';
import { debugToolsEnabled } from '../config/buildInfo';
import { ComponentGallery } from '../dev/ComponentGallery';
import { ComponentState } from '../dev/ComponentState';
import { ScrollDemoScreen } from '../dev/gallery/ScrollDemoScreen';
import { NativeDemoScreen } from '../dev/NativeDemoScreen';
import { resetMock, setFixtureVariant } from '../api/mock';
import sessionFixtures from '../api/fixtures/_sessions.json';
import i18n from '../i18n';
import { parseDebugLink, type DebugLink } from './debugLinks';
import { navigationRef, resetTo } from './navigationRef';
import { placeholderFor } from './PlaceholderScreen';
import { createIonStackNavigator } from './IonStack';
import { RoleTabs } from './RoleTabs';
import { enabledRoutes } from './routes';
import { SideMenuProvider } from './SideMenu';
import { notifyPageChange } from '../ui/overlays';

// Pages move like Ionic's ion-nav / ModalController (IonStack, plan Task 9 part 4).
const Root = createIonStackNavigator();

// Ionic OverlayPortal dismisses dismissOnPageChange overlays on app.viewDidLeave, which fires when the
// leaving page's transition has finished: md-transition.js:22 push 280 ms, :19 pop 200 ms.
let lastRouteKey: string | undefined;
let lastDepth = 0;
function onNavigationStateChange() {
  const key = navigationRef.getCurrentRoute()?.key;
  const depth = navigationRef.getRootState()?.routes.length ?? 0;
  if (key !== lastRouteKey) {
    const popped = depth < lastDepth;
    lastRouteKey = key;
    lastDepth = depth;
    setTimeout(notifyPageChange, popped ? 200 : 280);
  }
}

// NOTE (parity): where Ionic sets no root page at all (see src/app/startup.ts), the app shows nothing.
function BlankScreen() {
  return <View style={StyleSheet.absoluteFill} testID="blank-root" />;
}

// Entry points that must exist even before their screens are ported.
const REQUIRED_ROOT_ROUTES = ['Language'];

// Debug deep link: put the app in the requested state, then open the screen.
export function applyDebugLink(link: DebugLink, sessions: Record<string, unknown> = {}) {
  if (link.mock) {
    switchToMockTransport();
    // a clean MOCK backend per link: variants from an earlier link must not leak into this state (phone tap check 2026-11-02)
    resetMock();
  }
  for (const [endpoint, variant] of Object.entries(link.variants)) {
    try {
      setFixtureVariant(endpoint, variant);
    } catch (e) {
      console.warn(String(e));
    }
  }
  if (link.role && sessions[link.role]) {
    db.userStorageData = sessions[link.role];
  }
  if (link.lang) {
    i18n.changeLanguage(link.lang);
  }
  resetTo(link.screen, link.params);
}

export function RootNavigator({ initialRouteName = 'Language' }: { initialRouteName?: string }) {
  const routes = enabledRoutes();
  const names = new Set(routes.map(r => r.name));
  const placeholders = REQUIRED_ROOT_ROUTES.filter(n => !names.has(n));

  useEffect(() => {
    if (!debugToolsEnabled) {
      return;
    }
    const handle = (url: string | null | undefined) => {
      const link = url ? parseDebugLink(url, { dev: debugToolsEnabled }) : null;
      if (link) {
        applyDebugLink(link, sessionFixtures);
      }
    };
    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', e => handle(e.url));
    return () => sub.remove();
  }, []);

  return (
    <SideMenuProvider>
      <NavigationContainer ref={navigationRef} onStateChange={onNavigationStateChange}>
        <Root.Navigator initialRouteName={initialRouteName}>
          <Root.Screen name="Tabs" component={RoleTabs} />
          <Root.Screen name="Blank" component={BlankScreen} />
          {debugToolsEnabled && <Root.Screen name="_ComponentGallery" component={ComponentGallery} />}
          {debugToolsEnabled && <Root.Screen name="_ComponentState" component={ComponentState} />}
          {debugToolsEnabled && <Root.Screen name="_ScrollDemo" component={ScrollDemoScreen} />}
          {debugToolsEnabled && <Root.Screen name="_NativeDemo" component={NativeDemoScreen} />}
          {routes.map(r => (
            <Root.Screen
              key={r.name}
              name={r.name}
              component={r.component}
              options={r.presentation === 'modal' ? { presentation: 'modal' } : undefined}
            />
          ))}
          {placeholders.map(n => (
            <Root.Screen key={n} name={n} component={placeholderFor(n)} />
          ))}
        </Root.Navigator>
      </NavigationContainer>
    </SideMenuProvider>
  );
}
