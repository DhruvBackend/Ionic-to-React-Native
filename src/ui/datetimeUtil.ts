// Port of ionic-angular@3.9.5 util/datetime-util.js (plan Task 9 part 3). Logic is copied function by
// function; line comments name the original function. Month and day names are Ionic's English defaults
// (Topbath configures no locale names: IonicModule.forRoot(MyApp) has no config, app.module.ts:202).

export interface DateTimeData {
  year?: number | null;
  month?: number | null;
  day?: number | null;
  hour?: number | null;
  minute?: number | null;
  second?: number | null;
  millisecond?: number | null;
  tzOffset?: number;
  ampm?: unknown;
}

export interface Locale {
  monthNames?: string[];
  monthShortNames?: string[];
  dayNames?: string[];
  dayShortNames?: string[];
}

const isPresent = (v: any): boolean => v !== undefined && v !== null;
const isBlank = (v: any): boolean => v === undefined || v === null;

const FORMAT_KEYS = [
  { f: 'YYYY', k: 'year' },
  { f: 'MMMM', k: 'month' },
  { f: 'DDDD', k: 'day' },
  { f: 'MMM', k: 'month' },
  { f: 'DDD', k: 'day' },
  { f: 'YY', k: 'year' },
  { f: 'MM', k: 'month' },
  { f: 'DD', k: 'day' },
  { f: 'HH', k: 'hour' },
  { f: 'hh', k: 'hour' },
  { f: 'mm', k: 'minute' },
  { f: 'ss', k: 'second' },
  { f: 'M', k: 'month' },
  { f: 'D', k: 'day' },
  { f: 'H', k: 'hour' },
  { f: 'h', k: 'hour' },
  { f: 'm', k: 'minute' },
  { f: 's', k: 'second' },
  { f: 'A', k: 'ampm' },
  { f: 'a', k: 'ampm' },
];
const VALID_AMPM_PREFIX = ['hh', 'h', 'mm', 'm', 'ss', 's'];

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
];
export const MONTH_SHORT_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const twoDigit = (val: unknown) => ('0' + (isPresent(val) ? Math.abs(val as number) : '0')).slice(-2);
const threeDigit = (val: unknown) => ('00' + (isPresent(val) ? Math.abs(val as number) : '0')).slice(-3);
const fourDigit = (val: unknown) => ('000' + (isPresent(val) ? Math.abs(val as number) : '0')).slice(-4);

// renderDateTime
export function renderDateTime(template: string, value: DateTimeData | null | undefined, locale: Locale): string {
  if (isBlank(value)) {
    return '';
  }
  const tokens: string[] = [];
  let hasText = false;
  FORMAT_KEYS.forEach((format, index) => {
    if (template.indexOf(format.f) > -1) {
      const token = '{' + index + '}';
      const text = renderTextFormat(format.f, (value as any)[format.k], value, locale);
      if (!hasText && text && isPresent((value as any)[format.k])) {
        hasText = true;
      }
      tokens.push(token, text);
      template = template.replace(format.f, token);
    }
  });
  if (!hasText) {
    return '';
  }
  for (let i = 0; i < tokens.length; i += 2) {
    template = template.replace(tokens[i], tokens[i + 1]);
  }
  return template;
}

// renderTextFormat
export function renderTextFormat(format: string, value: any, date: DateTimeData | null | undefined, locale: Locale): string {
  if (format === 'DDDD' || format === 'DDD') {
    try {
      value = new Date(date!.year!, date!.month! - 1, date!.day!).getDay();
      if (format === 'DDDD') {
        return (isPresent(locale.dayNames) ? locale.dayNames! : DAY_NAMES)[value];
      }
      return (isPresent(locale.dayShortNames) ? locale.dayShortNames! : DAY_SHORT_NAMES)[value];
    } catch {
      // fall through, as Ionic does
    }
    return '';
  }
  if (format === 'A') {
    return date ? (date.hour! < 12 ? 'AM' : 'PM') : isPresent(value) ? value.toUpperCase() : '';
  }
  if (format === 'a') {
    return date ? (date.hour! < 12 ? 'am' : 'pm') : isPresent(value) ? value : '';
  }
  if (isBlank(value)) {
    return '';
  }
  if (format === 'YY' || format === 'MM' || format === 'DD' || format === 'HH' || format === 'mm' || format === 'ss') {
    return twoDigit(value);
  }
  if (format === 'YYYY') {
    return fourDigit(value);
  }
  if (format === 'MMMM') {
    return (isPresent(locale.monthNames) ? locale.monthNames! : MONTH_NAMES)[value - 1];
  }
  if (format === 'MMM') {
    return (isPresent(locale.monthShortNames) ? locale.monthShortNames! : MONTH_SHORT_NAMES)[value - 1];
  }
  if (format === 'hh' || format === 'h') {
    if (value === 0) {
      return '12';
    }
    if (value > 12) {
      value -= 12;
    }
    if (format === 'hh' && value < 10) {
      return '0' + value;
    }
  }
  return value.toString();
}

// dateValueRange
export function dateValueRange(format: string, min: DateTimeData, max: DateTimeData): (number | string)[] {
  const opts: (number | string)[] = [];
  let i: number;
  if (format === 'YYYY' || format === 'YY') {
    i = max.year as number;
    while (i >= (min.year as number)) {
      opts.push(i--);
    }
  } else if (format === 'MMMM' || format === 'MMM' || format === 'MM' || format === 'M' || format === 'hh' || format === 'h') {
    for (i = 1; i < 13; i++) {
      opts.push(i);
    }
  } else if (format === 'DDDD' || format === 'DDD' || format === 'DD' || format === 'D') {
    for (i = 1; i < 32; i++) {
      opts.push(i);
    }
  } else if (format === 'HH' || format === 'H') {
    for (i = 0; i < 24; i++) {
      opts.push(i);
    }
  } else if (format === 'mm' || format === 'm' || format === 'ss' || format === 's') {
    for (i = 0; i < 60; i++) {
      opts.push(i);
    }
  } else if (format === 'A' || format === 'a') {
    opts.push('am', 'pm');
  }
  return opts;
}

// dateSortValue
export function dateSortValue(year: any, month: any, day: any, hour = 0, minute = 0): number {
  return parseInt('1' + fourDigit(year) + twoDigit(month) + twoDigit(day) + twoDigit(hour) + twoDigit(minute), 10);
}

// dateDataSortValue
export function dateDataSortValue(data?: DateTimeData | null): number {
  if (data) {
    return dateSortValue(data.year, data.month, data.day, data.hour ?? undefined, data.minute ?? undefined);
  }
  return -1;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// daysInMonth
export function daysInMonth(month: number, year: number): number {
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : month === 2 ? (isLeapYear(year) ? 29 : 28) : 31;
}

/* eslint-disable no-useless-escape */
const ISO_8601_REGEXP =
  /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/;
const TIME_REGEXP = /^((\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/;
/* eslint-enable no-useless-escape */

// parseDate
export function parseDate(val: any): DateTimeData | null {
  let parse: any;
  if (isPresent(val) && val !== '') {
    parse = TIME_REGEXP.exec(val);
    if (isPresent(parse)) {
      parse.unshift(undefined, undefined);
      parse[2] = parse[3] = undefined;
    } else {
      parse = ISO_8601_REGEXP.exec(val);
    }
  }
  if (isBlank(parse)) {
    return null;
  }
  for (let i = 1; i < 8; i++) {
    parse[i] = parse[i] !== undefined ? parseInt(parse[i], 10) : null;
  }
  let tzOffset = 0;
  if (isPresent(parse[9]) && isPresent(parse[10])) {
    tzOffset = parseInt(parse[10], 10) * 60;
    if (isPresent(parse[11])) {
      tzOffset += parseInt(parse[11], 10);
    }
    if (parse[9] === '-') {
      tzOffset *= -1;
    }
  }
  return {
    year: parse[1],
    month: parse[2],
    day: parse[3],
    hour: parse[4],
    minute: parse[5],
    second: parse[6],
    millisecond: parse[7],
    tzOffset,
  };
}

// compareDates (sic: Ionic passes the 1-based month to the Date constructor)
export function compareDates(d1: DateTimeData, d2: DateTimeData): number {
  const date1 = new Date(d1.year as number, d1.month as number, d1.day as number, d1.hour as number, d1.minute as number, d1.second as number);
  const date2 = new Date(d2.year as number, d2.month as number, d2.day as number, d2.hour as number, d2.minute as number, d2.second as number);
  return date1.getTime() - date2.getTime();
}

// updateDate: existingData is mutated. newData is an ISO string or the picker's {key: {value}} object.
export function updateDate(existingData: Record<string, any>, newData: any): boolean {
  if (isPresent(newData) && newData !== '') {
    if (typeof newData === 'string') {
      const parsed = parseDate(newData);
      if (parsed) {
        Object.assign(existingData, parsed);
        return true;
      }
    } else if (
      isPresent(newData.year) || isPresent(newData.hour) || isPresent(newData.month) ||
      isPresent(newData.day) || isPresent(newData.minute) || isPresent(newData.second)
    ) {
      if (isPresent(newData.ampm) && isPresent(newData.hour)) {
        if (newData.ampm.value === 'pm') {
          newData.hour.value = newData.hour.value === 12 ? 12 : newData.hour.value + 12;
        } else {
          newData.hour.value = newData.hour.value === 12 ? 0 : newData.hour.value;
        }
      }
      for (const k in newData) {
        existingData[k] = newData[k].value;
      }
      return true;
    }
    console.warn(`Error parsing date: "${newData}". Please provide a valid ISO 8601 datetime format: https://www.w3.org/TR/NOTE-datetime`);
  } else {
    for (const k in existingData) {
      delete existingData[k];
    }
  }
  return false;
}

// parseTemplate
export function parseTemplate(template: string): string[] {
  const formats: string[] = [];
  template = template.replace(/[^\w\s]/gi, ' ');
  FORMAT_KEYS.forEach(format => {
    if (format.f.length > 1 && template.indexOf(format.f) > -1 && template.indexOf(format.f + format.f.charAt(0)) < 0) {
      template = template.replace(format.f, ' ' + format.f + ' ');
    }
  });
  const words = template.split(' ').filter(w => w.length > 0);
  words.forEach((word, i) => {
    FORMAT_KEYS.forEach(format => {
      if (word === format.f) {
        if (word === 'A' || word === 'a') {
          if ((formats.indexOf('h') < 0 && formats.indexOf('hh') < 0) || VALID_AMPM_PREFIX.indexOf(words[i - 1]) === -1) {
            return;
          }
        }
        formats.push(word);
      }
    });
  });
  return formats;
}

// convertFormatToKey
export function convertFormatToKey(format: string): string | null {
  for (const k in FORMAT_KEYS) {
    if (FORMAT_KEYS[k].f === format) {
      return FORMAT_KEYS[k].k;
    }
  }
  return null;
}

// getValueFromFormat
export function getValueFromFormat(date: DateTimeData, format: string): any {
  if (format === 'A' || format === 'a') {
    return date.hour! < 12 ? 'am' : 'pm';
  }
  if (format === 'hh' || format === 'h') {
    return date.hour! > 12 ? date.hour! - 12 : date.hour;
  }
  return (date as any)[convertFormatToKey(format) as string];
}

// convertDataToISO: what ion-datetime puts in ngModel (datetime.js _inputNgModelEvent)
export function convertDataToISO(data: DateTimeData | null | undefined): string {
  let rtn = '';
  if (isPresent(data)) {
    if (isPresent(data!.year)) {
      rtn = fourDigit(data!.year);
      if (isPresent(data!.month)) {
        rtn += '-' + twoDigit(data!.month);
        if (isPresent(data!.day)) {
          rtn += '-' + twoDigit(data!.day);
          if (isPresent(data!.hour)) {
            rtn += 'T' + twoDigit(data!.hour) + ':' + twoDigit(data!.minute) + ':' + twoDigit(data!.second);
            if (data!.millisecond! > 0) {
              rtn += '.' + threeDigit(data!.millisecond);
            }
            if (isBlank(data!.tzOffset) || data!.tzOffset === 0) {
              rtn += 'Z';
            } else {
              rtn += (data!.tzOffset! > 0 ? '+' : '-') + twoDigit(Math.floor(data!.tzOffset! / 60)) + ':' + twoDigit(data!.tzOffset! % 60);
            }
          }
        }
      }
    } else if (isPresent(data!.hour)) {
      rtn = twoDigit(data!.hour) + ':' + twoDigit(data!.minute);
      if (isPresent(data!.second)) {
        rtn += ':' + twoDigit(data!.second);
        if (isPresent(data!.millisecond)) {
          rtn += '.' + threeDigit(data!.millisecond);
        }
      }
    }
  }
  return rtn;
}
