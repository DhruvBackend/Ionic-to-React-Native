// <ion-spinner name="crescent"> (md default, config/mode-registry.js:50) and the Topbath loader
// assets/imgs/gif.svg (8 white dots whose fill-opacity cycles over 1.3 s via SMIL <animate>).
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { loadingMd } from '../../theme/ionicMdOverlays';

export function CrescentSpinner({
  color = loadingMd.spinnerColor,
  testID,
}: {
  color?: string;
  testID?: string;
}) {
  const c = loadingMd.crescent;
  const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // spinner.scss .spinner-crescent svg { animation: spinner-rotate 1s linear infinite }, with the
    // inline animation-duration set from the spinner's dur (spinner.js:168): 750 ms
    const loop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: c.durationMs,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [rotate, c.durationMs]);
  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  return (
    <View testID={testID} style={styles.spinner}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: spin }] }]}
      >
        <Svg
          width={loadingMd.spinnerSize}
          height={loadingMd.spinnerSize}
          viewBox={`0 0 ${c.viewBox} ${c.viewBox}`}
        >
          <Circle
            cx={c.viewBox / 2}
            cy={c.viewBox / 2}
            r={c.r}
            fill="transparent"
            stroke={color}
            strokeWidth={c.strokeWidth}
            strokeDasharray={[c.dashArray]}
            strokeDashoffset={c.dashOffset}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

// assets/imgs/gif.svg: viewBox 58x58, <g transform="translate(2 1)" stroke="#FFF" stroke-width="1.5">,
// eight r=5 circles (fill #fff, fill-opacity animated "1;0;0;0;0;0;0;0" rotated through the ring, dur 1.3s).
const GIF_DOTS: [number, number][] = [
  [42.601, 11.462],
  [49.063, 27.063],
  [42.601, 42.663],
  [27, 49.125],
  [11.399, 42.663],
  [4.938, 27.063],
  [11.399, 11.462],
  [27, 5],
];
const GIF_OFFSET = [2, 1];
const GIF_BOX = 58;
const GIF_R = 5;
const GIF_STROKE = 1.5;
const GIF_DUR = 1300;

export function GifLoader({
  size = GIF_BOX,
  color,
}: {
  size?: number;
  color: string;
}) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, {
        toValue: 1,
        duration: GIF_DUR,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);
  const k = size / GIF_BOX;
  return (
    <View testID="loading-gif" style={{ width: size, height: size }}>
      {GIF_DOTS.map(([cx, cy], i) => {
        // SMIL values list "1;0;0;..." has 8 entries spread evenly over the duration (calcMode linear)
        const fillOpacity = t.interpolate({
          inputRange: [0, 1 / 7, 2 / 7, 3 / 7, 4 / 7, 5 / 7, 6 / 7, 1],
          outputRange: [0, 1, 2, 3, 4, 5, 6, 7].map(j => (j === i ? 1 : 0)),
        });
        const x = (cx + GIF_OFFSET[0]) * k;
        const y = (cy + GIF_OFFSET[1]) * k;
        const outer = (GIF_R + GIF_STROKE / 2) * 2 * k;
        const fill = GIF_R * 2 * k;
        return (
          <View
            key={i}
            style={[
              styles.abs,
              {
                left: x - outer / 2,
                top: y - outer / 2,
                width: outer,
                height: outer,
              },
            ]}
          >
            <Animated.View
              testID="loading-gif-dot"
              style={[
                styles.abs,
                {
                  left: (outer - fill) / 2,
                  top: (outer - fill) / 2,
                  width: fill,
                  height: fill,
                  borderRadius: fill / 2,
                  backgroundColor: color,
                  opacity: fillOpacity,
                },
              ]}
            />
            <View
              style={{
                width: outer,
                height: outer,
                borderRadius: outer / 2,
                borderWidth: GIF_STROKE * k,
                borderColor: color,
              }}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  spinner: { width: loadingMd.spinnerSize, height: loadingMd.spinnerSize }, // spinner.scss ion-spinner 28x28
});
