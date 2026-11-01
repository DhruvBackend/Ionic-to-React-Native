// Ionic 3.9.5 <ion-datetime>, md mode: components/datetime/datetime.js, datetime.scss, datetime.md.scss.
// The closed control shows the value formatted with `displayFormat` (placeholder in #999 when empty); tapping it
// opens the md picker (src/components/ionic/Picker.tsx) with buttons [Cancel, Done].
//
// Usage in Topbath (grep of `<ion-datetime`):
//   displayFormat="DD/MM/YYYY" max={{today_date}}   registration.html:35, plumber-add.html:39, edit-profile.html:33,
//                                                   customeradd.html:41, sales-exec-add-plumber.html:33
//   display-format="MMM DD, YYYY" [min]/min=...     add-leave.html:32,39,50, travel-add.html:16 (placeholder=...)
//   display-format="MMM DD, YYYY"                   sales-app/add-dealer.html:129,134, add-distribution.html:61,66
// The model value is an ISO string: 'YYYY-MM-DD' (convertDataToISO of a date-only picker result).
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { datetimeMd, itemMd } from '../../theme/ionicMdPickers';
import { buildDatetimePicker, validateDatetimePicker, type BuiltPicker } from '../../ui/datetimePicker';
import {
  convertDataToISO,
  renderDateTime,
  updateDate,
  type DateTimeData,
} from '../../ui/datetimeUtil';
import { showPicker } from '../../ui/overlays';
import { IonField, useField, type FieldVariant } from './IonField';
import { textStyle } from './text';

const DEFAULT_FORMAT = 'MMM D, YYYY';

export interface IonDatetimeProps {
  value?: string | null; // ISO 8601 date string, as ngModel holds it
  // (ngModelChange): ISO string after Done (always emitted, even when the date is unchanged: datetime.js _inputShouldChange is always true)
  onChange?: (iso: string) => void;
  onIonChange?: (iso: string) => void; // (ionChange), one tick after Done
  onCancel?: () => void; // (ionCancel)
  displayFormat?: string;
  pickerFormat?: string;
  min?: string | number;
  max?: string | number;
  placeholder?: string;
  doneText?: string;
  cancelText?: string;
  disabled?: boolean;
  label?: string;
  requiredMark?: boolean;
  floating?: boolean; // <ion-label floating>
  variant?: FieldVariant;
  error?: boolean;
  testID?: string;
  itemStyle?: React.ComponentProps<typeof IonField>['itemStyle'];
  prevMarginBottom?: number; // set by IonList (margin collapsing, see IonField itemVerticalMargins)
}

// datetime.js _inputNormalize: updateDate(this._value, val) on the persistent _value object. BaseInput._writeValue ignores
// `undefined` (the previous value stays) and turns null into a fresh default `{}`.
function applyValue(prev: DateTimeData, value: string | null | undefined): DateTimeData {
  if (value === undefined) {
    return prev;
  }
  if (value === null) {
    return {};
  }
  const next: DateTimeData = { ...prev };
  updateDate(next, value);
  return next;
}

function toData(value: string | null | undefined): DateTimeData {
  return applyValue({}, value);
}

export function IonDatetime(props: IonDatetimeProps) {
  const {
    value,
    displayFormat,
    pickerFormat,
    placeholder = '',
    doneText = 'Done',
    cancelText = 'Cancel',
    disabled = false,
    label,
    requiredMark,
    floating = false,
    variant = 'plain',
    error,
    testID = 'ion-datetime',
    itemStyle,
    prevMarginBottom,
  } = props;
  const latest = useRef(props);
  latest.current = props;
  const focused = useRef(false);
  // writeValue: the first defined write only sets _initModel; later ones fire ionChange (datetime._inputShouldChange is always true,
  // so every later write counts even when equal, but a React re-render with the same value is not a write)
  const initModel = useRef(false);
  const lastValue = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (value === undefined || value === lastValue.current) {
      return;
    }
    lastValue.current = value;
    if (initModel.current) {
      props.onIonChange?.(value ?? '');
    } else {
      initModel.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // updateText(): displayFormat || pickerFormat || DEFAULT_FORMAT
  const template = displayFormat || pickerFormat || DEFAULT_FORMAT;
  const dataRef = useRef<DateTimeData>({});
  dataRef.current = applyValue(dataRef.current, value);
  const data = dataRef.current;
  const text = renderDateTime(template, Object.keys(data).length ? data : null, {});

  const open = () => {
    if (focused.current || disabled) {
      return;
    }
    const p = latest.current;
    let built: BuiltPicker;
    try {
      built = buildDatetimePicker({
        displayFormat: p.displayFormat,
        pickerFormat: p.pickerFormat,
        min: p.min,
        max: p.max,
        value: p.value,
      });
    } catch {
      // NOTE (parity): Ionic's generate() throws a TypeError for min="" / max="" (calcMinMax reads .year of parseDate('') = null)
      // before _fireFocus(), so the picker never opens and the next tap tries again. add-leave.html:39 binds min="{{data.leave_start_date}}".
      // RN opens nothing, keeps the field unfocused and does not crash.
      return;
    }
    focused.current = true;
    showPicker({
      columns: built.columns,
      buttons: [
        { text: cancelText, role: 'cancel', handler: () => p.onCancel?.() },
        {
          text: doneText,
          handler: selected => {
            // this.value = data -> updateDate(this._value, data); ngModel gets convertDataToISO(value)
            const next = toData(p.value);
            updateDate(next, selected);
            const iso = convertDataToISO(next);
            lastValue.current = iso;
            p.onChange?.(iso);
            setTimeout(() => p.onIonChange?.(iso), 0);
          },
        },
      ],
      // picker.ionChange.subscribe: validate(); picker.refresh() (the refresh is done by the Picker)
      onChange: () => validateDatetimePicker(built),
      onDidDismiss: () => {
        focused.current = false;
      },
    });
  };

  return (
    <IonField
      variant={variant}
      floating={floating}
      label={label}
      requiredMark={requiredMark}
      error={error}
      hasValue={!!text}
      labelDisabled={disabled}
      testID={testID}
      itemStyle={itemStyle}
      prevMarginBottom={prevMarginBottom}
      cover={{ onPress: open, disabled }}
    >
      <DatetimeBox text={text} placeholder={placeholder} disabled={disabled} testID={testID} />
    </IonField>
  );
}

function DatetimeBox({
  text,
  placeholder,
  disabled,
  testID,
}: {
  text: string;
  placeholder: string;
  disabled: boolean;
  testID: string;
}) {
  const sp = useField().datetime;
  const pad = sp.pad;
  return (
    <View
      testID={`${testID}-box`}
      style={[
        styles.datetime,
        { paddingTop: pad.top, paddingRight: pad.right, paddingBottom: pad.bottom, paddingLeft: pad.left },
        sp.border ? [styles.bordered, { borderColor: sp.border }] : null,
        sp.height ? { height: sp.height } : null,
        sp.fullWidth ? styles.fullWidth : null,
        disabled && { opacity: datetimeMd.disabledOpacity },
      ]}
    >
      <View style={[styles.textWrap, { minHeight: sp.fontSize * datetimeMd.textLineHeight }, sp.textPaddingLeft ? { paddingLeft: sp.textPaddingLeft } : null]}>
        <Text
          testID={`${testID}-text`}
          numberOfLines={1}
          style={textStyle(
            sp.fontSize,
            400,
            text ? itemMd.textColor : datetimeMd.placeholderColor,
            sp.fontSize * datetimeMd.textLineHeight,
          )}
        >
          {text || placeholder}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bordered: { borderWidth: 1 },
  fullWidth: { width: '100%' },
  // ion-datetime { display: flex; overflow: hidden }
  datetime: { flexDirection: 'row', overflow: 'hidden' },
  // .datetime-text { flex: 1; min-width: 16px; min-height: 1.2em; line-height: 1.2 }
  textWrap: { flexShrink: 1, minWidth: datetimeMd.textMinWidth, overflow: 'hidden' },
});

IonDatetime.ionListMarginAware = true; // IonList passes prevMarginBottom (margin collapsing)
