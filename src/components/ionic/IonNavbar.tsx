// Ionic 3.9.5 md <ion-header> / <ion-toolbar> / <ion-navbar> / <ion-title> / <ion-buttons> / menuToggle, with the
// Topbath global rules that reach them (plan Task 9 part 4). Values and citations: src/theme/ionicMdPage.ts.
//
// Header patterns used by the Ionic pages (grep of src/**/*.html, 110 of 117 pages have an <ion-header>):
//   <ion-header class="main-header remove"> (47x, 4 with no-border) + <ion-navbar color="primary">: flat, back button shown
//   <ion-header class="main-header"> (7x) and [ngClass]="{remove: usertype == 'Plumber'}" (3x): shadow, ALL buttons hidden
//   <ion-header> (43x) + <ion-navbar [color="primary"]> (91x primary, 16x plain) + <ion-title> [+ <ion-buttons end> 15x]
//   <ion-navbar class="h80" color="white"> (4: mobile-login, otp, select-registration-type + <ion-toolbar class="h80"> Language: `tall`), <ion-toolbar [color|class]> (search rows, home logo bar,
//   class="toolbarHeight"), <ion-header [hidden]="true">, catalogue-header (7x) / home-header (1x): classes without any CSS.
// `Header` below is ion-header + ion-navbar in one.
import React, { createContext, useContext } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { NavigationContext } from '@react-navigation/native';
import { useSideMenu } from '../../navigation/SideMenu';
import { ionicColors } from '../../theme';
import { ShadowStripRows } from './ShadowStrip';
import { footerMd, toolbarColors, toolbarMd, type ToolbarColor, type ToolbarColorSet } from '../../theme/ionicMdPage';
import { ionPadding } from '../../theme/ionicMdContent';
import { IonIcon } from './IonIcon';
import { RippleButton } from './RippleButton';
import { PresentationContext } from '../../navigation/pageTransition';
import { textStyle } from './text';

// ---------------------------------------------------------------------------------------------------
// ion-header
// ---------------------------------------------------------------------------------------------------
interface HeaderCtx {
  mainHeader: boolean; // class="main-header"
  remove: boolean; // class="remove" on a main-header
}
const HeaderContext = createContext<HeaderCtx>({ mainHeader: false, remove: false });

export interface IonHeaderProps {
  mainHeader?: boolean;
  remove?: boolean;
  noBorder?: boolean; // the `no-border` attribute (also what `page-profile ion-header:after { display: none }` does)
  hidden?: boolean; // [hidden]="true"
  testID?: string;
  children?: React.ReactNode;
}

export function IonHeader({ mainHeader = false, remove = false, noBorder = false, hidden = false, testID, children }: IonHeaderProps) {
  if (hidden) {
    return null;
  }
  // header-md::after strip, dropped by [no-border] and by `.main-header.remove::after { background-image: none }`
  const strip = !noBorder && !(mainHeader && remove);
  return (
    <HeaderContext.Provider value={{ mainHeader, remove: mainHeader && remove }}>
      <View testID={testID ?? 'ion-header'} style={styles.header}>
        {children}
        {strip ? (
          <View pointerEvents="none" testID="ion-header-strip" style={styles.strip}>
            <ShadowStripRows startRow={S.offsetY} cssHeight={S.height} />
          </View>
        ) : null}
      </View>
    </HeaderContext.Provider>
  );
}

// ---------------------------------------------------------------------------------------------------
// ion-toolbar / ion-navbar
// ---------------------------------------------------------------------------------------------------
interface ToolbarCtx {
  colors: ToolbarColorSet;
  navbar: boolean; // `.main-header ion-navbar ...` rules only reach an ion-navbar, not an ion-toolbar
}
const ToolbarContext = createContext<ToolbarCtx>({ colors: toolbarColors.default, navbar: false });

interface ToolbarBaseProps {
  color?: ToolbarColor;
  style?: StyleProp<ViewStyle>; // extra rules a page adds for the element (e.g. a background override)
  testID?: string;
  // ng-content slots, in Ionic's md `order` ([CSS] 16719-16725): back 0, menuToggle 1, left 2, content 3, start 4, end 5
  back?: React.ReactNode;
  menuToggle?: React.ReactNode;
  left?: React.ReactNode;
  children?: React.ReactNode; // .toolbar-content
  start?: React.ReactNode;
  end?: React.ReactNode;
  tall?: boolean; // class="h80"
  toolbarHeight?: boolean; // class="toolbarHeight"
  // An element that is position:absolute against the toolbar box (Ionic `.toolbar { position: relative }`, so it spans the box INCLUDING the
  // 4px padding), e.g. Topbath `.header-logo` (variables.scss:1201-1216, `z-index: -1`: behind the toolbar-content, above the toolbar-background).
  // Rendered as the first child of the border box; give it absolute-fill style (top/left/right/bottom 0) in the page.
  overlay?: React.ReactNode;
  navbar: boolean;
}

function ToolbarBase({ color, style, testID, back, menuToggle, left, children, start, end, tall, toolbarHeight, overlay, navbar }: ToolbarBaseProps) {
  const header = useContext(HeaderContext);
  const colors = color ? toolbarColors[color] : toolbarColors.default;
  const mainNavbar = navbar && header.mainHeader;
  const t = toolbarMd;
  const inner = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    overflow: 'hidden' as const, // .toolbar { overflow: hidden } clips the bar-button ripples ([CSS] 16011)
    padding: t.padding,
    minHeight: mainNavbar ? t.mainHeaderMinHeight : t.minHeight,
    backgroundColor: colors.background,
    ...(tall ? { height: t.tallHeight } : null),
    ...(toolbarHeight ? t.toolbarHeight : null),
  };
  // .main-header ion-navbar box-shadow, flat when .remove
  const shadow: ViewStyle | null = mainNavbar && !header.remove ? { boxShadow: t.mainHeaderShadow } : null;
  return (
    <ToolbarContext.Provider value={{ colors, navbar }}>
      <View testID={testID ?? (navbar ? 'ion-navbar' : 'ion-toolbar')} style={shadow}>
        <View style={[inner, style]}>
          {overlay}
          {back}
          {menuToggle}
          {left}
          <View style={styles.content}>{children}</View>
          {start}
          {end}
        </View>
      </View>
    </ToolbarContext.Provider>
  );
}

// `tall` = class="h80" (height 80, see toolbarMd.tallHeight); also valid on an ion-toolbar (Language).
export interface IonToolbarProps extends Omit<ToolbarBaseProps, 'navbar' | 'back' | 'menuToggle'> {}

export function IonToolbar(props: IonToolbarProps) {
  return <ToolbarBase {...props} navbar={false} />;
}

export interface IonNavbarProps {
  title?: React.ReactNode; // <ion-title>
  color?: ToolbarColor; // color="primary" | "white" | "light"
  hideBackButton?: boolean; // [hideBackButton]
  // Overrides "can this nav pop": by default the screen's own stack decides (index > 0), like ViewController.enableBack()
  showBack?: boolean;
  onBack?: () => void;
  menuToggle?: boolean; // <button menuToggle>
  tall?: boolean; // class="h80"
  start?: React.ReactNode; // <ion-buttons start> (md: drawn AFTER the title)
  left?: React.ReactNode; // <ion-buttons left>
  end?: React.ReactNode; // <ion-buttons end>
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode; // anything else inside <ion-navbar> (e.g. <div class="header-icons">)
}

export function IonNavbar({
  title,
  color,
  hideBackButton = false,
  showBack,
  onBack,
  menuToggle = false,
  tall,
  start,
  left,
  end,
  style,
  testID,
  children,
}: IonNavbarProps) {
  const header = useContext(HeaderContext);
  const nav = useContext(NavigationContext);
  const presentation = useContext(PresentationContext);
  // Navbar.backButtonClick -> navCtrl.pop(); `.back-button.show-back-button` appears when the nav has a page below.
  // NOTE (parity): view-controller.js:169-178 enableBack() needs a previous view in the page's own nav; a modal page is
  // in its own overlay nav, so it never has one (here: a modal route sitting above others in the root stack).
  const enableBack = showBack ?? (nav && presentation !== 'modal' ? nav.getState().index > 0 : false);
  // [T] 720-722 `.main-header ion-navbar button { display: none !important }` hides the back button and every
  // other <button> of the navbar; [T] 737-740 `.main-header.remove ... button { display: inherit !important }`
  // shows them all again, and `display` beats the `[hidden]` attribute, so hideBackButton is ignored there.
  const buttonsHidden = header.mainHeader && !header.remove;
  const backShown = header.mainHeader ? header.remove : enableBack && !hideBackButton;
  const onBackPress =
    onBack ??
    (() => {
      // NOTE (parity): Ionic's pop() on a root page throws "navigation stack needs at least one root page" and
      // nothing happens; goBack() would bubble to the parent navigator, so it is only called with a page below.
      if (nav && nav.getState().index > 0) {
        nav.goBack();
      }
    });

  return (
    <ToolbarBase
      navbar
      color={color}
      style={style}
      testID={testID}
      tall={tall}
      back={backShown ? <BackButton onPress={onBackPress} /> : null}
      menuToggle={menuToggle && !buttonsHidden ? <MenuToggle /> : null}
      left={left ? <IonButtons testID="ion-navbar-left">{left}</IonButtons> : null}
      start={start ? <IonButtons testID="ion-navbar-start">{start}</IonButtons> : null}
      end={end ? <IonButtons testID="ion-navbar-end">{end}</IonButtons> : null}
    >
      {title !== undefined ? <IonTitle>{title}</IonTitle> : null}
      {children}
    </ToolbarBase>
  );
}

// ion-header + ion-navbar in one: the page header almost every Ionic page starts with.
export interface HeaderProps extends IonNavbarProps {
  mainHeader?: boolean;
  remove?: boolean;
  noBorder?: boolean;
  hidden?: boolean;
  below?: React.ReactNode; // further <ion-toolbar>s inside the same <ion-header>
}
export function Header({ mainHeader, remove, noBorder, hidden, below, ...navbar }: HeaderProps) {
  return (
    <IonHeader mainHeader={mainHeader} remove={remove} noBorder={noBorder} hidden={hidden}>
      <IonNavbar {...navbar} />
      {below}
    </IonHeader>
  );
}

// ---------------------------------------------------------------------------------------------------
// ion-footer
// ---------------------------------------------------------------------------------------------------
// Usage survey (Ionic pages, 17 elements, 5 with [padding]): ion-footer + `button ion-button full|block` (order-detail, executive-order-detail,
// add-dealer, executive-edit, edit-network, select-registration-type, language), custom blocks (point-location, profile), csm-footer-tabs
// (3: no strip), before-btn (1: no strip), af-none (2: no strip), the side-menu logout footer (app.html). None puts an ion-toolbar in it.
// Place it as the LAST child of the page column (below an IonContent with flex 1): Ionic's absolute bottom:0 + the content's
// margin-bottom = footer height is the same layout. The page's own background must be the content's (#fff): the footer is transparent.
export interface IonFooterProps {
  padding?: boolean; // the [padding] attribute: 16px all around
  noBorder?: boolean; // [no-border], and the Topbath classes that hide the strip (.csm-footer-tabs, .before-btn, .af-none)
  style?: StyleProp<ViewStyle>; // class / inline style of the element (e.g. style="padding: 10px 16px")
  testID?: string;
  children?: React.ReactNode;
}

export function IonFooter({ padding = false, noBorder = false, style, testID = 'ion-footer', children }: IonFooterProps) {
  return (
    <View testID={testID} style={[styles.footer, padding ? ionPadding : null, style]}>
      {noBorder ? null : (
        // footer-md::before: top -2px, 2px high, the png's top 2px, repeat-x, over the content above the footer
        <View pointerEvents="none" testID={`${testID}-strip`} style={styles.footerStrip}>
          <ShadowStripRows startRow={footerMd.strip.offsetY} cssHeight={footerMd.strip.height} testID={`${testID}-strip`} />
        </View>
      )}
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------------
// ion-title
// ---------------------------------------------------------------------------------------------------
export function IonTitle({ children, style }: { children?: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const header = useContext(HeaderContext);
  const tb = useContext(ToolbarContext);
  const T = toolbarMd.title;
  // [T] 724-731 / 742-749: only for the title of an ion-navbar inside a main-header
  const main = tb.navbar && header.mainHeader;
  const base = main
    ? textStyle(T.mainHeaderFontSize, T.mainHeaderFontWeight, T.mainHeaderColor)
    : textStyle(T.fontSize, T.fontWeight, tb.colors.text);
  return (
    <View testID="ion-title" style={styles.title}>
      <Text
        testID="ion-title-text"
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[base, styles.titleText, main && header.remove ? styles.capitalize : null, style]}
      >
        {children}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------------------------------
// ion-buttons + the bar-button inside it
// ---------------------------------------------------------------------------------------------------
export function IonButtons({ children, testID }: { children?: React.ReactNode; testID?: string }) {
  const header = useContext(HeaderContext);
  const tb = useContext(ToolbarContext);
  // The container stays (margin 0 .2rem still takes 4 px) when the main-header rule hides its buttons.
  const hidden = tb.navbar && header.mainHeader && !header.remove;
  return (
    <View testID={testID ?? 'ion-buttons'} style={styles.buttons}>
      {hidden ? null : children}
    </View>
  );
}

export interface IonBarButtonProps {
  onPress?: () => void;
  icon?: string; // <ion-icon name> of an `icon-only` button
  color?: 'primary' | 'secondary' | 'danger' | 'light' | 'white' | 'dark' | 'success' | 'warning' | 'red'; // <button color="light">
  testID?: string;
  children?: React.ReactNode; // any other button content
}

export function IonBarButton({ onPress, icon, color, testID, children }: IonBarButtonProps) {
  const header = useContext(HeaderContext);
  const tb = useContext(ToolbarContext);
  // [T] 739 `.main-header.remove ion-navbar button { color: $white }` (0,2,2) beats .toolbar-md-primary .bar-button-md-<color>
  const buttonColor =
    tb.navbar && header.remove ? toolbarMd.removeButtonColor : color ? (ionicColors as Record<string, string>)[color] : tb.colors.text;
  const B = toolbarMd.barButton;
  return (
    <RippleButton
      testID={testID ?? 'ion-bar-button'}
      onPress={onPress}
      clip={false}
      rippleColor={tb.colors.ripple}
      hitSlop={{ left: 2, right: 2, top: 7, bottom: 6 }} // .bar-button::after { left/right -2px; top -7px; bottom -6px }
      style={[styles.barButton, { height: B.height, borderRadius: B.borderRadius }, !icon && styles.barButtonText]}
    >
      {icon ? (
        <View style={styles.iconOnly}>
          <IonIcon name={icon} size={toolbarMd.iconOnlyButton.iconSize} color={buttonColor} />
        </View>
      ) : (
        children
      )}
    </RippleButton>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  const header = useContext(HeaderContext);
  const tb = useContext(ToolbarContext);
  const color = tb.navbar && header.remove ? toolbarMd.removeButtonColor : tb.colors.text;
  const B = toolbarMd.backButton;
  return (
    <RippleButton
      testID="ion-navbar-back"
      onPress={onPress}
      clip={false}
      rippleColor={tb.colors.ripple}
      hitSlop={{ left: 2, right: 2, top: 7, bottom: 6 }}
      style={[
        styles.barButton,
        { minWidth: B.minWidth, height: toolbarMd.barButton.height, borderRadius: toolbarMd.barButton.borderRadius, paddingHorizontal: toolbarMd.barButton.paddingHorizontal },
      ]}
    >
      <View style={{ paddingHorizontal: B.iconPaddingHorizontal }}>
        <IonIcon name={B.iconName} size={B.iconSize} color={color} />
      </View>
    </RippleButton>
  );
}

function MenuToggle() {
  const header = useContext(HeaderContext);
  const tb = useContext(ToolbarContext);
  const menu = useSideMenu();
  const M = toolbarMd.menuToggle;
  const color = tb.navbar && header.remove ? toolbarMd.removeButtonColor : tb.colors.text;
  return (
    <RippleButton
      testID="ion-navbar-menutoggle"
      onPress={() => (menu.isOpen ? menu.close() : menu.open())}
      clip={false}
      rippleColor={tb.colors.ripple}
      style={[styles.barButton, { minWidth: M.minWidth, paddingHorizontal: M.paddingHorizontal, height: toolbarMd.barButton.height }]}
    >
      <View style={{ paddingHorizontal: M.iconPaddingHorizontal }}>
        <IonIcon name={M.iconName} size={M.iconSize} color={color} />
      </View>
    </RippleButton>
  );
}

const S = toolbarMd.headerStrip;
const styles = StyleSheet.create({
  header: { zIndex: toolbarMd.headerZIndex },
  // header-md::after: left 0; bottom -5px; height 5px; background-position top -2px
  strip: { position: 'absolute', left: 0, right: 0, bottom: -S.height, height: S.height, overflow: 'hidden' },
  // ion-footer: position absolute; bottom 0; z-index 10 (a column child here, relative so the strip can hang above it)
  footer: { position: 'relative', zIndex: footerMd.zIndex },
  footerStrip: { position: 'absolute', left: 0, right: 0, top: footerMd.strip.top, height: footerMd.strip.height, overflow: 'hidden' },
  // .toolbar-content-md: flex 1, min-width 0
  content: { flex: 1, minWidth: 0 },
  // ion-title { display: flex; flex: 1; align-items: center } > .toolbar-title { width: 100%; overflow: hidden; ellipsis }
  title: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: toolbarMd.title.paddingHorizontal },
  titleText: { flex: 1 },
  buttons: { flexDirection: 'row', alignItems: 'center', marginHorizontal: toolbarMd.buttonsMarginHorizontal },
  barButton: { alignItems: 'center', justifyContent: 'center' },
  barButtonText: { paddingHorizontal: toolbarMd.barButton.paddingHorizontal },
  capitalize: { textTransform: 'capitalize' },
  iconOnly: { minWidth: toolbarMd.iconOnlyButton.minWidth, alignItems: 'center', justifyContent: 'center' },
});
