// The <ion-item> + <ion-label> that wraps ion-select / ion-datetime / ionic-selectable in the Topbath forms
// (md mode). `variant` picks the Topbath class chain that styles the item:
//   'plain'              plain Ionic md item
//   'csSelect' 'csDate'  `.main-field .cs-form ion-list ion-item.cs-select|cs-date` (registration, plumber-add, customeradd ...)
//   'edit'               a plain `ion-item` inside `.edit ion-list` (add-leave, travel-add; the page of `<ion-label floating>`)
//   'editCsSelect' 'editCsNormalSelect' 'editCsSelectable'
//                        `.edit ion-list ion-item.cs-select | cs-normal-select | cs-selectable`
// `floating` is `<ion-label floating>`. Values and citations: src/theme/ionicMdPickers.ts.
// Other page-level containers (.common_form, .enquiry ...) belong to the screen that uses them: `itemStyle`.
import React, { createContext, useContext } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ionicColors } from '../../theme';
import { csForm, datetimeMd, editForm, itemMd, selectableMd, selectMd } from '../../theme/ionicMdPickers';
import { normalLineHeight } from '../../theme/ionicMdOverlays';
import { textStyle } from './text';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type Pad = { top: number; right: number; bottom: number; left: number };

export type FieldVariant =
  | 'plain'
  | 'csSelect'
  | 'csDate'
  | 'edit'
  | 'editCsSelect'
  | 'editCsNormalSelect'
  | 'editCsSelectable';

export interface FieldSpec {
  variant: FieldVariant;
  floating: boolean;
  select: { maxWidthPct: number; pad: Pad; fontSize: number; textColor: string; placeholderColor: string; lineHeight?: number; arrowColor: string; border?: string };
  datetime: { pad: Pad; fontSize: number; border?: string; height?: number; textPaddingLeft: number; fullWidth: boolean };
  selectable: { pad: Pad; fontSize: number; wrap: boolean; breakAll: boolean; arrowCentred: boolean };
}

const isEdit = (v: FieldVariant) => v === 'edit' || v.startsWith('editCs');

export function resolveField(variant: FieldVariant, floating: boolean): FieldSpec {
  const sm = selectMd.padding;
  const select: FieldSpec['select'] = {
    maxWidthPct: selectMd.maxWidthPct,
    pad: { top: sm.top, right: sm.right, bottom: sm.bottom, left: sm.left },
    fontSize: itemMd.fontSize,
    textColor: itemMd.textColor,
    placeholderColor: selectMd.placeholderColor,
    arrowColor: selectMd.iconInner.color,
  };
  const dm = datetimeMd.padding;
  const datetime: FieldSpec['datetime'] = {
    pad: { top: dm.top, right: dm.right, bottom: dm.bottom, left: dm.left },
    fontSize: itemMd.fontSize,
    textPaddingLeft: 0,
    fullWidth: false,
  };
  const sv = selectableMd.value;
  const selectable: FieldSpec['selectable'] = {
    pad: { top: sv.paddingTop, right: 0, bottom: sv.paddingBottom, left: sv.paddingLeft },
    fontSize: itemMd.fontSize,
    wrap: false,
    breakAll: false,
    arrowCentred: false,
  };
  if (variant === 'csSelect') {
    const c = csForm.csSelect;
    select.maxWidthPct = c.selectMaxWidthPct;
    select.pad = { ...c.selectPadding };
    select.fontSize = c.selectTextFontSize;
    select.arrowColor = c.arrowColor;
  }
  if (isEdit(variant)) {
    // [CSS] 7967: `.edit ... ion-select` border 1px #b5b5b5, 13px, padding-left 8 (the 0,2,3 selector beats .select-md and the floating padding-left 0)
    select.border = editForm.select.borderColor;
    select.fontSize = editForm.select.fontSize;
    select.pad.left = editForm.select.paddingLeft;
    // [CSS] 7965-7966
    datetime.border = editForm.datetime.borderColor;
    datetime.height = editForm.datetime.height;
    datetime.fontSize = editForm.datetime.fontSize;
    datetime.textPaddingLeft = editForm.datetime.textPaddingLeft;
  }
  if (floating) {
    // .item-label-floating .select-md: padding top/bottom 8; ion-datetime: padding-left 0, width 100%; ion-select: max-width 100% ([CSS] 14507, 13438, 14753)
    select.pad.top = 8;
    select.pad.bottom = 8;
    select.maxWidthPct = 100;
    if (!isEdit(variant)) {
      select.pad.left = 0;
    }
    datetime.pad.left = 0;
    datetime.fullWidth = true;
    selectable.pad.left = 0;
  }
  if (variant === 'editCsNormalSelect') {
    const n = editForm.csNormalSelect.select;
    select.pad = { ...n.padding };
    select.fontSize = n.textFontSize;
    select.textColor = n.textColor;
    select.placeholderColor = n.textColor; // `color: #000 !important` on .select-text also reaches the placeholder
    select.lineHeight = n.textLineHeight;
    select.border = undefined; // ion-select { border: 0 }
  }
  if (variant === 'editCsSelect' || variant === 'editCsSelectable') {
    const c = variant === 'editCsSelect' ? editForm.csSelect : editForm.csSelectable;
    selectable.pad = { ...c.valuePadding };
    selectable.fontSize = c.valueFontSize;
    selectable.wrap = true;
    selectable.breakAll = variant === 'editCsSelect';
    selectable.arrowCentred = true; // only effective for <select-searchable>, see IonicSelectable's box
  }
  return { variant, floating, select, datetime, selectable };
}

const FieldContext = createContext<FieldSpec>(resolveField('plain', false));
export const useField = () => useContext(FieldContext);

export interface IonFieldProps {
  variant?: FieldVariant;
  floating?: boolean; // <ion-label floating>
  label?: string;
  requiredMark?: boolean; // the red <span>*</span> / <strong>*</strong> drawn after the label text
  error?: boolean; // [ngClass]="{'error': f.submitted && x?.invalid}"
  labelDisabled?: boolean; // .item-select-disabled ion-label / .item-datetime-disabled ion-label (opacity .4)
  hasValue?: boolean; // item-has-value / input-has-value (generic md floating label)
  focused?: boolean;
  underline?: { color: string; inset: boolean } | null; // item-input md underline states (ionic-selectable, plain only)
  itemStyle?: StyleProp<ViewStyle>;
  // button.item-cover: its nearest positioned ancestor is the ion-item (ion-select/datetime are not positioned), so it covers the whole item
  cover?: { onPress: () => void; disabled?: boolean };
  testID?: string;
  children?: React.ReactNode;
}

export function IonField({
  variant = 'plain',
  floating = false,
  label,
  requiredMark,
  error,
  labelDisabled,
  hasValue,
  focused,
  underline,
  itemStyle,
  cover,
  testID = 'ion-field',
  children,
}: IonFieldProps) {
  const spec = resolveField(variant, floating);
  const edit = isEdit(variant);
  const mainCs = variant === 'csSelect' || variant === 'csDate';
  const isSelect = variant === 'csSelect';

  // ---- item ------------------------------------------------------------------------------------------------
  const item: Mutable<ViewStyle> = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: edit ? undefined : itemMd.backgroundColor, // .edit ion-item { background: transparent !important }
    minHeight: itemMd.minHeight,
    paddingLeft: mainCs ? csForm.paddingLeft : edit ? editForm.itemPaddingLeft : itemMd.paddingLeft,
  };
  if (mainCs) {
    item.borderWidth = csForm.border.width;
    item.borderColor = csForm.border.color;
    item.minHeight = undefined;
    item.height = isSelect ? csForm.csSelect.height : csForm.csDate.height;
    if (isSelect) {
      item.marginVertical = csForm.csSelect.marginVertical;
    }
  }
  if (variant === 'editCsSelect') {
    item.minHeight = editForm.csSelect.minHeight;
    item.marginBottom = editForm.csSelect.marginBottom;
  } else if (variant === 'editCsNormalSelect') {
    item.minHeight = editForm.csNormalSelect.minHeight;
    item.height = editForm.csNormalSelect.height;
    item.marginBottom = editForm.csNormalSelect.marginBottom;
  } else if (variant === 'editCsSelectable') {
    item.minHeight = editForm.csSelectable.minHeight;
    item.marginBottom = editForm.csSelectable.marginBottom;
  }

  // ---- inner -----------------------------------------------------------------------------------------------
  const inner: Mutable<ViewStyle> = {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    overflow: 'hidden',
    paddingRight: mainCs ? csForm.innerPaddingRight : edit ? editForm.innerPaddingRight : itemMd.innerPaddingRight,
    // .edit .item-inner { border: none !important }; cs-select: border-bottom 0 !important
    borderBottomWidth: edit ? 0 : isSelect ? csForm.csSelect.innerBorderBottomWidth : itemMd.innerBorderBottomWidth,
    borderBottomColor: itemMd.innerBorderBottomColor,
  };
  if (underline && !mainCs && !edit) {
    inner.borderBottomColor = underline.color;
  }
  const editBorder =
    variant === 'editCsSelect'
      ? editForm.csSelect.innerBorderColor
      : variant === 'editCsNormalSelect'
      ? editForm.csNormalSelect.innerBorderColor
      : variant === 'editCsSelectable'
      ? editForm.csSelectable.innerBorderColor
      : null;
  if (editBorder) {
    inner.borderWidth = 1; // border: solid 1px X !important (all four sides)
    inner.borderBottomWidth = 1;
    inner.borderColor = editBorder;
    inner.borderBottomColor = editBorder;
  }
  if (error && mainCs) {
    inner.borderWidth = 1; // .error .item-inner { border: 1px solid $danger !important }
    inner.borderBottomWidth = 1;
    inner.borderColor = csForm.errorBorderColor;
    inner.borderBottomColor = csForm.errorBorderColor;
  }

  // ---- label -----------------------------------------------------------------------------------------------
  let fontSize: number = itemMd.fontSize;
  let lineHeight: number | undefined;
  let color: string = itemMd.label.color;
  let paddingLeft = 0;
  let margins: { top: number; right: number; bottom: number; left: number } = {
    top: itemMd.label.marginTop,
    right: itemMd.label.marginRight,
    bottom: itemMd.label.marginBottom,
    left: itemMd.label.marginLeft,
  };
  let centered = false;
  let transform: ({ translateY: number } | { scale: number })[] | undefined;
  let spanBox = false;
  if (variant === 'csSelect') {
    fontSize = csForm.csSelect.labelFontSize;
    paddingLeft = csForm.csSelect.labelPaddingLeft;
  } else if (variant === 'csDate') {
    fontSize = csForm.csDate.labelFontSize;
    paddingLeft = csForm.csDate.labelPaddingLeft;
  } else if (variant === 'editCsSelect' || variant === 'editCsNormalSelect') {
    const l = variant === 'editCsSelect' ? editForm.csSelect.label : editForm.csNormalSelect.label;
    fontSize = l.fontSize;
    lineHeight = l.lineHeight;
    paddingLeft = l.paddingLeft;
    margins = { top: 0, right: 0, bottom: 0, left: 0 };
    centered = variant === 'editCsSelect';
  } else if (variant === 'editCsSelectable') {
    const l = editForm.csSelectable.labelSpan; // the <span> inside the label carries the size
    fontSize = l.fontSize;
    lineHeight = l.lineHeight;
    paddingLeft = l.paddingLeft;
    margins = { top: 0, right: 0, bottom: 0, left: 0 };
    centered = true;
  }
  if (floating) {
    if (edit) {
      const f = editForm.floatingLabel;
      fontSize = f.fontSize;
      lineHeight = f.lineHeight;
      color = f.color;
      paddingLeft = f.paddingLeft;
      margins = { top: f.marginTop, right: f.marginRight, bottom: 0, left: 0 };
      transform = [{ translateY: f.translateY }, { scale: f.scale }];
      spanBox = true;
    } else {
      // md: .label-md[floating] translate3d(0, 27px, 0); with a value or focus translate3d(0,0,0) scale(.8); focus colour primary
      margins = { top: margins.top, right: margins.right, bottom: 0, left: 0 };
      transform = hasValue || focused ? [{ translateY: 0 }, { scale: 0.8 }] : [{ translateY: 27 }];
      if (focused) {
        color = ionicColors.primary;
      }
    }
  }
  if (error && (mainCs || variant.startsWith('editCs'))) {
    color = csForm.errorBorderColor; // .cs-error / .error ion-label { color: red }
  }
  const labelHeight = lineHeight ?? normalLineHeight(fontSize);

  return (
    <FieldContext.Provider value={spec}>
      <View testID={testID} style={[item, itemStyle]}>
        <View testID={`${testID}-inner`} style={inner}>
          {underline?.inset && !mainCs && !edit ? (
            // box-shadow: inset 0 -1px 0 0 <colour>: a second 1px line directly above the border
            <View pointerEvents="none" testID={`${testID}-inset-line`} style={[styles.inset, { backgroundColor: underline.color }]} />
          ) : null}
          <View testID={`${testID}-wrapper`} style={[styles.wrapper, floating && styles.wrapperColumn]}>
            {label !== undefined ? (
              <View
                testID={`${testID}-label`}
                style={[
                  floating ? styles.labelFloating : styles.label,
                  {
                    paddingLeft,
                    height: labelHeight, // explicit so Yoga cannot squeeze it when margins overflow a short item
                    marginTop: margins.top,
                    marginRight: margins.right,
                    marginBottom: margins.bottom,
                    marginLeft: margins.left,
                  },
                  centered && styles.labelCentered,
                  transform ? [{ transform }, styles.originTopLeft] : null,
                  labelDisabled && { opacity: itemMd.disabledOpacity },
                ]}
              >
                <View style={spanBox ? styles.spanBox : null}>
                  <Text testID={`${testID}-label-text`} numberOfLines={1} style={textStyle(fontSize, 400, color, lineHeight)}>
                    {label}
                    {requiredMark ? (
                      <Text style={{ color: floating && edit ? editForm.floatingLabel.strongColor : csForm.requiredStarColor }}>*</Text>
                    ) : null}
                  </Text>
                </View>
              </View>
            ) : null}
            {children}
          </View>
        </View>
        {cover ? (
          <Pressable
            testID={`${testID}-cover`}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!cover.disabled }}
            disabled={cover.disabled}
            onPress={cover.onPress}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
      </View>
    </FieldContext.Provider>
  );
}

const styles = StyleSheet.create({
  // .label-md[floating] { transform-origin: left top }
  originTopLeft: { transformOrigin: 'left top' },
  // .input-wrapper { display: flex; flex: 1; align-items: inherit (center); overflow: hidden }
  wrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', overflow: 'hidden' },
  // .item-label-floating .input-wrapper { flex-direction: column }; children stretch ([CSS] 14752)
  wrapperColumn: { flexDirection: 'column', alignItems: 'stretch' },
  // ion-label { flex: 1; overflow hidden; nowrap }
  label: { flex: 1, overflow: 'hidden' },
  // .item-label-floating ion-label { align-self: stretch; width: auto; max-width: 100% } ([CSS] 14750); the transformed label paints over its sibling
  labelFloating: { alignSelf: 'stretch', zIndex: 1 },
  labelCentered: { justifyContent: 'center' }, // display: flex; align-items: center
  spanBox: {
    alignSelf: 'flex-start',
    backgroundColor: editForm.floatingLabel.spanBackground,
    paddingHorizontal: editForm.floatingLabel.spanPaddingHorizontal,
  },
  inset: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 1 },
});
