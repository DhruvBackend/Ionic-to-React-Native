// fontFor() reproduces how the WebView picked a Roboto file for each CSS font-weight/style
// (CSS font matching over the bundled faces: 300, 400, 400i, 500, 500i, 700) — plan Task 9.
import { fontFor } from '../src/theme/typography';

test.each([
  [400, 'Roboto-Regular'],
  ['normal', 'Roboto-Regular'],
  [300, 'Roboto-Light'],
  [100, 'Roboto-Light'], // lighter than any face → lightest
  [500, 'Roboto-Medium'],
  [600, 'Roboto-Bold'], // no 600 face: CSS picks the next heavier, 700 (used 110× in the app)
  [700, 'Roboto-Bold'],
  ['bold', 'Roboto-Bold'],
  [900, 'Roboto-Bold'],
])('Roboto weight %s → %s', (weight, file) => {
  expect(fontFor(weight as any)).toEqual({ fontFamily: file });
});

test('italic faces exist for 400 and 500', () => {
  expect(fontFor(400, { italic: true })).toEqual({ fontFamily: 'Roboto-Italic' });
  expect(fontFor(500, { italic: true })).toEqual({ fontFamily: 'Roboto-MediumItalic' });
});

test('CSS matches style before weight: bold italic uses the nearest italic face, bold synthesised', () => {
  expect(fontFor(700, { italic: true })).toEqual({ fontFamily: 'Roboto-MediumItalic', fontWeight: 'bold' });
  expect(fontFor(300, { italic: true })).toEqual({ fontFamily: 'Roboto-Italic' });
});

test('Roboto Condensed has only 400; heavier weights are synthesised bold like the browser', () => {
  expect(fontFor(400, { family: 'Roboto Condensed' })).toEqual({ fontFamily: 'RobotoCondensed-Regular' });
  expect(fontFor(600, { family: 'Roboto Condensed' })).toEqual({
    fontFamily: 'RobotoCondensed-Regular',
    fontWeight: 'bold',
  });
});

test.each(['Open Sans', 'Colfax-Regular', 'DS-Digital'])('%s was never loaded in Ionic → Roboto', family => {
  expect(fontFor(500, { family })).toEqual({ fontFamily: 'Roboto-Medium' });
});
