// Client-specific values (colours, brand names, URLs) must come from src/config/client.ts or
// src/theme, never be typed into screens or components: one codebase serves every client app.
const HEX = '/^#[0-9a-fA-F]{3,8}$/';
const BRAND = '/(Topsan|Topbath|Agmeco|Gravity)/';
const URL = '/^https?:\\/\\//';
const msg = what => `${what} belongs in clients/<id>/client.json (use client or theme), not in screens/components.`;

const noClientStrings = [
  { selector: `Literal[value=${HEX}]`, message: msg('Hex colour') },
  { selector: `Literal[value=${BRAND}]`, message: msg('Brand name') },
  { selector: `TemplateElement[value.raw=${BRAND}]`, message: msg('Brand name') },
  { selector: `JSXText[value=${BRAND}]`, message: msg('Brand name') },
  { selector: `Literal[value=${URL}]`, message: msg('URL') },
  { selector: `TemplateElement[value.raw=${URL}]`, message: msg('URL') },
];

module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      // test-fixtures/lint holds a file that breaks this rule on purpose (see __tests__/theme-i18n.test.ts).
      files: ['src/screens/**', 'src/components/**', 'test-fixtures/lint/**'],
      rules: { 'no-restricted-syntax': ['error', ...noClientStrings] },
    },
  ],
};
