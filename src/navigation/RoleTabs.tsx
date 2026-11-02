// Ported from: src/pages/tabs/tabs.html + tabs.ts
// Ionic 3 default (IonicModule.forRoot with no config, tabsHideOnSubPages=false): every tab has its
// own navigation stack, and pages pushed from a tab stay inside it with the tab bar visible.
// So each tab here is a native stack that can show any card route, starting at the tab's root page.
// Modal routes live only in the root stack, so they open above the tabs like Ionic overlays.
// The tab bar's Ionic look (md mode, SVG tab icons) is IonTabBar; the stacks inside a tab move pages like Ionic's
// ion-nav (IonStack, plan Task 9 part 4).
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { db } from '../api/client';
import { IonTabBar } from '../components/ionic/IonTabs';
import { createIonStackNavigator } from './IonStack';
import { resetTo } from './navigationRef';
import { enabledRoutes, findRoute } from './routes';
import { placeholderFor } from './PlaceholderScreen';
import { tabsFor, type TabDef } from './tabs';

const Tab = createBottomTabNavigator();
const renderTabBar = (props: BottomTabBarProps) => <IonTabBar {...props} />;
const TabStack = createIonStackNavigator();

function TabStackFor({ tab }: { tab: TabDef }) {
  const root = findRoute(tab.route);
  const others = enabledRoutes().filter(r => r.presentation === 'card' && r.name !== tab.route);
  return (
    <TabStack.Navigator initialRouteName={tab.route}>
      <TabStack.Screen name={tab.route} component={root?.component ?? placeholderFor(tab.route)} />
      {others.map(r => (
        <TabStack.Screen key={r.name} name={r.name} component={r.component} />
      ))}
    </TabStack.Navigator>
  );
}

export function RoleTabs({ route }: { route: { params?: { index?: number | string } } }) {
  const { t } = useTranslation();
  const tabs = tabsFor(db.userStorageData?.type);
  const rawIndex = route.params?.index;
  const token = db.userStorageData?.token;

  // NOTE (parity): tabs.ts:84-93 (constructor). With a token and index == '5', Ionic does navCtrl.setRoot(ProfilePage):
  // the whole root becomes Profile and the tab bar is gone. No live caller passes 5 (every setRoot(TabsPage,{index:'5'})
  // is commented out), kept for exactness. Without a token the constructor only assigns an unused rootPage.
  const toProfile = !!token && rawIndex == '5'; // eslint-disable-line eqeqeq
  useEffect(() => {
    if (toProfile) {
      resetTo('Profile');
    }
  }, [toProfile]);

  // NOTE (parity): a user type outside tabs.html's *ngIf blocks gets no tabs at all in Ionic.
  if (tabs.length === 0) {
    return <View style={StyleSheet.absoluteFill} testID="tabs-none" />;
  }

  // Ionic <ion-tabs selectedIndex="{{index}}">, index passed as a nav param (a string: '0', '3', '4'; '' when absent).
  // Tabs.initTabs: parseInt(selectedIndex, 10); a missing, NaN or out-of-range index selects the first tab.
  const index = parseInt(String(rawIndex ?? ''), 10);
  const initial = tabs[index >= 0 && index < tabs.length ? index : 0];

  return (
    // backBehavior none: the Ionic back rules (src/app/backButton.ts) decide, not the tab bar.
    <Tab.Navigator
      initialRouteName={initial.icon}
      backBehavior="none"
      tabBar={renderTabBar}
      screenOptions={{ headerShown: false }}
    >
      {tabs.map(tab => (
        <Tab.Screen key={tab.icon} name={tab.icon} options={{ title: t(tab.title) }}>
          {() => <TabStackFor tab={tab} />}
        </Tab.Screen>
      ))}
    </Tab.Navigator>
  );
}
