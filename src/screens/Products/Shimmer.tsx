// Ported from: [T] variables.scss 9908-9913 `.skleton-box { linear-gradient(90deg, #ddd 0, #e8e8e8 40px, #ddd 80px); animation: shine-avatar 1.6s infinite linear }`
// and the `shine-avatar` keyframes: background-position -32px -> 208px over the first 40% (640 ms), held until 1.6 s.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { catalogueMd as C } from '../../theme/ionicMdCatalogue';
import { styles } from './styles';

export function Shimmer() {
  const x = useRef(new Animated.Value(-32)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: 208, duration: 640, easing: Easing.linear, useNativeDriver: true }),
        Animated.delay(960),
        Animated.timing(x, { toValue: -32, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [x]);
  return (
    <View style={styles.skeleton}>
      <Animated.View style={[styles.shimmerBand, { transform: [{ translateX: x }] }]}>
        <Svg width={80} height={135}>
          <Defs>
            <LinearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={C.skeleton} />
              <Stop offset="0.5" stopColor={C.skeletonShine} />
              <Stop offset="1" stopColor={C.skeleton} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="80" height="135" fill="url(#shine)" />
        </Svg>
      </Animated.View>
    </View>
  );
}
