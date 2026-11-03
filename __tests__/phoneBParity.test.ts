// Phone-pass parity fixes (batch B): values asserted against the Ionic CSS they were measured from.
import { StyleSheet } from 'react-native';
import { iframeHtml } from '../src/components/WebEmbed';
import { GAP_LETTER_SPACING } from '../src/screens/GiftDetail';
import { styles as coupan } from '../src/screens/CoupanCode/styles';
import { styles as point } from '../src/screens/PointLocation/styles';
import { styles as scan } from '../src/screens/ScanPoint/styles';
import { styles as transaction } from '../src/screens/Transaction/styles';
import { normalLineHeight } from '../src/theme/ionicMdOverlays';

test('ScanPoint: item mb 10 + button margin 4 collapse to 10 -> item keeps 6 before the Add To list button', () => {
  expect(scan.csItemBeforeButton.marginBottom + 4).toBe(10);
  expect(scan.csItem.marginBottom).toBe(10); // the other cs-items are unchanged
});

test('CoupanCode: UA 2px layout border + 16 padding = text at 18; drawn border is 1px so padding is 17', () => {
  const s = StyleSheet.flatten(coupan.input)!;
  expect(s.paddingHorizontal).toBe(17);
  expect(s.borderWidth).toBe(1);
});

test('PointLocation: `.h35 { height: 35px !important }` beats the 45px of .loction-btn', () => {
  expect(point.locationButton.height).toBe(35);
});

test('PointLocation: the map is loaded the Ionic way, inside an iframe of an HTML page', () => {
  const html = iframeHtml('https://maps.google.com/maps?q=1,2&output=embed');
  expect(html).toContain('<iframe src="https://maps.google.com/maps?q=1,2&amp;output=embed"');
  expect(html).toContain('frameborder="0"');
  expect(html).toContain('width="100%" height="100%"');
});

test('Transaction: item-inner padding is explicit on every edge (the kit sets paddingRight: edges beat the shorthand)', () => {
  expect(transaction.itemInner).toEqual({ paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 });
});

test('Transaction: the reject reason sits on the strut baseline (16px strut, 11px span)', () => {
  expect(transaction.reasonStrut.height).toBe(normalLineHeight(16));
  expect(transaction.reasonSpan.marginTop).toBe(Math.round((16 * 1900) / 2048) - Math.round((11 * 1900) / 2048));
});

test('GiftDetail: the 5px margin-left is a 12px space (0.2476 em) plus letter spacing, summing to 5', () => {
  expect(12 * 0.2476 + GAP_LETTER_SPACING).toBeCloseTo(5, 5);
  expect(GAP_LETTER_SPACING).toBeCloseTo(2.03, 2);
});
