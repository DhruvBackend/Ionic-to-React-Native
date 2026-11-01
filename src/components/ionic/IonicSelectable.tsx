// ionic-selectable@3.5.0 (the version package-lock.json installs for the Topbath app), md mode: the closed
// `<ionic-selectable item-content>` inside an <ion-item>, and the modal page it opens (SelectableModalPage).
// Component logic is a port of esm2015/ionic-selectable.min.js IonicSelectableComponent; the pure parts live in
// src/ui/selectableModel.ts.
//
// Usage in Topbath (grep of `<ionic-selectable`; options used: items, itemValueField, itemTextField, canSearch,
// canClear, hasVirtualScroll, isEnabled / disabled, (onChange), (onSearch), [(ngModel)], formControlName):
//   login-section/registration/registration.html:243   canClear, isEnabled, hasVirtualScroll
//   sales-point-transfer/sales-point-transfer.html:31   hasVirtualScroll
//   quotation-genrate-by-pdf/quotation-genrate-by-pdf.html:65   (onSearch) server search
//   add-order.html:42,52,58,63  dealer-addorder.html:14,21  executive-edit.html:45,62,79  (SFA, behind features.sfa)
//   sales-app/add-checkin, add-dealer, edit-network  (SFA)
// Not ported (never used in src/pages): groups, multiple/confirm button templates, add/save/delete item,
// infinite scroll, the template directives, searchFocus. `hasVirtualScroll` has no visual effect.
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { itemMd, selectableMd, selectableModal } from '../../theme/ionicMdPickers';
import { showModal, type ModalHandle } from '../../ui/overlays';
import {
  filterItems,
  formatValueItem,
  hasValue as modelHasValue,
  initialSelectedItems,
  getItemValue,
  getStoredItemValue,
  isItemSelected,
  isNullOrWhiteSpace,
  valueItems,
  type SelectableConfig,
} from '../../ui/selectableModel';
import { IonField, useField, type FieldVariant } from './IonField';
import { SelectableModalPage, type SelectableModalApi, type SelectableModalState } from './SelectableModalPage';
import { textStyle } from './text';

export interface IonicSelectableProps<T = any> {
  items: T[];
  value?: T | T[] | null;
  // [(ngModel)] / (onChange): called with the new value on a selection or on Clear
  onChange?: (value: T | T[] | null, event: { value: T | T[] | null }) => void;
  onSearch?: (event: { text: string }) => void; // (onSearch): when set, filtering is delegated to the app
  onOpen?: () => void;
  onClose?: () => void;
  onClear?: () => void;
  itemValueField?: string | null;
  itemTextField?: string | null;
  canSearch?: boolean;
  canClear?: boolean;
  hasVirtualScroll?: boolean;
  isMultiple?: boolean;
  hasConfirmButton?: boolean;
  isConfirmButtonEnabled?: boolean;
  shouldStoreItemValue?: boolean;
  searchPlaceholder?: string;
  searchFailText?: string;
  clearButtonText?: string;
  confirmButtonText?: string;
  searchDebounce?: number;
  placeholder?: string | null;
  isEnabled?: boolean; // [isEnabled]
  disabled?: boolean; // the `disabled` attribute (NgModel -> setDisabledState)
  // the sibling <ion-label> text; also the modal title (_getLabelText)
  label?: string; // the text drawn in the <ion-label>
  // the label's textContent (`_getLabelText()`): the modal title, e.g. "Select plumber*" or "State *" (star and spacing exactly as
  // Ionic's textContent has them). Defaults to `label`.
  labelText?: string;
  title?: string; // overrides the title
  requiredMark?: boolean; // draws the red star after `label`
  floating?: boolean; // <ion-label floating>
  required?: boolean; // Validators.required on the control: ng-invalid while empty
  variant?: FieldVariant;
  error?: boolean;
  testID?: string;
  itemStyle?: React.ComponentProps<typeof IonField>['itemStyle'];
  // internal: which package's CSS class names / template this is (identical visuals)
  library?: 'ionic-selectable' | 'select-searchable';
}

function sameItems(a: any[], b: any[]) {
  return a === b || (a.length === b.length && a.every((x, i) => x === b[i]));
}

// imperative API used by add-order.ts:583,723,760,797 (`this.selectComponent.open()` / `categorySelectable.open()`)
export interface SelectableHandle {
  open(): void;
  close(): void;
  // Types into the modal searchbar (dev parity states only: the `_components.selectable-search` state; nothing in the app calls it).
  search(text: string): void;
}

function IonicSelectableInner<T = any>(props: IonicSelectableProps<T>, ref: React.Ref<SelectableHandle>) {
  const {
    items,
    value,
    isMultiple = false,
    isEnabled = true,
    disabled = false,
    placeholder = null,
    label,
    requiredMark,
    floating = false,
    required,
    variant = 'plain',
    error,
    testID = 'ionic-selectable',
    itemStyle,
  } = props;
  const enabled = isEnabled && !disabled;
  const cfg: SelectableConfig = useMemo(
    () => ({
      itemValueField: props.itemValueField,
      itemTextField: props.itemTextField,
      shouldStoreItemValue: props.shouldStoreItemValue,
      isMultiple,
    }),
    [props.itemValueField, props.itemTextField, props.shouldStoreItemValue, isMultiple],
  );

  const latest = useRef(props);
  latest.current = props;
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  // mutable component state (the fields of IonicSelectableComponent)
  const st = useRef({
    opened: false,
    touched: false,
    focused: false,
    searchText: '',
    selectedItems: [] as any[],
    modal: null as ModalHandle | null,
    closing: false,
    searchTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    filtered: null as any[] | null,
    prevItems: items,
    listeners: new Set<() => void>(),
    snapshot: null as SelectableModalState | null,
  }).current;
  const [, force] = React.useReducer((n: number) => n + 1, 0);

  const hasOnSearch = () => latest.current.onSearch !== undefined; // _hasOnSearch (isOnSearchEnabled defaults to true)

  const computeState = (): SelectableModalState => {
    const p = latest.current;
    const c = cfgRef.current;
    const all = p.items ?? [];
    const list = st.filtered ?? all;
    const confirmButton = !!(p.isMultiple || p.hasConfirmButton);
    return {
      title: p.title ?? p.labelText ?? p.label ?? '',
      items: list,
      selectedItems: st.selectedItems,
      cfg: c,
      canSearch: !!p.canSearch,
      canClear: !!p.canClear,
      confirmButton,
      isConfirmButtonEnabled: p.isConfirmButtonEnabled ?? true,
      searchPlaceholder: p.searchPlaceholder ?? selectableModal.searchPlaceholder,
      searchFailText: p.searchFailText ?? selectableModal.searchFailText,
      clearButtonText: p.clearButtonText ?? selectableModal.clearButtonText,
      confirmButtonText: p.confirmButtonText ?? selectableModal.confirmButtonText,
      searchText: st.searchText,
    };
  };
  const publish = () => {
    st.snapshot = computeState();
    st.listeners.forEach(l => l());
  };

  // _filterItems()
  const filterNow = () => {
    const p = latest.current;
    if (hasOnSearch()) {
      if (p.canSearch) {
        p.onSearch!({ text: st.searchText }); // _emitSearch
      }
      st.filtered = null;
    } else {
      st.filtered = filterItems(cfgRef.current, p.items ?? [], st.searchText);
    }
    publish();
  };

  const emitValueChange = (v: any) => {
    latest.current.onChange?.(v, { value: v });
    force();
  };

  // close(): propagateOnTouched, modal.dismiss(); onClose is emitted once the dismiss promise has resolved (after the leave
  // transition), see the onDidDismiss of showModal below
  const closeInternal = () => {
    st.touched = true;
    st.opened = false;
    st.closing = true;
    st.modal?.dismiss();
    st.modal = null;
    st.focused = false;
    force();
  };

  const api = useRef<SelectableModalApi>({
    subscribe: l => {
      st.listeners.add(l);
      return () => st.listeners.delete(l);
    },
    get: () => st.snapshot ?? (st.snapshot = computeState()),
    select: item => {
      const p = latest.current;
      const c = cfgRef.current;
      const was = isItemSelected(c, st.selectedItems, item);
      if (p.isMultiple) {
        st.selectedItems = was
          ? st.selectedItems.filter(s => getItemValue(c, item) !== getStoredItemValue(c, s))
          : [...st.selectedItems, item];
        publish();
        return;
      }
      if (p.hasConfirmButton) {
        st.selectedItems = was ? [] : [item];
        publish();
        return;
      }
      if (!was) {
        st.selectedItems = [item];
        const v = c.shouldStoreItemValue && c.itemValueField ? getItemValue(c, item) : item;
        emitValueChange(v);
      }
      // _close(): blur the searchbar, then close in the next tick and clear the search text unless onSearch
      setTimeout(() => {
        closeInternal();
        if (!hasOnSearch()) {
          st.searchText = '';
        }
      });
    },
    clear: () => {
      // _clear(): clear(), _emitValueChange() (onChange), _emitOnClear(), close()
      const p = latest.current;
      emitValueChange(p.isMultiple ? [] : null);
      p.onClear?.();
      closeInternal();
    },
    confirm: () => {
      const p = latest.current;
      if (p.isMultiple) {
        emitValueChange(st.selectedItems);
      } else if (p.hasConfirmButton) {
        emitValueChange(st.selectedItems[0] || null);
      }
      setTimeout(() => {
        closeInternal();
        if (!hasOnSearch()) {
          st.searchText = '';
        }
      });
    },
    close: () => {
      setTimeout(() => {
        closeInternal();
        if (!hasOnSearch()) {
          st.searchText = '';
        }
      });
    },
    search: text => {
      st.searchText = text;
      publish();
      clearTimeout(st.searchTimer);
      st.searchTimer = setTimeout(filterNow, latest.current.searchDebounce ?? selectableModal.searchbar.debounceMs);
    },
  }).current;

  // ngDoCheck: new items -> _setItems(): the list shows ALL items again (even with search text)
  useEffect(() => {
    if (!sameItems(st.prevItems, items ?? [])) {
      st.prevItems = items ?? [];
      st.filtered = null;
      if (st.opened) {
        publish();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);
  useEffect(() => {
    if (st.opened) {
      publish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.title, props.label, props.canSearch, props.canClear, props.searchFailText]);
  useEffect(() => () => clearTimeout(st.searchTimer), [st]);

  // _click -> open()
  const open = () => {
    if (!enabled || st.opened) {
      return;
    }
    st.opened = true;
    st.closing = false;
    st.focused = true;
    st.selectedItems = initialSelectedItems(cfgRef.current, latest.current.value);
    filterNow(); // open(): this._filterItems()
    st.modal = showModal({
      render: () => <SelectableModalPage api={api} />,
      onWillDismiss: () => {
        st.focused = false;
        force();
      },
      onDidDismiss: () => {
        st.opened = false;
        if (st.closing) {
          st.closing = false;
          latest.current.onClose?.();
        }
        force();
      },
    });
    force();
    setTimeout(() => latest.current.onOpen?.(), 280); // modal.present() resolves after the enter transition
  };

  useImperativeHandle(ref, () => ({
    open: () => open(),
    search: text => api.search(text),
    close: () => {
      if (st.opened) {
        closeInternal();
        if (!hasOnSearch()) {
          st.searchText = '';
        }
      }
    },
  }));

  const has = modelHasValue(cfg, value);
  // _setHasPlaceholder: !(hasValue() || (isNullOrWhiteSpace(placeholder) && !placeholderTemplate))
  const hasPlaceholder = !(has || isNullOrWhiteSpace(placeholder));
  const invalid = !!required && !has;
  let underline: { color: string; inset: boolean } | null = null;
  if (variant === 'plain') {
    if (st.focused) {
      underline = { color: selectableMd.underline.focus, inset: true };
    } else if (!invalid && has) {
      underline = { color: selectableMd.underline.valid, inset: true };
    } else if (invalid && st.touched) {
      underline = { color: selectableMd.underline.invalid, inset: true };
    }
  }

  const valueTexts = valueItems(cfg, value).map(v => formatValueItem(cfg, items ?? [], v));

  return (
    <IonField
      variant={variant}
      floating={floating}
      label={label}
      requiredMark={requiredMark}
      error={error}
      hasValue={has}
      focused={st.focused}
      underline={underline}
      testID={testID}
      itemStyle={itemStyle}
      cover={{ onPress: open, disabled: !enabled }}
    >
      <SelectableBox
        texts={valueTexts}
        placeholder={hasPlaceholder ? (placeholder as string) : null}
        enabled={enabled}
        library={props.library ?? 'ionic-selectable'}
        testID={testID}
      />
    </IonField>
  );
}

export const IonicSelectable = forwardRef(IonicSelectableInner) as <T = any>(
  props: IonicSelectableProps<T> & { ref?: React.Ref<SelectableHandle> },
) => React.ReactElement | null;

function SelectableBox({
  texts,
  placeholder,
  enabled,
  library,
  testID,
}: {
  texts: (string | null)[];
  placeholder: string | null;
  enabled: boolean;
  library: 'ionic-selectable' | 'select-searchable';
  testID: string;
}) {
  const spec = useField();
  const sp = spec.selectable;
  // the Topbath arrow rule names .select-searchable-icon(-inner) only, so it reaches <select-searchable> and not <ionic-selectable>
  const arrowCentred = sp.arrowCentred && library === 'select-searchable';
  const entries: { text: string | null; ph: boolean }[] = texts.map(t => ({ text: t, ph: false }));
  if (placeholder !== null) {
    entries.push({ text: placeholder, ph: true });
  }
  return (
    <View
      testID={`${testID}-box`}
      style={[
        styles.box,
        { maxWidth: `${selectableMd.maxWidthPct}%` },
        !enabled && { opacity: selectableMd.disabledOpacity },
      ]}
    >
      <View
        testID={`${testID}-value`}
        style={[styles.value, { paddingTop: sp.pad.top, paddingRight: sp.pad.right, paddingBottom: sp.pad.bottom, paddingLeft: sp.pad.left }]}
      >
        {entries.map((e, i) => (
          <Text
            key={i}
            testID={`${testID}-value-item-${i}`}
            numberOfLines={sp.wrap ? undefined : 1}
            textBreakStrategy={sp.breakAll ? 'simple' : undefined}
            style={[
              textStyle(sp.fontSize, 400, e.ph ? selectableMd.placeholderColor : itemMd.textColor),
              i < entries.length - 1 && { marginBottom: selectableMd.valueItemMarginBottom },
            ]}
          >
            {e.text}
          </Text>
        ))}
      </View>
      <View testID={`${testID}-icon`} style={styles.icon}>
        <View
          testID={`${testID}-icon-inner`}
          style={[styles.iconInner, arrowCentred ? styles.iconInnerCentred : null]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // .ionic-selectable { display: flex; max-width: 45% }
  box: { flexDirection: 'row' },
  // .ionic-selectable-value { flex: 1; overflow: hidden }
  value: { flexShrink: 1, overflow: 'hidden' },
  // .ionic-selectable-icon { position: relative; width: 20px }
  icon: { width: selectableMd.icon.width },
  // .ionic-selectable-icon-inner { position: absolute; top: 20px; left: 5px; 10 x 5 triangle; color #999 }
  // .edit ... .select-searchable-icon-inner { top: 50%; transform: translateY(-50%); left: 4px }
  iconInnerCentred: { top: '50%', left: 4, marginTop: -selectableMd.icon.borderTop / 2 },
  iconInner: {
    position: 'absolute',
    top: selectableMd.icon.top,
    left: selectableMd.icon.left,
    width: 0,
    height: 0,
    borderTopWidth: selectableMd.icon.borderTop,
    borderLeftWidth: selectableMd.icon.borderSide,
    borderRightWidth: selectableMd.icon.borderSide,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: selectableMd.icon.color,
  },
});
