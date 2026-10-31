// <ion-spinner name="bubbles|circles|crescent"> (components/spinner/spinner.js SPINNERS + spinner.scss).
// bubbles (infinite scroll) and circles (refresher) are rings of small circles whose scale (bubbles) or opacity
// (circles) falls from 1 to 0 over 1 s, each element shifted by `-(dur - dur/total*index)` (spinner.js _loadEle).
// crescent is the existing CrescentSpinner.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { spinnerMd } from '../../theme/ionicMdScroll';
import { CrescentSpinner } from './Spinner';

export type SpinnerName = 'bubbles' | 'circles' | 'crescent';

function Ring({ name, color }: { name: 'bubbles' | 'circles'; color: string }) {
  const def = spinnerMd[name];
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: spinnerMd.durationMs, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  const k = spinnerMd.size / spinnerMd.viewBox; // svg viewBox 64 drawn at 28 px
  const r = def.r * k;
  return (
    <View testID={`ion-spinner-${name}`} style={styles.box}>
      {Array.from({ length: def.circles }, (_, i) => {
        // keyframe progress p = (t - i/n) mod 1; value = 1 - p (scale-out or fade-out, both 1 -> 0)
        const a = i / def.circles;
        const input = i === 0 ? [0, 1] : [0, a, a + 0.0001, 1];
        const out = i === 0 ? [1, 0] : [a, 0, 1, a];
        const v = t.interpolate({ inputRange: input, outputRange: out });
        const cx = spinnerMd.size / 2 + def.orbit * Math.cos((2 * Math.PI * i) / def.circles); // spinner.js left
        const cy = spinnerMd.size / 2 + def.orbit * Math.sin((2 * Math.PI * i) / def.circles); // spinner.js top
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: cx - r,
              top: cy - r,
              width: 2 * r,
              height: 2 * r,
              borderRadius: r,
              backgroundColor: color,
              opacity: name === 'circles' ? v : 1,
              transform: name === 'bubbles' ? [{ scale: v }] : [],
            }}
          />
        );
      })}
    </View>
  );
}

export function IonSpinner({ name, color }: { name: SpinnerName; color: string }) {
  if (name === 'crescent') {
    return <CrescentSpinner color={color} />;
  }
  return <Ring name={name} color={color} />;
}

const styles = StyleSheet.create({
  box: { width: spinnerMd.size, height: spinnerMd.size },
});
