import { cssCapitalize } from '../src/ui/cssText';

test('cssCapitalize: first letter of each word upper case, rest unchanged', () => {
  expect(cssCapitalize('today')).toBe('Today');
  expect(cssCapitalize('last 7 days')).toBe('Last 7 Days');
  expect(cssCapitalize('wALLET balance')).toBe('WALLET Balance');
  expect(cssCapitalize('(new) e-mail')).toBe('(New) E-mail');
  expect(cssCapitalize('आज')).toBe('आज');
});
