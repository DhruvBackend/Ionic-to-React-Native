// The page shown inside the modal by ionic-selectable@3.5.0 (IonicSelectableModalComponent template) and
// ionic-select-searchable@2.10.0 (SelectSearchablePageComponent template; same markup): ion-header with an
// ion-navbar (title + close button) and an ion-toolbar holding the ion-searchbar, an ion-content list of
// `button[ion-item]` rows (icon + text) and an optional ion-footer (Clear / OK). md mode, with Topbath's
// global rules. Values and citations: src/theme/ionicMdPickers.ts (selectableModal).
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';
import {
  clearIconPoints,
  headerShadowPng,
  itemMd,
  searchIconPath,
  selectableModal as M,
} from '../../theme/ionicMdPickers';
import { formatItem, isItemSelected, type SelectableConfig } from '../../ui/selectableModel';
import { IonIcon } from './IonIcon';
import { RippleButton } from './RippleButton';
import { textStyle } from './text';

export interface SelectableModalState {
  title: string;
  items: any[]; // already filtered by the owner (or, with an onSearch observer, the app's own result)
  selectedItems: any[];
  cfg: SelectableConfig;
  canSearch: boolean;
  canClear: boolean;
  confirmButton: boolean; // isMultiple || hasConfirmButton
  isConfirmButtonEnabled: boolean;
  searchPlaceholder: string;
  searchFailText: string;
  clearButtonText: string;
  confirmButtonText: string;
  searchText: string;
}

export interface SelectableModalApi {
  subscribe(l: () => void): () => void;
  get(): SelectableModalState;
  select(item: any): void; // _select
  clear(): void; // _clear
  confirm(): void; // _confirm
  close(): void; // _close (close button)
  search(text: string): void; // searchbar ngModel; the owner debounces ionInput (250 ms)
}

export function SelectableModalPage({ api }: { api: SelectableModalApi }) {
  const s = useSyncExternalStore(api.subscribe, api.get);
  const footerCount = (s.canClear ? 1 : 0) + (s.confirmButton ? 1 : 0);
  return (
    <View testID="selectable-page" style={styles.page}>
      <View testID="selectable-header" style={styles.header}>
        {/* ion-navbar */}
        <View testID="selectable-navbar" style={styles.toolbar}>
          <View style={styles.titleWrap}>
            <Text testID="selectable-title" numberOfLines={1} style={styles.title}>
              {s.title}
            </Text>
          </View>
          {/* ion-buttons start: md order 4, i.e. after the title (right edge) */}
          <Pressable
            testID="selectable-close"
            accessibilityRole="button"
            hitSlop={{ left: 2, right: 2, top: 7, bottom: 6 }}
            onPress={api.close}
            style={styles.closeButton}
          >
            <IonIcon name="md-close" size={M.closeButton.iconSize} color={M.closeButton.iconColor} />
          </Pressable>
        </View>
        {s.canSearch ? <Searchbar api={api} state={s} /> : null}
        <HeaderShadow />
      </View>

      <View testID="selectable-content" style={styles.content}>
        {s.items.length > 0 ? (
          <FlatList
            testID="selectable-list"
            data={s.items}
            keyExtractor={(item, i) => String(s.cfg.itemValueField ? item[s.cfg.itemValueField] ?? i : i)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item, index }) => {
              const selected = isItemSelected(s.cfg, s.selectedItems, item);
              return <Row item={item} index={index} selected={selected} cfg={s.cfg} onPress={() => api.select(item)} />;
            }}
          />
        ) : (
          // <div margin>{{searchFailText}}</div>
          <View testID="selectable-empty" style={styles.message}>
            <Text style={textStyle(M.message.fontSize, 400, itemMd.textColor)}>{s.searchFailText}</Text>
          </View>
        )}
      </View>

      {footerCount > 0 ? (
        <View testID="selectable-footer" style={styles.footer}>
          <FooterShadow />
          <View style={styles.footerRow}>
            {s.canClear ? (
              <View style={styles.col}>
                <FooterButton
                  testID="selectable-clear"
                  text={s.clearButtonText}
                  disabled={s.selectedItems.length === 0}
                  onPress={api.clear}
                />
              </View>
            ) : null}
            {s.confirmButton ? (
              <View style={styles.col}>
                <FooterButton
                  testID="selectable-confirm"
                  text={s.confirmButtonText}
                  disabled={!s.isConfirmButtonEnabled}
                  onPress={api.confirm}
                />
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

// button[ion-item] with `ion-icon[item-left]` + the label text
function Row({
  item,
  index,
  selected,
  cfg,
  onPress,
}: {
  item: any;
  index: number;
  selected: boolean;
  cfg: SelectableConfig;
  onPress: () => void;
}) {
  const L = M.list;
  return (
    <RippleButton
      testID={`selectable-item-${index}`}
      onPress={onPress}
      activatedStyle={styles.rowActivated}
      accessibilityState={{ checked: selected }}
      style={styles.row}
    >
      <IonIcon
        testID={`selectable-item-${index}-icon`}
        name={selected ? 'checkmark-circle' : 'radio-button-off'}
        size={L.iconSize}
        color={selected ? L.selectedIconColor : L.unselectedIconColor}
        style={styles.rowIcon}
      />
      <View style={styles.rowInner}>
        <View style={styles.rowLabel}>
          <Text
            testID={`selectable-item-${index}-text`}
            style={textStyle(L.textFontSize, 400, itemMd.textColor)}
          >
            {formatItem(cfg, item)}
          </Text>
        </View>
      </View>
    </RippleButton>
  );
}

// <ion-searchbar> md inside <ion-toolbar>. Topbath `ion-searchbar { padding: 0 16px !important }`.
function Searchbar({ api, state }: { api: SelectableModalApi; state: SelectableModalState }) {
  const S = M.searchbar;
  const [focused, setFocused] = useState(false);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(clearTimer.current), []);
  const showClear = focused && state.searchText !== '';
  return (
    <View testID="selectable-toolbar" style={styles.toolbar}>
      <View style={[styles.searchbar, { paddingHorizontal: S.paddingHorizontal }]}>
        <View style={styles.searchContainer}>
          <TextInput
            testID="selectable-search"
            value={state.searchText}
            placeholder={state.searchPlaceholder}
            placeholderTextColor={S.placeholderColor}
            onChangeText={api.search}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            style={styles.searchInput}
          />
          <View pointerEvents="none" style={styles.searchIcon}>
            <Svg width={S.icon.bgSize} height={S.icon.bgSize} viewBox="0 0 512 512">
              <Path d={searchIconPath} fill={S.icon.color} />
            </Svg>
          </View>
          {showClear ? (
            <Pressable
              testID="selectable-search-clear"
              // mousedown on Ionic's clear button: clears after four frames (searchbar.js clearInput)
              onPressIn={() => {
                clearTimer.current = setTimeout(() => api.search(''), 16 * 4);
              }}
              style={styles.clearIcon}
            >
              <Svg width={S.clearIcon.size} height={S.clearIcon.size} viewBox="0 0 512 512">
                <Polygon points={clearIconPoints} fill={S.clearIcon.color} />
              </Svg>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function FooterButton({
  text,
  disabled,
  onPress,
  testID,
}: {
  text: string;
  disabled: boolean;
  onPress: () => void;
  testID: string;
}) {
  const B = M.button;
  return (
    <RippleButton
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      rippleColor={B.color}
      style={styles.footerButton}
    >
      <Text style={[textStyle(B.fontSize, B.fontWeight, B.color, B.fontSize), styles.upper]}>{text}</Text>
    </RippleButton>
  );
}

// .header-md::after: the 16x7 px shadow PNG repeated along x, showing rows 2..6 (background-position top -2px)
function HeaderShadow() {
  return (
    <View pointerEvents="none" testID="selectable-header-shadow" style={styles.headerShadow}>
      <Image
        source={{ uri: headerShadowPng }}
        resizeMode="repeat"
        style={styles.shadowImage}
      />
    </View>
  );
}
function FooterShadow() {
  return (
    <View pointerEvents="none" testID="selectable-footer-shadow" style={styles.footerShadow}>
      <Image source={{ uri: headerShadowPng }} resizeMode="repeat" style={styles.shadowImageFooter} />
    </View>
  );
}

const SB = M.searchbar;
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: itemMd.backgroundColor },
  header: { zIndex: 2 },
  // .toolbar-md { padding: 4px; min-height: 56px }, background #f8f8f8
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: M.toolbar.minHeight,
    padding: M.toolbar.padding,
    backgroundColor: M.toolbar.background,
  },
  titleWrap: { flex: 1, minWidth: 0, paddingHorizontal: M.title.paddingHorizontal },
  title: {
    ...textStyle(M.title.fontSize, M.title.fontWeight, M.title.color),
  },
  // .bar-button-md: margin 0 .2rem; padding 0 5px; height 32px; border-radius 2px
  closeButton: {
    marginHorizontal: M.closeButton.marginHorizontal,
    paddingHorizontal: M.closeButton.paddingHorizontal,
    height: M.closeButton.height,
    borderRadius: M.closeButton.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchbar: { flex: 1, minWidth: 0 },
  searchContainer: { width: '100%' },
  searchInput: {
    height: SB.inputPaddingVertical * 2 + SB.inputLineHeight,
    paddingVertical: 0,
    paddingLeft: SB.inputPaddingHorizontal,
    paddingRight: SB.inputPaddingHorizontal,
    borderRadius: SB.inputRadius,
    backgroundColor: SB.inputBackground,
    color: SB.inputColor,
    fontSize: SB.inputFontSize,
    includeFontPadding: false,
    textAlignVertical: 'center',
    boxShadow: [
      { offsetX: 0, offsetY: 2, blurRadius: 2, spreadDistance: 0, color: 'rgba(0, 0, 0, 0.14)' },
      { offsetX: 0, offsetY: 3, blurRadius: 1, spreadDistance: -2, color: 'rgba(0, 0, 0, 0.2)' },
      { offsetX: 0, offsetY: 1, blurRadius: 5, spreadDistance: 0, color: 'rgba(0, 0, 0, 0.12)' },
    ],
  },
  // .searchbar-md .searchbar-search-icon { left: 16px; top: 11px; width/height 21px; background-size 20px }
  searchIcon: { position: 'absolute', left: SB.icon.left, top: SB.icon.top, width: SB.icon.size, height: SB.icon.size },
  // .searchbar-md .searchbar-clear-icon { right: 13px; top: 0; width: 22px; height: 100% }
  clearIcon: {
    position: 'absolute',
    right: SB.clearIcon.right,
    top: 0,
    height: '100%',
    width: SB.clearIcon.size,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerShadow: { position: 'absolute', left: 0, right: 0, bottom: -M.headerShadow.height, height: M.headerShadow.height, overflow: 'hidden' },
  shadowImage: { width: '100%', height: 7, marginTop: -M.headerShadow.offsetY },
  footerShadow: { position: 'absolute', left: 0, right: 0, top: -M.footerShadow.height, height: M.footerShadow.height, overflow: 'hidden' },
  shadowImageFooter: { width: '100%', height: 7 },
  content: { flex: 1, backgroundColor: itemMd.backgroundColor },
  // <div margin>
  message: { margin: M.message.margin },
  // button[ion-item]: padding-left 16; icon [item-left] 24 wide with margin 11 8 10 0; .item-inner margin-left 24
  row: { flexDirection: 'row', alignItems: 'center', minHeight: itemMd.minHeight, paddingLeft: itemMd.paddingLeft, backgroundColor: itemMd.backgroundColor },
  rowActivated: { backgroundColor: itemMd.activatedBackground },
  rowIcon: {
    width: M.list.iconWidth,
    marginTop: M.list.iconMargin.top,
    marginRight: M.list.iconMargin.right,
    marginBottom: M.list.iconMargin.bottom,
    textAlign: 'left',
  },
  rowInner: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginLeft: M.list.innerMarginLeft,
    paddingRight: itemMd.innerPaddingRight,
    borderBottomWidth: itemMd.innerBorderBottomWidth,
    borderBottomColor: itemMd.innerBorderBottomColor,
  },
  rowLabel: {
    marginTop: itemMd.label.marginTop,
    marginRight: itemMd.label.marginRight,
    marginBottom: itemMd.label.marginBottom,
  },
  // ionic-selectable-modal ion-footer ion-toolbar { padding: 5px 16px }
  footer: {
    height: M.footer.height,
    paddingTop: M.footer.paddingTop,
    paddingBottom: M.footer.paddingBottom,
    paddingHorizontal: M.footer.paddingHorizontal,
    backgroundColor: M.toolbar.background,
    justifyContent: 'center',
  },
  footerRow: { flexDirection: 'row' },
  col: { flex: 1, padding: M.footer.colPadding },
  footerButton: {
    height: M.footer.buttonHeight,
    backgroundColor: M.button.background,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: [
      { offsetX: 0, offsetY: 2, blurRadius: 2, spreadDistance: 0, color: 'rgba(0, 0, 0, 0.14)' },
      { offsetX: 0, offsetY: 3, blurRadius: 1, spreadDistance: -2, color: 'rgba(0, 0, 0, 0.2)' },
      { offsetX: 0, offsetY: 1, blurRadius: 5, spreadDistance: 0, color: 'rgba(0, 0, 0, 0.12)' },
    ],
  },
  upper: { textTransform: 'uppercase' },
});
