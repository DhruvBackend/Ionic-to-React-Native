// Ionic 3.9.5 md <ion-tabs> tab bar as Topbath renders it (plan Task 9 part 4), used by RoleTabs through
// @react-navigation/bottom-tabs' `tabBar` prop. Values and citations: src/theme/ionicMdPage.ts (tabsMd).
//
// What Ionic does on a tap (components/tabs/tabs.js:303-349 select(), :455-495 _updateCurrentTab()):
//   - another tab: switch without animation (opts.animate = false), tab stacks keep their pages;
//   - the selected tab again: pop to the tab's root page when it is more than one page deep.
// NOTE (parity): Ionic's _updateCurrentTab also does tab.setRoot(root) when the selected tab's single page is not
// its root page. Not reachable here: nothing in the app replaces a tab's root page inside the tab (setRoot is only
// called on the root nav, which resets the whole Tabs page), so a tab stack of length 1 is always its root.
// React Navigation: the tab navigator switches without animation by default and the stack navigator inside
// the tab pops to top on a `tabPress` of the focused tab (IonStack.tsx does the same as native-stack).
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { CommonActions } from '@react-navigation/native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { tabIcons } from '../../assets/client/tabIcons';
import { tabsMd } from '../../theme/ionicMdPage';
import { textStyle } from './text';

export interface IonTabButtonProps {
  icon: string; // Ionic tabIcon ('tab-home', ...)
  label: string; // tabTitle
  selected: boolean;
  onPress: () => void;
  testID?: string;
}

// <a class="tab-button has-title has-icon" aria-selected> <ion-icon class="tab-button-icon"> <span class="tab-button-text">
export function IonTabButton({ icon, label, selected, onPress, testID }: IonTabButtonProps) {
  const T = tabsMd.tab;
  const I = tabsMd.icon;
  const L = tabsMd.label;
  const svg = tabIcons[icon];
  return (
    <Pressable
      testID={testID ?? `ion-tab-${icon}`}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.tab,
        { minHeight: T.minHeight, padding: T.padding, backgroundColor: T.background },
        selected && { borderBottomWidth: T.selectedBorderBottom, borderBottomColor: L.activeColor },
      ]}
    >
      <View
        testID={`ion-tab-icon-${icon}`}
        style={[styles.icon, { width: I.width, height: I.height, marginTop: I.marginTop, opacity: selected ? I.activeOpacity : I.inactiveOpacity }]}
      >
        {svg ? <SvgXml xml={svg.xml} width={svg.size} height={svg.size} /> : null}
      </View>
      <Text
        testID={`ion-tab-label-${icon}`}
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          textStyle(L.fontSize, L.fontWeight, selected ? L.activeColor : L.inactiveColor),
          { letterSpacing: L.letterSpacing, marginTop: L.marginTop },
          styles.label,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function IonTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View testID="ion-tabbar" style={styles.bar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;
        const onPress = () => {
          // Same event the stock bar emits, so the stack inside the tab can pop to its root on a repeated tap.
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
            data: { behavior: { scrollToTop: focused, popToTop: focused } },
          });
          if (!focused && !event.defaultPrevented) {
            navigation.dispatch({ ...CommonActions.navigate(route.name, route.params), target: state.key });
          }
        };
        return <IonTabButton key={route.key} icon={route.name} label={label} selected={focused} onPress={onPress} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // .tabbar { display: flex } with the Topbath background and shadow; every .tab-button { flex: 1 }
  bar: {
    flexDirection: 'row',
    backgroundColor: tabsMd.tabbar.background,
    boxShadow: tabsMd.tabbar.shadow,
    zIndex: 10, // .tabbar { z-index: 10 } ([CSS] 15760): the shadow draws over the page above
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // [M] the ion-icon box (24 x 20) with the svg `no-repeat center`
  icon: { alignItems: 'center', justifyContent: 'center' },
  // .tab-button-text { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
  label: { maxWidth: '100%' },
});
