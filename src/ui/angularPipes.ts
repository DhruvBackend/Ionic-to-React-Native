// Angular 5.2.11 template pipes and interpolation, shared by every screen (Phase 2 kit, 2026-11-03).
// Before this module, OfferList, Offers and Profile each carried their own copy.
// Locale: en-US. app.module.ts provides no LOCALE_ID, so dates stay English even when the app language is Hindi.

// `{{ x }}`: null and undefined print as an empty string.
export const interp = (v: any): string => (v === null || v === undefined ? '' : String(v));

// Ionic text is HTML: runs of white space (not &nbsp;) collapse to one space.
export const collapseWs = (s: string): string => s.replace(/[ \t\n\r\f]+/g, ' ');

// TitleCasePipe: value.split(/\b/g).map(w => w[0].toUpperCase() + w.substr(1).toLowerCase()).join('').
// "it's" becomes "It'S". A falsy value is returned as it is.
// NOTE (parity): Angular throws InvalidPipeArgument for a non-string; the value is converted instead.
export function titlecase(value: any): any {
  if (!value) {
    return value;
  }
  return String(value)
    .split(/\b/g)
    .map(w => (w ? w[0].toUpperCase() + w.substr(1).toLowerCase() : w))
    .join('');
}

const ISO8601 = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;

// DatePipe.transform's parsing:
// - numbers and numeric strings are timestamps;
// - 'yyyy-M-d' is a local date;
// - ISO 8601 strings follow isoStringToDate;
// - anything else goes through new Date().
// Returns null for null/'' (the pipe prints nothing) and an invalid Date when Angular would throw.
export function parseAngularDate(value: any): Date | null {
  if (value == null || value === '' || value !== value) { // eslint-disable-line no-self-compare
    return null;
  }
  if (typeof value === 'string') {
    value = value.trim();
  }
  if (value instanceof Date) {
    return value;
  }
  if (!isNaN(value - parseFloat(value))) {
    return new Date(parseFloat(value));
  }
  if (typeof value === 'string' && /^(\d{4}-\d{1,2}-\d{1,2})$/.test(value)) {
    const [y, m, d] = value.split('-').map((v: string) => +v);
    return new Date(y, m - 1, d);
  }
  const match = typeof value === 'string' ? value.match(ISO8601) : null;
  if (match) {
    const date = new Date(0);
    const utc = !!match[8];
    const tzHour = match[9] ? +(match[9] + match[10]) : 0;
    const tzMin = match[9] ? +(match[9] + match[11]) : 0;
    (utc ? date.setUTCFullYear : date.setFullYear).call(date, +match[1], +match[2] - 1, +match[3]);
    (utc ? date.setUTCHours : date.setHours).call(
      date,
      +(match[4] || '0') - tzHour,
      +(match[5] || '0') - tzMin,
      +(match[6] || '0'),
      Math.round(parseFloat('0.' + (match[7] || 0)) * 1000),
    );
    return date;
  }
  return new Date(value);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const pad = (n: number) => (n < 10 ? '0' + n : String(n));
const TOKENS = /(EEEE|EEE|MMMM|MMM|MM|M|dd|d|yyyy|yy|y|hh|h|HH|H|mm|m|ss|s|a)/g;

function token(t: string, d: Date): string {
  const h12 = d.getHours() % 12 || 12;
  switch (t) {
    case 'EEEE': return DAYS[d.getDay()];
    case 'EEE': return DAYS[d.getDay()].slice(0, 3);
    case 'MMMM': return MONTHS[d.getMonth()];
    case 'MMM': return MONTHS[d.getMonth()].slice(0, 3);
    case 'MM': return pad(d.getMonth() + 1);
    case 'M': return String(d.getMonth() + 1);
    case 'dd': return pad(d.getDate());
    case 'd': return String(d.getDate());
    case 'yyyy': return String(d.getFullYear()).padStart(4, '0');
    case 'yy': return pad(d.getFullYear() % 100);
    case 'y': return String(d.getFullYear());
    case 'hh': return pad(h12);
    case 'h': return String(h12);
    case 'HH': return pad(d.getHours());
    case 'H': return String(d.getHours());
    case 'mm': return pad(d.getMinutes());
    case 'm': return String(d.getMinutes());
    case 'ss': return pad(d.getSeconds());
    case 's': return String(d.getSeconds());
    case 'a': return d.getHours() < 12 ? 'AM' : 'PM';
    default: return t;
  }
}

// `{{ value | date:'<format>' }}` for the formats the Ionic app uses ('d MMMM y', 'd MMM,y', 'hh:mm a', 'EEEE, MMMM d', ...).
// NOTE (parity): Angular throws InvalidPipeArgument for a value that is no date, and the page's change detection fails;
// RN shows an empty string instead.
export function datePipe(value: any, format = 'mediumDate'): string {
  const d = parseAngularDate(value);
  if (!d || isNaN(d.valueOf())) {
    return '';
  }
  const fmt = format === 'mediumDate' ? 'MMM d, y' : format;
  return fmt.replace(TOKENS, t => token(t, d));
}

// moment(value).format(fmt) for the formats the Ionic app uses ('D-M-Y', 'YYYY-MM-DD', 'HH:mm:ss', 'YY:MM:DD', ...).
// moment is not a dependency of the RN app. Parsing as moment 2.x:
// - undefined means now, and null is invalid;
// - 'YYYY-MM-DD[ T]HH:mm[:ss]' without a zone is local time;
// - ISO strings with Z or an offset are converted to local time;
// - impossible dates ('0000-00-00', '2026-02-31') are invalid;
// - other strings fall back to new Date().
// An invalid date prints 'Invalid date'.
const MOMENT_TOKENS = /(YYYY|YY|Y|MM|M|DD|D|HH|H|mm|m|ss|s)/g;
export function momentFormat(v: any, fmt: string): string {
  let d: Date;
  const str = typeof v === 'string' ? v.trim() : '';
  const local = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(str);
  if (v === undefined) {
    d = new Date();
  } else if (v === null) {
    return 'Invalid date';
  } else if (local) {
    const [y, mo, da, hh, mi, ss] = local.slice(1).map(x => (x === undefined ? 0 : Number(x)));
    d = new Date(y, mo - 1, da, hh, mi, ss);
    if (mo < 1 || mo > 12 || d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da) {
      return 'Invalid date';
    }
  } else {
    d = v instanceof Date ? v : new Date(v);
  }
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }
  return fmt.replace(MOMENT_TOKENS, t => {
    switch (t) {
      case 'YYYY': return String(d.getFullYear()).padStart(4, '0');
      case 'YY': return pad(d.getFullYear() % 100);
      case 'Y': return String(d.getFullYear());
      case 'MM': return pad(d.getMonth() + 1);
      case 'M': return String(d.getMonth() + 1);
      case 'DD': return pad(d.getDate());
      case 'D': return String(d.getDate());
      case 'HH': return pad(d.getHours());
      case 'H': return String(d.getHours());
      case 'mm': return pad(d.getMinutes());
      case 'm': return String(d.getMinutes());
      case 'ss': return pad(d.getSeconds());
      default: return String(d.getSeconds());
    }
  });
}
