// <ion-refresher (ionRefresh)="doRefresh($event)"> + <ion-refresher-content> (components/refresher/*). All 29 Topbath
// usages are `pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles"
// refreshingText="Refreshing..."`.
// Must be a child of IonContent, which owns the pull gesture and the scroll element (see its header comment).
//
//   <IonContent>
//     <IonRefresher onRefresh={r => { load().then(() => r.complete()); }}>
//       <IonRefresherContent pullingIcon="arrow-dropdown" pullingText="Pull to refresh" refreshingSpinner="circles" refreshingText="Refreshing..." />
//     </IonRefresher>
//     ...
//   </IonContent>
import React, { useContext, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { refresherMd, scrollMetrics } from '../../theme/ionicMdScroll';
import { fontFor } from '../../theme/typography';
import { IonIcon } from './IonIcon';
import { IonSpinner, type SpinnerName } from './IonSpinner';
import { RefresherStateContext, useScrollCtx } from './contentContext';
import type { RefresherHandle } from './refresherController';

export interface IonRefresherProps {
  onRefresh?: (refresher: RefresherHandle) => void; // (ionRefresh); call refresher.complete() when done
  onPull?: (refresher: RefresherHandle) => void;
  onStart?: (refresher: RefresherHandle) => void;
  enabled?: boolean; // default true
  pullMin?: number; // default 60
  pullMax?: number; // default 120 (fixed, refresher.js:141: it does not follow pullMin)
  snapbackDuration?: number; // default 280
  children?: React.ReactNode;
}

// A stable key for the refresher-content element(s): its props are all primitives, so re-registering with IonContent is only
// needed when they really change, not on every parent render (a fresh `children` element each render).
function contentKey(children: React.ReactNode): string {
  return JSON.stringify(
    React.Children.toArray(children).map(c => (React.isValidElement(c) ? [typeof c.type === 'string' ? c.type : 'cmp', c.props] : c)),
  );
}

export function IonRefresher({
  onRefresh,
  onPull,
  onStart,
  enabled = true,
  pullMin,
  pullMax,
  snapbackDuration,
  children,
}: IonRefresherProps) {
  const ctx = useScrollCtx();
  const cb = useRef({ onRefresh, onPull, onStart });
  cb.current = { onRefresh, onPull, onStart };
  const childrenRef = useRef(children);
  childrenRef.current = children;
  const key = contentKey(children);
  useEffect(() => {
    ctx.registerRefresher({
      enabled,
      content: childrenRef.current,
      opts: {
        pullMin,
        pullMax,
        snapbackDuration,
        onRefresh: r => cb.current.onRefresh?.(r),
        onPull: r => cb.current.onPull?.(r),
        onStart: r => cb.current.onStart?.(r),
      },
    });
  }, [ctx, enabled, key, pullMin, pullMax, snapbackDuration]);
  useEffect(() => () => ctx.registerRefresher(null), [ctx]);
  return null; // ion-refresher is absolutely positioned behind the content, drawn by IonContent
}

export interface IonRefresherContentProps {
  pullingIcon?: string; // default config 'arrow-down' (config ionPullIcon); Topbath always passes 'arrow-dropdown'
  pullingText?: string;
  refreshingSpinner?: SpinnerName; // default config spinner 'ios' (not built: Topbath always passes 'circles')
  refreshingText?: string;
}

export function IonRefresherContent({
  pullingIcon = refresherMd.pullingIcon,
  pullingText,
  refreshingSpinner = refresherMd.refreshingSpinner,
  refreshingText,
}: IonRefresherContentProps) {
  const state = useContext(RefresherStateContext);
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    // refresher.scss:79 `transition: 200ms` on the icon; ready -> rotate(180deg) (:118); cancelling/completing -> scale(0)
    const cfg = { duration: refresherMd.iconTransitionMs, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true };
    Animated.timing(rotate, { toValue: state === 'ready' ? 1 : 0, ...cfg }).start();
    Animated.timing(scale, { toValue: state === 'cancelling' || state === 'completing' ? 0 : 1, ...cfg }).start();
  }, [state, rotate, scale]);
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const showPulling = state === 'pulling' || state === 'ready' || state === 'cancelling';
  const showRefreshing = state === 'refreshing' || state === 'completing';
  const text = [fontFor(400), styles.text];
  return (
    <View testID="ion-refresher-content" style={styles.content}>
      {showPulling ? (
        <View testID="refresher-pulling" style={styles.block}>
          {pullingIcon ? (
            <Animated.View style={[styles.iconRow, { transform: [{ rotate: spin }, { scale }] }]}>
              <IonIcon name={pullingIcon} size={refresherMd.iconSize} color={refresherMd.iconColor} />
            </Animated.View>
          ) : null}
          {pullingText ? <Text style={text}>{pullingText}</Text> : null}
        </View>
      ) : null}
      {showRefreshing ? (
        <View testID="refresher-refreshing" style={styles.block}>
          <Animated.View style={[styles.spinnerRow, { transform: [{ scale }] }]}>
            <IonSpinner name={refreshingSpinner} color={refresherMd.iconColor} />
          </Animated.View>
          {refreshingText ? <Text style={text}>{refreshingText}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // ion-refresher-content{display:flex;flex-direction:column;justify-content:center;height:100%}
  content: { height: '100%', justifyContent: 'center' },
  block: { width: '100%', alignItems: 'center' },
  iconRow: { height: scrollMetrics.refresherIconRow, justifyContent: 'center', alignItems: 'center' },
  spinnerRow: { height: scrollMetrics.refresherSpinnerRow, justifyContent: 'flex-start', alignItems: 'center' },
  text: { fontSize: refresherMd.textSize, color: refresherMd.textColor, textAlign: 'center', includeFontPadding: false },
});
