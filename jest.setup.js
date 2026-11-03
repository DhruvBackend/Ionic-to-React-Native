/* eslint-env jest */
// AsyncStorage has no native module under Jest; use the library's own in-memory mock (v3 path).
jest.mock('@react-native-async-storage/async-storage', () => {
  const mock = require('@react-native-async-storage/async-storage/jest');
  return { __esModule: true, default: mock.default, createAsyncStorage: mock.createAsyncStorage };
});

// SafeAreaProvider renders nothing until the native side reports insets; the library's mock supplies them.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// Tests never touch a server: force MOCK regardless of the app's default (DEV).
// A test file may override this with its own jest.mock('../src/config/env', ...).
jest.mock('./src/config/env', () => ({ ...jest.requireActual('./src/config/env'), MODE: 'MOCK' }));

// react-native-webview has no native module under Jest (plan Task 9 part 5B, WebEmbed): a plain View stands in.
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { __esModule: true, WebView: props => React.createElement(View, props) };
});

// Native wrappers (src/native): MOCK mode never calls these libraries, but importing them needs no native module.
jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: { getCurrentPosition: jest.fn(), setRNConfiguration: jest.fn() },
}));
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock.js'));

// Screen tests model a user who logged in during this session (MobileLogin/Otp set the language). The app itself starts
// without a language (src/i18n 'cimode', the Ionic cold-start quirk); __tests__/i18nColdStart.test.ts covers that.
require('./src/i18n').default.changeLanguage('en');
