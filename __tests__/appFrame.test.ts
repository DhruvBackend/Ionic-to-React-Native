// Status bar / page frame, ported from app.component.ts:117-119 (statusBar) and :781-790 +
// variables.scss:12734 (body.android-15) (plan Task 8).
import { frameFor } from '../src/app/frame';

const insets = { top: 24, bottom: 48 };

test('Android below 15: a status-bar band in the client colour, content below it', () => {
  const f = frameFor('android', 34, insets, false);
  expect(f.statusBand).toEqual({ height: 24, color: '#002d25' });
  expect(f.navBand).toEqual({ height: 48, color: '#000000' });
  expect(f.frame).toEqual({ flex: 1, overflow: 'hidden' });
});

test('Android 15+: for the first 2 s nothing is added (content under the status bar, as in Ionic)', () => {
  const f = frameFor('android', 35, insets, false);
  expect(f.statusBand).toBeUndefined();
  expect(f.navBand).toBeUndefined();
  expect(f.frame).toEqual({ flex: 1, overflow: 'hidden' });
});

test('Android 15+ after 2 s: 30px black top border and 94% height (body.android-15)', () => {
  const f = frameFor('android', 36, insets, true);
  expect(f.statusBand).toBeUndefined();
  expect(f.frame).toEqual({ height: '94%', borderTopWidth: 30, borderTopColor: 'black', overflow: 'hidden' });
});

test('the 94% rule never applies below Android 15', () => {
  expect(frameFor('android', 34, insets, true).frame).toEqual({ flex: 1, overflow: 'hidden' });
});
