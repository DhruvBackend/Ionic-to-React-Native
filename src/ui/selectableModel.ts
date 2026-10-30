// The pure logic of ionic-selectable@3.5.0 (esm2015/ionic-selectable.min.js IonicSelectableComponent) and of
// ionic-select-searchable@2.10.0 (umd SelectSearchableComponent): both libraries share it. Grouping
// (groupValueField), add/save/delete item and infinite scroll are not used by Topbath and are not ported.

export interface SelectableConfig {
  itemValueField?: string | null;
  itemTextField?: string | null;
  shouldStoreItemValue?: boolean;
  isMultiple?: boolean;
}

// _isNullOrWhiteSpace
export function isNullOrWhiteSpace(value: any): boolean {
  return value === null || value === undefined || value.toString().replace(/\s/g, '').length < 1;
}

const hasObjects = (cfg: SelectableConfig) => !isNullOrWhiteSpace(cfg.itemValueField);
const shouldStore = (cfg: SelectableConfig) => !!cfg.shouldStoreItemValue && hasObjects(cfg);

// _formatItem
export function formatItem(cfg: SelectableConfig, item: any): string | null {
  return isNullOrWhiteSpace(item) ? null : cfg.itemTextField ? item[cfg.itemTextField] : item.toString();
}

// _getItemValue / _getStoredItemValue
export function getItemValue(cfg: SelectableConfig, item: any): any {
  return hasObjects(cfg) ? item[cfg.itemValueField as string] : item;
}
export function getStoredItemValue(cfg: SelectableConfig, item: any): any {
  return hasObjects(cfg) ? (shouldStore(cfg) ? item : item[cfg.itemValueField as string]) : item;
}

// _formatValueItem
export function formatValueItem(cfg: SelectableConfig, items: any[], valueItem: any): string | null {
  if (shouldStore(cfg)) {
    const found = items.find(i => i[cfg.itemValueField as string] === valueItem);
    return formatItem(cfg, found);
  }
  return formatItem(cfg, valueItem);
}

// _filterItems (no onSearch observer): case-insensitive contains on the item text, search text trimmed
export function filterItems<T = any>(cfg: SelectableConfig, items: T[], searchText: string | null | undefined): T[] {
  if (searchText && searchText.trim()) {
    const text = searchText.trim().toLowerCase();
    return items.filter(item => {
      const t = cfg.itemTextField ? (item as any)[cfg.itemTextField] : item;
      return t.toString().toLowerCase().indexOf(text) !== -1;
    });
  }
  return items;
}

// _isItemSelected
export function isItemSelected(cfg: SelectableConfig, selectedItems: any[], item: any): boolean {
  return selectedItems.find(s => getItemValue(cfg, item) === getStoredItemValue(cfg, s)) !== undefined;
}

// the `value` setter: _valueItems
export function valueItems(cfg: SelectableConfig, value: any): any[] {
  if (cfg.isMultiple) {
    return value && value.length ? [...value] : [];
  }
  return isNullOrWhiteSpace(value) ? [] : [value];
}

// hasValue()
export function hasValue(cfg: SelectableConfig, value: any): boolean {
  const vi = valueItems(cfg, value);
  return cfg.isMultiple ? vi.length !== 0 : vi.length !== 0 && !isNullOrWhiteSpace(vi[0]);
}

// the modal constructor: _selectedItems from the current value
export function initialSelectedItems(cfg: SelectableConfig, value: any): any[] {
  if (isNullOrWhiteSpace(value)) {
    return [];
  }
  return cfg.isMultiple ? [...value] : [value];
}
