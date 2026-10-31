// <ion-list>, <ion-list-header>, <ion-item> / <button ion-item> and <ion-label> in md mode
// (components/list/list.md.scss, item/item.js template + item.md.scss, label.md.scss). Values and citations:
// src/theme/ionicMdContent.ts (listMd, itemContentMd, listHeaderMd).
//
// Item DOM (item.js:405-420):  [item-start | ion-checkbox] <div.item-inner><div.input-wrapper>[ion-label][ion-input...]</div>
//                              [item-end | ion-radio | ion-toggle]</div> <div.button-effect>
// IonItem takes the label text (`label`) or any content (`children`, laid out in the input-wrapper); a child with a static
// `ionSlot` of 'start' or 'end' (IonCheckbox, IonRadio) goes to that slot, like Ionic's content projection.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { ionicColors } from '../../theme';
import { colorContrast, itemContentMd, listHeaderMd, listMd } from '../../theme/ionicMdContent';
import { RippleButton } from './RippleButton';
import { textStyle } from './text';

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
type Marked = { ionListTransparent?: boolean; ionListItem?: boolean };
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
      if (m?.ionListItem) {
        const props = c.props as { noLines?: boolean };
        // `.list-md > .item-block:last-child`: only when the item really is the last DOM child
        return React.cloneElement(c as React.ReactElement<{ isLast?: boolean; noLines?: boolean }>, {
          isLast: i === total - 1,
          noLines: noLines || props.noLines,
        });
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
export function IonLabel({ children, color, style, textStyle: ts, fontSize = itemContentMd.fontSize, disabled, testID = 'ion-label' }: IonLabelProps) {
  const text = textStyle(fontSize, 400, color ?? itemContentMd.textColor);
  return (
    <View testID={testID} style={[styles.label, disabled && { opacity: itemContentMd.controlDisabledOpacity }, style]}>
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text numberOfLines={1} style={[text, ts]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

export interface IonListHeaderProps {
  color?: string; // color="secondary" ([CSS] 14854): background = the colour, text = its contrast
  borderHeading?: boolean; // class="border-heading": only the background / radius rule matches (see listHeaderMd)
  afterList?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  testID?: string;
  children?: React.ReactNode;
}

// ion-list-header (list.md.scss:169-178): `display: flex; align-items: center; justify-content: space-between`. It has no template, so
// its content is projected straight into the flex row: NO ion-label / item-inner / input-wrapper (no label margins, no ellipsis; text
// wraps). That is why Topbath's `.border-heading .item-inner .input-wrapper ion-label` and ::after rules never match (see listHeaderMd).
export function IonListHeader({ color, borderHeading, afterList, style, labelStyle, testID = 'ion-list-header', children }: IonListHeaderProps) {
  const map = ionicColors as Record<string, string>;
  const base = color ? map[color] : undefined;
  const bh = listHeaderMd.borderHeading;
  const textColor = base ? colorContrast(base) : listHeaderMd.color;
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
    backgroundColor: base ?? (borderHeading ? bh.background : undefined),
    ...(borderHeading ? { borderTopLeftRadius: bh.radius, borderTopRightRadius: bh.radius } : null),
    ...(afterList ? { marginTop: listMd.adjacentHeaderMarginTop } : null),
    overflow: 'hidden',
  };
  const text = textStyle(listHeaderMd.fontSize, 400, textColor);
  return (
    <View testID={testID} style={[wrap, style]}>
      {React.Children.toArray(children).map((c, i) =>
        typeof c === 'string' || typeof c === 'number' ? (
          <Text key={i} style={[text, styles.headerText, labelStyle]}>
            {c}
          </Text>
        ) : (
          c
        ),
      )}
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
  headerText: { flexShrink: 1 },
});
