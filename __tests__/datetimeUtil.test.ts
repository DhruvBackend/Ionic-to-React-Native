// Port of ionic-angular@3.9.5 util/datetime-util.js and the ion-datetime logic of components/datetime/datetime.js
// (plan Task 9 part 3). Expected strings are what Ionic renders for the same inputs.
import {
  convertDataToISO,
  dateValueRange,
  parseDate,
  parseTemplate,
  renderDateTime,
  renderTextFormat,
} from '../src/ui/datetimeUtil';
import { buildDatetimePicker, calcMinMax } from '../src/ui/datetimePicker';

describe('datetime-util', () => {
  test('parseDate reads ISO strings', () => {
    expect(parseDate('1990-08-15')).toMatchObject({ year: 1990, month: 8, day: 15, hour: null });
    expect(parseDate('2020-02-29T10:05:00Z')).toMatchObject({ year: 2020, month: 2, day: 29, hour: 10, minute: 5, second: 0 });
    expect(parseDate('garbage')).toBeNull();
    expect(parseDate('')).toBeNull();
  });

  test('renderDateTime formats DD/MM/YYYY and MMM DD, YYYY', () => {
    const v = parseDate('1990-08-05')!;
    expect(renderDateTime('DD/MM/YYYY', v, {})).toBe('05/08/1990');
    expect(renderDateTime('MMM DD, YYYY', v, {})).toBe('Aug 05, 1990');
    expect(renderDateTime('MMM D, YYYY', v, {})).toBe('Aug 5, 1990');
    expect(renderDateTime('MMMM', v, {})).toBe('August');
    expect(renderDateTime('DD/MM/YYYY', null, {})).toBe('');
  });

  test('renderTextFormat', () => {
    expect(renderTextFormat('YY', 1990, null, {})).toBe('90');
    expect(renderTextFormat('YYYY', 5, null, {})).toBe('0005');
    expect(renderTextFormat('MM', 3, null, {})).toBe('03');
    expect(renderTextFormat('M', 3, null, {})).toBe('3');
  });

  test('dateValueRange: years descend from max to min, months 1-12, days 1-31', () => {
    expect(dateValueRange('YYYY', { year: 1992 } as any, { year: 1995 } as any)).toEqual([1995, 1994, 1993, 1992]);
    expect(dateValueRange('MM', {} as any, {} as any)).toHaveLength(12);
    expect(dateValueRange('DD', {} as any, {} as any)[30]).toBe(31);
  });

  test('parseTemplate splits the format into columns in order', () => {
    expect(parseTemplate('DD/MM/YYYY')).toEqual(['DD', 'MM', 'YYYY']);
    expect(parseTemplate('MMM DD, YYYY')).toEqual(['MMM', 'DD', 'YYYY']);
  });

  test('convertDataToISO gives YYYY-MM-DD for a date-only value', () => {
    expect(convertDataToISO({ year: 1990, month: 8, day: 5 })).toBe('1990-08-05');
  });
});

describe('ion-datetime picker columns', () => {
  const now = new Date(Date.UTC(2026, 9, 30, 12, 0, 0)); // 30 Oct 2026, noon UTC (Ionic reads new Date().toISOString())

  test('calcMinMax defaults: min = this year - 100, max = this year (datetime.js calcMinMax)', () => {
    const { min, max } = calcMinMax({}, now);
    expect(min).toMatchObject({ year: 1926, month: 1, day: 1 });
    expect(max).toMatchObject({ year: 2026, month: 12, day: 31 });
  });

  test('registration date of birth: DD/MM/YYYY with max = today', () => {
    const p = buildDatetimePicker({ displayFormat: 'DD/MM/YYYY', max: '2026-10-30', value: undefined, now });
    expect(p.columns.map(c => c.name)).toEqual(['day', 'month', 'year']);
    // years: 2026 down to 1926 (101 options)
    const year = p.columns[2];
    expect(year.options[0].value).toBe(2026);
    expect(year.options).toHaveLength(101);
    // no value: defaults to "now", capped at max -> today
    expect(p.columns[0].options[p.columns[0].selectedIndex].text).toBe('30');
    expect(p.columns[1].options[p.columns[1].selectedIndex].text).toBe('10');
    expect(year.options[year.selectedIndex].text).toBe('2026');
    expect(p.columns[0].options[0].text).toBe('01');
  });

  test('an existing value preselects its day, month and year', () => {
    const p = buildDatetimePicker({ displayFormat: 'DD/MM/YYYY', max: '2026-10-30', value: '1990-08-15', now });
    expect(p.columns[0].options[p.columns[0].selectedIndex].value).toBe(15);
    expect(p.columns[1].options[p.columns[1].selectedIndex].value).toBe(8);
    expect(p.columns[2].options[p.columns[2].selectedIndex].value).toBe(1990);
  });

  test('validation disables days after max in the max month and clamps the selection', () => {
    const p = buildDatetimePicker({ displayFormat: 'DD/MM/YYYY', max: '2026-10-30', value: '2026-10-15', now });
    // pick the max year/month, day 31 is beyond max
    expect(p.columns[0].options[30].disabled).toBe(true);
    expect(p.columns[0].options[29].disabled).toBe(false);
  });

  test('MMM DD, YYYY (add-leave, travel-add, sales dealer) uses short month names', () => {
    const p = buildDatetimePicker({ displayFormat: 'MMM DD, YYYY', value: undefined, now });
    expect(p.columns.map(c => c.name)).toEqual(['month', 'day', 'year']);
    expect(p.columns[0].options[0].text).toBe('Jan');
  });

  test('min restricts the lower bound (add-leave min = today)', () => {
    const p = buildDatetimePicker({ displayFormat: 'MMM DD, YYYY', min: '2026-10-30', max: '2027', value: undefined, now });
    const year = p.columns[2];
    expect(year.options.map(o => o.value)).toEqual([2027, 2026]);
  });
});
