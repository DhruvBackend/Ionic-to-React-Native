// <button ion-button> / <a ion-button> in md mode (components/button/button.md.scss, button.js template) with the Topbath
// global rules that reach it. Values and citations: src/theme/ionicMdContent.ts (buttonMd, buttonColors).
//   - `button { margin: 0 !important }` removes the .4rem .2rem margin of a <button>; `<a ion-button>` keeps it ([M] b7)
//   - the label is a span that `* { font-weight: 400 }` keeps at 400 (the button itself is 500)
//   - `[disabled]` = opacity .4, no taps; a tap shows the 80 ms `activated` state and the ripple (RippleButton)
import React from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Text } from './IonText';
import { buttonColors, buttonMd, type ButtonKind } from '../../theme/ionicMdContent';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { IonIcon } from './IonIcon';
import { RippleButton } from './RippleButton';
import { clipSafeLineBox, textStyle } from './text';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export interface IonButtonProps {
  kind?: ButtonKind; // default (solid) | `outline` | `clear`
  color?: string; // color="primary" ... any key of the $colors map; unknown names keep the primary look
  block?: boolean; // [block]: width 100%, no horizontal margin
  full?: boolean; // [full]: width 100%, radius 0 (outline: no left/right border)
  round?: boolean; // [round]
  small?: boolean; // [small]
  large?: boolean; // [large]
  disabled?: boolean; // [disabled]
  as?: 'button' | 'a'; // `<a ion-button>` keeps the md margin and `line-height: normal`
  iconStart?: string; // <ion-icon name> before the text, [icon-start]/[icon-left]
  iconEnd?: string; // after the text, [icon-end]/[icon-right]
  // a plain <ion-icon> after the text WITHOUT [icon-end] (pulmber-customer-detail.html:221-223): no 1.4em / .4em rule, so it takes
  // the button font size; `marginLeft` comes from page classes (e.g. .ml10{margin-left:10px!important}). The text's trailing space collapses.
  iconAfter?: { name: string; size?: number; marginLeft?: number };
  iconOnly?: string; // [icon-only] with a single <ion-icon>
  csBtn?: boolean; // class="cs-btn" (Topbath variables.scss:459)
  reBtn?: boolean; // class="cs-btn re-btn"
  pdfBtn?: boolean; // class="pdf-btn" (page rule, CSS 8442)
  textTransform?: 'uppercase' | 'capitalize' | 'none'; // style="text-transform: capitalize" on 3 pages; default uppercase
  // `.green-color` / `.red-color` / `.reen-color` (buttonMd.*Background). Their `background: ... !important` also beats the
  // `.button-md-<c>.activated` shade, so the pressed button keeps this colour (only the shadow changes).
  background?: string;
  // pressed colour when `background` is set without !important (e.g. `.rupee-btn button{background:green}` loses to `.button-md-primary.activated`): pass the shaded primary
  activatedBackground?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>; // utility classes (mb16, h40 ...) and inline styles on the <button>
  labelStyle?: StyleProp<TextStyle>; // rules on the inner span
  testID?: string;
  children?: React.ReactNode;
}

function renderLabel(children: React.ReactNode, ts: TextStyle) {
  const kids = React.Children.toArray(children);
  return kids.map((c, i) =>
    typeof c === 'string' || typeof c === 'number' ? (
      // `.button{white-space:nowrap;text-overflow:ellipsis}` ([CSS] main.css): a label never wraps. Without this the
      // Hindi "आगे  बढ़ें" wrapped on a real phone and the second word vanished below the 36dp button (2026-11-02).
      <Text key={i} style={ts} numberOfLines={1}>
        {c}
      </Text>
    ) : (
      c
    ),
  );
}

export function IonButton({
  kind = 'solid',
  color,
  block,
  full,
  round,
  small,
  large,
  disabled,
  as = 'button',
  iconStart,
  iconEnd,
  iconAfter,
  iconOnly,
  csBtn,
  reBtn,
  pdfBtn,
  textTransform,
  background,
  activatedBackground,
  onPress,
  style,
  labelStyle,
  testID = 'ion-button',
  children,
}: IonButtonProps) {
  const palette = buttonColors(color);
  const cs = csBtn || reBtn;
  const size = large ? buttonMd.large : small ? buttonMd.small : null;
  const fontSize = pdfBtn ? buttonMd.pdfBtn.fontSize : cs ? buttonMd.csBtn.fontSize : size ? size.fontSize : buttonMd.fontSize;

  // colours: .button-md-<c> (solid), .button-outline-md-<c>, .button-clear-md-<c>
  let bg = kind === 'solid' ? palette.solid.background : 'transparent';
  let fg = kind === 'solid' ? palette.solid.text : kind === 'outline' ? palette.outline.text : palette.clear.text;
  let ripple = kind === 'solid' ? palette.solid.ripple : kind === 'outline' ? palette.outline.ripple : palette.clear.ripple;
  let activatedBg = kind === 'solid' ? palette.solid.activated : kind === 'clear' ? buttonMd.clearActivatedBackground : 'transparent';
  if (cs || pdfBtn) {
    // `.cs-btn { background: primary !important; color: #fff }`, `button.pdf-btn { background: primary; color: #fff }`
    bg = buttonColors('primary').solid.background;
    fg = buttonMd.csBtnText;
    ripple = buttonMd.csBtnText;
    // cs-btn: !important, so the activated shade never shows. pdf-btn: no !important and lower specificity than
    // `.button-md-primary.activated`, so it keeps the normal activated shade.
    activatedBg = cs ? bg : buttonColors('primary').solid.activated;
  }
  if (background) {
    bg = background; // `.green-color { background: ... !important }`: also wins over `.activated`
    activatedBg = activatedBackground ?? bg;
  }

  const iconSize = iconOnly
    ? (small ? buttonMd.small.iconOnlyIconSize : fontSize * buttonMd.iconOnly.scale)
    : fontSize * buttonMd.iconStart.scale;
  const paddingHorizontal = iconOnly
    ? 0 // .button[icon-only] { padding: 0; min-width: .9em }
    : round
    ? buttonMd.round.paddingHorizontal
    : size
    ? size.paddingHorizontal
    : buttonMd.paddingHorizontal;
  const height = reBtn ? buttonMd.csBtn.reHeight : cs ? buttonMd.csBtn.height : size ? size.height : buttonMd.height;
  const stretch = block || full || cs;

  const container: Mutable<ViewStyle> = {
    height,
    backgroundColor: bg,
    // NOTE (parity): .button-round-md is emitted after .button-full-md at equal specificity, so full + round = pill
    borderRadius: round ? buttonMd.round.borderRadius : full ? 0 : buttonMd.borderRadius,
    paddingHorizontal,
    minWidth: iconOnly ? fontSize * buttonMd.iconOnly.minWidthEm : undefined,
    alignItems: 'center',
    justifyContent: 'center',
    // `<button>` is inline-block: it shrinks to its text unless block/full/cs-btn make it 100% wide
    ...(stretch ? { width: '100%' as const } : { alignSelf: 'flex-start' as const }),
    // a.button keeps the md margin; a <button> has none (global `button { margin: 0 !important }`)
    // (.button-block-md / .button-full-md zero the horizontal margin)
    ...(as === 'a'
      ? { marginVertical: buttonMd.marginAnchor.vertical, marginHorizontal: block || full ? 0 : buttonMd.marginAnchor.horizontal }
      : null),
    ...(reBtn ? { marginBottom: buttonMd.csBtn.reMarginBottom } : null),
  };
  if (kind === 'solid') {
    container.boxShadow = buttonMd.shadow; // .button-md box-shadow (clear / outline: none)
  }
  if (kind === 'outline') {
    container.borderColor = palette.outline.border;
    container.borderWidth = buttonMd.outlineBorderWidth;
    if (full) {
      container.borderLeftWidth = 0; // .button-full.button-outline: no side borders ([CSS] 12482)
      container.borderRightWidth = 0;
    }
  }
  const activated: Mutable<ViewStyle> = { backgroundColor: activatedBg };
  if (kind === 'solid') {
    activated.boxShadow = buttonMd.shadowActivated;
  }

  const transform = textTransform ?? (pdfBtn ? buttonMd.pdfBtn.textTransform : buttonMd.textTransform);
  // `.cs-btn span { line-height: 22px }` also for re-btn (its 41px line-height is on the button, not the label)
  const lineHeight = cs
    ? buttonMd.csBtn.lineHeight
    : as === 'a'
    ? normalLineHeight(fontSize)
    : fontSize * buttonMd.lineHeight; // `button { line-height: 1 }`
  const box = clipSafeLineBox(fontSize, lineHeight); // taller Text box so Android does not clip Devanagari marks
  const ts: TextStyle = {
    ...textStyle(fontSize, pdfBtn ? buttonMd.pdfBtn.fontWeight : buttonMd.textWeight, fg, box.lineHeight), // both 400: the span
    marginVertical: box.marginVertical,
    textTransform: transform === 'none' ? undefined : transform,
    letterSpacing: cs ? buttonMd.csBtn.letterSpacing : undefined,
  };

  return (
    <RippleButton
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={[container, style]}
      activatedStyle={activated}
      rippleColor={ripple}
      accessibilityState={{ disabled: !!disabled }}
    >
      <View style={styles.inner}>
        {iconStart ? (
          <IonIcon name={iconStart} size={iconSize} color={fg} style={{ marginRight: iconSize * buttonMd.iconStart.gap }} />
        ) : null}
        {iconOnly ? (
          <IonIcon name={iconOnly} size={iconSize} color={fg} style={{ paddingHorizontal: iconSize * buttonMd.iconOnly.paddingHorizontal }} />
        ) : null}
        {renderLabel(children, { ...ts, ...StyleSheet.flatten(labelStyle) })}
        {iconEnd ? (
          <IonIcon name={iconEnd} size={iconSize} color={fg} style={{ marginLeft: iconSize * buttonMd.iconEnd.gap }} />
        ) : null}
        {iconAfter ? (
          <IonIcon name={iconAfter.name} size={iconAfter.size ?? ts.fontSize} color={fg} style={{ marginLeft: iconAfter.marginLeft ?? 0 }} />
        ) : null}
      </View>
    </RippleButton>
  );
}

const styles = StyleSheet.create({
  // .button-inner { display: flex; flex-flow: row nowrap; align-items: center; justify-content: center } (the 100% size is the button's own)
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
