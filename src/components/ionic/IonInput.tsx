// <ion-input> and <ion-textarea> in md mode (components/input/input.js template + input.scss / input.md.scss) as they sit
// in an <ion-item>. They read the surrounding IonField's variant (plain, csInput, edit, editTextarea ...), so the Topbath class
// chain that styles the item also styles the control. Values and citations: src/theme/ionicMdContent.ts (inputMd) and the
// variants in IonField.tsx. `IonInputItem` is IonField + IonInput with the focus / has-value state Ionic keeps on the item.
//
// NOTE (parity): `[attr.min]`, `[attr.max]` and `[attr.step]` are copied onto the native <input> by Ionic and only constrain
//   a <input type="number"> spinner; 61 of the 251 inputs pass `min` with type text/tel, where it does nothing. Ignored here.
// NOTE (parity): Ionic disables autocomplete and autocorrect for every ion-input (input.js:141-142).
import React, { useState } from 'react';
import { PixelRatio, Platform, StyleSheet, TextInput, View, type KeyboardTypeOptions, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { inputMd } from '../../theme/ionicMdContent';
import { androidLineHeight, normalLineHeight } from '../../theme/ionicMdOverlays';
import { fontFor } from '../../theme/typography';
import { IonField, resolveField, useField, type FieldVariant, type IonFieldProps } from './IonField';

export type IonInputType = 'text' | 'tel' | 'email' | 'number' | 'password';

// <input type=...> on Android: tel -> dial pad, email -> @ keyboard, number -> numeric, password -> masked
const KEYBOARD: Record<IonInputType, KeyboardTypeOptions> = {
  text: 'default',
  tel: 'phone-pad',
  email: 'email-address',
  number: 'numeric',
  password: 'default',
};

export interface IonInputProps {
  value?: string;
  onChangeText?: (text: string) => void; // (ionInput) / ngModel
  onFocus?: () => void; // (ionFocus)
  onBlur?: () => void; // (ionBlur)
  type?: IonInputType; // default text
  maxLength?: number; // maxlength
  placeholder?: string;
  readOnly?: boolean; // [readonly]
  disabled?: boolean; // [disabled]: opacity .4 ([CSS] 14476)
  autoFocus?: boolean;
  error?: boolean; // `.cs-error ion-input { border-color: red }` (.edit pages)
  style?: StyleProp<TextStyle>; // rules on the native <input> (Topbath: text-align ...)
  testID?: string;
}

export function IonInput({
  value,
  onChangeText,
  onFocus,
  onBlur,
  type = 'text',
  maxLength,
  placeholder,
  readOnly,
  disabled,
  autoFocus,
  error,
  style,
  testID = 'ion-input',
}: IonInputProps) {
  const field = useField();
  const f = field.input;
  const pad = f.pad;
  // NOTE (parity): Android needs the device-px line box (androidLineHeight), else a swipe starting on the box never scrolls
  // the page. At most +2px (under 1dp), and inside min-height items (csInput: 45) the item does not grow at all.
  const line = Platform.OS === 'android' ? androidLineHeight(f.fontSize, PixelRatio.get()) : normalLineHeight(f.fontSize);
  const height = f.height ?? line + pad.top + pad.bottom;
  const edit = field.variant === 'edit';
  return (
    <View
      style={[
        styles.box,
        field.floating && [styles.boxColumn, { minHeight: height }],
        // `.edit ... ion-input { border: 1px solid #b5b5b5 (red when .cs-error); height: 35px }` on the element (border-box)
        edit && { borderWidth: inputMd.edit.borderWidth, borderColor: error ? inputMd.editErrorColor : inputMd.edit.borderColor, height: inputMd.edit.height },
        // `.edit ion-input` (the bordered element) spans the item; only the inner <input> is `width: calc(100% - 8px)`
        { marginRight: edit ? 0 : f.widthInset },
        disabled && { opacity: inputMd.disabledOpacity }]}>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        keyboardType={KEYBOARD[type]}
        secureTextEntry={type === 'password'}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor={inputMd.placeholderColor}
        editable={!readOnly && !disabled}
        autoFocus={autoFocus}
        autoCorrect={inputMd.autocorrect}
        autoComplete="off"
        underlineColorAndroid="transparent"
        style={[
          styles.input,
          {
            ...fontFor(400),
            fontSize: f.fontSize,
            color: f.color,
            height,
            paddingTop: pad.top,
            paddingRight: pad.right,
            paddingBottom: pad.bottom,
            paddingLeft: pad.left,
          },
          edit && f.widthInset ? { marginRight: f.widthInset } : null,
          style,
        ]}
      />
    </View>
  );
}

// the <textarea> box: its height plus its margins plus the element's own padding (a floating column child must keep this much)
function textareaMinHeight(f: { height: number; margin: { top: number; bottom: number }; containerPad: number }) {
  return f.margin.top + f.height + f.margin.bottom + 2 * f.containerPad;
}

// the input / textarea box height inside an item (IonField reserves it in a floating item's column, see `contentMinHeight`)
export function inputContentHeight(variant: FieldVariant | undefined, floating: boolean, textarea: boolean) {
  const spec = resolveField(variant ?? 'plain', floating);
  if (textarea) {
    return textareaMinHeight({ ...spec.textarea, containerPad: spec.textarea.containerPad });
  }
  const i = spec.input;
  return i.height ?? normalLineHeight(i.fontSize) + i.pad.top + i.pad.bottom;
}

export interface IonTextareaProps extends Omit<IonInputProps, 'type' | 'maxLength' | 'readOnly'> {
  maxLength?: number;
  readOnly?: boolean;
  error?: boolean; // `.cs-error ion-textarea textarea { border-color: $danger }` (edit pages, variables.scss:9006)
}

export function IonTextarea({
  value,
  onChangeText,
  onFocus,
  onBlur,
  maxLength,
  placeholder,
  readOnly,
  disabled,
  autoFocus,
  error,
  style,
  testID = 'ion-textarea',
}: IonTextareaProps) {
  const field = useField();
  const f = field.textarea;
  // the ion-textarea element carries the cs-input 10px padding; the <textarea> its margins, width calc(100% - inset)
  const borderColor = error ? inputMd.editErrorColor : f.border;
  return (
    <View
      style={[
        styles.box,
        field.floating && [styles.boxColumn, { minHeight: textareaMinHeight(f) }],
        { padding: f.containerPad },
        disabled && { opacity: inputMd.disabledOpacity },
      ]}>
      <TextInput
        testID={testID}
        multiline
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor={inputMd.placeholderColor}
        editable={!readOnly && !disabled}
        autoFocus={autoFocus}
        autoCorrect={inputMd.autocorrect}
        autoComplete="off"
        underlineColorAndroid="transparent"
        textAlignVertical="top"
        style={[
          styles.input,
          {
            ...fontFor(400),
            fontSize: f.fontSize,
            color: f.color,
            height: f.height,
            marginTop: f.margin.top,
            marginBottom: f.margin.bottom,
            marginLeft: f.margin.left,
            marginRight: f.widthInset - f.margin.left, // width: calc(100% - inset) with margin-left: the rest is free space
            padding: f.pad,
            ...(borderColor ? { borderWidth: 1, borderColor } : null),
          },
          style,
        ]}
      />
    </View>
  );
}

// The item-input states of the md underline (input.md.scss / item.md.scss [CSS] 14496-14504), for a plain item:
// focus -> primary, ng-valid + has value -> green, ng-invalid + ng-touched -> red; drawn as the inner border colour plus a
// 1px inset shadow (IonField `underline`). NOTE (parity): on the LAST item of a list the same colours go on the ITEM's own
// bottom border instead and the inner shadow is removed ([CSS] 14497-14504); Topbath's cs-/edit forms switch all of it off.
export function inputUnderline(s: { focused: boolean; hasValue: boolean; valid?: boolean; invalid?: boolean; touched?: boolean }) {
  const u = inputMd.underline;
  if (s.focused) {
    return { color: u.focus, inset: true };
  }
  if (s.valid && s.hasValue) {
    return { color: u.valid, inset: true };
  }
  if (s.invalid && s.touched) {
    return { color: u.invalid, inset: true };
  }
  return null;
}

export interface IonInputItemProps extends Omit<IonFieldProps, 'hasValue' | 'focused' | 'children'>, Omit<IonInputProps, 'style' | 'testID'> {
  textarea?: boolean; // ion-textarea
  validation?: { valid?: boolean; invalid?: boolean; touched?: boolean }; // the ng-* classes copied to the item
  inputStyle?: StyleProp<TextStyle>;
  itemStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

// <ion-item><ion-label floating>..</ion-label><ion-input ...></ion-item>: item-input-has-focus / input-has-value on the item
export function IonInputItem({
  textarea,
  value,
  onChangeText,
  onFocus,
  onBlur,
  type,
  maxLength,
  placeholder,
  readOnly,
  disabled,
  autoFocus,
  validation,
  inputStyle,
  testID = 'ion-input-item',
  error,
  ...field
}: IonInputItemProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = !!value && value.length > 0;
  const plain = (field.variant ?? 'plain') === 'plain';
  const common = {
    value,
    onChangeText,
    placeholder,
    disabled,
    autoFocus,
    style: inputStyle,
    onFocus: () => {
      setFocused(true);
      onFocus?.();
    },
    onBlur: () => {
      setFocused(false);
      onBlur?.();
    },
  };
  return (
    <IonField
      {...field}
      inputItem
      testID={testID}
      error={error}
      hasValue={hasValue}
      focused={focused}
      // NOTE (parity): no `.item-input-disabled ion-label` rule exists in Ionic 3.9.5 (only select / datetime / radio / checkbox / toggle):
      // a disabled <ion-input> dims only its native <input> (`.text-input[disabled] { opacity: .4 }`), never the label.
      contentMinHeight={inputContentHeight(field.variant, !!field.floating, !!textarea)}
      underline={plain || field.variant === 'csInput' ? inputUnderline({ focused, hasValue, ...validation }) : null}
    >
      {textarea ? (
        <IonTextarea {...common} maxLength={maxLength} readOnly={readOnly} error={error} testID={`${testID}-input`} />
      ) : (
        <IonInput {...common} error={error} type={type} maxLength={maxLength} readOnly={readOnly} testID={`${testID}-input`} />
      )}
    </IonField>
  );
}

IonInputItem.ionListItem = true; // IonList passes isLast / noLines (through IonField)

const styles = StyleSheet.create({
  // ion-input, ion-textarea { position: relative; display: block; flex: 1; width: 100% } ([CSS] 14468)
  // (align-items is inherited from the wrapper: centred in a row, stretched in a floating column; the input sits at the top of the box)
  box: { flex: 1 },
  // NOTE (parity): in the floating item's COLUMN wrapper (.item-label-floating .input-wrapper { flex-direction: column }, [CSS] 14752)
  //   CSS `flex: 1` = `1 1 0%`, which resolves against an auto-height container as the content height. RN's flexBasis 0 would
  //   collapse the input to 0 height (the item shrank to one label line), so the column child sizes from its content instead and never shrinks (flexShrink 0 + minHeight).
  boxColumn: { flexGrow: 1, flexShrink: 0, flexBasis: 'auto' }, // + minHeight = the control's height (a min can never be shrunk below)
  input: { includeFontPadding: false },
});
