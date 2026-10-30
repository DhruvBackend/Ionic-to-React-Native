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
