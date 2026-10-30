// <ion-backdrop> (components/backdrop/backdrop.scss): a full-size black layer. Its opacity is animated
// by each popup's transition; a tap calls the popup's bdClick().
import React from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { overlay } from '../../theme/ionicMdOverlays';

export function Backdrop({
  opacity,
  onPress,
  hidden,
}: {
  opacity: Animated.AnimatedInterpolation<number> | Animated.Value | number;
  onPress: () => void;
  hidden?: boolean; // loading: [hidden]="!d.showBackdrop"
}) {
  return (
    <Pressable testID="overlay-backdrop" style={StyleSheet.absoluteFill} onPress={onPress} accessible={false}>
      {!hidden && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: overlay.backdropColor, opacity }]}
        />
      )}
    </Pressable>
  );
}
