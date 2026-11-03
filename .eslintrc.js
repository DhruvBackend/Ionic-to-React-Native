// Client-specific values (colours, brand names, URLs) must come from src/config/client.ts or
// src/theme, never be typed into screens or components: one codebase serves every client app.
const HEX = '/^#[0-9a-fA-F]{3,8}$/';
const BRAND = '/(Topsan|Topbath|Agmeco|Gravity)/';
const URL = '/^https?:\\/\\//';
// contact details: tel:/mailto: links, e-mail addresses, Indian 10-digit mobile numbers (with or without +91)
const CONTACT = '/(^(tel|mailto):|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}|[6-9][0-9]{9})/';
// in template strings a bare `tel:` / `mailto:` prefix before ${client.contact...} is fine; typed-in values are not
const CONTACT_VALUE = '/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+[.][A-Za-z]{2,}|[6-9][0-9]{9})/';
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

// Contact details are client data too, but tests legitimately use fake numbers, so this list skips *.test.* files.
const noContact = [
  { selector: `Literal[value=${CONTACT}]`, message: msg('Contact detail (phone/e-mail/tel:/mailto:)') },
  { selector: `TemplateElement[value.raw=${CONTACT_VALUE}]`, message: msg('Contact detail (phone/e-mail/tel:/mailto:)') },
  { selector: `JSXText[value=${CONTACT}]`, message: msg('Contact detail (phone/e-mail/tel:/mailto:)') },
];
const TESTS = ['**/*.test.ts', '**/*.test.tsx'];

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
    {
      // non-test component files additionally ban typed-in contact details (AboutusModal had tel:/mailto: literals)
      files: ['src/components/**', 'test-fixtures/lint/contact-violation.tsx'],
      excludedFiles: TESTS,
      rules: { 'no-restricted-syntax': ['error', ...noClientStrings, ...noContact] },
    },
    {
      files: ['src/screens/**'],
      excludedFiles: TESTS,
      rules: { 'no-restricted-syntax': ['error', ...noClientStrings, ...noNativeStandIns, ...noContact] },
    },
    {
      // Phase 2 kit pass: text goes through the kit Text (src/components/ionic/IonText.tsx), whose default
      // textBreakStrategy "simple" wraps lines like the browser did. test-fixtures/lint/text-violation.tsx breaks it on purpose.
      files: ['src/screens/**', 'src/components/**', 'test-fixtures/lint/text-violation.tsx'],
      excludedFiles: [...TESTS, 'src/components/ionic/IonText.tsx'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'react-native',
                importNames: ['Text'],
                message: "Import Text from src/components/ionic/IonText (browser-like line breaking), not from react-native.",
              },
            ],
          },
        ],
      },
    },
  ],
};
