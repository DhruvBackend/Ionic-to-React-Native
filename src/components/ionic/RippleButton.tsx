// An Ionic md <button> as drawn by RippleActivator (tap-click/ripple.js) and Activator
// (tap-click/activator.js): the `activated` class is added 80 ms after touch-down and removed 80 ms
// after touch-up, and on a tap a .button-effect circle (#555 at .2 opacity) grows from the touch point.
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { overlay } from '../../theme/ionicMdOverlays';

export interface RippleButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  activatedStyle?: StyleProp<ViewStyle>; // the style of `.activated`
  rippleColor?: string;
  disabled?: boolean;
  // Ionic buttons that are not `button-md` (e.g. toolbar bar-buttons) do not clip the ripple circle; the toolbar does.
  clip?: boolean;
  hitSlop?: { left?: number; right?: number; top?: number; bottom?: number };
  testID?: string;
  accessibilityRole?: 'button' | 'radio' | 'checkbox';
  accessibilityState?: { checked?: boolean; disabled?: boolean };
  children?: React.ReactNode;
}

interface Ripple {
  left: number;
  top: number;
  diameter: number;
  key: number;
}

export function RippleButton({
  onPress,
  style,
  activatedStyle,
  rippleColor = overlay.rippleColor,
  disabled,
  clip = true,
  hitSlop,
  testID,
  accessibilityRole = 'button',
  accessibilityState,
  children,
}: RippleButtonProps) {
  const [activated, setActivated] = useState(false);
  const [ripple, setRipple] = useState<Ripple | null>(null);
  const size = useRef({ w: 0, h: 0 });
  const touch = useRef({ x: 0, y: 0 });
  const addTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const scale = useRef(new Animated.Value(0.001)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const counter = useRef(0);

  useEffect(
    () => () => {
      clearTimeout(addTimer.current);
      clearTimeout(clearTimer.current);
    },
    [],
  );

  const startRipple = () => {
    const { w, h } = size.current;
    let px = touch.current.x;
    let py = touch.current.y;
    // ripple.js startRippleEffect
    const x = Math.max(Math.abs(w - px), px) * 2;
    const y = Math.max(Math.abs(h - py), py) * 2;
    const diameter = Math.round(Math.min(Math.max(Math.hypot(x, y), 64), 240));
    px = Math.round(px - diameter / 2);
    py = Math.round(py - diameter / 2);
    const radius = Math.sqrt(w + h);
    let scaleMs = Math.max(
      1600 * Math.sqrt(radius / overlay.rippleTouchDownAccel) + 0.5,
      260,
    );
    const opacityMs = Math.round(scaleMs * 0.7);
    const opacityDelay = Math.round(scaleMs - opacityMs);
    scaleMs = Math.round(scaleMs);
    scale.setValue(0.001);
    opacity.setValue(overlay.rippleOpacity);
    setRipple({ left: px, top: py, diameter, key: ++counter.current });
    const ease = Easing.bezier(...overlay.easeInOut);
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: scaleMs,
        easing: ease,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: opacityMs,
        delay: opacityDelay,
        easing: ease,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      // button[disabled] { opacity: .4 } fades the button and its text as ONE layer (white text stays near-white over the fill)
      needsOffscreenAlphaCompositing={disabled}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      onLayout={e => {
        size.current = {
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        };
      }}
      onPressIn={(e: GestureResponderEvent) => {
        touch.current = {
          x: e.nativeEvent?.locationX ?? 0,
          y: e.nativeEvent?.locationY ?? 0,
        };
        clearTimeout(clearTimer.current);
        clearTimeout(addTimer.current);
        addTimer.current = setTimeout(
          () => setActivated(true),
          overlay.activatedDelayMs,
        );
      }}
      onPressOut={() => {
        clearTimeout(addTimer.current);
        clearTimeout(clearTimer.current);
        clearTimer.current = setTimeout(
          () => setActivated(false),
          overlay.activatedClearMs,
        );
      }}
      onPress={(e: GestureResponderEvent) => {
        if (e?.nativeEvent && typeof e.nativeEvent.locationX === 'number') {
          touch.current = {
            x: e.nativeEvent.locationX,
            y: e.nativeEvent.locationY,
          };
        }
        setActivated(true);
        clearTimeout(clearTimer.current);
        clearTimer.current = setTimeout(
          () => setActivated(false),
          overlay.activatedClearMs,
        );
        startRipple();
        onPress?.();
      }}
      style={[
        style,
        clip && styles.clip,
        activated && activatedStyle,
        disabled && styles.disabled,
      ]}
    >
      {children}
      {ripple && (
        <Animated.View
          key={ripple.key}
          pointerEvents="none"
          style={[
            styles.ripple,
            {
              left: ripple.left,
              top: ripple.top,
              width: ripple.diameter,
              height: ripple.diameter,
              borderRadius: ripple.diameter / 2,
              backgroundColor: rippleColor,
              opacity,
              transform: [{ scale }],
            },
          ]}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  ripple: { position: 'absolute' },
  // button.scss:67-71 button[disabled] { opacity: .4; pointer-events: none }
  disabled: { opacity: 0.4 },
});
