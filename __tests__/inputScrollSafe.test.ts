// Phone check 2026-11-02: a swipe that started on a Registration text box (csInput, font 13) never scrolled the page.
// ReactEditText.kt:316-337 keeps the touch (requestDisallowInterceptTouchEvent) whenever the EditText can scroll
// its own content. Android lays the line out in device px with ascent rounded up and descent rounded up
// (FontMetricsInt), so at 13dp / 3x the line is 47px while the box left 45px: the box "could scroll" by 2px.
import { androidLineHeight, normalLineHeight } from '../src/theme/ionicMdOverlays';

describe('androidLineHeight (text area that never overflows, so the EditText never keeps a scroll gesture)', () => {
  test('font 13 at 3x: 47px, i.e. more than the 15dp (45px) CSS-normal estimate', () => {
    expect(normalLineHeight(13)).toBe(15);
    expect(androidLineHeight(13, 3) * 3).toBeGreaterThanOrEqual(47);
  });
  test.each([12, 13, 14, 15, 16, 17, 18, 20, 24])('font %d: never below the CSS estimate nor the device-px line', fs => {
    for (const ratio of [2, 2.625, 3, 3.5]) {
      const h = androidLineHeight(fs, ratio);
      expect(h).toBeGreaterThanOrEqual(normalLineHeight(fs));
      expect(Math.round(h * ratio)).toBeGreaterThanOrEqual(Math.ceil((fs * ratio * 1900) / 2048) + Math.ceil((fs * ratio * 500) / 2048));
    }
  });
  test('font 16 at 3x stays exactly the CSS estimate (no layout change where nothing overflowed)', () => {
    expect(androidLineHeight(16, 3)).toBe(normalLineHeight(16));
  });
});
