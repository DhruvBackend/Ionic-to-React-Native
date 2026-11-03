import { formatScanDate } from './scanDate';

test('normal server date', () => expect(formatScanDate('2026-10-05 11:20:00')).toBe('5-10-2026'));
test('undefined is today', () => {
  const n = new Date();
  expect(formatScanDate(undefined)).toBe(`${n.getDate()}-${n.getMonth() + 1}-${n.getFullYear()}`);
});
test('zero date is Invalid date', () => {
  expect(formatScanDate('0000-00-00 00:00:00')).toBe('Invalid date');
  expect(formatScanDate(null)).toBe('Invalid date');
  expect(formatScanDate('2026-02-31 10:00:00')).toBe('Invalid date');
});
test('ISO with Z or offset is converted to local time', () => {
  const l = new Date('2026-10-05T23:30:00Z');
  expect(formatScanDate('2026-10-05T23:30:00Z')).toBe(`${l.getDate()}-${l.getMonth() + 1}-${l.getFullYear()}`);
  const o = new Date('2026-10-05T01:00:00+05:30');
  expect(formatScanDate('2026-10-05T01:00:00+05:30')).toBe(`${o.getDate()}-${o.getMonth() + 1}-${o.getFullYear()}`);
});
