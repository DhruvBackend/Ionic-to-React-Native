// The app's root navigation (Ionic: <ion-nav [root]="rootPage"> in app.html).
// Holds the pre-login pages, the role tabs ('Tabs', Ionic TabsPage), every enabled card route
// (Ionic app.getRootNav().push/setRoot) and every modal route (Ionic ModalController).
// The start route is decided by the start-up logic (plan Task 8); until then it is Language.
import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { db } from '../api/client';
import { setFixtureVariant } from '../api/mock';
import i18n from '../i18n';
import { parseDebugLink, type DebugLink } from './debugLinks';
import { navigationRef, resetTo } from './navigationRef';
import { placeholderFor } from './PlaceholderScreen';
import { RoleTabs } from './RoleTabs';
import { enabledRoutes } from './routes';
import { SideMenuProvider } from './SideMenu';

const Root = createNativeStackNavigator();

// Entry points that must exist even before their screens are ported.
const REQUIRED_ROOT_ROUTES = ['Language'];

// Debug deep link: put the app in the requested state, then open the screen.
export function applyDebugLink(link: DebugLink, sessions: Record<string, unknown> = {}) {
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
    if (!__DEV__) {
      return;
    }
    const handle = (url: string | null | undefined) => {
      const link = url ? parseDebugLink(url, { dev: __DEV__ }) : null;
      if (link) {
        applyDebugLink(link);
      }
    };
    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', e => handle(e.url));
    return () => sub.remove();
  }, []);

  return (
    <SideMenuProvider>
      <NavigationContainer ref={navigationRef}>
        <Root.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
          <Root.Screen name="Tabs" component={RoleTabs} />
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
