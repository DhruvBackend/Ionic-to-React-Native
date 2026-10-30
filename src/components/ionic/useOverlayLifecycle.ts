// Enter/leave timeline shared by every popup. `progress` runs 0 -> 1 during the enter transition and
// 1 -> 2 during the leave transition, so each component maps one Animated.Value to its own from/to
// values (ionic-angular *-transitions.js). Completion is timer-driven (the same duration), so the
// lifecycle (enabled flag, onDidDismiss) never depends on the animation driver.
import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export interface Timeline {
  enterMs: number;
  leaveMs: number;
  easing: readonly [number, number, number, number];
  leaveEasing?: readonly [number, number, number, number]; // when the leave transition uses another curve (modal md)
}

export function useOverlayLifecycle(cfg: Timeline, leaving: boolean, onEntered: () => void, onLeft: () => void) {
  const progress = useRef(new Animated.Value(0)).current;
  const entered = useRef(onEntered);
  const left = useRef(onLeft);
  entered.current = onEntered;
  left.current = onLeft;
  const enterTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: cfg.enterMs,
      easing: Easing.bezier(...cfg.easing),
      useNativeDriver: true,
    }).start();
    enterTimer.current = setTimeout(() => entered.current(), cfg.enterMs);
    return () => clearTimeout(enterTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!leaving) {
      return;
    }
    clearTimeout(enterTimer.current);
    Animated.timing(progress, {
      toValue: 2,
      duration: cfg.leaveMs,
      easing: Easing.bezier(...(cfg.leaveEasing ?? cfg.easing)),
      useNativeDriver: true,
    }).start();
    const t = setTimeout(() => left.current(), cfg.leaveMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  return progress;
}

// Interpolation across the enter segment [0,1] and the leave segment [1,2]. The tiny step at 1
// reproduces transitions whose leave starts at a slightly different value (0.99 vs 1).
export function enterLeave(progress: Animated.Value, enter: readonly [number, number], leave: readonly [number, number]) {
  return progress.interpolate({
    inputRange: [0, 1, 1.001, 2],
    outputRange: [enter[0], enter[1], leave[0], leave[1]],
  });
}
