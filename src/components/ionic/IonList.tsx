// <ion-list>, <ion-list-header>, <ion-item> / <button ion-item> and <ion-label> in md mode
// (components/list/list.md.scss, item/item.js template + item.md.scss, label.md.scss). Values and citations:
// src/theme/ionicMdContent.ts (listMd, itemContentMd, listHeaderMd). IonListHeader is an Item too (item-inner > input-wrapper > ion-label).
//
// Item DOM (item.js:405-420):  [item-start | ion-checkbox] <div.item-inner><div.input-wrapper>[ion-label][ion-input...]</div>
//                              [item-end | ion-radio | ion-toggle]</div> <div.button-effect>
// IonItem takes the label text (`label`) or any content (`children`, laid out in the input-wrapper); a child with a static
// `ionSlot` of 'start' or 'end' (IonCheckbox, IonRadio) goes to that slot, like Ionic's content projection.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Text } from './IonText';
import { ionicColors } from '../../theme';
import { colorContrast, itemContentMd, listHeaderMd, listMd } from '../../theme/ionicMdContent';
import { itemVerticalMargins, type FieldVariant } from './IonField';
import { RippleButton } from './RippleButton';
import { clipSafeLineBox, textStyle } from './text';

// What an ion-radio / ion-checkbox tells its ion-item (radio-button.js:23-29, checkbox via BaseInput): the item gets
// `item-radio` / `item-radio-checked` / `item-*-disabled` classes and the control's `button.item-cover` covers the item.
export interface ItemControl {
  kind: 'radio' | 'checkbox';
  checked: boolean;
  disabled: boolean;
  color?: string;
  press: () => void;
}
interface ItemContextValue {
  register: (c: ItemControl | null) => void;
}
const ItemContext = createContext<ItemContextValue | null>(null);
export const useItemControl = (c: ItemControl) => {
  const ctx = useContext(ItemContext);
  const { kind, checked, disabled, color, press } = c;
  // the item re-renders its (cloned) children whenever the registration changes, so `press` goes through a ref
  // to keep the registration (and therefore the render loop) stable
  const pressRef = useRef(press);
  pressRef.current = press;
  useEffect(() => {
    ctx?.register({ kind, checked, disabled, color, press: () => pressRef.current() });
  }, [ctx, kind, checked, disabled, color]);
  useEffect(() => () => ctx?.register(null), [ctx]);
  return !!ctx;
};

export interface IonListProps {
  noLines?: boolean; // [no-lines] ([CSS] 14851)
  afterList?: boolean; // directly after another ion-list: its header is pulled up 16px ([CSS] 14844)
  style?: StyleProp<ViewStyle>; // class="mb20" etc.
  testID?: string;
  children?: React.ReactNode;
}

// A component that is transparent for the list's DOM children (`<ion-list radio-group>` is ONE element in Ionic: its items are direct
// children of the list; IonRadioGroup is a View here, so the list looks through it) sets static `ionListTransparent`; a component that
// stands for an `.item-block` sets static `ionListItem` (IonItem, IonInputItem) and receives `isLast` / `noLines` props.
type Marked = { ionListTransparent?: boolean; ionListItem?: boolean; ionListMarginAware?: boolean };
const marks = (c: React.ReactNode) => (React.isValidElement(c) ? (c.type as Marked) : undefined);

function countLeaves(children: React.ReactNode): number {
  let n = 0;
  React.Children.toArray(children).forEach(c => {
    if (React.isValidElement(c)) {
      n += marks(c)?.ionListTransparent ? countLeaves((c.props as { children?: React.ReactNode }).children) : 1;
    }
  });
  return n;
}

// ion-list.list-md { margin: -1px 0 16px }; the last `ion-item` loses its inner line ([CSS] 14838)
export function IonList({ noLines, afterList, style, testID = 'ion-list', children }: IonListProps) {
  const total = countLeaves(children);
  let index = 0;
  let prevBottom = 0; // bottom margin of the previous sibling item (adjoining block margins collapse)
  const decorate = (nodes: React.ReactNode): React.ReactNode[] =>
    React.Children.toArray(nodes).map(c => {
      if (!React.isValidElement(c)) {
        return c;
      }
      const m = marks(c);
      if (m?.ionListTransparent) {
        return React.cloneElement(c, undefined, ...decorate((c.props as { children?: React.ReactNode }).children));
      }
      const i = index++;
      let marginProps: { prevMarginBottom?: number } = {};
      const own = itemVerticalMargins((c.props as { variant?: FieldVariant }).variant);
      if (m?.ionListItem || m?.ionListMarginAware) {
        if (i > 0 && own.top > 0) {
          marginProps = { prevMarginBottom: prevBottom };
        }
        prevBottom = own.bottom;
      } else {
        prevBottom = 0;
      }
      if (m?.ionListItem) {
        const props = c.props as { noLines?: boolean };
        // `.list-md > .item-block:last-child`: only when the item really is the last DOM child
        return React.cloneElement(c as React.ReactElement<{ isLast?: boolean; noLines?: boolean }>, {
          isLast: i === total - 1,
          noLines: noLines || props.noLines,
          ...marginProps,
        });
      }
      if (m?.ionListMarginAware && marginProps.prevMarginBottom !== undefined) {
        return React.cloneElement(c as React.ReactElement<{ prevMarginBottom?: number }>, marginProps);
      }
      if (c.type === IonListHeader && afterList) {
        return React.cloneElement(c as React.ReactElement<IonListHeaderProps>, { afterList: true });
      }
      return c;
    });
  return (
    <View testID={testID} style={[styles.list, style]}>
      {decorate(children)}
    </View>
  );
}

export interface IonLabelProps {
  children?: React.ReactNode;
  color?: string; // text colour (item colour by default)
  style?: StyleProp<ViewStyle>; // the <ion-label> box (Topbath: padding-left, margin ...)
  textStyle?: StyleProp<TextStyle>;
  fontSize?: number;
  disabled?: boolean; // .item-*-disabled ion-label { opacity: .3 }
  testID?: string;
}

// ion-label.label-md: margin 13px 8px 13px 0; flex 1; overflow hidden; text nowrap + ellipsis; font-size inherits the item's 16px
const DEVANAGARI = /[\u0900-\u097F]/;

// True when any text in `node` (strings, and the children of elements) is Devanagari.
function hasDevanagari(node: React.ReactNode): boolean {
  return React.Children.toArray(node).some(c =>
    typeof c === 'string'
      ? DEVANAGARI.test(c)
      : React.isValidElement(c)
        ? hasDevanagari((c.props as { children?: React.ReactNode }).children)
        : false,
  );
}

// The clip-safe line box for a single-line Devanagari Text (see IonLabel), or null for other text.
function devanagariLineBox(children: React.ReactNode, style: StyleProp<TextStyle>): TextStyle | null {
  if (!hasDevanagari(children)) {
    return null;
  }
  const flat = StyleSheet.flatten(style) ?? {};
  const fontSize = flat.fontSize ?? 14;
  const box = clipSafeLineBox(fontSize, typeof flat.lineHeight === 'number' ? flat.lineHeight : fontSize);
  return { lineHeight: box.lineHeight, marginVertical: box.marginVertical };
}

export function IonLabel({ children, color, style, textStyle: ts, fontSize = itemContentMd.fontSize, disabled, testID = 'ion-label' }: IonLabelProps) {
  const text = textStyle(fontSize, 400, color ?? itemContentMd.textColor);
  // Devanagari marks rise above the Roboto line box: Chrome draws them (and grows a line-height:normal box for the fallback
  // font), Android clips them. A taller Text box with a negative margin keeps the CSS layout height (clipSafeLineBox), and the
  // label box stops clipping (the label's overflow: hidden cut the taller Text back to 19dp, measured 2026-11-05; the Text's own
  // numberOfLines={1} still ellipsizes). NOTE (parity): Chrome's ion-label overflow:hidden likely clips these marks in Ionic too.
  const clipSafe = typeof children === 'string' ? devanagariLineBox(children, [text, ts]) : null;
  return (
    <View testID={testID} style={[styles.label, disabled && { opacity: itemContentMd.controlDisabledOpacity }, style, clipSafe && styles.labelUnclipped]}>
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text numberOfLines={1} style={[text, ts, clipSafe]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

export interface IonListHeaderProps {
  color?: string; // color="secondary" ([CSS] 14854 .list-header-md-secondary): background = the colour, text = its contrast
  borderHeading?: boolean; // class="border-heading" (Topbath): grey rounded header, bold 16px label and the 22x5 bar (see listHeaderMd)
  afterList?: boolean;
  style?: StyleProp<ViewStyle>; // the <ion-list-header> box (page rules: margin-bottom, border-bottom ...)
  labelStyle?: StyleProp<TextStyle>; // text of bare string children (page rules: font-size, color ...)
  testID?: string;
  // The projected content: a string / number becomes the label's text; any element (<IonParagraph>, a View ...) is laid out as is.
  children?: React.ReactNode;
}

// <p> inside an ion-item / ion-list-header: `.item-md p` = 14px, #666, 400 (margin 0), nowrap + ellipsis inherited from ion-label.
export function IonParagraph({ children, style, testID = 'ion-paragraph' }: { children?: React.ReactNode; style?: StyleProp<TextStyle>; testID?: string }) {
  const base = textStyle(itemContentMd.paragraph.fontSize, 400, itemContentMd.paragraph.color);
  return (
    <Text testID={testID} numberOfLines={1} style={[base, styles.shrink, style, devanagariLineBox(children, [base, style])]}>
      {children}
    </Text>
  );
}

// ion-list-header IS an Ionic Item (item.js selector `ion-list-header, ion-item, ...`), so Ionic renders
//   ion-list-header.item.item-md.list-header.list-header-md  (flex, position relative, overflow hidden, padding-left 16, bg #fff)
//     > div.item-inner (flex 1, min-height 45)  > div.input-wrapper (flex 1)  > ion-label.label-md (margin 13px 8px 13px 0, nowrap, ellipsis)
// around the projected content, which is why Topbath's `.border-heading .item-inner .input-wrapper ion-label` rules and its ::after bar DO
// match (listHeaderMd; measured in the reference build). There is no `item-block` class, so no inner border-bottom.
//   plain:                     label 14px 400 #757575 (inherited from the header), border-top 1px #dedede, margin-bottom 13
//   .border-heading:           bg #f8f8f8, radius 8 8 0 0, no border-top / margin-bottom, label 16px 600 #000 margin-left 15, bar
//   .border-heading + <p>:     the <p> keeps 14px 400 #666 (IonParagraph); the label box (margin-left 15, 17px high) is the same
//   color="secondary":         bg = colour, label = contrast colour, 14px 400
//   mixed children (scan-point total points: text + floated spans): row, the first string grows, the rest sits at the end
export function IonListHeader({ color, borderHeading, afterList, style, labelStyle, testID = 'ion-list-header', children }: IonListHeaderProps) {
  const map = ionicColors as Record<string, string>;
  const base = color ? map[color] : undefined;
  const bh = listHeaderMd.borderHeading;
  const nodes = React.Children.toArray(children);
  const mixed = nodes.some(c => typeof c !== 'string' && typeof c !== 'number');
  const wrap: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: listHeaderMd.minHeight,
    paddingLeft: listHeaderMd.paddingLeft,
    marginBottom: borderHeading ? 0 : listHeaderMd.marginBottom,
    borderTopWidth: borderHeading ? 0 : listHeaderMd.borderTopWidth,
    borderTopColor: listHeaderMd.borderTopColor,
    backgroundColor: base ?? (borderHeading ? bh.background : listHeaderMd.background),
    ...(borderHeading ? { borderTopLeftRadius: bh.radius, borderTopRightRadius: bh.radius } : null),
    ...(afterList ? { marginTop: listMd.adjacentHeaderMarginTop } : null),
    overflow: 'hidden',
  };
  const text = borderHeading
    ? textStyle(bh.label.fontSize, bh.label.fontWeight, bh.label.color)
    : textStyle(listHeaderMd.fontSize, 400, base ? colorContrast(base) : listHeaderMd.color);
  return (
    <View testID={testID} style={[wrap, style]}>
      <View testID={`${testID}-inner`} style={styles.headerInner}>
        <View testID={`${testID}-wrapper`} style={styles.wrapper}>
          <View
            testID={`${testID}-label`}
            style={[styles.label, styles.headerLabel, borderHeading && { marginLeft: bh.label.marginLeft }, hasDevanagari(children) && styles.labelUnclipped]}
          >
            {nodes.map((c, i) =>
              typeof c === 'string' || typeof c === 'number' ? (
                <Text key={i} numberOfLines={1} style={[text, styles.shrink, mixed && styles.grow, labelStyle, devanagariLineBox(c, [text, labelStyle])]}>
                  {c}
                </Text>
              ) : (
                c
              ),
            )}
          </View>
        </View>
      </View>
      {borderHeading ? (
        // .border-heading ... ion-label::after: absolute against the (position: relative) header
        <View
          pointerEvents="none"
          testID={`${testID}-bar`}
          style={{ position: 'absolute', top: bh.bar.top, left: bh.bar.left, width: bh.bar.width, height: bh.bar.height, backgroundColor: bh.bar.color }}
        />
      ) : null}
    </View>
  );
}

export interface IonItemProps {
  label?: string; // the <ion-label> text
  labelStyle?: StyleProp<ViewStyle>;
  labelTextStyle?: StyleProp<TextStyle>;
  button?: boolean; // <button ion-item>: ripple + `activated` background
  onPress?: () => void; // (click); a plain <ion-item> shows no feedback, only a button does ([I] tap-click isActivatable)
  noLines?: boolean; // [no-lines]
  input?: boolean; // `item-input`: the last such item of a list keeps a 1px bottom border ([CSS] 14862)
  isLast?: boolean; // set by IonList (also through an IonRadioGroup)
  disabled?: boolean;
  style?: StyleProp<ViewStyle>; // item classes: padding, margin ...
  innerStyle?: StyleProp<ViewStyle>; // .item-inner
  testID?: string;
  children?: React.ReactNode;
}

export function IonItem({
  label,
  labelStyle,
  labelTextStyle,
  button,
  onPress,
  noLines,
  input,
  isLast,
  disabled,
  style,
  innerStyle,
  testID = 'ion-item',
  children,
}: IonItemProps) {
  const [control, setControl] = useState<ItemControl | null>(null);
  const register = useCallback((c: ItemControl | null) => setControl(c), []);
  const ctx = React.useMemo(() => ({ register }), [register]);

  const start: React.ReactNode[] = [];
  const end: React.ReactNode[] = [];
  const body: React.ReactNode[] = [];
  React.Children.forEach(children, (c, i) => {
    const slot = React.isValidElement(c) ? ((c.props as any).slot ?? (c.type as any).ionSlot) : undefined;
    const keyed = React.isValidElement(c) ? React.cloneElement(c, { key: i }) : c;
    (slot === 'start' ? start : slot === 'end' ? end : body).push(keyed);
  });

  // .item-md.item-block .item-inner { border-bottom: 1px solid #dedede }, none for the last item of a list or [no-lines]
  const lineless = noLines || isLast;
  const item: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: itemContentMd.minHeight,
    paddingLeft: itemContentMd.paddingLeft,
    backgroundColor: itemContentMd.backgroundColor,
    overflow: 'hidden',
    ...(input && isLast && !noLines ? { borderBottomWidth: listMd.borderWidth, borderBottomColor: listMd.borderColor } : null),
  };
  const inner: ViewStyle = {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    overflow: 'hidden',
    minHeight: itemContentMd.minHeight,
    paddingRight: itemContentMd.innerPaddingRight,
    borderBottomWidth: lineless ? 0 : listMd.borderWidth,
    borderBottomColor: listMd.borderColor,
  };
  const checkedColor = control?.checked && control.kind === 'radio' ? (ionicColors as Record<string, string>)[control.color ?? 'primary'] ?? ionicColors.primary : undefined;
  const content = (
    <ItemContext.Provider value={ctx}>
      {start}
      <View testID={`${testID}-inner`} style={[inner, innerStyle]}>
        <View style={styles.wrapper}>
          {label !== undefined ? (
            <IonLabel
              testID={`${testID}-label`}
              style={labelStyle}
              textStyle={labelTextStyle}
              color={checkedColor} // .item-radio-checked.item-md ion-label { color: primary } ([CSS] 15093)
              disabled={control?.disabled}
            >
              {label}
            </IonLabel>
          ) : null}
          {body}
        </View>
        {end}
      </View>
      {control ? (
        // button.item-cover: the radio / checkbox covers the whole item (item.scss .item-cover, [CSS] 14536)
        <Pressable
          testID={`${testID}-cover`}
          accessibilityRole={control.kind}
          accessibilityState={{ checked: control.checked, disabled: control.disabled }}
          disabled={control.disabled}
          onPress={control.press}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </ItemContext.Provider>
  );

  if (button) {
    return (
      <RippleButton
        testID={testID}
        onPress={onPress}
        disabled={disabled}
        style={[item, style]}
        activatedStyle={{ backgroundColor: itemContentMd.activatedBackground }}
      >
        {content}
      </RippleButton>
    );
  }
  if (onPress) {
    return (
      <Pressable testID={testID} onPress={onPress} disabled={disabled} style={[item, style]}>
        {content}
      </Pressable>
    );
  }
  return (
    <View testID={testID} style={[item, style]}>
      {content}
    </View>
  );
}

IonItem.ionListItem = true;

const styles = StyleSheet.create({
  // ion-list.list-md { margin: -1px 0 16px }
  list: { marginTop: listMd.marginTop, marginBottom: listMd.marginBottom },
  // .input-wrapper { display: flex; flex: 1; align-items: inherit; overflow: hidden }
  wrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', overflow: 'hidden' },
  // label.md.scss [CSS] 14768: margin 13px 8px 13px 0; ion-label flex: 1; overflow hidden
  label: {
    flex: 1,
    overflow: 'hidden',
    marginTop: itemContentMd.label.marginTop,
    marginRight: itemContentMd.label.marginRight,
    marginBottom: itemContentMd.label.marginBottom,
    marginLeft: itemContentMd.label.marginLeft,
  },
  labelUnclipped: { overflow: 'visible' }, // Devanagari labels (IonLabel): the marks above the line must not be cut
  // .item-inner of an ion-list-header: flex 1, min-height 45 (no padding, no border: the header has no item-block class)
  headerInner: { flex: 1, flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', overflow: 'hidden', minHeight: listHeaderMd.minHeight },
  // the label's content is a row: projected text + elements share the line
  headerLabel: { flexDirection: 'row', alignItems: 'center' },
  shrink: { flexShrink: 1 },
  grow: { flexGrow: 1 },
});
