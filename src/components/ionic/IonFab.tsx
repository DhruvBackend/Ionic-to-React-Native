// <ion-fab right bottom> + <button ion-fab color="primary|danger"> (components/fab/fab.scss, fab.md.scss).
// Used 5 times, all `right bottom`, icon "add", no ion-fab-list (so fab-list/speed dial is not built).
// ion-fab is `position:absolute` inside the content's fixed layer: pass it as IonContent's `fixedContent` prop (it then sits over
// the scroll and does not scroll with it).
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { ionicColors } from '../../theme';
import { colorShade, fabMd } from '../../theme/ionicMdScroll';
import { IonIcon } from './IonIcon';
import { RippleButton } from './RippleButton';

export interface IonFabProps {
  horizontal?: 'left' | 'right' | 'center' | 'start' | 'end';
  vertical?: 'top' | 'bottom' | 'middle';
  edge?: boolean; // [edge]: half over the toolbar edge (with top/bottom)
  children?: React.ReactNode;
  testID?: string;
}

type Writable = { -readonly [K in keyof ViewStyle]: ViewStyle[K] };

// fab.scss:77-135 ion-fab[...] positioning (LTR; start/end = left/right; safe-area insets are 0 in the Android WebView)
export function fabPosition(
  horizontal: IonFabProps['horizontal'],
  vertical: IonFabProps['vertical'],
  edge?: boolean,
): ViewStyle {
  const m = fabMd.contentMargin;
  const half = fabMd.size / 2;
  const s: Writable = { position: 'absolute', zIndex: fabMd.zIndex };
  if (horizontal === 'center') {
    s.left = '50%'; // :81 [center]
    s.marginLeft = -half;
  } else if (horizontal === 'right' || horizontal === 'end') {
    s.right = m; // :98 / :108
  } else if (horizontal === 'left' || horizontal === 'start') {
    s.left = m; // :119 / :129
  }
  if (vertical === 'middle') {
    s.top = '50%'; // :86
    s.marginTop = -half;
  } else if (vertical === 'top') {
    s.top = edge ? -half : m; // :92 / [top][edge]
  } else if (vertical === 'bottom') {
    s.bottom = edge ? -half : m; // :113 / [bottom][edge]
  }
  return s;
}

export function IonFab({ horizontal, vertical, edge, children, testID = 'ion-fab' }: IonFabProps) {
  return (
    <View testID={testID} style={fabPosition(horizontal, vertical, edge)}>
      {children}
    </View>
  );
}

export interface IonFabButtonProps {
  color?: 'primary' | 'danger' | 'secondary' | 'light' | 'dark' | 'success' | 'warning' | 'white';
  mini?: boolean; // [mini]: 40 px (margin 8 px, removed by Topbath's global button{margin:0!important})
  icon?: string; // ion-icon name drawn 24 px in the contrast colour
  size?: number; // page SCSS override of the fab box (e.g. `.fab[mini]{width:30px;height:30px}`); wins over `mini`
  iconSize?: number; // page SCSS override of `.fab ion-icon{font-size}` in px
  onPress?: () => void;
  testID?: string;
  children?: React.ReactNode;
}

export function IonFabButton({ color = 'primary', mini, icon, size: sizeOverride, iconSize, onPress, testID = 'ion-fab-button', children }: IonFabButtonProps) {
  const bg = ionicColors[color];
  const fg = fabMd.contrast; // primary and danger contrast = #fff (fab.md.scss:16)
  const size = sizeOverride ?? (mini ? fabMd.miniSize : fabMd.size);
  return (
    <RippleButton
      testID={testID}
      onPress={onPress}
      rippleColor={fg}
      style={[
        styles.fab,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, boxShadow: fabMd.boxShadow },
      ]}
      activatedStyle={{ backgroundColor: colorShade(bg), boxShadow: fabMd.boxShadowActivated }}
    >
      {icon ? <IonIcon name={icon} size={iconSize ?? fabMd.iconSize} color={fg} /> : children}
    </RippleButton>
  );
}

const styles = StyleSheet.create({
  // .fab{display:block;overflow:hidden;text-align:center;line-height:56px}; button-inner centres the icon
  fab: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
