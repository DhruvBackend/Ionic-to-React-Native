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
import React, { createContext, useContext, useEffect, useMemo, useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './IonText';
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

// `.tab-button { flex: 1 }` is a flex item with min-width: auto: a tab never gets narrower than its nowrap label (+ 5px padding on each
// side); the tabs that fit share the rest equally ("New Arrivals" is not truncated). Yoga has no min-width: auto and does not re-balance
// after a min-width clamp, so IonTabRow runs the CSS flex algorithm itself from the measured natural label widths.
interface TabRowCtx {
  widths: Record<string, number> | null;
  report(key: string, minWidth: number): void;
}
const TabRowContext = createContext<TabRowCtx | null>(null);

export function flexTabWidths(total: number, mins: number[]): number[] {
  const out: number[] = mins.map(() => -1);
  let left = total;
  let free = mins.length;
  for (let again = true; again && free > 0; ) {
    again = false;
    const share = left / free;
    mins.forEach((m, i) => {
      if (out[i] < 0 && m > share) {
        out[i] = m;
        left -= m;
        free--;
        again = true;
      }
    });
  }
  const share = free > 0 ? left / free : 0;
  return out.map(w => (w < 0 ? share : w));
}

export function IonTabRow({ children, style, testID }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }) {
  const [bar, setBar] = useState(0);
  const [mins, setMins] = useState<Record<string, number>>({});
  const keys = React.Children.toArray(children).map(c => String((c as ReactElement<{ icon: string }>).props.icon));
  const ctx = useMemo<TabRowCtx>(() => {
    const known = bar > 0 && keys.every(k => mins[k] > 0);
    const list = known ? flexTabWidths(bar, keys.map(k => mins[k])) : null;
    return {
      widths: list ? Object.fromEntries(keys.map((k, i) => [k, list[i]])) : null,
      report: (k, w) => setMins(p => (p[k] === w ? p : { ...p, [k]: w })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bar, mins, keys.join('|')]);
  return (
    <View testID={testID} style={style} onLayout={e => setBar(e.nativeEvent.layout.width)}>
      <TabRowContext.Provider value={ctx}>{children}</TabRowContext.Provider>
    </View>
  );
}

// <a class="tab-button has-title has-icon" aria-selected> <ion-icon class="tab-button-icon"> <span class="tab-button-text">
export function IonTabButton({ icon, label, selected, onPress, testID }: IonTabButtonProps) {
  const T = tabsMd.tab;
  const I = tabsMd.icon;
  const L = tabsMd.label;
  const svg = tabIcons[icon];
  const row = useContext(TabRowContext);
  const [natural, setNatural] = useState(0);
  useEffect(() => {
    if (natural) {
      row?.report(icon, natural + 2 * T.padding);
    }
  }, [natural, row, icon, T.padding]);
  const width = row?.widths?.[icon];
  const labelStyle = [
    textStyle(L.fontSize, L.fontWeight, selected ? L.activeColor : L.inactiveColor),
    { letterSpacing: L.letterSpacing, marginTop: L.marginTop },
  ];
  return (
    <Pressable
      testID={testID ?? `ion-tab-${icon}`}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.tab,
        width !== undefined ? { flex: 0, width } : null,
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
        style={[labelStyle, styles.label]}
      >
        {label}
      </Text>
      {/* The measuring copy is 1000dp wide and overflows the tab. A Text ignores pointerEvents on Android, so the LAST tab's
          copy caught every tap on the bar (all taps became Menu, seen on the phone 2026-11-02). A View honours
          pointerEvents="none", so the copy lives inside one. */}
      <View pointerEvents="none" style={styles.measureBox} testID={`ion-tab-measure-${icon}`}>
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[labelStyle, styles.measure]}
          onTextLayout={ev => {
            const w = ev.nativeEvent.lines[0]?.width;
            if (w && Math.ceil(w) !== natural) {
              setNatural(Math.ceil(w));
            }
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function IonTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <IonTabRow testID="ion-tabbar" style={styles.bar}>
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
    </IonTabRow>
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
  // off-layout measuring box: absolute, invisible, left-anchored, never hit-testable (pointerEvents none on the View)
  measureBox: { position: 'absolute', left: 0, top: 0, width: 1000, opacity: 0 },
  measure: { alignSelf: 'flex-start' },
});
