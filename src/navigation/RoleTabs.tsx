// Ported from: src/pages/tabs/tabs.html + tabs.ts
// Ionic 3 default (IonicModule.forRoot with no config, tabsHideOnSubPages=false): every tab has its
// own navigation stack, and pages pushed from a tab stay inside it with the tab bar visible.
// So each tab here is a native stack that can show any card route, starting at the tab's root page.
// Modal routes live only in the root stack, so they open above the tabs like Ionic overlays.
// The tab bar's Ionic look (md mode, SVG tab icons) comes from the replica kit (plan Task 9).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { db } from '../api/client';
import { enabledRoutes, findRoute } from './routes';
import { placeholderFor } from './PlaceholderScreen';
import { tabsFor, type TabDef } from './tabs';

const Tab = createBottomTabNavigator();
const TabStack = createNativeStackNavigator();

function TabStackFor({ tab }: { tab: TabDef }) {
  const root = findRoute(tab.route);
  const others = enabledRoutes().filter(r => r.presentation === 'card' && r.name !== tab.route);
  return (
    <TabStack.Navigator initialRouteName={tab.route} screenOptions={{ headerShown: false }}>
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

  // NOTE (parity): a user type outside tabs.html's *ngIf blocks gets no tabs at all in Ionic.
  if (tabs.length === 0) {
    return <View style={StyleSheet.absoluteFill} testID="tabs-none" />;
  }

  // Ionic <ion-tabs selectedIndex="{{index}}">, index passed as a nav param.
  const index = Number(route.params?.index);
  const initial = tabs[Number.isInteger(index) && index >= 0 && index < tabs.length ? index : 0];

  return (
    // backBehavior none: the Ionic back rules (src/app/backButton.ts) decide, not the tab bar.
    <Tab.Navigator initialRouteName={initial.icon} backBehavior="none" screenOptions={{ headerShown: false }}>
      {tabs.map(tab => (
        <Tab.Screen key={tab.icon} name={tab.icon} options={{ title: t(tab.title) }}>
          {() => <TabStackFor tab={tab} />}
        </Tab.Screen>
      ))}
    </Tab.Navigator>
  );
}
