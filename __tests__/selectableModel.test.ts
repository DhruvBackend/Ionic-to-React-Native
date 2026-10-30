// Pure logic of ionic-selectable 3.5.0 (esm2015 IonicSelectableComponent) and ionic-select-searchable 2.10.0.
import {
  filterItems,
  formatItem,
  formatValueItem,
  hasValue,
  isItemSelected,
  isNullOrWhiteSpace,
  valueItems,
} from '../src/ui/selectableModel';

const cfg = { itemValueField: 'id', itemTextField: 'company_name' };
const items = [
  { id: 1, company_name: 'Alpha Traders' },
  { id: 2, company_name: 'beta Sales' },
  { id: 3, company_name: 'Gamma' },
];

describe('selectable model', () => {
  test('search is a case-insensitive "contains" on itemTextField with the search text trimmed', () => {
    expect(filterItems(cfg, items, 'ALPHA').map(i => i.id)).toEqual([1]);
    expect(filterItems(cfg, items, '  sales ').map(i => i.id)).toEqual([2]);
    expect(filterItems(cfg, items, 'a').map(i => i.id)).toEqual([1, 2, 3]);
    expect(filterItems(cfg, items, 'zzz')).toEqual([]);
    expect(filterItems(cfg, items, '   ')).toHaveLength(3); // blank text = no filter
    expect(filterItems(cfg, items, '')).toHaveLength(3);
  });

  test('search on plain strings (no itemTextField) uses toString()', () => {
    expect(filterItems({}, ['Delhi', 'Mumbai'], 'mum' as any)).toEqual(['Mumbai']);
  });

  test('formatItem: itemTextField, else toString(); null for blank', () => {
    expect(formatItem(cfg, items[0])).toBe('Alpha Traders');
    expect(formatItem({}, 5 as any)).toBe('5');
    expect(formatItem(cfg, null as any)).toBeNull();
  });

  test('isItemSelected compares itemValueField (ids), not object identity', () => {
    expect(isItemSelected(cfg, [{ id: 2, company_name: 'x' }], items[1])).toBe(true);
    expect(isItemSelected(cfg, [{ id: 2 }], items[0])).toBe(false);
    expect(isItemSelected({}, ['a'], 'a')).toBe(true);
  });

  test('valueItems / hasValue', () => {
    expect(valueItems({ ...cfg }, items[0])).toEqual([items[0]]);
    expect(valueItems({ ...cfg }, null)).toEqual([]);
    expect(valueItems({ ...cfg }, '  ')).toEqual([]);
    expect(valueItems({ ...cfg, isMultiple: true }, [items[0], items[1]])).toHaveLength(2);
    expect(hasValue({ ...cfg }, null)).toBe(false);
    expect(hasValue({ ...cfg }, items[0])).toBe(true);
    expect(hasValue({ ...cfg, isMultiple: true }, [])).toBe(false);
  });

  test('shouldStoreItemValue stores the itemValueField value and formats it back through items', () => {
    const c = { ...cfg, shouldStoreItemValue: true };
    expect(formatValueItem(c, items, 2)).toBe('beta Sales');
  });

  test('isNullOrWhiteSpace', () => {
    expect(isNullOrWhiteSpace(null)).toBe(true);
    expect(isNullOrWhiteSpace(' \n')).toBe(true);
    expect(isNullOrWhiteSpace(0)).toBe(false);
  });
});
