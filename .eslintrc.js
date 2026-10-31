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

// Plan Task 9 step 3: screens must use the Ionic replicas (src/ui/overlays, IonDatetime, IonIcon), never the native stand-ins.
const screenMsg = what => `${what} is not allowed in src/screens: use the Ionic replica (showAlert/showToast from src/ui/overlays, IonDatetime, IonIcon).`;
const noNativeStandIns = [
  { selector: "CallExpression[callee.object.name='Alert'][callee.property.name='alert']", message: screenMsg('Alert.alert') },
  { selector: "ImportDeclaration[source.value='react-native'] > ImportSpecifier[imported.name='Alert']", message: screenMsg('react-native Alert') },
  { selector: "ImportDeclaration[source.value='react-native'] > ImportSpecifier[imported.name='ToastAndroid']", message: screenMsg('ToastAndroid') },
  { selector: "MemberExpression[object.name='ToastAndroid']", message: screenMsg('ToastAndroid') },
  { selector: "ImportDeclaration[source.value=/^@react-native-community.datetimepicker/]", message: screenMsg('@react-native-community/datetimepicker') },
  { selector: "ImportDeclaration[source.value=/^react-native-vector-icons/]", message: screenMsg('react-native-vector-icons') },
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
    {
      // later override: replaces the rule above for screens, so it repeats noClientStrings.
      // test-fixtures/lint/screens-violation.tsx breaks it on purpose (see __tests__/theme-i18n.test.ts).
      files: ['src/screens/**', 'test-fixtures/lint/screens-violation.tsx'],
      rules: { 'no-restricted-syntax': ['error', ...noClientStrings, ...noNativeStandIns] },
    },
  ],
};
