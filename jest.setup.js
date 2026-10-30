// AsyncStorage has no native module under Jest; use the library's own in-memory mock (v3 path).
jest.mock('@react-native-async-storage/async-storage', () => {
  const mock = require('@react-native-async-storage/async-storage/jest');
  return { __esModule: true, default: mock.default, createAsyncStorage: mock.createAsyncStorage };
});
