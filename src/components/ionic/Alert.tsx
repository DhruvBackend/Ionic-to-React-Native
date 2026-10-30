// Ionic 3.9.5 md-mode <ion-alert> (components/alert/alert-component.js + alert.scss + alert.md.scss),
// including the Topbath global overrides that reach it (src/theme/ionicMdOverlays.ts for the citations).
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { md } from '../../theme/ionicMd';
import { alertMd, overlay, topbathAlert } from '../../theme/ionicMdOverlays';
import {
  finishDismiss,
  requestDismiss,
  type AlertButton,
  type AlertInput,
  type AlertOptions,
  type OverlayEntry,
} from '../../ui/overlays';
import { Backdrop } from './Backdrop';
import { RippleButton } from './RippleButton';
import { stripHtml } from './html';
import { textStyle } from './text';
import { enterLeave, useOverlayLifecycle } from './useOverlayLifecycle';

// util/dom.js NON_TEXT_INPUT_REGEX
const NON_TEXT_INPUT =
  /^(radio|checkbox|range|file|submit|reset|color|image|button)$/i;

interface Input
  extends Required<
    Pick<
      AlertInput,
      'type' | 'name' | 'placeholder' | 'label' | 'checked' | 'disabled' | 'id'
    >
  > {
  value: unknown;
  handler: ((i: AlertInput) => void) | null;
  min: unknown;
  max: unknown;
}

// alert-component.js ionViewDidLoad: normalise the data
function normaliseInputs(inputs: AlertInput[] = []): Input[] {
  return inputs.map((input, index) => ({
    type: input.type || 'text',
    name: input.name != null ? input.name : index + '',
    placeholder: input.placeholder != null ? input.placeholder : '',
    value: input.value != null ? input.value : '',
    label: input.label as string,
    checked: !!input.checked,
    disabled: !!input.disabled,
    id: input.id != null ? input.id : `alert-input-${index}`,
    handler: input.handler ?? null,
    min: input.min ?? null,
    max: input.max ?? null,
  }));
}

export function AlertCmp({ entry }: { entry: OverlayEntry }) {
  const d: AlertOptions = entry.options;
  // cssClass 'alert-modal' is used by dashboard.ts:196, sales-app/end-checkin.ts:209, travel-add.ts:194 and travel-list.ts:94
  const modal = (d.cssClass ?? '').split(' ').includes('alert-modal');
  const buttons: AlertButton[] = d.buttons.map(b =>
    typeof b === 'string' ? { text: b } : b,
  );
  const enableBackdropDismiss = d.enableBackdropDismiss ?? true; // alert.js:25
  const [inputs, setInputs] = useState<Input[]>(() =>
    normaliseInputs(d.inputs),
  );
  const inputsRef = useRef(inputs);
  inputsRef.current = inputs;
  const [focused, setFocused] = useState<number | null>(null);
  const enabled = useRef(false);

  const inputType = inputs.length ? inputs[0].type : null;
  const hasTextInput =
    inputs.length > 0 && inputs.some(i => !NON_TEXT_INPUT.test(i.type));
  // alert-component.js: keyboardResizes is false by default and the platform is mobile
  const top = hasTextInput;

  const progress = useOverlayLifecycle(
    {
      enterMs: alertMd.enter.duration,
      leaveMs: alertMd.leave.duration,
      easing: overlay.easeInOut,
    },
    entry.leaving,
    () => {
      enabled.current = true;
    },
    () => finishDismiss(entry.id),
  );

  // getValues()
  const getValues = (): unknown => {
    const list = inputsRef.current;
    if (inputType === 'radio') {
      const checked = list.find(i => i.checked);
      return checked ? checked.value : undefined;
    }
    if (inputType === 'checkbox') {
      return list.filter(i => i.checked).map(i => i.value);
    }
    if (list.length === 0) {
      return undefined;
    }
    const values: Record<string, unknown> = {};
    list.forEach(i => {
      values[i.name] = i.value;
    });
    return values;
  };

  const dismiss = (role?: string) =>
    requestDismiss(entry.id, getValues(), role);

  const btnClick = (button: AlertButton) => {
    if (!enabled.current) {
      return;
    }
    let shouldDismiss = true;
    if (button.handler) {
      if (button.handler(getValues()) === false) {
        shouldDismiss = false;
      }
    }
    if (shouldDismiss) {
      dismiss(button.role);
    }
  };

  const rbClick = (index: number) => {
    if (!enabled.current) {
      return;
    }
    const next = inputsRef.current.map((i, n) => ({
      ...i,
      checked: n === index,
    }));
    inputsRef.current = next;
    setInputs(next);
    next[index].handler?.(next[index] as unknown as AlertInput);
  };

  const cbClick = (index: number) => {
    if (!enabled.current) {
      return;
    }
    const next = inputsRef.current.map((i, n) =>
      n === index ? { ...i, checked: !i.checked } : i,
    );
    inputsRef.current = next;
    setInputs(next);
    next[index].handler?.(next[index] as unknown as AlertInput);
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

  const setValue = (index: number, value: string) => {
    const next = inputsRef.current.map((i, n) =>
      n === index ? { ...i, value } : i,
    );
    inputsRef.current = next;
    setInputs(next);
  };

  const title = d.title ? stripHtml(d.title) : '';
  const subTitle = d.subTitle ? stripHtml(d.subTitle) : '';
  const message = d.message ? stripHtml(d.message) : '';
  const vertical = buttons.length > 2; // [ngClass]="{'alert-button-group-vertical': d.buttons.length > 2}"

  const wrapperOpacity = enterLeave(
    progress,
    alertMd.enter.wrapperOpacity,
    alertMd.leave.wrapperOpacity,
  );
  const wrapperScale = enterLeave(
    progress,
    alertMd.enter.wrapperScale,
    alertMd.leave.wrapperScale,
  );
  const backdropOpacity = enterLeave(
    progress,
    alertMd.enter.backdropOpacity,
    alertMd.leave.backdropOpacity,
  );

  const titleSize = topbathAlert.titleFontSize;
  const titleWeight = modal
    ? topbathAlert.modal.titleFontWeight
    : alertMd.titleFontWeight;

  return (
    <View
      testID="alert-root"
      style={[StyleSheet.absoluteFill, styles.root, top && styles.rootTop]}
    >
      <Backdrop opacity={backdropOpacity} onPress={bdClick} />
      <Animated.View
        testID="alert-wrapper"
        style={[
          styles.wrapper,
          { opacity: wrapperOpacity, transform: [{ scale: wrapperScale }] },
        ]}
      >
        <View testID="alert-head" style={styles.head}>
          {!!title && (
            <Text
              testID="alert-title"
              style={[
                textStyle(
                  titleSize,
                  titleWeight,
                  md.textColor,
                  titleSize * 1.2,
                ),
                modal && {
                  letterSpacing: topbathAlert.modal.titleLetterSpacing,
                },
              ]}
            >
              {title}
            </Text>
          )}
          {!!subTitle && (
            <Text
              testID="alert-subtitle"
              style={textStyle(
                alertMd.subTitleFontSize,
                alertMd.subTitleFontWeight,
                md.textColor,
                alertMd.subTitleFontSize * 1.2,
              )}
            >
              {subTitle}
            </Text>
          )}
        </View>

        <ScrollView
          testID="alert-message-box"
          style={styles.messageBox}
          showsVerticalScrollIndicator={false}
        >
          <View
            testID="alert-message-content"
            style={message ? styles.message : styles.messageEmpty}
          >
            {!!message && (
              <Text
                testID="alert-message"
                style={textStyle(
                  alertMd.message.fontSize,
                  400,
                  alertMd.message.color,
                )}
              >
                {message}
              </Text>
            )}
          </View>
        </ScrollView>

        {inputs.length > 0 && inputType === 'radio' && (
          <ScrollView testID="alert-radio-group" style={styles.list}>
            {inputs.map((i, n) => (
              <RippleButton
                key={i.id}
                testID={`alert-radio-${n}`}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: i.checked,
                  disabled: i.disabled,
                }}
                disabled={i.disabled}
                onPress={() => rbClick(n)}
                style={styles.tappable}
              >
                <View
                  testID={`alert-radio-icon-${n}`}
                  style={[
                    styles.radioIcon,
                    {
                      borderColor: i.checked
                        ? alertMd.radio.borderColorOn
                        : alertMd.radio.borderColorOff,
                    },
                  ]}
                >
                  <RadioDot on={i.checked} />
                </View>
                <View testID={`alert-radio-label-${n}`} style={styles.label}>
                  <Text
                    testID={`alert-radio-label-${n}-text`}
                    numberOfLines={1}
                    style={textStyle(
                      appFont,
                      400,
                      i.checked
                        ? alertMd.radio.labelColorChecked
                        : md.textColor,
                    )}
                  >
                    {i.label}
                  </Text>
                </View>
              </RippleButton>
            ))}
          </ScrollView>
        )}

        {inputs.length > 0 && inputType === 'checkbox' && (
          <ScrollView testID="alert-checkbox-group" style={styles.list}>
            {inputs.map((i, n) => (
              <RippleButton
                key={i.id}
                testID={`alert-checkbox-${n}`}
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked: i.checked,
                  disabled: i.disabled,
                }}
                disabled={i.disabled}
                onPress={() => cbClick(n)}
                style={styles.tappable}
              >
                <View
                  testID={`alert-checkbox-icon-${n}`}
                  style={[
                    styles.checkboxIcon,
                    i.checked && {
                      borderColor: alertMd.checkbox.borderColorOn,
                      backgroundColor: alertMd.checkbox.borderColorOn,
                    },
                  ]}
                >
                  {i.checked && <View style={styles.checkboxInner} />}
                </View>
                <View testID={`alert-checkbox-label-${n}`} style={styles.label}>
                  <Text
                    numberOfLines={1}
                    style={textStyle(appFont, 400, md.textColor)}
                  >
                    {i.label}
                  </Text>
                </View>
              </RippleButton>
            ))}
          </ScrollView>
        )}

        {inputs.length > 0 &&
          inputType !== 'radio' &&
          inputType !== 'checkbox' && (
            <View testID="alert-input-group" style={styles.message}>
              {inputs.map((i, n) => (
                <View key={i.id}>
                  <TextInput
                    testID={`alert-input-${n}`}
                    value={String(i.value ?? '')}
                    placeholder={i.placeholder}
                    placeholderTextColor={alertMd.input.placeholderColor}
                    editable={!i.disabled}
                    secureTextEntry={i.type === 'password'}
                    keyboardType={
                      i.type === 'number'
                        ? 'numeric'
                        : i.type === 'tel'
                        ? 'phone-pad'
                        : i.type === 'email'
                        ? 'email-address'
                        : 'default'
                    }
                    onFocus={() => setFocused(n)}
                    onBlur={() => setFocused(f => (f === n ? null : f))}
                    onChangeText={t => setValue(n, t)}
                    style={[styles.input, focused === n && styles.inputFocused]}
                  />
                </View>
              ))}
            </View>
          )}

        <View
          testID="alert-button-group"
          style={[
            styles.buttonGroup,
            vertical && styles.buttonGroupVertical,
            modal && styles.modalGroup,
          ]}
        >
          {buttons.map((b, n) => {
            const btn = (
              <RippleButton
                key={n}
                testID={`alert-button-${n}`}
                onPress={() => btnClick(b)}
                activatedStyle={modal ? undefined : styles.buttonActivated}
                style={[
                  styles.button,
                  modal && styles.modalButton,
                  modal && modalBackground(n),
                ]}
              >
                <View
                  style={[
                    styles.buttonInner,
                    modal && styles.buttonInnerCenter,
                  ]}
                >
                  <Text
                    testID={`alert-button-${n}-text`}
                    style={[
                      textStyle(
                        alertMd.button.fontSize,
                        alertMd.button.fontWeight,
                        modal
                          ? topbathAlert.modal.buttonColor
                          : alertMd.button.color,
                        alertMd.button.lineHeight,
                      ),
                      styles.upper,
                    ]}
                  >
                    {b.text}
                  </Text>
                </View>
              </RippleButton>
            );
            // .alert-modal: width calc(50% - 16px) + margin 8px == a 50% cell with 8px padding
            return modal ? (
              <View key={n} style={styles.modalCell}>
                {btn}
              </View>
            ) : (
              btn
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

const appFont = 14; // ion-app font-size (themes/ionic.theme.default.md.scss:14)

function modalBackground(n: number) {
  if (n === 0) {
    return { backgroundColor: topbathAlert.modal.firstButtonBackground };
  }
  if (n === 1) {
    return { backgroundColor: topbathAlert.modal.secondButtonBackground };
  }
  return undefined;
}

// .alert-radio-inner: scale3d(0) -> scale3d(1), 280 ms cubic-bezier(.4,0,.2,1)
function RadioDot({ on }: { on: boolean }) {
  const scale = useRef(new Animated.Value(on ? 1 : 0)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    Animated.timing(scale, {
      toValue: on ? 1 : 0,
      duration: alertMd.radio.transitionMs,
      easing: Easing.bezier(...alertMd.radio.transitionEasing),
      useNativeDriver: true,
    }).start();
  }, [on, scale]);
  return (
    <Animated.View style={[styles.radioDot, { transform: [{ scale }] }]} />
  );
}

const styles = StyleSheet.create({
  // ion-alert { display: flex; align-items: center; justify-content: center }
  root: { alignItems: 'center', justifyContent: 'center' },
  // ion-alert.alert-top { padding-top: 50px; align-items: flex-start }
  rootTop: { paddingTop: alertMd.topPadding, alignItems: 'flex-start' },
  wrapper: {
    minWidth: alertMd.minWidth,
    maxWidth: alertMd.maxWidth,
    maxHeight: alertMd.maxHeightPct,
    borderRadius: alertMd.borderRadius,
    backgroundColor: alertMd.backgroundColor,
    // box-shadow: 0 16px 20px rgba(0,0,0,.4) (needs Android 9+; older versions draw no shadow)
    boxShadow: [overlay.boxShadow],
  },
  head: {
    paddingTop: alertMd.head.paddingTop,
    paddingRight: alertMd.head.paddingRight,
    paddingBottom: alertMd.head.paddingBottom,
    paddingLeft: alertMd.head.paddingLeft,
  },
  messageBox: { maxHeight: alertMd.message.maxHeight, flexGrow: 0 },
  message: {
    paddingTop: alertMd.message.paddingTop,
    paddingRight: alertMd.message.paddingRight,
    paddingBottom: alertMd.message.paddingBottom,
    paddingLeft: alertMd.message.paddingLeft,
  },
  // .alert-md .alert-message:empty { padding: 0 }
  messageEmpty: { padding: 0 },
  list: {
    maxHeight: alertMd.list.maxHeight,
    flexGrow: 0,
    borderTopWidth: alertMd.list.borderWidth,
    borderBottomWidth: alertMd.list.borderWidth,
    borderColor: alertMd.list.borderColor,
  },
  tappable: {
    flexDirection: 'row',
    minHeight: alertMd.tappable.minHeight,
    width: '100%',
  },
  label: {
    flex: 1,
    overflow: 'hidden',
    paddingVertical: alertMd.label.paddingVertical,
    paddingHorizontal: alertMd.label.paddingHorizontal,
  },
  radioIcon: {
    position: 'relative',
    left: alertMd.radio.left,
    top: 0,
    width: alertMd.radio.size,
    height: alertMd.radio.size,
    borderWidth: alertMd.radio.borderWidth,
    borderRadius: alertMd.radio.size / 2,
  },
  radioDot: {
    position: 'absolute',
    left: alertMd.radio.dotInset,
    top: alertMd.radio.dotInset,
    width: alertMd.radio.dotSize,
    height: alertMd.radio.dotSize,
    borderRadius: alertMd.radio.dotSize / 2,
    backgroundColor: alertMd.radio.borderColorOn,
  },
  checkboxIcon: {
    position: 'relative',
    left: alertMd.checkbox.left,
    top: 0,
    width: alertMd.checkbox.size,
    height: alertMd.checkbox.size,
    borderWidth: alertMd.checkbox.borderWidth,
    borderRadius: alertMd.checkbox.borderRadius,
    borderColor: alertMd.checkbox.borderColorOff,
  },
  checkboxInner: {
    position: 'absolute',
    left: alertMd.checkbox.checkLeft,
    top: alertMd.checkbox.checkTop,
    width: alertMd.checkbox.checkWidth,
    height: alertMd.checkbox.checkHeight,
    borderRightWidth: alertMd.checkbox.checkBorderWidth,
    borderBottomWidth: alertMd.checkbox.checkBorderWidth,
    borderColor: alertMd.checkbox.checkColor,
    transform: [{ rotate: alertMd.checkbox.checkRotate }],
  },
  // .alert-input { padding: 10px 0; border: 0 } + .alert-md .alert-input { border-bottom: 1px solid #dedede }
  // Topbath `input { margin: 0 !important }` removes Ionic's 5px margins.
  input: {
    ...textStyle(appFont, 400, alertMd.input.color),
    height:
      alertMd.input.paddingVertical * 2 + 16 + alertMd.input.borderBottomWidth,
    paddingVertical: alertMd.input.paddingVertical,
    paddingHorizontal: 0,
    borderBottomWidth: alertMd.input.borderBottomWidth,
    borderBottomColor: alertMd.input.borderColor,
  },
  inputFocused: {
    height:
      alertMd.input.paddingVertical * 2 + 16 + alertMd.input.focusedBorderWidth,
    borderBottomWidth: alertMd.input.focusedBorderWidth,
    borderBottomColor: alertMd.input.focusedBorderColor,
  },
  // .alert-md .alert-button-group
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap-reverse',
    justifyContent: 'flex-end',
    paddingTop: alertMd.buttonGroup.paddingTop,
    paddingRight: alertMd.buttonGroup.paddingRight,
    paddingBottom: alertMd.buttonGroup.paddingBottom,
    paddingLeft: alertMd.buttonGroup.paddingLeft,
  },
  buttonGroupVertical: { flexDirection: 'column', flexWrap: 'nowrap' },
  // .alert-modal .alert-button-group { width: 100%; padding: 10px 16px !important }
  modalGroup: {
    width: '100%',
    paddingTop: topbathAlert.modal.groupPadding.vertical,
    paddingBottom: topbathAlert.modal.groupPadding.vertical,
    paddingLeft: topbathAlert.modal.groupPadding.horizontal,
    paddingRight: topbathAlert.modal.groupPadding.horizontal,
  },
  modalCell: { width: '50%', padding: topbathAlert.modal.buttonMargin },
  // .alert-md .alert-button; the 8px margin-right is removed by Topbath `button { margin: 0 !important }`
  button: {
    padding: alertMd.button.padding,
    borderRadius: alertMd.button.borderRadius,
  },
  modalButton: {
    paddingVertical: topbathAlert.modal.buttonPadding.vertical,
    paddingHorizontal: topbathAlert.modal.buttonPadding.horizontal,
  },
  buttonActivated: { backgroundColor: alertMd.button.activatedBackground },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  buttonInnerCenter: { justifyContent: 'center' },
  upper: { textTransform: 'uppercase' },
});
