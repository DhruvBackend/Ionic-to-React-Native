// The column model of ion-datetime's picker: port of the picker related methods of
// ionic-angular@3.9.5 components/datetime/datetime.js (generate, validate, validateColumn, divyColumns,
// getValueOrDefault, getDefaultValueDateString, calcMinMax) plus the column normalisation of
// components/picker/picker-component.js ionViewWillLoad.
import {
  compareDates,
  convertFormatToKey,
  dateDataSortValue,
  dateSortValue,
  dateValueRange,
  daysInMonth,
  getValueFromFormat,
  parseDate,
  parseTemplate,
  renderTextFormat,
  updateDate,
  type DateTimeData,
  type Locale,
} from './datetimeUtil';

export interface PickerOption {
  value: any;
  text: string;
  disabled?: boolean;
}

export interface PickerColumn {
  name: string;
  selectedIndex: number;
  options: PickerOption[];
  align?: 'left' | 'right';
  optionsWidth?: string; // px, from divyColumns
  columnWidth?: string;
}

const DEFAULT_FORMAT = 'MMM D, YYYY'; // datetime.js DEFAULT_FORMAT

export interface DatetimeSpec {
  displayFormat?: string;
  pickerFormat?: string;
  min?: string | number;
  max?: string | number;
  value?: string | null; // ISO string, as ngModel holds it
  now?: Date;
}

function isBlank(v: unknown) {
  return v === undefined || v === null;
}

// calcMinMax (without the yearValues branch: no Topbath usage)
export function calcMinMax(spec: Pick<DatetimeSpec, 'min' | 'max'>, now?: Date): { min: DateTimeData; max: DateTimeData } {
  const todaysYear = (now || new Date()).getFullYear();
  const minStr = isBlank(spec.min) ? (todaysYear - 100).toString() : spec.min;
  const maxStr = isBlank(spec.max) ? todaysYear.toString() : spec.max;
  const min = parseDate(String(minStr)) as DateTimeData;
  const max = parseDate(String(maxStr)) as DateTimeData;
  min.year = min.year || todaysYear;
  max.year = max.year || todaysYear;
  min.month = min.month || 1;
  max.month = max.month || 12;
  min.day = min.day || 1;
  max.day = max.day || 31;
  min.hour = min.hour || 0;
  max.hour = max.hour || 23;
  min.minute = min.minute || 0;
  max.minute = max.minute || 59;
  min.second = min.second || 0;
  max.second = max.second || 59;
  if (min.year > max.year) {
    console.error('min.year > max.year');
    min.year = max.year - 100;
  }
  if (min.year === max.year) {
    if (min.month > max.month) {
      console.error('min.month > max.month');
      min.month = 1;
    } else if (min.month === max.month && min.day > max.day) {
      console.error('min.day > max.day');
      min.day = 1;
    }
  }
  return { min, max };
}

// getDefaultValueDateString: initialValue is unused by Topbath
function defaultValueDateString(max: string | number | undefined, now: Date): string {
  const nowString = now.toISOString();
  if (!isBlank(max)) {
    const nowParsed = parseDate(nowString) as any;
    const maxParsed = parseDate(String(max)) as any;
    for (const i in maxParsed) {
      if (maxParsed[i] === null) {
        maxParsed[i] = nowParsed[i];
      }
    }
    if (compareDates(nowParsed, maxParsed) > 0) {
      return String(max);
    }
  }
  return nowString;
}

// getValueOrDefault
function valueOrDefault(value: string | null | undefined, max: string | number | undefined, now: Date): DateTimeData {
  const existing: Record<string, any> = {};
  if (!isBlank(value) && value !== '') {
    updateDate(existing, value);
  }
  if (Object.keys(existing).length > 0) {
    return existing;
  }
  const dflt: Record<string, any> = {};
  updateDate(dflt, defaultValueDateString(max, now));
  return dflt;
}

export interface BuiltPicker {
  columns: PickerColumn[];
  min: DateTimeData;
  max: DateTimeData;
}

// generate() + the validate() that open() runs right after it
export function buildDatetimePicker(spec: DatetimeSpec, locale: Locale = {}): BuiltPicker {
  const now = spec.now ?? new Date();
  let template = spec.pickerFormat || spec.displayFormat || DEFAULT_FORMAT;
  const { min, max } = calcMinMax(spec, now);

  // does not support selecting by day name: any day name format is removed
  template = template.replace('DDDD', '{~}').replace('DDD', '{~}');
  if (template.indexOf('D') === -1) {
    template = template.replace('{~}', 'D');
  }
  template = template.replace(/{~}/g, '');

  const current = valueOrDefault(spec.value, spec.max, now);
  const columns: PickerColumn[] = parseTemplate(template).map(format => {
    const key = convertFormatToKey(format) as string;
    const values = dateValueRange(format, min, max);
    const options: PickerOption[] = values.map(val => ({
      value: val,
      text: renderTextFormat(format, val, null, locale),
    }));
    const optValue = getValueFromFormat(current, format);
    const found = options.findIndex(opt => opt.value === optValue);
    return { name: key, selectedIndex: found >= 0 ? found : 0, options };
  });

  const normMin = min as any;
  const normMax = max as any;
  ['month', 'day', 'hour', 'minute']
    .filter(name => !columns.find(c => c.name === name))
    .forEach(name => {
      normMin[name] = 0;
      normMax[name] = 0;
    });

  divyColumns(columns);
  const picker = { columns, min, max };
  validateDatetimePicker(picker, now);
  return picker;
}

function clamp(min: number, n: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

// validateColumn
function validateColumn(
  columns: PickerColumn[],
  name: string,
  index: number,
  min: number,
  max: number,
  lowerBounds: number[],
  upperBounds: number[],
): number {
  const column = columns.find(c => c.name === name);
  if (!column) {
    return 0;
  }
  const lb = lowerBounds.slice();
  const ub = upperBounds.slice();
  const options = column.options;
  let indexMin = options.length - 1;
  let indexMax = 0;
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const value = opt.value;
    lb[index] = opt.value;
    ub[index] = opt.value;
    const disabled = (opt.disabled =
      value < lowerBounds[index] ||
      value > upperBounds[index] ||
      dateSortValue(ub[0], ub[1], ub[2], ub[3], ub[4]) < min ||
      dateSortValue(lb[0], lb[1], lb[2], lb[3], lb[4]) > max);
    if (!disabled) {
      indexMin = Math.min(indexMin, i);
      indexMax = Math.max(indexMax, i);
    }
  }
  const selectedIndex = (column.selectedIndex = clamp(indexMin, column.selectedIndex, indexMax));
  const opt = column.options[selectedIndex];
  return opt ? opt.value : 0;
}

// validate(): updates option.disabled and clamps every column's selectedIndex
export function validateDatetimePicker(picker: BuiltPicker, today: Date = new Date()): void {
  const minCompareVal = dateDataSortValue(picker.min);
  const maxCompareVal = dateDataSortValue(picker.max);
  const yearCol = picker.columns.find(c => c.name === 'year');
  let selectedYear = today.getFullYear();
  if (yearCol) {
    // default to the first value if the current year doesn't exist in the options
    if (!yearCol.options.find(col => col.value === today.getFullYear())) {
      selectedYear = yearCol.options[0].value;
    }
    const yearOpt = yearCol.options[yearCol.selectedIndex];
    if (yearOpt) {
      selectedYear = yearOpt.value;
    }
  }
  const selectedMonth = validateColumn(picker.columns, 'month', 1, minCompareVal, maxCompareVal, [selectedYear, 0, 0, 0, 0], [selectedYear, 12, 31, 23, 59]);
  const numDaysInMonth = daysInMonth(selectedMonth, selectedYear);
  const selectedDay = validateColumn(picker.columns, 'day', 2, minCompareVal, maxCompareVal, [selectedYear, selectedMonth, 0, 0, 0], [selectedYear, selectedMonth, numDaysInMonth, 23, 59]);
  const selectedHour = validateColumn(picker.columns, 'hour', 3, minCompareVal, maxCompareVal, [selectedYear, selectedMonth, selectedDay, 0, 0], [selectedYear, selectedMonth, selectedDay, 23, 59]);
  validateColumn(picker.columns, 'minute', 4, minCompareVal, maxCompareVal, [selectedYear, selectedMonth, selectedDay, selectedHour, 0], [selectedYear, selectedMonth, selectedDay, selectedHour, 59]);
}

// divyColumns: sizes 2 and 3 column pickers by the widest option text (17 px per character)
function divyColumns(columns: PickerColumn[]) {
  const columnsWidth: number[] = [];
  columns.forEach((col, i) => {
    columnsWidth.push(0);
    col.options.forEach(o => {
      if (o.text.length > columnsWidth[i]) {
        columnsWidth[i] = o.text.length;
      }
    });
  });
  if (columnsWidth.length === 2) {
    const width = Math.max(columnsWidth[0], columnsWidth[1]);
    columns[0].align = 'right';
    columns[1].align = 'left';
    columns[0].optionsWidth = columns[1].optionsWidth = width * 17 + 'px';
  } else if (columnsWidth.length === 3) {
    const width = Math.max(columnsWidth[0], columnsWidth[2]);
    columns[0].align = 'right';
    columns[1].columnWidth = columnsWidth[1] * 17 + 'px';
    columns[0].optionsWidth = columns[2].optionsWidth = width * 17 + 'px';
    columns[2].align = 'left';
  }
}

// The {name: {text, value, columnIndex}} object the Done button handler receives (picker-component.js getSelected)
export function pickerSelected(columns: PickerColumn[]): Record<string, { text: string | null; value: any; columnIndex: number }> {
  const selected: Record<string, { text: string | null; value: any; columnIndex: number }> = {};
  columns.forEach((col, index) => {
    const opt = col.options[col.selectedIndex];
    selected[col.name] = { text: opt ? opt.text : null, value: opt ? opt.value : null, columnIndex: index };
  });
  return selected;
}
