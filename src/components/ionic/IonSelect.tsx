// Ionic 3.9.5 <ion-select> (default "alert" interface), md mode: components/select/select.js, select.scss,
// select.md.scss. The closed control sits in an md <ion-item> (IonField); tapping it opens an Alert with radio
// buttons (or checkboxes for `multiple`) and the buttons [Cancel, OK], through the same Alert replica as every
// other alert (src/components/ionic/Alert.tsx).
//
// Topbath uses only the defaults: no `interface`, `okText`, `cancelText`, `multiple`, `selectOptions` or
// `compareWith` anywhere in src/pages/**.html (grep of `<ion-select`). Those are supported anyway, except the
// action-sheet and popover interfaces (never used; the alert is the Ionic default).
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './IonText';
import { itemMd, selectMd } from '../../theme/ionicMdPickers';
import { showAlert } from '../../ui/overlays';
import { IonField, useField, type FieldVariant } from './IonField';
import { textStyle } from './text';
import { normalLineHeight } from '../../theme/ionicMdOverlays';

export interface IonOption<T = any> {
  value: T;
  label: string;
  disabled?: boolean;
  selected?: boolean; // <ion-option selected>: used when the select has no value yet
}

export interface IonSelectProps<T = any> {
  value?: T | T[] | null;
  // (ngModelChange): the new value after OK. Not called for programmatic changes.
  onChange?: (value: T | T[]) => void;
  // (ionChange): after OK (one tick later, TimeoutDebouncer(0)) and when `value` changes from outside after mount.
  onIonChange?: (value: T | T[]) => void;
  onCancel?: () => void; // (ionCancel)
  options: IonOption<T>[];
  label?: string; // the text drawn in the <ion-label>
  // the label's textContent as Ionic computes it (`_item.getLabelText()`, select.js open()): the alert title. It includes the
  // required star with its original spacing, e.g. "State *" for `State <span>*</span>`. Defaults to `label`.
  labelText?: string;
  requiredMark?: boolean; // draws the red star after `label`
  floating?: boolean; // <ion-label floating>
  title?: string; // selectOptions.title
  subTitle?: string; // selectOptions.subTitle
  multiple?: boolean;
  okText?: string;
  cancelText?: string;
  placeholder?: string;
  selectedText?: string;
  compareWith?: (a: any, b: any) => boolean;
  disabled?: boolean;
  variant?: FieldVariant;
  error?: boolean;
  testID?: string;
  itemStyle?: React.ComponentProps<typeof IonField>['itemStyle'];
  prevMarginBottom?: number; // set by IonList (margin collapsing, see IonField itemVerticalMargins)
  // page `ion-item { font-size }` overrides (e.g. plumber-checkin `.bodr-botm ion-item { font-size: 14px }`): label and selected text inherit it
  fontSize?: number;
  isLast?: boolean; // as IonField: last item of an ion-list (no inner bottom line)
  noLines?: boolean; // as IonField: [no-lines]
}

// util/util.js isCheckedProperty: Ionic's default compareWith (loose equality on purpose)
export function isCheckedProperty(a: any, b: any): boolean {
  if (a === undefined || a === null || a === '') {
    return b === undefined || b === null || b === '';
  } else if (a === true || a === 'true') {
    return b === true || b === 'true';
  } else if (a === false || a === 'false') {
    return b === false || b === 'false';
  } else if (a === 0 || a === '0') {
    return b === 0 || b === '0';
  }
  // eslint-disable-next-line eqeqeq
  return a == b;
}

function deepEqual(a: unknown, b: unknown) {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

// select.js getValues()
function getValues(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value];
}

// select.js _updateText(): the texts of the options whose value is in the value list, joined with ", "
export function selectText<T>(options: IonOption<T>[], value: unknown, compareWith: (a: any, b: any) => boolean = isCheckedProperty): string {
  const values = getValues(value);
  const texts: string[] = [];
  options.forEach(o => {
    if (values.some(v => compareWith(v, o.value))) {
      texts.push(o.label);
    }
  });
  return texts.join(', ');
}

// select.js options setter: with no value at all, the options marked `selected` provide it
function effectiveValue<T>(props: IonSelectProps<T>): unknown {
  const empty = props.value === undefined || (Array.isArray(props.value) && props.value.length === 0);
  if (empty) {
    const sel = props.options.filter(o => o.selected).map(o => o.value);
    if (sel.length) {
      return props.multiple ? sel : sel[0];
    }
  }
  return props.value;
}

// the select logic shared by IonSelect (own item) and IonSelectInline (inside another item): text, ionChange rules, alert
// Exported for items that hold an input AND a select (my-camplaints .serach-filter): Ionic's button.item-cover belongs to the
// ion-select but covers the WHOLE ion-item (nearest positioned ancestor), so the input underneath cannot be focused.
// Usage: const sel = useIonSelect(props); <IonInputItem cover={{ onPress: sel.open }} trailing={<IonSelectBox text={sel.text} />} />
export function useIonSelect<T>(props: IonSelectProps<T>) {
  return useSelectLogic(props);
}

function useSelectLogic<T>(props: IonSelectProps<T>) {
  const {
    options,
    multiple = false,
    okText = 'OK',
    cancelText = 'Cancel',
    compareWith = isCheckedProperty,
    disabled = false,
  } = props;
  const value = effectiveValue(props);
  const text = selectText(options, value, compareWith);
  const focused = useRef(false);
  const latest = useRef(props);
  latest.current = props;
  // BaseInput: the default value is [] and writeValue ignores undefined and values equal to the current one. The FIRST effective
  // write only sets _initModel; only later writes (and user input) emit ionChange (base-input.js writeValue / _fireIonChange).
  const lastValue = useRef<unknown>([]);
  const initModel = useRef(false);
  useEffect(() => {
    if (value === undefined) {
      return;
    }
    const next = value === null ? [] : value;
    if (deepEqual(lastValue.current, next)) {
      return;
    }
    lastValue.current = next;
    if (initModel.current) {
      props.onIonChange?.(value as any);
    } else {
      initModel.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);

  const open = () => {
    if (focused.current || disabled) {
      return;
    }
    const p = latest.current;
    const current = effectiveValue(p);
    const values = getValues(current);
    const title = p.title ?? p.labelText ?? p.label;
    focused.current = true;
    showAlert({
      title,
      subTitle: p.subTitle,
      cssClass: 'select-alert ' + (multiple ? 'multiple-select-alert' : 'single-select-alert'),
      inputs: p.options.map(o => ({
        type: multiple ? 'checkbox' : 'radio',
        label: o.label,
        value: o.value,
        checked: values.some(v => compareWith(v, o.value)),
        disabled: o.disabled,
      })),
      buttons: [
        { text: cancelText, role: 'cancel', handler: () => p.onCancel?.() },
        {
          text: okText,
          // select.js: handler: selectedValues => this.value = selectedValues
          handler: (selected: unknown) => {
            if (selected === undefined) {
              return; // BaseInput._writeValue ignores undefined
            }
            if (!deepEqual(lastValue.current, selected)) {
              lastValue.current = selected;
              initModel.current = true;
              p.onChange?.(selected as any);
              setTimeout(() => p.onIonChange?.(selected as any), 0); // TimeoutDebouncer(0)
            }
          },
        },
      ],
      onDidDismiss: () => {
        focused.current = false;
      },
    });
  };
  return { text, open };
}

export function IonSelect<T = any>(props: IonSelectProps<T>) {
  const { label, requiredMark, floating = false, placeholder = '', selectedText = '', disabled = false, variant = 'plain', error, testID = 'ion-select', itemStyle, prevMarginBottom, fontSize, isLast, noLines } = props;
  const { text, open } = useSelectLogic(props);

  return (
    <IonField
      variant={variant}
      floating={floating}
      label={label}
      requiredMark={requiredMark}
      error={error}
      hasValue={!!text}
      focused={false}
      labelDisabled={disabled}
      testID={testID}
      itemStyle={itemStyle}
      prevMarginBottom={prevMarginBottom}
      labelStyle={fontSize !== undefined ? { fontSize } : undefined}
      isLast={isLast}
      noLines={noLines}
      cover={{ onPress: open, disabled }}
    >
      <SelectBox text={text} placeholder={placeholder} selectedText={selectedText} disabled={disabled} testID={testID} fontSize={fontSize} />
    </IonField>
  );
}

// <ion-item><ion-input/><ion-select/></ion-item> (my-camplaints .serach-filter): only the select box (text + arrow) with the same
// alert; pass it as IonInputItem `trailing`. NOTE: only the box is tappable here; Ionic's button.item-cover covers the whole item
// (and the input). For an exact copy use useIonSelect + IonSelectBox + IonInputItem `cover` (see useIonSelect). Padding / arrow / colours / max-width come from the enclosing field spec (select.md.scss).
export function IonSelectInline<T = any>(props: Omit<IonSelectProps<T>, 'label' | 'requiredMark' | 'floating' | 'variant' | 'error' | 'itemStyle' | 'prevMarginBottom'>) {
  const { placeholder = '', selectedText = '', disabled = false, testID = 'ion-select' } = props;
  const { text, open } = useSelectLogic(props);
  return (
    <Pressable testID={`${testID}-cover`} accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={open} style={styles.inlinePress}>
      <SelectBox text={text} placeholder={placeholder} selectedText={selectedText} disabled={disabled} testID={testID} />
    </Pressable>
  );
}

export function IonSelectBox(p: { text: string; placeholder?: string; selectedText?: string; disabled?: boolean; testID?: string }) {
  return <SelectBox text={p.text} placeholder={p.placeholder ?? ''} selectedText={p.selectedText ?? ''} disabled={p.disabled ?? false} testID={p.testID ?? 'ion-select'} />;
}

function SelectBox({
  text,
  placeholder,
  selectedText,
  disabled,
  testID,
  fontSize,
}: {
  text: string;
  placeholder: string;
  selectedText: string;
  disabled: boolean;
  testID: string;
  fontSize?: number;
}) {
  const spec = useField();
  const sp = spec.select;
  const hasText = !!text;
  return (
    <View
      testID={`${testID}-box`}
      style={[
        styles.select,
        {
          maxWidth: `${sp.maxWidthPct}%`,
          paddingTop: sp.pad.top,
          paddingRight: sp.pad.right,
          paddingBottom: sp.pad.bottom,
          paddingLeft: sp.pad.left,
        },
        sp.border ? [styles.bordered, { borderColor: sp.border }] : null,
        spec.floating && styles.floatingSelect,
        disabled && { opacity: itemMd.disabledOpacity },
      ]}
    >
      <View style={styles.textWrap}>
        <Text
          testID={`${testID}-text`}
          numberOfLines={1}
          style={textStyle(fontSize ?? sp.fontSize, 400, hasText ? sp.textColor : sp.placeholderColor, fontSize !== undefined ? normalLineHeight(fontSize) : sp.lineHeight)}
        >
          {hasText ? selectedText || text : placeholder}
        </Text>
      </View>
      <View testID={`${testID}-icon`} style={styles.icon}>
        <View
          testID={`${testID}-icon-inner`}
          style={[styles.iconInner, { borderTopColor: sp.arrowColor }]}
        />
      </View>
      {/* button.item-cover: absolute, full size */}
    </View>
  );
}

const styles = StyleSheet.create({
  // ion-select sits at the end of the input-wrapper row; the input (flex: 1) takes the rest
  inlinePress: { flexShrink: 0, maxWidth: '100%' },
  bordered: { borderWidth: 1 },
  // ion-select { display: flex; overflow: hidden }
  select: { flexDirection: 'row', overflow: 'hidden' },
  // .item-label-floating ion-select { align-self: stretch; max-width: 100% }
  floatingSelect: { alignSelf: 'stretch' },
  // .select-text { flex: 1; min-width: 16px; overflow hidden; ellipsis; nowrap }
  // flex:1 inside an auto-width ion-select = its content width, so no grow here
  textWrap: { flexShrink: 1, minWidth: selectMd.textMinWidth, overflow: 'hidden' },
  // .select-md .select-icon { position: relative; width: 12px; height: 19px }
  icon: { width: selectMd.icon.width, height: selectMd.icon.height },
  // .select-icon-inner: left 5px; top 50%; margin-top -3px; triangle 10 x 5
  iconInner: {
    position: 'absolute',
    left: selectMd.iconInner.left,
    top: '50%',
    marginTop: selectMd.iconInner.marginTop,
    width: 0,
    height: 0,
    borderTopWidth: selectMd.iconInner.borderTop,
    borderLeftWidth: selectMd.iconInner.borderSide,
    borderRightWidth: selectMd.iconInner.borderSide,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

IonSelect.ionListMarginAware = true; // IonList passes prevMarginBottom (margin collapsing)
