// The <ion-item> + <ion-label> that wraps ion-select / ion-datetime / ionic-selectable in the Topbath forms
// (md mode). `variant` picks the Topbath class chain that styles the item:
//   'plain'              plain Ionic md item
//   'csSelect' 'csDate'  `.main-field .cs-form ion-list ion-item.cs-select|cs-date` (registration, plumber-add, customeradd ...)
//   'edit'               a plain `ion-item` inside `.edit ion-list` (add-leave, travel-add; the page of `<ion-label floating>`)
//   'editCsSelect' 'editCsNormalSelect' 'editCsSelectable'
//                        `.edit ion-list ion-item.cs-select | cs-normal-select | cs-selectable`
//   'csInput'            `.main-field .cs-form ion-list ion-item.cs-input` ion-input / ion-textarea (part 5A, ionicMdContent.ts inputMd.csInput)
//   'editTextarea'       `.edit ion-list ion-item.cs-textarea1` (part 5A, inputMd.editTextarea)
// `floating` is `<ion-label floating>`. Values and citations: src/theme/ionicMdPickers.ts.
// Other page-level containers (.common_form, .enquiry ...) belong to the screen that uses them: `itemStyle`.
import React, { createContext, useContext } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ionicColors } from '../../theme';
import { inputMd, listMd } from '../../theme/ionicMdContent';
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
  | 'editCsSelectable'
  | 'csInput'
  | 'editTextarea';

export interface FieldSpec {
  variant: FieldVariant;
  floating: boolean;
  select: { maxWidthPct: number; pad: Pad; fontSize: number; textColor: string; placeholderColor: string; lineHeight?: number; arrowColor: string; border?: string };
  datetime: { pad: Pad; fontSize: number; border?: string; height?: number; textPaddingLeft: number; fullWidth: boolean };
  selectable: { pad: Pad; fontSize: number; wrap: boolean; breakAll: boolean; arrowCentred: boolean };
  // ion-input / ion-textarea inside the item (part 5A; values and citations in ionicMdContent.ts inputMd)
  input: { fontSize: number; color: string; pad: Pad; height?: number; widthInset: number };
  textarea: {
    color: string;
    fontSize: number;
    height: number;
    margin: Pad;
    widthInset: number;
    pad: number;
    border?: string;
    containerPad: number;
  };
}

const isEdit = (v: FieldVariant) => v === 'edit' || v === 'editTextarea' || v.startsWith('editCs');

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
  const inset = floating ? inputMd.floatingWidthInset : inputMd.widthInset;
  const input: FieldSpec['input'] = { fontSize: inputMd.fontSize, color: itemMd.textColor, pad: { top: 0, right: 0, bottom: 0, left: 0 }, widthInset: inset };
  const tm = floating ? inputMd.textareaFloatingMargin : inputMd.textareaMargin;
  const textarea: FieldSpec['textarea'] = {
    color: itemMd.textColor,
    fontSize: inputMd.textareaFontSize,
    height: inputMd.textareaHeight,
    margin: { ...tm },
    widthInset: inset,
    pad: 0,
    containerPad: 0,
  };
  if (variant === 'csInput') {
    const c = inputMd.csInput;
    input.fontSize = c.inputFontSize;
    input.pad = { ...c.inputPadding };
    input.widthInset = 0; // width: 100%
    textarea.containerPad = c.textareaPadding; // ion-textarea { padding: 10px 10px !important }
  }
  if (isEdit(variant)) {
    input.fontSize = inputMd.edit.fontSize;
    input.color = inputMd.edit.color;
    input.pad.left = inputMd.edit.paddingLeft;
    input.height = inputMd.edit.height;
  }
  if (variant === 'editTextarea') {
    const t = inputMd.editTextarea;
    textarea.fontSize = t.fontSize;
    textarea.height = t.height;
    textarea.margin = { top: 0, right: 0, bottom: 0, left: 0 }; // margin: 0 !important
    textarea.widthInset = 0; // width: 100%
    textarea.pad = t.padding;
    textarea.border = t.borderColor;
  }
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
  return { variant, floating, select, datetime, selectable, input, textarea };
}

const FieldContext = createContext<FieldSpec>(resolveField('plain', false));
export const useField = () => useContext(FieldContext);

// The vertical margins an `ion-item` of a Topbath variant has: `.main-field .cs-form ion-list ion-item.cs-input | .cs-select { margin: 16px 0 }`,
// `.edit ion-list ion-item.cs-*select { margin-bottom: N }`. Sibling block margins COLLAPSE in CSS (ion-item is a block-level flex
// container in a block ion-list), which Yoga does not do: IonList passes the previous sibling's bottom margin (`prevMarginBottom`).
export function itemVerticalMargins(variant?: FieldVariant): { top: number; bottom: number } {
  switch (variant) {
    case 'csInput':
      return { top: inputMd.csInput.marginVertical, bottom: inputMd.csInput.marginVertical };
    case 'csSelect':
      return { top: csForm.csSelect.marginVertical, bottom: csForm.csSelect.marginVertical };
    case 'editCsSelect':
      return { top: 0, bottom: editForm.csSelect.marginBottom };
    case 'editCsNormalSelect':
      return { top: 0, bottom: editForm.csNormalSelect.marginBottom };
    case 'editCsSelectable':
      return { top: 0, bottom: editForm.csSelectable.marginBottom };
    default:
      return { top: 0, bottom: 0 };
  }
}

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
  // set by IonList (see IonList.tsx): `.list-md > .item-block:last-child .item-inner { border-bottom: 0 }` and [no-lines]
  isLast?: boolean;
  noLines?: boolean;
  prevMarginBottom?: number; // set by IonList: bottom margin of the previous sibling item (margin collapsing)
  // item-input: the last such item keeps a 1px bottom border on the ITEM (`.list-md .item-input:last-child`, [CSS] 14863)
  inputItem?: boolean;
  // floating item: the height of the control below the label; the column wrapper reserves label + this so the item grows to its content
  // (item min-height is only a MIN, and a shrinkable column must not squeeze label / input to fit it)
  contentMinHeight?: number;
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
  isLast,
  noLines,
  prevMarginBottom,
  inputItem,
  contentMinHeight,
  cover,
  testID = 'ion-field',
  children,
}: IonFieldProps) {
  const spec = resolveField(variant, floating);
  const edit = isEdit(variant);
  const mainCs = variant === 'csSelect' || variant === 'csDate';
  const isSelect = variant === 'csSelect';
  const csInput = variant === 'csInput';

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
  if (csInput) {
    // [T] 920-923 min-height 45, padding-left 0, margin 16px 0 (the border is on .item-inner, see below)
    item.minHeight = inputMd.csInput.minHeight;
    item.paddingLeft = inputMd.csInput.paddingLeft;
    item.marginVertical = inputMd.csInput.marginVertical;
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
  if (prevMarginBottom !== undefined && item.marginVertical !== undefined) {
    // adjoining margins collapse to the larger one: this item only adds what exceeds the previous sibling's bottom margin
    const mv = Number(item.marginVertical);
    delete item.marginVertical;
    item.marginTop = Math.max(0, mv - prevMarginBottom);
    item.marginBottom = mv;
  }

  // ---- inner -----------------------------------------------------------------------------------------------
  const inner: Mutable<ViewStyle> = {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    overflow: 'hidden',
    paddingRight: mainCs || csInput ? csForm.innerPaddingRight : edit ? editForm.innerPaddingRight : itemMd.innerPaddingRight,
    // .edit .item-inner { border: none !important }; cs-select: border-bottom 0 !important
    borderBottomWidth: edit ? 0 : isSelect ? csForm.csSelect.innerBorderBottomWidth : itemMd.innerBorderBottomWidth,
    borderBottomColor: itemMd.innerBorderBottomColor,
  };
  // list.md: the last item and [no-lines] items lose the inner line; the !important borders below (cs-select/date, cs-input, edit
  // selects, error) win over it
  const lineless = !!(noLines || isLast);
  if (lineless && !mainCs && !csInput) {
    inner.borderBottomWidth = 0;
  }
  // the underline colours of an item-input move to the item's own border on the last item (input.md.scss [CSS] 14497-14504)
  const lastInput = !!(isLast && inputItem && !noLines);
  if (underline && !mainCs && !edit && !csInput && !lineless) {
    inner.borderBottomColor = underline.color;
  }
  // NOTE (parity): measured on Registration edit (computed style): the last cs-select item with ng-valid + item-input-has-value
  // gets `border-bottom: 1px solid #32db64` on the item itself (its own box border, no inner shadow).
  if (isSelect && isLast && underline) {
    item.borderBottomColor = underline.color;
  }
  if (lastInput) {
    item.borderBottomWidth = listMd.borderWidth;
    // cs-input too: `.main-field ... ion-item.cs-input` sets no border, so `.list-md .item-input.ng-valid.input-has-value:last-child
    // { border-bottom-color: #32db64 }` shows (only the inset box-shadow is switched off by Topbath's `box-shadow: none !important`)
    item.borderBottomColor = underline && !mainCs && !edit ? underline.color : listMd.borderColor;
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
  if (csInput) {
    // [T] 934 .item-inner { border: 1px solid #ccc; border-bottom-color: #ccc !important; box-shadow: none !important }
    inner.borderWidth = inputMd.csInput.borderWidth;
    inner.borderBottomWidth = inputMd.csInput.borderWidth;
    inner.borderColor = inputMd.csInput.borderColor;
    inner.borderBottomColor = inputMd.csInput.borderColor;
  }
  if (error && (mainCs || csInput)) {
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
  let absolute = false;
  if (csInput) {
    // [T] 937-950: the label is `position: absolute` (static position = top of the input-wrapper), padding-left 16, margin-top -15,
    // font-size 14, floating colour #949494, transform-origin 0 80px [M] ci1l / ci2l
    const c = inputMd.csInput;
    fontSize = c.labelFontSize;
    paddingLeft = c.labelPaddingLeft;
    margins = { top: c.labelMarginTop, right: 0, bottom: 0, left: 0 };
    absolute = true;
  }
  if (floating) {
    if (csInput) {
      const c = inputMd.csInput;
      color = c.labelColor;
      transform =
        hasValue || focused
          ? [{ translateY: 0 }, { scale: c.labelScale }] // translate3d(0,0,0) scale(.8) about (0, 80px)
          : [{ translateY: c.labelTranslateY }]; // translate3d(0,27px,0)
    } else if (edit) {
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
      // NOTE (parity): Topbath's global `input{margin:0!important}` removes the 8px top/bottom margins of the floating
      // .text-input-md, so the resting label (13 + 27 = 40px down, 18px tall) overflows the ~49px .input-wrapper, whose
      // `overflow: hidden` cuts off its lower half. Verified by rendering the Ionic markup with the shipped main.css in Chrome
      // (2026-11-01: wrapper h 49, label top 39 h 18, input top 30 h 18). Copied as-is.
      margins = { top: margins.top, right: margins.right, bottom: 0, left: 0 };
      transform = hasValue || focused ? [{ translateY: 0 }, { scale: 0.8 }] : [{ translateY: 27 }];
      if (focused) {
        color = ionicColors.primary;
      }
    }
  }
  if (error && (mainCs || csInput || variant.startsWith('editCs'))) {
    color = csForm.errorBorderColor; // .cs-error / .error ion-label { color: red }
  }
  const labelHeight = lineHeight ?? normalLineHeight(fontSize);
  const labelFlow = label !== undefined && !absolute ? margins.top + labelHeight + margins.bottom : 0;
  const wrapperMin = floating && contentMinHeight !== undefined ? labelFlow + contentMinHeight : undefined;

  return (
    <FieldContext.Provider value={spec}>
      <View testID={testID} style={[item, itemStyle]}>
        <View testID={`${testID}-inner`} style={inner}>
          {underline?.inset && !mainCs && !edit && !csInput && !lineless ? (
            // box-shadow: inset 0 -1px 0 0 <colour>: a second 1px line directly above the border
            <View pointerEvents="none" testID={`${testID}-inset-line`} style={[styles.inset, { backgroundColor: underline.color }]} />
          ) : null}
          <View testID={`${testID}-wrapper`} style={[styles.wrapper, floating && styles.wrapperColumn, wrapperMin !== undefined && { minHeight: wrapperMin }]}>
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
                  absolute && styles.labelAbsolute,
                  transform ? [{ transform }, csInput ? styles.originCsInput : styles.originTopLeft] : null,
                  labelDisabled && { opacity: itemMd.disabledOpacity },
                ]}
              >
                <View style={spanBox ? styles.spanBox : null}>
                  <Text testID={`${testID}-label-text`} numberOfLines={1} style={textStyle(fontSize, 400, color, lineHeight)}>
                    {label}
                    {requiredMark ? (
                      // registration.html: `{{ 'Name' | translate }} <span>*</span>` keeps the space before the star
                      <Text style={{ color: floating && edit ? editForm.floatingLabel.strongColor : csForm.requiredStarColor }}>{floating && edit ? '' : ' '}*</Text>
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
  // [T] 949 `transform-origin: 0 80px` on the cs-input floating label
  originCsInput: { transformOrigin: [0, inputMd.csInput.labelOriginY, 0] as [number, number, number] },
  labelAbsolute: { position: 'absolute', left: 0, top: 0 },
  // .input-wrapper { display: flex; flex: 1; align-items: inherit (center); overflow: hidden }
  wrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', overflow: 'hidden' },
  // .item-label-floating .input-wrapper { flex-direction: column }; children stretch ([CSS] 14752)
  wrapperColumn: { flexDirection: 'column', alignItems: 'stretch' },
  // ion-label { flex: 1; overflow hidden; nowrap }
  label: { flex: 1, overflow: 'hidden' },
  // .item-label-floating ion-label { align-self: stretch; width: auto; max-width: 100% } ([CSS] 14750); the transformed label paints over its sibling
  labelFloating: { alignSelf: 'stretch', zIndex: 1, flexShrink: 0 },
  labelCentered: { justifyContent: 'center' }, // display: flex; align-items: center
  spanBox: {
    alignSelf: 'flex-start',
    backgroundColor: editForm.floatingLabel.spanBackground,
    paddingHorizontal: editForm.floatingLabel.spanPaddingHorizontal,
  },
  inset: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 1 },
});
