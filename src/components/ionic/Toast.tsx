// Ionic 3.9.5 md-mode <ion-toast> (components/toast/toast-component.js + toast.scss + toast.md.scss).
// There is no backdrop; the wrapper slides in from the edge (or fades in the middle).
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { overlay, toastMd } from '../../theme/ionicMdOverlays';
import {
  finishDismiss,
  requestDismiss,
  type OverlayEntry,
  type ToastOptions,
} from '../../ui/overlays';
import { RippleButton } from './RippleButton';
import { textStyle } from './text';
import { enterLeave, useOverlayLifecycle } from './useOverlayLifecycle';

const POSITIONS = ['top', 'middle', 'bottom'];

export function ToastCmp({ entry }: { entry: OverlayEntry }) {
  const d: ToastOptions = entry.options;
  // toast.js:28 isValidPosition: anything else becomes 'bottom'
  const position =
    d.position && POSITIONS.includes(d.position) ? d.position : 'bottom';
  const [wrapperHeight, setWrapperHeight] = useState(0);
  const [rootHeight, setRootHeight] = useState(0);
  const enabled = useRef(false);

  const progress = useOverlayLifecycle(
    {
      enterMs: toastMd.slideIn.duration,
      leaveMs: toastMd.slideOut.duration,
      easing: overlay.slideEasing,
    },
    entry.leaving,
    () => undefined,
    () => finishDismiss(entry.id),
  );

  // ngAfterViewInit: auto-dismiss after `duration`, and the close button is enabled
  useEffect(() => {
    enabled.current = true;
    if (!d.duration) {
      return;
    }
    const t = setTimeout(
      () => requestDismiss(entry.id, undefined, 'backdrop'),
      d.duration,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const h = wrapperHeight;
  const translateY =
    position === 'middle'
      ? 0
      : progress.interpolate({
          inputRange: [0, 1, 1.001, 2],
          outputRange: position === 'top' ? [-h, 0, 0, -h] : [h, 0, 0, h],
        });
  // until the wrapper has been measured the slide offset is unknown, so keep it invisible
  const opacity =
    position === 'middle'
      ? enterLeave(progress, toastMd.middleFadeIn, toastMd.middleFadeOut)
      : wrapperHeight === 0
      ? 0
      : 1;
  // toast-transitions.js:70 middle: top = floor(clientHeight / 2 - wrapperHeight / 2)
  // The value is written once, at transition init (an inline `style.top`); it is NOT recomputed when ion-toast later
  // resizes (e.g. when the Android 15 frame `body.android-15 { height: 94% }` applies 2 s after start).
  const middleTopRef = useRef<number | null>(null);
  if (middleTopRef.current === null && rootHeight > 0 && wrapperHeight > 0) {
    middleTopRef.current = Math.floor(rootHeight / 2 - wrapperHeight / 2);
  }
  const middleTop = middleTopRef.current ?? 0;

  return (
    <View
      testID="toast-root"
      pointerEvents="box-none"
      style={StyleSheet.absoluteFill}
      onLayout={e => setRootHeight(e.nativeEvent.layout.height)}
    >
      <Animated.View
        testID="toast-position"
        pointerEvents="box-none"
        style={[
          styles.position,
          position === 'top' && styles.top,
          position === 'bottom' && styles.bottom,
          position === 'middle' && { top: Math.max(middleTop, 0) },
          { opacity, transform: [{ translateY }] },
        ]}
        onLayout={e => setWrapperHeight(e.nativeEvent.layout.height)}
      >
        <View testID="toast-wrapper" style={styles.wrapper}>
          <View style={styles.container}>
            {!!d.message && (
              <View testID="toast-message-box" style={styles.messageBox}>
                <Text
                  testID="toast-message"
                  style={textStyle(
                    toastMd.messageFontSize,
                    400,
                    toastMd.messageColor,
                  )}
                >
                  {d.message}
                </Text>
              </View>
            )}
            {d.showCloseButton && (
              <RippleButton
                testID="toast-close"
                rippleColor={overlay.rippleClearColor}
                activatedStyle={styles.closeActivated}
                onPress={() => {
                  if (enabled.current) {
                    requestDismiss(entry.id, undefined, 'close');
                  }
                }}
                style={styles.close}
              >
                <View style={styles.closeInner}>
                  <Text
                    testID="toast-close-text"
                    style={[
                      textStyle(
                        toastMd.buttonFontSize,
                        // `.button-md { font-weight: 500 }` is on the <button>; the text sits in span.button-inner, which
                        // Topbath's `* { font-weight: 400 }` (main.css) keeps at 400
                        400,
                        toastMd.buttonColor,
                        toastMd.buttonFontSize,
                      ),
                      styles.upper,
                    ]}
                  >
                    {d.closeButtonText || toastMd.defaultCloseText}
                  </Text>
                </View>
              </RippleButton>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { top: 0 },
  bottom: { bottom: 0 },
  // .toast-md .toast-wrapper { left: 0; right: 0; margin: auto; width: 100%; max-width: 700px } is a
  // full-width positioned box centring the max-width wrapper.
  position: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  wrapper: {
    width: '100%',
    maxWidth: toastMd.maxWidth,
    backgroundColor: toastMd.background,
  },
  // .toast-container { display: flex; align-items: center }
  container: { flexDirection: 'row', alignItems: 'center' },
  // .toast-message { flex: 1 } + .toast-md .toast-message padding
  messageBox: {
    flex: 1,
    paddingTop: toastMd.padding.top,
    paddingRight: toastMd.padding.right,
    paddingBottom: toastMd.padding.bottom,
    paddingLeft: toastMd.padding.left,
  },
  // ion-button clear .toast-button: .button-md height 3.6rem, .toast-button padding 19px 16px 17px
  close: {
    height: toastMd.buttonHeight,
    paddingTop: toastMd.padding.top,
    paddingBottom: toastMd.padding.bottom,
    paddingLeft: toastMd.padding.left,
    paddingRight: toastMd.padding.right,
    borderRadius: toastMd.buttonBorderRadius,
  },
  closeActivated: { backgroundColor: toastMd.buttonActivated },
  // .button-inner { display: flex; align-items: center; justify-content: center; height: 100% } inside
  // a content box that is 0px tall (36 - 19 - 17), so the 15px line is centred on the 19px padding edge
  // (a 0-height View would be dropped by Fabric, so the same position is made with a negative margin)
  closeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: toastMd.buttonFontSize,
    marginTop: -toastMd.buttonFontSize / 2,
  },
  upper: { textTransform: 'uppercase' },
});
