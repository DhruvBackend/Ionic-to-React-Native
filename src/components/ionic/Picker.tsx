// Ionic 3.9.5 md-mode <ion-picker> (components/picker/picker-component.js, picker-column.js, picker.scss,
// picker.md.scss, picker-transitions.js). md has pickerRotateFactor 0 (mode-registry.js:46) and pickerScaleFactor 0.81,
// so the columns are FLAT lists (translateY only; options other than the selected one are scale(0.81)), 43 px per option, with white gradient bands above and below
// the selected row coloured with the primary colour. NOTE: picker.md.scss styles .picker-above-highlight and
// .picker-below-highlight but never sets `display`, so picker.scss's `display: none` wins and md shows NO bands
// (verified in headless Chrome with the shipped main.css). See src/theme/ionicMdPickers.ts for every value.
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { pickerMd } from '../../theme/ionicMdPickers';
import { pickerSelected } from '../../ui/datetimePicker';
import {
  finishDismiss,
  requestDismiss,
  type OverlayEntry,
  type PickerButton,
  type PickerColumn,
  type PickerOptions,
} from '../../ui/overlays';
import { Backdrop } from './Backdrop';
import { RippleButton } from './RippleButton';
import { textStyle } from './text';
import { enterLeave, useOverlayLifecycle } from './useOverlayLifecycle';

const P = pickerMd;
const ease = Easing.bezier(0, 0, 0.58, 1); // CSS `transition-timing-function: ease-out` (picker.md.scss .picker-opt)

interface ColumnHandle {
  refresh(): void;
}

interface ColumnProps {
  col: PickerColumn;
  version: number; // bumps when option.disabled changed (datetime validate)
  onChange: () => void;
  handleRef: (h: ColumnHandle | null) => void;
  testID: string;
}

// PickerColumnCmp: drag with deceleration, rubber band at both ends, tap to select (150 ms)
function PickerColumnView({ col, onChange, handleRef, testID }: ColumnProps) {
  const optHeight = P.optHeight;
  const anim = useRef(new Animated.Value(-col.selectedIndex * optHeight)).current;
  const s = useRef({
    y: -col.selectedIndex * optHeight, // committed y (this.y)
    cur: -col.selectedIndex * optHeight, // y being displayed
    velocity: 0,
    startY: null as number | null,
    pos: [] as number[],
    minY: 0,
    maxY: 0,
    bounceFrom: 0,
    lastIndex: undefined as number | undefined,
    raf: 0,
    moved: false,
    startLocationY: 0,
  }).current;
  const [selIdx, setSelIdx] = useState(col.selectedIndex);
  const [, setTick] = useState(0);
  const colRef = useRef(col);
  colRef.current = col;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const stopAnim = () => {
    anim.stopAnimation();
    cancelAnimationFrame(s.raf);
  };

  // update(y, duration, saveY, emitChange)
  const update = (yIn: number, duration: number, saveY: boolean, emitChange: boolean) => {
    const c = colRef.current;
    const y = Math.round(yIn);
    const length = c.options.length;
    const selectedIndex = (c.selectedIndex = Math.min(Math.max(Math.round(-y / optHeight), 0), length - 1));
    s.cur = y;
    if (duration === 0) {
      anim.setValue(y);
    } else {
      Animated.timing(anim, { toValue: y, duration, easing: ease, useNativeDriver: false }).start();
    }
    setSelIdx(selectedIndex);
    if (saveY) {
      s.y = y;
    }
    if (emitChange) {
      if (s.lastIndex === undefined) {
        s.lastIndex = c.selectedIndex;
      } else if (s.lastIndex !== c.selectedIndex) {
        s.lastIndex = c.selectedIndex;
        onChangeRef.current();
      }
    }
  };

  const setSelected = (selectedIndex: number, duration: number) => {
    const y = selectedIndex > -1 ? selectedIndex * optHeight * -1 : 0;
    cancelAnimationFrame(s.raf);
    s.velocity = 0;
    update(y, duration, true, true);
  };

  const decelerate = () => {
    let y = 0;
    if (isNaN(s.y) || !optHeight) {
      update(y, 0, true, true);
    } else if (Math.abs(s.velocity) > 0) {
      s.velocity *= P.decelerationFriction;
      s.velocity = s.velocity > 0 ? Math.max(s.velocity, 1) : Math.min(s.velocity, -1);
      y = Math.round(s.y - s.velocity);
      if (y > s.minY) {
        y = s.minY;
        s.velocity = 0;
      } else if (y < s.maxY) {
        y = s.maxY;
        s.velocity = 0;
      }
      const notLockedIn = y % optHeight !== 0 || Math.abs(s.velocity) > 1;
      update(y, 0, true, !notLockedIn);
      if (notLockedIn) {
        s.raf = requestAnimationFrame(decelerate);
      }
    } else if (s.y % optHeight !== 0) {
      const currentPos = Math.abs(s.y % optHeight);
      s.velocity = currentPos > optHeight / 2 ? 1 : -1;
      decelerate();
    }
  };

  const bounds = () => {
    const options = colRef.current.options;
    let minY = options.length - 1;
    let maxY = 0;
    for (let i = 0; i < options.length; i++) {
      if (!options[i].disabled) {
        minY = Math.min(minY, i);
        maxY = Math.max(maxY, i);
      }
    }
    s.minY = minY * optHeight * -1;
    s.maxY = maxY * optHeight * -1;
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e, g) => {
        // pointerStart
        stopAnim();
        s.moved = false;
        s.startLocationY = e.nativeEvent.locationY;
        s.startY = g.y0;
        s.velocity = 0;
        s.pos = [g.y0, Date.now()];
        bounds();
      },
      onPanResponderMove: (_e, g) => {
        // pointerMove
        const currentY = g.moveY;
        s.pos.push(currentY, Date.now());
        if (s.startY === null) {
          return;
        }
        s.moved = true;
        let y = s.y + (currentY - s.startY);
        if (y > s.minY) {
          y = Math.pow(y, 0.8);
          s.bounceFrom = y;
        } else if (y < s.maxY) {
          y += Math.pow(s.maxY - y, 0.9);
          s.bounceFrom = y;
        } else {
          s.bounceFrom = 0;
        }
        update(y, 0, false, false);
      },
      onPanResponderRelease: (_e, g) => {
        // pointerEnd
        if (s.startY === null) {
          return;
        }
        const endY = g.moveY || g.y0;
        if (!s.moved && Math.abs(endY - s.startY) <= 3) {
          // a tap: the click of the option under the finger (optClick -> setSelected(i, 150))
          s.startY = null;
          const index = Math.floor((s.startLocationY - P.optsTop - s.cur) / optHeight);
          const opt = colRef.current.options[index];
          if (opt && !opt.disabled) {
            setSelected(index, P.tapAnimationMs);
          }
          return;
        }
        s.velocity = 0;
        if (s.bounceFrom > 0) {
          update(s.minY, 100, true, true);
          s.startY = null;
          return;
        } else if (s.bounceFrom < 0) {
          update(s.maxY, 100, true, true);
          s.startY = null;
          return;
        }
        s.pos.push(endY, Date.now());
        const endPos = s.pos.length - 1;
        let startPos = endPos;
        const timeRange = Date.now() - 100;
        for (let i = endPos; i > 0 && s.pos[i] > timeRange; i -= 2) {
          startPos = i;
        }
        if (startPos !== endPos) {
          const timeOffset = s.pos[endPos] - s.pos[startPos];
          const movedTop = s.pos[startPos - 1] - s.pos[endPos - 1];
          const velocity = (movedTop / timeOffset) * P.frameMs;
          s.velocity = Math.max(-P.maxSpeed, Math.min(velocity, P.maxSpeed));
        }
        if (Math.abs(endY - s.startY) > 3) {
          const y = s.y + (endY - s.startY);
          update(y, 0, true, true);
        }
        s.startY = null;
        decelerate();
      },
      onPanResponderTerminate: () => {
        s.startY = null;
        decelerate();
      },
    }),
  ).current;

  // refresh(): after the datetime validation changed the clamped index
  const refresh = () => {
    const c = colRef.current;
    let min = c.options.length - 1;
    let max = 0;
    for (let i = 0; i < c.options.length; i++) {
      if (!c.options[i].disabled) {
        min = Math.min(min, i);
        max = Math.max(max, i);
      }
    }
    const selectedIndex = Math.max(min, Math.min(c.selectedIndex, max));
    c.selectedIndex = selectedIndex;
    if (Math.round(-s.cur / optHeight) !== selectedIndex) {
      cancelAnimationFrame(s.raf);
      s.velocity = 0;
      update(selectedIndex * optHeight * -1, P.tapAnimationMs, true, false);
    }
    setTick(t => t + 1);
  };
  useEffect(() => {
    handleRef({ refresh });
    return () => {
      handleRef(null);
      cancelAnimationFrame(s.raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    // the initial selection is set without a transition and counts as the first lastIndex
    s.lastIndex = undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const colStyle = [
    styles.col,
    col.align === 'left' && styles.optsLeft,
    col.align === 'right' && styles.optsRight,
    col.columnWidth ? { maxWidth: parseFloat(col.columnWidth) + 2 * P.columnPaddingHorizontal } : null,
  ];
  return (
    <View testID={testID} style={colStyle} {...pan.panHandlers}>
      <View
        pointerEvents="none"
        style={[styles.opts, col.optionsWidth ? { maxWidth: parseFloat(col.optionsWidth) } : null]}
      >
        <Animated.View style={{ transform: [{ translateY: anim }] }}>
          {col.options.map((o, i) => {
            const selected = i === selIdx;
            return (
              <View
                key={i}
                testID={`${testID}-opt-${i}`}
                style={[styles.opt, { top: i * optHeight }, o.disabled && styles.optDisabled]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    textStyle(P.optFontSize, 400, selected ? P.optSelectedColor : P.optColor, P.optLineHeight),
                    styles.optText,
                    selected ? null : { transform: [{ scale: P.optScale }] }, // picker-column.js:277 scale(pickerScaleFactor)
                  ]}
                >
                  {o.text}
                </Text>
              </View>
            );
          })}
        </Animated.View>
      </View>
    </View>
  );
}

export function PickerCmp({ entry }: { entry: OverlayEntry }) {
  const d: PickerOptions = entry.options;
  const { width } = useWindowDimensions();
  const buttons: PickerButton[] = d.buttons.map(b => (typeof b === 'string' ? { text: b } : b));
  const enableBackdropDismiss = d.enableBackdropDismiss ?? true; // picker.js
  const enabled = useRef(false);
  const handles = useRef<(ColumnHandle | null)[]>([]);
  const [version, setVersion] = useState(0);

  const progress = useOverlayLifecycle(
    { enterMs: P.enter.duration, leaveMs: P.leave.duration, easing: P.easing },
    entry.leaving,
    () => {
      enabled.current = true;
    },
    () => finishDismiss(entry.id),
  );

  const getSelected = () => pickerSelected(d.columns);
  const dismiss = (role?: string) => requestDismiss(entry.id, getSelected(), role);

  const btnClick = (button: PickerButton) => {
    if (!enabled.current) {
      return;
    }
    let shouldDismiss = true;
    if (button.handler && button.handler(getSelected()) === false) {
      shouldDismiss = false;
    }
    if (shouldDismiss) {
      dismiss(button.role);
    }
  };

  const bdClick = () => {
    if (enabled.current && enableBackdropDismiss) {
      const cancel = buttons.find(b => b.role === 'cancel');
      if (cancel) {
        btnClick(cancel);
      } else {
        dismiss('backdrop');
      }
    }
  };

  // _colChange -> picker.ionChange (datetime: validate(); picker.refresh())
  const colChange = () => {
    d.onChange?.(getSelected());
    handles.current.forEach(h => h?.refresh());
    setVersion(v => v + 1);
  };

  const backdropOpacity = enterLeave(progress, P.enter.backdropOpacity, P.leave.backdropOpacity);
  const translateY = enterLeave(progress, [P.wrapperHeight, 0], [0, P.wrapperHeight]);
  const wrapperWidth = Math.min(width, P.wrapperMaxWidth);

  return (
    <View testID="picker-root" style={StyleSheet.absoluteFill}>
      <Backdrop opacity={backdropOpacity} onPress={bdClick} />
      <Animated.View
        testID="picker-wrapper"
        style={[
          styles.wrapper,
          { width: wrapperWidth, transform: [{ translateY }] },
        ]}
      >
        <View testID="picker-toolbar" style={styles.toolbar}>
          {buttons.map((b, n) => (
            <View key={n} testID={`picker-toolbar-button-${n}`}>
              <RippleButton
                testID={`picker-button-${n}`}
                onPress={() => btnClick(b)}
                rippleColor={P.rippleColor}
                activatedStyle={styles.buttonActivated}
                style={styles.button}
              >
                <Text
                  testID={`picker-button-${n}-text`}
                  style={[
                    textStyle(P.buttonFontSize, P.buttonFontWeight, P.buttonColor, P.buttonFontSize),
                    styles.upper,
                  ]}
                >
                  {b.text}
                </Text>
              </RippleButton>
            </View>
          ))}
        </View>
        <View testID="picker-columns" style={styles.columns}>
          {d.columns.map((c, i) => (
            <PickerColumnView
              key={i}
              testID={`picker-col-${i}`}
              col={c}
              version={version}
              onChange={colChange}
              handleRef={h => {
                handles.current[i] = h;
              }}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // .picker-wrapper: absolute; bottom 0; left 0; right 0; margin auto; max-width 500px
  wrapper: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    height: P.wrapperHeight,
    backgroundColor: P.backgroundColor,
    borderTopWidth: P.wrapperBorderTopWidth,
    borderTopColor: P.borderColor,
    overflow: 'hidden',
  },
  // .picker-md .picker-toolbar
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: P.toolbarHeight,
    backgroundColor: P.backgroundColor,
    zIndex: 1,
  },
  button: {
    height: P.buttonHeight,
    paddingHorizontal: P.buttonPaddingHorizontal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActivated: { backgroundColor: P.buttonActivatedBackground },
  upper: { textTransform: 'uppercase' },
  // .picker-columns
  columns: {
    height: P.columnsHeight,
    flexDirection: 'row',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // .picker-col (content-box padding 0 8px, flex: 1, justify-content: center)
  col: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: P.columnPaddingHorizontal,
  },
  optsLeft: { justifyContent: 'flex-start' },
  optsRight: { justifyContent: 'flex-end' },
  // .picker-opts { position: relative; flex: 1; max-width: 100%; top: 77px }
  opts: { flex: 1, maxWidth: '100%', top: P.optsTop },
  // .picker-opt: absolute, full width, height 4.3rem
  opt: { position: 'absolute', left: 0, width: '100%', height: P.optHeight },
  optDisabled: { opacity: 0 },
  optText: { textAlign: 'center', backgroundColor: 'transparent' },
});
