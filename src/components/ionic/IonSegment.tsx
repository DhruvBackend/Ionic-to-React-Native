// <ion-segment> / <ion-segment-button> (components/segment/segment.js, segment-button.js, segment.md.scss).
// Two looks: the Ionic md default (default here; used by sales-exec-plumber-list.html:6-13, <ion-toolbar color="light"
// class="tab-bar">) and the Topbath `.ion-tab-btn` look (variables.scss:778-808), opt-in with `inTabBtn` (used by the other 4
// segments: complaint-history, customerdetail x2, plumber-list).
//
// Event order (source-verified): the button's host (click) listener runs segment.js `this.value = button.value`, whose setter
// (base-input.js:70-78) calls onChange() (ngModelChange) and `_fireIonChange()`; _fireIonChange goes through
// TimeoutDebouncer(0) whose `wait <= 0` branch calls the callback SYNCHRONOUSLY (util/debouncer.js:16-18), so ionChange
// is emitted right after ngModelChange, before the page's own (click) handler on the same element runs. The page's
// (click)/(ionChange) handlers therefore already see the NEW model value. `onPress(value)` is that (click), called last.
//
// Programmatic model changes (a page assigning `statusType = 'Closed'`) go through writeValue (base-input.js:96-104): once
// the first model write has happened (`_initModel`; that first write is skipped), a later change that really differs from
// the current value also fires ionChange (no ngModelChange: the model is where it came from).
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { overlay } from '../../theme/ionicMdOverlays';
import { ionicColors } from '../../theme';
import { segmentMd, topbathSegment } from '../../theme/ionicMdScroll';
import { fontFor } from '../../theme/typography';

interface SegmentCtx {
  value?: string;
  color: string;
  topbath: boolean;
  disabled: boolean;
  select(value: string, onPress?: (v: string) => void): void;
}
const Ctx = createContext<SegmentCtx | null>(null);

export interface IonSegmentProps {
  value?: string; // [(ngModel)]
  onValueChange?: (value: string) => void; // ngModelChange (only for a user tap)
  onIonChange?: (value: string) => void; // (ionChange): tap, or a later programmatic change; only when the value really changes
  color?: keyof typeof ionicColors; // md colour attr; default md colour is the toolbar active colour (primary)
  inTabBtn?: boolean; // inside `.ion-tab-btn` (Topbath look). Default false: the Ionic md default look
  disabled?: boolean;
  testID?: string;
  children?: React.ReactNode;
}

export function IonSegment({
  value,
  onValueChange,
  onIonChange,
  color = 'primary',
  inTabBtn = false,
  disabled = false,
  testID,
  children,
}: IonSegmentProps) {
  const current = useRef(value); // the segment's own `_value`
  const wrote = useRef(false); // base-input `_initModel`
  const cb = useRef({ onValueChange, onIonChange });
  cb.current = { onValueChange, onIonChange };
  useEffect(() => {
    // writeValue: ignore undefined (`_writeValue` returns false); an equal value is no change
    if (value === undefined || value === current.current) {
      if (value !== undefined) {
        wrote.current = true;
      }
      return;
    }
    current.current = value;
    if (wrote.current) {
      cb.current.onIonChange?.(value);
    } else {
      wrote.current = true; // the first model write is skipped
    }
  }, [value]);
  const ctx: SegmentCtx = {
    value,
    color: ionicColors[color],
    topbath: inTabBtn,
    disabled,
    select(v, onPress) {
      if (v !== current.current) {
        // segment.js:85 `this.value = selectedButton.value` -> ngModelChange then (synchronous) ionChange
        current.current = v;
        wrote.current = true;
        onValueChange?.(v);
        onIonChange?.(v);
      }
      onPress?.(v); // the page's (click), after both
    },
  };
  const t = topbathSegment;
  return (
    <View testID={testID} style={inTabBtn ? styles.tabBtn : undefined}>
      <Ctx.Provider value={ctx}>
        <View
          style={[
            styles.segment,
            inTabBtn && {
              backgroundColor: t.background,
              borderWidth: t.borderWidth,
              borderColor: t.borderColor,
              borderRadius: t.borderRadius,
              overflow: 'hidden',
            },
            disabled && { opacity: segmentMd.disabledOpacity },
          ]}
        >
          {children}
        </View>
      </Ctx.Provider>
    </View>
  );
}

export interface IonSegmentButtonProps {
  value: string;
  onPress?: (value: string) => void; // the template's (click)
  disabled?: boolean;
  testID?: string;
  children?: string;
}

export function IonSegmentButton({ value, onPress, disabled, testID, children }: IonSegmentButtonProps) {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('IonSegmentButton must be inside IonSegment');
  }
  const active = ctx.value === value;
  const [pressed, setPressed] = useState(false);
  const addT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clearT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const actAnim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const opAnim = useRef(new Animated.Value(active ? 1 : segmentMd.buttonOpacity)).current;
  useEffect(
    () => () => {
      clearTimeout(addT.current);
      clearTimeout(clearT.current);
    },
    [],
  );
  useEffect(() => {
    // `transition: 100ms all linear` (segment.md.scss:76)
    const cfg = { duration: segmentMd.transitionMs, easing: Easing.linear, useNativeDriver: false };
    Animated.timing(actAnim, { toValue: active ? 1 : 0, ...cfg }).start();
    Animated.timing(opAnim, { toValue: active || pressed ? 1 : segmentMd.buttonOpacity, ...cfg }).start();
  }, [active, pressed, actAnim, opAnim]);

  const t = topbathSegment;
  const off = ctx.topbath ? t.textColor : ctx.color;
  const on = ctx.topbath ? t.activeColor : ctx.color;
  const text = ctx.topbath ? t.textTransform : segmentMd.textTransform;
  const fontSize = ctx.topbath ? t.fontSize : segmentMd.fontSize;
  const isDisabled = ctx.disabled || disabled;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled: !!isDisabled }}
      disabled={isDisabled}
      onPressIn={() => {
        // activated class: added 80 ms after touch-down, removed 80 ms after touch-up (tap-click/activator.js)
        clearTimeout(clearT.current);
        addT.current = setTimeout(() => setPressed(true), overlay.activatedDelayMs);
      }}
      onPressOut={() => {
        clearTimeout(addT.current);
        clearT.current = setTimeout(() => setPressed(false), overlay.activatedClearMs);
      }}
      onPress={() => ctx.select(value, onPress)}
      style={styles.buttonWrap}
    >
      <Animated.View
        style={[
          styles.button,
          // .segment-md .segment-button{padding:0 6px} applies to both looks (Topbath does not override it)
          { paddingHorizontal: segmentMd.paddingEnd },
          ctx.topbath
            ? {
                height: t.buttonHeight,
                backgroundColor: actAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(0,0,0,0)', t.activeBackground],
                }),
              }
            : {
                height: segmentMd.height,
                borderBottomWidth: segmentMd.borderBottomWidth,
                borderBottomColor: actAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [segmentMd.borderBottomColor, ctx.color],
                }),
              },
          { opacity: opAnim },
        ]}
      >
        <Animated.Text
          numberOfLines={1}
          // md default: segment.scss `text-overflow: ellipsis`; Topbath's `display:flex` on the button disables it, so
          // the label is clipped (NOTE (parity), see topbathSegment)
          ellipsizeMode={ctx.topbath ? 'clip' : 'tail'}
          style={[
            fontFor(active && ctx.topbath ? t.activeFontWeight : segmentMd.fontWeight),
            {
              fontSize,
              letterSpacing: ctx.topbath ? t.letterSpacing : 0,
              textTransform: text,
              color: actAnim.interpolate({ inputRange: [0, 1], outputRange: [off, on] }),
              textAlign: 'center',
            },
          ]}
        >
          {children ?? ''}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabBtn: { paddingHorizontal: topbathSegment.wrapperPaddingHorizontal }, // variables.scss:779
  segment: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }, // segment.scss ion-segment
  buttonWrap: { flex: 1, width: 0 }, // .segment-md .segment-button{flex:1;width:0}
  button: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, // Topbath: display:flex; center
});
