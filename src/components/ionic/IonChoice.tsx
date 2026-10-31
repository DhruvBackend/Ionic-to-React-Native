// <ion-list radio-group> + <ion-radio> (components/radio/radio-group.js, radio-button.js, radio.md.scss) and <ion-checkbox>
// (components/checkbox/checkbox.js, util/base-input.js, checkbox.md.scss) in md mode. Values: ionicMdContent.ts (radioMd, checkboxMd,
// itemContentMd). Inside an IonItem the control is placed like Ionic's content projection (radio at the end, checkbox at the start;
// `slot` = item-left / item-right) and a transparent `button.item-cover` over the whole item takes the tap.
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ionicColors } from '../../theme';
import { checkboxMd, colorContrast, itemContentMd, radioMd } from '../../theme/ionicMdContent';
import { isCheckedProperty } from './IonSelect';
import { useItemControl } from './IonList';

// util/util.js:110-116
export function isTrueProperty(val: unknown): boolean {
  if (typeof val === 'string') {
    const v = val.toLowerCase().trim();
    return v === 'true' || v === 'on' || v === '';
  }
  return !!val;
}

const colorOf = (name?: string) => (name && (ionicColors as Record<string, string>)[name]) || ionicColors.primary;

interface GroupValue {
  value: unknown;
  updated: boolean; // a user selection or a later model write has run _update(): until then each radio keeps its own `checked`
  disabled: boolean;
  select: (v: unknown) => void;
}
const GroupContext = createContext<GroupValue | null>(null);

export interface IonRadioGroupProps {
  value?: unknown; // [(ngModel)]
  onChange?: (value: unknown) => void; // (ionChange)
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

// radio-group.js: a user tap runs onChange -> value = val; ionChange.emit(val) ALWAYS (also when the same radio is tapped again).
// A model write (writeValue, radio-group.js:108-117) updates the radios and emits ionChange(val) EXCEPT the very first write (`_init`).
// With [(ngModel)] Angular makes two writes at start-up: writeValue(null) synchronously (the skipped one) and, in a later microtask
// (NgModel._updateValue -> resolvedPromise.then), writeValue(<initial model>), which emits ionChange(<initial model>) even when it is
// undefined. NOTE (parity): so a group that has a `value` prop (= [(ngModel)]) emits its initial value once, asynchronously, after
// mounting; a group without a `value` prop (plain `radio-group` + (ionChange)) never gets a model write and does not.
export function IonRadioGroup(props: IonRadioGroupProps) {
  const { value, onChange, disabled = false, testID = 'ion-radio-group', style, children } = props;
  const hasModel = 'value' in props;
  const [state, setState] = useState<{ value: unknown; updated: boolean }>({ value, updated: false });
  const current = useRef<unknown>(value);
  const first = useRef(true);
  const latest = useRef(onChange);
  latest.current = onChange;

  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (!hasModel) {
        return undefined;
      }
      // the second write (the model value) arrives in a microtask, after the skipped synchronous writeValue(null)
      let alive = true;
      const initial = value;
      Promise.resolve().then(() => {
        if (alive && current.current === initial) {
          setState({ value: initial, updated: true });
          latest.current?.(initial);
        }
      });
      return () => {
        alive = false;
      };
    }
    if (value === current.current) {
      return undefined; // ngModel does not write an unchanged model
    }
    current.current = value;
    setState({ value, updated: true });
    latest.current?.(value);
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const select = (v: unknown) => {
    current.current = v;
    setState({ value: v, updated: true });
    onChange?.(v);
  };
  return (
    <GroupContext.Provider value={{ value: state.value, updated: state.updated, disabled, select }}>
      <View testID={testID} style={style}>
        {children}
      </View>
    </GroupContext.Provider>
  );
}
IonRadioGroup.ionListTransparent = true; // IonList looks through it (radio-group is an attribute of ion-list in Ionic)

export interface IonRadioProps {
  value?: unknown;
  checked?: boolean | string; // the `checked` attribute (string "true"/"false" from `checked="{{expr}}"`)
  color?: string;
  disabled?: boolean;
  slot?: 'start' | 'end'; // item-left / item-start | item-right / item-end
  onPress?: (value: unknown) => void; // (click) on <ion-radio>: runs after the group updated
  testID?: string;
}

export function IonRadio({ value, checked: checkedAttr, color, disabled: disabledProp, slot = 'end', onPress, testID = 'ion-radio' }: IonRadioProps) {
  const group = useContext(GroupContext);
  const [own, setOwn] = useState(isTrueProperty(checkedAttr));
  // radio-button.js:73-86 checked / :88-93 disabled (own or the group's); ngOnInit syncs with a present group value
  const groupHas = group && group.value !== undefined && group.value !== null;
  const checked = group && (group.updated || groupHas) ? isCheckedProperty(group.value, value) : own;
  const disabled = !!disabledProp || !!group?.disabled;

  const press = () => {
    // _click: this.checked = true; ionSelect.emit(value) -> group.onChange(value)
    setOwn(true);
    group?.select(value);
    onPress?.(value);
  };
  const inItem = useItemControl({ kind: 'radio', checked, disabled, color, press });

  const t = useRef(new Animated.Value(checked ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(t, {
      toValue: checked ? 1 : 0,
      duration: radioMd.transitionMs,
      easing: Easing.bezier(...radioMd.easing),
      useNativeDriver: true,
    }).start();
  }, [checked, t]);

  const on = colorOf(color);
  const Box = inItem ? View : Pressable; // in an item the item-cover takes the tap; alone, the control itself does
  return (
    <Box
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ checked, disabled }}
      {...(inItem ? null : { onPress: press, disabled })}
      // .item-md .radio-md { margin: 9px 10px 9px 0 } (item-left: 11px 36px 10px 4px); item-radio-disabled .3 ([CSS] 15089-15091)
      style={[styles.radioBox, inItem && itemMargin(slot), disabled && { opacity: itemContentMd.controlDisabledOpacity }]}
    >
      <View testID={`${testID}-icon`} style={[styles.radioIcon, { borderColor: checked ? on : radioMd.borderColor }]}>
        <Animated.View
          testID={`${testID}-inner`}
          style={[styles.radioInner, { backgroundColor: on, transform: [{ scale: t }] }]}
        />
      </View>
    </Box>
  );
}
IonRadio.ionSlot = 'end';
const itemMargin = (slot: 'start' | 'end'): ViewStyle => {
  const m = slot === 'start' ? itemContentMd.radioMarginStart : itemContentMd.radioMarginEnd;
  return { marginTop: m.top, marginRight: m.right, marginBottom: m.bottom, marginLeft: m.left };
};

export interface CheckboxChangeEvent {
  checked: boolean;
  value: boolean;
  disabled: boolean;
}

export interface IonCheckboxProps {
  checked?: boolean | string; // [(ngModel)] / [checked]
  // (ionChange): fires synchronously on a tap (TimeoutDebouncer(0)), see below. Ionic emits the Checkbox instance (_inputChangeEvent() returns `this`);
  // pages read `$event.checked` / `$event.value`, so the payload is { checked, value, disabled } (value is the boolean, as in Ionic).
  onChange?: (event: CheckboxChangeEvent) => void;
  onPress?: (checked: boolean) => void; // (click): runs right after the toggle, with the new value
  color?: string;
  disabled?: boolean;
  slot?: 'start' | 'end'; // [item-end] moves it to the end side with 11/10/10/0 margins ([CSS] 13212)
  testID?: string;
}

// checkbox.js + base-input.js. A tap flips the value and fires ionChange through a TimeoutDebouncer(0), which runs synchronously; a model write fires
// it only after the first one was skipped ("ngModel fires the first time too late, we need to skip the first ngModel update"):
// base-input.js writeValue: `_writeValue` returns false for undefined and for an unchanged value (no emit); the first CHANGING model write
// only sets `_initModel`; later ones call _fireIonChange. A tap emits through the debouncer and then sets `_initModel` too.
export function IonCheckbox({ checked: checkedProp, onChange, onPress, color, disabled = false, slot = 'start', testID = 'ion-checkbox' }: IonCheckboxProps) {
  const initial = isTrueProperty(checkedProp);
  const [value, setValue] = useState(initial);
  const valueRef = useRef(initial);
  const initModel = useRef(initial); // the initial `true` model write is the skipped first one (base-input.js:132-141)
  const latest = useRef({ onChange, disabled });
  latest.current = { onChange, disabled };

  // TimeoutDebouncer(0) runs the callback synchronously (util/debouncer.js:12-13: `wait <= 0` → callback()).
  const fire = (v: boolean) => {
    latest.current.onChange?.({ checked: v, value: v, disabled: latest.current.disabled });
    initModel.current = true;
  };

  const first = useRef(true);
  useEffect(() => {
    // writeValue: only when the model really changed the value
    if (first.current) {
      first.current = false;
      return;
    }
    if (checkedProp === undefined) {
      return; // _writeValue(undefined) changes nothing
    }
    const next = isTrueProperty(checkedProp);
    if (next === valueRef.current) {
      return;
    }
    valueRef.current = next;
    setValue(next);
    if (initModel.current) {
      fire(next);
    } else {
      initModel.current = true;
    }
  }, [checkedProp]);

  const press = () => {
    // checkbox.js:_click: this.value = !this.value (-> onChange + _fireIonChange), then the template's (click)
    const next = !valueRef.current;
    valueRef.current = next;
    setValue(next);
    fire(next);
    onPress?.(next);
  };
  const inItem = useItemControl({ kind: 'checkbox', checked: value, disabled, color, press });

  const t = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(t, {
      toValue: value ? 1 : 0,
      duration: checkboxMd.transitionMs,
      easing: Easing.bezier(...checkboxMd.easing),
      useNativeDriver: false, // colours
    }).start();
  }, [value, t]);

  const on = colorOf(color);
  const fill = t.interpolate({ inputRange: [0, 1], outputRange: [checkboxMd.backgroundColor, on] });
  const m = slot === 'end' ? itemContentMd.checkboxMarginEnd : itemContentMd.checkboxMargin;
  const Box = inItem ? View : Pressable;
  return (
    <Box
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled }}
      {...(inItem ? null : { onPress: press, disabled })}
      style={[
        inItem && { marginTop: m.top, marginRight: m.right, marginBottom: m.bottom, marginLeft: m.left },
        disabled && { opacity: itemContentMd.controlDisabledOpacity },
      ]}
    >
      <Animated.View testID={`${testID}-icon`} style={[styles.checkIcon, { borderColor: value ? on : checkboxMd.borderColor, backgroundColor: fill, // transition-property: background only
          }]}>
        {value ? <View testID={`${testID}-tick`} style={[styles.tick, { borderColor: colorContrast(on) }]} /> : null}
      </Animated.View>
    </Box>
  );
}
IonCheckbox.ionSlot = 'start';

const styles = StyleSheet.create({
  radioBox: { position: 'relative' },
  // .radio-md .radio-icon: 16 x 16, border 2px solid #787878, radius 50% ([CSS] 15085)
  radioIcon: {
    width: radioMd.size,
    height: radioMd.size,
    borderRadius: radioMd.size / 2,
    borderWidth: radioMd.borderWidth,
    borderColor: radioMd.borderColor,
  },
  // .radio-md .radio-inner: 8px at left/top 2px, scale3d(0 -> 1) over 280ms ([CSS] 15086-15088); the box is the padding box
  radioInner: {
    position: 'absolute',
    left: radioMd.innerOffset,
    top: radioMd.innerOffset,
    width: radioMd.innerSize,
    height: radioMd.innerSize,
    borderRadius: radioMd.innerSize / 2,
  },
  checkIcon: {
    width: checkboxMd.size,
    height: checkboxMd.size,
    borderRadius: checkboxMd.borderRadius,
    borderWidth: checkboxMd.borderWidth,
  },
  tick: {
    position: 'absolute',
    left: checkboxMd.tick.left,
    top: checkboxMd.tick.top,
    width: checkboxMd.tick.width,
    height: checkboxMd.tick.height,
    borderRightWidth: checkboxMd.tick.borderWidth,
    borderBottomWidth: checkboxMd.tick.borderWidth,
    transform: [{ rotate: checkboxMd.tick.rotate }],
  },
});
