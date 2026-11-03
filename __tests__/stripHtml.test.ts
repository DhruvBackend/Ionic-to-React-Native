// Ionic 3.9.5 writes alert title/subTitle/message and loading content through [innerHTML] (alert-component.js,
// loading-component.js), so the browser's white-space: normal applies: runs of spaces/newlines collapse to one space and
// the edges of the block drop it. Pointtranfer review 2026-11-03: "Please  Enter Transfer Amount" shows one space.
import { stripHtml } from '../src/components/ionic/html';

test('collapses runs of white space like HTML', () => {
  expect(stripHtml('You are account  not verified')).toBe('You are account not verified');
  expect(stripHtml('a \n\t b')).toBe('a b');
});

test('drops white space at the block edges', () => {
  expect(stripHtml('  Please Enter the coupon code ')).toBe('Please Enter the coupon code');
  expect(stripHtml(' Already Redeemed!')).toBe('Already Redeemed!');
});

test('<br> is a line break without the spaces around it', () => {
  expect(stripHtml('line one <br> line two')).toBe('line one\nline two');
  expect(stripHtml('a<br/>b')).toBe('a\nb');
});

test('&nbsp; is a non-breaking space that does not collapse', () => {
  expect(stripHtml('a&nbsp; b')).toBe('a  b');
  expect(stripHtml('a&nbsp;&nbsp;b')).toBe('a  b');
});

test('tags are dropped and entities decoded', () => {
  expect(stripHtml('<b>Hi</b> &amp; &lt;bye&gt;')).toBe('Hi & <bye>');
});
