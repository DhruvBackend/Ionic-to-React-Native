// Shared Angular 5.2 pipes + moment formats (Phase 2 kit, 2026-11-03). Expected values follow Angular 5.2.11 en-US and moment 2.x.
import { collapseWs, datePipe, interp, momentFormat, titlecase } from '../src/ui/angularPipes';

test('interpolation prints null/undefined as empty', () => {
  expect(interp(null)).toBe('');
  expect(interp(undefined)).toBe('');
  expect(interp(0)).toBe('0');
});

test('collapseWs collapses HTML white space but keeps nbsp', () => {
  expect(collapseWs('a \n\t b  c')).toBe('a b  c');
});

test('titlecase splits on \\b like Angular 5.2', () => {
  expect(titlecase("it's a DEAL")).toBe("It'S A Deal");
  expect(titlecase('diwali dhamaka offer')).toBe('Diwali Dhamaka Offer');
  expect(titlecase('')).toBe('');
  expect(titlecase(null)).toBe(null);
});

test('datePipe formats used by the Ionic app', () => {
  const v = '2026-03-05 14:07:09'; // falls through to new Date() like Angular (not the yyyy-M-d branch)
  expect(datePipe('2026-03-05', 'd MMMM y')).toBe('5 March 2026');
  expect(datePipe('2026-03-05', 'd MMM y')).toBe('5 Mar 2026');
  expect(datePipe('2026-03-05', 'd MMM,y')).toBe('5 Mar,2026');
  expect(datePipe('2026-03-05', 'd MMM, y')).toBe('5 Mar, 2026');
  expect(datePipe('2026-03-05', 'MMM d, y')).toBe('Mar 5, 2026');
  expect(datePipe('2026-03-05', 'd-MMM-y')).toBe('5-Mar-2026');
  expect(datePipe('2026-03-05', 'EEEE, MMMM d')).toBe('Thursday, March 5');
  expect(datePipe(new Date(2026, 2, 5, 14, 7), 'd MMM y hh:mm a')).toBe('5 Mar 2026 02:07 PM');
  expect(datePipe(new Date(2026, 2, 5, 9, 7), 'h:mm a')).toBe('9:07 AM');
  expect(datePipe(new Date(2026, 2, 5, 9, 7), 'h:m a')).toBe('9:7 AM');
  expect(datePipe(new Date(2026, 2, 5, 0, 30), 'hh:mm a')).toBe('12:30 AM');
  expect(datePipe(v, 'd MMMM y')).toBe(`${new Date(v).getDate()} March 2026`);
});

test('datePipe: empty for null/""/invalid (Angular prints nothing / throws)', () => {
  expect(datePipe(null, 'd MMMM y')).toBe('');
  expect(datePipe('', 'd MMMM y')).toBe('');
  expect(datePipe('not a date', 'd MMMM y')).toBe('');
});

test("datePipe: '0000-00-00' takes the yyyy-M-d branch like Angular (new Date(0, -1, 0))", () => {
  expect(datePipe('0000-00-00', 'd MMM,y')).toBe('30 Nov,1899');
});

test('momentFormat formats used by the Ionic app', () => {
  expect(momentFormat('2026-10-05 11:20:00', 'D-M-Y')).toBe('5-10-2026');
  expect(momentFormat('2026-10-05 11:20:09', 'YYYY-MM-DD')).toBe('2026-10-05');
  expect(momentFormat('2026-10-05 08:04:09', 'HH:mm:ss')).toBe('08:04:09');
  expect(momentFormat('2026-10-05 08:04:09', 'HH:mm')).toBe('08:04');
  expect(momentFormat('2026-10-05', 'Y-M-D')).toBe('2026-10-5');
  expect(momentFormat('2026-10-05', 'YY:MM:DD')).toBe('26:10:05');
});

test('momentFormat edge cases match moment', () => {
  const n = new Date();
  expect(momentFormat(undefined, 'D-M-Y')).toBe(`${n.getDate()}-${n.getMonth() + 1}-${n.getFullYear()}`);
  expect(momentFormat(null, 'D-M-Y')).toBe('Invalid date');
  expect(momentFormat('0000-00-00 00:00:00', 'D-M-Y')).toBe('Invalid date');
  expect(momentFormat('2026-02-31 10:00:00', 'D-M-Y')).toBe('Invalid date');
  const l = new Date('2026-10-05T23:30:00Z');
  expect(momentFormat('2026-10-05T23:30:00Z', 'D-M-Y')).toBe(`${l.getDate()}-${l.getMonth() + 1}-${l.getFullYear()}`);
});
