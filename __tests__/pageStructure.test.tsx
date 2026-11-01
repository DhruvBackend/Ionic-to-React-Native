// Ionic 3.9.5 md page structure (plan Task 9 part 4): navbar / header, tab bar, page transition.
// Expected values are the cited ones in src/theme/ionicMdPage.ts.
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Header, IonBarButton, IonFooter, IonHeader, IonNavbar, IonToolbar } from '../src/components/ionic/IonNavbar';
import { IonButton } from '../src/components/ionic/IonButton';
import { IonTabBar } from '../src/components/ionic/IonTabs';
import { tabIcons } from '../src/assets/client/tabIcons';
import { ionicColors, scssColors } from '../src/theme';
import { footerMd, pageTransition, tabsMd, toolbarColors, toolbarMd } from '../src/theme/ionicMdPage';
import { modalMd } from '../src/theme/ionicMdPickers';
import { createIonStackNavigator } from '../src/navigation/IonStack';
import { enterSpec, leaveSpec, planTransition } from '../src/navigation/pageTransition';
import { SideMenuProvider, useSideMenu } from '../src/navigation/SideMenu';
import { tabsFor } from '../src/navigation/tabs';

// react-native-svg's own XML parser (what SvgXml uses); required so tsc does not compile the library sources
const { parse } = require('react-native-svg/src/xml');

let tree: ReactTestRenderer.ReactTestRenderer;
const act = (fn: () => void) => ReactTestRenderer.act(fn);
const advance = (ms: number) => act(() => { jest.advanceTimersByTime(ms); });
const find = (id: string) => tree.root.findAll(n => n.props.testID === id);
const host = (id: string) => find(id).find(n => typeof n.type === 'string')!;
const exists = (id: string) => find(id).length > 0;
const style = (id: string) => StyleSheet.flatten(host(id).props.style);
const flat = (c: any): string => (Array.isArray(c) ? c.map(flat).join('') : typeof c === 'string' ? c : c?.props ? flat(c.props.children) : '');
const textOf = (id: string) => flat(host(id).props.children);
function press(id: string) {
  const n = find(id).find(x => typeof x.props.onPress === 'function');
  if (!n) {
    throw new Error(`nothing pressable with testID ${id}`);
  }
  act(() => n.props.onPress({ nativeEvent: { locationX: 10, locationY: 10 } }));
}
function mount(el: React.ReactElement) {
  act(() => {
    tree = ReactTestRenderer.create(el);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  act(() => tree?.unmount());
  jest.useRealTimers();
});

describe('transition values (transition-md.js, modal-transitions.js)', () => {
  test('page push: translateY 40 -> 0, opacity .01 -> 1, 280 ms, cubic-bezier(.36,.66,.04,1)', () => {
    expect(pageTransition.enter).toEqual({ duration: 280, easing: [0.36, 0.66, 0.04, 1], translateY: [40, 0], opacity: [0.01, 1] });
  });
  test('page pop: the leaving page goes 0 -> 40 and 1 -> 0 in 200 ms with cubic-bezier(.47,0,.745,.715)', () => {
    expect(pageTransition.leave).toEqual({ duration: 200, easing: [0.47, 0, 0.745, 0.715], translateY: [0, 40], opacity: [1, 0] });
  });
  test('modal routes use the md modal numbers', () => {
    expect(enterSpec('modal')).toBe(modalMd.enter);
    expect(leaveSpec('modal')).toBe(modalMd.leave);
    expect(leaveSpec('modal').opacity).toEqual([0.99, 0]);
    expect(enterSpec('card')).toBe(pageTransition.enter);
    expect(leaveSpec('card')).toBe(pageTransition.leave);
  });
  test('which stack changes animate', () => {
    expect(planTransition(['a'], ['a', 'b'])).toEqual({ type: 'push', entering: 'b', under: 'a' });
    expect(planTransition(['a', 'b'], ['a'])).toEqual({ type: 'pop', leaving: 'b' });
    expect(planTransition(['a', 'b', 'c'], ['a'])).toEqual({ type: 'pop', leaving: 'c' });
    // setRoot / reset is instant (nav-controller-base.js:145-152)
    expect(planTransition(['a', 'b'], ['c'])).toEqual({ type: 'none' });
    expect(planTransition(['a'], ['a'])).toEqual({ type: 'none' });
    expect(planTransition([], ['a'])).toEqual({ type: 'none' });
    // a page removed from the middle moves nothing
    expect(planTransition(['a', 'b', 'c'], ['a', 'c'])).toEqual({ type: 'none' });
  });
});

describe('navbar (toolbar.md.scss + Topbath rules)', () => {
  test('plain md navbar: 56 min height, 4 padding, #f8f8f8, 20/500 #424242 title, no back button on a root page', () => {
    mount(<Header title="My Offer" />);
    const bar = StyleSheet.flatten(tree.root.findAllByProps({ testID: 'ion-navbar' })[0].findAll(n => typeof n.type === 'string')[1].props.style);
    expect(bar).toMatchObject({ minHeight: 56, padding: 4, backgroundColor: '#f8f8f8', flexDirection: 'row', alignItems: 'center' });
    expect(textOf('ion-title-text')).toBe('My Offer');
    expect(style('ion-title-text')).toMatchObject({ fontSize: 20, color: '#424242', fontFamily: 'Roboto-Medium' });
    expect(style('ion-title')).toMatchObject({ paddingHorizontal: 12 });
    expect(exists('ion-navbar-back')).toBe(false);
    expect(exists('ion-header-strip')).toBe(true);
  });

  test('color primary: background primary, title and buttons white', () => {
    mount(<Header title="T" color="primary" showBack onBack={() => {}} />);
    const bar = StyleSheet.flatten(tree.root.findAllByProps({ testID: 'ion-navbar' })[0].findAll(n => typeof n.type === 'string')[1].props.style);
    expect(bar.backgroundColor).toBe(ionicColors.primary);
    expect(style('ion-title-text').color).toBe(scssColors.white);
    expect(exists('ion-navbar-back')).toBe(true);
  });

  test('main-header remove: flat, 52 high, 16px/400 white capitalised title, back button always shown', () => {
    mount(<Header mainHeader remove title="offers" color="primary" />);
    // NOTE (parity): `.main-header.remove ion-navbar button { display: inherit !important }` shows the back button on a root page
    expect(exists('ion-navbar-back')).toBe(true);
    expect(style('ion-title-text')).toMatchObject({ fontSize: 16, color: scssColors.white, fontFamily: 'Roboto-Regular', textTransform: 'capitalize' });
    const wrap = StyleSheet.flatten(host('ion-navbar').props.style);
    expect(wrap?.boxShadow).toBeUndefined();
    const bar = StyleSheet.flatten(host('ion-navbar').props.children.props.style);
    expect(bar.minHeight).toBe(52);
    expect(exists('ion-header-strip')).toBe(false); // .main-header.remove::after { background-image: none }
  });

  test('main-header (not remove): shadow, 52 high, back button and every bar-button hidden, strip kept', () => {
    mount(
      <Header mainHeader title="Offers" color="primary" showBack end={<IonBarButton icon="md-add-circle" testID="btn" />} />,
    );
    expect(StyleSheet.flatten(host('ion-navbar').props.style)).toMatchObject({ boxShadow: toolbarMd.mainHeaderShadow });
    expect(exists('ion-navbar-back')).toBe(false);
    expect(exists('btn')).toBe(false);
    expect(exists('ion-navbar-end')).toBe(true); // the ion-buttons container (margin 0 2px) stays
    expect(style('ion-title-text')).toMatchObject({ fontSize: 16, fontFamily: 'Roboto-Regular' });
    expect(exists('ion-header-strip')).toBe(true);
  });

  test('bar buttons: white in a primary navbar, color="light" is #f4f4f4, white again inside main-header.remove', () => {
    mount(<Header title="T" color="primary" end={<IonBarButton icon="md-add-circle" color="light" />} />);
    const glyph = tree.root.findAll(n => typeof n.type === 'string' && n.props.allowFontScaling === false);
    expect(StyleSheet.flatten(glyph[glyph.length - 1].props.style)).toMatchObject({ color: ionicColors.light, fontSize: 25.2 });

    act(() => tree.unmount());
    mount(<Header mainHeader remove title="T" color="primary" end={<IonBarButton icon="md-add-circle" color="light" />} />);
    const glyph2 = tree.root.findAll(n => typeof n.type === 'string' && n.props.allowFontScaling === false);
    expect(StyleSheet.flatten(glyph2[glyph2.length - 1].props.style).color).toBe(scssColors.white);
  });

  test('h80 white navbar and a toolbarHeight toolbar', () => {
    mount(
      <View>
        <IonHeader noBorder>
          <IonNavbar color="white" tall title="x" testID="nb" />
          <IonToolbar color="primary" toolbarHeight testID="tb" />
        </IonHeader>
      </View>,
    );
    expect(StyleSheet.flatten(host('nb').props.children.props.style)).toMatchObject({ height: 80, backgroundColor: toolbarColors.white.background });
    expect(StyleSheet.flatten(host('tb').props.children.props.style)).toMatchObject({ minHeight: 0, paddingTop: 0, paddingBottom: 10, padding: 4 });
    expect(exists('ion-header-strip')).toBe(false); // no-border
  });

  test('IonToolbar overlay: a child of the toolbar border box (not of the 0-high toolbar-content), before the content, so it can fill the whole box', () => {
    mount(<IonToolbar color="white" tall testID="tb" overlay={<View testID="ov" />}>{<View testID="content-child" />}</IonToolbar>);
    const box = host('tb').props.children.props.children.filter(Boolean);
    expect(box[0].props.testID).toBe('ov'); // first child of the border box, behind everything (z-index -1 in Ionic)
    expect(find('ov').length).toBeGreaterThan(0);
    expect(find('content-child').length).toBeGreaterThan(0);
    // the overlay is NOT inside the toolbar-content view
    const content = box.find((c: any) => c.props?.style && StyleSheet.flatten(c.props.style)?.minWidth === 0);
    expect(JSON.stringify(content?.props?.children?.props?.testID)).not.toBe('"ov"');
  });

  test('<ion-toolbar class="h80" color="white"> (Language): height 80 inside the 4px padding, white, header strip below', () => {
    mount(
      <IonHeader>
        <IonToolbar color="white" tall testID="tb" />
      </IonHeader>,
    );
    // [M] reference probe: toolbar 360x80, min-height 56, padding 4, background #fff, header-md::after strip kept
    expect(StyleSheet.flatten(host('tb').props.children.props.style)).toMatchObject({
      height: toolbarMd.tallHeight,
      minHeight: 56,
      padding: 4,
      alignItems: 'center',
      overflow: 'hidden',
      backgroundColor: toolbarColors.white.background,
    });
    expect(toolbarMd.tallHeight).toBe(80);
    expect(exists('ion-header-strip')).toBe(true);
    act(() => tree.unmount());
    mount(<IonToolbar color="white" testID="plain" />);
    expect(StyleSheet.flatten(host('plain').props.children.props.style).height).toBeUndefined(); // without h80: min-height 56 only
  });

  test('title ellipsizes on one line', () => {
    mount(<Header title="a very long title" />);
    expect(host('ion-title-text').props.numberOfLines).toBe(1);
  });

  test('menuToggle opens the side menu and the next press closes it', () => {
    let menu: ReturnType<typeof useSideMenu>;
    function Probe() {
      menu = useSideMenu();
      return null;
    }
    mount(
      <SideMenuProvider>
        <Probe />
        <Header title="T" menuToggle />
      </SideMenuProvider>,
    );
    press('ion-navbar-menutoggle');
    expect(menu!.isOpen).toBe(true);
    press('ion-navbar-menutoggle');
    expect(menu!.isOpen).toBe(false);
  });

  test('IonHeader hidden renders nothing', () => {
    mount(<IonHeader hidden />);
    expect(tree.toJSON()).toBeNull();
  });
});

// ---------------------------------------------------------------------------------------------------
// IonStack + navbar back + tab bar, on the real navigators
// ---------------------------------------------------------------------------------------------------
const nav = createNavigationContainerRef<any>();

function Page({ name }: { name: string }) {
  return (
    <View testID={`page-${name}`}>
      <Header title={name} mainHeader={false} />
    </View>
  );
}

describe('IonStack', () => {
  const Stack = createIonStackNavigator();
  const A = () => <Page name="A" />;
  const B = () => <Page name="B" />;
  const C = () => <Page name="C" />;
  function App() {
    return (
      <NavigationContainer ref={nav}>
        <Stack.Navigator initialRouteName="A">
          <Stack.Screen name="A" component={A} />
          <Stack.Screen name="B" component={B} />
          <Stack.Screen name="C" component={C} options={{ presentation: 'modal' }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
  const visible = (name: string) => !StyleSheet.flatten(host(`ion-card-${name}`).props.style).display;

  test('every page card clips to its box (.ion-page { contain: strict }), also while it moves', () => {
    mount(<App />);
    expect(StyleSheet.flatten(host('ion-card-A').props.style).overflow).toBe('hidden');
  });

  test('the first page is not animated; a push animates the new page in and hides the old one afterwards', () => {
    mount(<App />);
    expect(exists('page-A')).toBe(true);
    expect(visible('A')).toBe(true);
    expect(exists('ion-navbar-back')).toBe(false); // a root page has no back button

    act(() => nav.navigate('B'));
    // while moving: B is drawn at progress 0 over A, A stays visible, touches are blocked
    expect(visible('A')).toBe(true);
    expect(visible('B')).toBe(true);
    expect(host('ion-stack').props.pointerEvents).toBe('none');
    expect(StyleSheet.flatten(host('ion-card-B').props.style).transform).toBeDefined();
    advance(pageTransition.enter.duration + 50);
    expect(host('ion-stack').props.pointerEvents).toBe('auto');
    expect(visible('A')).toBe(false);
    expect(visible('B')).toBe(true);
    expect(StyleSheet.flatten(host('ion-card-B').props.style).transform).toBeUndefined();
  });

  test('the navbar back button pops the stack; the leaving page is drawn above the returning one until it has animated out', () => {
    mount(<App />);
    act(() => nav.navigate('B'));
    advance(400);
    expect(exists('ion-navbar-back')).toBe(true);
    press('ion-navbar-back');
    expect((nav.getRootState() as any).routes.map((r: any) => r.name)).toEqual(['A']);
    // B is still drawn (leaving) above A, which is shown again
    expect(exists('ion-card-B')).toBe(true);
    expect(visible('A')).toBe(true);
    // (Jest's mocked native driver ends the animation in one frame; the 200 ms itself is asserted on the spec)
    advance(300);
    expect(exists('ion-card-B')).toBe(false);
    expect(visible('A')).toBe(true);
  });

  test('a modal route keeps the page below visible', () => {
    mount(<App />);
    act(() => nav.navigate('C'));
    advance(400);
    expect(visible('A')).toBe(true);
    expect(visible('C')).toBe(true);
    expect(StyleSheet.flatten(host('ion-card-C').props.style).backgroundColor).toBe(modalMd.backgroundColor);
  });

  test('reset (Ionic setRoot) is instant: the old pages unmount at once, nothing animates', () => {
    mount(<App />);
    act(() => nav.reset({ index: 0, routes: [{ name: 'B' }] }));
    expect(exists('ion-card-A')).toBe(false);
    expect(visible('B')).toBe(true);
    expect(StyleSheet.flatten(host('ion-card-B').props.style).transform).toBeUndefined();
    expect(host('ion-stack').props.pointerEvents).toBe('auto');
  });

  test('a modal route has no back button (a ModalController page has no previous view)', () => {
    mount(<App />);
    act(() => nav.navigate('C'));
    advance(400);
    expect(exists('page-C')).toBe(true);
    expect(tree.root.findAll(n => n.props.testID === 'ion-navbar-back').length).toBe(0);
  });

  test('params changing during a push keep the animation running', () => {
    mount(<App />);
    act(() => nav.navigate('B'));
    expect(host('ion-stack').props.pointerEvents).toBe('none');
    act(() => nav.setParams({ x: 1 }));
    expect(host('ion-stack').props.pointerEvents).toBe('none');
    expect(visible('A')).toBe(true);
    expect(StyleSheet.flatten(host('ion-card-B').props.style).transform).toBeDefined();
    advance(400);
    expect(host('ion-stack').props.pointerEvents).toBe('auto');
  });

  test('a pop that arrives during a push waits for the push to finish (Ionic queues transitions)', () => {
    mount(<App />);
    act(() => nav.navigate('B'));
    act(() => nav.goBack());
    // still on B, the pop is queued
    expect((nav.getRootState() as any).routes.map((r: any) => r.name)).toEqual(['A', 'B']);
    advance(400);
    advance(400);
    expect((nav.getRootState() as any).routes.map((r: any) => r.name)).toEqual(['A']);
  });
});

describe('tab bar (ion-tabs md + Topbath)', () => {
  const Tab = createBottomTabNavigator();
  const Inner = createIonStackNavigator();
  const Root = () => <View testID="tab-root" />;
  const Deep = () => <View testID="tab-deep" />;
  const renderBar = (p: any) => <IonTabBar {...p} />;
  function Stack() {
    return (
      <Inner.Navigator initialRouteName="Root">
        <Inner.Screen name="Root" component={Root} />
        <Inner.Screen name="Deep" component={Deep} />
      </Inner.Navigator>
    );
  }
  function App({ role, initial }: { role: string; initial?: string }) {
    const tabs = tabsFor(role);
    return (
      <NavigationContainer ref={nav}>
        <Tab.Navigator initialRouteName={initial ?? tabs[0].icon} backBehavior="none" tabBar={renderBar} screenOptions={{ headerShown: false }}>
          {tabs.map(t => (
            <Tab.Screen key={t.icon} name={t.icon} options={{ title: t.title }} component={Stack} />
          ))}
        </Tab.Navigator>
      </NavigationContainer>
    );
  }

  const allSets: [string, string[], string[]][] = [
    ['Plumber', ['Home', 'Offers', 'My Wallet', 'Profile', 'Menu'], ['tab-home', 'tab-gift', 'tab-points', 'tab-profile', 'tab-menu']],
    ['Sales_Executive', ['Home', 'Offers', 'My Wallet', 'Profile', 'Menu'], ['tab-home', 'tab-gift', 'tab-points', 'tab-profile', 'tab-menu']],
    ['Customer', ['Home', 'New Arrivals', 'Contact Us', 'About Us', 'Profile'], ['tab-home', 'tab-arrivals', 'tab-contact', 'tab-about', 'tab-profile']],
  ];

  test.each(allSets)('%s: labels and icons, all five tabs shown', (role, labels, icons) => {
    mount(<App role={role} />);
    expect(icons.map(i => textOf(`ion-tab-label-${i}`))).toEqual(labels);
    // NOTE (parity): `.tabbar a:gt(3) { display: none }` is invalid CSS, so the fifth tab shows
    expect(tree.root.findAll(n => typeof n.type === 'string' && n.props.accessibilityRole === 'tab').length).toBe(5);
    for (const i of icons) {
      expect(tabIcons[i]).toBeDefined();
      expect(exists(`ion-tab-icon-${i}`)).toBe(true);
    }
  });

  test('every client tab icon SVG parses (react-native-svg) and the manifest covers all eight Ionic tab icons', () => {
    expect(Object.keys(tabIcons).sort()).toEqual(['tab-about', 'tab-arrivals', 'tab-contact', 'tab-gift', 'tab-home', 'tab-menu', 'tab-points', 'tab-profile']);
    for (const [name, icon] of Object.entries(tabIcons)) {
      const ast = parse(icon.xml);
      expect([name, ast?.tag]).toEqual([name, 'svg']);
    }
  });

  test('bar and tab metrics; svg icon sizes (20, 18 for points)', () => {
    mount(<App role="Plumber" />);
    expect(style('ion-tabbar')).toMatchObject({ backgroundColor: scssColors.white, boxShadow: tabsMd.tabbar.shadow, flexDirection: 'row' });
    expect(style('ion-tab-tab-gift')).toMatchObject({ minHeight: 50, padding: 5, flex: 1 });
    expect(tabIcons['tab-points'].size).toBe(18);
    expect(tabIcons['tab-home'].size).toBe(20);
    // the gift tab draws arrivals.svg (variables.scss:1596-1601)
    expect(tabIcons['tab-gift'].xml).toBe(tabIcons['tab-arrivals'].xml);
  });

  test('selected tab: 3px primary bottom border, icon opacity 1, label primary; others opacity .2 and #888, no border', () => {
    mount(<App role="Plumber" />);
    expect(style('ion-tab-tab-home')).toMatchObject({ borderBottomWidth: 3, borderBottomColor: ionicColors.primary });
    expect(style('ion-tab-icon-tab-home')).toMatchObject({ opacity: 1, width: 24, height: 20, marginTop: 1 });
    expect(style('ion-tab-label-tab-home')).toMatchObject({ color: ionicColors.primary, fontSize: 10, letterSpacing: 1, fontFamily: 'Roboto-Regular' });
    expect(style('ion-tab-tab-gift').borderBottomWidth).toBeUndefined();
    expect(style('ion-tab-icon-tab-gift').opacity).toBe(0.2);
    expect(style('ion-tab-label-tab-gift')).toMatchObject({ color: '#888888', fontSize: 10 });
  });

  test('tapping another tab selects it (no animation)', () => {
    mount(<App role="Plumber" />);
    press('ion-tab-tab-points');
    expect((nav.getRootState() as any).index).toBe(2);
    expect(style('ion-tab-tab-points').borderBottomWidth).toBe(3);
    expect(style('ion-tab-tab-home').borderBottomWidth).toBeUndefined();
  });

  test('tapping the selected tab again pops its stack to the root page (Tabs.select -> popToRoot)', () => {
    mount(<App role="Plumber" />);
    act(() => nav.navigate('tab-home', { screen: 'Deep' }));
    advance(400);
    const homeState = () => (nav.getRootState() as any).routes[0].state;
    expect(homeState().routes.map((r: any) => r.name)).toEqual(['Root', 'Deep']);
    press('ion-tab-tab-home');
    advance(50); // tabPress is handled on the next frame
    advance(400);
    expect(homeState().routes.map((r: any) => r.name)).toEqual(['Root']);
  });

  test('tapping the selected tab with only its root page open changes nothing', () => {
    mount(<App role="Plumber" />);
    press('ion-tab-tab-home');
    advance(100);
    expect((nav.getRootState() as any).index).toBe(0);
  });

  test('the starting tab follows initialRouteName (Ionic selectedIndex)', () => {
    mount(<App role="Customer" initial="tab-contact" />);
    expect(style('ion-tab-tab-contact').borderBottomWidth).toBe(3);
  });

});

describe('ion-footer (toolbar.md.scss, [CSS] 12349 / 16716)', () => {
  test('z-index 10, transparent, no padding, with the 2px footer-md::before strip (top -2, png top 0, repeat)', () => {
    mount(<IonFooter testID="f" />);
    expect(footerMd.zIndex).toBe(10);
    const f = style('f');
    expect(f).toMatchObject({ position: 'relative', zIndex: 10 });
    expect(f.padding).toBeUndefined();
    expect(f.backgroundColor).toBeUndefined();
    expect(style('f-strip')).toMatchObject({ position: 'absolute', left: 0, right: 0, top: -2, height: 2, overflow: 'hidden' });
    // the png's rows 0..1 as per-device-pixel alpha Views (ShadowStrip.tsx), no <Image>
    expect(tree.root.findAll(n => n.props.resizeMode === 'repeat')).toHaveLength(0);
    expect(tree.root.findAll(n => String(n.props.testID ?? '').startsWith('f-strip-row-')).length).toBeGreaterThan(0);
    expect(host('f-strip').props.pointerEvents).toBe('none');
  });
  test('[padding] = 16px; [no-border] / csm-footer-tabs / before-btn / af-none hide the strip; style adds page rules', () => {
    mount(<IonFooter padding noBorder style={{ paddingVertical: 10 }} testID="f" />);
    expect(style('f')).toMatchObject({ padding: 16, paddingVertical: 10 });
    expect(exists('f-strip')).toBe(false);
  });
  test('button ion-button full inside: full width, no margin, radius 0 (the [padding] footer insets it by 16)', () => {
    mount(
      <IonFooter padding>
        <IonButton full testID="b">
          Continue
        </IonButton>
      </IonFooter>,
    );
    const b = style('b');
    expect(b).toMatchObject({ width: '100%', borderRadius: 0 });
    expect(b.margin).toBeUndefined();
  });
});
