// Ionic 3.9.5 md-mode <ion-action-sheet> (components/action-sheet/action-sheet-component.js,
// action-sheet.scss, action-sheet.md.scss) with Topbath's `.action-sheet-wrapper ...` rules
// (variables.scss:4338-4390) that restyle EVERY action sheet in the app.
//
// Layout that results (see src/theme/ionicMdOverlays.ts for the cascade analysis):
//  - the sheet is inset 10px each side, white, 10px top corners; the cancel button is a second group
//    below it with square corners;
//  - action buttons are inline-blocks 99px wide with a 49px left margin, so they wrap two per row;
//  - a button's icon + label row is wider than the 69px content box and is clipped by the button's
//    overflow: hidden, exactly as in the WebView.
import React, { useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { md } from '../../theme/ionicMd';
import {
  actionSheetMd,
  appFontSize,
  overlay,
  topbathActionSheet as tb,
} from '../../theme/ionicMdOverlays';
import {
  finishDismiss,
  requestDismiss,
  type ActionSheetButton,
  type ActionSheetOptions,
  type OverlayEntry,
} from '../../ui/overlays';
import { Backdrop } from './Backdrop';
import { IonIcon, ionIconGlyph } from './IonIcon';
import { RippleButton } from './RippleButton';
import { textStyle } from './text';
import { enterLeave, useOverlayLifecycle } from './useOverlayLifecycle';

// <ion-icon [name]="b.icon">. An unknown name (Topbath uses icon: 'cancel', which is not an Ionicons 3
// name) leaves an empty icon element: width 0 (Topbath `width: inherit` beats the 2.3rem md rule) that
// still has Topbath's `margin: 0 8px 0 0` (variables.scss:4361), so the label sits 8px from the edge.
function SheetIcon({
  name,
  color,
  testID,
}: {
  name: string;
  color: string;
  testID: string;
}) {
  if (ionIconGlyph(name)) {
    return (
      <IonIcon
        testID={testID}
        name={name}
        size={actionSheetMd.icon.fontSize}
        style={[styles.icon, { color }]}
      />
    );
  }
  return <View testID={testID} style={styles.emptyIcon} />;
}

export function ActionSheetCmp({ entry }: { entry: OverlayEntry }) {
  const d: ActionSheetOptions = entry.options;
  const enableBackdropDismiss = d.enableBackdropDismiss ?? true; // action-sheet.js:23
  const { height: windowHeight } = useWindowDimensions();
  const [height, setHeight] = useState(0);
  const enabledRef = React.useRef(false);

  // ionViewDidLoad: normalise, pull the cancel button out
  const all: ActionSheetButton[] = d.buttons.map(b =>
    typeof b === 'string' ? { text: b } : b,
  );
  const cancelButton = all.find(b => b.role === 'cancel');
  const buttons = all.filter(b => b.role !== 'cancel');

  const progress = useOverlayLifecycle(
    {
      enterMs: actionSheetMd.enter.duration,
      leaveMs: actionSheetMd.leave.duration,
      easing: overlay.slideEasing,
    },
    entry.leaving,
    () => {
      enabledRef.current = true;
    },
    () => finishDismiss(entry.id),
  );

  const click = (button: ActionSheetButton) => {
    if (!enabledRef.current) {
      return;
    }
    if (button.handler && button.handler() === false) {
      return;
    }
    requestDismiss(entry.id, undefined, button.role);
  };
  const bdClick = () => {
    if (enabledRef.current && enableBackdropDismiss) {
      if (cancelButton) {
        click(cancelButton);
      } else {
        requestDismiss(entry.id, undefined, 'backdrop');
      }
    }
  };

  const h = height || windowHeight;
  const translateY = progress.interpolate({
    inputRange: [0, 1, 1.001, 2],
    outputRange: [h, 0, 0, h],
  });
  const backdropOpacity = enterLeave(
    progress,
    actionSheetMd.enter.backdropOpacity,
    actionSheetMd.leave.backdropOpacity,
  );

  // `button:nth-child(3)` counts every child of the group: title, sub title, then the buttons
  const leading = (d.title ? 1 : 0) + (d.subTitle ? 1 : 0);
  const iconColor = (index: number) =>
    leading + index + 1 === 3 ? tb.icon.thirdChildColor : tb.icon.color;

  return (
    <View
      testID="action-sheet-root"
      style={StyleSheet.absoluteFill}
      onLayout={e => setHeight(e.nativeEvent.layout.height)}
    >
      <Backdrop opacity={backdropOpacity} onPress={bdClick} />
      <Animated.View
        testID="action-sheet-wrapper"
        pointerEvents="box-none"
        style={[styles.wrapper, { transform: [{ translateY }] }]}
      >
        <View
          testID="action-sheet-container"
          pointerEvents="box-none"
          style={styles.container}
        >
          <View
            testID="action-sheet-group-0"
            style={[
              styles.group,
              styles.groupFirst,
              !cancelButton && styles.groupLast,
            ]}
          >
            <ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
            >
              {!!d.title && (
                <View testID="action-sheet-title" style={styles.title}>
                  <Text
                    testID="action-sheet-title-text"
                    style={[
                      textStyle(
                        tb.title.fontSize,
                        tb.title.fontWeight,
                        tb.title.color,
                      ),
                      styles.titleText,
                    ]}
                  >
                    {d.title}
                  </Text>
                </View>
              )}
              {/* no md rule exists for .action-sheet-sub-title (main.css): a plain div, 14px black, no padding */}
              {!!d.subTitle && (
                <View testID="action-sheet-sub-title">
                  <Text
                    testID="action-sheet-sub-title-text"
                    style={textStyle(appFontSize, 400, md.textColor)}
                  >
                    {d.subTitle}
                  </Text>
                </View>
              )}
              <View style={styles.buttons}>
                {buttons.map((b, i) => (
                  <RippleButton
                    key={i}
                    testID={`action-sheet-button-${i}`}
                    onPress={() => click(b)}
                    style={styles.button}
                  >
                    <View style={styles.buttonInner}>
                      {!!b.icon && (
                        <SheetIcon
                          testID={`action-sheet-button-${i}-icon`}
                          name={b.icon}
                          color={iconColor(i)}
                        />
                      )}
                      <Text
                        testID={`action-sheet-button-${i}-text`}
                        style={[
                          textStyle(
                            tb.button.fontSize,
                            b.role === 'selected'
                              ? actionSheetMd.selectedFontWeight
                              : 400,
                            tb.button.color,
                            tb.button.fontSize,
                          ),
                          styles.noShrink,
                        ]}
                      >
                        {b.text}
                      </Text>
                    </View>
                  </RippleButton>
                ))}
              </View>
            </ScrollView>
          </View>
          {cancelButton && (
            <View
              testID="action-sheet-group-cancel"
              style={[styles.group, styles.groupCancel]}
            >
              <RippleButton
                testID="action-sheet-cancel"
                onPress={() => click(cancelButton)}
                style={styles.cancel}
              >
                <View style={styles.cancelInner}>
                  {!!cancelButton.icon && (
                    <SheetIcon
                      testID="action-sheet-cancel-icon"
                      name={cancelButton.icon}
                      color={tb.icon.color}
                    />
                  )}
                  <Text
                    testID="action-sheet-cancel-text"
                    style={textStyle(
                      tb.cancel.fontSize,
                      tb.cancel.fontWeight,
                      tb.button.color,
                      tb.cancel.fontSize,
                    )}
                  >
                    {cancelButton.text}
                  </Text>
                </View>
              </RippleButton>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // .action-sheet-wrapper: inset 0, margin auto, width 100%, max-width 500px, pointer-events none
  wrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    maxWidth: actionSheetMd.maxWidth,
    alignSelf: 'center',
  },
  // .action-sheet-container { display: flex; flex-flow: column; justify-content: flex-end; height: 100% }
  // + Topbath padding: 0 10px
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingLeft: tb.containerPaddingHorizontal,
    paddingRight: tb.containerPaddingHorizontal,
  },
  // Topbath .action-sheet-group { background: white; border-radius: 10px 10px 0 0 }
  group: {
    backgroundColor: tb.groupBackground,
    borderTopLeftRadius: tb.groupRadiusTop,
    borderTopRightRadius: tb.groupRadiusTop,
    flexShrink: 2,
  },
  // .action-sheet-group:first-child { padding-top: .8rem } / :last-child { padding-bottom: .8rem }
  groupFirst: { paddingTop: actionSheetMd.paddingTop },
  groupLast: { paddingBottom: actionSheetMd.paddingBottom },
  // .action-sheet-group-cancel { border-radius: 0; text-align: center; flex-shrink: 0 } and :last-child padding
  groupCancel: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    alignItems: 'center',
    flexShrink: 0,
    paddingBottom: actionSheetMd.paddingBottom,
    overflow: 'hidden',
  },
  scroll: { flexGrow: 0 },
  title: {
    padding: tb.title.padding,
    borderBottomWidth: 1,
    borderBottomColor: tb.title.borderBottomColor,
  },
  titleText: { textAlign: 'center' },
  // inline-block buttons wrapping inside the group
  buttons: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
  button: {
    width: tb.button.width,
    minHeight: tb.button.minHeight,
    marginLeft: tb.button.marginLeft,
    paddingLeft: tb.button.paddingHorizontal,
    paddingRight: tb.button.paddingHorizontal,
    justifyContent: 'center',
  },
  // .button-inner { display: flex; justify-content: flex-start; align-items: center }. The content is wider
  // than the button, so the row is given room and the button clips it.
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 1000,
  },
  icon: { marginRight: tb.icon.marginRight },
  emptyIcon: { width: 0, marginRight: tb.icon.marginRight },
  noShrink: { flexShrink: 0 },
  // cancel: margin 0 !important, padding 0, width inherit (auto) inside a centred group
  cancel: {
    minHeight: tb.button.minHeight,
    justifyContent: 'center',
    paddingLeft: 0,
    paddingRight: 0,
    marginLeft: 0,
  },
  cancelInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
